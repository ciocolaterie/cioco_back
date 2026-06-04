import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Promotion } from '../models/Promotion.js';
import { Settings } from '../models/Settings.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { sendOrderNotification } from '../services/notifications.service.js';

export const listOrders = asyncHandler(async (req, res) => {
  const { status, limit } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  let q = Order.find(filter).sort({ createdAt: -1 }).populate('items.product', 'name images');
  if (limit) q = q.limit(Number(limit));
  const orders = await q.exec();
  res.json(orders);
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product');
  if (!order) return res.status(404).json({ error: 'Comandă negăsită' });
  if (req.user && req.user.role !== 'admin' && order.user && String(order.user) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Acces interzis' });
  }
  res.json(order);
});

export const createOrder = asyncHandler(async (req, res) => {
  const { items, customer, method, address, pickupTime, zone, note, promoCode } = req.body;
  if (!items?.length || !customer?.name || !customer?.phone || !customer?.email) {
    return res.status(400).json({ error: 'Date lipsă' });
  }

  // Reverificăm prețurile pe server (nu avem încredere în client)
  const ids = items.map(i => i.product);
  const products = await Product.find({ _id: { $in: ids } });
  const dict = Object.fromEntries(products.map(p => [String(p._id), p]));

  const safeItems = items.map(i => {
    const p = dict[i.product];
    if (!p) throw new Error(`Produs invalid: ${i.product}`);
    if (p.stock < i.qty) throw new Error(`Stoc insuficient pentru ${p.name}`);
    return { product: p._id, name: p.name, price: p.price, qty: i.qty };
  });

  const subtotal = safeItems.reduce((s, i) => s + i.price * i.qty, 0);
  const settings = await Settings.findOne() || {};
  const zoneRecord = (settings.zones || []).find(z => z.id === zone);
  const deliveryFee = method === 'livrare' ? (zoneRecord?.price || 0) : 0;

  // Aplică codul promoțional dacă există
  let discount = 0;
  let appliedPromoCode = null;
  if (promoCode) {
    const promo = await Promotion.findOne({ code: promoCode.toUpperCase(), active: true });
    if (promo && (!promo.expiresAt || promo.expiresAt > new Date()) && (!promo.maxUses || promo.uses < promo.maxUses)) {
      discount = promo.type === 'percent'
        ? Math.round((subtotal * promo.value) / 100 * 100) / 100
        : Math.min(promo.value, subtotal);
      appliedPromoCode = promo.code;
      await Promotion.findByIdAndUpdate(promo._id, { $inc: { uses: 1 } });
    }
  }

  const total = subtotal + deliveryFee - discount;

  const order = await Order.create({
    user: req.user?._id,
    customer,
    items: safeItems,
    subtotal,
    deliveryFee,
    discount,
    total,
    method,
    address: method === 'livrare' ? address : (settings.storeAddress ? `Ridicare: ${settings.storeAddress}` : 'Ridicare din magazin'),
    pickupTime,
    zone,
    zoneName: zoneRecord?.name,
    note,
    promoCode: appliedPromoCode,
    statusHistory: [{ status: 'noua' }],
  });

  // Decrementează stoc
  for (const i of safeItems) {
    await Product.findByIdAndUpdate(i.product, { $inc: { stock: -i.qty } });
  }

  // Notificare client (email + push, async, nu blocăm răspunsul)
  const storeInfo = { storeName: settings.storeName, storeAddress: settings.storeAddress, storeEmail: settings.storeEmail };
  sendOrderNotification(order, 'created', storeInfo).catch(() => {});

  res.status(201).json(order);
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Comandă negăsită' });

  // Only the owner or admin can cancel
  const isOwner = req.user && String(order.user) === String(req.user._id);
  const isAdmin = req.user?.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Acces interzis' });

  // Can only cancel orders that haven't been started
  if (!['noua'].includes(order.status)) {
    return res.status(400).json({ error: 'Comanda nu mai poate fi anulată în acest stadiu' });
  }

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
  }

  order.status = 'anulata';
  order.statusHistory.push({ status: 'anulata', by: req.user?._id });
  await order.save();
  const s = await Settings.findOne() || {};
  sendOrderNotification(order, 'status_changed', { storeName: s.storeName, storeAddress: s.storeAddress, storeEmail: s.storeEmail }).catch(() => {});
  res.json(order);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ['noua', 'in_pregatire', 'gata', 'livrata', 'anulata'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Status invalid' });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Comandă negăsită' });

  if (status === 'anulata' && order.status !== 'anulata') {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
    }
  }
  if (['livrata', 'anulata'].includes(status)) {
    order.urgent = false;
  }

  order.status = status;
  order.statusHistory.push({ status, by: req.user._id });
  await order.save();
  const s2 = await Settings.findOne() || {};
  sendOrderNotification(order, 'status_changed', { storeName: s2.storeName, storeAddress: s2.storeAddress, storeEmail: s2.storeEmail }).catch(() => {});
  res.json(order);
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  const valid = ['noua', 'in_pregatire', 'gata', 'livrata', 'anulata'];
  if (!valid.includes(status) || !Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: 'Date invalide' });
  }
  const orders = await Order.find({ _id: { $in: ids } });
  for (const order of orders) {
    if (status === 'anulata' && order.status !== 'anulata') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
      }
    }
    if (['livrata', 'anulata'].includes(status)) order.urgent = false;
    order.status = status;
    order.statusHistory.push({ status, by: req.user._id });
    await order.save();
  }
  res.json({ updated: orders.length });
});

export const toggleUrgent = asyncHandler(async (req, res) => {
  const { urgent, urgentNote } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { urgent: !!urgent, urgentNote: urgentNote || '' },
    { new: true }
  );
  if (!order) return res.status(404).json({ error: 'Comandă negăsită' });
  res.json(order);
});

export const updateInternalNote = asyncHandler(async (req, res) => {
  const { internalNote } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { internalNote: internalNote || '' },
    { new: true }
  );
  if (!order) return res.status(404).json({ error: 'Comandă negăsită' });
  res.json(order);
});

export const createOrderAdmin = asyncHandler(async (req, res) => {
  const { items, customer, method, address, pickupTime, zone, note, source, deliveryDate } = req.body;
  if (!items?.length || !customer?.name || !customer?.phone) {
    return res.status(400).json({ error: 'Date lipsă' });
  }

  const ids = items.map(i => i.product);
  const products = await Product.find({ _id: { $in: ids } });
  const dict = Object.fromEntries(products.map(p => [String(p._id), p]));

  const safeItems = items.map(i => {
    const p = dict[i.product];
    if (!p) throw new Error(`Produs invalid: ${i.product}`);
    return { product: p._id, name: p.name, price: i.price ?? p.price, qty: i.qty };
  });

  const subtotal = safeItems.reduce((s, i) => s + i.price * i.qty, 0);
  const settings = await Settings.findOne() || {};
  const zoneRecord = (settings.zones || []).find(z => z.id === zone);
  const deliveryFee = method === 'livrare' ? (zoneRecord?.price || 0) : 0;
  const total = subtotal + deliveryFee;

  const order = await Order.create({
    user: req.user._id,
    customer: { name: customer.name, phone: customer.phone, email: customer.email || 'admin@intern' },
    items: safeItems,
    subtotal,
    deliveryFee,
    total,
    method,
    address: method === 'livrare' ? address : (settings.storeAddress || 'Ridicare'),
    pickupTime,
    zone,
    zoneName: zoneRecord?.name,
    note,
    source: source || 'online',
    deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
    status: 'in_pregatire',
    statusHistory: [{ status: 'in_pregatire', by: req.user._id }],
  });

  for (const i of safeItems) {
    await Product.findByIdAndUpdate(i.product, { $inc: { stock: -i.qty } });
  }

  if (customer.email && customer.email !== 'admin@intern') {
    const storeInfo = { storeName: settings.storeName, storeAddress: settings.storeAddress, storeEmail: settings.storeEmail };
    sendOrderNotification(order, 'created', storeInfo).catch(() => {});
  }

  res.status(201).json(order);
});

import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Settings } from '../models/Settings.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const buildList = async (loyaltyOrders = 5, loyaltySpent = 200) => {
  const customers = await User.find({ role: 'customer' }).limit(500);
  const stats = await Order.aggregate([
    { $match: { user: { $in: customers.map(c => c._id) } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' }, lastOrder: { $max: '$createdAt' } } },
  ]);
  const dict = Object.fromEntries(stats.map(s => [String(s._id), s]));
  return customers.map(c => {
    const orders = dict[String(c._id)]?.orders || 0;
    const spent  = dict[String(c._id)]?.spent  || 0;
    return {
      _id: c._id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      customerNote: c.customerNote || '',
      orders,
      spent,
      lastOrder: dict[String(c._id)]?.lastOrder || null,
      createdAt: c.createdAt,
      loyal: orders >= loyaltyOrders || spent >= loyaltySpent,
    };
  });
};

export const listCustomers = asyncHandler(async (req, res) => {
  const s = await Settings.findOne().lean();
  res.json(await buildList(s?.loyaltyOrders ?? 5, s?.loyaltySpent ?? 200));
});

export const lookupByPhone = asyncHandler(async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Telefon lipsă' });
  const user = await User.findOne({ phone: { $regex: phone.replace(/\s/g, '').slice(-9), $options: 'i' } }).lean();
  if (!user) return res.json(null);
  const lastOrder = await Order.findOne({ user: user._id }).sort({ createdAt: -1 }).lean();
  res.json({ user, lastOrder });
});

export const updateCustomerNote = asyncHandler(async (req, res) => {
  const { note } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { customerNote: note || '' },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: 'Client negăsit' });
  res.json({ ok: true });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user || user.role !== 'customer') return res.status(404).json({ error: 'Client negăsit' });

  const s = await Settings.findOne().lean();
  const loyaltyOrders = s?.loyaltyOrders ?? 5;
  const loyaltySpent  = s?.loyaltySpent  ?? 200;

  const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 }).lean();
  const activeOrders = orders.filter(o => o.status !== 'anulata');
  const totalSpent   = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const loyal        = orders.length >= loyaltyOrders || totalSpent >= loyaltySpent;

  delete user.password;
  delete user.resetToken;
  delete user.resetTokenExpiry;

  res.json({ ...user, orders, totalOrders: orders.length, totalSpent, loyal });
});

export const exportCustomers = asyncHandler(async (req, res) => {
  const list = await buildList();
  const rows = [
    ['Nume', 'Email', 'Telefon', 'Comenzi', 'Total cheltuit (RON)', 'Ultima comandă', 'Înregistrat'],
    ...list.map(c => [
      c.name,
      c.email,
      c.phone || '',
      c.orders,
      c.spent.toFixed(2),
      c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('ro-RO') : '',
      c.createdAt ? new Date(c.createdAt).toLocaleDateString('ro-RO') : '',
    ]),
  ];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="clienti.csv"');
  res.send('﻿' + csv);
});

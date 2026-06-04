import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// Admin-only: returns ALL products regardless of active flag
export const listAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).limit(500).lean();
  res.json(products);
});

const periodRange = (period) => {
  const now = new Date();
  let start, prevStart, prevEnd;
  if (period === 'today') {
    start = new Date(now); start.setHours(0, 0, 0, 0);
    prevEnd = new Date(start);
    prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 1);
  } else if (period === 'week') {
    start = new Date(now); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
    prevEnd = new Date(start);
    prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);
  } else if (period === 'month') {
    start = new Date(now); start.setDate(start.getDate() - 30); start.setHours(0, 0, 0, 0);
    prevEnd = new Date(start);
    prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 30);
  } else {
    start = new Date(0); prevStart = new Date(0); prevEnd = new Date(0);
  }
  return { start, prevStart, prevEnd };
};

const aggOrders = (match) =>
  Order.aggregate([
    { $match: { ...match, status: { $ne: 'anulata' } } },
    { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 }, avg: { $avg: '$total' } } },
  ]).then(([r]) => r || { revenue: 0, orders: 0, avg: 0 });

export const stats = asyncHandler(async (req, res) => {
  const period = req.query.period || 'today';
  const { start, prevStart, prevEnd } = periodRange(period);

  const [curr, prev, newCustomers, prevCustomers, pendingCount] = await Promise.all([
    aggOrders({ createdAt: { $gte: start } }),
    aggOrders({ createdAt: { $gte: prevStart, $lt: prevEnd } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: start } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: prevStart, $lt: prevEnd } }),
    Order.countDocuments({ status: { $in: ['noua', 'in_pregatire'] } }),
  ]);

  res.json({
    revenue: curr.revenue,
    orders: curr.orders,
    avgOrder: curr.avg,
    newCustomers,
    pendingCount,
    prev: {
      revenue: prev.revenue,
      orders: prev.orders,
      avgOrder: prev.avg,
      newCustomers: prevCustomers,
    },
  });
});

export const topProducts = asyncHandler(async (req, res) => {
  const { start: since } = periodRange(req.query.period || 'month');
  const top = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $ne: 'anulata' } } },
    { $unwind: '$items' },
    { $group: {
      _id: '$items.product',
      name: { $first: '$items.name' },
      sales: { $sum: '$items.qty' },
      revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
    }},
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);
  res.json(top);
});

export const weekChart = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0,0,0,0);
  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: start }, status: { $ne: 'anulata' } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      revenue: { $sum: '$total' },
      orders: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]);
  res.json(data);
});

export const sourceStats = asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 3;
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $ne: 'anulata' } } },
    { $group: {
      _id: { $ifNull: ['$source', 'online'] },
      orders: { $sum: 1 },
      revenue: { $sum: '$total' },
      avg: { $avg: '$total' },
    }},
    { $sort: { orders: -1 } },
  ]);
  res.json(data);
});

export const productionSummary = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    status: { $in: ['noua', 'in_pregatire'] },
  }).lean();

  const summary = {};
  for (const o of orders) {
    for (const item of o.items) {
      const key = item.name;
      if (!summary[key]) summary[key] = { name: key, qty: 0, orders: 0 };
      summary[key].qty += item.qty;
      summary[key].orders += 1;
    }
  }
  res.json(Object.values(summary).sort((a, b) => b.qty - a.qty));
});

export const todayDeliveries = asyncHandler(async (req, res) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  const orders = await Order.find({
    status: { $in: ['noua', 'in_pregatire', 'gata'] },
    $or: [
      { deliveryDate: { $gte: start, $lte: end } },
      { createdAt: { $gte: start, $lte: end } },
    ],
  }).sort({ urgent: -1, createdAt: 1 }).lean();
  res.json(orders);
});

export const urgentOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    urgent: true,
    status: { $nin: ['livrata', 'anulata'] },
  }).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

export const calendarOrders = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const y = parseInt(year) || new Date().getFullYear();
  const m = parseInt(month) || new Date().getMonth() + 1;
  const start = new Date(y, m - 1, 1);
  const end   = new Date(y, m, 1);

  const orders = await Order.find({
    status: { $nin: ['anulata'] },
    $or: [
      { deliveryDate: { $gte: start, $lt: end } },
      { createdAt:    { $gte: start, $lt: end } },
    ],
  }).sort({ urgent: -1, createdAt: 1 }).lean();
  res.json(orders);
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const now   = new Date();
  const since = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [monthlyRaw, revenuePerCustomer, topProductArr, topSourceArr, productsArr] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $ne: 'anulata' }, createdAt: { $gte: since } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders:  { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'anulata' } } },
      { $group: { _id: '$user', total: { $sum: '$total' } } },
      { $sort: { total: -1 } },
      { $limit: 6 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
      { $project: { name: { $ifNull: ['$u.name', 'Necunoscut'] }, total: 1, _id: 0 } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'anulata' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', qty: { $sum: '$items.qty' } } },
      { $sort: { qty: -1 } },
      { $limit: 1 },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'anulata' }, source: { $nin: [null, ''] } } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'anulata' } } },
      { $unwind: '$items' },
      { $group: {
        _id:      '$items.name',
        qty:      { $sum: '$items.qty' },
        revenue:  { $sum: { $multiply: ['$items.price', '$items.qty'] } },
        orders:   { $sum: 1 },
        avgPrice: { $avg: '$items.price' },
      }},
      { $sort: { revenue: -1 } },
    ]),
  ]);

  res.json({
    monthlyRevenue:      monthlyRaw,
    revenuePerCustomer,
    products:     productsArr.map(p => ({ name: p._id, qty: p.qty, revenue: p.revenue, orders: p.orders, avgPrice: Math.round(p.avgPrice * 100) / 100 })),
    topCustomer:  revenuePerCustomer[0] || null,
    topProduct:   topProductArr[0]  ? { name: topProductArr[0]._id,  qty:   topProductArr[0].qty   } : null,
    topSource:    topSourceArr[0]   ? { source: topSourceArr[0]._id, count: topSourceArr[0].count   } : null,
  });
});

export const exportOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).sort({ createdAt: -1 });
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['Nr. comandă', 'Client', 'Email', 'Telefon', 'Subtotal', 'Livrare', 'Discount', 'Total', 'Metodă', 'Zonă', 'Status', 'Data'],
    ...orders.map(o => [
      o.orderNumber, o.customer.name, o.customer.email, o.customer.phone,
      o.subtotal, o.deliveryFee, o.discount, o.total,
      o.method, o.zoneName || o.zone || '',
      o.status, o.createdAt.toISOString(),
    ]),
  ];
  const csv = '﻿' + rows.map(r => r.map(q).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="comenzi.csv"');
  res.send(csv);
});

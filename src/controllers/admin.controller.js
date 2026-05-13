import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// Admin-only: returns ALL products regardless of active flag
export const listAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
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

  const [curr, prev, newCustomers, prevCustomers] = await Promise.all([
    aggOrders({ createdAt: { $gte: start } }),
    aggOrders({ createdAt: { $gte: prevStart, $lt: prevEnd } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: start } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: prevStart, $lt: prevEnd } }),
  ]);

  res.json({
    revenue: curr.revenue,
    orders: curr.orders,
    avgOrder: curr.avg,
    newCustomers,
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

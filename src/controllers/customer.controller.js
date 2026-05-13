import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const buildList = async () => {
  const customers = await User.find({ role: 'customer' });
  const stats = await Order.aggregate([
    { $match: { user: { $in: customers.map(c => c._id) } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' }, lastOrder: { $max: '$createdAt' } } },
  ]);
  const dict = Object.fromEntries(stats.map(s => [String(s._id), s]));
  return customers.map(c => ({
    _id: c._id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    orders: dict[String(c._id)]?.orders || 0,
    spent: dict[String(c._id)]?.spent || 0,
    lastOrder: dict[String(c._id)]?.lastOrder || null,
    createdAt: c.createdAt,
  }));
};

export const listCustomers = asyncHandler(async (req, res) => {
  res.json(await buildList());
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

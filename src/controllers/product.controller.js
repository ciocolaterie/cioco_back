import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import StockAlert from '../models/StockAlert.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export const getProductTags = asyncHandler(async (req, res) => {
  const tags = await Product.distinct('tags', { active: true });
  res.json(tags.filter(t => t && t.trim()).sort());
});

export const listProducts = asyncHandler(async (req, res) => {
  const { category, tag, search, sort, limit, inStock, ids } = req.query;
  const filter = { active: true };
  if (ids) filter._id = { $in: ids.split(',').filter(Boolean) };
  if (category && category !== 'all') filter.category = category;
  if (tag) filter.tags = { $in: Array.isArray(tag) ? tag : [tag] };
  if (search) {
    const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(esc, 'i');
    filter.$or = [{ name: rx }, { short: rx }, { description: rx }];
  }
  if (inStock === 'true') filter.stock = { $gt: 0 };
  let q = Product.find(filter);
  if (sort === 'price-asc') q = q.sort({ price: 1 });
  else if (sort === 'price-desc') q = q.sort({ price: -1 });
  else if (sort === 'rating' || sort === 'popular') q = q.sort({ rating: -1, reviewsCount: -1 });
  else if (sort === 'newest') q = q.sort({ createdAt: -1 });
  else q = q.sort({ createdAt: -1 });
  if (limit) q = q.limit(Number(limit));
  const products = await q.exec();
  res.json(products);
});

export const getBestsellers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 3;
  const top = await Order.aggregate([
    { $match: { status: { $ne: 'anulata' } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product', sold: { $sum: '$items.qty' } } },
    { $sort: { sold: -1 } },
    { $limit: limit },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $match: { 'product.active': true } },
    { $replaceRoot: { newRoot: { $mergeObjects: ['$product', { sold: '$sold' }] } } },
  ]);
  res.json(top);
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produs negăsit' });
  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

const PRODUCT_READONLY = ['_id', '__v', 'rating', 'reviewsCount', 'createdAt', 'updatedAt'];

export const updateProduct = asyncHandler(async (req, res) => {
  const update = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => !PRODUCT_READONLY.includes(k))
  );
  const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!product) return res.status(404).json({ error: 'Produs negăsit' });
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produs negăsit' });
  res.json({ ok: true });
});

export const createStockAlert = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email obligatoriu.' });
  const product = await Product.findById(req.params.id).select('stock');
  if (!product) return res.status(404).json({ error: 'Produs negăsit.' });
  if (product.stock > 0) return res.status(400).json({ error: 'Produsul este în stoc.' });
  await StockAlert.findOneAndUpdate(
    { product: req.params.id, email },
    { product: req.params.id, email },
    { upsert: true }
  );
  res.status(201).json({ ok: true });
});

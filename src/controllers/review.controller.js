import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Settings } from '../models/Settings.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const recalcProduct = async (productId) => {
  const approved = await Review.find({ product: productId, status: 'approved' }, 'rating').lean();
  const count = approved.length;
  const avg = count ? Math.round(approved.reduce((s, r) => s + r.rating, 0) / count * 10) / 10 : 0;
  await Product.findByIdAndUpdate(productId, { rating: avg, reviewsCount: count });
};

// GET /products/:id/reviews — public, only approved
export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id, status: 'approved' })
    .sort({ createdAt: -1 })
    .select('name rating text createdAt')
    .lean();
  res.json(reviews);
});

// POST /products/:id/reviews — public (optional auth)
export const submitReview = asyncHandler(async (req, res) => {
  const { name, email, rating, text } = req.body;
  if (!name?.trim() || !email?.trim() || !rating || !text?.trim()) {
    return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
  }
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return res.status(400).json({ error: 'Rating-ul trebuie să fie între 1 și 5' });
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produs negăsit' });

  const existing = await Review.findOne({ product: req.params.id, email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'Ai trimis deja o recenzie pentru acest produs' });

  await Review.create({
    product: req.params.id,
    user: req.user?._id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    rating: r,
    text: text.trim(),
  });

  res.status(201).json({ ok: true, message: 'Recenzia ta a fost trimisă și va fi publicată după verificare. Mulțumim!' });
});

// GET /admin/reviews — paginated, optional status filter
export const listReviews = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 12 } = req.query;
  const filter = status && status !== 'all' ? { status } : {};
  const skip   = (Number(page) - 1) * Number(limit);

  const [reviews, total, counts] = await Promise.all([
    Review.find(filter)
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments(filter),
    Review.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const countMap = { pending: 0, approved: 0, rejected: 0 };
  counts.forEach(c => { countMap[c._id] = c.count; });

  res.json({
    reviews,
    counts: countMap,
    pagination: { page: Number(page), pages: Math.ceil(total / Number(limit)), total },
  });
});

// PATCH /admin/reviews/:id — approve or reject
export const moderateReview = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status invalid' });
  }
  const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate('product', 'name');
  if (!review) return res.status(404).json({ error: 'Recenzia nu există' });
  await recalcProduct(review.product._id);
  res.json(review);
});

// DELETE /admin/reviews/:id
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return res.status(404).json({ error: 'Recenzia nu există' });
  if (review.status === 'approved') await recalcProduct(review.product);
  // Remove from featured/hero if present
  const s = await Settings.findOne();
  if (s) {
    const id = review._id;
    const inFeatured = s.featuredReviews.some(fid => fid.equals(id));
    const isHero = s.heroReview?.equals(id);
    if (inFeatured || isHero) {
      if (inFeatured) s.featuredReviews = s.featuredReviews.filter(fid => !fid.equals(id));
      if (isHero) s.heroReview = null;
      await s.save();
    }
  }
  res.json({ ok: true });
});

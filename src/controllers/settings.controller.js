import { Settings } from '../models/Settings.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const getOrCreate = () => Settings.findOne().then(s => s || Settings.create({}));

export const getSettings = asyncHandler(async (req, res) => {
  let raw = await Settings.findOne().lean();
  if (!raw) raw = (await Settings.create({})).toObject();

  // Migrate: strings → objects, or objects with missing name → restore defaults
  const DEFAULT_CATS = ['Tablete','Praline','Trufe','Fructe glasate','Caramele','Cadouri','Ciocolată caldă','Bombonierie'];
  const needsMigration = raw.categories?.some(c => typeof c === 'string' || !c?.name);
  if (needsMigration) {
    const migrated = (raw.categories || []).map((c, i) => ({
      name: typeof c === 'string' ? c : (c?.name || DEFAULT_CATS[i] || `Categorie ${i + 1}`),
      image: c?.image || '',
    }));
    await Settings.updateOne({ _id: raw._id }, { $set: { categories: migrated } });
    raw.categories = migrated;
  }

  res.json(raw);
});

const SETTINGS_FIELDS = [
  'storeName', 'storePhone', 'storeEmail', 'storeAddress', 'storeLat', 'storeLng',
  'storeInstagram', 'storeFacebook',
  'categories', 'zones', 'notifications', 'schedule', 'banner',
  'storeLogo', 'storeAbout', 'loyaltyOrders', 'loyaltySpent', 'emailTemplates',
];

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreate();
  for (const key of SETTINGS_FIELDS) {
    if (key in req.body) settings[key] = req.body[key];
  }
  // Ensure categories are always objects
  if (settings.categories?.some(c => typeof c === 'string')) {
    settings.categories = settings.categories.map(c =>
      typeof c === 'string' ? { name: c, image: '' } : c
    );
  }
  await settings.save();
  res.json(settings);
});

export const getCategories = asyncHandler(async (req, res) => {
  const raw = await Settings.findOne().lean();
  const cats = (raw?.categories || [])
    .map(c => typeof c === 'string' ? { name: c, image: '' } : { name: c.name || '', image: c.image || '' })
    .filter(c => c.name);
  res.json(cats);
});

export const getPublicStats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [products, monthlyOrders] = await Promise.all([
    Product.find({ active: true }, 'rating').lean(),
    Order.countDocuments({ createdAt: { $gte: since }, status: { $ne: 'anulata' } }),
  ]);
  const rated = products.filter(p => p.rating > 0);
  const avgRating = rated.length
    ? Math.round(rated.reduce((s, p) => s + p.rating, 0) / rated.length * 10) / 10
    : null;
  res.json({ productCount: products.length, avgRating, monthlyOrders });
});

export const getFeaturedReviews = asyncHandler(async (req, res) => {
  const s = await getOrCreate();
  await s.populate([
    { path: 'featuredReviews', select: 'name rating text createdAt', populate: { path: 'product', select: 'name' } },
    { path: 'heroReview', select: 'name rating text' },
  ]);
  res.json({ featured: s.featuredReviews, heroReview: s.heroReview });
});

export const updateFeaturedReviews = asyncHandler(async (req, res) => {
  const { featuredIds, heroId } = req.body;
  const s = await getOrCreate();
  if (featuredIds !== undefined) {
    if (!Array.isArray(featuredIds) || featuredIds.length > 3)
      return res.status(400).json({ error: 'Maxim 3 recenzii pot fi afișate' });
    s.featuredReviews = featuredIds;
  }
  if ('heroId' in req.body) {
    s.heroReview = heroId || null;
  }
  await s.save();
  res.json({ ok: true });
});

export const getStoreInfo = asyncHandler(async (req, res) => {
  const s = await getOrCreate();
  res.json({
    storeName: s.storeName,
    storePhone: s.storePhone,
    storeEmail: s.storeEmail,
    storeAddress: s.storeAddress,
    storeLat: s.storeLat,
    storeLng: s.storeLng,
    storeInstagram: s.storeInstagram,
    storeFacebook: s.storeFacebook,
    schedule: s.schedule,
    zones: s.zones,
    banner: s.banner,
  });
});

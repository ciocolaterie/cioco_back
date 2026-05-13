import { Promotion } from '../models/Promotion.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export const listPromotions = asyncHandler(async (req, res) => {
  const promos = await Promotion.find().sort({ createdAt: -1 });
  res.json(promos);
});

export const createPromotion = asyncHandler(async (req, res) => {
  const { code, type, value, maxUses, expiresAt } = req.body;
  if (!code || !value) return res.status(400).json({ error: 'Cod și valoare obligatorii' });
  const promo = await Promotion.create({ code, type, value, maxUses, expiresAt });
  res.status(201).json(promo);
});

export const updatePromotion = asyncHandler(async (req, res) => {
  const promo = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!promo) return res.status(404).json({ error: 'Promoție negăsită' });
  res.json(promo);
});

export const deletePromotion = asyncHandler(async (req, res) => {
  await Promotion.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// POST /api/promotions/apply — verifică și returnează reducerea
export const applyPromotion = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Cod lipsă' });

  const promo = await Promotion.findOne({ code: code.toUpperCase(), active: true });
  if (!promo) return res.status(404).json({ error: 'Cod invalid sau inactiv' });

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Codul a expirat' });
  }
  if (promo.maxUses && promo.uses >= promo.maxUses) {
    return res.status(400).json({ error: 'Codul nu mai are utilizări disponibile' });
  }

  const discount = promo.type === 'percent'
    ? Math.round((subtotal * promo.value) / 100 * 100) / 100
    : Math.min(promo.value, subtotal);

  res.json({
    promo: { _id: promo._id, code: promo.code, type: promo.type, value: promo.value },
    discount,
  });
});

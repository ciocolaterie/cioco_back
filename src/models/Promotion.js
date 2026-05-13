import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
  value: { type: Number, required: true },
  active: { type: Boolean, default: true },
  uses: { type: Number, default: 0 },
  maxUses: { type: Number },
  expiresAt: { type: Date },
}, { timestamps: true });

export const Promotion = mongoose.model('Promotion', promotionSchema);

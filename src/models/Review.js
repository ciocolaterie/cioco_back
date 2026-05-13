import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
}, { timestamps: true });

reviewSchema.index({ product: 1, email: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);

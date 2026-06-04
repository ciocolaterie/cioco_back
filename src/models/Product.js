import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  weight: { type: String, trim: true },
  short: { type: String, trim: true, maxlength: 200 },
  description: { type: String, trim: true },
  ingredients: { type: String, trim: true },
  allergens: [{ type: String, trim: true }],
  tags: [{ type: String, trim: true }],
  images: [{ type: String }], // URL-uri Cloudinary
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  recommended: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });


export const Product = mongoose.model('Product', productSchema);

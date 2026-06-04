import mongoose from 'mongoose';

const stockAlertSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  email:   { type: String, required: true, lowercase: true, trim: true },
}, { timestamps: true });

stockAlertSchema.index({ product: 1, email: 1 }, { unique: true });

export default mongoose.model('StockAlert', stockAlertSchema);

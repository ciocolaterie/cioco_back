import mongoose from 'mongoose';
import { Counter } from './Counter.js';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  price: Number,
  qty: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional pt guest
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  items: { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  method: { type: String, enum: ['ridicare', 'livrare'], required: true },
  address: { type: String },
  pickupTime: { type: String },
  zone: { type: String },
  zoneName: { type: String },
  note: { type: String },
  promoCode: { type: String },
  discount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['noua', 'in_pregatire', 'gata', 'livrata', 'anulata'],
    default: 'noua',
  },
  paymentMethod: { type: String, default: 'cash' },
  statusHistory: [{
    status: String,
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
}, { timestamps: true });

orderSchema.pre('validate', async function (next) {
  if (!this.orderNumber) {
    const counter = await Counter.findByIdAndUpdate(
      'orders',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.orderNumber = `#${3143 + counter.seq}`;
  }
  next();
});

export const Order = mongoose.model('Order', orderSchema);

export async function syncOrderCounter() {
  const last = await Order.findOne({}, 'orderNumber').sort({ createdAt: -1 }).lean();
  if (!last?.orderNumber) return;
  const num = parseInt(last.orderNumber.replace('#', ''), 10);
  if (!num) return;
  const seq = num - 3143;
  const existing = await Counter.findById('orders').lean();
  if (!existing || existing.seq < seq) {
    await Counter.findByIdAndUpdate('orders', { $set: { seq } }, { upsert: true });
    console.log(`[counter] orderNumber sync: seq set to ${seq} (#${num})`);
  }
}

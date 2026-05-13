import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Ciocolaterie' },
  storePhone: { type: String, default: '+40 722 000 000' },
  storeEmail: { type: String, default: 'salut@ciocolaterie.ro' },
  storeAddress: { type: String, default: '' },
  storeLat: { type: Number, default: null },
  storeLng: { type: Number, default: null },
  categories: {
    type: [String],
    default: ['Tablete', 'Praline', 'Trufe', 'Fructe glasate', 'Caramele', 'Cadouri', 'Ciocolată caldă', 'Bombonierie'],
  },
  zones: {
    type: [{
      id: String,
      name: String,
      price: Number,
    }],
    default: [],
  },
  notifications: {
    type: Object,
    default: {
      emailOrders: true,
      pushStatus: true,
      smsConfirm: false,
      emailRecap: true,
    },
  },
  schedule: {
    type: [{
      day: String,
      hours: String,
      closed: Boolean,
    }],
    default: [
      { day: 'Luni', hours: '10:00 — 20:00', closed: false },
      { day: 'Marți', hours: '10:00 — 20:00', closed: false },
      { day: 'Miercuri', hours: '10:00 — 20:00', closed: false },
      { day: 'Joi', hours: '10:00 — 20:00', closed: false },
      { day: 'Vineri', hours: '10:00 — 20:00', closed: false },
      { day: 'Sâmbătă', hours: '10:00 — 20:00', closed: false },
      { day: 'Duminică', hours: 'Închis', closed: true },
    ],
  },
  featuredReviews: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    default: [],
  },
  heroReview: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null },
}, { timestamps: true });

export const Settings = mongoose.model('Settings', settingsSchema);

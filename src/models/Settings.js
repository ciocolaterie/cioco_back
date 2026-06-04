import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Ciocolaterie' },
  storePhone: { type: String, default: '+40 722 000 000' },
  storeEmail: { type: String, default: 'salut@ciocolaterie.ro' },
  storeAddress: { type: String, default: '' },
  storeLat: { type: Number, default: null },
  storeLng: { type: Number, default: null },
  storeInstagram: { type: String, default: '' },
  storeFacebook: { type: String, default: '' },
  categories: {
    type: [{ name: String, image: { type: String, default: '' } }],
    default: [
      { name: 'Tablete', image: '' }, { name: 'Praline', image: '' }, { name: 'Trufe', image: '' },
      { name: 'Fructe glasate', image: '' }, { name: 'Caramele', image: '' },
      { name: 'Cadouri', image: '' }, { name: 'Ciocolată caldă', image: '' }, { name: 'Bombonierie', image: '' },
    ],
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
  banner: {
    type: {
      active: { type: Boolean, default: false },
      text:   { type: String,  default: '' },
      color:  { type: String,  default: 'accent', enum: ['accent', 'dark', 'green', 'red'] },
    },
    default: { active: false, text: '', color: 'accent' },
  },
  featuredReviews: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    default: [],
  },
  heroReview: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null },
  storeLogo:  { type: String, default: '' },
  storeAbout: { type: String, default: '' },
  loyaltyOrders: { type: Number, default: 5 },
  loyaltySpent:  { type: Number, default: 200 },
  emailTemplates: {
    type: {
      noua:         { subject: String, body: String, auto: Boolean },
      in_pregatire: { subject: String, body: String, auto: Boolean },
      gata:         { subject: String, body: String, auto: Boolean },
      livrata:      { subject: String, body: String, auto: Boolean },
      anulata:      { subject: String, body: String, auto: Boolean },
    },
    default: {
      noua:         { subject: 'Comanda ta a fost primită 🍫', body: '', auto: true },
      in_pregatire: { subject: 'Comanda ta este în pregătire 👨‍🍳', body: '', auto: false },
      gata:         { subject: 'Comanda ta este gata! ✅', body: '', auto: true },
      livrata:      { subject: 'Comanda a fost livrată 🎉', body: '', auto: false },
      anulata:      { subject: 'Comandă anulată', body: '', auto: false },
    },
  },
}, { timestamps: true });

export const Settings = mongoose.model('Settings', settingsSchema);

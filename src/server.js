import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { seedAdmin } from './config/seedAdmin.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import customerRoutes from './routes/customer.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import contactRoutes from './routes/contact.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Prea multe încercări. Încearcă din nou în 15 minute.' } });
const promoLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 30, message: { error: 'Prea multe încercări.' } });
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Prea multe mesaje trimise.' } });

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // configured per-route if needed
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());

// Middleware global
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Rute
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/promotions', promoLimiter, promotionRoutes);
app.use('/api/contact', contactLimiter, contactRoutes);
app.use('/api/settings', settingsRoutes);

// 404 + error handler (trebuie ultimele)
app.use(notFound);
app.use(errorHandler);

// Start
const start = async () => {
  try {
    await connectDB();
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`🍫 Server pornit pe http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Eroare la pornire:', err);
    process.exit(1);
  }
};

start();

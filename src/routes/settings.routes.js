import { Router } from 'express';
import { getSettings, updateSettings, getCategories, getStoreInfo, getPublicStats, getFeaturedReviews } from '../controllers/settings.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/categories', getCategories);        // public
router.get('/info', getStoreInfo);               // public
router.get('/stats', getPublicStats);            // public
router.get('/featured-reviews', getFeaturedReviews); // public
router.get('/', requireAuth, requireAdmin, getSettings);
router.put('/', requireAuth, requireAdmin, updateSettings);

export default router;

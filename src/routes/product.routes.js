import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as ctrl from '../controllers/product.controller.js';
import * as reviewCtrl from '../controllers/review.controller.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';

const reviewLimiter    = rateLimit({ windowMs: 60 * 60 * 1000, max: 5,  message: { error: 'Prea multe recenzii trimise. Încearcă mai târziu.' } });
const alertLimiter     = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: { error: 'Prea multe cereri.' } });

const router = Router();
router.get('/', ctrl.listProducts);
router.get('/tags', ctrl.getProductTags);
router.get('/bestsellers', ctrl.getBestsellers);
router.get('/:id', ctrl.getProduct);
router.post('/', requireAuth, requireAdmin, ctrl.createProduct);
router.put('/:id', requireAuth, requireAdmin, ctrl.updateProduct);
router.delete('/:id', requireAuth, requireAdmin, ctrl.deleteProduct);

router.get('/:id/reviews', reviewCtrl.getProductReviews);
router.post('/:id/reviews', reviewLimiter, optionalAuth, reviewCtrl.submitReview);
router.post('/:id/stock-alert', alertLimiter, ctrl.createStockAlert);

export default router;

import { Router } from 'express';
import * as ctrl from '../controllers/promotion.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/apply', ctrl.applyPromotion); // public — apply code at checkout
router.get('/', requireAuth, requireAdmin, ctrl.listPromotions);
router.post('/', requireAuth, requireAdmin, ctrl.createPromotion);
router.put('/:id', requireAuth, requireAdmin, ctrl.updatePromotion);
router.delete('/:id', requireAuth, requireAdmin, ctrl.deletePromotion);

export default router;

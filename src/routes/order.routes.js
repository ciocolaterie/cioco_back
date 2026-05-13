import { Router } from 'express';
import * as ctrl from '../controllers/order.controller.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', requireAuth, requireAdmin, ctrl.listOrders);
router.get('/me', requireAuth, ctrl.myOrders);
router.get('/:id', optionalAuth, ctrl.getOrder);
router.post('/', optionalAuth, ctrl.createOrder);
router.patch('/:id/status', requireAuth, requireAdmin, ctrl.updateStatus);
router.patch('/:id/cancel', requireAuth, ctrl.cancelOrder);

export default router;

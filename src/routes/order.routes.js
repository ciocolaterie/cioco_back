import { Router } from 'express';
import * as ctrl from '../controllers/order.controller.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', requireAuth, requireAdmin, ctrl.listOrders);
router.get('/me', requireAuth, ctrl.myOrders);
router.post('/admin', requireAuth, requireAdmin, ctrl.createOrderAdmin);
router.patch('/bulk-status', requireAuth, requireAdmin, ctrl.bulkUpdateStatus);
router.get('/:id', optionalAuth, ctrl.getOrder);
router.post('/', optionalAuth, ctrl.createOrder);
router.patch('/:id/status', requireAuth, requireAdmin, ctrl.updateStatus);
router.patch('/:id/cancel', requireAuth, ctrl.cancelOrder);
router.patch('/:id/urgent', requireAuth, requireAdmin, ctrl.toggleUrgent);
router.patch('/:id/internal-note', requireAuth, requireAdmin, ctrl.updateInternalNote);

export default router;

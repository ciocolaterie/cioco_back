import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller.js';
import * as reviewCtrl from '../controllers/review.controller.js';
import { updateFeaturedReviews } from '../controllers/settings.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/products', ctrl.listAllProducts);
router.get('/stats', ctrl.stats);
router.get('/top-products', ctrl.topProducts);
router.get('/week-chart', ctrl.weekChart);
router.get('/export-orders', ctrl.exportOrders);
router.get('/source-stats', ctrl.sourceStats);
router.get('/production-summary', ctrl.productionSummary);
router.get('/today-deliveries', ctrl.todayDeliveries);
router.get('/urgent-orders', ctrl.urgentOrders);
router.get('/calendar-orders', ctrl.calendarOrders);
router.get('/analytics', ctrl.getAnalytics);

router.get('/reviews', reviewCtrl.listReviews);
router.patch('/reviews/:id', reviewCtrl.moderateReview);
router.delete('/reviews/:id', reviewCtrl.deleteReview);
router.put('/featured-reviews', updateFeaturedReviews);

export default router;

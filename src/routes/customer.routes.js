import { Router } from 'express';
import * as ctrl from '../controllers/customer.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', requireAuth, requireAdmin, ctrl.listCustomers);
router.get('/export', requireAuth, requireAdmin, ctrl.exportCustomers);

export default router;

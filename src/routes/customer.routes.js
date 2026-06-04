import { Router } from 'express';
import * as ctrl from '../controllers/customer.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', requireAuth, requireAdmin, ctrl.listCustomers);
router.get('/lookup', requireAuth, requireAdmin, ctrl.lookupByPhone);
router.get('/export', requireAuth, requireAdmin, ctrl.exportCustomers);
router.patch('/:id/note', requireAuth, requireAdmin, ctrl.updateCustomerNote);
router.get('/:id', requireAuth, requireAdmin, ctrl.getCustomer);

export default router;

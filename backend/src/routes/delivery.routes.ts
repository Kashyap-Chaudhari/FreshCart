import { Router } from 'express';
import { deliveryController } from '../controllers/delivery.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Public
router.get('/check/:pincode', deliveryController.checkPincode);
router.get('/areas', deliveryController.list);

// Admin
router.post('/admin/areas', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.create);
router.patch('/admin/areas/:id', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.update);

export default router;

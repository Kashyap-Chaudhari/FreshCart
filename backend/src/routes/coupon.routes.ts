import { Router } from 'express';
import { couponController } from '../controllers/coupon.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Public: active available coupons & validate coupon
router.get('/active', couponController.listActive);
router.get('/', couponController.listActive);
router.post('/validate', couponController.validate);

// Admin: CRUD
router.get('/admin/list', authenticate, requireRole(['OWNER', 'STAFF']), couponController.adminList);
router.post('/admin', authenticate, requireRole(['OWNER', 'STAFF']), couponController.create);
router.patch('/admin/:id', authenticate, requireRole(['OWNER', 'STAFF']), couponController.update);

export default router;


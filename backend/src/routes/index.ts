import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import orderRoutes from './order.routes';
import couponRoutes from './coupon.routes';
import deliveryRoutes from './delivery.routes';
import settingRoutes from './setting.routes';
import adminRoutes from './admin.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/settings', settingRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);

router.get('/health', (_req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'FreshCart Grocery API',
  });
});

export default router;

import { Router } from 'express';
import { deliveryController } from '../controllers/delivery.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Public Pincode & Delivery Area checking (used by Customer Storefront & Checkout)
router.get('/check/:pincode', deliveryController.checkPincode);
router.get('/areas', deliveryController.listAreas);

// Admin delivery area configuration
router.post('/admin/areas', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.createArea);
router.patch('/admin/areas/:id', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.updateArea);

// Public delivery authentication
router.post('/auth/login', deliveryController.login);
router.post('/login', deliveryController.login);

// Authenticated delivery person endpoints (Strict role check: DELIVERY_PERSON only)
router.get('/profile', authenticate, requireRole('DELIVERY_PERSON'), deliveryController.getProfile);
router.get('/orders', authenticate, requireRole('DELIVERY_PERSON'), deliveryController.getAssignedOrders);
router.get('/orders/:id', authenticate, requireRole('DELIVERY_PERSON'), deliveryController.getOrderDetail);
router.get('/orders/:orderId', authenticate, requireRole('DELIVERY_PERSON'), deliveryController.getOrderDetail);
router.post('/orders/:id/claim', authenticate, requireRole('DELIVERY_PERSON'), deliveryController.claimOrder);
router.post('/orders/:orderId/claim', authenticate, requireRole('DELIVERY_PERSON'), deliveryController.claimOrder);
router.patch('/orders/:id/status', authenticate, requireRole('DELIVERY_PERSON'), deliveryController.updateDeliveryStatus);
router.patch('/orders/:orderId/status', authenticate, requireRole('DELIVERY_PERSON'), deliveryController.updateDeliveryStatus);

export default router;

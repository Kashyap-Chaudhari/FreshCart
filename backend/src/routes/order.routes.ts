import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { orderRateLimiter } from '../middlewares/rateLimiter.middleware';
import {
  checkoutSchema,
  cancelOrderSchema,
  updateOrderStatusSchema,
  substituteItemSchema,
} from '../validators/order.validator';

const router = Router();

// Customer / Guest endpoints
router.post('/checkout', orderRateLimiter, optionalAuthenticate, validate({ body: checkoutSchema }), orderController.checkout);
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.get('/track/:identifier', optionalAuthenticate, orderController.trackOrder);
router.post('/:id/cancel', authenticate, validate({ body: cancelOrderSchema }), orderController.cancelMyOrder);
router.get('/:id/invoice', optionalAuthenticate, orderController.downloadInvoice);

// Admin & Staff operations
router.get('/admin/list', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminList);
router.patch('/admin/:id/status', authenticate, requireRole(['OWNER', 'STAFF']), validate({ body: updateOrderStatusSchema }), orderController.adminUpdateStatus);
router.post('/admin/:id/cancel', authenticate, requireRole(['OWNER', 'STAFF']), validate({ body: cancelOrderSchema }), orderController.adminCancelOrder);
router.post('/admin/:id/items/:itemId/substitute', authenticate, requireRole(['OWNER', 'STAFF']), validate({ body: substituteItemSchema }), orderController.adminSubstituteItem);
router.post('/admin/:id/mark-cod-collected', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminMarkCodCollected);
router.get('/admin/:id/packing-slip', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminDownloadPackingSlip);
router.get('/admin/:id/delivery-slip', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminDownloadDeliverySlip);
router.post('/admin/walk-in', authenticate, requireRole(['OWNER', 'STAFF']), validate({ body: checkoutSchema }), orderController.adminCreateWalkInOrder);

export default router;

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

// Customer endpoints (Login required to place & confirm orders)
// POST /api/orders and POST /api/orders/checkout
router.post('/', orderRateLimiter, authenticate, validate({ body: checkoutSchema }), orderController.checkout);
router.post('/checkout', orderRateLimiter, authenticate, validate({ body: checkoutSchema }), orderController.checkout);

// GET /api/orders/my-orders
router.get('/my-orders', authenticate, orderController.getMyOrders);

// GET /api/orders/:orderId/tracking
router.get('/:identifier/tracking', optionalAuthenticate, orderController.getTrackingTimeline);

// POST /api/orders/:orderId/cancel-request
router.post('/:orderId/cancel-request', optionalAuthenticate, orderController.requestCancelOrder);

// Quick track & details: GET /api/orders/:orderId
router.get('/track/:identifier', optionalAuthenticate, orderController.trackOrder);
router.get('/:identifier', optionalAuthenticate, orderController.trackOrder);

// Customer self-cancel
router.post('/:id/cancel', authenticate, validate({ body: cancelOrderSchema }), orderController.cancelMyOrder);

// Invoices & Tax Documents
router.get('/:id/invoice', optionalAuthenticate, orderController.downloadInvoice);
router.get('/:id/print', optionalAuthenticate, orderController.printInvoice);
router.get('/:id/credit-note', optionalAuthenticate, orderController.downloadCreditNote);

// Admin & Staff operations (also accessible via /api/orders/admin/*)
router.get('/admin/list', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminList);
router.patch('/admin/:id/status', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminUpdateStatus);
router.patch('/admin/:id/delivery', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminUpdateDelivery);
router.post('/admin/:id/cancellation-review', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminReviewCancellation);
router.post('/admin/:id/cancel', authenticate, requireRole(['OWNER', 'STAFF']), validate({ body: cancelOrderSchema }), orderController.adminCancelOrder);
router.post('/admin/:id/items/:itemId/substitute', authenticate, requireRole(['OWNER', 'STAFF']), validate({ body: substituteItemSchema }), orderController.adminSubstituteItem);
router.post('/admin/:id/mark-cod-collected', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminMarkCodCollected);
router.get('/admin/:id/packing-slip', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminDownloadPackingSlip);
router.get('/admin/:id/delivery-slip', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminDownloadDeliverySlip);
router.post('/admin/walk-in', authenticate, requireRole(['OWNER', 'STAFF']), validate({ body: checkoutSchema }), orderController.adminCreateWalkInOrder);

export default router;

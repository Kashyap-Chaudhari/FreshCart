import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { orderController } from '../controllers/order.controller';
import { deliveryController } from '../controllers/delivery.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import prisma from '../config/prisma';

const router = Router();

// Dashboard KPI metrics - Owner & Staff
router.get('/dashboard-summary', authenticate, requireRole(['OWNER', 'STAFF']), adminController.getDashboardSummary);

// Delivery Personnel Management - Owner & Staff
router.get('/delivery-persons', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.adminList);
router.post('/delivery-persons', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.adminCreate);
router.patch('/delivery-persons/:id', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.adminUpdate);
router.get('/delivery-persons/:id/orders', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.adminGetPersonHistory);
router.post('/orders/:id/assign-delivery', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.adminAssign);
router.post('/orders/:orderId/assign-delivery', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.adminAssign);
router.post('/orders/:id/auto-assign-delivery', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.adminAutoAssign);
router.post('/orders/:orderId/auto-assign-delivery', authenticate, requireRole(['OWNER', 'STAFF']), deliveryController.adminAutoAssign);

// Admin Orders API (/api/admin/orders)
router.get('/orders', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminList);
router.patch('/orders/:id/status', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminUpdateStatus);
router.patch('/orders/:orderId/status', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminUpdateStatus);
router.patch('/orders/:id/delivery', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminUpdateDelivery);
router.patch('/orders/:orderId/delivery', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminUpdateDelivery);
router.post('/orders/:id/cancellation-review', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminReviewCancellation);
router.post('/orders/:orderId/cancellation-review', authenticate, requireRole(['OWNER', 'STAFF']), orderController.adminReviewCancellation);

// Admin Orders KPI Counters
router.get('/orders/counters', authenticate, requireRole(['OWNER', 'STAFF']), async (req, res, next) => {
  try {
    const [all, placed, confirmed, processing, shipped, outForDelivery, delivered, cancelled, cancelRequested] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PLACED' } }),
        prisma.order.count({ where: { status: 'CONFIRMED' } }),
        prisma.order.count({ where: { status: { in: ['PROCESSING', 'PACKED'] } } }),
        prisma.order.count({ where: { status: 'SHIPPED' } }),
        prisma.order.count({ where: { status: 'OUT_FOR_DELIVERY' } }),
        prisma.order.count({ where: { status: 'DELIVERED' } }),
        prisma.order.count({ where: { status: { in: ['CANCELLED', 'REJECTED'] } } }),
        prisma.order.count({ where: { cancellationStatus: 'REQUESTED' } }),
      ]);

    res.json({
      success: true,
      data: {
        total: all,
        newOrders: placed,
        confirmed,
        processing,
        shipped,
        outForDelivery,
        delivered,
        cancelled,
        cancelRequested,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Notifications API
router.get('/notifications', authenticate, requireRole(['OWNER', 'STAFF']), async (req, res, next) => {
  try {
    const list = await prisma.notification.findMany({
      where: { recipientType: 'ADMIN' },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

router.patch('/notifications/mark-read', authenticate, requireRole(['OWNER', 'STAFF']), async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientType: 'ADMIN' },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// Customers management - Owner Only
router.get('/customers', authenticate, requireRole('OWNER'), adminController.listCustomers);
router.post('/customers/:id/toggle-block', authenticate, requireRole('OWNER'), adminController.toggleBlockCustomer);

// Staff management - Owner Only
router.get('/staff', authenticate, requireRole('OWNER'), adminController.listStaff);
router.post('/staff', authenticate, requireRole('OWNER'), adminController.createStaff);

// Audit logs - Owner Only
router.get('/audit-logs', authenticate, requireRole('OWNER'), adminController.listAuditLogs);

export default router;

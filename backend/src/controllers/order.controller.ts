import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { invoiceService } from '../services/invoice.service';
import { auditService } from '../services/audit.service';
import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';

export const orderController = {
  /**
   * Customer: Checkout / Place Order
   * NON-NEGOTIABLE RULE 1: Handled in single DB transaction with row-level locks
   */
  async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('First please login or register to place your order.', 401);
      }

      const order = await orderService.createOrder({
        ...req.body,
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Customer: Get order history
   */
  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Authentication required', 401);

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
      const skip = (page - 1) * limit;

      const [total, orders] = await Promise.all([
        prisma.order.count({ where: { userId: req.user.id } }),
        prisma.order.findMany({
          where: { userId: req.user.id },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        }),
      ]);

      res.json({
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Public / Customer: Track order by ID or Order Number
   */
  async trackOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier } = req.params;
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: identifier }, { orderNumber: identifier }],
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!order) throw new AppError('Order not found', 404);

      // If customer is logged in, ensure they own the order unless guest
      if (req.user && order.userId && order.userId !== req.user.id && req.user.role === 'CUSTOMER') {
        throw new AppError('Access denied', 403);
      }

      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Customer: Cancel order while status is PLACED or CONFIRMED
   */
  async cancelMyOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const existing = await prisma.order.findUnique({ where: { id } });
      if (!existing) throw new AppError('Order not found', 404);

      if (req.user && existing.userId && existing.userId !== req.user.id && req.user.role === 'CUSTOMER') {
        throw new AppError('Access denied to cancel this order', 403);
      }

      const order = await orderService.cancelOrder(id, reason, req.user?.id, true);

      res.json({
        success: true,
        message: 'Order cancelled successfully and inventory restored',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Download / Stream PDF Tax Invoice
   */
  async downloadInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await prisma.order.findFirst({
        where: { OR: [{ id }, { orderNumber: id }] },
      });

      if (!order) throw new AppError('Order not found', 404);

      // Security: If customer, ensure it belongs to them
      if (req.user && order.userId && order.userId !== req.user.id && req.user.role === 'CUSTOMER') {
        throw new AppError('Access denied', 403);
      }

      const pdfDoc = await invoiceService.generateInvoicePdf(order.id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Tax-Invoice-${order.invoiceNumber}.pdf"`);
      pdfDoc.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Print View HTML for Order Invoice
   */
  async printInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await prisma.order.findFirst({
        where: { OR: [{ id }, { orderNumber: id }] },
      });
      if (!order) throw new AppError('Order not found', 404);
      if (req.user && order.userId && order.userId !== req.user.id && req.user.role === 'CUSTOMER') {
        throw new AppError('Access denied', 403);
      }
      const html = await invoiceService.generateInvoiceHtml(order.id);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Download / Stream PDF GST Credit Note (Section 34 CGST Act)
   */
  async downloadCreditNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await prisma.order.findFirst({
        where: { OR: [{ id }, { orderNumber: id }] },
      });
      if (!order) throw new AppError('Order not found', 404);
      if (req.user && order.userId && order.userId !== req.user.id && req.user.role === 'CUSTOMER') {
        throw new AppError('Access denied', 403);
      }
      const reason = (req.query.reason as string) || order.cancellationReason || 'Order Cancellation Credit Reversal';
      const pdfDoc = await invoiceService.generateCreditNotePdf(order.id, reason);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Credit-Note-${order.orderNumber}.pdf"`);
      pdfDoc.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: List all orders with filters (status, search, dates, pagination)
   */
  async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const { status, search, paymentStatus, startDate, endDate } = req.query;
      const where: any = {};

      if (status && status !== 'ALL') {
        where.status = status;
      }

      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      if (search) {
        const query = String(search).trim();
        where.OR = [
          { orderNumber: { contains: query, mode: 'insensitive' } },
          { invoiceNumber: { contains: query, mode: 'insensitive' } },
          { customerName: { contains: query, mode: 'insensitive' } },
          { customerPhone: { contains: query, mode: 'insensitive' } },
        ];
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(String(startDate));
        if (endDate) where.createdAt.lte = new Date(String(endDate));
      }

      const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        }),
      ]);

      res.json({
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Update order status
   */
  async adminUpdateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const updated = await orderService.updateStatus(id, status, note, req.user?.id);

      await auditService.log({
        userId: req.user?.id,
        action: 'ORDER_STATUS_UPDATE',
        entity: 'Order',
        entityId: id,
        details: { toStatus: status, note, orderNumber: updated.orderNumber },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: `Order status updated to ${status}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Update estimated delivery and tracking notes
   */
  async adminUpdateDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.orderId || req.params.id;
      const { estimatedDeliveryDate, trackingNumber, carrier, trackingNotes, note } = req.body;

      const updated = await orderService.updateDelivery(id, {
        estimatedDeliveryDate,
        trackingNumber,
        carrier,
        trackingNotes,
        note,
        changedByUserId: req.user?.id,
      });

      await auditService.log({
        userId: req.user?.id,
        action: 'ORDER_DELIVERY_UPDATE',
        entity: 'Order',
        entityId: id,
        details: { estimatedDeliveryDate, trackingNumber, carrier, trackingNotes, note },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Delivery tracking information updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Review customer cancellation request (Approve/Reject)
   */
  async adminReviewCancellation(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.orderId || req.params.id;
      const { action, note } = req.body;

      if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
        throw new AppError('Action must be either APPROVE or REJECT', 400);
      }

      const result = await orderService.reviewCancellationRequest(id, action, note, req.user?.id);

      await auditService.log({
        userId: req.user?.id,
        action: `ORDER_CANCEL_REQUEST_${action}`,
        entity: 'Order',
        entityId: id,
        details: { action, note },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: `Cancellation request ${action === 'APPROVE' ? 'approved and stock restored' : 'rejected'}.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Customer / Public: Get structured 6-stage real-time tracking timeline
   */
  async getTrackingTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const identifier = req.params.orderId || req.params.identifier || req.params.id;
      const tracking = await orderService.getOrderTracking(identifier);

      res.json({
        success: true,
        data: tracking,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Customer: Request order cancellation
   */
  async requestCancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.orderId || req.params.id;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        throw new AppError('Cancellation reason is required', 400);
      }

      const result = await orderService.requestCancellation(id, reason.trim(), req.user?.id);

      res.json({
        success: true,
        message:
          result.status === 'CANCELLED'
            ? 'Order cancelled successfully and stock restored'
            : 'Cancellation request submitted for store review',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Cancel / Reject order with automatic stock restoration
   */
  async adminCancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await orderService.cancelOrder(id, reason, req.user?.id, false);

      await auditService.log({
        userId: req.user?.id,
        action: 'ORDER_CANCELLED',
        entity: 'Order',
        entityId: id,
        details: { reason, orderNumber: order.orderNumber },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Order cancelled and stock restored to inventory',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Item Substitution with customer notification
   */
  async adminSubstituteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, itemId } = req.params;
      const { substituteProductId, substituteQuantity, note } = req.body;

      const result = await orderService.substituteItem(
        id,
        itemId,
        substituteProductId,
        substituteQuantity,
        note,
        req.user?.id || 'admin'
      );

      await auditService.log({
        userId: req.user?.id,
        action: 'ORDER_ITEM_SUBSTITUTE',
        entity: 'Order',
        entityId: id,
        details: { itemId, substituteProductId, substituteQuantity, note },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Item substituted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Mark COD payment as collected
   */
  async adminMarkCodCollected(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await orderService.markCodCollected(id, req.user?.id || 'admin');

      await auditService.log({
        userId: req.user?.id,
        action: 'COD_PAYMENT_COLLECTED',
        entity: 'Order',
        entityId: id,
        details: { orderNumber: updated.orderNumber, grandTotal: updated.grandTotal },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'COD payment marked as collected',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Download Packing Slip
   */
  async adminDownloadPackingSlip(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pdf = await invoiceService.generatePackingSlipPdf(id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Packing-Slip-${id}.pdf"`);
      pdf.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Download Delivery Slip
   */
  async adminDownloadDeliverySlip(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pdf = await invoiceService.generateDeliverySlipPdf(id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Delivery-Slip-${id}.pdf"`);
      pdf.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Create walk-in manual order
   */
  async adminCreateWalkInOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createOrder({
        ...req.body,
        userId: null,
        isWalkIn: true,
        deliveryType: 'PICKUP',
      });

      await auditService.log({
        userId: req.user?.id,
        action: 'WALKIN_ORDER_CREATED',
        entity: 'Order',
        entityId: order.id,
        details: { orderNumber: order.orderNumber, grandTotal: order.grandTotal },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        message: 'Walk-in order created successfully',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  },
};


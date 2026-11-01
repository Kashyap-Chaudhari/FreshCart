import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import { calculateItemTaxInclusive, calculateOrderTotals, calculateCouponDiscount, round2 } from '../utils/calculation.util';
import { formatInvoiceNumber, formatOrderNumber, formatCreditNoteNumber } from '../utils/invoiceNumber.util';
import { notificationService } from './notification.service';
import { OrderStatus } from '@prisma/client';
import { resolveDeliveryArea, isGujaratPincode } from '../utils/gujaratDelivery';
import { notifyNewOrder, notifyOrderUpdate, notifyCancellationRequest, notifyDeliveryAssignment } from '../socket';

export interface CreateOrderInput {
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress: {
    street: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  deliveryType?: 'DELIVERY' | 'PICKUP';
  deliverySlot?: string;
  couponCode?: string;
  notes?: string;
  paymentMethod?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  isWalkIn?: boolean;
}

export const TRACKING_STAGES = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received & verified by FreshCart' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Accepted & queued for fulfillment' },
  { key: 'PROCESSING', label: 'Processing', desc: 'Fresh groceries hand-picked & packed' },
  { key: 'SHIPPED', label: 'Shipped', desc: 'Dispatched from SG Highway Fulfillment Hub' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Delivery partner on the way to your doorstep' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Order delivered & Cash on Delivery collected' },
];

export const orderService = {
  /**
   * Atomically creates an order, deducts stock with row-level locks, records stock movement ledger,
   * generates sequential invoice number, and snapshots all prices and address.
   * NON-NEGOTIABLE RULE 1: All operations in ONE database transaction with row-level locking.
   */
  async createOrder(input: CreateOrderInput) {
    const {
      userId,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      deliveryType = 'DELIVERY',
      deliverySlot,
      couponCode,
      notes,
      paymentMethod = 'COD',
      items,
      isWalkIn = false,
    } = input;

    // Enforce authentication: Customers must be logged in to create orders
    if (!userId && !isWalkIn) {
      throw new AppError('First please login or register to place your order.', 401);
    }

    // Validate delivery area if delivery is selected
    if (deliveryType === 'DELIVERY') {
      let area = await prisma.deliveryArea.findUnique({
        where: { pincode: shippingAddress.pincode },
      });

      if (!area) {
        area = resolveDeliveryArea(shippingAddress.pincode) as any;
      }

      const isGujarat = isGujaratPincode(shippingAddress.pincode) ||
        (shippingAddress.state && shippingAddress.state.trim().toLowerCase() === 'gujarat');

      if ((!area || !area.isDeliverable) && !isGujarat) {
        throw new AppError(`Delivery is not available in pincode ${shippingAddress.pincode}. FreshCart delivers all across Gujarat!`, 400);
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Sort product IDs to prevent deadlock between concurrent transactions
      const sortedItemInputs = [...items].sort((a, b) => a.productId.localeCompare(b.productId));

      // 2. Fetch delivery area rules for charges
      let deliveryCharge = 0;
      let minOrderValue = 0;
      let freeDeliveryAbove: number | null = null;

      if (deliveryType === 'DELIVERY') {
        let area = await tx.deliveryArea.findUnique({
          where: { pincode: shippingAddress.pincode },
        });

        if (!area) {
          area = resolveDeliveryArea(shippingAddress.pincode) as any;
        }

        if (area && area.isDeliverable) {
          deliveryCharge = Number(area.deliveryCharge);
          minOrderValue = Number(area.minOrderValue);
          freeDeliveryAbove = area.freeDeliveryAbove ? Number(area.freeDeliveryAbove) : null;
        } else if (isGujaratPincode(shippingAddress.pincode) || (shippingAddress.state && shippingAddress.state.trim().toLowerCase() === 'gujarat')) {
          deliveryCharge = 40;
          minOrderValue = 149;
          freeDeliveryAbove = 499;
        }
      }

      // 3. Row-level lock products and verify stock
      const processedItems: Array<{
        product: any;
        quantity: number;
        calc: ReturnType<typeof calculateItemTaxInclusive>;
      }> = [];

      for (const itemInput of sortedItemInputs) {
        // SELECT FOR UPDATE locks the product row until this transaction commits or rolls back
        const rawProducts: any[] = await tx.$queryRaw`
          SELECT id, name, sku, unit, price, mrp, "taxPercent", "stockQty", "isAvailable"
          FROM products
          WHERE id = ${itemInput.productId}
          FOR UPDATE
        `;

        if (!rawProducts || rawProducts.length === 0) {
          throw new AppError(`Product with ID ${itemInput.productId} not found`, 404);
        }

        const product = rawProducts[0];

        if (!product.isAvailable) {
          throw new AppError(`Product "${product.name}" is currently unavailable.`, 400);
        }

        if (product.stockQty < itemInput.quantity) {
          throw new AppError(
            `Insufficient stock for "${product.name}". Available: ${product.stockQty}, Requested: ${itemInput.quantity}.`,
            409
          );
        }

        const calc = calculateItemTaxInclusive({
          price: Number(product.price),
          taxPercent: Number(product.taxPercent),
          quantity: itemInput.quantity,
        });

        processedItems.push({
          product,
          quantity: itemInput.quantity,
          calc,
        });
      }

      // 4. Calculate subtotal
      const rawSubtotal = processedItems.reduce((acc, cur) => round2(acc + cur.calc.lineTotal), 0);
      if (rawSubtotal <= 0) {
        throw new AppError('Order subtotal must be greater than zero.', 400);
      }

      // 5. Check and validate coupon if provided
      let couponDiscount = 0;
      let appliedCoupon: any = null;
      if (couponCode) {
        const cleanCoupon = couponCode.trim().toUpperCase();
        appliedCoupon = await tx.coupon.findUnique({
          where: { code: cleanCoupon },
        });

        if (!appliedCoupon || !appliedCoupon.isActive) {
          throw new AppError('Invalid or expired coupon code.', 400);
        }

        const now = new Date();
        if (now < appliedCoupon.validFrom || now > appliedCoupon.validTo) {
          throw new AppError('Coupon has expired or is not yet active.', 400);
        }

        if (appliedCoupon.usageLimit && appliedCoupon.timesUsed >= appliedCoupon.usageLimit) {
          throw new AppError('Coupon usage limit has been reached.', 400);
        }

        const couponValidation = calculateCouponDiscount(
          rawSubtotal,
          appliedCoupon.discountType,
          Number(appliedCoupon.discountValue),
          Number(appliedCoupon.minOrderValue),
          appliedCoupon.maxDiscount ? Number(appliedCoupon.maxDiscount) : null
        );

        if (!couponValidation.isValid) {
          throw new AppError(couponValidation.message || 'Coupon conditions not met.', 400);
        }

        couponDiscount = couponValidation.discountAmount;
      }

      // Check free delivery above threshold
      if (deliveryType === 'DELIVERY' && freeDeliveryAbove !== null && rawSubtotal >= freeDeliveryAbove) {
        deliveryCharge = 0;
      }

      const orderTotals = calculateOrderTotals({
        items: processedItems.map((p) => ({
          price: Number(p.product.price),
          taxPercent: Number(p.product.taxPercent),
          quantity: p.quantity,
        })),
        deliveryCharge,
        couponDiscount,
        minOrderValue,
      });

      // 6. Lock store_settings to sequentially generate the unique invoice number
      const rawSettings: any[] = await tx.$queryRaw`
        SELECT id, "invoicePrefix", "invoiceNextNumber"
        FROM store_settings
        WHERE id = 'default'
        FOR UPDATE
      `;

      let invoicePrefix = 'INV-';
      let nextInvoiceNumber = 1001;

      if (rawSettings && rawSettings.length > 0) {
        invoicePrefix = rawSettings[0].invoicePrefix || 'INV-';
        nextInvoiceNumber = rawSettings[0].invoiceNextNumber || 1001;
      }

      const generatedInvoiceNumber = formatInvoiceNumber(invoicePrefix, nextInvoiceNumber);
      const generatedOrderNumber = formatOrderNumber(new Date(), nextInvoiceNumber);

      // Increment invoice next number
      await tx.$executeRaw`
        UPDATE store_settings
        SET "invoiceNextNumber" = ${nextInvoiceNumber + 1}, "updatedAt" = NOW()
        WHERE id = 'default'
      `;

      // 7. Deduct stock and record stock movement ledger
      for (const item of processedItems) {
        const newBalance = item.product.stockQty - item.quantity;

        // Atomically decrement product stock
        await tx.product.update({
          where: { id: item.product.id },
          data: { stockQty: newBalance },
        });

        // Record stock deduction in ledger
        await tx.stockMovementLedger.create({
          data: {
            productId: item.product.id,
            type: 'SALE_DEDUCTION',
            quantityChange: -item.quantity,
            balanceAfter: newBalance,
            referenceType: 'ORDER',
            referenceId: generatedOrderNumber,
            reason: `Order #${generatedOrderNumber} placed`,
            createdByUserId: userId || null,
          },
        });
      }

      // 8. Increment coupon usage if used
      if (appliedCoupon) {
        await tx.coupon.update({
          where: { id: appliedCoupon.id },
          data: { timesUsed: { increment: 1 } },
        });
      }

      // 9. Auto-assign to an active delivery partner if delivery order
      let assignedDriver: any = null;
      if (deliveryType === 'DELIVERY') {
        try {
          const activeDrivers = await tx.user.findMany({
            where: { role: 'DELIVERY_PERSON', isActive: true, isBlocked: false },
          });
          if (activeDrivers && activeDrivers.length > 0) {
            assignedDriver = activeDrivers[0];
          }
        } catch {
          // fallback
        }
      }

      // 10. Persist Order with complete address and item snapshots
      const order = await tx.order.create({
        data: {
          orderNumber: generatedOrderNumber,
          invoiceNumber: generatedInvoiceNumber,
          userId: userId || null,
          isGuest: !userId,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          shippingAddressSnapshot: shippingAddress,
          status: 'PLACED',
          paymentMethod,
          paymentStatus: 'PENDING',
          deliveryType,
          deliverySlot: deliverySlot || null,
          estimatedDeliveryDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          trackingNumber: `TRK-GJ-${Math.floor(100000 + Math.random() * 900000)}`,
          carrier: assignedDriver
            ? `${assignedDriver.name} (${assignedDriver.vehicleNumber || 'Gujarat Fleet'})`
            : 'FreshCart Express Gujarat',
          trackingNotes: assignedDriver
            ? `Order received and assigned to delivery partner ${assignedDriver.name}`
            : 'Order received and being queued for fresh grocery packing',
          deliveryPersonId: assignedDriver ? assignedDriver.id : null,
          deliveryPersonName: assignedDriver ? assignedDriver.name : null,
          deliveryStatus: assignedDriver ? 'ASSIGNED' : 'UNASSIGNED',
          assignedAt: assignedDriver ? new Date() : null,
          cancellationStatus: 'NONE',
          pincode: shippingAddress.pincode,
          subtotal: orderTotals.subtotal,
          taxTotal: orderTotals.taxTotal,
          discountTotal: orderTotals.discountTotal,
          deliveryCharge: orderTotals.deliveryCharge,
          grandTotal: orderTotals.grandTotal,
          couponId: appliedCoupon ? appliedCoupon.id : null,
          couponCodeSnapshot: couponCode || null,
          isWalkIn,
          notes: notes || null,
          items: {
            create: processedItems.map((p) => ({
              productId: p.product.id,
              productName: p.product.name,
              productSku: p.product.sku,
              unit: p.product.unit,
              unitPrice: p.calc.unitPrice,
              mrp: p.product.mrp,
              taxPercent: p.calc.taxPercent,
              taxAmount: p.calc.taxAmount,
              quantity: p.quantity,
              lineTotal: p.calc.lineTotal,
            })),
          },
          statusHistory: {
            create: [
              {
                fromStatus: null,
                toStatus: 'PLACED',
                note: 'Order successfully created via online storefront',
                changedByUserId: userId || null,
              },
              ...(assignedDriver
                ? [
                    {
                      fromStatus: 'PLACED',
                      toStatus: 'PLACED',
                      note: `Automatically assigned to delivery partner "${assignedDriver.name}" (${assignedDriver.vehicleNumber || 'Fleet Partner'})`,
                      changedByUserId: 'system',
                    },
                  ]
                : []),
            ],
          },
        },
        include: {
          items: true,
          statusHistory: true,
        },
      });

      // Persist Immutable GST Tax Invoice Record
      try {
        await tx.invoice.create({
          data: {
            id: `inv-${Date.now()}-${order.id}`,
            invoiceNumber: generatedInvoiceNumber,
            orderId: order.id,
            orderNumber: generatedOrderNumber,
            userId: userId || null,
            customerName,
            customerPhone,
            customerEmail: customerEmail || null,
            shippingAddress,
            subtotal: orderTotals.subtotal,
            taxableAmount: round2(orderTotals.subtotal - orderTotals.taxTotal),
            cgstAmount: round2(orderTotals.taxTotal / 2),
            sgstAmount: round2(orderTotals.taxTotal - round2(orderTotals.taxTotal / 2)),
            igstAmount: 0,
            deliveryCharge: orderTotals.deliveryCharge,
            discountAmount: orderTotals.discountTotal,
            grandTotal: orderTotals.grandTotal,
            placeOfSupply: `${shippingAddress.state} (State Code: 24)`,
            status: 'ISSUED',
            createdAt: new Date(),
          },
        });
      } catch (invErr) {
        console.warn('Invoice persistence notice:', invErr);
      }

      return { order, assignedDriver };
    }).then(async ({ order, assignedDriver }: any) => {
      // 1. Broadcast real-time Socket.IO notification to Admin Dashboard & Customer & Delivery Fleet
      notifyNewOrder(order);

      if (assignedDriver) {
        notifyDeliveryAssignment(order, assignedDriver);
      }

      // 2. Persist in-app notification for admin
      try {
        await prisma.notification.create({
          data: {
            recipientType: 'ADMIN',
            orderId: order.id,
            orderNumber: order.orderNumber,
            title: 'New Grocery Order Placed',
            message: `${order.customerName} placed order #${order.orderNumber} for ₹${Number(order.grandTotal).toFixed(0)} (${order.paymentMethod})`,
            type: 'NEW_ORDER',
          },
        });
      } catch (e) {
        // notification store fallback
      }

      // 3. Dispatch external notification asynchronously
      notificationService.sendOrderNotification({
        toPhone: order.customerPhone,
        toEmail: order.customerEmail,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        type: 'ORDER_PLACED',
        details: { grandTotal: Number(order.grandTotal) },
      }).catch(() => {});

      return order;
    });
  },

  /**
   * Cancels an order, restores inventory stock, writes to the stock movement ledger,
   * and updates order status history.
   * NON-NEGOTIABLE RULE 2: Order cancellation restores stock and writes a ledger entry.
   */
  async cancelOrder(orderId: string, reason: string, cancelledByUserId?: string, isCustomerSelfCancel = false) {
    return await prisma.$transaction(async (tx) => {
      // Lock order row
      const rawOrders: any[] = await tx.$queryRaw`
        SELECT id, "orderNumber", status, "customerPhone", "customerEmail", "customerName"
        FROM orders
        WHERE id = ${orderId}
        FOR UPDATE
      `;

      if (!rawOrders || rawOrders.length === 0) {
        throw new AppError('Order not found', 404);
      }

      const order = rawOrders[0];

      // Validate status: Customers can only cancel if PLACED or CONFIRMED; Admins can cancel anytime before delivery
      if (isCustomerSelfCancel && order.status !== OrderStatus.PLACED && order.status !== OrderStatus.CONFIRMED) {
        throw new AppError(
          `Cannot cancel order with status ${order.status}. Only PLACED or CONFIRMED orders can be cancelled directly by customer.`,
          400
        );
      }

      if (!isCustomerSelfCancel && (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED)) {
        throw new AppError(`Cannot cancel an order that is already ${order.status}`, 400);
      }

      // Fetch order items to restore stock
      const items = await tx.orderItem.findMany({
        where: { orderId },
      });

      // Sort product IDs for lock order
      const sortedItems = [...items].sort((a, b) => a.productId.localeCompare(b.productId));

      for (const item of sortedItems) {
        // Lock product
        const rawProducts: any[] = await tx.$queryRaw`
          SELECT id, "stockQty"
          FROM products
          WHERE id = ${item.productId}
          FOR UPDATE
        `;

        if (rawProducts && rawProducts.length > 0) {
          const currentStock = rawProducts[0].stockQty;
          const restoredStock = currentStock + item.quantity;

          // Increment product stock
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: restoredStock },
          });

          // Record restoration in stock movement ledger
          await tx.stockMovementLedger.create({
            data: {
              productId: item.productId,
              type: 'ORDER_CANCEL_RESTORE',
              quantityChange: item.quantity,
              balanceAfter: restoredStock,
              referenceType: 'ORDER',
              referenceId: order.orderNumber,
              reason: `Order #${order.orderNumber} cancelled: ${reason}`,
              createdByUserId: cancelledByUserId || null,
            },
          });
        }
      }

      // Legally compliant GST Credit Note under Section 34 of CGST Act, 2017
      let creditNoteNumber = '';
      try {
        const cnCount = await tx.creditNote.count();
        creditNoteNumber = formatCreditNoteNumber(cnCount + 101);
        await tx.creditNote.create({
          data: {
            id: `cn-${Date.now()}-${orderId}`,
            creditNoteNumber,
            invoiceNumber: order.invoiceNumber,
            orderId: order.id,
            orderNumber: order.orderNumber,
            reason,
            refundAmount: order.grandTotal,
            taxReversed: order.taxTotal,
            status: 'ISSUED',
            createdAt: new Date(),
          },
        });
        await tx.invoice.update({
          where: { orderId },
          data: {
            status: 'CREDIT_NOTE_ISSUED',
            creditNoteNumber,
          },
        });
      } catch (cnErr) {
        console.warn('Credit note persistence notice:', cnErr);
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          creditNoteNumber: creditNoteNumber || null,
          cancelledAt: new Date(),
          cancelledByUserId: cancelledByUserId || null,
          statusHistory: {
            create: {
              fromStatus: order.status,
              toStatus: 'CANCELLED',
              note: `Cancelled: ${reason} (by ${isCustomerSelfCancel ? 'Customer' : 'Store Admin'})`,
              changedByUserId: cancelledByUserId || null,
            },
          },
        },
        include: {
          items: true,
          statusHistory: true,
        },
      });

      return updatedOrder;
    }).then(async (cancelledOrder) => {
      // Broadcast real-time Socket.IO notification to Customer and Admin
      notifyOrderUpdate(cancelledOrder, { event: 'order_cancelled', reason });

      notificationService.sendOrderNotification({
        toPhone: cancelledOrder.customerPhone,
        toEmail: cancelledOrder.customerEmail,
        orderNumber: cancelledOrder.orderNumber,
        customerName: cancelledOrder.customerName,
        type: 'ORDER_CANCELLED',
        details: { reason },
      }).catch(() => {});

      return cancelledOrder;
    });
  },

  /**
   * Updates order status (e.g. PACKED, OUT_FOR_DELIVERY, DELIVERED)
   */
  async updateStatus(orderId: string, toStatus: OrderStatus, note?: string, changedByUserId?: string) {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new AppError('Order not found', 404);
    }

    if (existing.status === 'CANCELLED' || existing.status === 'REJECTED') {
      throw new AppError(`Cannot update status of an already ${existing.status} order`, 400);
    }

    // Auto-assign delivery partner upon transitioning to SHIPPED or OUT_FOR_DELIVERY if not yet assigned
    let autoAssignedPartner: any = null;
    const statusStr = String(toStatus);
    if ((statusStr === 'SHIPPED' || statusStr === 'OUT_FOR_DELIVERY') && !existing.deliveryPersonId) {
      try {
        const activeDrivers = await prisma.user.findMany({
          where: { role: 'DELIVERY_PERSON', isActive: true, isBlocked: false },
        });

        if (activeDrivers && activeDrivers.length > 0) {
          // Count active deliveries to pick the least loaded driver
          const driversWithLoad = await Promise.all(
            activeDrivers.map(async (driver: any) => {
              const activeCount = await prisma.order.count({
                where: {
                  deliveryPersonId: driver.id,
                  status: { notIn: ['DELIVERED', 'CANCELLED', 'REJECTED'] },
                },
              });
              return { ...driver, activeOrders: activeCount };
            })
          );

          driversWithLoad.sort((a, b) => a.activeOrders - b.activeOrders);
          autoAssignedPartner = driversWithLoad[0];
        }
      } catch {
        // Fallback silently if lookup fails
      }
    }

    const now = new Date();
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        ...(autoAssignedPartner && {
          deliveryPersonId: autoAssignedPartner.id,
          deliveryPersonName: autoAssignedPartner.name,
          deliveryStatus: 'ASSIGNED',
          assignedAt: now,
          carrier: `${autoAssignedPartner.name} (${autoAssignedPartner.vehicleNumber || autoAssignedPartner.vehicleType || 'Partner'})`,
        }),
        ...(toStatus === 'DELIVERED' && { paymentStatus: 'COLLECTED', codCollectedAt: now }),
        statusHistory: {
          create: {
            fromStatus: existing.status,
            toStatus,
            note: autoAssignedPartner
              ? (note || `Status updated to ${toStatus} & automatically assigned to delivery partner "${autoAssignedPartner.name}"`)
              : (note || `Status updated to ${toStatus}`),
            changedByUserId: changedByUserId || null,
          },
        },
      },
      include: {
        items: true,
        statusHistory: true,
      },
    });

    // Broadcast real-time Socket.IO notification to Customer and Admin
    notifyOrderUpdate(updated, { event: 'status_updated', toStatus, note });

    // Broadcast delivery assignment event to delivery partner if auto-assigned
    if (autoAssignedPartner) {
      notifyDeliveryAssignment(updated, autoAssignedPartner);
    }

    // Notify customer
    notificationService.sendOrderNotification({
      toPhone: updated.customerPhone,
      toEmail: updated.customerEmail,
      orderNumber: updated.orderNumber,
      customerName: updated.customerName,
      type: toStatus as any,
      details: { grandTotal: Number(updated.grandTotal) },
    }).catch(() => {});

    return updated;
  },

  /**
   * Updates delivery tracking details (estimatedDeliveryDate, trackingNumber, carrier, trackingNotes)
   */
  async updateDelivery(
    orderId: string,
    data: {
      estimatedDeliveryDate?: string | Date;
      trackingNumber?: string;
      carrier?: string;
      trackingNotes?: string;
      note?: string;
      changedByUserId?: string;
    }
  ) {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new AppError('Order not found', 404);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(data.estimatedDeliveryDate && {
          estimatedDeliveryDate: new Date(data.estimatedDeliveryDate).toISOString(),
        }),
        ...(data.trackingNumber !== undefined && { trackingNumber: data.trackingNumber }),
        ...(data.carrier !== undefined && { carrier: data.carrier }),
        ...(data.trackingNotes !== undefined && { trackingNotes: data.trackingNotes }),
        ...(data.note && {
          statusHistory: {
            create: {
              fromStatus: existing.status,
              toStatus: existing.status,
              note: data.note,
              changedByUserId: data.changedByUserId || null,
            },
          },
        }),
      },
      include: {
        items: true,
        statusHistory: true,
      },
    });

    // Broadcast real-time Socket.IO event
    notifyOrderUpdate(updated, { event: 'delivery_updated' });

    return updated;
  },

  /**
   * Customer submits an order cancellation request
   */
  async requestCancellation(orderId: string, reason: string, userId?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status === 'DELIVERED') {
      throw new AppError('Delivered orders cannot be cancelled.', 400);
    }

    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      throw new AppError(`Order is already ${order.status}`, 400);
    }

    // If order is still PLACED, cancel immediately
    if (order.status === 'PLACED') {
      return await this.cancelOrder(orderId, reason, userId, true);
    }

    // For CONFIRMED, PROCESSING, SHIPPED: Submit cancellation request for admin review
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        cancellationStatus: 'REQUESTED',
        cancellationReason: reason,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: order.status,
            note: `Customer requested order cancellation: "${reason}"`,
            changedByUserId: userId || null,
          },
        },
      },
      include: {
        items: true,
        statusHistory: true,
      },
    });

    try {
      await prisma.cancellationRequest.create({
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: userId || null,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          reason,
          status: 'PENDING',
        },
      });

      await prisma.notification.create({
        data: {
          recipientType: 'ADMIN',
          orderId: order.id,
          orderNumber: order.orderNumber,
          title: 'Order Cancellation Request',
          message: `${order.customerName} requested cancellation for #${order.orderNumber}: "${reason}"`,
          type: 'CANCEL_REQUEST',
        },
      });
    } catch (e) {
      // ignore
    }

    // Broadcast real-time Socket.IO event to admin
    notifyCancellationRequest(updated, reason);

    return updated;
  },

  /**
   * Admin reviews and approves/rejects a cancellation request
   */
  async reviewCancellationRequest(
    orderId: string,
    action: 'APPROVE' | 'REJECT',
    note?: string,
    adminUserId?: string
  ) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Order not found', 404);

    if (action === 'APPROVE') {
      const cancelled = await this.cancelOrder(
        orderId,
        `Cancellation approved: ${note || order.cancellationReason || 'Customer requested'}`,
        adminUserId,
        false
      );

      try {
        await prisma.cancellationRequest.update({
          where: { orderId },
          data: { status: 'APPROVED', reviewNote: note || 'Approved by store manager', reviewedByUserId: adminUserId },
        });
      } catch (e) {}

      return cancelled;
    } else {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          cancellationStatus: 'REJECTED',
          statusHistory: {
            create: {
              fromStatus: order.status,
              toStatus: order.status,
              note: `Cancellation request rejected: ${note || 'Order is already dispatched'}`,
              changedByUserId: adminUserId || null,
            },
          },
        },
        include: { items: true, statusHistory: true },
      });

      try {
        await prisma.cancellationRequest.update({
          where: { orderId },
          data: { status: 'REJECTED', reviewNote: note || 'Rejected by store manager', reviewedByUserId: adminUserId },
        });
      } catch (e) {}

      notifyOrderUpdate(updated, { event: 'cancellation_reviewed', action: 'REJECT' });
      return updated;
    }
  },

  /**
   * Retrieves structured 6-stage real-time tracking information
   */
  async getOrderTracking(identifier: string) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: identifier }, { orderNumber: identifier }],
      },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const statusToStageIndex: Record<string, number> = {
      PLACED: 0,
      CONFIRMED: 1,
      PROCESSING: 2,
      PACKED: 2, // PACKED corresponds to Processing
      SHIPPED: 3,
      OUT_FOR_DELIVERY: 4,
      DELIVERED: 5,
    };

    const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
    const currentStageIndex = isCancelled ? -1 : (statusToStageIndex[order.status] ?? 0);

    const historyList: any[] = order.statusHistory || [];

    const stages = TRACKING_STAGES.map((stage, idx) => {
      const isCompleted = !isCancelled && currentStageIndex >= idx;
      const isCurrent = !isCancelled && currentStageIndex === idx;

      // Find matching history entry
      const match = historyList.find((h) => {
        if (stage.key === 'PROCESSING') {
          return h.toStatus === 'PROCESSING' || h.toStatus === 'PACKED';
        }
        return h.toStatus === stage.key;
      });

      let timestamp = match?.createdAt || null;
      if (!timestamp && isCompleted && idx === 0) {
        timestamp = order.createdAt;
      }

      return {
        key: stage.key,
        label: stage.label,
        desc: stage.desc,
        isCompleted,
        isCurrent,
        timestamp,
        note: match?.note || null,
      };
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber,
      status: order.status,
      currentStageIndex,
      isCancelled,
      cancellationStatus: order.cancellationStatus || 'NONE',
      cancellationReason: order.cancellationReason || null,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      deliveryType: order.deliveryType,
      deliverySlot: order.deliverySlot,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      carrier: order.carrier || 'FreshCart Express Gujarat',
      trackingNumber: order.trackingNumber || null,
      trackingNotes: order.trackingNotes || null,
      deliveryPersonId: order.deliveryPersonId || null,
      deliveryPersonName: order.deliveryPersonName || null,
      deliveryStatus: order.deliveryStatus || 'UNASSIGNED',
      assignedAt: order.assignedAt || null,
      acceptedAt: order.acceptedAt || null,
      pickedUpAt: order.pickedUpAt || null,
      outForDeliveryAt: order.outForDeliveryAt || null,
      deliveredAt: order.deliveredAt || null,
      deliveryLocation: order.deliveryLocation || null,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddressSnapshot,
      grandTotal: Number(order.grandTotal),
      subtotal: Number(order.subtotal),
      deliveryCharge: Number(order.deliveryCharge),
      discountTotal: Number(order.discountTotal),
      items: order.items,
      statusHistory: historyList,
      stages,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  },

  /**
   * Substitutes an item in an order with customer notification
   */
  async substituteItem(
    orderId: string,
    orderItemId: string,
    substituteProductId: string,
    substituteQuantity: number,
    note: string,
    adminUserId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const orderItem = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: { order: true },
      });

      if (!orderItem || orderItem.orderId !== orderId) {
        throw new AppError('Order item not found', 404);
      }

      if (orderItem.order.status !== 'CONFIRMED' && orderItem.order.status !== 'PACKED') {
        throw new AppError('Items can only be substituted while order is CONFIRMED or PACKED', 400);
      }

      // Restore old item stock
      const oldProduct = await tx.product.findUnique({ where: { id: orderItem.productId } });
      if (oldProduct) {
        const restoredOldStock = oldProduct.stockQty + orderItem.quantity;
        await tx.product.update({
          where: { id: orderItem.productId },
          data: { stockQty: restoredOldStock },
        });

        await tx.stockMovementLedger.create({
          data: {
            productId: orderItem.productId,
            type: 'RETURN',
            quantityChange: orderItem.quantity,
            balanceAfter: restoredOldStock,
            referenceType: 'ORDER_SUBSTITUTION',
            referenceId: orderItem.order.orderNumber,
            reason: `Item substitution return for order #${orderItem.order.orderNumber}: ${note}`,
            createdByUserId: adminUserId,
          },
        });
      }

      // Check and deduct replacement product stock
      const newProduct = await tx.product.findUnique({ where: { id: substituteProductId } });
      if (!newProduct) {
        throw new AppError('Replacement product not found', 404);
      }

      if (newProduct.stockQty < substituteQuantity) {
        throw new AppError(`Insufficient stock for replacement product "${newProduct.name}"`, 409);
      }

      const newBalance = newProduct.stockQty - substituteQuantity;
      await tx.product.update({
        where: { id: substituteProductId },
        data: { stockQty: newBalance },
      });

      await tx.stockMovementLedger.create({
        data: {
          productId: substituteProductId,
          type: 'SALE_DEDUCTION',
          quantityChange: -substituteQuantity,
          balanceAfter: newBalance,
          referenceType: 'ORDER_SUBSTITUTION',
          referenceId: orderItem.order.orderNumber,
          reason: `Item substitution issued for order #${orderItem.order.orderNumber}: ${note}`,
          createdByUserId: adminUserId,
        },
      });

      // Update order item
      const calc = calculateItemTaxInclusive({
        price: Number(newProduct.price),
        taxPercent: Number(newProduct.taxPercent),
        quantity: substituteQuantity,
      });

      const updatedOrderItem = await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          productId: newProduct.id,
          productName: newProduct.name,
          productSku: newProduct.sku,
          unit: newProduct.unit,
          unitPrice: calc.unitPrice,
          mrp: newProduct.mrp,
          taxPercent: calc.taxPercent,
          taxAmount: calc.taxAmount,
          quantity: substituteQuantity,
          lineTotal: calc.lineTotal,
          isSubstituted: true,
          substitutionNote: `Replaced "${orderItem.productName}" with "${newProduct.name}". Note: ${note}`,
        },
      });

      // Recalculate order totals
      const allItems = await tx.orderItem.findMany({ where: { orderId } });
      const newSubtotal = allItems.reduce((acc, it) => round2(acc + Number(it.lineTotal)), 0);
      const newTaxTotal = allItems.reduce((acc, it) => round2(acc + Number(it.taxAmount)), 0);
      const currentOrder = orderItem.order;
      const newGrandTotal = round2(
        Math.max(0, newSubtotal - Number(currentOrder.discountTotal) + Number(currentOrder.deliveryCharge))
      );

      await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: newSubtotal,
          taxTotal: newTaxTotal,
          grandTotal: newGrandTotal,
          statusHistory: {
            create: {
              fromStatus: currentOrder.status,
              toStatus: currentOrder.status,
              note: `Item substituted: "${orderItem.productName}" replaced with "${newProduct.name}". Reason: ${note}`,
              changedByUserId: adminUserId,
            },
          },
        },
      });

      return {
        updatedOrderItem,
        oldItemName: orderItem.productName,
        newItemName: newProduct.name,
      };
    }).then(async (result) => {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order) {
        notificationService.sendOrderNotification({
          toPhone: order.customerPhone,
          toEmail: order.customerEmail,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          type: 'ITEM_SUBSTITUTED',
          details: {
            oldItem: result.oldItemName,
            newItem: result.newItemName,
            note,
          },
        }).catch(() => {});
      }
      return result;
    });
  },

  /**
   * Marks Cash On Delivery as collected
   */
  async markCodCollected(orderId: string, adminUserId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Order not found', 404);

    return await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'COLLECTED',
        codCollectedAt: new Date(),
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: order.status,
            note: 'Cash On Delivery (COD) payment marked as collected',
            changedByUserId: adminUserId,
          },
        },
      },
    });
  },
};


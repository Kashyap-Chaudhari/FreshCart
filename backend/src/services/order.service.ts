import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import { calculateItemTaxInclusive, calculateOrderTotals, calculateCouponDiscount, round2 } from '../utils/calculation.util';
import { formatInvoiceNumber, formatOrderNumber } from '../utils/invoiceNumber.util';
import { notificationService } from './notification.service';
import { OrderStatus } from '@prisma/client';

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

    // Validate delivery area if delivery is selected
    if (deliveryType === 'DELIVERY') {
      const area = await prisma.deliveryArea.findUnique({
        where: { pincode: shippingAddress.pincode },
      });

      if (!area || !area.isDeliverable) {
        throw new AppError(`Delivery is not available in pincode ${shippingAddress.pincode}.`, 400);
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Sort product IDs to prevent deadlock between concurrent transactions
      const sortedItemInputs = [...items].sort((a, b) => a.productId.localeCompare(b.productId));

      // 2. Fetch delivery area rules for charges
      let deliveryCharge = 0;
      let minOrderValue = 0;
      if (deliveryType === 'DELIVERY') {
        const area = await tx.deliveryArea.findUnique({
          where: { pincode: shippingAddress.pincode },
        });
        if (area) {
          deliveryCharge = Number(area.deliveryCharge);
          minOrderValue = Number(area.minOrderValue);
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

      // 4. Calculate subtotal and validate minimum order value
      const rawSubtotal = processedItems.reduce((acc, cur) => round2(acc + cur.calc.lineTotal), 0);
      if (deliveryType === 'DELIVERY' && rawSubtotal < minOrderValue) {
        throw new AppError(
          `Minimum order value for pincode ${shippingAddress.pincode} is ₹${minOrderValue}. Your subtotal is ₹${rawSubtotal}.`,
          400
        );
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
      if (deliveryType === 'DELIVERY') {
        const area = await tx.deliveryArea.findUnique({
          where: { pincode: shippingAddress.pincode },
        });
        if (area?.freeDeliveryAbove && rawSubtotal >= Number(area.freeDeliveryAbove)) {
          deliveryCharge = 0;
        }
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

      // 9. Persist Order with complete address and item snapshots
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
            create: {
              fromStatus: null,
              toStatus: 'PLACED',
              note: 'Order successfully created',
              changedByUserId: userId || null,
            },
          },
        },
        include: {
          items: true,
          statusHistory: true,
        },
      });

      return order;
    }).then(async (order) => {
      // Dispatch notification asynchronously outside the critical DB transaction
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

      // Validate status: Only PLACED or CONFIRMED can be cancelled
      if (order.status !== OrderStatus.PLACED && order.status !== OrderStatus.CONFIRMED) {
        throw new AppError(
          `Cannot cancel order with status ${order.status}. Only PLACED or CONFIRMED orders can be cancelled.`,
          400
        );
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

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
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

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        ...(toStatus === 'DELIVERED' && { paymentStatus: 'COLLECTED', codCollectedAt: new Date() }),
        statusHistory: {
          create: {
            fromStatus: existing.status,
            toStatus,
            note: note || `Status updated to ${toStatus}`,
            changedByUserId: changedByUserId || null,
          },
        },
      },
      include: {
        items: true,
        statusHistory: true,
      },
    });

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

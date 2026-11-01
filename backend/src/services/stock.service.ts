import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import { StockMovementType } from '@prisma/client';

export interface StockAdjustmentInput {
  productId: string;
  quantityChange: number;
  type: StockMovementType;
  reason: string;
  userId?: string;
  referenceType?: string;
  referenceId?: string;
}

export const stockService = {
  /**
   * Adjusts product stock with row-level locking and records an immutable ledger entry.
   */
  async adjustStock(input: StockAdjustmentInput) {
    const { productId, quantityChange, type, reason, userId, referenceType = 'MANUAL', referenceId } = input;

    return await prisma.$transaction(async (tx) => {
      // Row-level lock on product
      const products: any[] = await tx.$queryRaw`
        SELECT id, name, "stockQty", "lowStockThreshold", "isAvailable"
        FROM products
        WHERE id = ${productId}
        FOR UPDATE
      `;

      if (!products || products.length === 0) {
        throw new AppError('Product not found for stock adjustment', 404);
      }

      const product = products[0];
      const newBalance = product.stockQty + quantityChange;

      if (newBalance < 0) {
        throw new AppError(`Cannot reduce stock below zero. Current stock is ${product.stockQty}, requested change is ${quantityChange}.`, 400);
      }

      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stockQty: newBalance,
          // If out of stock, optionally update isAvailable or leave it to manual toggle
        },
      });

      // Record in stock movement ledger
      const ledgerEntry = await tx.stockMovementLedger.create({
        data: {
          productId,
          type,
          quantityChange,
          balanceAfter: newBalance,
          reason,
          referenceType,
          referenceId,
          createdByUserId: userId || null,
        },
      });

      return {
        product: updatedProduct,
        ledgerEntry,
      };
    });
  },

  /**
   * Retrieves paginated stock movement ledger with filters
   */
  async getLedger(params: {
    productId?: string;
    type?: StockMovementType;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.productId) where.productId = params.productId;
    if (params.type) where.type = params.type;

    const [total, items] = await Promise.all([
      prisma.stockMovementLedger.count({ where }),
      prisma.stockMovementLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
          createdByUser: { select: { id: true, name: true, role: true } },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Retrieves low stock products (stock <= lowStockThreshold)
   */
  async getLowStockProducts() {
    return await prisma.$queryRaw`
      SELECT p.id, p.name, p.sku, p.unit, p."stockQty", p."lowStockThreshold", p.price, c.name as "categoryName"
      FROM products p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p."stockQty" <= p."lowStockThreshold"
      ORDER BY p."stockQty" ASC
    `;
  },
};


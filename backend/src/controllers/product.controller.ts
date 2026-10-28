import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { stockService } from '../services/stock.service';
import { auditService } from '../services/audit.service';
import { AppError } from '../middlewares/error.middleware';

export const productController = {
  /**
   * Public: List products with search, category filtering, in-stock filter, pagination
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const { category, search, inStock, sortBy, sortOrder } = req.query;

      const where: any = {
        isAvailable: true,
      };

      if (category) {
        where.category = { slug: String(category) };
      }

      if (inStock === 'true') {
        where.stockQty = { gt: 0 };
      }

      if (search) {
        const query = String(search).trim();
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ];
      }

      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'price') {
        orderBy = { price: sortOrder === 'desc' ? 'desc' : 'asc' };
      } else if (sortBy === 'name') {
        orderBy = { name: sortOrder === 'desc' ? 'desc' : 'asc' };
      }

      const [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        }),
      ]);

      res.json({
        success: true,
        data: products,
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
   * Public: Get single product by slug or ID
   */
  async getBySlugOrId(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier } = req.params;
      const product = await prisma.product.findFirst({
        where: {
          OR: [{ slug: identifier }, { id: identifier }],
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: List all products (including unavailable / low stock)
   */
  async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const { category, search, stockStatus } = req.query;
      const where: any = {};

      if (category) {
        where.categoryId = String(category);
      }

      if (search) {
        const query = String(search).trim();
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
        ];
      }

      if (stockStatus === 'out') {
        where.stockQty = { lte: 0 };
      } else if (stockStatus === 'low') {
        // Handled via raw or filter
      }

      const [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        }),
      ]);

      res.json({
        success: true,
        data: products,
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
   * Admin: Create new product
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        name,
        sku,
        description,
        unit,
        price,
        mrp,
        costPrice,
        taxPercent,
        stockQty,
        lowStockThreshold,
        isAvailable,
        images,
        categoryId,
      } = req.body;

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

      const product = await prisma.product.create({
        data: {
          name,
          slug,
          sku,
          description,
          unit,
          price,
          mrp,
          costPrice,
          taxPercent,
          stockQty,
          lowStockThreshold: lowStockThreshold ?? 10,
          isAvailable: isAvailable ?? true,
          images: images || [],
          categoryId,
        },
      });

      // Record initial stock in ledger if stockQty > 0
      if (stockQty > 0) {
        await prisma.stockMovementLedger.create({
          data: {
            productId: product.id,
            type: 'PURCHASE',
            quantityChange: stockQty,
            balanceAfter: stockQty,
            reason: 'Initial stock on product creation',
            referenceType: 'MANUAL',
            createdByUserId: req.user?.id,
          },
        });
      }

      await auditService.log({
        userId: req.user?.id,
        action: 'PRODUCT_CREATE',
        entity: 'Product',
        entityId: product.id,
        details: { sku: product.sku, name: product.name, price: product.price },
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Update product details
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) throw new AppError('Product not found', 404);

      const updated = await prisma.product.update({
        where: { id },
        data: req.body,
      });

      await auditService.log({
        userId: req.user?.id,
        action: 'PRODUCT_UPDATE',
        entity: 'Product',
        entityId: id,
        details: req.body,
        ipAddress: req.ip,
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Adjust stock with reason
   */
  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quantityChange, type, reason } = req.body;

      const result = await stockService.adjustStock({
        productId: id,
        quantityChange,
        type,
        reason,
        userId: req.user?.id,
      });

      await auditService.log({
        userId: req.user?.id,
        action: 'STOCK_ADJUSTMENT',
        entity: 'Product',
        entityId: id,
        details: { quantityChange, type, reason, newBalance: result.product.stockQty },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Get stock movement ledger
   */
  async getStockLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, type, page, limit } = req.query;
      const ledger = await stockService.getLedger({
        productId: productId as string,
        type: type as any,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      res.json({ success: true, ...ledger });
    } catch (err) {
      next(err);
    }
  },
};

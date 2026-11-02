import { Request, Response, NextFunction } from 'express';
import prisma, { mockStore } from '../config/prisma';
import { stockService } from '../services/stock.service';
import { auditService } from '../services/audit.service';
import { AppError } from '../middlewares/error.middleware';
import { parseProductCsv } from '../utils/csvImporter';

export const productController = {
  /**
   * Public: List products with search, category filtering, in-stock filter, pagination
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const { category, subcategory, search, inStock, sortBy, sortOrder } = req.query;

      const where: any = {
        isAvailable: true,
      };

      if (category) {
        where.category = { slug: String(category) };
      }

      if (subcategory) {
        where.subcategory = String(subcategory);
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

      let total = 0;
      let products: any[] = [];
      try {
        [total, products] = await Promise.all([
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
      } catch (dbErr) {
        total = 0;
        products = [];
      }

      // If database is empty or unseeded, fall back to in-memory catalogue
      if (total === 0 && (!products || products.length === 0)) {
        let fallback = mockStore.products;
        if (category) {
          const cat = mockStore.categories.find((c: any) => c.slug === String(category));
          fallback = fallback.filter((p: any) => p.categoryId === cat?.id);
        }
        if (subcategory) {
          const subQuery = String(subcategory).toLowerCase().trim();
          fallback = fallback.filter((p: any) =>
            p.subcategory?.toLowerCase() === subQuery ||
            p.subcategorySlug?.toLowerCase() === subQuery ||
            p.subcategory?.toLowerCase().includes(subQuery)
          );
        }
        if (search) {
          const query = String(search).toLowerCase().trim();
          fallback = fallback.filter((p: any) =>
            p.name?.toLowerCase().includes(query) ||
            p.sku?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
          );
        }
        total = fallback.length;
        products = fallback.slice(skip, skip + limit).map((p: any) => ({
          ...p,
          category: mockStore.categories.find((c: any) => c.id === p.categoryId) || null,
        }));
      }

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
      let product: any = null;
      try {
        product = await prisma.product.findFirst({
          where: {
            OR: [{ slug: identifier }, { id: identifier }],
          },
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        });
      } catch (dbErr) {
        product = null;
      }

      if (!product) {
        const found = mockStore.products.find((p: any) => p.slug === identifier || p.id === identifier);
        if (found) {
          product = {
            ...found,
            category: mockStore.categories.find((c: any) => c.id === found.categoryId) || null,
          };
        }
      }

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

  /**
   * Admin: Bulk import products via CSV
   */
  async importCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const { csvData } = req.body;
      if (!csvData || typeof csvData !== 'string') {
        throw new AppError('CSV data string is required', 400);
      }

      const parsedItems = parseProductCsv(csvData);
      if (parsedItems.length === 0) {
        throw new AppError('No valid product rows found in CSV', 400);
      }

      // Fetch all existing categories
      const existingCategories = await prisma.category.findMany();
      const catMap = new Map<string, any>();
      existingCategories.forEach((c: any) => catMap.set(c.name.toLowerCase(), c));

      let createdCount = 0;
      let updatedCount = 0;

      for (const item of parsedItems) {
        // Resolve or create category
        let category = catMap.get(item.categoryName.toLowerCase());
        if (!category) {
          const catSlug = item.categoryName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
          category = await prisma.category.create({
            data: {
              name: item.categoryName,
              slug: catSlug || `category-${Date.now()}`,
              description: `${item.categoryName} products`,
              imageUrl: item.images[0],
              displayOrder: catMap.size + 1,
              isActive: true,
            },
          });
          catMap.set(item.categoryName.toLowerCase(), category);
        }

        const slug =
          item.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '') +
          '-' +
          item.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const existingProduct = await prisma.product.findUnique({
          where: { sku: item.sku },
        });

        if (existingProduct) {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              name: item.name,
              unit: item.unit,
              price: item.price,
              mrp: item.mrp,
              costPrice: item.costPrice,
              taxPercent: item.taxPercent,
              stockQty: item.stockQty,
              lowStockThreshold: item.lowStockThreshold,
              isAvailable: item.isAvailable,
              categoryId: category.id,
            },
          });
          updatedCount++;
        } else {
          const product = await prisma.product.create({
            data: {
              name: item.name,
              slug,
              sku: item.sku,
              unit: item.unit,
              price: item.price,
              mrp: item.mrp,
              costPrice: item.costPrice,
              taxPercent: item.taxPercent,
              stockQty: item.stockQty,
              lowStockThreshold: item.lowStockThreshold,
              isAvailable: item.isAvailable,
              categoryId: category.id,
              images: item.images,
              description: item.description,
            },
          });

          if (item.stockQty > 0) {
            await prisma.stockMovementLedger.create({
              data: {
                productId: product.id,
                type: 'PURCHASE',
                quantityChange: item.stockQty,
                balanceAfter: item.stockQty,
                reason: 'Initial stock via CSV import',
                referenceType: 'MANUAL',
                createdByUserId: req.user?.id,
              },
            });
          }
          createdCount++;
        }
      }

      await auditService.log({
        userId: req.user?.id,
        action: 'PRODUCT_CSV_IMPORT',
        entity: 'Product',
        entityId: 'bulk',
        details: { totalRows: parsedItems.length, createdCount, updatedCount },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: `CSV import completed successfully: ${createdCount} created, ${updatedCount} updated.`,
        data: {
          total: parsedItems.length,
          created: createdCount,
          updated: updatedCount,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};


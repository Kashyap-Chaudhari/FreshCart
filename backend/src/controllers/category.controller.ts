import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';

export const categoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        include: {
          _count: {
            select: { products: { where: { isAvailable: true } } },
          },
        },
      });
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  },

  async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { displayOrder: 'asc' },
        include: {
          _count: { select: { products: true } },
        },
      });
      res.json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, imageUrl, displayOrder } = req.body;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description,
          imageUrl,
          displayOrder: displayOrder || 0,
        },
      });
      res.status(201).json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await prisma.category.update({
        where: { id },
        data: req.body,
      });
      res.json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  },
};

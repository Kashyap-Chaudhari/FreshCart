import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';

export const deliveryController = {
  /**
   * Public: Check serviceable pincode
   */
  async checkPincode(req: Request, res: Response, next: NextFunction) {
    try {
      const { pincode } = req.params;
      const area = await prisma.deliveryArea.findUnique({
        where: { pincode },
      });

      if (!area || !area.isDeliverable) {
        res.json({
          success: true,
          data: {
            isDeliverable: false,
            message: `Sorry, we currently do not deliver to PIN code ${pincode}.`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          isDeliverable: true,
          areaName: area.areaName,
          city: area.city,
          state: area.state,
          minOrderValue: Number(area.minOrderValue),
          deliveryCharge: Number(area.deliveryCharge),
          freeDeliveryAbove: area.freeDeliveryAbove ? Number(area.freeDeliveryAbove) : null,
          estimatedHours: area.estimatedDeliveryHours,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Public / Admin: List all active delivery areas
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const areas = await prisma.deliveryArea.findMany({
        where: req.user?.role ? undefined : { isDeliverable: true },
        orderBy: { pincode: 'asc' },
      });
      res.json({ success: true, data: areas });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Add new delivery area
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const area = await prisma.deliveryArea.create({
        data: req.body,
      });
      res.status(201).json({ success: true, data: area });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Update delivery area
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await prisma.deliveryArea.update({
        where: { id },
        data: req.body,
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};

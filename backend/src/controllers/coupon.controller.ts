import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { calculateCouponDiscount } from '../utils/calculation.util';
import { AppError } from '../middlewares/error.middleware';

export const couponController = {
  /**
   * Public / Customer: Validate coupon against cart subtotal
   */
  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, subtotal } = req.body;
      if (!code) throw new AppError('Coupon code is required', 400);

      const coupon = await prisma.coupon.findUnique({
        where: { code: code.trim().toUpperCase() },
      });

      if (!coupon || !coupon.isActive) {
        throw new AppError('Invalid or expired coupon code', 400);
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validTo) {
        throw new AppError('This coupon is no longer active', 400);
      }

      if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
        throw new AppError('This coupon has reached its maximum usage limit', 400);
      }

      const result = calculateCouponDiscount(
        Number(subtotal || 0),
        coupon.discountType,
        Number(coupon.discountValue),
        Number(coupon.minOrderValue),
        coupon.maxDiscount ? Number(coupon.maxDiscount) : null
      );

      if (!result.isValid) {
        throw new AppError(result.message || 'Coupon criteria not satisfied', 400);
      }

      res.json({
        success: true,
        message: 'Coupon applied successfully',
        data: {
          code: coupon.code,
          discountAmount: result.discountAmount,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: List all coupons
   */
  async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: coupons });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Create coupon
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, description, discountType, discountValue, minOrderValue, maxDiscount, validFrom, validTo, usageLimit } = req.body;

      const coupon = await prisma.coupon.create({
        data: {
          code: code.trim().toUpperCase(),
          description,
          discountType,
          discountValue,
          minOrderValue: minOrderValue || 0,
          maxDiscount: maxDiscount || null,
          validFrom: new Date(validFrom),
          validTo: new Date(validTo),
          usageLimit: usageLimit || null,
        },
      });

      res.status(201).json({ success: true, data: coupon });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin: Update coupon status or details
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await prisma.coupon.update({
        where: { id },
        data: req.body,
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};

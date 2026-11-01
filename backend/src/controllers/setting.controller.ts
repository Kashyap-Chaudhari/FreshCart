import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { auditService } from '../services/audit.service';

export const settingController = {
  /**
   * Public: Get store settings (name, address, hours, phone, email, banners)
   */
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      let settings = await prisma.storeSetting.findUnique({
        where: { id: 'default' },
      });

      if (!settings) {
        settings = await prisma.storeSetting.create({
          data: {
            id: 'default',
            storeName: 'FreshCart Supermarket',
            tagLine: 'Your Daily Fresh Grocery Partner',
            phone: '+91 98765 43210',
            email: 'support@freshcart.com',
            address: '123 Market Road, Koramangala, Bengaluru, Karnataka 560034',
            openingHours: 'Mon - Sun: 7:00 AM - 10:00 PM',
            gstin: '29AAAAA0000A1Z5',
            fssai: '11223344556677',
            invoicePrefix: 'INV-',
            invoiceNextNumber: 1001,
            minOrderValue: 199,
            defaultDeliveryCharge: 40,
            banners: [
              {
                id: 'banner-1',
                title: 'Farm Fresh Fruits & Vegetables',
                subtitle: 'Direct from local farms at wholesale prices',
                buttonText: 'Shop Fresh Now',
                link: '/products?category=fruits-vegetables',
                bgGradient: 'from-emerald-600 to-green-700',
              },
              {
                id: 'banner-2',
                title: 'Daily Essentials & Groceries',
                subtitle: 'Flat 15% OFF on first order with code FRESH15',
                buttonText: 'Explore Staples',
                link: '/products?category=staples-grains',
                bgGradient: 'from-amber-600 to-orange-700',
              },
            ],
          },
        });
      }

      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin (Owner Only): Update store settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await prisma.storeSetting.upsert({
        where: { id: 'default' },
        update: req.body,
        create: { id: 'default', ...req.body },
      });

      await auditService.log({
        userId: req.user?.id,
        action: 'STORE_SETTINGS_UPDATE',
        entity: 'StoreSetting',
        entityId: 'default',
        details: req.body,
        ipAddress: req.ip,
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
};


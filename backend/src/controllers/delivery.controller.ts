import { Request, Response, NextFunction } from 'express';
import { deliveryService } from '../services/delivery.service';
import { AppError } from '../middlewares/error.middleware';
import prisma from '../config/prisma';
import { resolveDeliveryArea, isGujaratPincode } from '../utils/gujaratDelivery';

export const deliveryController = {
  // ================= ADMIN ENDPOINTS =================

  async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await deliveryService.listDeliveryPersons();
      res.json({
        success: true,
        data: list,
      });
    } catch (err) {
      next(err);
    }
  },

  async adminCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, password, vehicleNumber, vehicleType } = req.body;
      if (!name || !email || !phone || !password) {
        throw new AppError('Name, email, phone, and password are required to create a delivery account.', 400);
      }

      const person = await deliveryService.createDeliveryPerson({
        name,
        email,
        phone,
        password,
        vehicleNumber,
        vehicleType,
      });

      res.status(201).json({
        success: true,
        message: `Delivery person "${person.name}" registered successfully.`,
        data: person,
      });
    } catch (err) {
      next(err);
    }
  },

  async adminUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await deliveryService.updateDeliveryPerson(id, req.body);
      res.json({
        success: true,
        message: 'Delivery person profile updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  async adminAssign(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId || req.params.id;
      const { deliveryPersonId } = req.body;
      const adminUserId = req.user?.id || 'admin';

      if (!deliveryPersonId || deliveryPersonId === 'auto') {
        const result = await deliveryService.autoAssignOrder(orderId, adminUserId);
        return res.json({
          success: true,
          message: result.message,
          order: result.order,
          deliveryPerson: result.deliveryPerson,
        });
      }

      const order = await deliveryService.assignOrder(orderId, deliveryPersonId, adminUserId);

      res.json({
        success: true,
        message: `Order #${order.orderNumber} successfully assigned to ${order.deliveryPersonName}.`,
        order,
      });
    } catch (err) {
      next(err);
    }
  },

  async adminAutoAssign(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId || req.params.id;
      const adminUserId = req.user?.id || 'admin';
      const result = await deliveryService.autoAssignOrder(orderId, adminUserId);

      res.json({
        success: true,
        message: result.message,
        order: result.order,
        deliveryPerson: result.deliveryPerson,
      });
    } catch (err) {
      next(err);
    }
  },

  async adminGetPersonHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await deliveryService.getDeliveryOrders(id, (req.query.filter as string) || 'ALL');
      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  // ================= DELIVERY PERSON ENDPOINTS =================

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, email, phone, password } = req.body;
      const loginId = identifier || email || phone;
      if (!loginId || !password) {
        throw new AppError('Email/phone and password are required for login.', 400);
      }

      const result = await deliveryService.login(loginId, password);
      res.json({
        success: true,
        message: 'Delivery login successful.',
        token: result.token,
        deliveryPerson: result.deliveryPerson,
      });
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const deliveryPersonId = req.user?.id;
      if (!deliveryPersonId) {
        throw new AppError('Unauthorized', 401);
      }

      const ordersData = await deliveryService.getDeliveryOrders(deliveryPersonId);
      res.json({
        success: true,
        data: {
          user: req.user,
          counters: ordersData.counters,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getAssignedOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const deliveryPersonId = req.user?.id;
      if (!deliveryPersonId) {
        throw new AppError('Unauthorized', 401);
      }

      const filter = (req.query.filter as string) || 'ALL';
      const result = await deliveryService.getDeliveryOrders(deliveryPersonId, filter);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async getOrderDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const deliveryPersonId = req.user?.id;
      if (!deliveryPersonId) {
        throw new AppError('Unauthorized', 401);
      }

      const orderId = req.params.orderId || req.params.id;
      const order = await deliveryService.getDeliveryOrderDetail(orderId, deliveryPersonId);

      res.json({
        success: true,
        order,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateDeliveryStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const deliveryPersonId = req.user?.id;
      if (!deliveryPersonId) {
        throw new AppError('Unauthorized', 401);
      }

      const orderId = req.params.orderId || req.params.id;
      const { status, deliveryLocation, failureReason, notes } = req.body;

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      const validStatuses = ['ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'];
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status "${status}". Allowed: ${validStatuses.join(', ')}`, 400);
      }

      const updatedOrder = await deliveryService.updateDeliveryStatus(
        orderId,
        deliveryPersonId,
        status as any,
        {
          deliveryLocation,
          failureReason,
          notes,
        }
      );

      res.json({
        success: true,
        message:
          status === 'DELIVERED'
            ? `Order #${updatedOrder.orderNumber} self-confirmed as DELIVERED successfully! (No OTP required)`
            : `Order #${updatedOrder.orderNumber} status updated to ${status}.`,
        order: updatedOrder,
      });
    } catch (err) {
      next(err);
    }
  },

  async claimOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const deliveryPersonId = req.user?.id;
      if (!deliveryPersonId) {
        throw new AppError('Unauthorized', 401);
      }
      const orderId = req.params.orderId || req.params.id;
      const updatedOrder = await deliveryService.updateDeliveryStatus(
        orderId,
        deliveryPersonId,
        'ACCEPTED'
      );
      res.json({
        success: true,
        message: `Order #${updatedOrder.orderNumber} successfully accepted and claimed for delivery!`,
        order: updatedOrder,
      });
    } catch (err) {
      next(err);
    }
  },

  // ================= PUBLIC PINCODE & AREAS ENDPOINTS =================

  async checkPincode(req: Request, res: Response, next: NextFunction) {
    try {
      const { pincode } = req.params;
      const cleanPincode = (pincode || '').trim();

      let area = await prisma.deliveryArea.findUnique({
        where: { pincode: cleanPincode },
      });

      if (!area) {
        area = resolveDeliveryArea(cleanPincode) as any;
      }

      const isGujarat =
        isGujaratPincode(cleanPincode) ||
        cleanPincode.startsWith('36') ||
        cleanPincode.startsWith('37') ||
        cleanPincode.startsWith('38') ||
        cleanPincode.startsWith('39');

      if (!area && !isGujarat) {
        res.json({
          success: true,
          data: {
            isDeliverable: false,
            message: `Sorry, PIN code ${cleanPincode} is currently outside our Gujarat express delivery network.`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          isDeliverable: true,
          pincode: cleanPincode,
          areaName: area?.areaName || 'Gujarat Express Delivery Zone',
          city: area?.city || 'Ahmedabad',
          state: area?.state || 'Gujarat',
          minOrderValue: area ? Number(area.minOrderValue) : 149,
          deliveryCharge: area ? Number(area.deliveryCharge) : 29,
          freeDeliveryAbove: area?.freeDeliveryAbove ? Number(area.freeDeliveryAbove) : 499,
          estimatedHours: area?.estimatedDeliveryHours || '10-15 Mins',
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async listAreas(req: Request, res: Response, next: NextFunction) {
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

  async createArea(req: Request, res: Response, next: NextFunction) {
    try {
      const area = await prisma.deliveryArea.create({
        data: req.body,
      });
      res.status(201).json({ success: true, data: area });
    } catch (err) {
      next(err);
    }
  },

  async updateArea(req: Request, res: Response, next: NextFunction) {
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

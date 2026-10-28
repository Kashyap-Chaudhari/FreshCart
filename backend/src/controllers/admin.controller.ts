import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { stockService } from '../services/stock.service';
import { auditService } from '../services/audit.service';
import { AppError } from '../middlewares/error.middleware';

export const adminController = {
  /**
   * Admin Dashboard KPIs and summary analytics
   */
  async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        todayOrdersCount,
        pendingOrdersCount,
        todayDeliveredOrders,
        lowStockItems,
        totalProductsCount,
        recentOrders,
      ] = await Promise.all([
        prisma.order.count({
          where: { createdAt: { gte: todayStart } },
        }),
        prisma.order.count({
          where: { status: { in: ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY'] } },
        }),
        prisma.order.findMany({
          where: {
            createdAt: { gte: todayStart },
            status: { notIn: ['CANCELLED', 'REJECTED'] },
          },
          select: { grandTotal: true },
        }),
        stockService.getLowStockProducts(),
        prisma.product.count({ where: { isAvailable: true } }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        }),
      ]);

      const todayRevenue = todayDeliveredOrders.reduce((acc, o) => acc + Number(o.grandTotal), 0);

      // Top products (last 30 days)
      const topItems = await prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      });

      res.json({
        success: true,
        data: {
          todayOrdersCount,
          pendingOrdersCount,
          todayRevenue: Math.round(todayRevenue * 100) / 100,
          lowStockAlertsCount: Array.isArray(lowStockItems) ? lowStockItems.length : 0,
          totalProductsCount,
          recentOrders,
          topProducts: topItems.map((item) => ({
            productId: item.productId,
            name: item.productName,
            unitsSold: item._sum.quantity || 0,
            revenue: Number(item._sum.lineTotal || 0),
          })),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin (Owner Only): List customers with pagination & search
   */
  async listCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const { search, isBlocked } = req.query;
      const where: any = { role: 'CUSTOMER' };

      if (isBlocked !== undefined) {
        where.isBlocked = isBlocked === 'true';
      }

      if (search) {
        const query = String(search).trim();
        where.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ];
      }

      const [total, customers] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isBlocked: true,
            createdAt: true,
            _count: { select: { orders: true } },
          },
        }),
      ]);

      res.json({
        success: true,
        data: customers,
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
   * Admin (Owner Only): Block or unblock a customer
   */
  async toggleBlockCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isBlocked, reason } = req.body;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) throw new AppError('User not found', 404);
      if (user.role === 'OWNER') throw new AppError('Cannot block Owner account', 400);

      const updated = await prisma.user.update({
        where: { id },
        data: { isBlocked: !!isBlocked },
      });

      await auditService.log({
        userId: req.user?.id,
        action: isBlocked ? 'CUSTOMER_BLOCKED' : 'CUSTOMER_UNBLOCKED',
        entity: 'User',
        entityId: id,
        details: { customerName: user.name, reason },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: `Customer ${user.name} has been ${isBlocked ? 'blocked' : 'unblocked'}.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin (Owner Only): List Audit Logs
   */
  async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const { action, entity } = req.query;
      const where: any = {};
      if (action) where.action = action;
      if (entity) where.entity = entity;

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        }),
      ]);

      res.json({
        success: true,
        data: logs,
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
   * Admin (Owner Only): Create Staff user
   */
  async createStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, password } = req.body;

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone }] },
      });
      if (existing) throw new AppError('Email or phone already in use', 400);

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const staff = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: 'STAFF',
        },
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      });

      await auditService.log({
        userId: req.user?.id,
        action: 'STAFF_USER_CREATED',
        entity: 'User',
        entityId: staff.id,
        details: { staffName: staff.name, email: staff.email },
        ipAddress: req.ip,
      });

      res.status(201).json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Admin (Owner Only): List Staff users
   */
  async listStaff(req: Request, res: Response, next: NextFunction) {
    try {
      const staffList = await prisma.user.findMany({
        where: { role: 'STAFF' },
        select: { id: true, name: true, email: true, phone: true, role: true, isBlocked: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: staffList });
    } catch (err) {
      next(err);
    }
  },
};

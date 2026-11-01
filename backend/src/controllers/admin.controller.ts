import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { stockService } from '../services/stock.service';
import { auditService } from '../services/audit.service';
import { AppError } from '../middlewares/error.middleware';

export const adminController = {
  /**
   * Admin Dashboard KPIs and summary analytics with rich chart datasets
   */
  async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      // Calculate start of day in Indian Standard Time (IST, UTC+5:30)
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + istOffsetMs);
      const todayIstStart = new Date(
        Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0) - istOffsetMs
      );
      // Fallback 24-hour window
      const last24hStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Fetch all orders with item details for comprehensive analytics
      const [allOrders, lowStockItems, totalProductsCount] = await Promise.all([
        prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          include: { items: true },
          take: 500,
        }),
        stockService.getLowStockProducts(),
        prisma.product.count({ where: { isAvailable: true } }),
      ]);

      // Filter today's orders (either today in IST calendar day or in past 24 hours)
      const todayOrders = allOrders.filter(
        (o) => new Date(o.createdAt) >= todayIstStart || new Date(o.createdAt) >= last24hStart
      );

      // Today's valid revenue (all placed/confirmed/delivered orders, excluding cancelled/rejected)
      const todayValidOrders = todayOrders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED');
      const todayRevenue = todayValidOrders.reduce((acc, o) => acc + Number(o.grandTotal || 0), 0);

      // All-time valid revenue
      const allValidOrders = allOrders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED');
      const totalRevenue = allValidOrders.reduce((acc, o) => acc + Number(o.grandTotal || 0), 0);

      // Delivered-only revenue
      const deliveredOrders = allOrders.filter((o) => o.status === 'DELIVERED' || o.deliveryStatus === 'DELIVERED');
      const deliveredRevenue = deliveredOrders.reduce((acc, o) => acc + Number(o.grandTotal || 0), 0);

      // Pending dispatch orders count
      const pendingOrdersCount = allOrders.filter((o) =>
        ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY'].includes(o.status)
      ).length;

      // Status breakdown
      const statusCounts: Record<string, { count: number; revenue: number }> = {
        DELIVERED: { count: 0, revenue: 0 },
        OUT_FOR_DELIVERY: { count: 0, revenue: 0 },
        PROCESSING: { count: 0, revenue: 0 },
        CONFIRMED: { count: 0, revenue: 0 },
        PLACED: { count: 0, revenue: 0 },
        CANCELLED: { count: 0, revenue: 0 },
      };

      allOrders.forEach((o) => {
        const amt = Number(o.grandTotal || 0);
        if (o.status in statusCounts) {
          statusCounts[o.status].count++;
          statusCounts[o.status].revenue += amt;
        } else if (o.status === 'PACKED' || o.status === 'SHIPPED') {
          statusCounts.PROCESSING.count++;
          statusCounts.PROCESSING.revenue += amt;
        } else if (o.status === 'REJECTED') {
          statusCounts.CANCELLED.count++;
          statusCounts.CANCELLED.revenue += amt;
        } else {
          statusCounts.PLACED.count++;
          statusCounts.PLACED.revenue += amt;
        }
      });

      const totalOrderCount = allOrders.length || 1;
      const orderStatusDistribution = [
        {
          key: 'DELIVERED',
          status: 'Delivered',
          count: statusCounts.DELIVERED.count,
          revenue: Math.round(statusCounts.DELIVERED.revenue * 100) / 100,
          percent: Math.round((statusCounts.DELIVERED.count / totalOrderCount) * 100),
          color: '#16a34a',
        },
        {
          key: 'OUT_FOR_DELIVERY',
          status: 'Out for Delivery',
          count: statusCounts.OUT_FOR_DELIVERY.count,
          revenue: Math.round(statusCounts.OUT_FOR_DELIVERY.revenue * 100) / 100,
          percent: Math.round((statusCounts.OUT_FOR_DELIVERY.count / totalOrderCount) * 100),
          color: '#0284c7',
        },
        {
          key: 'PROCESSING',
          status: 'Packed / Processing',
          count: statusCounts.PROCESSING.count,
          revenue: Math.round(statusCounts.PROCESSING.revenue * 100) / 100,
          percent: Math.round((statusCounts.PROCESSING.count / totalOrderCount) * 100),
          color: '#8b5cf6',
        },
        {
          key: 'CONFIRMED',
          status: 'Confirmed',
          count: statusCounts.CONFIRMED.count,
          revenue: Math.round(statusCounts.CONFIRMED.revenue * 100) / 100,
          percent: Math.round((statusCounts.CONFIRMED.count / totalOrderCount) * 100),
          color: '#3b82f6',
        },
        {
          key: 'PLACED',
          status: 'New Orders (Placed)',
          count: statusCounts.PLACED.count,
          revenue: Math.round(statusCounts.PLACED.revenue * 100) / 100,
          percent: Math.round((statusCounts.PLACED.count / totalOrderCount) * 100),
          color: '#f59e0b',
        },
        {
          key: 'CANCELLED',
          status: 'Cancelled / Rejected',
          count: statusCounts.CANCELLED.count,
          revenue: Math.round(statusCounts.CANCELLED.revenue * 100) / 100,
          percent: Math.round((statusCounts.CANCELLED.count / totalOrderCount) * 100),
          color: '#ef4444',
        },
      ];

      // Last 7 Days Revenue & Order Trends
      const revenueTrend: Array<{
        date: string;
        dayName: string;
        revenue: number;
        orders: number;
        deliveredOrders: number;
      }> = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        const dayOrders = allOrders.filter((o) => {
          const ot = new Date(o.createdAt).getTime();
          return ot >= dayStart.getTime() && ot <= dayEnd.getTime();
        });

        const dayValidOrders = dayOrders.filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED');
        const dayRev = dayValidOrders.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
        const dayDelivered = dayOrders.filter((o) => o.status === 'DELIVERED').length;

        revenueTrend.push({
          date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
          revenue: Math.round(dayRev * 100) / 100,
          orders: dayOrders.length,
          deliveredOrders: dayDelivered,
        });
      }

      // If today's trend slot is 0 but we have todayOrders, populate today's slot with today's real numbers
      if (revenueTrend[revenueTrend.length - 1].orders === 0 && todayOrders.length > 0) {
        revenueTrend[revenueTrend.length - 1].orders = todayOrders.length;
        revenueTrend[revenueTrend.length - 1].revenue = Math.round(todayRevenue * 100) / 100;
        revenueTrend[revenueTrend.length - 1].deliveredOrders = todayOrders.filter((o) => o.status === 'DELIVERED').length;
      }

      // Category Sales Share
      const categoryMap: Record<string, { name: string; revenue: number; itemsCount: number }> = {
        Vegetables: { name: 'Fresh Vegetables', revenue: 0, itemsCount: 0 },
        Fruits: { name: 'Fresh Fruits', revenue: 0, itemsCount: 0 },
        Dairy: { name: 'Dairy & Eggs', revenue: 0, itemsCount: 0 },
        Staples: { name: 'Atta, Rice & Staples', revenue: 0, itemsCount: 0 },
        Snacks: { name: 'Snacks & Packaged Food', revenue: 0, itemsCount: 0 },
        Beverages: { name: 'Tea, Coffee & Drinks', revenue: 0, itemsCount: 0 },
      };

      allValidOrders.forEach((ord) => {
        (ord.items || []).forEach((it: any) => {
          const n = (it.productName || '').toLowerCase();
          const lineVal = Number(it.lineTotal || 0);
          const q = Number(it.quantity || 1);

          if (n.includes('atta') || n.includes('rice') || n.includes('dal') || n.includes('sugar') || n.includes('oil')) {
            categoryMap.Staples.revenue += lineVal;
            categoryMap.Staples.itemsCount += q;
          } else if (n.includes('milk') || n.includes('curd') || n.includes('butter') || n.includes('paneer') || n.includes('egg')) {
            categoryMap.Dairy.revenue += lineVal;
            categoryMap.Dairy.itemsCount += q;
          } else if (n.includes('apple') || n.includes('banana') || n.includes('mango') || n.includes('orange') || n.includes('grape')) {
            categoryMap.Fruits.revenue += lineVal;
            categoryMap.Fruits.itemsCount += q;
          } else if (n.includes('tea') || n.includes('coffee') || n.includes('juice') || n.includes('soda') || n.includes('drink')) {
            categoryMap.Beverages.revenue += lineVal;
            categoryMap.Beverages.itemsCount += q;
          } else if (n.includes('biscuit') || n.includes('chip') || n.includes('noodle') || n.includes('maggi') || n.includes('snack')) {
            categoryMap.Snacks.revenue += lineVal;
            categoryMap.Snacks.itemsCount += q;
          } else {
            categoryMap.Vegetables.revenue += lineVal;
            categoryMap.Vegetables.itemsCount += q;
          }
        });
      });

      const totalCatRevenue = Object.values(categoryMap).reduce((sum, c) => sum + c.revenue, 0) || 1;
      const categoryColors = ['#16a34a', '#eab308', '#3b82f6', '#f97316', '#a855f7', '#06b6d4'];
      const categoryBreakdown = Object.values(categoryMap).map((cat, idx) => ({
        ...cat,
        revenue: Math.round(cat.revenue * 100) / 100,
        sharePercent: Math.round((cat.revenue / totalCatRevenue) * 100),
        color: categoryColors[idx % categoryColors.length],
      }));

      // Payment Method Distribution
      const codOrders = allValidOrders.filter((o) => (o.paymentMethod || '').toUpperCase() === 'COD');
      const onlineOrders = allValidOrders.filter((o) => (o.paymentMethod || '').toUpperCase() !== 'COD');
      const codRevenue = codOrders.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
      const onlineRevenue = onlineOrders.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);

      const paymentMethodSplit = [
        {
          method: 'Cash on Delivery (COD)',
          orders: codOrders.length,
          revenue: Math.round(codRevenue * 100) / 100,
          percent: allValidOrders.length ? Math.round((codOrders.length / allValidOrders.length) * 100) : 50,
          color: '#10b981',
        },
        {
          method: 'Online UPI / Card / NetBanking',
          orders: onlineOrders.length,
          revenue: Math.round(onlineRevenue * 100) / 100,
          percent: allValidOrders.length ? Math.round((onlineOrders.length / allValidOrders.length) * 100) : 50,
          color: '#6366f1',
        },
      ];

      // Hourly velocity (24 slots)
      const hourlySlots = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        hourNum: i,
        orders: 0,
        revenue: 0,
      }));

      todayOrders.forEach((o) => {
        const h = new Date(o.createdAt).getHours();
        if (hourlySlots[h]) {
          hourlySlots[h].orders++;
          if (o.status !== 'CANCELLED' && o.status !== 'REJECTED') {
            hourlySlots[h].revenue += Number(o.grandTotal || 0);
          }
        }
      });

      // Top products (last 30 days)
      const topItems = await prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 6,
      });

      const averageOrderValue = allValidOrders.length
        ? Math.round((totalRevenue / allValidOrders.length) * 100) / 100
        : 0;

      const successRate = allOrders.length
        ? Math.round((deliveredOrders.length / allOrders.length) * 100)
        : 100;

      res.json({
        success: true,
        data: {
          todayOrdersCount: todayOrders.length,
          pendingOrdersCount,
          todayRevenue: Math.round(todayRevenue * 100) / 100,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          deliveredRevenue: Math.round(deliveredRevenue * 100) / 100,
          totalOrdersCount: allOrders.length,
          averageOrderValue,
          deliverySuccessRate: successRate,
          lowStockAlertsCount: Array.isArray(lowStockItems) ? lowStockItems.length : 0,
          totalProductsCount,
          recentOrders: allOrders.slice(0, 10),
          revenueTrend,
          orderStatusDistribution,
          categoryBreakdown,
          paymentMethodSplit,
          hourlyVelocity: hourlySlots.filter((s) => s.hourNum >= 6 && s.hourNum <= 23),
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


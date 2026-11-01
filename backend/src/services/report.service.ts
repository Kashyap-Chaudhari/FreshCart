import prisma from '../config/prisma';

export const reportService = {
  /**
   * Sales report aggregated by day, week, or month
   */
  async getSalesReport(period: 'day' | 'week' | 'month' = 'day', startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Query delivered & confirmed orders within range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { notIn: ['CANCELLED', 'REJECTED'] },
      },
      select: {
        id: true,
        orderNumber: true,
        subtotal: true,
        taxTotal: true,
        discountTotal: true,
        deliveryCharge: true,
        grandTotal: true,
        paymentStatus: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<
      string,
      {
        date: string;
        orderCount: number;
        grossSales: number;
        discounts: number;
        taxes: number;
        deliveryCharges: number;
        netRevenue: number;
      }
    > = {};

    for (const order of orders) {
      const d = new Date(order.createdAt);
      let key = d.toISOString().split('T')[0]; // Daily default

      if (period === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'week') {
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          orderCount: 0,
          grossSales: 0,
          discounts: 0,
          taxes: 0,
          deliveryCharges: 0,
          netRevenue: 0,
        };
      }

      grouped[key].orderCount += 1;
      grouped[key].grossSales += Number(order.subtotal);
      grouped[key].discounts += Number(order.discountTotal);
      grouped[key].taxes += Number(order.taxTotal);
      grouped[key].deliveryCharges += Number(order.deliveryCharge);
      grouped[key].netRevenue += Number(order.grandTotal);
    }

    const data = Object.values(grouped);
    const summary = {
      totalOrders: orders.length,
      totalGrossSales: data.reduce((acc, c) => acc + c.grossSales, 0),
      totalDiscounts: data.reduce((acc, c) => acc + c.discounts, 0),
      totalTaxes: data.reduce((acc, c) => acc + c.taxes, 0),
      totalNetRevenue: data.reduce((acc, c) => acc + c.netRevenue, 0),
    };

    return { data, summary };
  },

  /**
   * Sales breakdown by Product & Category
   */
  async getSalesByProduct(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: start, lte: end },
          status: { notIn: ['CANCELLED', 'REJECTED'] },
        },
      },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    const productMap: Record<
      string,
      {
        productId: string;
        name: string;
        sku: string;
        category: string;
        unitsSold: number;
        revenue: number;
      }
    > = {};

    for (const item of items) {
      const pid = item.productId;
      if (!productMap[pid]) {
        productMap[pid] = {
          productId: pid,
          name: item.productName,
          sku: item.productSku,
          category: item.product?.category?.name || 'Uncategorized',
          unitsSold: 0,
          revenue: 0,
        };
      }
      productMap[pid].unitsSold += item.quantity;
      productMap[pid].revenue += Number(item.lineTotal);
    }

    const products = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

    // Also group by Category
    const categoryMap: Record<string, { category: string; unitsSold: number; revenue: number }> = {};
    for (const p of products) {
      if (!categoryMap[p.category]) {
        categoryMap[p.category] = { category: p.category, unitsSold: 0, revenue: 0 };
      }
      categoryMap[p.category].unitsSold += p.unitsSold;
      categoryMap[p.category].revenue += p.revenue;
    }

    return {
      products,
      categories: Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue),
    };
  },

  /**
   * Cash on Delivery (COD) collection audit report
   */
  async getCodCollectionReport(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        paymentMethod: 'COD',
      },
      select: {
        id: true,
        orderNumber: true,
        invoiceNumber: true,
        customerName: true,
        customerPhone: true,
        grandTotal: true,
        paymentStatus: true,
        status: true,
        codCollectedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const collected = orders.filter((o) => o.paymentStatus === 'COLLECTED');
    const pending = orders.filter((o) => o.paymentStatus === 'PENDING' && o.status !== 'CANCELLED' && o.status !== 'REJECTED');

    return {
      orders,
      summary: {
        totalCodOrders: orders.length,
        collectedCount: collected.length,
        collectedAmount: collected.reduce((acc, o) => acc + Number(o.grandTotal), 0),
        pendingCount: pending.length,
        pendingAmount: pending.reduce((acc, o) => acc + Number(o.grandTotal), 0),
      },
    };
  },

  /**
   * Cancelled and rejected orders analysis with reasons
   */
  async getCancelledOrdersReport(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const cancelledOrders = await prisma.order.findMany({
      where: {
        status: { in: ['CANCELLED', 'REJECTED'] },
        createdAt: { gte: start, lte: end },
      },
      include: {
        items: true,
      },
      orderBy: { cancelledAt: 'desc' },
    });

    const reasonCount: Record<string, number> = {};
    for (const o of cancelledOrders) {
      const r = o.cancellationReason || 'Unspecified';
      reasonCount[r] = (reasonCount[r] || 0) + 1;
    }

    return {
      orders: cancelledOrders,
      totalCancelled: cancelledOrders.length,
      lostRevenue: cancelledOrders.reduce((acc, o) => acc + Number(o.grandTotal), 0),
      reasonBreakdown: reasonCount,
    };
  },

  /**
   * Current stock valuation report (Units, Cost valuation, Retail valuation)
   */
  async getStockValuationReport() {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { stockQty: 'desc' },
    });

    let totalQuantity = 0;
    let totalRetailValue = 0;
    let totalCostValue = 0;

    const items = products.map((p) => {
      const qty = p.stockQty;
      const price = Number(p.price);
      const cost = p.costPrice ? Number(p.costPrice) : price * 0.75; // 25% margin default if costPrice not set
      const retailVal = qty * price;
      const costVal = qty * cost;

      totalQuantity += qty;
      totalRetailValue += retailVal;
      totalCostValue += costVal;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category.name,
        stockQty: qty,
        unitPrice: price,
        costPrice: cost,
        retailValue: retailVal,
        costValue: costVal,
        isLowStock: qty <= p.lowStockThreshold,
      };
    });

    return {
      items,
      summary: {
        totalProducts: products.length,
        totalQuantity,
        totalRetailValue: Math.round(totalRetailValue * 100) / 100,
        totalCostValue: Math.round(totalCostValue * 100) / 100,
        potentialProfit: Math.round((totalRetailValue - totalCostValue) * 100) / 100,
      },
    };
  },
};


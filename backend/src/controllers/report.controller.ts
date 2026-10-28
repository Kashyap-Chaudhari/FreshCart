import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';

export const reportController = {
  async getSales(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, startDate, endDate } = req.query;
      const start = startDate ? new Date(String(startDate)) : undefined;
      const end = endDate ? new Date(String(endDate)) : undefined;

      const report = await reportService.getSalesReport(
        (period as any) || 'day',
        start,
        end
      );
      res.json({ success: true, ...report });
    } catch (err) {
      next(err);
    }
  },

  async getSalesByProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(String(startDate)) : undefined;
      const end = endDate ? new Date(String(endDate)) : undefined;

      const report = await reportService.getSalesByProduct(start, end);
      res.json({ success: true, ...report });
    } catch (err) {
      next(err);
    }
  },

  async getCodReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(String(startDate)) : undefined;
      const end = endDate ? new Date(String(endDate)) : undefined;

      const report = await reportService.getCodCollectionReport(start, end);
      res.json({ success: true, ...report });
    } catch (err) {
      next(err);
    }
  },

  async getCancelledReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(String(startDate)) : undefined;
      const end = endDate ? new Date(String(endDate)) : undefined;

      const report = await reportService.getCancelledOrdersReport(start, end);
      res.json({ success: true, ...report });
    } catch (err) {
      next(err);
    }
  },

  async getStockValuation(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.getStockValuationReport();
      res.json({ success: true, ...report });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Export Sales Report as CSV
   */
  async exportSalesCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const { period, startDate, endDate } = req.query;
      const report = await reportService.getSalesReport(
        (period as any) || 'day',
        startDate ? new Date(String(startDate)) : undefined,
        endDate ? new Date(String(endDate)) : undefined
      );

      let csv = 'Period,Order Count,Gross Sales (INR),Discounts (INR),Taxes (INR),Delivery Charges (INR),Net Revenue (INR)\n';
      for (const row of report.data) {
        csv += `"${row.date}",${row.orderCount},${row.grossSales.toFixed(2)},${row.discounts.toFixed(2)},${row.taxes.toFixed(2)},${row.deliveryCharges.toFixed(2)},${row.netRevenue.toFixed(2)}\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.csv"');
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Export Stock Valuation Report as CSV
   */
  async exportStockCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.getStockValuationReport();

      let csv = 'SKU,Product Name,Category,Stock Qty,Unit Selling Price (INR),Estimated Cost (INR),Retail Valuation (INR),Cost Valuation (INR),Low Stock Alert\n';
      for (const item of report.items) {
        csv += `"${item.sku}","${item.name.replace(/"/g, '""')}","${item.category}",${item.stockQty},${item.unitPrice.toFixed(2)},${item.costPrice.toFixed(2)},${item.retailValue.toFixed(2)},${item.costValue.toFixed(2)},${item.isLowStock ? 'YES' : 'NO'}\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="stock_valuation_report.csv"');
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  },
};

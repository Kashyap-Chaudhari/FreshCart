import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { invoiceService } from '../services/invoice.service';
import { AppError } from '../middlewares/error.middleware';
import { formatCreditNoteNumber } from '../utils/invoiceNumber.util';

export const invoiceController = {
  /**
   * GET /api/invoices/:id
   * Structured JSON representation of the GST tax invoice calculation
   */
  async getInvoiceData(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await invoiceService.getInvoiceData(id);
      res.json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/invoices/:id/pdf
   * Streams authentic A4 GST Tax Invoice PDF
   */
  async downloadInvoicePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pdfDoc = await invoiceService.generateInvoicePdf(id);

      const safeName = id.replace(/[/\\?%*:|"<>]/g, '-');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Tax-Invoice-${safeName}.pdf"`);
      pdfDoc.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/invoices/:id/print
   * HTML view styled for 1-click browser printing
   */
  async printInvoiceHtml(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const html = await invoiceService.generateInvoiceHtml(id);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/invoices
   * Admin paginated list of all generated GST invoices with filters
   */
  async adminListInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const fromDate = req.query.fromDate as string;
      const toDate = req.query.toDate as string;

      const where: any = {};
      if (status && status !== 'ALL') where.status = status;
      if (search) where.search = search;
      if (fromDate) {
        where.createdAt = where.createdAt || {};
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        where.createdAt = where.createdAt || {};
        where.createdAt.lte = new Date(toDate);
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.invoice.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          invoices,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/invoices/stats
   * Comprehensive GST analytics for Admin
   */
  async adminGetInvoiceStats(req: Request, res: Response, next: NextFunction) {
    try {
      const allInvoices = await prisma.invoice.findMany({ take: 10000 });
      const creditNotes = await prisma.creditNote.findMany({ take: 10000 });

      let totalTaxableTurnover = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;
      let totalGrossInvoiced = 0;

      for (const inv of allInvoices) {
        totalTaxableTurnover += Number(inv.taxableAmount || 0);
        totalCgst += Number(inv.cgstAmount || 0);
        totalSgst += Number(inv.sgstAmount || 0);
        totalIgst += Number(inv.igstAmount || 0);
        totalGrossInvoiced += Number(inv.grandTotal || 0);
      }

      let totalRefundAmount = 0;
      let totalTaxReversed = 0;
      for (const cn of creditNotes) {
        totalRefundAmount += Number(cn.refundAmount || 0);
        totalTaxReversed += Number(cn.taxReversed || 0);
      }

      res.json({
        success: true,
        data: {
          totalInvoices: allInvoices.length,
          activeInvoices: allInvoices.filter((i: any) => i.status === 'ISSUED').length,
          creditNoteInvoices: allInvoices.filter((i: any) => i.status === 'CREDIT_NOTE_ISSUED').length,
          totalGrossInvoiced: Math.round(totalGrossInvoiced * 100) / 100,
          totalTaxableTurnover: Math.round(totalTaxableTurnover * 100) / 100,
          totalCgst: Math.round(totalCgst * 100) / 100,
          totalSgst: Math.round(totalSgst * 100) / 100,
          totalIgst: Math.round(totalIgst * 100) / 100,
          totalTaxCollected: Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100,
          totalCreditNotes: creditNotes.length,
          totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
          totalTaxReversed: Math.round(totalTaxReversed * 100) / 100,
          netTaxableTurnover: Math.round((totalTaxableTurnover - (totalRefundAmount - totalTaxReversed)) * 100) / 100,
          netTaxCollected: Math.round((totalCgst + totalSgst + totalIgst - totalTaxReversed) * 100) / 100,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/invoices/:id/credit-note
   * Legally issues a GST Credit Note under Section 34 of CGST Act for an existing invoice
   */
  async adminIssueCreditNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason = 'Order cancellation or return refund' } = req.body;

      const invoice = await prisma.invoice.findFirst({
        where: {
          OR: [{ id }, { invoiceNumber: id }, { orderId: id }, { orderNumber: id }],
        },
      });

      if (!invoice) {
        throw new AppError('Invoice not found to issue credit note against', 404);
      }

      const existingCn = await prisma.creditNote.findFirst({
        where: {
          OR: [{ invoiceNumber: invoice.invoiceNumber }, { orderId: invoice.orderId }],
        },
      });

      if (existingCn) {
        return res.json({
          success: true,
          message: 'Credit note has already been issued for this invoice',
          data: existingCn,
        });
      }

      const count = await prisma.creditNote.count();
      const creditNoteNumber = formatCreditNoteNumber(count + 101);

      const cn = await prisma.creditNote.create({
        data: {
          id: `cn-${Date.now()}-${invoice.orderId}`,
          creditNoteNumber,
          invoiceNumber: invoice.invoiceNumber,
          orderId: invoice.orderId,
          orderNumber: invoice.orderNumber,
          reason,
          refundAmount: invoice.grandTotal,
          taxReversed: (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0),
          status: 'ISSUED',
          createdAt: new Date(),
        },
      });

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'CREDIT_NOTE_ISSUED',
          creditNoteNumber,
        },
      });

      res.status(201).json({
        success: true,
        message: `GST Credit Note ${creditNoteNumber} issued successfully under Section 34 of CGST Act`,
        data: cn,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/invoices/credit-notes
   * Admin list of all issued credit notes
   */
  async adminListCreditNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) where.search = search;

      const [creditNotes, total] = await Promise.all([
        prisma.creditNote.findMany({
          where,
          skip,
          take: limit,
        }),
        prisma.creditNote.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          creditNotes,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/invoices/credit-notes/:identifier/pdf
   * Streams authentic GST Credit Note PDF
   */
  async downloadCreditNotePdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier } = req.params;
      const reason = (req.query.reason as string) || 'Order Cancellation / Return Credit Reversal';

      const pdfDoc = await invoiceService.generateCreditNotePdf(identifier, reason);

      const safeName = identifier.replace(/[/\\?%*:|"<>]/g, '-');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Credit-Note-${safeName}.pdf"`);
      pdfDoc.pipe(res);
    } catch (err) {
      next(err);
    }
  },
};


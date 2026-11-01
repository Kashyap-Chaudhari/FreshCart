import { Router } from 'express';
import { invoiceController } from '../controllers/invoice.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// 1. Admin KPI analytics & Credit Notes list
router.get('/stats', authenticate, requireRole(['OWNER', 'STAFF']), invoiceController.adminGetInvoiceStats);
router.get('/credit-notes', authenticate, requireRole(['OWNER', 'STAFF']), invoiceController.adminListCreditNotes);
router.get('/credit-notes/:identifier/pdf', optionalAuthenticate, invoiceController.downloadCreditNotePdf);

// 2. Specific invoice actions
router.post('/:id/credit-note', authenticate, requireRole(['OWNER', 'STAFF']), invoiceController.adminIssueCreditNote);
router.get('/:id/pdf', optionalAuthenticate, invoiceController.downloadInvoicePdf);
router.get('/:id/print', optionalAuthenticate, invoiceController.printInvoiceHtml);
router.get('/:id', optionalAuthenticate, invoiceController.getInvoiceData);

// 3. Admin list all invoices
router.get('/', authenticate, requireRole(['OWNER', 'STAFF']), invoiceController.adminListInvoices);

export default router;


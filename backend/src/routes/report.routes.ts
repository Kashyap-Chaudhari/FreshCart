import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, requireRole(['OWNER', 'STAFF']));

router.get('/sales', reportController.getSales);
router.get('/sales-by-product', reportController.getSalesByProduct);
router.get('/cod-collection', reportController.getCodReport);
router.get('/cancelled-orders', reportController.getCancelledReport);
router.get('/stock-valuation', reportController.getStockValuation);

// CSV Exports
router.get('/export/sales-csv', reportController.exportSalesCsv);
router.get('/export/stock-csv', reportController.exportStockCsv);

export default router;

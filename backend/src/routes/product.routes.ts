import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  stockAdjustmentSchema,
} from '../validators/product.validator';

const router = Router();

// Public routes
router.get('/', productController.list);
router.get('/:identifier', productController.getBySlugOrId);

// Admin / Staff routes
router.get('/admin/all', authenticate, requireRole(['OWNER', 'STAFF']), productController.adminList);
router.post('/', authenticate, requireRole(['OWNER', 'STAFF']), validate({ body: createProductSchema }), productController.create);
router.patch('/:id', authenticate, requireRole(['OWNER', 'STAFF']), validate({ body: updateProductSchema }), productController.update);
router.post('/:id/adjust-stock', authenticate, requireRole(['OWNER', 'STAFF']), validate({ body: stockAdjustmentSchema }), productController.adjustStock);
router.get('/admin/stock-ledger', authenticate, requireRole(['OWNER', 'STAFF']), productController.getStockLedger);

export default router;

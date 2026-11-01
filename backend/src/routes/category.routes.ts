import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Public
router.get('/', categoryController.list);

// Admin
router.get('/admin/all', authenticate, requireRole(['OWNER', 'STAFF']), categoryController.adminList);
router.post('/', authenticate, requireRole(['OWNER', 'STAFF']), categoryController.create);
router.patch('/:id', authenticate, requireRole(['OWNER', 'STAFF']), categoryController.update);

export default router;


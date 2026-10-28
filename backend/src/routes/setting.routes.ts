import { Router } from 'express';
import { settingController } from '../controllers/setting.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Public: view store info
router.get('/', settingController.getSettings);

// Admin (Owner Only)
router.put('/', authenticate, requireRole('OWNER'), settingController.updateSettings);

export default router;

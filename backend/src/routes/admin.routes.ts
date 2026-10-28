import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Dashboard KPI metrics - Owner & Staff
router.get('/dashboard-summary', authenticate, requireRole(['OWNER', 'STAFF']), adminController.getDashboardSummary);

// Customers management - Owner Only
router.get('/customers', authenticate, requireRole('OWNER'), adminController.listCustomers);
router.post('/customers/:id/toggle-block', authenticate, requireRole('OWNER'), adminController.toggleBlockCustomer);

// Staff management - Owner Only
router.get('/staff', authenticate, requireRole('OWNER'), adminController.listStaff);
router.post('/staff', authenticate, requireRole('OWNER'), adminController.createStaff);

// Audit logs - Owner Only
router.get('/audit-logs', authenticate, requireRole('OWNER'), adminController.listAuditLogs);

export default router;

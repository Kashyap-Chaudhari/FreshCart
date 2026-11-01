import prisma from '../config/prisma';
import { logger } from '../utils/logger';

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string;
}

export const auditService = {
  async log(data: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId || null,
          details: data.details || {},
          ipAddress: data.ipAddress || null,
        },
      });
    } catch (err: any) {
      logger.error('Failed to persist audit log entry:', err);
    }
  },
};


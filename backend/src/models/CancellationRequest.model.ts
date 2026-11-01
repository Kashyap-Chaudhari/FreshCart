export type CancellationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ICancellationRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  reason: string;
  status: CancellationRequestStatus;
  requestedAt: Date;
  reviewedAt?: Date | null;
  reviewedByUserId?: string | null;
  reviewNote?: string | null;
}

export const CancellationRequestMongoSchema = {
  name: 'CancellationRequest',
  indexes: [
    { orderId: 1 },
    { orderNumber: 1 },
    { status: 1 },
    { requestedAt: -1 },
  ],
  validation: {
    orderId: { type: 'String', required: true },
    orderNumber: { type: 'String', required: true },
    reason: { type: 'String', required: true },
    status: {
      type: 'String',
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    requestedAt: { type: 'Date', default: 'Date.now' },
  },
};


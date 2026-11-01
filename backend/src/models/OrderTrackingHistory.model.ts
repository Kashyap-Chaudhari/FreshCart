import { OrderStatusType } from './Order.model';

export interface IOrderTrackingHistory {
  id: string;
  orderId: string;
  orderNumber: string;
  fromStatus?: OrderStatusType | null;
  toStatus: OrderStatusType;
  stageName: string;
  note?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  location?: string | null;
  changedByUserId?: string | null;
  changedByRole?: 'OWNER' | 'STAFF' | 'CUSTOMER' | 'SYSTEM';
  createdAt: Date;
}

export const OrderTrackingHistoryMongoSchema = {
  name: 'OrderTrackingHistory',
  indexes: [
    { orderId: 1, createdAt: 1 },
    { orderNumber: 1 },
    { toStatus: 1 },
  ],
  validation: {
    orderId: { type: 'String', required: true },
    toStatus: {
      type: 'String',
      enum: ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'],
      required: true,
    },
    stageName: { type: 'String', required: true },
    createdAt: { type: 'Date', default: 'Date.now' },
  },
};


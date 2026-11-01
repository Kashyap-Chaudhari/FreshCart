export type NotificationRecipientType = 'ADMIN' | 'CUSTOMER';

export type NotificationType =
  | 'NEW_ORDER'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'CANCEL_REQUEST'
  | 'ITEM_SUBSTITUTED';

export interface INotification {
  id: string;
  recipientType: NotificationRecipientType;
  userId?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export const NotificationMongoSchema = {
  name: 'Notification',
  indexes: [
    { recipientType: 1, isRead: 1, createdAt: -1 },
    { userId: 1, createdAt: -1 },
    { orderId: 1 },
  ],
  validation: {
    recipientType: { type: 'String', enum: ['ADMIN', 'CUSTOMER'], required: true },
    title: { type: 'String', required: true },
    message: { type: 'String', required: true },
    type: { type: 'String', required: true },
    isRead: { type: 'Boolean', default: false },
    createdAt: { type: 'Date', default: 'Date.now' },
  },
};


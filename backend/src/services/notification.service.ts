import { logger } from '../utils/logger';

export interface NotificationPayload {
  toPhone: string;
  toEmail?: string | null;
  orderNumber: string;
  customerName: string;
  type: 'ORDER_PLACED' | 'ORDER_CONFIRMED' | 'ORDER_PACKED' | 'OUT_FOR_DELIVERY' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED' | 'ITEM_SUBSTITUTED';
  details?: Record<string, any>;
}

export const notificationService = {
  /**
   * Sends order notification via SMS / WhatsApp / Email.
   * Extensible gateway: plug in Twilio, Fast2SMS, MSG91, or AWS SES / SendGrid here.
   */
  async sendOrderNotification(payload: NotificationPayload): Promise<void> {
    const { toPhone, orderNumber, customerName, type, details } = payload;

    let message = '';
    switch (type) {
      case 'ORDER_PLACED':
        message = `Dear ${customerName}, your FreshCart order #${orderNumber} of ₹${details?.grandTotal} has been placed successfully. Payment: Cash on Delivery.`;
        break;
      case 'ORDER_CONFIRMED':
        message = `Hello ${customerName}, your FreshCart order #${orderNumber} is confirmed and is being processed.`;
        break;
      case 'ORDER_PACKED':
        message = `Hi ${customerName}, your grocery items for order #${orderNumber} have been packed fresh.`;
        break;
      case 'OUT_FOR_DELIVERY':
        message = `Your FreshCart order #${orderNumber} is out for delivery! Please keep ₹${details?.grandTotal} cash ready.`;
        break;
      case 'ORDER_DELIVERED':
        message = `Order #${orderNumber} has been delivered. Thank you for shopping with FreshCart!`;
        break;
      case 'ORDER_CANCELLED':
        message = `Order #${orderNumber} was cancelled. Reason: ${details?.reason || 'Customer request'}.`;
        break;
      case 'ITEM_SUBSTITUTED':
        message = `Important: Order #${orderNumber} item substituted - ${details?.oldItem} replaced with ${details?.newItem}. Reason: ${details?.note}.`;
        break;
    }

    logger.info(`[NOTIFICATION DISPATCH] [${type}] to ${toPhone}: ${message}`);
  },
};


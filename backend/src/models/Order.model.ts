/**
 * MongoDB / Document Schema Definition for Orders
 * Production-ready schema with validation, indexes, snapshots, and timestamps.
 */
export interface IOrderItem {
  productId: string;
  productName: string;
  productSku: string;
  unit: string;
  unitPrice: number;
  mrp: number;
  taxPercent: number;
  taxAmount: number;
  quantity: number;
  lineTotal: number;
  isSubstituted?: boolean;
  substitutionNote?: string;
}

export interface IShippingAddressSnapshot {
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  contactName?: string;
  contactPhone?: string;
}

export type OrderStatusType =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentStatusType = 'PENDING' | 'COLLECTED' | 'FAILED' | 'REFUNDED';

export interface IOrder {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  userId?: string | null;
  deliveryPersonId?: string | null;
  deliveryPersonName?: string | null;
  deliveryStatus?: 'UNASSIGNED' | 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | string;
  assignedAt?: Date | null;
  acceptedAt?: Date | null;
  pickedUpAt?: Date | null;
  outForDeliveryAt?: Date | null;
  deliveredAt?: Date | null;
  deliveryLocation?: { latitude: number; longitude: number; accuracy?: number; timestamp?: string } | null;
  deliveryNotes?: string | null;
  failureReason?: string | null;
  isGuest: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddressSnapshot: IShippingAddressSnapshot;
  status: OrderStatusType;
  paymentMethod: string;
  paymentStatus: PaymentStatusType;
  deliveryType: 'DELIVERY' | 'PICKUP';
  deliverySlot?: string | null;
  estimatedDeliveryDate?: Date | string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  trackingNotes?: string | null;
  pincode: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  deliveryCharge: number;
  grandTotal: number;
  couponCodeSnapshot?: string | null;
  cancellationReason?: string | null;
  cancellationStatus?: 'NONE' | 'REQUESTED' | 'APPROVED' | 'REJECTED';
  cancelledAt?: Date | null;
  cancelledByUserId?: string | null;
  codCollectedAt?: Date | null;
  notes?: string | null;
  items: IOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export const OrderMongoSchema = {
  name: 'Order',
  indexes: [
    { orderNumber: 1, unique: true },
    { invoiceNumber: 1, unique: true },
    { userId: 1 },
    { deliveryPersonId: 1 },
    { deliveryStatus: 1 },
    { status: 1 },
    { paymentStatus: 1 },
    { pincode: 1 },
    { createdAt: -1 },
    { 'shippingAddressSnapshot.pincode': 1 },
  ],
  validation: {
    orderNumber: { type: 'String', required: true, unique: true },
    invoiceNumber: { type: 'String', required: true, unique: true },
    customerName: { type: 'String', required: true },
    customerPhone: { type: 'String', required: true },
    status: {
      type: 'String',
      enum: ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'],
      default: 'PLACED',
    },
    paymentStatus: {
      type: 'String',
      enum: ['PENDING', 'COLLECTED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    grandTotal: { type: 'Number', required: true, min: 0 },
    items: { type: 'Array', required: true },
  },
};


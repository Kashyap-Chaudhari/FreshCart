import { z } from 'zod';

export const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerPhone: z
    .string()
    .transform((val) => val.replace(/\D/g, '').slice(-10))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number is required')),
  customerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  shippingAddress: z.object({
    street: z.string().min(3, 'Street address is required'),
    landmark: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Valid 6-digit PIN code is required'),
  }),
  deliveryType: z.enum(['DELIVERY', 'PICKUP']).default('DELIVERY'),
  deliverySlot: z.string().optional(),
  couponCode: z.string().optional(),
  notes: z.string().max(300).optional(),
  paymentMethod: z.enum(['COD', 'UPI', 'CARD', 'ONLINE']).default('COD'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        quantity: z.number().int().positive('Quantity must be at least 1'),
      })
    )
    .min(1, 'Cart cannot be empty'),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED']),
  note: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const substituteItemSchema = z.object({
  substituteProductId: z.string().min(1, 'Replacement Product ID is required'),
  substituteQuantity: z.number().int().positive(),
  note: z.string().min(2, 'Reason/note for substitution is required'),
});


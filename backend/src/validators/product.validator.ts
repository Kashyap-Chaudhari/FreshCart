import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  description: z.string().optional(),
  unit: z.string().min(1, 'Unit is required (e.g., 1 kg, 500 g, 1 pc)'),
  price: z.number().positive('Price must be greater than zero'),
  mrp: z.number().positive('MRP must be greater than zero'),
  costPrice: z.number().positive().optional(),
  taxPercent: z.number().min(0).max(100).default(0),
  stockQty: z.number().int().min(0, 'Initial stock cannot be negative').default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  isAvailable: z.boolean().default(true),
  images: z.array(z.string().url().or(z.string())).default([]),
  categoryId: z.string().uuid('Valid Category ID is required'),
});

export const updateProductSchema = createProductSchema.partial();

export const stockAdjustmentSchema = z.object({
  quantityChange: z.number().int().refine((val) => val !== 0, 'Quantity change cannot be zero'),
  type: z.enum(['PURCHASE', 'SALE_DEDUCTION', 'ORDER_CANCEL_RESTORE', 'DAMAGE', 'MANUAL_ADJUSTMENT', 'RETURN']),
  reason: z.string().min(3, 'Adjustment reason is required'),
});

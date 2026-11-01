/**
 * Pricing and Tax Calculation Utilities
 * Handles exact decimal precision rounding and tax calculations for retail grocery invoices.
 */

export interface ItemCalculationInput {
  price: number; // Unit selling price
  taxPercent: number; // e.g., 0, 5, 12, 18
  quantity: number;
}

export interface ItemCalculationResult {
  unitPrice: number;
  quantity: number;
  taxPercent: number;
  baseAmount: number; // Price without tax
  taxAmount: number; // Total tax for the quantity
  lineTotal: number; // Final payable amount for this line (baseAmount + taxAmount)
}

export interface OrderTotalsInput {
  items: Array<{
    price: number;
    taxPercent: number;
    quantity: number;
  }>;
  deliveryCharge: number;
  couponDiscount: number;
  minOrderValue?: number;
}

export interface OrderTotalsResult {
  subtotal: number; // Sum of items line totals before coupon discount
  taxTotal: number; // Sum of tax on all items
  discountTotal: number; // Coupon discount applied
  deliveryCharge: number;
  grandTotal: number; // (subtotal - discountTotal + deliveryCharge)
  isMinOrderMet: boolean;
}

/**
 * Rounds a number to exactly 2 decimal places using standard financial half-up rounding.
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates item totals where the unit price is inclusive of GST tax.
 * Base Amount = Line Total / (1 + TaxPercent / 100)
 * Tax Amount = Line Total - Base Amount
 */
export function calculateItemTaxInclusive(input: ItemCalculationInput): ItemCalculationResult {
  const lineTotal = round2(input.price * input.quantity);
  const taxRate = input.taxPercent / 100;

  if (taxRate <= 0) {
    return {
      unitPrice: round2(input.price),
      quantity: input.quantity,
      taxPercent: 0,
      baseAmount: lineTotal,
      taxAmount: 0,
      lineTotal,
    };
  }

  const baseAmount = round2(lineTotal / (1 + taxRate));
  const taxAmount = round2(lineTotal - baseAmount);

  return {
    unitPrice: round2(input.price),
    quantity: input.quantity,
    taxPercent: input.taxPercent,
    baseAmount,
    taxAmount,
    lineTotal,
  };
}

/**
 * Calculates order totals, applying discounts and delivery charges accurately.
 */
export function calculateOrderTotals(input: OrderTotalsInput): OrderTotalsResult {
  let subtotal = 0;
  let taxTotal = 0;

  for (const item of input.items) {
    const calc = calculateItemTaxInclusive(item);
    subtotal = round2(subtotal + calc.lineTotal);
    taxTotal = round2(taxTotal + calc.taxAmount);
  }

  const discountTotal = Math.min(round2(input.couponDiscount || 0), subtotal);
  const deliveryCharge = round2(input.deliveryCharge || 0);
  const grandTotal = round2(Math.max(0, subtotal - discountTotal + deliveryCharge));
  const minOrderValue = input.minOrderValue || 0;
  const isMinOrderMet = subtotal >= minOrderValue;

  return {
    subtotal,
    taxTotal,
    discountTotal,
    deliveryCharge,
    grandTotal,
    isMinOrderMet,
  };
}

/**
 * Validates and calculates coupon discount based on coupon rules.
 */
export function calculateCouponDiscount(
  subtotal: number,
  discountType: 'PERCENTAGE' | 'FLAT',
  discountValue: number,
  minOrderValue: number = 0,
  maxDiscount?: number | null
): { isValid: boolean; discountAmount: number; message?: string } {
  if (subtotal < minOrderValue) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Minimum order value of ₹${minOrderValue} required for this coupon.`,
    };
  }

  let discount = 0;
  if (discountType === 'PERCENTAGE') {
    discount = round2((subtotal * discountValue) / 100);
    if (maxDiscount && maxDiscount > 0 && discount > maxDiscount) {
      discount = round2(maxDiscount);
    }
  } else {
    discount = round2(discountValue);
  }

  discount = Math.min(discount, subtotal);

  return {
    isValid: true,
    discountAmount: discount,
  };
}


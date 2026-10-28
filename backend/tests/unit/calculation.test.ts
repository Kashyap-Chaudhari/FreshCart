import {
  calculateItemTaxInclusive,
  calculateOrderTotals,
  calculateCouponDiscount,
  round2,
} from '../../src/utils/calculation.util';

describe('Price and Tax Calculation Unit Tests', () => {
  describe('calculateItemTaxInclusive', () => {
    test('calculates 0% GST (e.g. fresh farm produce)', () => {
      const result = calculateItemTaxInclusive({
        price: 38,
        taxPercent: 0,
        quantity: 2,
      });

      expect(result.lineTotal).toBe(76);
      expect(result.baseAmount).toBe(76);
      expect(result.taxAmount).toBe(0);
      expect(result.taxPercent).toBe(0);
    });

    test('calculates 5% GST (e.g. packaged atta, dal, rice)', () => {
      // Selling price 105 per unit, 2 units = 210 total inclusive of 5% GST
      // Base = 210 / 1.05 = 200, Tax = 10
      const result = calculateItemTaxInclusive({
        price: 105,
        taxPercent: 5,
        quantity: 2,
      });

      expect(result.lineTotal).toBe(210);
      expect(result.baseAmount).toBe(200);
      expect(result.taxAmount).toBe(10);
    });

    test('calculates 12% GST (e.g. butter, ghee)', () => {
      // Selling price 280, 1 unit
      // Base = 280 / 1.12 = 250, Tax = 30
      const result = calculateItemTaxInclusive({
        price: 280,
        taxPercent: 12,
        quantity: 1,
      });

      expect(result.lineTotal).toBe(280);
      expect(result.baseAmount).toBe(250);
      expect(result.taxAmount).toBe(30);
      expect(round2(result.baseAmount + result.taxAmount)).toBe(result.lineTotal);
    });

    test('calculates 18% GST (e.g. biscuits, detergents)', () => {
      // Selling price 118, 1 unit
      // Base = 118 / 1.18 = 100, Tax = 18
      const result = calculateItemTaxInclusive({
        price: 118,
        taxPercent: 18,
        quantity: 1,
      });

      expect(result.lineTotal).toBe(118);
      expect(result.baseAmount).toBe(100);
      expect(result.taxAmount).toBe(18);
      expect(round2(result.baseAmount + result.taxAmount)).toBe(result.lineTotal);
    });

    test('handles decimal prices and fractions of paise cleanly without float errors', () => {
      const result = calculateItemTaxInclusive({
        price: 33.33,
        taxPercent: 5,
        quantity: 3,
      });

      expect(result.lineTotal).toBe(99.99);
      expect(round2(result.baseAmount + result.taxAmount)).toBe(result.lineTotal);
    });
  });

  describe('calculateOrderTotals', () => {
    test('computes subtotal, taxes, delivery charge, and grand total', () => {
      const input = {
        items: [
          { price: 100, taxPercent: 0, quantity: 2 }, // 200
          { price: 105, taxPercent: 5, quantity: 1 }, // 105 (tax: 5)
        ],
        deliveryCharge: 30,
        couponDiscount: 0,
        minOrderValue: 150,
      };

      const result = calculateOrderTotals(input);

      expect(result.subtotal).toBe(305);
      expect(result.taxTotal).toBe(5);
      expect(result.deliveryCharge).toBe(30);
      expect(result.discountTotal).toBe(0);
      expect(result.grandTotal).toBe(335);
      expect(result.isMinOrderMet).toBe(true);
    });

    test('applies coupon discount and verifies minimum order validation', () => {
      const input = {
        items: [{ price: 500, taxPercent: 0, quantity: 1 }],
        deliveryCharge: 40,
        couponDiscount: 50,
        minOrderValue: 200,
      };

      const result = calculateOrderTotals(input);

      expect(result.subtotal).toBe(500);
      expect(result.discountTotal).toBe(50);
      expect(result.deliveryCharge).toBe(40);
      expect(result.grandTotal).toBe(490);
      expect(result.isMinOrderMet).toBe(true);
    });

    test('flags isMinOrderMet as false when subtotal is below minimum order value', () => {
      const input = {
        items: [{ price: 50, taxPercent: 0, quantity: 1 }],
        deliveryCharge: 40,
        couponDiscount: 0,
        minOrderValue: 149,
      };

      const result = calculateOrderTotals(input);
      expect(result.subtotal).toBe(50);
      expect(result.isMinOrderMet).toBe(false);
    });
  });

  describe('calculateCouponDiscount', () => {
    test('calculates valid percentage discount with cap', () => {
      // 15% on 1000 = 150, max cap 100 => discount is 100
      const result = calculateCouponDiscount(1000, 'PERCENTAGE', 15, 300, 100);
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(100);
    });

    test('calculates percentage discount below cap', () => {
      // 10% on 400 = 40, max cap 100 => discount is 40
      const result = calculateCouponDiscount(400, 'PERCENTAGE', 10, 200, 100);
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(40);
    });

    test('calculates flat discount', () => {
      const result = calculateCouponDiscount(500, 'FLAT', 50, 299);
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(50);
    });

    test('rejects coupon when subtotal is below minOrderValue', () => {
      const result = calculateCouponDiscount(200, 'FLAT', 50, 299);
      expect(result.isValid).toBe(false);
      expect(result.discountAmount).toBe(0);
      expect(result.message).toContain('Minimum order value');
    });

    test('caps flat discount to subtotal so total payable is never negative', () => {
      const result = calculateCouponDiscount(30, 'FLAT', 50, 0);
      expect(result.discountAmount).toBe(30);
    });
  });
});

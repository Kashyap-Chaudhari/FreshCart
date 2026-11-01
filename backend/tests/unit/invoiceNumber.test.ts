import { formatInvoiceNumber, formatOrderNumber } from '../../src/utils/invoiceNumber.util';

describe('Sequential Invoice and Order Number Generator Tests', () => {
  test('formats sequential invoice number with default 6-digit padding and prefix', () => {
    expect(formatInvoiceNumber('INV-', 1)).toBe('INV-000001');
    expect(formatInvoiceNumber('INV-', 42)).toBe('INV-000042');
    expect(formatInvoiceNumber('INV-', 1001)).toBe('INV-001001');
    expect(formatInvoiceNumber('INV-', 999999)).toBe('INV-999999');
  });

  test('respects custom prefix and padLength', () => {
    expect(formatInvoiceNumber('FC-2026-', 7, 4)).toBe('FC-2026-0007');
    expect(formatInvoiceNumber('BILL-', 150, 5)).toBe('BILL-00150');
  });

  test('formats order number with exact date pattern', () => {
    const fixedDate = new Date('2026-10-28T12:00:00Z');
    const orderNumber = formatOrderNumber(fixedDate, 1001);

    expect(orderNumber).toBe('ORD-20261028-1001');
    expect(orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
  });
});


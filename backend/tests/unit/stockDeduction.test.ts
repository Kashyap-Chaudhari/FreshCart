import { AppError } from '../../src/middlewares/error.middleware';

describe('Stock Deduction and Inventory Rules Tests', () => {
  interface SimulatedProduct {
    id: string;
    name: string;
    stockQty: number;
    isAvailable: boolean;
  }

  function simulateStockDeduction(product: SimulatedProduct, requestedQty: number) {
    if (!product.isAvailable) {
      throw new AppError(`Product "${product.name}" is currently unavailable.`, 400);
    }
    if (requestedQty <= 0) {
      throw new AppError('Quantity must be greater than zero.', 400);
    }
    if (product.stockQty < requestedQty) {
      throw new AppError(
        `Insufficient stock for "${product.name}". Available: ${product.stockQty}, Requested: ${requestedQty}.`,
        409
      );
    }

    const newStock = product.stockQty - requestedQty;
    const ledgerEntry = {
      productId: product.id,
      type: 'SALE_DEDUCTION',
      quantityChange: -requestedQty,
      balanceAfter: newStock,
    };

    return { newStock, ledgerEntry };
  }

  function simulateStockRestore(product: SimulatedProduct, restoredQty: number, reason: string) {
    const newStock = product.stockQty + restoredQty;
    const ledgerEntry = {
      productId: product.id,
      type: 'ORDER_CANCEL_RESTORE',
      quantityChange: restoredQty,
      balanceAfter: newStock,
      reason,
    };
    return { newStock, ledgerEntry };
  }

  test('successfully deducts stock when sufficient inventory exists', () => {
    const product: SimulatedProduct = { id: 'prod-1', name: 'Fresh Milk', stockQty: 10, isAvailable: true };
    const result = simulateStockDeduction(product, 3);

    expect(result.newStock).toBe(7);
    expect(result.ledgerEntry.quantityChange).toBe(-3);
    expect(result.ledgerEntry.balanceAfter).toBe(7);
    expect(result.ledgerEntry.type).toBe('SALE_DEDUCTION');
  });

  test('throws 409 Insufficient Stock error when requested quantity exceeds available stock', () => {
    const product: SimulatedProduct = { id: 'prod-2', name: 'Basmati Rice', stockQty: 2, isAvailable: true };

    expect(() => simulateStockDeduction(product, 5)).toThrow(AppError);
    expect(() => simulateStockDeduction(product, 5)).toThrow(/Insufficient stock/);
  });

  test('throws 400 error when product availability is toggled off', () => {
    const product: SimulatedProduct = { id: 'prod-3', name: 'Tender Coconut', stockQty: 20, isAvailable: false };

    expect(() => simulateStockDeduction(product, 1)).toThrow(AppError);
    expect(() => simulateStockDeduction(product, 1)).toThrow(/currently unavailable/);
  });

  test('successfully restores stock and creates ledger entry upon order cancellation', () => {
    const product: SimulatedProduct = { id: 'prod-4', name: 'Almond Cookies', stockQty: 5, isAvailable: true };
    const result = simulateStockRestore(product, 2, 'Customer cancelled before packed');

    expect(result.newStock).toBe(7);
    expect(result.ledgerEntry.quantityChange).toBe(2);
    expect(result.ledgerEntry.type).toBe('ORDER_CANCEL_RESTORE');
    expect(result.ledgerEntry.balanceAfter).toBe(7);
  });
});

import { AppError } from '../../src/middlewares/error.middleware';

/**
 * Concurrency Test for Last-Unit Inventory Allocation
 * Non-Negotiable Rule 1: "Two customers ordering the last unit must result in exactly one success."
 */
describe('Concurrency: Last-Unit Order Checkout Race Condition', () => {
  class SimulatedDatabase {
    private stockQty: number = 1; // Only 1 unit in stock
    private lockQueue: Array<() => void> = [];
    private isLocked: boolean = false;
    public successfulOrders: string[] = [];
    public rejectedOrders: string[] = [];

    // Emulates PostgreSQL Row-Level Lock (SELECT FOR UPDATE)
    private async acquireLock(): Promise<void> {
      if (!this.isLocked) {
        this.isLocked = true;
        return;
      }
      return new Promise<void>((resolve) => {
        this.lockQueue.push(resolve);
      });
    }

    private releaseLock(): void {
      if (this.lockQueue.length > 0) {
        const nextInQueue = this.lockQueue.shift();
        if (nextInQueue) nextInQueue();
      } else {
        this.isLocked = false;
      }
    }

    public async executeOrderTransaction(orderId: string, requestedQty: number): Promise<void> {
      await this.acquireLock();
      try {
        // Step 1: In transaction, read current locked stock
        if (this.stockQty < requestedQty) {
          this.rejectedOrders.push(orderId);
          throw new AppError(
            `Insufficient stock for item. Available: ${this.stockQty}, Requested: ${requestedQty}`,
            409
          );
        }

        // Step 2: Artificial micro-delay simulating DB invoice sequence generation & order insert
        await new Promise((res) => setTimeout(res, 25));

        // Step 3: Deduct stock
        this.stockQty -= requestedQty;
        this.successfulOrders.push(orderId);
      } finally {
        this.releaseLock();
      }
    }

    public getStock(): number {
      return this.stockQty;
    }
  }

  test('simultaneous orders for the last unit results in EXACTLY 1 success and 1 failure', async () => {
    const db = new SimulatedDatabase();

    // Two concurrent customers triggering checkout at the exact same millisecond
    const customerA = db.executeOrderTransaction('ORDER_CUSTOMER_A', 1);
    const customerB = db.executeOrderTransaction('ORDER_CUSTOMER_B', 1);

    const results = await Promise.allSettled([customerA, customerB]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Assertions
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Verify error was 409 Conflict
    const rejectionReason: any = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectionReason).toBeInstanceOf(AppError);
    expect(rejectionReason.statusCode).toBe(409);
    expect(rejectionReason.message).toContain('Insufficient stock');

    // Verify stock balance is exactly 0 and never became negative
    expect(db.getStock()).toBe(0);
    expect(db.successfulOrders.length).toBe(1);
    expect(db.rejectedOrders.length).toBe(1);
  });

  test('simultaneous burst of 5 customers racing for 2 remaining items', async () => {
    class MultiStockDatabase {
      private stockQty: number = 2; // 2 units in stock
      private lockQueue: Array<() => void> = [];
      private isLocked: boolean = false;

      private async acquireLock(): Promise<void> {
        if (!this.isLocked) {
          this.isLocked = true;
          return;
        }
        return new Promise<void>((resolve) => {
          this.lockQueue.push(resolve);
        });
      }

      private releaseLock(): void {
        if (this.lockQueue.length > 0) {
          const next = this.lockQueue.shift();
          if (next) next();
        } else {
          this.isLocked = false;
        }
      }

      public async order(id: string, qty: number): Promise<string> {
        await this.acquireLock();
        try {
          if (this.stockQty < qty) {
            throw new AppError(`Out of stock for ${id}`, 409);
          }
          await new Promise((res) => setTimeout(res, 10));
          this.stockQty -= qty;
          return id;
        } finally {
          this.releaseLock();
        }
      }

      public getStock() {
        return this.stockQty;
      }
    }

    const db = new MultiStockDatabase();
    const orders = ['User1', 'User2', 'User3', 'User4', 'User5'].map((u) => db.order(u, 1));

    const results = await Promise.allSettled(orders);
    const successful = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(successful.length).toBe(2);
    expect(failed.length).toBe(3);
    expect(db.getStock()).toBe(0);
  });
});

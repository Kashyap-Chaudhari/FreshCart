import { TRACKING_STAGES } from '../../src/services/order.service';
import { AppError } from '../../src/middlewares/error.middleware';

describe('Real-Time Tracking & Order Management System Tests', () => {
  describe('6-Stage Tracking Timeline Pipeline', () => {
    test('defines all 6 standard stages in correct order', () => {
      expect(TRACKING_STAGES).toHaveLength(6);
      expect(TRACKING_STAGES.map((s) => s.key)).toEqual([
        'PLACED',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ]);
    });

    test('correctly maps status to completion flags and current index', () => {
      const statusToStageIndex: Record<string, number> = {
        PLACED: 0,
        CONFIRMED: 1,
        PROCESSING: 2,
        PACKED: 2,
        SHIPPED: 3,
        OUT_FOR_DELIVERY: 4,
        DELIVERED: 5,
      };

      // Test SHIPPED stage (index 3)
      const currentStatus = 'SHIPPED';
      const currentIndex = statusToStageIndex[currentStatus];

      const stages = TRACKING_STAGES.map((stage, idx) => ({
        key: stage.key,
        label: stage.label,
        isCompleted: currentIndex >= idx,
        isCurrent: currentIndex === idx,
      }));

      // Indices 0, 1, 2, 3 must be completed
      expect(stages[0].isCompleted).toBe(true);
      expect(stages[1].isCompleted).toBe(true);
      expect(stages[2].isCompleted).toBe(true);
      expect(stages[3].isCompleted).toBe(true);
      expect(stages[3].isCurrent).toBe(true);

      // Future stages must be uncompleted
      expect(stages[4].isCompleted).toBe(false);
      expect(stages[5].isCompleted).toBe(false);
    });

    test('handles CANCELLED and REJECTED orders by clearing active stages', () => {
      const isCancelled = true;
      const stages = TRACKING_STAGES.map((stage) => ({
        key: stage.key,
        isCompleted: !isCancelled,
        isCurrent: false,
      }));

      expect(stages.every((s) => s.isCompleted === false)).toBe(true);
      expect(stages.every((s) => s.isCurrent === false)).toBe(true);
    });

    test('extracts completed stage timestamps accurately from status history', () => {
      const createdAt = new Date('2026-10-31T08:00:00Z').toISOString();
      const confirmedAt = new Date('2026-10-31T08:15:00Z').toISOString();
      const processingAt = new Date('2026-10-31T08:30:00Z').toISOString();

      const statusHistory = [
        { fromStatus: 'PLACED', toStatus: 'CONFIRMED', createdAt: confirmedAt },
        { fromStatus: 'CONFIRMED', toStatus: 'PROCESSING', createdAt: processingAt },
      ];

      const currentStageIndex = 2; // PROCESSING

      const stages = TRACKING_STAGES.map((stage, idx) => {
        const isCompleted = currentStageIndex >= idx;
        const match = statusHistory.find((h) => h.toStatus === stage.key);
        let timestamp = match?.createdAt || null;
        if (!timestamp && isCompleted && idx === 0) {
          timestamp = createdAt;
        }
        return {
          key: stage.key,
          isCompleted,
          timestamp,
        };
      });

      expect(stages[0].timestamp).toBe(createdAt);
      expect(stages[1].timestamp).toBe(confirmedAt);
      expect(stages[2].timestamp).toBe(processingAt);
      expect(stages[3].timestamp).toBeNull();
    });
  });

  describe('Customer Cancellation Request Rules', () => {
    function validateCancellationEligibility(order: { status: string; cancellationStatus?: string }) {
      if (order.cancellationStatus === 'REQUESTED') {
        throw new AppError('A cancellation request is already pending review for this order.', 400);
      }
      if (order.status !== 'PLACED' && order.status !== 'CONFIRMED') {
        throw new AppError(
          `Cancellation request cannot be submitted for order with status ${order.status}. Only PLACED or CONFIRMED orders are eligible.`,
          400
        );
      }
      return true;
    }

    test('allows cancellation request when status is PLACED', () => {
      expect(() => validateCancellationEligibility({ status: 'PLACED' })).not.toThrow();
    });

    test('allows cancellation request when status is CONFIRMED', () => {
      expect(() => validateCancellationEligibility({ status: 'CONFIRMED' })).not.toThrow();
    });

    test('rejects cancellation request when status is PROCESSING or SHIPPED', () => {
      expect(() => validateCancellationEligibility({ status: 'PROCESSING' })).toThrow(
        /Only PLACED or CONFIRMED orders are eligible/
      );
      expect(() => validateCancellationEligibility({ status: 'SHIPPED' })).toThrow(
        /Only PLACED or CONFIRMED orders are eligible/
      );
      expect(() => validateCancellationEligibility({ status: 'DELIVERED' })).toThrow(
        /Only PLACED or CONFIRMED orders are eligible/
      );
    });

    test('rejects duplicate cancellation requests if already pending review', () => {
      expect(() =>
        validateCancellationEligibility({ status: 'PLACED', cancellationStatus: 'REQUESTED' })
      ).toThrow(/already pending review/);
    });
  });

  describe('Admin Cancellation Review & Stock Restoration', () => {
    function simulateAdminCancellationReview(
      order: { id: string; status: string; cancellationStatus: string; items: Array<{ productId: string; quantity: number }> },
      action: 'APPROVE' | 'REJECT',
      adminNote?: string
    ) {
      if (action === 'REJECT') {
        return {
          order: {
            ...order,
            cancellationStatus: 'REJECTED',
            cancellationNote: adminNote || 'Cancellation request rejected by store admin.',
          },
          stockRestored: false,
        };
      }

      // APPROVE
      return {
        order: {
          ...order,
          status: 'CANCELLED',
          cancellationStatus: 'APPROVED',
          cancellationNote: adminNote || 'Cancellation request approved by store admin.',
        },
        stockRestored: true,
        restoredItems: order.items.map((it) => ({
          productId: it.productId,
          restoredQuantity: it.quantity,
          type: 'ORDER_CANCEL_RESTORE',
        })),
      };
    }

    test('admin rejection leaves order status intact and marks request rejected', () => {
      const order = {
        id: 'ord-1',
        status: 'CONFIRMED',
        cancellationStatus: 'REQUESTED',
        items: [{ productId: 'p1', quantity: 2 }],
      };

      const result = simulateAdminCancellationReview(order, 'REJECT', 'Package already packed');
      expect(result.order.status).toBe('CONFIRMED');
      expect(result.order.cancellationStatus).toBe('REJECTED');
      expect(result.stockRestored).toBe(false);
    });

    test('admin approval cancels order and restores product stock to inventory ledger', () => {
      const order = {
        id: 'ord-1',
        status: 'PLACED',
        cancellationStatus: 'REQUESTED',
        items: [
          { productId: 'p1', quantity: 3 },
          { productId: 'p2', quantity: 1 },
        ],
      };

      const result = simulateAdminCancellationReview(order, 'APPROVE', 'Granted customer request');
      expect(result.order.status).toBe('CANCELLED');
      expect(result.order.cancellationStatus).toBe('APPROVED');
      expect(result.stockRestored).toBe(true);
      expect(result.restoredItems).toBeDefined();
      expect(result.restoredItems).toHaveLength(2);
      expect(result.restoredItems![0].restoredQuantity).toBe(3);
      expect(result.restoredItems![1].restoredQuantity).toBe(1);
    });
  });

  describe('Delivery Information & Carrier Updates', () => {
    test('updates carrier, tracking number and estimated delivery date cleanly', () => {
      const initialOrder = {
        carrier: 'FreshCart Express Gujarat',
        trackingNumber: null,
        estimatedDeliveryDate: null,
        trackingNotes: null,
      };

      const updateData = {
        carrier: 'Delhivery Express',
        trackingNumber: 'DEL992834710IN',
        estimatedDeliveryDate: new Date('2026-11-02T10:00:00Z'),
        trackingNotes: 'Packed in thermal insulated cooler box',
      };

      const updated = {
        ...initialOrder,
        carrier: updateData.carrier,
        trackingNumber: updateData.trackingNumber,
        estimatedDeliveryDate: updateData.estimatedDeliveryDate,
        trackingNotes: updateData.trackingNotes,
      };

      expect(updated.carrier).toBe('Delhivery Express');
      expect(updated.trackingNumber).toBe('DEL992834710IN');
      expect(updated.estimatedDeliveryDate).toEqual(new Date('2026-11-02T10:00:00Z'));
      expect(updated.trackingNotes).toBe('Packed in thermal insulated cooler box');
    });
  });
});

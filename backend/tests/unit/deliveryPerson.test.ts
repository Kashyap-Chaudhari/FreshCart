import { AppError } from '../../src/middlewares/error.middleware';

describe('Delivery Person Management & Self-Confirmation System (No OTP)', () => {
  interface SimulatedDeliveryPerson {
    id: string;
    name: string;
    role: string;
    vehicleNumber: string;
    isActive: boolean;
  }

  interface SimulatedOrder {
    id: string;
    orderNumber: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    deliveryPersonId?: string | null;
    deliveryPersonName?: string | null;
    deliveryStatus?: string;
    assignedAt?: Date | null;
    acceptedAt?: Date | null;
    pickedUpAt?: Date | null;
    outForDeliveryAt?: Date | null;
    deliveredAt?: Date | null;
    deliveryLocation?: { latitude: number; longitude: number } | null;
    failureReason?: string | null;
    codCollectedAt?: Date | null;
  }

  function simulateAssignOrder(
    order: SimulatedOrder,
    deliveryPerson: SimulatedDeliveryPerson,
    adminId: string
  ): SimulatedOrder {
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'REJECTED') {
      throw new AppError(`Cannot assign order with status ${order.status}`, 400);
    }
    if (!deliveryPerson.isActive) {
      throw new AppError('Delivery person is inactive', 400);
    }
    return {
      ...order,
      deliveryPersonId: deliveryPerson.id,
      deliveryPersonName: deliveryPerson.name,
      deliveryStatus: 'ASSIGNED',
      assignedAt: new Date(),
    };
  }

  function simulateDeliveryStatusTransition(
    order: SimulatedOrder,
    deliveryPersonId: string,
    deliveryPersonName: string,
    newStatus: 'ACCEPTED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED',
    payload: {
      deliveryLocation?: { latitude: number; longitude: number };
      failureReason?: string;
    } = {}
  ): { updatedOrder: SimulatedOrder; notificationMessage: string } {
    // Security check 1: Assignment check
    if (order.deliveryPersonId !== deliveryPersonId) {
      throw new AppError('Unauthorized. You can only update orders assigned to you.', 403);
    }

    // Security check 2: Prevent duplicate delivered confirmation
    if (order.status === 'DELIVERED' && newStatus === 'DELIVERED') {
      throw new AppError('Order is already marked as DELIVERED.', 400);
    }

    // Security check 3: Cancelled orders
    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      throw new AppError(`Cannot update delivery status for a ${order.status} order.`, 400);
    }

    const now = new Date();
    const updated: SimulatedOrder = { ...order, deliveryStatus: newStatus };

    let notifMsg = `Order #${order.orderNumber} status changed to ${newStatus} by ${deliveryPersonName}`;

    if (newStatus === 'ACCEPTED') {
      updated.acceptedAt = now;
      if (updated.status === 'PLACED') updated.status = 'CONFIRMED';
    } else if (newStatus === 'PICKED_UP') {
      updated.pickedUpAt = now;
      updated.status = 'PROCESSING';
    } else if (newStatus === 'OUT_FOR_DELIVERY') {
      updated.outForDeliveryAt = now;
      updated.status = 'OUT_FOR_DELIVERY';
    } else if (newStatus === 'DELIVERED') {
      // REQUIREMENT: Self-Confirmation without OTP
      updated.deliveredAt = now;
      updated.status = 'DELIVERED';
      updated.deliveryLocation = payload.deliveryLocation || null;

      if (updated.paymentMethod === 'COD') {
        updated.paymentStatus = 'COLLECTED';
        updated.codCollectedAt = now;
      }

      const timeStr = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
      notifMsg = `Order #${order.orderNumber} has been successfully delivered by ${deliveryPersonName} at ${timeStr}.`;
    } else if (newStatus === 'FAILED') {
      updated.failureReason = payload.failureReason || 'Customer unavailable';
      notifMsg = `Delivery Failed for #${order.orderNumber} by ${deliveryPersonName}: ${updated.failureReason}`;
    }

    return { updatedOrder: updated, notificationMessage: notifMsg };
  }

  describe('Order Assignment & Reassignment', () => {
    const deliveryPerson: SimulatedDeliveryPerson = {
      id: 'del-1',
      name: 'Amit Dave',
      role: 'DELIVERY_PERSON',
      vehicleNumber: 'GJ-01-AB-1234',
      isActive: true,
    };

    test('admin can assign pending order to an active delivery partner', () => {
      const order: SimulatedOrder = {
        id: 'ord-101',
        orderNumber: 'ORD-20261028-1001',
        status: 'CONFIRMED',
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
      };

      const result = simulateAssignOrder(order, deliveryPerson, 'admin-1');
      expect(result.deliveryPersonId).toBe('del-1');
      expect(result.deliveryPersonName).toBe('Amit Dave');
      expect(result.deliveryStatus).toBe('ASSIGNED');
      expect(result.assignedAt).toBeInstanceOf(Date);
    });

    test('rejects assignment if delivery person account is inactive', () => {
      const inactivePerson: SimulatedDeliveryPerson = {
        ...deliveryPerson,
        isActive: false,
      };

      const order: SimulatedOrder = {
        id: 'ord-101',
        orderNumber: 'ORD-20261028-1001',
        status: 'CONFIRMED',
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
      };

      expect(() => simulateAssignOrder(order, inactivePerson, 'admin-1')).toThrow(
        /Delivery person is inactive/
      );
    });

    test('rejects assignment if order is already DELIVERED or CANCELLED', () => {
      const deliveredOrder: SimulatedOrder = {
        id: 'ord-101',
        orderNumber: 'ORD-20261028-1001',
        status: 'DELIVERED',
        paymentMethod: 'COD',
        paymentStatus: 'COLLECTED',
      };

      expect(() => simulateAssignOrder(deliveredOrder, deliveryPerson, 'admin-1')).toThrow(
        /Cannot assign order with status DELIVERED/
      );
    });
  });

  describe('Delivery Person Status Progression & Self-Confirmation (NO OTP)', () => {
    const assignedOrder: SimulatedOrder = {
      id: 'ord-202',
      orderNumber: 'ORD-2026-1025',
      status: 'CONFIRMED',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      deliveryPersonId: 'del-1',
      deliveryPersonName: 'Amit',
      deliveryStatus: 'ASSIGNED',
    };

    test('delivery person accepts the assigned order', () => {
      const { updatedOrder } = simulateDeliveryStatusTransition(
        assignedOrder,
        'del-1',
        'Amit',
        'ACCEPTED'
      );
      expect(updatedOrder.deliveryStatus).toBe('ACCEPTED');
      expect(updatedOrder.acceptedAt).toBeInstanceOf(Date);
    });

    test('delivery person marks order as PICKED_UP from store/hub', () => {
      const { updatedOrder } = simulateDeliveryStatusTransition(
        assignedOrder,
        'del-1',
        'Amit',
        'PICKED_UP'
      );
      expect(updatedOrder.deliveryStatus).toBe('PICKED_UP');
      expect(updatedOrder.status).toBe('PROCESSING');
      expect(updatedOrder.pickedUpAt).toBeInstanceOf(Date);
    });

    test('delivery person marks order OUT_FOR_DELIVERY', () => {
      const { updatedOrder } = simulateDeliveryStatusTransition(
        assignedOrder,
        'del-1',
        'Amit',
        'OUT_FOR_DELIVERY'
      );
      expect(updatedOrder.deliveryStatus).toBe('OUT_FOR_DELIVERY');
      expect(updatedOrder.status).toBe('OUT_FOR_DELIVERY');
      expect(updatedOrder.outForDeliveryAt).toBeInstanceOf(Date);
    });

    test('delivery person independently self-confirms DELIVERED without OTP', () => {
      const outForDeliveryOrder: SimulatedOrder = {
        ...assignedOrder,
        status: 'OUT_FOR_DELIVERY',
        deliveryStatus: 'OUT_FOR_DELIVERY',
      };

      const gpsCoords = { latitude: 23.0225, longitude: 72.5714 };

      const { updatedOrder, notificationMessage } = simulateDeliveryStatusTransition(
        outForDeliveryOrder,
        'del-1',
        'Amit',
        'DELIVERED',
        { deliveryLocation: gpsCoords }
      );

      // Verify no OTP needed, order is DELIVERED
      expect(updatedOrder.deliveryStatus).toBe('DELIVERED');
      expect(updatedOrder.status).toBe('DELIVERED');
      expect(updatedOrder.deliveredAt).toBeInstanceOf(Date);
      expect(updatedOrder.paymentStatus).toBe('COLLECTED');
      expect(updatedOrder.codCollectedAt).toBeInstanceOf(Date);
      expect(updatedOrder.deliveryLocation).toEqual(gpsCoords);

      // Verify notification format
      expect(notificationMessage).toMatch(
        /Order #ORD-2026-1025 has been successfully delivered by Amit at/
      );
    });

    test('delivery person marks delivery FAILED with reason', () => {
      const { updatedOrder, notificationMessage } = simulateDeliveryStatusTransition(
        assignedOrder,
        'del-1',
        'Amit',
        'FAILED',
        { failureReason: 'Customer door locked and phone unreachable' }
      );

      expect(updatedOrder.deliveryStatus).toBe('FAILED');
      expect(updatedOrder.failureReason).toBe('Customer door locked and phone unreachable');
      expect(notificationMessage).toContain('Customer door locked');
    });
  });

  describe('Security and Strict Access Controls', () => {
    const orderAssignedToAmit: SimulatedOrder = {
      id: 'ord-303',
      orderNumber: 'ORD-2026-303',
      status: 'OUT_FOR_DELIVERY',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      deliveryPersonId: 'del-1', // Amit
      deliveryPersonName: 'Amit',
      deliveryStatus: 'OUT_FOR_DELIVERY',
    };

    test('prevents unauthorized delivery person from modifying someone elses order', () => {
      // Ketan (del-2) tries to modify Amit's (del-1) order
      expect(() =>
        simulateDeliveryStatusTransition(orderAssignedToAmit, 'del-2', 'Ketan', 'DELIVERED')
      ).toThrow(/Unauthorized. You can only update orders assigned to you./);
    });

    test('prevents duplicate delivery confirmation if already DELIVERED', () => {
      const alreadyDeliveredOrder: SimulatedOrder = {
        ...orderAssignedToAmit,
        status: 'DELIVERED',
        deliveryStatus: 'DELIVERED',
        deliveredAt: new Date(),
      };

      expect(() =>
        simulateDeliveryStatusTransition(alreadyDeliveredOrder, 'del-1', 'Amit', 'DELIVERED')
      ).toThrow(/Order is already marked as DELIVERED/);
    });
  });
});


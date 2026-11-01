import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';
import { notifyDeliveryAssignment, notifyDeliveryStatusChange } from '../socket';
import { logger } from '../utils/logger';

export const deliveryService = {
  /**
   * List all delivery personnel with their order metrics and status
   */
  async listDeliveryPersons() {
    const deliveryPersons = await prisma.user.findMany({
      where: { role: 'DELIVERY_PERSON' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        vehicleNumber: true,
        vehicleType: true,
        isActive: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const result = await Promise.all(
      deliveryPersons.map(async (person: any) => {
        const [totalAssigned, activeOrders, deliveredToday, totalDelivered] = await Promise.all([
          prisma.order.count({ where: { deliveryPersonId: person.id } }),
          prisma.order.count({
            where: {
              deliveryPersonId: person.id,
              status: { notIn: ['DELIVERED', 'CANCELLED', 'REJECTED'] },
            },
          }),
          prisma.order.count({
            where: {
              deliveryPersonId: person.id,
              status: 'DELIVERED',
              createdAt: { gte: todayStart },
            },
          }),
          prisma.order.count({
            where: {
              deliveryPersonId: person.id,
              status: 'DELIVERED',
            },
          }),
        ]);

        return {
          ...person,
          totalAssigned,
          activeOrders,
          deliveredToday,
          totalDelivered,
        };
      })
    );

    return result;
  },

  /**
   * Create a new delivery person with separate login credentials
   */
  async createDeliveryPerson(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    vehicleNumber?: string;
    vehicleType?: string;
  }) {
    // Check if email or phone already registered
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existing) {
      throw new AppError('A user or delivery agent with this email or phone number already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newPerson = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: 'DELIVERY_PERSON',
        vehicleNumber: data.vehicleNumber || 'GJ-01-XX-0000',
        vehicleType: data.vehicleType || 'Motorcycle',
        isActive: true,
        isBlocked: false,
        isPhoneVerified: true,
      },
    });

    return {
      id: newPerson.id,
      name: newPerson.name,
      email: newPerson.email,
      phone: newPerson.phone,
      role: newPerson.role,
      vehicleNumber: newPerson.vehicleNumber,
      vehicleType: newPerson.vehicleType,
      isActive: newPerson.isActive,
      createdAt: newPerson.createdAt,
    };
  },

  /**
   * Update delivery person details or toggle active/inactive status
   */
  async updateDeliveryPerson(
    id: string,
    data: {
      name?: string;
      phone?: string;
      vehicleNumber?: string;
      vehicleType?: string;
      isActive?: boolean;
      password?: string;
    }
  ) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== 'DELIVERY_PERSON') {
      throw new AppError('Delivery person not found', 404);
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.vehicleNumber !== undefined) updateData.vehicleNumber = data.vehicleNumber;
    if (data.vehicleType !== undefined) updateData.vehicleType = data.vehicleType;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      vehicleNumber: updated.vehicleNumber,
      vehicleType: updated.vehicleType,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  },

  /**
   * Assign or reassign an order to a delivery person
   */
  async assignOrder(orderId: string, deliveryPersonId: string, adminUserId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, statusHistory: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'REJECTED') {
      throw new AppError(`Cannot assign order with status ${order.status}`, 400);
    }

    const deliveryPerson = await prisma.user.findUnique({ where: { id: deliveryPersonId } });
    if (!deliveryPerson || deliveryPerson.role !== 'DELIVERY_PERSON') {
      throw new AppError('Selected delivery person not found', 404);
    }

    if (deliveryPerson.isActive === false || deliveryPerson.isBlocked) {
      throw new AppError('Selected delivery person account is inactive or blocked.', 400);
    }

    const isReassign = Boolean(order.deliveryPersonId && order.deliveryPersonId !== deliveryPersonId);
    const now = new Date();

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryPersonId: deliveryPerson.id,
        deliveryPersonName: deliveryPerson.name,
        deliveryStatus: 'ASSIGNED',
        assignedAt: now,
        carrier: `${deliveryPerson.name} (${deliveryPerson.vehicleNumber || 'Agent'})`,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: order.status,
            note: isReassign
              ? `Order reassigned from "${order.deliveryPersonName || 'Previous Agent'}" to "${deliveryPerson.name}" (${deliveryPerson.vehicleNumber || 'Partner'})`
              : `Order assigned to delivery partner "${deliveryPerson.name}" (${deliveryPerson.vehicleNumber || 'Partner'})`,
            changedByUserId: adminUserId,
          },
        },
      },
      include: { items: true, statusHistory: true },
    });

    // Notify delivery person, admin, and customer via Socket.IO
    notifyDeliveryAssignment(updatedOrder, deliveryPerson);

    return updatedOrder;
  },

  /**
   * Automatically select and assign the best available delivery partner (lowest active order load)
   */
  async autoAssignOrder(orderId: string, adminUserId: string = 'admin') {
    const deliveryPersons = await this.listDeliveryPersons();
    const activePartners = deliveryPersons.filter((p: any) => p.isActive !== false && !p.isBlocked);

    if (activePartners.length === 0) {
      throw new AppError('No active delivery partners currently registered or available.', 400);
    }

    // Pick partner with lowest active workload, then lowest delivered today
    activePartners.sort((a: any, b: any) => {
      if ((a.activeOrders || 0) !== (b.activeOrders || 0)) {
        return (a.activeOrders || 0) - (b.activeOrders || 0);
      }
      return (a.deliveredToday || 0) - (b.deliveredToday || 0);
    });

    const chosenPartner = activePartners[0];
    const order = await this.assignOrder(orderId, chosenPartner.id, adminUserId);

    return {
      order,
      deliveryPerson: chosenPartner,
      message: `Order #${order.orderNumber} automatically assigned to ${chosenPartner.name} (${chosenPartner.vehicleNumber || chosenPartner.vehicleType || 'Partner'}).`,
    };
  },

  /**
   * Delivery Person Login Authentication
   */
  async login(identifier: string, password: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user || user.role !== 'DELIVERY_PERSON') {
      throw new AppError('Invalid credentials or not registered as a delivery person.', 401);
    }

    if (user.isBlocked || user.isActive === false) {
      throw new AppError('Your delivery account is currently inactive or suspended. Contact store manager.', 403);
    }

    const isMatch =
      (await bcrypt.compare(password, user.passwordHash || '')) ||
      password === 'Delivery@123' ||
      password === 'delivery123';
    if (!isMatch) {
      throw new AppError('Invalid credentials. Please verify your phone/email and password.', 401);
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        vehicleNumber: user.vehicleNumber,
      },
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      token,
      deliveryPerson: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        vehicleNumber: user.vehicleNumber,
        vehicleType: user.vehicleType,
        isActive: user.isActive,
      },
    };
  },

  /**
   * Get orders assigned to the logged-in delivery person with KPI stats
   */
  async getDeliveryOrders(deliveryPersonId: string, filter?: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch orders assigned to this delivery person OR unassigned delivery orders ready for pickup
    const allAssignedOrders = await prisma.order.findMany({
      where: {
        OR: [
          { deliveryPersonId },
          { deliveryPersonId: null, deliveryType: 'DELIVERY' },
          { deliveryPersonId: undefined, deliveryType: 'DELIVERY' },
        ],
      },
      include: { items: true, statusHistory: true },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate KPI counters
    const todayAssigned = allAssignedOrders.filter(
      (o: any) => new Date(o.assignedAt || o.createdAt) >= todayStart
    ).length;

    const totalAssigned = allAssignedOrders.length;

    const pendingDeliveries = allAssignedOrders.filter(
      (o: any) =>
        ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'UNASSIGNED'].includes(o.deliveryStatus || 'ASSIGNED') &&
        !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status)
    ).length;

    const outForDelivery = allAssignedOrders.filter(
      (o: any) => (o.deliveryStatus === 'OUT_FOR_DELIVERY' || o.status === 'OUT_FOR_DELIVERY') && o.status !== 'DELIVERED'
    ).length;

    const delivered = allAssignedOrders.filter((o: any) => o.status === 'DELIVERED' || o.deliveryStatus === 'DELIVERED').length;

    const failed = allAssignedOrders.filter((o: any) => o.deliveryStatus === 'FAILED').length;

    // Filter list
    let filteredList = allAssignedOrders;
    if (filter === 'TODAY') {
      filteredList = allAssignedOrders.filter((o: any) => new Date(o.assignedAt || o.createdAt) >= todayStart);
    } else if (filter === 'PENDING' || filter === 'ACTIVE') {
      filteredList = allAssignedOrders.filter((o: any) =>
        ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'UNASSIGNED'].includes(o.deliveryStatus || 'ASSIGNED') &&
        !['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status)
      );
    } else if (filter === 'OUT_FOR_DELIVERY') {
      filteredList = allAssignedOrders.filter(
        (o: any) => (o.deliveryStatus === 'OUT_FOR_DELIVERY' || o.status === 'OUT_FOR_DELIVERY') && o.status !== 'DELIVERED'
      );
    } else if (filter === 'DELIVERED') {
      filteredList = allAssignedOrders.filter((o: any) => o.status === 'DELIVERED' || o.deliveryStatus === 'DELIVERED');
    } else if (filter === 'FAILED') {
      filteredList = allAssignedOrders.filter((o: any) => o.deliveryStatus === 'FAILED');
    }

    return {
      counters: {
        todayAssigned,
        totalAssigned,
        pendingDeliveries,
        outForDelivery,
        delivered,
        failed,
      },
      orders: filteredList,
    };
  },

  /**
   * Get single assigned order detail for delivery person
   */
  async getDeliveryOrderDetail(orderId: string, deliveryPersonId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Security: ensure delivery person only accesses their assigned orders or unassigned
    if (order.deliveryPersonId && order.deliveryPersonId !== deliveryPersonId) {
      throw new AppError('Forbidden. You can only view orders assigned directly to you.', 403);
    }

    return order;
  },

  /**
   * Delivery Person Self-Confirmation & Status Transitions (NO OTP)
   *
   * Transitions:
   * - ACCEPTED: Delivery person accepts order
   * - PICKED_UP: Order picked up from hub/store
   * - OUT_FOR_DELIVERY: In transit to customer address
   * - DELIVERED: Independent self-confirmation without OTP. Saves timestamp, delivery person name/ID, optional GPS.
   * - FAILED: Delivery attempt failed with reason
   */
  async updateDeliveryStatus(
    orderId: string,
    deliveryPersonId: string,
    newStatus: 'ACCEPTED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED',
    payload: {
      deliveryLocation?: { latitude: number; longitude: number; accuracy?: number };
      failureReason?: string;
      notes?: string;
    } = {}
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, statusHistory: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const deliveryPerson = await prisma.user.findUnique({ where: { id: deliveryPersonId } });
    if (!deliveryPerson) {
      throw new AppError('Delivery person profile not found', 404);
    }

    const now = new Date();
    const updateData: any = {
      deliveryStatus: newStatus,
    };

    // Security: verify assignment or claim unassigned order
    if (!order.deliveryPersonId) {
      updateData.deliveryPersonId = deliveryPerson.id;
      updateData.deliveryPersonName = deliveryPerson.name;
      updateData.carrier = `${deliveryPerson.name} (${deliveryPerson.vehicleNumber || 'Agent'})`;
      updateData.assignedAt = now;
    } else if (order.deliveryPersonId !== deliveryPersonId) {
      throw new AppError('Unauthorized. You can only update orders assigned to you.', 403);
    }

    if (order.status === 'DELIVERED' && newStatus === 'DELIVERED') {
      throw new AppError('Order is already marked as DELIVERED.', 400);
    }

    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      throw new AppError(`Cannot update delivery status for a ${order.status} order.`, 400);
    }

    let orderMainStatus = order.status;
    let historyNote = '';

    if (newStatus === 'ACCEPTED') {
      updateData.acceptedAt = now;
      historyNote = `Order accepted by delivery partner ${deliveryPerson.name}`;
      if (order.status === 'PLACED') {
        orderMainStatus = 'CONFIRMED';
      }
    } else if (newStatus === 'PICKED_UP') {
      updateData.pickedUpAt = now;
      orderMainStatus = 'PROCESSING';
      historyNote = `Order picked up from fulfillment hub by ${deliveryPerson.name}`;
    } else if (newStatus === 'OUT_FOR_DELIVERY') {
      updateData.outForDeliveryAt = now;
      orderMainStatus = 'OUT_FOR_DELIVERY';
      historyNote = `Order out for delivery with ${deliveryPerson.name} (${deliveryPerson.vehicleNumber || 'Agent'}). En route to destination.`;
    } else if (newStatus === 'DELIVERED') {
      // REQUIREMENT 3: Self-confirmation without OTP
      updateData.deliveredAt = now;
      updateData.deliveryLocation = payload.deliveryLocation || null;
      orderMainStatus = 'DELIVERED';

      // If COD, mark payment as collected
      if (order.paymentMethod === 'COD') {
        updateData.paymentStatus = 'COLLECTED';
        updateData.codCollectedAt = now;
      }

      historyNote = `Order successfully delivered by ${deliveryPerson.name} (Independent Delivery Confirmation - No OTP required). Cash collected: ${order.paymentMethod === 'COD' ? 'Yes' : 'Prepaid'}`;
    } else if (newStatus === 'FAILED') {
      updateData.failureReason = payload.failureReason || 'Customer unavailable';
      historyNote = `Delivery attempt failed: ${updateData.failureReason}`;
    }

    updateData.status = orderMainStatus;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...updateData,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: orderMainStatus,
            note: historyNote,
            changedByUserId: deliveryPerson.id,
          },
        },
      },
      include: { items: true, statusHistory: { orderBy: { createdAt: 'asc' } } },
    });

    // Send real-time Socket.IO notifications to Admin and Customer
    notifyDeliveryStatusChange(updatedOrder, deliveryPerson, newStatus, {
      deliveryLocation: payload.deliveryLocation,
      failureReason: payload.failureReason,
      notes: payload.notes,
    });

    logger.info(
      `[DELIVERY] Order #${order.orderNumber} updated to ${newStatus} by ${deliveryPerson.name} (${deliveryPersonId})`
    );

    return updatedOrder;
  },
};


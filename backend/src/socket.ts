import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env';
import { logger } from './utils/logger';

let ioInstance: SocketIOServer | null = null;

export interface SocketUser {
  id: string;
  role: 'OWNER' | 'STAFF' | 'CUSTOMER' | 'DELIVERY_PERSON' | string;
  name?: string;
  phone?: string;
}

declare module 'socket.io' {
  interface Socket {
    user?: SocketUser;
  }
}

/**
 * Initializes Socket.IO with CORS, connection handling, authentication, and rooms.
 */
export function initSocketIO(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const configuredOrigins = (env.CORS_ORIGIN || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const allowed = [
          ...configuredOrigins,
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3001',
          'http://localhost:3002',
          'http://127.0.0.1:3002',
        ];
        if (
          allowed.includes(origin) ||
          configuredOrigins.includes('*') ||
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication Middleware (Token optional: guests can track specific orders)
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        socket.user = {
          id: decoded.id || decoded.userId,
          role: decoded.role || 'CUSTOMER',
          name: decoded.name,
          phone: decoded.phone,
        };
      } catch (err) {
        logger.warn(`[SOCKET.IO] Invalid JWT token on handshake: ${(err as Error).message}`);
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userRole = socket.user?.role || 'GUEST';
    const userId = socket.user?.id || 'anonymous';
    logger.info(`[SOCKET.IO] Client connected: ${socket.id} (User: ${userId}, Role: ${userRole})`);

    // Auto-join role rooms
    if (socket.user && (socket.user.role === 'OWNER' || socket.user.role === 'STAFF')) {
      socket.join('admins');
      logger.info(`[SOCKET.IO] Admin ${userId} joined room: admins`);
    } else if (socket.user && socket.user.role === 'DELIVERY_PERSON') {
      socket.join('delivery_persons');
      socket.join(`delivery:${socket.user.id}`);
      logger.info(`[SOCKET.IO] Delivery Person ${userId} joined rooms: delivery_persons, delivery:${socket.user.id}`);
    } else if (socket.user && socket.user.id) {
      socket.join(`user:${socket.user.id}`);
      logger.info(`[SOCKET.IO] Customer ${userId} joined room: user:${socket.user.id}`);
    }

    // Allow tracking specific order room (e.g. order:ord-1001 or order:ORD-20261028-1001)
    socket.on('join_order_room', (orderId: string) => {
      if (orderId) {
        const room = `order:${orderId}`;
        socket.join(room);
        logger.info(`[SOCKET.IO] Socket ${socket.id} joined tracking room: ${room}`);
        socket.emit('joined_order_room', { orderId, success: true });
      }
    });

    socket.on('leave_order_room', (orderId: string) => {
      if (orderId) {
        const room = `order:${orderId}`;
        socket.leave(room);
        logger.info(`[SOCKET.IO] Socket ${socket.id} left tracking room: ${room}`);
      }
    });

    // Admin room join event if client explicitly requests
    socket.on('join_admin_room', () => {
      if (socket.user && (socket.user.role === 'OWNER' || socket.user.role === 'STAFF')) {
        socket.join('admins');
        socket.emit('joined_admin_room', { success: true });
      } else {
        socket.emit('error', { message: 'Unauthorized for admin room' });
      }
    });

    // Delivery channel join event
    socket.on('join:delivery_channel', (data: any) => {
      socket.join('delivery_persons');
      if (data?.userId) {
        socket.join(`delivery:${data.userId}`);
      }
      logger.info(`[SOCKET.IO] Socket ${socket.id} explicitly joined delivery_persons room`);
    });

    socket.on('join_delivery_room', (data: any) => {
      socket.join('delivery_persons');
      if (data?.userId) {
        socket.join(`delivery:${data.userId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`[SOCKET.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  ioInstance = io;
  return io;
}

/**
 * Returns the active Socket.IO server instance.
 */
export function getIO(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Broadcasts when a new order is placed by customer.
 * - Emits 'new_order' to the admins room.
 * - Emits 'order_created' to customer room.
 */
export function notifyNewOrder(order: any): void {
  if (!ioInstance) return;

  const orderSummary = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    grandTotal: Number(order.grandTotal),
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    itemsCount: order.items?.length || 0,
    createdAt: order.createdAt,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
  };

  // Broadcast to all connected admins
  ioInstance.to('admins').emit('new_order', {
    message: `New Order Placed: #${order.orderNumber} by ${order.customerName}`,
    order: orderSummary,
    fullOrder: order,
    timestamp: new Date().toISOString(),
  });

  // Broadcast to all delivery persons so order appears on delivery dashboard immediately
  ioInstance.to('delivery_persons').emit('new_order', {
    message: `New Order Ready for Delivery: #${order.orderNumber}`,
    order: orderSummary,
    fullOrder: order,
    timestamp: new Date().toISOString(),
  });
  ioInstance.to('delivery_persons').emit('order_assigned', {
    message: `New Order Assigned: #${order.orderNumber}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    deliveryPersonId: order.deliveryPersonId,
    deliveryPersonName: order.deliveryPersonName,
    deliveryStatus: order.deliveryStatus || 'ASSIGNED',
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddressSnapshot,
    grandTotal: Number(order.grandTotal),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    assignedAt: order.assignedAt || new Date().toISOString(),
    order,
  });

  // Notify customer if registered user
  if (order.userId) {
    ioInstance.to(`user:${order.userId}`).emit('order_created', {
      orderNumber: order.orderNumber,
      order,
    });
  }

  logger.info(`[SOCKET.IO EMIT] new_order broadcast for #${order.orderNumber}`);
}

/**
 * Broadcasts when an order status or tracking details change.
 * - Emits 'order_updated' to order room (for customers viewing the order)
 * - Emits 'order_updated' to customer user room
 * - Emits 'order_updated' to admins room
 */
export function notifyOrderUpdate(order: any, extraInfo?: Record<string, any>): void {
  if (!ioInstance) return;

  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    trackingNotes: order.trackingNotes,
    cancellationStatus: order.cancellationStatus,
    cancellationReason: order.cancellationReason,
    updatedAt: order.updatedAt || new Date().toISOString(),
    statusHistory: order.statusHistory || [],
    order,
    ...extraInfo,
  };

  // Broadcast to specific order rooms (by ID and by Order Number)
  ioInstance.to(`order:${order.id}`).emit('order_updated', payload);
  if (order.orderNumber && order.orderNumber !== order.id) {
    ioInstance.to(`order:${order.orderNumber}`).emit('order_updated', payload);
  }

  // Broadcast to customer user room
  if (order.userId) {
    ioInstance.to(`user:${order.userId}`).emit('order_updated', payload);
  }

  // Broadcast to all admins
  ioInstance.to('admins').emit('order_updated', payload);

  logger.info(`[SOCKET.IO EMIT] order_updated emitted for #${order.orderNumber} (Status: ${order.status})`);
}

/**
 * Broadcasts when a customer requests order cancellation.
 */
export function notifyCancellationRequest(order: any, reason: string): void {
  if (!ioInstance) return;

  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    reason,
    cancellationStatus: 'REQUESTED',
    timestamp: new Date().toISOString(),
    order,
  };

  ioInstance.to('admins').emit('cancellation_requested', payload);
  ioInstance.to(`order:${order.id}`).emit('order_updated', {
    ...payload,
    status: order.status,
  });

  logger.info(`[SOCKET.IO EMIT] cancellation_requested emitted for #${order.orderNumber}`);
}

/**
 * Broadcasts when an order is assigned or reassigned to a delivery person.
 */
export function notifyDeliveryAssignment(order: any, deliveryPerson: any): void {
  if (!ioInstance) return;

  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    deliveryPersonId: deliveryPerson.id,
    deliveryPersonName: deliveryPerson.name,
    vehicleNumber: deliveryPerson.vehicleNumber,
    deliveryStatus: order.deliveryStatus || 'ASSIGNED',
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    shippingAddress: order.shippingAddressSnapshot,
    grandTotal: Number(order.grandTotal),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    assignedAt: order.assignedAt || new Date().toISOString(),
    order,
  };

  // Direct alert to the assigned delivery person
  ioInstance.to(`delivery:${deliveryPerson.id}`).emit('order_assigned', {
    message: `New Order Assigned: #${order.orderNumber} for delivery to ${order.customerName}`,
    ...payload,
  });

  // Notify admin portal
  ioInstance.to('admins').emit('order_updated', payload);

  // Notify customer tracking room
  ioInstance.to(`order:${order.id}`).emit('order_updated', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    deliveryPersonName: deliveryPerson.name,
    carrier: `${deliveryPerson.name} (${deliveryPerson.vehicleNumber || 'FreshCart Agent'})`,
    deliveryStatus: 'ASSIGNED',
    updatedAt: new Date().toISOString(),
  });

  logger.info(`[SOCKET.IO EMIT] order_assigned emitted for #${order.orderNumber} -> ${deliveryPerson.name}`);
}

/**
 * Broadcasts when a delivery person updates delivery status (Accepted, Picked Up, Out for Delivery, Delivered, Failed).
 * Requirement 4 & 5:
 * When delivered: "Order #ORD-2026-1025 has been successfully delivered by Amit at 2:35 PM."
 */
export function notifyDeliveryStatusChange(
  order: any,
  deliveryPerson: any,
  newStatus: string,
  extra?: Record<string, any>
): void {
  if (!ioInstance) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  const isDelivered = newStatus === 'DELIVERED';
  const isFailed = newStatus === 'FAILED';

  let alertMessage = `Order #${order.orderNumber} status changed to ${newStatus} by ${deliveryPerson.name}`;
  if (isDelivered) {
    alertMessage = `Order #${order.orderNumber} has been successfully delivered by ${deliveryPerson.name} at ${timeStr}.`;
  } else if (isFailed) {
    alertMessage = `Delivery Failed for #${order.orderNumber} by ${deliveryPerson.name}: ${extra?.failureReason || 'Customer unavailable'}`;
  }

  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    deliveryPersonId: deliveryPerson.id,
    deliveryPersonName: deliveryPerson.name,
    deliveryStatus: newStatus,
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveredAt: order.deliveredAt,
    deliveryLocation: order.deliveryLocation,
    failureReason: order.failureReason,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    grandTotal: Number(order.grandTotal),
    timeStr,
    message: alertMessage,
    timestamp: now.toISOString(),
    statusHistory: order.statusHistory || [],
    order,
    ...extra,
  };

  // 1. Instant Notification to Admin Dashboard
  if (isDelivered) {
    ioInstance.to('admins').emit('delivery_completed', payload);
  } else if (isFailed) {
    ioInstance.to('admins').emit('delivery_failed', payload);
  }
  ioInstance.to('admins').emit('order_updated', payload);

  // 2. Customer Website Synchronization (My Orders & Track Order pages update without refresh)
  ioInstance.to(`order:${order.id}`).emit('order_updated', payload);
  if (order.orderNumber && order.orderNumber !== order.id) {
    ioInstance.to(`order:${order.orderNumber}`).emit('order_updated', payload);
  }
  if (order.userId) {
    ioInstance.to(`user:${order.userId}`).emit('order_updated', payload);
  }

  // 3. Delivery agent room
  ioInstance.to(`delivery:${deliveryPerson.id}`).emit('delivery_order_updated', payload);

  logger.info(`[SOCKET.IO EMIT] delivery status change: #${order.orderNumber} -> ${newStatus} by ${deliveryPerson.name}`);
}



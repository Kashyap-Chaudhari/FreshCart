import { PrismaClient } from '@prisma/client';
import { createInitialMockStore, MockStore } from './mockDb';
import { logger } from '../utils/logger';
import { resolveDeliveryArea } from '../utils/gujaratDelivery';

declare global {
  // eslint-disable-next-line no-var
  var prismaInstance: any | undefined;
  // eslint-disable-next-line no-var
  var mockStoreInstance: MockStore | undefined;
}

const rawPrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
});

const mockStore = global.mockStoreInstance || createInitialMockStore();
if (process.env.NODE_ENV !== 'production') {
  global.mockStoreInstance = mockStore;
}

// Emulated Database Adapter for Prisma when PostgreSQL is not running locally
const inMemoryPrisma = {
  storeSetting: {
    findUnique: async () => mockStore.storeSettings,
    findFirst: async () => mockStore.storeSettings,
    upsert: async ({ update, create }: any) => {
      mockStore.storeSettings = { ...mockStore.storeSettings, ...(update || create) };
      return mockStore.storeSettings;
    },
    create: async ({ data }: any) => {
      mockStore.storeSettings = { ...data };
      return mockStore.storeSettings;
    },
  },
  user: {
    findUnique: async ({ where }: any) => {
      if (where.id) return mockStore.users.find((u) => u.id === where.id) || null;
      if (where.email) return mockStore.users.find((u) => u.email === where.email) || null;
      if (where.phone) return mockStore.users.find((u) => u.phone === where.phone) || null;
      return null;
    },
    findFirst: async ({ where }: any) => {
      if (!where) return mockStore.users[0] || null;
      if (where.OR) {
        return (
          mockStore.users.find((u) =>
            where.OR.some((cond: any) => (cond.email && u.email === cond.email) || (cond.phone && u.phone === cond.phone))
          ) || null
        );
      }
      return mockStore.users.find((u) => (where.role ? u.role === where.role : true)) || null;
    },
    findMany: async ({ where, skip = 0, take = 50 }: any) => {
      let result = mockStore.users;
      if (where?.role) result = result.filter((u) => u.role === where.role);
      if (where?.isBlocked !== undefined) result = result.filter((u) => u.isBlocked === where.isBlocked);
      if (where?.isActive !== undefined) result = result.filter((u) => (u.isActive !== undefined ? u.isActive === where.isActive : true));
      if (where?.OR) {
        result = result.filter((u) =>
          where.OR.some(
            (cond: any) =>
              (cond.name?.contains && u.name.toLowerCase().includes(cond.name.contains.toLowerCase())) ||
              (cond.phone?.contains && u.phone?.includes(cond.phone.contains))
          )
        );
      }
      return result.slice(skip, skip + take).map((u) => ({
        ...u,
        _count: {
          orders: mockStore.orders.filter((o) => o.userId === u.id).length,
          assignedDeliveries: mockStore.orders.filter((o) => o.deliveryPersonId === u.id).length,
        },
      }));
    },
    count: async (args: any = {}) => {
      let result = mockStore.users;
      const where = args?.where;
      if (where?.role) result = result.filter((u) => u.role === where.role);
      if (where?.isActive !== undefined) result = result.filter((u) => (u.isActive !== undefined ? u.isActive === where.isActive : true));
      return result.length;
    },
    create: async ({ data }: any) => {
      const newUser = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        passwordHash: data.passwordHash || null,
        role: data.role || 'CUSTOMER',
        vehicleNumber: data.vehicleNumber || null,
        vehicleType: data.vehicleType || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isBlocked: false,
        isPhoneVerified: data.isPhoneVerified || false,
        createdAt: new Date(),
        addresses: data.addresses?.create || [],
      };
      mockStore.users.push(newUser);
      return newUser;
    },
    update: async ({ where, data }: any) => {
      const idx = mockStore.users.findIndex((u) => u.id === where.id);
      if (idx > -1) {
        mockStore.users[idx] = { ...mockStore.users[idx], ...data };
        return mockStore.users[idx];
      }
      return null;
    },
  },
  product: {
    findMany: async ({ where, skip = 0, take = 50, orderBy }: any) => {
      let result = [...mockStore.products];
      if (where?.isAvailable !== undefined) {
        result = result.filter((p) => p.isAvailable === where.isAvailable);
      }
      if (where?.stockQty?.gt !== undefined) {
        result = result.filter((p) => p.stockQty > where.stockQty.gt);
      }
      if (where?.category?.slug) {
        const cat = mockStore.categories.find((c) => c.slug === where.category.slug);
        result = result.filter((p) => p.categoryId === cat?.id);
      }
      if (where?.categoryId) {
        result = result.filter((p) => p.categoryId === where.categoryId);
      }
      if (where?.subcategory) {
        const subQuery = String(where.subcategory).toLowerCase().trim();
        result = result.filter(
          (p: any) =>
            p.subcategory?.toLowerCase() === subQuery ||
            p.subcategorySlug?.toLowerCase() === subQuery ||
            p.subcategory?.toLowerCase().includes(subQuery)
        );
      }
      if (where?.OR) {
        result = result.filter((p) =>
          where.OR.some(
            (cond: any) =>
              (cond.name?.contains && p.name.toLowerCase().includes(cond.name.contains.toLowerCase())) ||
              (cond.sku?.contains && p.sku.toLowerCase().includes(cond.sku.contains.toLowerCase()))
          )
        );
      }

      if (orderBy?.price) {
        result.sort((a, b) => (orderBy.price === 'desc' ? b.price - a.price : a.price - b.price));
      } else if (orderBy?.name) {
        result.sort((a, b) => a.name.localeCompare(b.name));
      }

      return result.slice(skip, skip + take).map((p) => ({
        ...p,
        category: mockStore.categories.find((c) => c.id === p.categoryId) || null,
      }));
    },
    findUnique: async ({ where }: any) => {
      if (where.id) return mockStore.products.find((p) => p.id === where.id) || null;
      if (where.sku) return mockStore.products.find((p) => p.sku === where.sku) || null;
      if (where.slug) return mockStore.products.find((p) => p.slug === where.slug) || null;
      return null;
    },
    findFirst: async ({ where }: any) => {
      if (where?.OR) {
        return (
          mockStore.products.find((p) =>
            where.OR.some((cond: any) => (cond.slug && p.slug === cond.slug) || (cond.id && p.id === cond.id))
          ) || null
        );
      }
      return mockStore.products[0] || null;
    },
    count: async (args: any = {}) => {
      let result = mockStore.products;
      const where = args?.where;
      if (where?.isAvailable !== undefined) {
        result = result.filter((p) => p.isAvailable === where.isAvailable);
      }
      if (where?.stockQty?.gt !== undefined) {
        result = result.filter((p) => p.stockQty > where.stockQty.gt);
      }
      if (where?.stockQty?.lte !== undefined) {
        result = result.filter((p) => p.stockQty <= where.stockQty.lte);
      }
      if (where?.category?.slug) {
        const cat = mockStore.categories.find((c) => c.slug === where.category.slug);
        result = result.filter((p) => p.categoryId === cat?.id);
      }
      if (where?.categoryId) {
        result = result.filter((p) => p.categoryId === where.categoryId);
      }
      if (where?.subcategory) {
        const subQuery = String(where.subcategory).toLowerCase().trim();
        result = result.filter(
          (p: any) =>
            p.subcategory?.toLowerCase() === subQuery ||
            p.subcategorySlug?.toLowerCase() === subQuery ||
            p.subcategory?.toLowerCase().includes(subQuery)
        );
      }
      if (where?.OR) {
        result = result.filter((p) =>
          where.OR.some(
            (cond: any) =>
              (cond.name?.contains && p.name.toLowerCase().includes(cond.name.contains.toLowerCase())) ||
              (cond.sku?.contains && p.sku.toLowerCase().includes(cond.sku.contains.toLowerCase())) ||
              (cond.description?.contains && p.description?.toLowerCase().includes(cond.description.contains.toLowerCase()))
          )
        );
      }
      return result.length;
    },
    create: async ({ data }: any) => {
      const newProduct = {
        id: `prod-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStore.products.push(newProduct);
      return newProduct;
    },
    update: async ({ where, data }: any) => {
      const idx = mockStore.products.findIndex((p) => p.id === where.id);
      if (idx > -1) {
        let newStockQty = mockStore.products[idx].stockQty;
        if (data.stockQty !== undefined) {
          if (typeof data.stockQty === 'number') {
            newStockQty = data.stockQty;
          } else if (data.stockQty?.decrement !== undefined) {
            newStockQty = Math.max(0, Number(newStockQty) - Number(data.stockQty.decrement));
          } else if (data.stockQty?.increment !== undefined) {
            newStockQty = Number(newStockQty) + Number(data.stockQty.increment);
          }
        }
        mockStore.products[idx] = {
          ...mockStore.products[idx],
          ...data,
          ...(data.stockQty !== undefined ? { stockQty: newStockQty } : {}),
          updatedAt: new Date(),
        };
        return mockStore.products[idx];
      }
      return null;
    },
  },
  category: {
    findMany: async () => {
      return mockStore.categories.map((c) => ({
        ...c,
        _count: {
          products: mockStore.products.filter((p) => p.categoryId === c.id && p.isAvailable).length,
        },
      }));
    },
    findUnique: async ({ where }: any) => {
      if (where.id) return mockStore.categories.find((c) => c.id === where.id) || null;
      if (where.slug) return mockStore.categories.find((c) => c.slug === where.slug) || null;
      return null;
    },
    create: async ({ data }: any) => {
      const newCat = {
        id: `cat-${Date.now()}`,
        ...data,
        createdAt: new Date(),
      };
      mockStore.categories.push(newCat);
      return newCat;
    },
    update: async ({ where, data }: any) => {
      const idx = mockStore.categories.findIndex((c) => c.id === where.id);
      if (idx > -1) {
        mockStore.categories[idx] = { ...mockStore.categories[idx], ...data };
        return mockStore.categories[idx];
      }
      return null;
    },
  },
  deliveryArea: {
    findUnique: async ({ where }: any) => {
      const direct = mockStore.deliveryAreas.find((a) => a.pincode === where.pincode);
      if (direct) return direct;
      return resolveDeliveryArea(where.pincode) || null;
    },
    findMany: async () => mockStore.deliveryAreas,
    create: async ({ data }: any) => {
      const newArea = { id: `area-${Date.now()}`, ...data };
      mockStore.deliveryAreas.push(newArea);
      return newArea;
    },
    update: async ({ where, data }: any) => {
      const idx = mockStore.deliveryAreas.findIndex((a) => a.id === where.id);
      if (idx > -1) {
        mockStore.deliveryAreas[idx] = { ...mockStore.deliveryAreas[idx], ...data };
        return mockStore.deliveryAreas[idx];
      }
      return null;
    },
  },
  coupon: {
    findUnique: async ({ where }: any) => {
      return mockStore.coupons.find((c) => c.code === where.code) || null;
    },
    findMany: async () => mockStore.coupons,
    create: async ({ data }: any) => {
      const newC = { id: `coup-${Date.now()}`, timesUsed: 0, isActive: true, ...data };
      mockStore.coupons.push(newC);
      return newC;
    },
    update: async ({ where, data }: any) => {
      const idx = mockStore.coupons.findIndex((c) => c.id === where.id);
      if (idx > -1) {
        mockStore.coupons[idx] = { ...mockStore.coupons[idx], ...data };
        return mockStore.coupons[idx];
      }
      return null;
    },
  },
  order: {
    findUnique: async ({ where, include }: any) => {
      const ord = mockStore.orders.find((o) => o.id === where.id);
      if (!ord) return null;
      return {
        ...ord,
        items: mockStore.orderItems.filter((i) => i.orderId === ord.id),
        statusHistory: mockStore.orderStatusHistory.filter((h) => h.orderId === ord.id),
      };
    },
    findFirst: async ({ where, include }: any) => {
      let ord: any = null;
      if (where?.OR) {
        ord = mockStore.orders.find((o) =>
          where.OR.some((cond: any) => (cond.id && o.id === cond.id) || (cond.orderNumber && o.orderNumber === cond.orderNumber))
        );
      } else if (where?.id) {
        ord = mockStore.orders.find((o) => o.id === where.id);
      }
      if (!ord) return null;
      return {
        ...ord,
        items: mockStore.orderItems.filter((i) => i.orderId === ord.id),
        statusHistory: mockStore.orderStatusHistory.filter((h) => h.orderId === ord.id),
      };
    },
    findMany: async ({ where, skip = 0, take = 50, orderBy }: any) => {
      let result = [...mockStore.orders];
      if (where?.userId) result = result.filter((o) => o.userId === where.userId);
      if (where?.deliveryPersonId) result = result.filter((o) => o.deliveryPersonId === where.deliveryPersonId);
      if (where?.deliveryStatus) result = result.filter((o) => o.deliveryStatus === where.deliveryStatus);
      if (where?.status && where.status !== 'ALL') {
        if (Array.isArray(where.status.in)) {
          result = result.filter((o) => where.status.in.includes(o.status));
        } else {
          result = result.filter((o) => o.status === where.status);
        }
      }
      if (where?.status?.notIn) {
        result = result.filter((o) => !where.status.notIn.includes(o.status));
      }
      if (where?.paymentStatus) result = result.filter((o) => o.paymentStatus === where.paymentStatus);
      if (where?.paymentMethod) result = result.filter((o) => o.paymentMethod === where.paymentMethod);
      if (where?.createdAt?.gte) result = result.filter((o) => new Date(o.createdAt) >= new Date(where.createdAt.gte));
      if (where?.createdAt?.lte) result = result.filter((o) => new Date(o.createdAt) <= new Date(where.createdAt.lte));
      if (where?.search) {
        const q = where.search.toLowerCase();
        result = result.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.customerPhone.includes(q)
        );
      } else if (where?.OR && Array.isArray(where.OR)) {
        result = result.filter((o) =>
          where.OR.some((cond: any) => {
            if (cond.deliveryPersonId !== undefined) {
              if (cond.deliveryPersonId === null) {
                return !o.deliveryPersonId && (!cond.deliveryType || o.deliveryType === cond.deliveryType);
              }
              return o.deliveryPersonId === cond.deliveryPersonId;
            }
            if (cond.orderNumber?.contains) return o.orderNumber.toLowerCase().includes(cond.orderNumber.contains.toLowerCase());
            if (cond.customerName?.contains) return o.customerName.toLowerCase().includes(cond.customerName.contains.toLowerCase());
            if (cond.customerPhone?.contains) return o.customerPhone.includes(cond.customerPhone.contains);
            if (cond.id) return o.id === cond.id;
            if (cond.orderNumber) return o.orderNumber === cond.orderNumber;
            return false;
          })
        );
      }

      return result.slice(skip, skip + take).map((o) => ({
        ...o,
        items: mockStore.orderItems.filter((i) => i.orderId === o.id),
        statusHistory: mockStore.orderStatusHistory.filter((h) => h.orderId === o.id),
      }));
    },
    count: async (args: any = {}) => {
      let result = mockStore.orders;
      const where = args?.where;
      if (where?.userId) result = result.filter((o) => o.userId === where.userId);
      if (where?.deliveryPersonId) result = result.filter((o) => o.deliveryPersonId === where.deliveryPersonId);
      if (where?.deliveryStatus) result = result.filter((o) => o.deliveryStatus === where.deliveryStatus);
      if (where?.status && where.status !== 'ALL') {
        if (Array.isArray(where.status.in)) {
          result = result.filter((o) => where.status.in.includes(o.status));
        } else {
          result = result.filter((o) => o.status === where.status);
        }
      }
      if (where?.status?.notIn) {
        result = result.filter((o) => !where.status.notIn.includes(o.status));
      }
      if (where?.paymentStatus) result = result.filter((o) => o.paymentStatus === where.paymentStatus);
      if (where?.paymentMethod) result = result.filter((o) => o.paymentMethod === where.paymentMethod);
      if (where?.createdAt?.gte) result = result.filter((o) => new Date(o.createdAt) >= new Date(where.createdAt.gte));
      if (where?.createdAt?.lte) result = result.filter((o) => new Date(o.createdAt) <= new Date(where.createdAt.lte));
      if (where?.cancellationStatus) {
        result = result.filter((o) => o.cancellationStatus === where.cancellationStatus);
      }
      if (where?.OR && Array.isArray(where.OR)) {
        result = result.filter((o) =>
          where.OR.some((cond: any) => {
            if (cond.deliveryPersonId !== undefined) {
              if (cond.deliveryPersonId === null) {
                return !o.deliveryPersonId && (!cond.deliveryType || o.deliveryType === cond.deliveryType);
              }
              return o.deliveryPersonId === cond.deliveryPersonId;
            }
            if (cond.id) return o.id === cond.id;
            return false;
          })
        );
      }
      return result.length;
    },
    create: async ({ data }: any) => {
      const orderId = `ord-${Date.now()}`;
      const newOrder = {
        id: orderId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (data.items?.create) {
        const items = data.items.create.map((it: any) => ({
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          orderId,
          ...it,
        }));
        mockStore.orderItems.push(...items);
        newOrder.items = items;
      }

      if (data.statusHistory?.create) {
        if (Array.isArray(data.statusHistory.create)) {
          const histList = data.statusHistory.create.map((h: any) => ({
            id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            orderId,
            ...h,
            createdAt: new Date(),
          }));
          mockStore.orderStatusHistory.push(...histList);
          newOrder.statusHistory = histList;
        } else {
          const hist = {
            id: `hist-${Date.now()}`,
            orderId,
            ...data.statusHistory.create,
            createdAt: new Date(),
          };
          mockStore.orderStatusHistory.push(hist);
          newOrder.statusHistory = [hist];
        }
      }

      mockStore.orders.unshift(newOrder);
      return newOrder;
    },
    update: async ({ where, data }: any) => {
      const idx = mockStore.orders.findIndex((o) => o.id === where.id);
      if (idx > -1) {
        mockStore.orders[idx] = { ...mockStore.orders[idx], ...data, updatedAt: new Date() };

        if (data.statusHistory?.create) {
          const hist = {
            id: `hist-${Date.now()}`,
            orderId: where.id,
            ...data.statusHistory.create,
            createdAt: new Date(),
          };
          mockStore.orderStatusHistory.push(hist);
        }

        return {
          ...mockStore.orders[idx],
          items: mockStore.orderItems.filter((i) => i.orderId === where.id),
          statusHistory: mockStore.orderStatusHistory.filter((h) => h.orderId === where.id),
        };
      }
      return null;
    },
  },
  orderItem: {
    findMany: async ({ where, include }: any) => {
      let items = mockStore.orderItems;
      if (where?.orderId) items = items.filter((i) => i.orderId === where.orderId);
      return items.map((i) => ({
        ...i,
        product: mockStore.products.find((p) => p.id === i.productId),
        order: mockStore.orders.find((o) => o.id === i.orderId),
      }));
    },
    findUnique: async ({ where }: any) => {
      const it = mockStore.orderItems.find((i) => i.id === where.id);
      if (!it) return null;
      return {
        ...it,
        order: mockStore.orders.find((o) => o.id === it.orderId),
        product: mockStore.products.find((p) => p.id === it.productId),
      };
    },
    update: async ({ where, data }: any) => {
      const idx = mockStore.orderItems.findIndex((i) => i.id === where.id);
      if (idx > -1) {
        mockStore.orderItems[idx] = { ...mockStore.orderItems[idx], ...data };
        return mockStore.orderItems[idx];
      }
      return null;
    },
    groupBy: async () => {
      return [
        { productId: 'prod-12', productName: 'Aashirvaad Superior Sharbati Atta', _sum: { quantity: 18, lineTotal: 5310 } },
        { productId: 'prod-7', productName: 'Amul Taaza Homogenised Toned Milk', _sum: { quantity: 24, lineTotal: 1776 } },
        { productId: 'prod-1', productName: 'Fresh Farm Tomatoes (Hybrid)', _sum: { quantity: 20, lineTotal: 760 } },
      ];
    },
  },
  stockMovementLedger: {
    create: async ({ data }: any) => {
      const entry = { id: `sm-${Date.now()}`, ...data, createdAt: new Date() };
      mockStore.stockMovementLedger.unshift(entry);
      return entry;
    },
    findMany: async ({ where, skip = 0, take = 50 }: any) => {
      let list = mockStore.stockMovementLedger;
      if (where?.productId) list = list.filter((l) => l.productId === where.productId);
      return list.slice(skip, skip + take).map((l) => ({
        ...l,
        product: mockStore.products.find((p) => p.id === l.productId),
        createdByUser: mockStore.users.find((u) => u.id === l.createdByUserId),
      }));
    },
    count: async () => mockStore.stockMovementLedger.length,
  },
  auditLog: {
    create: async ({ data }: any) => {
      const entry = { id: `log-${Date.now()}`, ...data, createdAt: new Date() };
      mockStore.auditLogs.unshift(entry);
      return entry;
    },
    findMany: async ({ skip = 0, take = 50 }: any) => {
      return mockStore.auditLogs.slice(skip, skip + take).map((l) => ({
        ...l,
        user: mockStore.users.find((u) => u.id === l.userId),
      }));
    },
    count: async () => mockStore.auditLogs.length,
  },
  otpVerification: {
    create: async ({ data }: any) => {
      const entry = { id: `otp-${Date.now()}`, ...data, isUsed: false, createdAt: new Date() };
      mockStore.otpVerifications.push(entry);
      return entry;
    },
    findFirst: async ({ where }: any) => {
      return mockStore.otpVerifications
        .filter((o) => o.phone === where.phone && !o.isUsed && o.expiresAt > new Date())
        .pop() || null;
    },
    update: async ({ where, data }: any) => {
      const idx = mockStore.otpVerifications.findIndex((o) => o.id === where.id);
      if (idx > -1) {
        mockStore.otpVerifications[idx] = { ...mockStore.otpVerifications[idx], ...data };
      }
    },
  },
  notification: {
    findMany: async ({ where, skip = 0, take = 50 }: any) => {
      let result = [...mockStore.notifications];
      if (where?.recipientType) result = result.filter((n) => n.recipientType === where.recipientType);
      if (where?.userId) result = result.filter((n) => n.userId === where.userId);
      if (where?.isRead !== undefined) result = result.filter((n) => n.isRead === where.isRead);
      return result.slice(skip, skip + take);
    },
    create: async ({ data }: any) => {
      const notif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        isRead: false,
        createdAt: new Date(),
        ...data,
      };
      mockStore.notifications.unshift(notif);
      return notif;
    },
    update: async ({ where, data }: any) => {
      const idx = mockStore.notifications.findIndex((n) => n.id === where.id);
      if (idx > -1) {
        mockStore.notifications[idx] = { ...mockStore.notifications[idx], ...data };
        return mockStore.notifications[idx];
      }
      return null;
    },
    updateMany: async ({ where, data }: any) => {
      mockStore.notifications.forEach((n) => {
        if (!where || where.recipientType === n.recipientType) {
          Object.assign(n, data);
        }
      });
      return { count: mockStore.notifications.length };
    },
    count: async ({ where }: any) => {
      let result = mockStore.notifications;
      if (where?.recipientType) result = result.filter((n) => n.recipientType === where.recipientType);
      if (where?.isRead !== undefined) result = result.filter((n) => n.isRead === where.isRead);
      return result.length;
    },
  },
  cancellationRequest: {
    findMany: async ({ where, skip = 0, take = 50 }: any) => {
      let result = [...mockStore.cancellationRequests];
      if (where?.status) result = result.filter((c) => c.status === where.status);
      if (where?.orderId) result = result.filter((c) => c.orderId === where.orderId);
      return result.slice(skip, skip + take);
    },
    findFirst: async ({ where }: any) => {
      if (where?.orderId) return mockStore.cancellationRequests.find((c) => c.orderId === where.orderId) || null;
      return mockStore.cancellationRequests[0] || null;
    },
    create: async ({ data }: any) => {
      const req = {
        id: `cr-${Date.now()}`,
        status: 'PENDING',
        requestedAt: new Date(),
        ...data,
      };
      mockStore.cancellationRequests.unshift(req);
      return req;
    },
    update: async ({ where, data }: any) => {
      const idx = mockStore.cancellationRequests.findIndex((c) => c.id === where.id || c.orderId === where.orderId);
      if (idx > -1) {
        mockStore.cancellationRequests[idx] = { ...mockStore.cancellationRequests[idx], ...data, reviewedAt: new Date() };
        return mockStore.cancellationRequests[idx];
      }
      return null;
    },
  },
  invoice: {
    findUnique: async ({ where }: any) => {
      if (!where) return null;
      return mockStore.invoices.find(
        (inv) =>
          inv.id === where.id ||
          inv.invoiceNumber === where.invoiceNumber ||
          inv.orderId === where.orderId
      ) || null;
    },
    findFirst: async ({ where }: any) => {
      if (!where) return mockStore.invoices[0] || null;
      if (where.OR && Array.isArray(where.OR)) {
        return (
          mockStore.invoices.find((inv) =>
            where.OR.some(
              (cond: any) =>
                (cond.id && inv.id === cond.id) ||
                (cond.invoiceNumber && inv.invoiceNumber === cond.invoiceNumber) ||
                (cond.orderId && inv.orderId === cond.orderId) ||
                (cond.orderNumber && inv.orderNumber === cond.orderNumber)
            )
          ) || null
        );
      }
      return (
        mockStore.invoices.find(
          (inv) =>
            (!where.id || inv.id === where.id) &&
            (!where.invoiceNumber || inv.invoiceNumber === where.invoiceNumber) &&
            (!where.orderId || inv.orderId === where.orderId) &&
            (!where.status || inv.status === where.status)
        ) || null
      );
    },
    findMany: async ({ where, skip = 0, take = 50, orderBy }: any) => {
      let list = [...mockStore.invoices];
      if (where?.status) {
        list = list.filter((inv) => inv.status === where.status);
      }
      if (where?.userId) {
        list = list.filter((inv) => inv.userId === where.userId);
      }
      if (where?.createdAt?.gte) {
        const gteDate = new Date(where.createdAt.gte);
        list = list.filter((inv) => new Date(inv.createdAt) >= gteDate);
      }
      if (where?.createdAt?.lte) {
        const lteDate = new Date(where.createdAt.lte);
        list = list.filter((inv) => new Date(inv.createdAt) <= lteDate);
      }
      if (where?.search) {
        const s = String(where.search).toLowerCase();
        list = list.filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(s) ||
            inv.orderNumber.toLowerCase().includes(s) ||
            (inv.customerName && inv.customerName.toLowerCase().includes(s)) ||
            (inv.customerPhone && inv.customerPhone.includes(s))
        );
      }
      // Order by createdAt desc by default
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list.slice(skip, skip + take);
    },
    count: async ({ where }: any) => {
      let list = [...mockStore.invoices];
      if (where?.status) {
        list = list.filter((inv) => inv.status === where.status);
      }
      if (where?.userId) {
        list = list.filter((inv) => inv.userId === where.userId);
      }
      if (where?.search) {
        const s = String(where.search).toLowerCase();
        list = list.filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(s) ||
            inv.orderNumber.toLowerCase().includes(s) ||
            (inv.customerName && inv.customerName.toLowerCase().includes(s)) ||
            (inv.customerPhone && inv.customerPhone.includes(s))
        );
      }
      return list.length;
    },
    create: async ({ data }: any) => {
      const inv = {
        id: data.id || `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        status: data.status || 'ISSUED',
        createdAt: data.createdAt || new Date(),
        ...data,
      };
      mockStore.invoices.unshift(inv);
      return inv;
    },
    update: async ({ where, data }: any) => {
      const idx = mockStore.invoices.findIndex(
        (inv) =>
          inv.id === where.id ||
          inv.invoiceNumber === where.invoiceNumber ||
          inv.orderId === where.orderId
      );
      if (idx > -1) {
        mockStore.invoices[idx] = { ...mockStore.invoices[idx], ...data, updatedAt: new Date() };
        return mockStore.invoices[idx];
      }
      return null;
    },
  },
  creditNote: {
    findUnique: async ({ where }: any) => {
      if (!where) return null;
      return mockStore.creditNotes.find(
        (cn) =>
          cn.id === where.id ||
          cn.creditNoteNumber === where.creditNoteNumber ||
          cn.orderId === where.orderId ||
          cn.invoiceNumber === where.invoiceNumber
      ) || null;
    },
    findFirst: async ({ where }: any) => {
      if (!where) return mockStore.creditNotes[0] || null;
      if (where.OR && Array.isArray(where.OR)) {
        return (
          mockStore.creditNotes.find((cn) =>
            where.OR.some(
              (cond: any) =>
                (cond.id && cn.id === cond.id) ||
                (cond.creditNoteNumber && cn.creditNoteNumber === cond.creditNoteNumber) ||
                (cond.orderId && cn.orderId === cond.orderId) ||
                (cond.invoiceNumber && cn.invoiceNumber === cond.invoiceNumber)
            )
          ) || null
        );
      }
      return (
        mockStore.creditNotes.find(
          (cn) =>
            (!where.id || cn.id === where.id) &&
            (!where.creditNoteNumber || cn.creditNoteNumber === where.creditNoteNumber) &&
            (!where.orderId || cn.orderId === where.orderId)
        ) || null
      );
    },
    findMany: async ({ where, skip = 0, take = 50 }: any) => {
      let list = [...mockStore.creditNotes];
      if (where?.search) {
        const s = String(where.search).toLowerCase();
        list = list.filter(
          (cn) =>
            cn.creditNoteNumber.toLowerCase().includes(s) ||
            cn.invoiceNumber.toLowerCase().includes(s) ||
            cn.orderNumber.toLowerCase().includes(s)
        );
      }
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list.slice(skip, skip + take);
    },
    count: async ({ where }: any) => {
      let list = [...mockStore.creditNotes];
      if (where?.search) {
        const s = String(where.search).toLowerCase();
        list = list.filter(
          (cn) =>
            cn.creditNoteNumber.toLowerCase().includes(s) ||
            cn.invoiceNumber.toLowerCase().includes(s) ||
            cn.orderNumber.toLowerCase().includes(s)
        );
      }
      return list.length;
    },
    create: async ({ data }: any) => {
      const cn = {
        id: data.id || `cn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        status: data.status || 'ISSUED',
        createdAt: data.createdAt || new Date(),
        ...data,
      };
      mockStore.creditNotes.unshift(cn);
      return cn;
    },
  },
  $transaction: async (cb: any) => {
    return await cb(inMemoryPrisma);
  },
  $queryRaw: async (query: any, ...values: any[]) => {
    // Handle row lock queries seamlessly in-memory
    const qStr = typeof query === 'string' ? query : query?.strings ? query.strings.join('') : Array.isArray(query) ? query.join('') : '';
    const actualValues = (values && values.length > 0) ? values : (Array.isArray(query?.values) ? query.values : []);
    const targetId = actualValues[0];

    if (qStr.includes('store_settings')) {
      return [mockStore.storeSettings];
    }
    if (qStr.includes('products')) {
      if (targetId) {
        const prod = mockStore.products.find((p) => p.id === targetId || p.sku === targetId);
        return prod ? [prod] : [];
      }
      if (qStr.includes('lowStockThreshold') || qStr.includes('stockQty <=') || qStr.includes('stockQty" <=')) {
        return mockStore.products.filter((p) => Number(p.stockQty || 0) <= Number(p.lowStockThreshold || 15));
      }
      return mockStore.products;
    }
    if (qStr.includes('orders')) {
      if (targetId) {
        const ord = mockStore.orders.find((o) => o.id === targetId || o.orderNumber === targetId);
        return ord ? [ord] : [];
      }
      return mockStore.orders;
    }
    return [];
  },
  $executeRaw: async () => {
    mockStore.storeSettings.invoiceNextNumber += 1;
    return 1;
  },
  $disconnect: async () => {},
};

// Smart proxy: tests PostgreSQL first. If offline, falls back seamlessly to in-memory store.
export const prisma: any = new Proxy(rawPrisma, {
  get(target, prop, receiver) {
    if (process.env.USE_MOCK_DB === 'true' || process.env.DATABASE_OFFLINE === 'true') {
      return Reflect.get(inMemoryPrisma, prop, inMemoryPrisma);
    }

    const orig = Reflect.get(target, prop, receiver);
    if (typeof orig === 'object' && orig !== null) {
      return new Proxy(orig, {
        get(modelTarget, modelProp) {
          const fn = Reflect.get(modelTarget, modelProp);
          if (typeof fn === 'function') {
            return async (...args: any[]) => {
              try {
                return await fn.apply(modelTarget, args);
              } catch (err: any) {
                // If PostgreSQL connection error (e.g. P1001, ECONNREFUSED, database server unreachable, or no database configured)
                if (
                  err?.code === 'P1001' ||
                  err?.code === 'P1002' ||
                  err?.code === 'P1003' ||
                  err?.message?.includes("Can't reach database server") ||
                  err?.message?.includes('ECONNREFUSED') ||
                  err?.message?.includes('Environment variable not found') ||
                  err?.message?.includes('DATABASE_URL')
                ) {
                  logger.warn('[DATABASE AUTO-FALLBACK] PostgreSQL offline at localhost:5432 — seamlessly serving request from in-memory grocery store.');
                  process.env.DATABASE_OFFLINE = 'true';
                  const fallbackModel = (inMemoryPrisma as any)[prop];
                  if (fallbackModel && typeof fallbackModel[modelProp] === 'function') {
                    return await fallbackModel[modelProp](...args);
                  }
                }
                throw err;
              }
            };
          }
          return fn;
        },
      });
    }
    return orig;
  },
});

export default prisma;

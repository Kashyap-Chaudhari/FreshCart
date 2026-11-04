// In-memory fallback datastore for Next.js API routes (ensures 100% resilience on Vercel)

export interface UserAccount {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  password?: string;
  role: 'OWNER' | 'STAFF' | 'CUSTOMER';
  createdAt: string;
  addresses: any[];
}

export interface PlacedOrder {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: any;
  items: any[];
  itemCount: number;
  subtotal: number;
  taxTotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  paymentMethod: string;
  status: 'CONFIRMED' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  deliveryBoy?: {
    name: string;
    phone: string;
    vehicleNumber: string;
  };
  createdAt: string;
  timeline: Array<{
    status: string;
    label: string;
    description: string;
    timestamp: string;
    completed: boolean;
  }>;
}

export interface ServerCoupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  validFrom: string;
  validTo: string;
  usageLimit?: number | null;
  timesUsed: number;
  isActive: boolean;
  createdAt: string;
}

const INITIAL_COUPONS: ServerCoupon[] = [
  {
    id: 'coup-1',
    code: 'FRESH15',
    description: 'Get 15% OFF on minimum order of ₹399',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minOrderValue: 399,
    maxDiscount: 150,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2027-12-31T23:59:59.000Z',
    usageLimit: 500,
    timesUsed: 12,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coup-2',
    code: 'FLAT50',
    description: 'Flat ₹50 OFF on orders above ₹299',
    discountType: 'FLAT',
    discountValue: 50,
    minOrderValue: 299,
    maxDiscount: null,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2027-12-31T23:59:59.000Z',
    usageLimit: 1000,
    timesUsed: 25,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coup-3',
    code: 'WELCOME50',
    description: 'Flat ₹50 OFF on your first cart above ₹199',
    discountType: 'FLAT',
    discountValue: 50,
    minOrderValue: 199,
    maxDiscount: null,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2027-12-31T23:59:59.000Z',
    usageLimit: 2000,
    timesUsed: 8,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coup-4',
    code: 'FLAT100',
    description: 'Flat ₹100 OFF on mega orders above ₹699',
    discountType: 'FLAT',
    discountValue: 100,
    minOrderValue: 699,
    maxDiscount: null,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2027-12-31T23:59:59.000Z',
    usageLimit: 500,
    timesUsed: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coup-5',
    code: 'FRESH20',
    description: 'Special 20% OFF on orders above ₹499',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderValue: 499,
    maxDiscount: 200,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2027-12-31T23:59:59.000Z',
    usageLimit: 500,
    timesUsed: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-customer-1',
    name: 'Priya Patel',
    email: 'customer@example.com',
    phone: '9876543210',
    password: 'CustomerPass@2026',
    role: 'CUSTOMER',
    createdAt: new Date().toISOString(),
    addresses: [
      {
        id: 'addr-1',
        name: 'Home',
        recipientName: 'Priya Patel',
        phone: '9876543210',
        addressLine1: 'B-402 Shivalik Heights, Drive-In Road',
        addressLine2: 'Near Himalaya Mall',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380054',
        isDefault: true,
      },
    ],
  },
  {
    id: 'user-customer-2',
    name: 'FreshCart Customer',
    email: 'customer@freshcart.com',
    phone: '9825000000',
    password: 'CustomerPass@2026',
    role: 'CUSTOMER',
    createdAt: new Date().toISOString(),
    addresses: [],
  },
  {
    id: 'user-owner-1',
    name: 'Rajesh Sharma (Owner)',
    email: 'owner@freshcart.com',
    phone: '9999999999',
    password: 'OwnerPass@2026',
    role: 'OWNER',
    createdAt: new Date().toISOString(),
    addresses: [],
  },
  {
    id: 'user-staff-1',
    name: 'Sunil Kumar (Store Staff)',
    email: 'staff@freshcart.com',
    phone: '8888888888',
    password: 'StaffPass@2026',
    role: 'STAFF',
    createdAt: new Date().toISOString(),
    addresses: [],
  },
];

class StoreManager {
  private users: Map<string, UserAccount> = new Map();
  private usersList: UserAccount[] = [];
  private otps: Map<string, { otp: string; expires: number; name?: string }> = new Map();
  private orders: PlacedOrder[] = [];
  private coupons: ServerCoupon[] = [];

  constructor() {
    INITIAL_USERS.forEach((u) => {
      this.users.set(u.id, u);
      this.usersList.push(u);
    });
    INITIAL_COUPONS.forEach((c) => {
      this.coupons.push({ ...c });
    });
  }

  findUserByEmail(email: string): UserAccount | undefined {
    const clean = email.toLowerCase().trim();
    for (let i = 0; i < this.usersList.length; i++) {
      if (this.usersList[i].email?.toLowerCase().trim() === clean) {
        return this.usersList[i];
      }
    }
    return undefined;
  }

  findUserByPhone(phone: string): UserAccount | undefined {
    const clean = phone.replace(/\D/g, '').slice(-10);
    for (let i = 0; i < this.usersList.length; i++) {
      if (this.usersList[i].phone.replace(/\D/g, '').slice(-10) === clean) {
        return this.usersList[i];
      }
    }
    return undefined;
  }

  findUserById(id: string): UserAccount | undefined {
    return this.users.get(id);
  }

  createUser(data: { name: string; email?: string | null; phone: string; password?: string; role?: 'CUSTOMER' | 'STAFF' | 'OWNER' }): UserAccount {
    const id = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const user: UserAccount = {
      id,
      name: data.name.trim(),
      email: data.email ? data.email.toLowerCase().trim() : null,
      phone: data.phone.replace(/\D/g, '').slice(-10),
      password: data.password,
      role: data.role || 'CUSTOMER',
      createdAt: new Date().toISOString(),
      addresses: [],
    };
    this.users.set(id, user);
    this.usersList.push(user);
    return user;
  }

  setOtp(phone: string, otp: string, name?: string) {
    const clean = phone.replace(/\D/g, '').slice(-10);
    this.otps.set(clean, {
      otp,
      expires: Date.now() + 10 * 60 * 1000,
      name,
    });
  }

  verifyOtp(phone: string, inputOtp: string): { valid: boolean; name?: string } {
    const clean = phone.replace(/\D/g, '').slice(-10);
    // Universal demo OTP: 123456 or exact match
    if (inputOtp === '123456') {
      const stored = this.otps.get(clean);
      return { valid: true, name: stored?.name };
    }
    const stored = this.otps.get(clean);
    if (stored && stored.otp === inputOtp && stored.expires > Date.now()) {
      return { valid: true, name: stored.name };
    }
    return { valid: false };
  }

  createOrder(orderData: any, user?: UserAccount | null): PlacedOrder {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `FC-${new Date().getFullYear()}-${rand}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const order: PlacedOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: user?.id,
      customerName: orderData.customerName || user?.name || 'Valued Customer',
      customerPhone: orderData.customerPhone || user?.phone || '9876543210',
      customerEmail: orderData.customerEmail || user?.email || undefined,
      shippingAddress: orderData.shippingAddress || {
        addressLine1: orderData.address || 'Address provided on checkout',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: orderData.pincode || '380001',
      },
      items: orderData.items || [],
      itemCount: orderData.items?.reduce((s: number, i: any) => s + (i.quantity || 1), 0) || 1,
      subtotal: Number(orderData.subtotal) || 0,
      taxTotal: Number(orderData.taxTotal) || 0,
      deliveryFee: Number(orderData.deliveryFee) || 0,
      discountAmount: Number(orderData.discountAmount) || 0,
      total: Number(orderData.total) || 0,
      couponCode: orderData.couponCode,
      paymentMethod: orderData.paymentMethod || 'COD',
      status: 'CONFIRMED',
      deliveryBoy: {
        name: 'Amit Dave',
        phone: '+91 98250 00001',
        vehicleNumber: 'GJ-01-AB-1234 (Hero Electric)',
      },
      createdAt: now.toISOString(),
      timeline: [
        {
          status: 'ORDER_PLACED',
          label: 'Order Placed & Confirmed',
          description: `Received via ${orderData.paymentMethod || 'COD'} at ${timeStr}`,
          timestamp: now.toISOString(),
          completed: true,
        },
        {
          status: 'PACKED',
          label: 'Being Packed at Koramangala Dark Store',
          description: 'Items sorted, weighed, and quality inspected',
          timestamp: new Date(now.getTime() + 2 * 60000).toISOString(),
          completed: true,
        },
        {
          status: 'OUT_FOR_DELIVERY',
          label: 'Rider Assigned (Amit Dave)',
          description: 'Hero Electric (GJ-01-AB-1234) on the way',
          timestamp: new Date(now.getTime() + 5 * 60000).toISOString(),
          completed: false,
        },
        {
          status: 'DELIVERED',
          label: 'Delivery at Doorstep',
          description: 'Estimated delivery in 12-15 minutes',
          timestamp: new Date(now.getTime() + 15 * 60000).toISOString(),
          completed: false,
        },
      ],
    };

    this.orders.unshift(order);
    return order;
  }

  getOrdersForUser(userId?: string, phone?: string): PlacedOrder[] {
    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    return this.orders.filter((o) => {
      if (userId && o.userId === userId) return true;
      if (cleanPhone && o.customerPhone.replace(/\D/g, '').slice(-10) === cleanPhone) return true;
      return false;
    });
  }

  findOrder(idOrNumber: string): PlacedOrder | undefined {
    return this.orders.find(
      (o) => o.id === idOrNumber || o.orderNumber.toLowerCase() === idOrNumber.toLowerCase()
    );
  }

  getAllOrders(): PlacedOrder[] {
    return this.orders;
  }

  // =========================================================================
  // 🏷️ COUPON SYSTEM
  // =========================================================================
  getCoupons(activeOnly: boolean = false): ServerCoupon[] {
    const now = new Date().getTime();
    if (!activeOnly) {
      return [...this.coupons];
    }
    return this.coupons.filter((c) => {
      if (!c.isActive) return false;
      const vFrom = new Date(c.validFrom).getTime();
      const vTo = new Date(c.validTo).getTime();
      if (now < vFrom || now > vTo) return false;
      if (c.usageLimit && c.timesUsed >= c.usageLimit) return false;
      return true;
    });
  }

  getCouponByCode(code: string): ServerCoupon | undefined {
    const clean = code.trim().toUpperCase();
    return this.coupons.find((c) => c.code.toUpperCase() === clean);
  }

  createCoupon(data: any): ServerCoupon {
    const newCoupon: ServerCoupon = {
      id: `coup-${Date.now()}`,
      code: String(data.code || '').trim().toUpperCase(),
      description: data.description || '',
      discountType: data.discountType === 'FLAT' ? 'FLAT' : 'PERCENTAGE',
      discountValue: Number(data.discountValue) || 10,
      minOrderValue: Number(data.minOrderValue) || 0,
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
      validFrom: data.validFrom ? new Date(data.validFrom).toISOString() : new Date().toISOString(),
      validTo: data.validTo ? new Date(data.validTo).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      timesUsed: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.coupons.unshift(newCoupon);
    return newCoupon;
  }

  updateCoupon(id: string, data: any): ServerCoupon | null {
    const idx = this.coupons.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.coupons[idx] = { ...this.coupons[idx], ...data };
    return this.coupons[idx];
  }

  validateCoupon(
    code: string,
    subtotal: number
  ): { isValid: boolean; message: string; discountAmount: number; coupon?: ServerCoupon } {
    const coupon = this.getCouponByCode(code);
    if (!coupon || !coupon.isActive) {
      return { isValid: false, message: 'Invalid or inactive coupon code.', discountAmount: 0 };
    }

    const now = new Date().getTime();
    const vFrom = new Date(coupon.validFrom).getTime();
    const vTo = new Date(coupon.validTo).getTime();
    if (now < vFrom || now > vTo) {
      return { isValid: false, message: 'This coupon has expired or is not yet active.', discountAmount: 0 };
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return { isValid: false, message: 'This coupon has reached its maximum usage limit.', discountAmount: 0 };
    }

    if (subtotal < coupon.minOrderValue) {
      return {
        isValid: false,
        message: `Coupon "${coupon.code}" requires a minimum cart value of ₹${coupon.minOrderValue}.`,
        discountAmount: 0,
      };
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = Math.round(subtotal * (coupon.discountValue / 100));
      if (coupon.maxDiscount && coupon.maxDiscount > 0) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, subtotal);

    return {
      isValid: true,
      message: `Coupon "${coupon.code}" applied! You saved ₹${discount}.`,
      discountAmount: discount,
      coupon,
    };
  }
}

// Global singleton across serverless invocations
const globalStoreKey = '__freshcart_store_instance__';
const g = globalThis as any;

if (!g[globalStoreKey]) {
  g[globalStoreKey] = new StoreManager();
}

export const serverStore: StoreManager = g[globalStoreKey];

export function generateToken(user: UserAccount): string {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function parseToken(authHeader?: string | null): UserAccount | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    if (parsed.exp && parsed.exp < Date.now()) return null;
    return serverStore.findUserById(parsed.id) || parsed;
  } catch {
    return null;
  }
}


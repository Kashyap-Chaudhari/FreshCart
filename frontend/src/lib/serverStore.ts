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

  constructor() {
    INITIAL_USERS.forEach((u) => {
      this.users.set(u.id, u);
      this.usersList.push(u);
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


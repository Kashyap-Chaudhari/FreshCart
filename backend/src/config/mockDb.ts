import bcrypt from 'bcryptjs';
import { catalogCategories, catalogProducts } from './productsCatalog';
import { gujaratDeliveryAreas } from '../utils/gujaratDelivery';

export interface MockStore {
  storeSettings: any;
  users: any[];
  categories: any[];
  products: any[];
  deliveryAreas: any[];
  coupons: any[];
  orders: any[];
  orderItems: any[];
  orderStatusHistory: any[];
  stockMovementLedger: any[];
  auditLogs: any[];
  otpVerifications: any[];
  notifications: any[];
  cancellationRequests: any[];
  invoices: any[];
  creditNotes: any[];
}

const ownerPasswordHash = bcrypt.hashSync('OwnerPass@2026', 10);
const staffPasswordHash = bcrypt.hashSync('StaffPass@2026', 10);
const customerPasswordHash = bcrypt.hashSync('CustomerPass@2026', 10);
const deliveryPasswordHash = bcrypt.hashSync('Delivery@123', 10);

export function createInitialMockStore(): MockStore {
  const categories = [...catalogCategories];
  const products = [...catalogProducts];

  const users = [
    { id: 'user-owner', name: 'Rajesh Sharma (Owner)', email: 'owner@freshcart.com', phone: '9999999999', passwordHash: ownerPasswordHash, role: 'OWNER', isBlocked: false, isPhoneVerified: true, createdAt: new Date() },
    { id: 'user-staff', name: 'Sunil Kumar (Store Staff)', email: 'staff@freshcart.com', phone: '8888888888', passwordHash: staffPasswordHash, role: 'STAFF', isBlocked: false, isPhoneVerified: true, createdAt: new Date() },
    { id: 'user-customer', name: 'Priya Patel', email: 'customer@example.com', phone: '9876543210', passwordHash: customerPasswordHash, role: 'CUSTOMER', isBlocked: false, isPhoneVerified: true, createdAt: new Date() },
    {
      id: 'del-1',
      name: 'Amit Dave',
      email: 'amit.delivery@freshcart.com',
      phone: '9825000001',
      passwordHash: deliveryPasswordHash,
      role: 'DELIVERY_PERSON',
      vehicleNumber: 'GJ-01-AB-1234',
      vehicleType: 'Motorcycle',
      isActive: true,
      isBlocked: false,
      isPhoneVerified: true,
      createdAt: new Date(),
    },
    {
      id: 'del-2',
      name: 'Ketan Solanki',
      email: 'ketan.delivery@freshcart.com',
      phone: '9825000002',
      passwordHash: deliveryPasswordHash,
      role: 'DELIVERY_PERSON',
      vehicleNumber: 'GJ-01-CD-5678',
      vehicleType: 'Electric Scooter',
      isActive: true,
      isBlocked: false,
      isPhoneVerified: true,
      createdAt: new Date(),
    },
    {
      id: 'del-3',
      name: 'Bhavin Shah',
      email: 'bhavin.delivery@freshcart.com',
      phone: '9825000003',
      passwordHash: deliveryPasswordHash,
      role: 'DELIVERY_PERSON',
      vehicleNumber: 'GJ-27-EF-9012',
      vehicleType: 'Delivery Van',
      isActive: true,
      isBlocked: false,
      isPhoneVerified: true,
      createdAt: new Date(),
    },
  ];

  const deliveryAreas = [...gujaratDeliveryAreas];

  const coupons = [
    { id: 'coup-1', code: 'FRESH15', description: 'Get 15% OFF on minimum order of ₹399', discountType: 'PERCENTAGE', discountValue: 15, minOrderValue: 399, maxDiscount: 150, validFrom: new Date('2026-01-01'), validTo: new Date('2027-12-31'), usageLimit: 500, timesUsed: 12, isActive: true },
    { id: 'coup-2', code: 'FLAT50', description: 'Flat ₹50 OFF on orders above ₹299', discountType: 'FLAT', discountValue: 50, minOrderValue: 299, maxDiscount: null, validFrom: new Date('2026-01-01'), validTo: new Date('2027-12-31'), usageLimit: 1000, timesUsed: 25, isActive: true },
    { id: 'coup-3', code: 'WELCOME50', description: 'Flat ₹50 OFF on your cart above ₹199', discountType: 'FLAT', discountValue: 50, minOrderValue: 199, maxDiscount: null, validFrom: new Date('2026-01-01'), validTo: new Date('2027-12-31'), usageLimit: 2000, timesUsed: 8, isActive: true },
    { id: 'coup-4', code: 'FLAT100', description: 'Flat ₹100 OFF on mega orders above ₹699', discountType: 'FLAT', discountValue: 100, minOrderValue: 699, maxDiscount: null, validFrom: new Date('2026-01-01'), validTo: new Date('2027-12-31'), usageLimit: 500, timesUsed: 15, isActive: true },
    { id: 'coup-5', code: 'FRESH20', description: 'Special 20% OFF on orders above ₹499', discountType: 'PERCENTAGE', discountValue: 20, minOrderValue: 499, maxDiscount: 200, validFrom: new Date('2026-01-01'), validTo: new Date('2027-12-31'), usageLimit: 500, timesUsed: 3, isActive: true },
  ];

  const storeSettings = {
    id: 'default',
    storeName: 'FreshCart Supermarket',
    tagLine: 'Your Daily Fresh & Reliable Grocery Store across Gujarat',
    logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
    phone: '+91 98765 43210',
    email: 'support@freshcart.com',
    address: 'Shop 101-104, Iscon Elegance, Prahlad Nagar, SG Highway, Ahmedabad, Gujarat 380015',
    mapUrl: 'https://maps.google.com/?q=23.0135,72.5085',
    openingHours: 'Mon - Sun: 7:00 AM - 10:00 PM',
    gstin: '24AABCF1234F1Z8',
    pan: 'AABCF1234F',
    cin: 'U52100GJ2022PTC130456',
    fssai: '10722001000543',
    invoicePrefix: 'INV-',
    invoiceNextNumber: 1005,
    invoiceFooterText: 'Thank you for shopping with FreshCart Gujarat! Goods once sold can be returned within 24 hours for perishable products and 7 days for packaged goods.',
    minOrderValue: 149,
    defaultDeliveryCharge: 40,
    banners: [
      { id: 'banner-1', title: 'Farm Fresh Fruits & Vegetables', subtitle: 'Direct from organic farmers across Gujarat, hand-picked daily', buttonText: 'Shop Produce', link: '/products?category=fruits-vegetables', badge: 'Daily Fresh' },
      { id: 'banner-2', title: 'Daily Essentials & Dairy Hub', subtitle: 'Amul fresh milk, bread, butter & farm-fresh eggs', buttonText: 'Order Essentials', link: '/products?category=dairy-bread-eggs', badge: '100% Pure' },
      { id: 'banner-3', title: 'Staples, Atta & Premium Rice', subtitle: 'Use coupon FRESH15 for 15% discount on your order', buttonText: 'Explore Staples', link: '/products?category=atta-rice-dals', badge: 'Best Value' },
    ],
  };

  const initialOrder = {
    id: 'ord-1001',
    orderNumber: 'ORD-20261028-1001',
    invoiceNumber: 'INV-2026-27/001001',
    userId: 'user-customer',
    isGuest: false,
    customerName: 'Priya Patel',
    customerPhone: '9876543210',
    customerEmail: 'customer@example.com',
    shippingAddressSnapshot: {
      street: 'Flat 402, Shivalik High Street, Prahlad Nagar',
      landmark: 'Near Titanium Square',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
    },
    status: 'PLACED',
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    deliveryType: 'DELIVERY',
    deliverySlot: 'Morning (8:00 AM - 11:00 AM)',
    estimatedDeliveryDate: new Date(Date.now() + 7200000).toISOString(),
    trackingNumber: 'TRK-GJ-884920',
    carrier: 'FreshCart Express Gujarat',
    trackingNotes: 'Order received and dispatched to SG Highway fulfillment center',
    cancellationStatus: 'NONE',
    pincode: '380015',
    subtotal: 546,
    taxTotal: 25.5,
    discountTotal: 50,
    deliveryCharge: 0,
    grandTotal: 496,
    couponCodeSnapshot: 'FLAT50',
    createdAt: new Date(Date.now() - 3600000),
    items: [
      { id: 'item-1', orderId: 'ord-1001', productId: 'prod-12', productName: 'Aashirvaad Superior Sharbati Atta', productSku: 'STA-ATT-012', unit: '5 kg', unitPrice: 295, mrp: 330, taxPercent: 5, taxAmount: 14.05, quantity: 1, lineTotal: 295 },
      { id: 'item-2', orderId: 'ord-1001', productId: 'prod-7', productName: 'Amul Taaza Homogenised Toned Milk', productSku: 'DAI-AMU-007', unit: '1 L Tetra', unitPrice: 74, mrp: 75, taxPercent: 0, taxAmount: 0, quantity: 2, lineTotal: 148 },
      { id: 'item-3', orderId: 'ord-1001', productId: 'prod-1', productName: 'Fresh Farm Tomatoes (Hybrid)', productSku: 'VEG-TOM-001', unit: '1 kg', unitPrice: 38, mrp: 45, taxPercent: 0, taxAmount: 0, quantity: 2, lineTotal: 76 },
    ],
    statusHistory: [
      { id: 'hist-1', orderId: 'ord-1001', fromStatus: null, toStatus: 'PLACED', note: 'Order placed via online store', createdAt: new Date(Date.now() - 3600000) },
      { id: 'hist-2', orderId: 'ord-1001', fromStatus: 'PLACED', toStatus: 'CONFIRMED', note: 'Order verified by store manager', createdAt: new Date(Date.now() - 2400000) },
    ],
  };

  const initialNotifications = [
    {
      id: 'notif-1',
      recipientType: 'ADMIN',
      orderId: 'ord-1001',
      orderNumber: 'ORD-20261028-1001',
      title: 'New Grocery Order Placed',
      message: 'Priya Patel placed order #ORD-20261028-1001 for ₹496.00 (COD)',
      type: 'NEW_ORDER',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000),
    },
  ];

  const initialInvoice = {
    id: 'inv-1001',
    invoiceNumber: 'INV-2026-27/001001',
    orderId: 'ord-1001',
    orderNumber: 'ORD-20261028-1001',
    userId: 'user-customer',
    customerName: 'Priya Patel',
    customerPhone: '9876543210',
    customerEmail: 'customer@example.com',
    shippingAddress: {
      street: 'Flat 402, Shivalik High Street, Prahlad Nagar',
      landmark: 'Near Titanium Square',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
    },
    subtotal: 546,
    taxableAmount: 519.05,
    cgstAmount: 13.48,
    sgstAmount: 13.47,
    igstAmount: 0,
    deliveryCharge: 0,
    discountAmount: 50,
    grandTotal: 496,
    placeOfSupply: 'Gujarat (State Code: 24)',
    status: 'ISSUED',
    creditNoteNumber: null,
    createdAt: new Date(Date.now() - 3600000),
  };

  return {
    storeSettings,
    users,
    categories,
    products,
    deliveryAreas,
    coupons,
    orders: [initialOrder],
    orderItems: initialOrder.items,
    orderStatusHistory: initialOrder.statusHistory,
    notifications: initialNotifications,
    cancellationRequests: [],
    invoices: [initialInvoice],
    creditNotes: [],
    stockMovementLedger: [
      { id: 'sm-1', productId: 'prod-12', type: 'SALE_DEDUCTION', quantityChange: -1, balanceAfter: 40, reason: 'Order #ORD-20261028-1001 placed', referenceType: 'ORDER', referenceId: 'ORD-20261028-1001', createdAt: new Date() },
    ],
    auditLogs: [
      { id: 'log-1', action: 'STORE_INITIALIZED', entity: 'System', entityId: 'init', details: { mode: 'development' }, ipAddress: '127.0.0.1', createdAt: new Date() },
    ],
    otpVerifications: [],
  };
}


'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDeliveryAuth } from '@/context/DeliveryAuthContext';
import { useSocket } from '@/context/SocketContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Truck,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Navigation,
  LogOut,
  Sun,
  Moon,
  DollarSign,
  X,
  Check,
  ShieldCheck,
  AlertCircle,
  PackageCheck,
  User,
} from 'lucide-react';

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddressSnapshot: any;
  pincode?: string;
  status: string;
  deliveryStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  grandTotal: number;
  deliverySlot?: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unit: string;
    lineTotal: number;
  }>;
  assignedAt?: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  deliveryLocation?: any;
  failureReason?: string;
  createdAt: string;
}

interface Counters {
  todayAssigned: number;
  totalAssigned: number;
  pendingDeliveries: number;
  outForDelivery: number;
  delivered: number;
  failed: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function DeliveryDashboardPage() {
  const router = useRouter();
  const { deliveryPerson, token, loading: authLoading, logout } = useDeliveryAuth();
  const { socket } = useSocket();
  const { isDark, toggleTheme } = useTheme();

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [counters, setCounters] = useState<Counters>({
    todayAssigned: 0,
    totalAssigned: 0,
    pendingDeliveries: 0,
    outForDelivery: 0,
    delivered: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED'>('ACTIVE');

  // Confirmation modal state (NO OTP)
  const [confirmModalOrder, setConfirmModalOrder] = useState<DeliveryOrder | null>(null);
  const [confirmDeliveryNotes, setConfirmDeliveryNotes] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  // Failure modal state
  const [failModalOrder, setFailModalOrder] = useState<DeliveryOrder | null>(null);
  const [failureReason, setFailureReason] = useState('Customer not available');
  const [failing, setFailing] = useState(false);

  // Global toast/notification
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  // Route protection
  useEffect(() => {
    if (!authLoading && !deliveryPerson) {
      router.push('/login');
    }
  }, [deliveryPerson, authLoading, router]);

  const fetchOrders = useCallback(async () => {
    const savedToken = token || localStorage.getItem('freshcart_delivery_token');
    if (!savedToken) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/delivery/orders?filter=${activeTab}`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setOrders(data.data.orders || []);
        if (data.data.counters) {
          setCounters(data.data.counters);
        }
      }
    } catch (err) {
      console.error('Failed to fetch delivery orders:', err);
    } finally {
      setLoading(false);
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (deliveryPerson) {
      fetchOrders();
    }
  }, [deliveryPerson, fetchOrders]);

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket || !deliveryPerson) return;

    socket.on('order_assigned', (data: any) => {
      if (!data?.deliveryPersonId || data.deliveryPersonId === deliveryPerson.id) {
        setToastMessage({
          title: 'New Order Ready for Delivery!',
          desc: `Order #${data.orderNumber} to ${data.customerName || 'customer'} is ready.`,
        });
        fetchOrders();
      }
    });

    socket.on('new_order', (data: any) => {
      setToastMessage({
        title: 'New Order Received!',
        desc: `Order #${data?.order?.orderNumber || ''} is available for delivery.`,
      });
      fetchOrders();
    });

    socket.on('order_updated', () => {
      fetchOrders();
    });

    socket.on('delivery_order_updated', () => {
      fetchOrders();
    });

    socket.on('order_status_updated', () => {
      fetchOrders();
    });

    return () => {
      socket.off('order_assigned');
      socket.off('new_order');
      socket.off('order_updated');
      socket.off('delivery_order_updated');
      socket.off('order_status_updated');
    };
  }, [socket, deliveryPerson, fetchOrders]);

  // Update delivery status API helper
  const handleUpdateStatus = async (orderId: string, status: string, payload: any = {}) => {
    const savedToken = token || localStorage.getItem('freshcart_delivery_token');
    if (!savedToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/delivery/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({ status, ...payload }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setToastMessage({
          title: `Status: ${status}`,
          desc: data.message || `Order #${data.order?.orderNumber} updated.`,
        });
        fetchOrders();
      } else {
        alert(data.message || 'Failed to update order delivery status.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error updating delivery status.');
    }
  };

  // Submit NO OTP self-confirmation
  const handleConfirmDelivered = async () => {
    if (!confirmModalOrder) return;
    setConfirming(true);

    let coords: { latitude: number; longitude: number } | undefined = undefined;

    // Optional GPS capture if browser supports it
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        setLocationStatus('Acquiring GPS coordinates...');
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      } catch {
        // GPS permission denied or timed out - continue gracefully without blocking delivery
        console.warn('Geolocation capture skipped or denied.');
      }
    }

    await handleUpdateStatus(confirmModalOrder.id, 'DELIVERED', {
      deliveryNotes: confirmDeliveryNotes || 'Order handed over directly to recipient.',
      deliveryLocation: coords,
    });

    setConfirming(false);
    setConfirmModalOrder(null);
    setConfirmDeliveryNotes('');
    setLocationStatus('');
  };

  // Submit delivery failure
  const handleConfirmFailed = async () => {
    if (!failModalOrder) return;
    setFailing(true);

    await handleUpdateStatus(failModalOrder.id, 'FAILED', {
      failureReason,
    });

    setFailing(false);
    setFailModalOrder(null);
  };

  if (authLoading || !deliveryPerson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading delivery app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto w-full pb-20 relative bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Top Mobile Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">
                {deliveryPerson.name}
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="Active on Road" />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {deliveryPerson.vehicleType || 'Motorcycle'} • {deliveryPerson.vehicleNumber || 'Gujarat Fleet'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            aria-label="Refresh orders"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Log Out"
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Real-time Toast Alert */}
      {toastMessage && (
        <div className="mx-4 mt-3 p-3.5 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 flex items-start justify-between gap-2 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-black text-xs">{toastMessage.title}</p>
              <p className="text-[11px] opacity-90">{toastMessage.desc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-white/80 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Counters Grid */}
      <div className="p-4 grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            {counters.todayAssigned}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Assigned today</span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
            <Truck className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400">
            {counters.pendingDeliveries}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">To fulfill</span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Delivered</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {counters.delivered}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Completed</span>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeTab === 'ACTIVE'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Active Deliveries ({counters.pendingDeliveries + counters.outForDelivery})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeTab === 'ALL'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All ({counters.totalAssigned})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DELIVERED')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeTab === 'DELIVERED'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Delivered ({counters.delivered})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FAILED')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              activeTab === 'FAILED'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Failed ({counters.failed})
          </button>
        </div>
      </div>

      {/* Orders List Content */}
      <div className="px-4 space-y-4">
        {loading && orders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Fetching assigned orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
            <PackageCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm">No orders in this view</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {activeTab === 'ACTIVE'
                ? 'You currently have no active deliveries pending fulfillment.'
                : 'No delivery records match this category.'}
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const isDelivered = order.deliveryStatus === 'DELIVERED' || order.status === 'DELIVERED';
            const isOutForDelivery = order.deliveryStatus === 'OUT_FOR_DELIVERY';
            const isAccepted = order.deliveryStatus === 'ACCEPTED';
            const isPickedUp = order.deliveryStatus === 'PICKED_UP';
            const isAssigned = !order.deliveryStatus || order.deliveryStatus === 'ASSIGNED';
            const isFailed = order.deliveryStatus === 'FAILED';

            const addressStr = `${order.shippingAddressSnapshot?.street || order.shippingAddressSnapshot?.addressLine1 || ''}, ${order.shippingAddressSnapshot?.city || 'Ahmedabad'}, Gujarat - ${order.shippingAddressSnapshot?.pincode || order.pincode || ''}`;
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`;

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs"
              >
                {/* Order Top Bar */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                      #{order.orderNumber}
                    </span>
                    {order.deliverySlot && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {order.deliverySlot}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isDelivered && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Delivered
                      </span>
                    )}
                    {isOutForDelivery && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-extrabold text-[11px] animate-pulse">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        Out for Delivery
                      </span>
                    )}
                    {isPickedUp && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-extrabold text-[11px]">
                        <PackageCheck className="w-3.5 h-3.5 text-purple-600" />
                        Picked Up
                      </span>
                    )}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Accepted
                      </span>
                    )}
                    {isAssigned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 font-extrabold text-[11px]">
                        Assigned
                      </span>
                    )}
                    {isFailed && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-extrabold text-[11px]">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Delivery Failed
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer & Address Details */}
                <div className="p-4 space-y-3">
                  {/* Customer row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                        {order.customerName?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block text-xs">
                          {order.customerName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {order.customerPhone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1 font-bold text-xs"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>

                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition flex items-center gap-1 font-bold text-xs"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Map</span>
                      </a>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {order.shippingAddressSnapshot?.street || order.shippingAddressSnapshot?.addressLine1}
                        {order.shippingAddressSnapshot?.landmark ? `, Near ${order.shippingAddressSnapshot?.landmark}` : ''}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {order.shippingAddressSnapshot?.city || 'Ahmedabad'}, Gujarat —{' '}
                        <strong className="text-emerald-700 dark:text-emerald-400">{order.shippingAddressSnapshot?.pincode}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">
                      Items Checklist ({order.items?.length || 0})
                    </span>
                    <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                      {order.items?.map((it) => (
                        <li key={it.id} className="flex justify-between items-center text-[11px]">
                          <span>
                            • <strong>{it.quantity}x</strong> {it.productName} ({it.unit})
                          </span>
                          <span className="font-mono text-slate-500">₹{Number(it.lineTotal).toFixed(0)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Amount & Payment Info */}
                  <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                        Payment Mode: {order.paymentMethod}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 block">
                        {order.paymentMethod === 'COD' ? (
                          order.paymentStatus === 'COLLECTED' ? (
                            <strong className="text-emerald-600 dark:text-emerald-400">Cash Collected at Doorstep</strong>
                          ) : (
                            <strong className="text-amber-700 dark:text-amber-400 font-black">
                              Collect ₹{Number(order.grandTotal).toFixed(0)} in Cash
                            </strong>
                          )
                        ) : (
                          <strong className="text-emerald-600 dark:text-emerald-400">Prepaid Online ({order.paymentStatus})</strong>
                        )}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                        ₹{Number(order.grandTotal).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Completed / Failed Details */}
                  {isDelivered && (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Successfully Delivered at {order.deliveredAt ? new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'doorstep'}</span>
                      </div>
                      <p className="mt-1 text-[10px] opacity-80">
                        Independent confirmation registered (No OTP). Customer live tracking notified.
                      </p>
                    </div>
                  )}

                  {isFailed && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300">
                      <span className="font-bold block">Delivery Failed:</span>
                      <p className="mt-0.5">{order.failureReason || 'Customer was unreachable at address.'}</p>
                    </div>
                  )}

                  {/* Action Buttons Workflow */}
                  {!isDelivered && !isFailed && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                      {isAssigned && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <Check className="w-4 h-4" />
                          <span>Accept Order</span>
                        </button>
                      )}

                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order.id, 'PICKED_UP')}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>Mark Picked Up</span>
                        </button>
                      )}

                      {isPickedUp && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Out for Delivery</span>
                        </button>
                      )}

                      {isOutForDelivery && (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmModalOrder(order)}
                            className="flex-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition active:scale-98"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Mark as Delivered (No OTP)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFailModalOrder(order)}
                            className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1 transition"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Failed</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONFIRMATION MODAL (NO OTP) */}
      {confirmModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Self-Confirm Delivery
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Independent Driver Confirmation • No OTP Needed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalOrder(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  #{confirmModalOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {confirmModalOrder.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Address:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-right max-w-[200px] truncate">
                  {confirmModalOrder.shippingAddressSnapshot?.street || confirmModalOrder.shippingAddressSnapshot?.addressLine1}
                </span>
              </div>

              {confirmModalOrder.paymentMethod === 'COD' && (
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 flex justify-between items-center text-amber-800 dark:text-amber-400 font-bold">
                  <span>Cash on Delivery to Collect:</span>
                  <span className="text-sm font-black font-mono">
                    ₹{Number(confirmModalOrder.grandTotal).toFixed(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Delivery Notes (Optional)
              </label>
              <input
                type="text"
                value={confirmDeliveryNotes}
                onChange={(e) => setConfirmDeliveryNotes(e.target.value)}
                placeholder="e.g. Handed to customer at door / Left with security"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {locationStatus && (
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mb-3 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 animate-spin" />
                <span>{locationStatus}</span>
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmModalOrder(null)}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirmDelivered}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
              >
                {confirming ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Delivered</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAILURE MODAL */}
      {failModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Report Delivery Failure
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Order #{failModalOrder.orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFailModalOrder(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Reason for Failure
              </label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              >
                <option value="Customer not available / Door locked">Customer not available / Door locked</option>
                <option value="Customer phone unreachable / Switched off">Customer phone unreachable / Switched off</option>
                <option value="Incorrect or incomplete delivery address">Incorrect or incomplete delivery address</option>
                <option value="Customer refused acceptance of order">Customer refused acceptance of order</option>
                <option value="Customer did not have cash for COD">Customer did not have cash for COD</option>
                <option value="Extreme weather or vehicle breakdown">Extreme weather or vehicle breakdown</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFailModalOrder(null)}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={failing}
                onClick={handleConfirmFailed}
                className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {failing ? 'Submitting...' : 'Confirm Failed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


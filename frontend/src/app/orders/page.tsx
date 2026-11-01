'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ArrowRight,
  Clock,
  Search,
  Download,
  Truck,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Radio,
  Printer,
  RotateCcw,
  Home,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';

export default function OrdersHistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { socket, isConnected } = useSocket();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    if (user) {
      try {
        const res = await api.getMyOrders();
        if (res.success && res.data) {
          setOrders(res.data);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    } else {
      // Check for guest orders placed on this device
      try {
        const rawGuest = typeof window !== 'undefined' ? localStorage.getItem('freshcart_guest_orders') : null;
        const guestList: Array<{ id: string; orderNumber: string }> = rawGuest ? JSON.parse(rawGuest) : [];
        if (guestList.length > 0) {
          const promises = guestList.map((g) => api.trackOrder(g.id || g.orderNumber));
          const results = await Promise.allSettled(promises);
          const fetchedOrders = results
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value?.success && r.value?.data)
            .map((r) => r.value.data);
          setOrders(fetchedOrders);
        } else {
          setOrders([]);
        }
      } catch {
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOrders();
  }, [user, authLoading]);

  // Real-time synchronization for customer order list
  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdated = (data: any) => {
      const updatedOrder = data.order || data;
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === updatedOrder.id || ord.orderNumber === updatedOrder.orderNumber) {
            return { ...ord, ...updatedOrder };
          }
          return ord;
        })
      );

      if (updatedOrder.id) {
        setJustUpdatedId(updatedOrder.id);
        setTimeout(() => setJustUpdatedId(null), 3500);
      }
    };

    const handleOrderCreated = (data: any) => {
      const newOrder = data.order;
      if (newOrder) {
        setOrders((prev) => [newOrder, ...prev]);
        setJustUpdatedId(newOrder.id);
        setTimeout(() => setJustUpdatedId(null), 3500);
      }
    };

    socket.on('order_updated', handleOrderUpdated);
    socket.on('order_created', handleOrderCreated);

    return () => {
      socket.off('order_updated', handleOrderUpdated);
      socket.off('order_created', handleOrderCreated);
    };
  }, [socket]);

  const handleGuestLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderNumber.trim()) {
      router.push(`/orders/${encodeURIComponent(searchOrderNumber.trim())}`);
    }
  };

  return (
    <div className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-8 space-y-4 sm:space-y-6 pb-24 lg:pb-8 w-full min-w-0">
      {/* Top Breadcrumb & Home Return Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition group shadow-xs"
        >
          <Home className="w-3.5 h-3.5 text-brand-primary group-hover:scale-110 transition-transform" />
          <span>Home</span>
          <span className="text-slate-400">/</span>
          <span className="text-brand-primary dark:text-emerald-400">Order History</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="pb-5 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Order History & Live Tracking
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              {isConnected ? 'Live Sync' : 'Offline'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Real-time status updates, delivery schedules, and instant tax invoice downloads
          </p>
        </div>

        {/* Quick order tracking lookup for guests & direct lookup */}
        <form onSubmit={handleGuestLookup} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Track by Order # (e.g. ORD-...)"
            value={searchOrderNumber}
            onChange={(e) => setSearchOrderNumber(e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm flex-1 min-w-0"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm whitespace-nowrap"
          >
            Track Live
          </button>
        </form>
      </div>

      {!user && orders.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Showing <strong>{orders.length} order(s)</strong> placed from this browser (Guest Mode). Status updates live!
            </span>
          </div>
          <Link
            href="/login"
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-900 whitespace-nowrap"
          >
            Sign in to save orders to your profile →
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span>Loading your live orders...</span>
        </div>
      ) : orders.length === 0 ? (
        !user ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              No recent guest orders found on this device
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              Track an existing order using the search box above with your Order Number, or sign in to view your complete account history.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Home</span>
              </Link>
              <Link
                href="/products"
                className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl transition"
              >
                Browse Fresh Groceries
              </Link>
              <Link
                href="/login"
                className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl transition"
              >
                Sign In / Register
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-sm">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">No orders placed yet</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              You haven&apos;t placed any grocery orders yet. Discover 1,000+ farm fresh items delivered across Gujarat.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                href="/"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Home</span>
              </Link>
              <Link
                href="/products"
                className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm"
              >
                Start Shopping Fresh
              </Link>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
            const isJustUpdated = justUpdatedId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border ${
                  isJustUpdated
                    ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-emerald-500/20'
                    : 'border-gray-200 dark:border-slate-800'
                } p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-5`}
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-black text-gray-900 dark:text-white text-base">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full ${
                        isDelivered
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : isCancelled
                          ? 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
                          : order.status === 'OUT_FOR_DELIVERY'
                          ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                          : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>

                    {order.cancellationStatus === 'REQUESTED' && !isCancelled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">
                        Cancel Requested
                      </span>
                    )}

                    {isJustUpdated && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                        Just Updated Live
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Invoice: <strong className="text-gray-700 dark:text-slate-200">{order.invoiceNumber}</strong> • Placed on{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  {/* Estimated Delivery Date & Slot */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-slate-300">
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {order.estimatedDeliveryDate
                          ? `Est. Delivery: ${new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : 'Est. Delivery: Within 2 Hours'}
                      </span>
                    </span>
                    <span className="text-gray-300 dark:text-slate-700">•</span>
                    <span>Slot: {order.deliverySlot || 'Standard Delivery'}</span>
                    <span className="text-gray-300 dark:text-slate-700">•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{order.shippingAddressSnapshot?.city || 'Gujarat'} ({order.shippingAddressSnapshot?.pincode})</span>
                    </span>
                  </div>

                  {/* Ordered Items Preview */}
                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 pt-0.5">
                    Items: {order.items?.map((it: any) => `${it.productName} (x${it.quantity})`).join(', ')}
                  </p>
                </div>

                {/* Right Side: Total Amount & Action Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-3 sm:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-slate-800 w-full lg:w-auto">
                  <div className="text-left lg:text-right flex sm:block items-baseline justify-between w-full sm:w-auto gap-2">
                    <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white block">
                      ₹{Number(order.grandTotal).toFixed(2)}
                    </span>
                    <div className="text-right sm:text-inherit">
                      <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                        {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
                      </span>
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        {order.paymentStatus === 'COLLECTED' ? 'Paid' : 'Payable on Delivery'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto justify-end">
                    <Link
                      href={`/orders/${order.id}`}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                      title="View Order Details & Tax Invoice"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <a
                      href={api.getInvoiceUrl(order.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                      title="Download Official GST Tax Invoice (PDF)"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    <a
                      href={api.getInvoicePrintUrl(order.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                      title="Print Tax Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </a>

                    {order.status === 'CANCELLED' && (
                      <a
                        href={api.getCreditNoteUrl(order.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 transition"
                        title="Download GST Credit Note (PDF)"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </a>
                    )}

                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition"
                    >
                      <span>Track Order</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

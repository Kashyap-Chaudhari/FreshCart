'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Eye,
  Download,
  FileText,
  Truck,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Clock,
  Package,
  Radio,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Bike,
  ChevronDown,
  Zap,
  UserCheck,
  Check,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PLACED', label: 'Placed (New)' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const ORDER_STATUS_OPTIONS = [
  { value: 'PLACED', label: '1. Order Placed' },
  { value: 'CONFIRMED', label: '2. Confirmed' },
  { value: 'PROCESSING', label: '3. Processing / Packed' },
  { value: 'SHIPPED', label: '4. Shipped' },
  { value: 'OUT_FOR_DELIVERY', label: '5. Out for Delivery' },
  { value: 'DELIVERED', label: '6. Delivered (Collect COD)' },
  { value: 'CANCELLED', label: '✕ Cancel / Reject' },
];

export default function AdminOrdersPage() {
  const { socket, isConnected } = useSocket();

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // Delivery personnel & assignment state
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [openManualAssignId, setOpenManualAssignId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Counter metrics
  const [counters, setCounters] = useState({
    total: 0,
    newOrders: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
    cancelRequested: 0,
  });

  const loadCounters = useCallback(() => {
    api.adminGetOrderCounters().then((res) => {
      if (res.success && res.data) {
        setCounters(res.data);
      }
    });
  }, []);

  const loadDeliveryPartners = useCallback(() => {
    api.adminGetDeliveryPersons().then((res) => {
      if (res.success && res.data) {
        setDeliveryPartners(res.data);
      }
    });
  }, []);

  const loadOrders = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
    if (selectedPaymentStatus !== 'ALL') params.set('paymentStatus', selectedPaymentStatus);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (dateFilter) {
      const start = new Date(dateFilter);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateFilter);
      end.setHours(23, 59, 59, 999);
      params.set('startDate', start.toISOString());
      params.set('endDate', end.toISOString());
    }
    params.set('page', String(pagination.page));
    params.set('limit', '20');

    api.adminGetOrders(params.toString()).then((res) => {
      if (res.success && res.data) {
        setOrders(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
      setIsLoading(false);
    });
  }, [selectedStatus, selectedPaymentStatus, searchQuery, dateFilter, pagination.page]);

  useEffect(() => {
    loadOrders();
    loadCounters();
    loadDeliveryPartners();
  }, [loadOrders, loadCounters, loadDeliveryPartners]);

  // Click outside listener for partner dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.partner-dropdown-container')) {
        setOpenManualAssignId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Real-time synchronization for admin orders table
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data: any) => {
      const newOrder = data.fullOrder || data.order;
      if (newOrder) {
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
        setNewlyAddedId(newOrder.id);
        setTimeout(() => setNewlyAddedId(null), 4000);
        loadCounters();
        loadDeliveryPartners();
      }
    };

    const handleOrderUpdated = (data: any) => {
      const updated = data.order || data;
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === updated.id || ord.orderNumber === updated.orderNumber) {
            return { ...ord, ...updated };
          }
          return ord;
        })
      );
      loadCounters();
      loadDeliveryPartners();
    };

    const handleCancelRequest = (data: any) => {
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === data.orderId || ord.orderNumber === data.orderNumber) {
            return { ...ord, cancellationStatus: 'REQUESTED' };
          }
          return ord;
        })
      );
      loadCounters();
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_updated', handleOrderUpdated);
    socket.on('cancellation_requested', handleCancelRequest);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_updated', handleOrderUpdated);
      socket.off('cancellation_requested', handleCancelRequest);
    };
  }, [socket, loadCounters, loadDeliveryPartners]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadOrders();
  };

  // 1-Click Fast Advance
  const handleFastAdvance = async (order: any) => {
    const nextMap: Record<string, { next: string; label: string }> = {
      PLACED: { next: 'CONFIRMED', label: 'Confirmed' },
      CONFIRMED: { next: 'PROCESSING', label: 'Processing / Packed' },
      PROCESSING: { next: 'SHIPPED', label: 'Shipped' },
      SHIPPED: { next: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
      OUT_FOR_DELIVERY: { next: 'DELIVERED', label: 'Delivered' },
    };

    const target = nextMap[order.status];
    if (!target) return;

    setUpdatingOrderId(order.id);
    try {
      const res = await api.adminUpdateOrderStatus(
        order.id,
        target.next,
        `1-Click Fast Update to ${target.next}`
      );
      if (res.success && res.data) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...res.data } : o)));
        loadCounters();
        loadDeliveryPartners();

        if (target.next === 'SHIPPED') {
          const partnerName = res.data.deliveryPersonName;
          showToast(
            'success',
            partnerName
              ? `✓ Order #${order.orderNumber} moved to Shipped & automatically assigned to ${partnerName}!`
              : `✓ Order #${order.orderNumber} moved to Shipped!`
          );
        } else if (target.next === 'DELIVERED') {
          showToast('success', `✓ Order #${order.orderNumber} delivered! Cash on Delivery collected.`);
        } else {
          showToast('success', `✓ Order #${order.orderNumber} advanced to ${target.label}!`);
        }
      } else {
        showToast('error', res.message || 'Failed to update order status');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error updating order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Direct Status Override via Dropdown
  const handleQuickStatusChange = async (orderId: string, nextStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await api.adminUpdateOrderStatus(orderId, nextStatus, `Updated via quick admin control`);
      if (res.success && res.data) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...res.data } : o)));
        loadCounters();
        loadDeliveryPartners();

        if (nextStatus === 'SHIPPED') {
          const partnerName = res.data.deliveryPersonName;
          showToast(
            'success',
            partnerName
              ? `✓ Order marked Shipped & automatically assigned to ${partnerName}!`
              : `✓ Order marked Shipped!`
          );
        } else {
          showToast('success', `✓ Order status updated to ${nextStatus}`);
        }
      } else {
        showToast('error', res.message || 'Failed to change status');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error changing status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Auto-Assign Best Available Partner
  const handleAutoAssign = async (orderId: string, orderNumber: string) => {
    setAssigningOrderId(orderId);
    try {
      const res = await api.adminAutoAssignOrderDelivery(orderId);
      if (res.success && res.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...res.order } : o)));
        loadDeliveryPartners();
        showToast(
          'success',
          `✓ Order #${orderNumber} automatically assigned to ${res.order.deliveryPersonName}!`
        );
      } else {
        showToast('error', res.message || 'No active delivery partner available to auto-assign');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error auto-assigning delivery partner');
    } finally {
      setAssigningOrderId(null);
    }
  };

  // Manual Partner Selection
  const handleManualAssign = async (orderId: string, orderNumber: string, deliveryPersonId: string) => {
    setAssigningOrderId(orderId);
    try {
      const res = await api.adminAssignOrderDelivery(orderId, deliveryPersonId);
      if (res.success && res.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...res.order } : o)));
        setOpenManualAssignId(null);
        loadDeliveryPartners();
        showToast(
          'success',
          `✓ Order #${orderNumber} manually assigned to ${res.order.deliveryPersonName}!`
        );
      } else {
        showToast('error', res.message || 'Failed to assign delivery partner');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error assigning delivery partner');
    } finally {
      setAssigningOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Real-Time Orders & Dispatch
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {isConnected ? 'Real-Time Sync Active' : 'Connecting...'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            1-Click instant status updates, automated delivery partner dispatch upon shipping & flexible manual assignment
          </p>
        </div>

        {/* Search & Refresh Actions */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-64">
            <input
              type="text"
              placeholder="Search Order #, Phone, Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <button
            onClick={() => {
              loadOrders();
              loadCounters();
              loadDeliveryPartners();
            }}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-xl transition shadow-sm"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all shadow-md animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-rose-600 text-white shadow-rose-600/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white ml-3 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Orders</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">{counters.total}</span>
          <span className="text-[10px] text-slate-400">All-time</span>
        </div>

        {/* Placed / New Orders */}
        <div
          onClick={() => setSelectedStatus('PLACED')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-sm cursor-pointer hover:border-blue-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">New (Placed)</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          </div>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block">{counters.newOrders}</span>
          <span className="text-[10px] text-slate-400">Awaiting confirmation</span>
        </div>

        {/* Processing */}
        <div
          onClick={() => setSelectedStatus('PROCESSING')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm cursor-pointer hover:border-amber-400 transition"
        >
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Processing</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{counters.processing + counters.confirmed}</span>
          <span className="text-[10px] text-slate-400">Being packed</span>
        </div>

        {/* Shipped / Out for Delivery */}
        <div
          onClick={() => setSelectedStatus('OUT_FOR_DELIVERY')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/50 shadow-sm cursor-pointer hover:border-purple-400 transition"
        >
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">Dispatched</span>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block">{counters.shipped + counters.outForDelivery}</span>
          <span className="text-[10px] text-slate-400">Out with partner</span>
        </div>

        {/* Delivered */}
        <div
          onClick={() => setSelectedStatus('DELIVERED')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm cursor-pointer hover:border-emerald-400 transition"
        >
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Delivered</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{counters.delivered}</span>
          <span className="text-[10px] text-emerald-600 font-semibold">COD Collected</span>
        </div>

        {/* Cancelled / Requests */}
        <div
          onClick={() => setSelectedStatus('CANCELLED')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm cursor-pointer hover:border-rose-400 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Cancelled</span>
            {counters.cancelRequested > 0 && (
              <span className="text-[9px] font-extrabold bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
                {counters.cancelRequested} req
              </span>
            )}
          </div>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block">{counters.cancelled}</span>
          <span className="text-[10px] text-slate-400">Restored to stock</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        {/* Status Tabs */}
        <div className="flex overflow-x-auto gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedStatus(tab.key);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition ${
                selectedStatus === tab.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdown Filters (Payment & Date) */}
        <div className="flex items-center gap-2">
          {/* Payment Status Filter */}
          <select
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Payment: All</option>
            <option value="PENDING">Pending (COD)</option>
            <option value="COLLECTED">Collected / Paid</option>
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none"
          />

          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-[10px] text-rose-500 hover:underline font-semibold"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="py-3 px-4">Order # / Invoice</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Est. Delivery & Slot</th>
                <th className="py-3 px-4">Items / Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Live Stage</th>
                <th className="py-3 px-4">Delivery Partner</th>
                <th className="py-3 px-4">Quick Update</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                    Loading real-time orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isNewFlash = newlyAddedId === order.id;
                  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isNewFlash ? 'bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500' : ''
                      }`}
                    >
                      {/* Order # and Invoice */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition"
                          >
                            #{order.orderNumber}
                          </Link>
                          {isNewFlash && (
                            <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                          {order.invoiceNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {order.customerName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          {order.customerPhone}
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                          📍 {order.shippingAddressSnapshot?.city || 'Gujarat'} ({order.shippingAddressSnapshot?.pincode})
                        </span>
                      </td>

                      {/* Estimated Delivery & Slot */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {order.estimatedDeliveryDate
                            ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Within 2 Hours'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          Slot: {order.deliverySlot || 'Standard Express'}
                        </span>
                        {order.trackingNumber && (
                          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold block">
                            AWB: {order.trackingNumber}
                          </span>
                        )}
                      </td>

                      {/* Items & Total Amount */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                          ₹{Number(order.grandTotal).toFixed(0)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {order.items?.length || 0} grocery items
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            order.paymentStatus === 'COLLECTED'
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400'
                          }`}
                        >
                          {order.paymentStatus === 'COLLECTED' ? 'Paid' : 'Payable (COD)'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {order.paymentMethod}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                              : isCancelled
                              ? 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300'
                              : order.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300'
                              : order.status === 'SHIPPED'
                              ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300'
                              : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>

                        {order.cancellationStatus === 'REQUESTED' && !isCancelled && (
                          <span className="block text-[9px] font-extrabold text-amber-600 dark:text-amber-400 mt-1 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                            ⚠ Cancel Requested
                          </span>
                        )}
                      </td>

                      {/* Dedicated Delivery Partner Column (Auto & Manual Selection) */}
                      <td className="py-3.5 px-4">
                        {isCancelled ? (
                          <span className="text-[10px] text-slate-400 italic">N/A</span>
                        ) : order.deliveryPersonName ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-xs shadow-2xs">
                              <Bike className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>{order.deliveryPersonName}</span>
                            </div>

                            {order.status !== 'DELIVERED' && (
                              <div className="relative partner-dropdown-container">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenManualAssignId(openManualAssignId === order.id ? null : order.id)
                                  }
                                  className="text-[10px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold underline block"
                                >
                                  Change Partner
                                </button>

                                {/* Manual Selection Popover */}
                                {openManualAssignId === order.id && (
                                  <div className="absolute left-0 top-full mt-1.5 z-40 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 space-y-1 animate-in fade-in duration-150">
                                    <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-700">
                                      Reassign Delivery Partner
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                      {deliveryPartners.map((dp) => (
                                        <button
                                          key={dp.id}
                                          type="button"
                                          disabled={assigningOrderId === order.id}
                                          onClick={() => handleManualAssign(order.id, order.orderNumber, dp.id)}
                                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                                            dp.id === order.deliveryPersonId
                                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold'
                                              : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                                          }`}
                                        >
                                          <div>
                                            <span className="font-bold block">{dp.name}</span>
                                            <span className="text-[10px] text-slate-400 block">
                                              {dp.vehicleType || 'Bike'} • {dp.phone}
                                            </span>
                                          </div>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                                            {dp.activeOrders || 0} active
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                    <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                                      <button
                                        type="button"
                                        onClick={() => handleAutoAssign(order.id, order.orderNumber)}
                                        className="w-full text-center py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold text-[11px] transition flex items-center justify-center gap-1"
                                      >
                                        <Zap className="w-3 h-3 text-purple-600" />
                                        <span>Auto-Pick Least Busy</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* No Partner Assigned Yet */
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 partner-dropdown-container relative">
                              {/* 1-Click Auto Assign Button */}
                              <button
                                type="button"
                                disabled={assigningOrderId === order.id}
                                onClick={() => handleAutoAssign(order.id, order.orderNumber)}
                                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-[11px] shadow-xs hover:shadow transition flex items-center gap-1 active:scale-95 disabled:opacity-50"
                                title="Directly assign least-busy partner automatically"
                              >
                                {assigningOrderId === order.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Zap className="w-3 h-3" />
                                )}
                                <span>Auto-Assign</span>
                              </button>

                              {/* Manual Select Trigger */}
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenManualAssignId(openManualAssignId === order.id ? null : order.id)
                                }
                                className="p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Choose partner manually"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Manual Selection Dropdown Popover */}
                              {openManualAssignId === order.id && (
                                <div className="absolute left-0 top-full mt-1.5 z-40 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 space-y-1 animate-in fade-in duration-150">
                                  <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-700">
                                    Choose Partner Manually
                                  </div>
                                  <div className="max-h-48 overflow-y-auto space-y-1">
                                    {deliveryPartners.length === 0 ? (
                                      <div className="p-3 text-center text-xs text-slate-400">
                                        No active delivery partners registered.
                                      </div>
                                    ) : (
                                      deliveryPartners.map((dp) => (
                                        <button
                                          key={dp.id}
                                          type="button"
                                          disabled={assigningOrderId === order.id}
                                          onClick={() => handleManualAssign(order.id, order.orderNumber, dp.id)}
                                          className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center justify-between"
                                        >
                                          <div>
                                            <span className="font-bold block">{dp.name}</span>
                                            <span className="text-[10px] text-slate-400 block">
                                              {dp.vehicleType || 'Bike'} • {dp.phone}
                                            </span>
                                          </div>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                                            {dp.activeOrders || 0} active
                                          </span>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block font-medium">Unassigned</span>
                          </div>
                        )}
                      </td>

                      {/* 1-Click Quick Update Action Column */}
                      <td className="py-3.5 px-4">
                        {!isCancelled && order.status !== 'DELIVERED' ? (
                          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                            {/* 1-Click Primary Action Button based on current stage */}
                            {order.status === 'PLACED' && (
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleFastAdvance(order)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow flex items-center gap-1.5 active:scale-95 transition disabled:opacity-50 whitespace-nowrap"
                                title="1-Click: Accept and confirm order"
                              >
                                {updatingOrderId === order.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                <span>Confirm Order</span>
                              </button>
                            )}

                            {order.status === 'CONFIRMED' && (
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleFastAdvance(order)}
                                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm hover:shadow flex items-center gap-1.5 active:scale-95 transition disabled:opacity-50 whitespace-nowrap"
                                title="1-Click: Start packing fresh groceries"
                              >
                                {updatingOrderId === order.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Package className="w-3.5 h-3.5" />
                                )}
                                <span>Start Packing</span>
                              </button>
                            )}

                            {order.status === 'PROCESSING' && (
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleFastAdvance(order)}
                                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm hover:shadow flex items-center gap-1.5 active:scale-95 transition disabled:opacity-50 whitespace-nowrap"
                                title="1-Click: Mark Shipped & Automatically assign delivery partner"
                              >
                                {updatingOrderId === order.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Truck className="w-3.5 h-3.5" />
                                )}
                                <span>Ship & Auto-Assign</span>
                              </button>
                            )}

                            {order.status === 'SHIPPED' && (
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleFastAdvance(order)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:shadow flex items-center gap-1.5 active:scale-95 transition disabled:opacity-50 whitespace-nowrap"
                                title="1-Click: Mark Out for Delivery"
                              >
                                {updatingOrderId === order.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Bike className="w-3.5 h-3.5" />
                                )}
                                <span>Out for Delivery</span>
                              </button>
                            )}

                            {order.status === 'OUT_FOR_DELIVERY' && (
                              <button
                                type="button"
                                disabled={updatingOrderId === order.id}
                                onClick={() => handleFastAdvance(order)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm hover:shadow flex items-center gap-1.5 active:scale-95 transition disabled:opacity-50 whitespace-nowrap"
                                title="1-Click: Mark delivered & collect Cash on Delivery"
                              >
                                {updatingOrderId === order.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                <span>Mark Delivered</span>
                              </button>
                            )}
                          </div>
                        ) : order.status === 'DELIVERED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Cancelled</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/orders/${order.id}`}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Open Order Details & Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <a
                            href={api.adminGetInvoiceUrl(order.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Print Tax Invoice PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

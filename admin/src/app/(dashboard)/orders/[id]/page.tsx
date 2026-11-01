'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileText,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Repeat,
  DollarSign,
  Package,
  Calendar,
  Radio,
  Clock,
  ShieldCheck,
  Check,
  MapPin,
  Info,
  Bike,
  Printer,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

const SIX_STAGES_LIST = [
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const [order, setOrder] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status update
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delivery details update state
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingNotes, setTrackingNotes] = useState('');
  const [updatingDelivery, setUpdatingDelivery] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Cancellation review modal/action
  const [reviewingCancel, setReviewingCancel] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  // Item substitution modal
  const [substituteItem, setSubstituteItem] = useState<any>(null);
  const [replacementProductId, setReplacementProductId] = useState('');
  const [replacementQty, setReplacementQty] = useState(1);
  const [substitutionNote, setSubstitutionNote] = useState('');
  const [substituting, setSubstituting] = useState(false);

  // Delivery partner assignment state
  const [deliveryPersonnel, setDeliveryPersonnel] = useState<any[]>([]);
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState('');
  const [assigningDelivery, setAssigningDelivery] = useState(false);

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const loadData = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    api.trackOrder(String(id)).then((res) => {
      if (res.success && res.data) {
        const ord = res.data;
        setOrder(ord);
        setNewStatus(ord.status);
        setCarrier(ord.carrier || 'FreshCart Express Gujarat');
        setTrackingNumber(ord.trackingNumber || '');
        setTrackingNotes(ord.trackingNotes || '');
        if (ord.deliveryPersonId) {
          setSelectedDeliveryPersonId(ord.deliveryPersonId);
        }
        if (ord.estimatedDeliveryDate) {
          try {
            const d = new Date(ord.estimatedDeliveryDate);
            const pad = (n: number) => String(n).padStart(2, '0');
            const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            setEstimatedDeliveryDate(localIso);
          } catch {
            setEstimatedDeliveryDate('');
          }
        }
      }
      setIsLoading(false);
    });

    api.getProducts('limit=100').then((res) => {
      if (res.success && res.data) setProducts(res.data);
    });

    api.adminGetDeliveryPersons().then((res) => {
      if (res.success && res.data) setDeliveryPersonnel(res.data);
    });
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization for order detail page
  useEffect(() => {
    if (!socket || !order?.id) return;

    socket.emit('join_order_room', order.id);

    const handleOrderUpdated = (data: any) => {
      if (data && (data.orderId === order.id || data.orderNumber === order.orderNumber)) {
        setOrder((prev: any) => ({
          ...prev,
          ...(data.order || data),
        }));
        setMessage({ type: 'success', text: `Real-time update received: Status is ${data.status || 'Updated'}` });
      }
    };

    const handleCancelRequest = (data: any) => {
      if (data && (data.orderId === order.id || data.orderNumber === order.orderNumber)) {
        setOrder((prev: any) => ({
          ...prev,
          cancellationStatus: 'REQUESTED',
          cancellationReason: data.reason,
        }));
        setMessage({ type: 'error', text: `⚠️ Customer submitted a cancellation request: "${data.reason}"` });
      }
    };

    socket.on('order_updated', handleOrderUpdated);
    socket.on('cancellation_requested', handleCancelRequest);

    return () => {
      socket.emit('leave_order_room', order.id);
      socket.off('order_updated', handleOrderUpdated);
      socket.off('cancellation_requested', handleCancelRequest);
    };
  }, [socket, order?.id, order?.orderNumber]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || newStatus === order.status) return;

    setUpdatingStatus(true);
    setMessage(null);

    const res = await api.adminUpdateOrderStatus(order.id, newStatus, statusNote);
    setUpdatingStatus(false);

    if (res.success && res.data) {
      setOrder(res.data);
      setMessage({ type: 'success', text: `Status successfully updated to ${newStatus}. Customer tracking updated in real-time!` });
      setStatusNote('');
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to update status.' });
    }
  };

  const handleUpdateDeliveryDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingDelivery(true);
    setMessage(null);

    const res = await api.adminUpdateDelivery(order.id, {
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate).toISOString() : undefined,
      carrier,
      trackingNumber,
      trackingNotes,
      note: `Delivery schedule/carrier updated: ${carrier} (${trackingNumber})`,
    });
    setUpdatingDelivery(false);

    if (res.success && res.data) {
      setOrder(res.data);
      setMessage({ type: 'success', text: 'Delivery tracking information updated & synchronized with customer in real-time.' });
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to update delivery info.' });
    }
  };

  const handleAssignDeliveryPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliveryPersonId || !order?.id) return;

    setAssigningDelivery(true);
    setMessage(null);

    const res = await api.adminAssignOrderDelivery(order.id, selectedDeliveryPersonId);
    setAssigningDelivery(false);

    if (res.success && res.order) {
      setOrder(res.order);
      setMessage({
        type: 'success',
        text: res.message || `Order successfully assigned to ${res.order.deliveryPersonName}! Real-time alert dispatched.`,
      });
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to assign delivery partner.' });
    }
  };

  const handleAutoAssignPartner = async () => {
    if (!order?.id) return;
    setAssigningDelivery(true);
    setMessage(null);

    const res = await api.adminAutoAssignOrderDelivery(order.id);
    setAssigningDelivery(false);

    if (res.success && res.order) {
      setOrder(res.order);
      setSelectedDeliveryPersonId(res.order.deliveryPersonId || '');
      setMessage({
        type: 'success',
        text: res.message || `Order successfully auto-assigned to ${res.order.deliveryPersonName}! Real-time alert dispatched.`,
      });
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to auto-assign delivery partner.' });
    }
  };

  const handleReviewCancellation = async (action: 'APPROVE' | 'REJECT') => {
    setReviewingCancel(true);
    setMessage(null);

    const res = await api.adminReviewCancellation(order.id, action, reviewNote);
    setReviewingCancel(false);

    if (res.success && res.data) {
      setOrder(res.data);
      setMessage({
        type: 'success',
        text: action === 'APPROVE'
          ? 'Cancellation request approved. Stock has been restored to store inventory.'
          : 'Cancellation request rejected. Customer notified in real-time.',
      });
      setReviewNote('');
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to review cancellation.' });
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;

    setCancelling(true);
    const res = await api.adminCancelOrder(order.id, cancelReason);
    setCancelling(false);

    if (res.success && res.data) {
      setOrder(res.data);
      setShowCancelModal(false);
      setMessage({ type: 'success', text: 'Order cancelled and stock restored to inventory.' });
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to cancel order.' });
    }
  };

  const handleMarkCodCollected = async () => {
    const res = await api.adminMarkCodCollected(order.id);
    if (res.success && res.data) {
      setOrder(res.data);
      setMessage({ type: 'success', text: 'COD marked as collected.' });
    }
  };

  const handleSubstituteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!substituteItem || !replacementProductId) return;

    setSubstituting(true);
    const res = await api.adminSubstituteItem(order.id, substituteItem.id, {
      substituteProductId: replacementProductId,
      substituteQuantity: Number(replacementQty),
      note: substitutionNote,
    });
    setSubstituting(false);

    if (res.success) {
      setSubstituteItem(null);
      setMessage({ type: 'success', text: 'Item substituted and customer notified in real-time.' });
      loadData();
    } else {
      setMessage({ type: 'error', text: res.message || 'Substitution failed.' });
    }
  };

  if (isLoading && !order) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return <div className="py-20 text-center text-sm text-slate-400">Order not found.</div>;
  }

  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
  const isDelivered = order.status === 'DELIVERED';
  const isCancelRequested = order.cancellationStatus === 'REQUESTED';

  return (
    <div className="space-y-6">
      {/* Back button & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Order #{order.orderNumber}
              </h1>
              <span
                className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full ${
                  isDelivered
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : isCancelled
                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                    : order.status === 'OUT_FOR_DELIVERY'
                    ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                }`}
              >
                {order.status.replace(/_/g, ' ')}
              </span>

              {/* Real-time sync indicator */}
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {isConnected ? 'Real-Time Sync' : 'Connecting'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Invoice: <strong className="text-slate-700 dark:text-slate-200 font-mono">{order.invoiceNumber}</strong> • Placed on{' '}
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Print Slips Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={api.getInvoiceUrl(order.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 text-xs font-bold transition shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Tax Invoice (PDF)</span>
          </a>

          <a
            href={api.adminGetInvoicePrintUrl(order.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 text-xs font-bold transition shadow-sm"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Print Invoice</span>
          </a>

          {order.status === 'CANCELLED' && (
            <a
              href={api.adminGetCreditNotePdfUrl(order.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-bold transition shadow-sm"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Credit Note (PDF)</span>
            </a>
          )}

          <a
            href={api.adminGetPackingSlipUrl(order.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 text-xs font-bold transition shadow-sm"
          >
            <Package className="w-4 h-4 text-blue-600" />
            <span>Packing Slip</span>
          </a>

          <a
            href={api.adminGetDeliverySlipUrl(order.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-amber-600 text-xs font-bold transition shadow-sm"
          >
            <Truck className="w-4 h-4 text-amber-600" />
            <span>Delivery Slip</span>
          </a>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold ${
            message.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Customer Cancellation Request Review Alert Box */}
      {isCancelRequested && !isCancelled && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 animate-bounce" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">
                Action Required: Customer Requested Order Cancellation
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                Reason given by customer: <strong className="font-bold">&quot;{order.cancellationReason || 'Change of mind'}&quot;</strong>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <input
                  type="text"
                  placeholder="Optional note for customer (e.g. Approved / Package already dispatched)"
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl px-3 py-2 flex-1 min-w-[200px] text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => handleReviewCancellation('APPROVE')}
                  disabled={reviewingCancel}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  Approve (Cancel & Restore Stock)
                </button>
                <button
                  onClick={() => handleReviewCancellation('REJECT')}
                  disabled={reviewingCancel}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left (Items & Audit History) and Right (Fulfillment Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Substitution (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Order Items & Price Snapshots</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Fixed price snapshots at time of checkout
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {order.items?.length || 0} Products
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-4">Item Name / SKU</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Rate (₹)</th>
                    <th className="py-3 px-4">Tax %</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Line Total</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white block">{item.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.productSku}</span>
                        {item.isSubstituted && (
                          <span className="mt-1 inline-block bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {item.substitutionNote}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.unit}</td>
                      <td className="py-3 px-4 font-mono">₹{Number(item.unitPrice).toFixed(2)}</td>
                      <td className="py-3 px-4">{Number(item.taxPercent)}%</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{item.quantity}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                        ₹{Number(item.lineTotal).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isCancelled && !isDelivered && (
                          <button
                            onClick={() => {
                              setSubstituteItem(item);
                              setReplacementQty(item.quantity);
                            }}
                            className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition"
                            title="Substitute item"
                          >
                            <Repeat className="w-3.5 h-3.5" />
                            <span>Substitute</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discountTotal) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Coupon Discount ({order.couponCodeSnapshot || 'PROMO'})</span>
                  <span>- ₹{Number(order.discountTotal).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Delivery Charge</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {Number(order.deliveryCharge) === 0 ? 'FREE' : `₹${Number(order.deliveryCharge).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Total GST Included</span>
                <span>₹{Number(order.taxTotal).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline font-bold">
                <span className="text-slate-900 dark:text-white text-sm">Grand Total (COD)</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{Number(order.grandTotal).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Complete Status Audit History */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Complete Tracking & Status History</h3>
            <div className="space-y-3">
              {order.statusHistory?.map((hist: any) => (
                <div key={hist.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{hist.toStatus}</span>
                    <span className="text-slate-400 text-[11px] ml-2 font-mono">
                      {new Date(hist.createdAt).toLocaleString()}
                    </span>
                    {hist.note && <p className="text-slate-600 dark:text-slate-300 mt-0.5">{hist.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Tracking Management */}
        <div className="space-y-6">
          {/* Status Progression Controls */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Fulfillment Stage Progression</h3>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Change Order Stage
                </label>
                <select
                  disabled={isCancelled || isDelivered}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  {SIX_STAGES_LIST.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Stage Update Note
                </label>
                <input
                  type="text"
                  disabled={isCancelled || isDelivered}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Handed to delivery partner Ramesh"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={updatingStatus || isCancelled || isDelivered || newStatus === order.status}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
              >
                {updatingStatus ? 'Broadcasting...' : 'Update Stage (Live Broadcast)'}
              </button>
            </form>

            {/* Mark COD Collected Button */}
            {order.paymentStatus !== 'COLLECTED' && !isCancelled && (
              <button
                onClick={handleMarkCodCollected}
                className="w-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold py-2.5 px-4 rounded-xl text-xs border border-emerald-200 dark:border-emerald-800 transition flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Mark COD Payment as Collected</span>
              </button>
            )}

            {/* Cancel Button */}
            {!isCancelled && !isDelivered && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold py-2.5 px-4 rounded-xl text-xs border border-rose-200 dark:border-rose-900 transition flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Cancel Order (Restores Stock)</span>
              </button>
            )}
          </div>

          {/* Delivery Partner Assignment & Self-Confirmation Status */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-500/40 dark:border-amber-500/30 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delivery Partner (No OTP)</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Self-confirmation fulfillment</p>
                </div>
              </div>

              {order.deliveryStatus && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  order.deliveryStatus === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                    : order.deliveryStatus === 'OUT_FOR_DELIVERY'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                }`}>
                  {order.deliveryStatus}
                </span>
              )}
            </div>

            {/* Current Assignment Info */}
            {order.deliveryPersonName ? (
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Assigned Agent:</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{order.deliveryPersonName}</strong>
                </div>
                {order.assignedAt && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Assigned At:</span>
                    <span>{new Date(order.assignedAt).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {order.outForDeliveryAt && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Out For Delivery At:</span>
                    <span>{new Date(order.outForDeliveryAt).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="pt-1.5 border-t border-amber-200 dark:border-amber-800/60 text-emerald-700 dark:text-emerald-400 font-semibold space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Delivered at {new Date(order.deliveredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Confirmed independently via Delivery Dashboard (No OTP)
                    </div>
                    {order.deliveryLocation && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        GPS: {order.deliveryLocation.latitude?.toFixed(4)}, {order.deliveryLocation.longitude?.toFixed(4)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 text-center">
                No delivery agent assigned yet. Select one below to dispatch.
              </div>
            )}

            {/* Assignment / Reassignment Form */}
            {!isCancelled && order.status !== 'DELIVERED' && (
              <form onSubmit={handleAssignDeliveryPartner} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {order.deliveryPersonId ? 'Reassign Delivery Partner' : 'Assign Delivery Partner'}
                  </label>
                  <select
                    value={selectedDeliveryPersonId}
                    onChange={(e) => setSelectedDeliveryPersonId(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose active delivery agent --</option>
                    {deliveryPersonnel.filter((p) => p.isActive).map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name} ({person.vehicleNumber || 'Bike'}) • {person.activeOrders || 0} active
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    disabled={assigningDelivery || !selectedDeliveryPersonId}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>{assigningDelivery ? 'Assigning...' : order.deliveryPersonId ? 'Reassign Partner' : 'Assign Selected'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={assigningDelivery}
                    onClick={handleAutoAssignPartner}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-40 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ Auto-Assign Best</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Delivery Schedule & Tracking Details Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delivery & Tracking Settings</h3>

            <form onSubmit={handleUpdateDeliveryDetails} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Delivery Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Carrier / Delivery Service
                </label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. FreshCart Express Gujarat"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  AWB / Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TRK-GJ-884920"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Tracking Note
                </label>
                <textarea
                  rows={2}
                  value={trackingNotes}
                  onChange={(e) => setTrackingNotes(e.target.value)}
                  placeholder="Note visible to customer (e.g. Out for delivery with delivery partner Ramesh - Phone: 9876543210)"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={updatingDelivery}
                className="w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
              >
                {updatingDelivery ? 'Saving...' : 'Save & Sync Delivery Info'}
              </button>
            </form>
          </div>

          {/* Customer & Address Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Customer Details & Address</h3>

            <div>
              <span className="text-slate-400 text-[11px] block">Customer Name</span>
              <span className="font-bold text-slate-900 dark:text-white block">{order.customerName}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Contact Phone</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono block">{order.customerPhone}</span>
            </div>

            {order.customerEmail && (
              <div>
                <span className="text-slate-400 text-[11px] block">Email</span>
                <span className="text-slate-700 dark:text-slate-300 block">{order.customerEmail}</span>
              </div>
            )}

            <div>
              <span className="text-slate-400 text-[11px] block">Shipping Address (Snapshot)</span>
              <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                {order.shippingAddressSnapshot?.street}
                {order.shippingAddressSnapshot?.landmark ? `, Near ${order.shippingAddressSnapshot?.landmark}` : ''}
                <br />
                {order.shippingAddressSnapshot?.city}, {order.shippingAddressSnapshot?.state} -{' '}
                <strong>{order.shippingAddressSnapshot?.pincode}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Item Substitution Modal */}
      {substituteItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Substitute Item: {substituteItem.productName}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Replace this item with another product. Original stock will be automatically restored, replacement stock deducted, and invoice recalculated.
            </p>

            <form onSubmit={handleSubstituteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Choose Replacement Product *
                </label>
                <select
                  required
                  value={replacementProductId}
                  onChange={(e) => setReplacementProductId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="">Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit}) - ₹{Number(p.price)} [Stock: {p.stockQty}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Replacement Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={replacementQty}
                  onChange={(e) => setReplacementQty(parseInt(e.target.value, 10))}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Substitution Note for Customer *
                </label>
                <input
                  type="text"
                  required
                  value={substitutionNote}
                  onChange={(e) => setSubstitutionNote(e.target.value)}
                  placeholder="e.g. Brand substituted as requested item out of stock"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubstituteItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={substituting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {substituting ? 'Saving...' : 'Confirm Substitution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cancel Order #{order.orderNumber}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure? This will mark the order as CANCELLED and restore all reserved stock items to the inventory ledger.
            </p>

            <form onSubmit={handleCancelOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer requested, address unreachable, fraud check..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

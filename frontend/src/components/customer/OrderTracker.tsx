'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Check,
  XCircle,
  FileText,
  AlertCircle,
  Download,
  Calendar,
  MapPin,
  RefreshCw,
  Radio,
  ExternalLink,
  ShieldCheck,
  Copy,
  Info,
  Bike,
  Printer,
  RotateCcw,
  Eye,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

interface OrderTrackerProps {
  order: any;
  onOrderUpdated?: (order: any) => void;
  canCancel?: boolean;
}

// Exactly the 6 standard stages requested by user
const SIX_STAGES = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received & verified by FreshCart', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Accepted & queued for fulfillment', icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Processing', desc: 'Hand-picked & packed fresh', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', desc: 'Dispatched from SG Highway Hub', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Partner on the way to your door', icon: Radio },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Delivered & payment settled', icon: Check },
];

const STATUS_TO_STAGE_INDEX: Record<string, number> = {
  PLACED: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  PACKED: 2, // PACKED maps cleanly to Processing stage
  SHIPPED: 3,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
};

export default function OrderTracker({ order: initialOrder, onOrderUpdated, canCancel = true }: OrderTrackerProps) {
  const { socket, isConnected, joinOrderRoom, leaveOrderRoom } = useSocket();
  const [order, setOrder] = useState<any>(initialOrder);
  const [isLiveUpdated, setIsLiveUpdated] = useState(false);
  const [liveToast, setLiveToast] = useState<string | null>(null);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of delivery address');
  const [cancelComments, setCancelComments] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Invoice Preview Modal State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const handleOpenInvoice = async () => {
    setShowInvoiceModal(true);
    if (!invoiceData && order?.id) {
      setLoadingInvoice(true);
      try {
        const res = await api.getInvoiceData(order.id);
        if (res.success && res.data) {
          setInvoiceData(res.data);
        }
      } catch (e) {
        console.error('Failed to load invoice preview:', e);
      } finally {
        setLoadingInvoice(false);
      }
    }
  };

  // Sync prop updates
  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!order?.id) return;

    // Join order room
    joinOrderRoom(order.id);
    if (order.orderNumber) {
      joinOrderRoom(order.orderNumber);
    }

    if (!socket) return;

    const handleOrderUpdated = (data: any) => {
      if (data && (data.orderId === order.id || data.orderNumber === order.orderNumber)) {
        setOrder((prev: any) => ({
          ...prev,
          ...(data.order || data),
          status: data.status || data.order?.status || prev.status,
          paymentStatus: data.paymentStatus || data.order?.paymentStatus || prev.paymentStatus,
          estimatedDeliveryDate: data.estimatedDeliveryDate || data.order?.estimatedDeliveryDate || prev.estimatedDeliveryDate,
          trackingNumber: data.trackingNumber || data.order?.trackingNumber || prev.trackingNumber,
          carrier: data.carrier || data.order?.carrier || prev.carrier,
          trackingNotes: data.trackingNotes || data.order?.trackingNotes || prev.trackingNotes,
          cancellationStatus: data.cancellationStatus || data.order?.cancellationStatus || prev.cancellationStatus,
          statusHistory: data.statusHistory || data.order?.statusHistory || prev.statusHistory,
        }));

        setIsLiveUpdated(true);
        setLiveToast(`Order status updated to: ${data.status || 'Updated'}`);
        setTimeout(() => setIsLiveUpdated(false), 3000);
        setTimeout(() => setLiveToast(null), 5000);

        if (onOrderUpdated) {
          onOrderUpdated(data.order || data);
        }
      }
    };

    socket.on('order_updated', handleOrderUpdated);

    return () => {
      leaveOrderRoom(order.id);
      if (order.orderNumber) {
        leaveOrderRoom(order.orderNumber);
      }
      socket.off('order_updated', handleOrderUpdated);
    };
  }, [socket, order?.id, order?.orderNumber, joinOrderRoom, leaveOrderRoom, onOrderUpdated]);

  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
  const isCancelRequested = order.cancellationStatus === 'REQUESTED';
  const currentStageIndex = isCancelled ? -1 : (STATUS_TO_STAGE_INDEX[order.status] ?? 0);

  // Eligible to cancel if status is PLACED or CONFIRMED and not already requested
  const isEligibleForCancel =
    canCancel &&
    !isCancelled &&
    !isCancelRequested &&
    (order.status === 'PLACED' || order.status === 'CONFIRMED');

  // Find stage timestamp from statusHistory
  const getStageTimestamp = (stageKey: string, stageIndex: number) => {
    if (!order.statusHistory || order.statusHistory.length === 0) {
      if (stageIndex === 0) return order.createdAt;
      return null;
    }

    const match = order.statusHistory.find((h: any) => {
      if (stageKey === 'PROCESSING') {
        return h.toStatus === 'PROCESSING' || h.toStatus === 'PACKED';
      }
      return h.toStatus === stageKey;
    });

    if (match) return match.createdAt;
    if (stageIndex === 0) return order.createdAt;
    return null;
  };

  const getStageNote = (stageKey: string) => {
    if (!order.statusHistory) return null;
    const match = order.statusHistory.find((h: any) => {
      if (stageKey === 'PROCESSING') {
        return h.toStatus === 'PROCESSING' || h.toStatus === 'PACKED';
      }
      return h.toStatus === stageKey;
    });
    return match?.note || null;
  };

  const formatTimestamp = (dateStr?: string | Date | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCancel(true);
    setErrorMessage('');

    const fullReason = cancelComments.trim() ? `${cancelReason} - ${cancelComments.trim()}` : cancelReason;

    const res = await api.requestOrderCancellation(order.id, fullReason);
    setIsSubmittingCancel(false);

    if (res.success && res.data) {
      setShowCancelModal(false);
      setOrder(res.data);
      if (onOrderUpdated) onOrderUpdated(res.data);
    } else {
      setErrorMessage(res.message || 'Failed to submit cancellation request.');
    }
  };

  const copyTracking = () => {
    if (order.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border ${
      isLiveUpdated ? 'border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500' : 'border-gray-200 dark:border-slate-800'
    } shadow-sm p-6 sm:p-8 space-y-7 transition-all duration-300`}>

      {/* Real-Time Live Sync Toast Notification */}
      {liveToast && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Real-Time Update: {liveToast}</span>
          </div>
          <button onClick={() => setLiveToast(null)} className="text-white hover:text-emerald-200">✕</button>
        </div>
      )}

      {/* Order Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Order #{order.orderNumber}
            </h2>
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                order.status === 'DELIVERED'
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                  : isCancelled
                  ? 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-800'
                  : order.status === 'OUT_FOR_DELIVERY'
                  ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-400 border border-blue-300 dark:border-blue-800'
                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
              }`}
            >
              {order.status.replace(/_/g, ' ')}
            </span>

            {/* Live Socket Connection Badge */}
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-500'
              }`}
              title="Real-time two-way synchronization active"
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              {isConnected ? 'Real-Time Sync Active' : 'Connecting Sync...'}
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Invoice: <strong className="text-gray-800 dark:text-slate-200">{order.invoiceNumber}</strong> • Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenInvoice}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold transition shadow-sm"
          >
            <Eye className="w-4 h-4" />
            <span>View Invoice</span>
          </button>

          <a
            href={api.getInvoiceUrl(order.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold transition border border-emerald-200 dark:border-emerald-800 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Invoice (PDF)</span>
          </a>

          <a
            href={api.getInvoicePrintUrl(order.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold transition border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </a>

          {isCancelled && (
            <a
              href={api.getCreditNoteUrl(order.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-bold transition border border-red-200 dark:border-red-800 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Download Credit Note (PDF)</span>
            </a>
          )}

          {isEligibleForCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-bold transition border border-red-200 dark:border-red-800 shadow-sm"
            >
              <XCircle className="w-4 h-4" />
              <span>Request Cancellation</span>
            </button>
          )}
        </div>
      </div>

      {/* Cancellation Requested Banner */}
      {isCancelRequested && !isCancelled && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-2xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-900 dark:text-amber-200">Cancellation Request Under Review</h4>
            <p className="text-amber-700 dark:text-amber-300 mt-0.5">
              Reason: &quot;{order.cancellationReason || 'Customer requested'}&quot;. Our operations team is reviewing your request. You will be updated in real time.
            </p>
          </div>
        </div>
      )}

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/60 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-red-900 dark:text-red-200">Order #{order.orderNumber} is Cancelled</h4>
            <p className="text-red-700 dark:text-red-300 mt-0.5">
              Reason: {order.cancellationReason || 'Cancelled upon customer request'}. All reserved grocery items have been safely returned to store inventory.
            </p>
          </div>
        </div>
      )}

      {/* Estimated Delivery & Tracking Header Card */}
      {!isCancelled && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/30 dark:border-slate-800 border border-emerald-200 p-5 rounded-2xl">
          {/* Estimated Delivery */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Estimated Delivery</span>
            </span>
            <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
              {order.estimatedDeliveryDate
                ? formatTimestamp(order.estimatedDeliveryDate)
                : 'Within 2 Hours (Express Gujarat)'}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Slot: {order.deliverySlot || 'Standard Express'}
            </p>
          </div>

          {/* Courier & Tracking Number */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Carrier & Dispatch</span>
            </span>
            <div className="text-xs font-bold text-gray-900 dark:text-white">
              {order.carrier || 'FreshCart Express Gujarat'}
            </div>
            {order.deliveryPersonName && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-bold">
                <Bike className="w-3.5 h-3.5" />
                <span>Delivery Partner: {order.deliveryPersonName}</span>
              </div>
            )}
            {order.deliveredAt && (
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                ✓ Delivered at {formatTimestamp(order.deliveredAt)}
              </div>
            )}
            {order.trackingNumber && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
                  {order.trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={copyTracking}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition text-gray-500"
                  title="Copy Tracking ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copiedTracking && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
              </div>
            )}
          </div>

          {/* Payment Status */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payment Details</span>
            </span>
            <div className="text-xs font-bold text-gray-900 dark:text-white">
              {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : order.paymentMethod}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
              {order.paymentStatus === 'COLLECTED' ? (
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">✓ Payment Completed</span>
              ) : (
                <span>Payable on Arrival: ₹{Number(order.grandTotal).toFixed(0)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Tracking Notes Banner (if any) */}
      {order.trackingNotes && !isCancelled && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Live Tracking Note:</span> {order.trackingNotes}
          </div>
        </div>
      )}

      {/* The 6-Stage Real-Time Tracking Timeline */}
      {!isCancelled && (
        <div className="py-4">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
              Order Fulfillment Timeline (6 Stages)
            </h3>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Stage: {order.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Desktop/Tablet Horizontal Stepper */}
          <div className="hidden lg:block relative py-6">
            {/* Progress background bar */}
            <div className="absolute top-1/2 left-8 right-8 h-1.5 bg-gray-200 dark:bg-slate-800 -translate-y-1/2 z-0 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(0, (currentStageIndex / (SIX_STAGES.length - 1)) * 100)}%`,
                }}
              />
            </div>

            {/* Stepper Nodes */}
            <div className="grid grid-cols-6 gap-2 relative z-10">
              {SIX_STAGES.map((stage, idx) => {
                const Icon = stage.icon;
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;
                const timestamp = getStageTimestamp(stage.key, idx);

                return (
                  <div key={stage.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs transition-all duration-300 flex-shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30 scale-110 shadow-lg shadow-emerald-600/30'
                          : isPassed
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="mt-3 space-y-0.5">
                      <h4
                        className={`text-xs font-bold leading-tight ${
                          isCurrent
                            ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                            : isPassed
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400 dark:text-slate-500'
                        }`}
                      >
                        {stage.label}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight">
                        {stage.desc}
                      </p>
                      {timestamp && (
                        <span className="block text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 pt-0.5">
                          {formatTimestamp(timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Vertical Stepper (Clear & Beautiful on all phone screens) */}
          <div className="lg:hidden space-y-4 pt-2">
            {SIX_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isPassed = currentStageIndex >= idx;
              const isCurrent = currentStageIndex === idx;
              const timestamp = getStageTimestamp(stage.key, idx);
              const stageNote = getStageNote(stage.key);

              return (
                <div key={stage.key} className="flex items-start gap-3.5 relative">
                  {/* Connecting Line between steps */}
                  {idx < SIX_STAGES.length - 1 && (
                    <div
                      className={`absolute left-5 top-10 bottom-0 w-0.5 -ml-px ${
                        currentStageIndex > idx ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-800'
                      }`}
                    />
                  )}

                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-colors flex-shrink-0 z-10 ${
                      isCurrent
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30 shadow-md'
                        : isPassed
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                            : isPassed
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400 dark:text-slate-500'
                        }`}
                      >
                        {stage.label}
                      </h4>
                      {timestamp && (
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {formatTimestamp(timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                      {stage.desc}
                    </p>
                    {stageNote && (
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl mt-1.5 border border-slate-200 dark:border-slate-700">
                        {stageNote}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-gray-100 dark:border-slate-800 text-xs">
        {/* Shipping address & slot */}
        <div className="space-y-2">
          <h4 className="font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
            Delivery Address & Destination
          </h4>
          <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-1">
            <p className="font-bold text-gray-900 dark:text-white text-sm">{order.customerName}</p>
            <p className="text-gray-600 dark:text-slate-300">Contact: {order.customerPhone}</p>
            <p className="text-gray-600 dark:text-slate-300">
              {order.shippingAddressSnapshot?.street}
              {order.shippingAddressSnapshot?.landmark ? `, Near ${order.shippingAddressSnapshot?.landmark}` : ''}
            </p>
            <p className="text-gray-600 dark:text-slate-300">
              {order.shippingAddressSnapshot?.city}, {order.shippingAddressSnapshot?.state} -{' '}
              <strong className="text-gray-900 dark:text-white">{order.shippingAddressSnapshot?.pincode}</strong>
            </p>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Gujarat Delivery Region</span>
            </div>
          </div>
        </div>

        {/* Bill calculation breakdown */}
        <div className="space-y-2">
          <h4 className="font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
            Payment & Total Breakdown
          </h4>
          <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-gray-600 dark:text-slate-400">
              <span>Items Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-white">₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Coupon ({order.couponCodeSnapshot || 'DISCOUNT'})</span>
                <span>- ₹{Number(order.discountTotal).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 dark:text-slate-400">
              <span>Delivery Charge</span>
              <span>
                {Number(order.deliveryCharge) === 0 ? (
                  <strong className="text-emerald-600 dark:text-emerald-400">FREE</strong>
                ) : (
                  `₹${Number(order.deliveryCharge).toFixed(2)}`
                )}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-between items-baseline font-black">
              <span className="text-gray-900 dark:text-white">Amount Payable on Delivery (COD)</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-base">₹{Number(order.grandTotal).toFixed(2)}</span>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-slate-400 text-right">
              Payment Status: <strong className="text-gray-700 dark:text-slate-300">{order.paymentStatus}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Items Table */}
      <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
        <h4 className="font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3">
          Ordered Items ({order.items?.length || 0})
        </h4>
        <div className="divide-y divide-gray-100 dark:divide-slate-800">
          {order.items?.map((item: any) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-gray-900 dark:text-white">{item.productName}</span>
                {item.isSubstituted && (
                  <span className="ml-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Substituted
                  </span>
                )}
                <div className="text-[11px] text-gray-500 dark:text-slate-400">
                  {item.unit} • ₹{Number(item.unitPrice).toFixed(0)} × {item.quantity}
                </div>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">₹{Number(item.lineTotal).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cancellation Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Request Cancellation for #{order.orderNumber}
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to request cancellation for this order? If eligible, reserved grocery items will be returned to store inventory immediately.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Reason for Cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl p-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="Change of delivery address">Change of delivery address</option>
                  <option value="Ordered incorrect grocery items">Ordered incorrect grocery items</option>
                  <option value="Delivery timing not suitable">Delivery timing not suitable</option>
                  <option value="Found better price / No longer needed">Found better price / No longer needed</option>
                  <option value="Placed by mistake">Placed by mistake</option>
                  <option value="Other reason">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
                  Additional Details / Note
                </label>
                <textarea
                  rows={3}
                  value={cancelComments}
                  onChange={(e) => setCancelComments(e.target.value)}
                  placeholder="Tell our store team more details..."
                  className="w-full text-xs bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl p-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/50 p-2.5 rounded-xl border border-red-200 dark:border-red-800">
                  {errorMessage}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  Keep My Order
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancel}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition shadow-sm"
                >
                  {isSubmittingCancel ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GST Tax Invoice Preview Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                  FC
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <span>Tax Invoice #{order.invoiceNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      ORIGINAL FOR RECIPIENT
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Compliant with Section 31 of CGST Act, 2017 & Rule 46 of CGST Rules
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={api.getInvoiceUrl(order.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download PDF</span>
                </a>
                <a
                  href={api.getInvoicePrintUrl(order.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-bold transition border border-slate-200 dark:border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </a>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-gray-700 dark:text-slate-300">
              {loadingInvoice && !invoiceData ? (
                <div className="py-16 text-center text-gray-400 space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                  <p>Loading verified GST invoice particulars...</p>
                </div>
              ) : invoiceData ? (
                <>
                  {/* Store & Metadata Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
                    <div>
                      <div className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {invoiceData.supplier?.legalName}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                        {invoiceData.supplier?.address}, {invoiceData.supplier?.city}, {invoiceData.supplier?.state} – {invoiceData.supplier?.pincode}
                      </div>
                      <div className="mt-2 text-[11px] space-y-0.5">
                        <div><strong>GSTIN:</strong> {invoiceData.supplier?.gstin} &bull; <strong>PAN:</strong> {invoiceData.supplier?.pan}</div>
                        <div><strong>State:</strong> {invoiceData.supplier?.state} (Code: {invoiceData.supplier?.stateCode})</div>
                        <div><strong>FSSAI:</strong> {invoiceData.supplier?.fssai} &bull; <strong>CIN:</strong> {invoiceData.supplier?.cin}</div>
                      </div>
                    </div>

                    <div className="md:text-right space-y-1 text-[11px]">
                      <div><span className="text-gray-500">Invoice No:</span> <strong className="text-gray-900 dark:text-white">{invoiceData.invoiceNumber}</strong></div>
                      <div><span className="text-gray-500">Invoice Date:</span> <strong className="text-gray-900 dark:text-white">{invoiceData.invoiceDate} {invoiceData.invoiceTime}</strong></div>
                      <div><span className="text-gray-500">Order Ref:</span> <strong className="text-gray-900 dark:text-white">#{invoiceData.orderNumber}</strong></div>
                      <div><span className="text-gray-500">Place of Supply:</span> <strong className="text-gray-900 dark:text-white">{invoiceData.placeOfSupply}</strong></div>
                      <div><span className="text-gray-500">Payment:</span> <strong className="text-gray-900 dark:text-white">{invoiceData.paymentMethod} ({invoiceData.paymentStatus})</strong></div>
                    </div>
                  </div>

                  {/* Dual Cards: Billed To & Shipped To */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                      <div className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400">
                        Billed To (Customer Details)
                      </div>
                      <div className="font-bold text-gray-900 dark:text-white">{invoiceData.customer?.name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400">
                        {invoiceData.customer?.street}, {invoiceData.customer?.city}, {invoiceData.customer?.state} - {invoiceData.customer?.pincode}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400">
                        Mobile: {invoiceData.customer?.phone}
                      </div>
                      <div className="text-[10px] text-gray-400 pt-1">
                        GSTIN: {invoiceData.customer?.gstin}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                      <div className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400">
                        Shipped To / Dispatch Address
                      </div>
                      <div className="font-bold text-gray-900 dark:text-white">{invoiceData.shippingAddress?.name || invoiceData.customer?.name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400">
                        {invoiceData.shippingAddress?.street}, {invoiceData.shippingAddress?.city} - {invoiceData.shippingAddress?.pincode}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-slate-400">
                        Slot: {invoiceData.deliverySlot} &bull; Mode: Express Delivery
                      </div>
                      <div className="text-[10px] text-gray-400 pt-1">
                        Carrier: {invoiceData.carrier} &bull; AWB: {invoiceData.trackingNumber}
                      </div>
                    </div>
                  </div>

                  {/* Product Line Items (13 Fields) */}
                  <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-100/80 dark:bg-slate-800/80 text-[10px] font-black uppercase text-gray-700 dark:text-slate-300">
                            <th className="p-2.5 text-center">#</th>
                            <th className="p-2.5">Product & Brand</th>
                            <th className="p-2.5 text-center">HSN</th>
                            <th className="p-2.5 text-right">Qty</th>
                            <th className="p-2.5 text-center">Unit</th>
                            <th className="p-2.5 text-right">Price (₹)</th>
                            <th className="p-2.5 text-right">Discount</th>
                            <th className="p-2.5 text-right">Taxable (₹)</th>
                            <th className="p-2.5 text-center">GST %</th>
                            <th className="p-2.5 text-right">Tax (₹)</th>
                            <th className="p-2.5 text-right">Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-[11px]">
                          {invoiceData.items?.map((it: any) => (
                            <tr key={it.index} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 text-center text-gray-400 font-medium">{it.index}</td>
                              <td className="p-2.5">
                                <div className="font-bold text-gray-900 dark:text-white">{it.productName}</div>
                                <div className="text-[10px] text-gray-500 dark:text-slate-400">
                                  Brand: {it.brand || 'FreshCart'} &bull; Pack: {it.packSize || it.unit}
                                </div>
                              </td>
                              <td className="p-2.5 text-center font-mono text-[10px] text-gray-600 dark:text-slate-300">{it.hsnCode}</td>
                              <td className="p-2.5 text-right font-bold text-gray-900 dark:text-white">{it.quantity}</td>
                              <td className="p-2.5 text-center text-gray-500">{it.unitType || 'pcs'}</td>
                              <td className="p-2.5 text-right font-mono text-gray-600 dark:text-slate-300">{Number(it.unitMrp).toFixed(2)}</td>
                              <td className="p-2.5 text-right font-mono text-emerald-600 font-semibold">
                                {it.discount > 0 ? `-${Number(it.discount).toFixed(2)}` : '0.00'}
                              </td>
                              <td className="p-2.5 text-right font-mono font-medium">{Number(it.taxableAmount).toFixed(2)}</td>
                              <td className="p-2.5 text-center font-semibold text-gray-700 dark:text-slate-300">{it.taxPercent}%</td>
                              <td className="p-2.5 text-right font-mono text-gray-600 dark:text-slate-300">{Number(it.totalTax).toFixed(2)}</td>
                              <td className="p-2.5 text-right font-mono font-black text-gray-900 dark:text-white">{Number(it.lineTotal).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* HSN Summary & Totals */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                    {/* HSN Summary */}
                    <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-3.5 bg-gray-50/50 dark:bg-slate-800/30 space-y-2">
                      <div className="font-extrabold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider">
                        HSN / SAC Tax Summary
                      </div>
                      <table className="w-full text-left text-[10px]">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-slate-700 text-gray-500">
                            <th className="pb-1 text-center">HSN</th>
                            <th className="pb-1 text-right">Taxable</th>
                            <th className="pb-1 text-center">CGST</th>
                            <th className="pb-1 text-center">SGST</th>
                            <th className="pb-1 text-right">Tax (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-mono">
                          {invoiceData.hsnSummary?.map((h: any) => (
                            <tr key={h.hsnCode}>
                              <td className="py-1 text-center font-bold text-gray-700 dark:text-slate-300">{h.hsnCode}</td>
                              <td className="py-1 text-right">{Number(h.taxableAmount).toFixed(2)}</td>
                              <td className="py-1 text-center">{h.cgstRate}%</td>
                              <td className="py-1 text-center">{h.sgstRate}%</td>
                              <td className="py-1 text-right font-bold text-gray-900 dark:text-white">{Number(h.totalTax).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Words Box */}
                      <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <div className="text-[9px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase">
                          Amount in Words:
                        </div>
                        <div className="text-[11px] font-bold text-gray-900 dark:text-slate-100 italic">
                          {invoiceData.amountInWords}
                        </div>
                      </div>
                    </div>

                    {/* Financial Totals */}
                    <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 space-y-2">
                      <div className="flex justify-between text-gray-500">
                        <span>Items Subtotal:</span>
                        <span className="font-mono text-gray-800 dark:text-slate-200">₹{Number(invoiceData.totals?.subtotal || invoiceData.totals?.itemsGrossTotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discounts:</span>
                        <span className="font-mono">-₹{Number(invoiceData.totals?.discountTotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700 dark:text-slate-300 font-semibold">
                        <span>Taxable Turnover:</span>
                        <span className="font-mono">₹{Number(invoiceData.totals?.taxableTotal).toFixed(2)}</span>
                      </div>
                      {invoiceData.isIntraState ? (
                        <>
                          <div className="flex justify-between text-gray-500">
                            <span>Central GST (CGST):</span>
                            <span className="font-mono">₹{Number(invoiceData.totals?.cgstTotal).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>State GST (SGST):</span>
                            <span className="font-mono">₹{Number(invoiceData.totals?.sgstTotal).toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-gray-500">
                          <span>Integrated GST (IGST):</span>
                          <span className="font-mono">₹{Number(invoiceData.totals?.igstTotal).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-500">
                        <span>Express Delivery (SAC 996812):</span>
                        <span className="font-mono">{invoiceData.totals?.deliveryCharge > 0 ? `₹${Number(invoiceData.totals?.deliveryCharge).toFixed(2)}` : 'FREE'}</span>
                      </div>

                      <div className="border-t border-b border-emerald-500/30 py-2.5 my-2 flex justify-between items-center text-sm font-black text-gray-900 dark:text-white bg-emerald-50/50 dark:bg-emerald-950/30 px-3 rounded-xl">
                        <span>Grand Total:</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-mono text-base">₹{Number(invoiceData.totals?.grandTotal).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-gray-500 text-[11px]">
                        <span>Amount Paid:</span>
                        <span className="font-mono">₹{Number(invoiceData.totals?.amountPaid).toFixed(2)}</span>
                      </div>
                      <div className={`flex justify-between font-bold text-xs ${invoiceData.totals?.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        <span>Balance Due:</span>
                        <span className="font-mono">₹{Number(invoiceData.totals?.balanceDue).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-gray-400">
                  <p>Unable to retrieve invoice particulars for this order.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-gray-500 dark:text-slate-400">
                FreshCart Supermarket Pvt Ltd &bull; Gujarat (24)
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={api.getInvoiceUrl(order.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official PDF</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

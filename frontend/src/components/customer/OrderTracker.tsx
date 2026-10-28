'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { api } from '@/lib/api';

interface OrderTrackerProps {
  order: any;
  onOrderUpdated?: (order: any) => void;
  canCancel?: boolean;
}

const STEPS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received & Queued', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Store accepted', icon: CheckCircle2 },
  { key: 'PACKED', label: 'Packed', desc: 'Freshly packed', icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'On its way to you', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Completed & Paid', icon: Check },
];

export default function OrderTracker({ order, onOrderUpdated, canCancel = true }: OrderTrackerProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
  const currentIndex = STEPS.findIndex((s) => s.key === order.status);

  const isEligibleForCancel = canCancel && (order.status === 'PLACED' || order.status === 'CONFIRMED');

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setErrorMessage('Please provide a reason for cancellation.');
      return;
    }

    setIsCancelling(true);
    setErrorMessage('');

    const res = await api.cancelOrder(order.id, cancelReason);
    setIsCancelling(false);

    if (res.success && res.data) {
      setShowCancelModal(false);
      if (onOrderUpdated) onOrderUpdated(res.data);
    } else {
      setErrorMessage(res.message || 'Failed to cancel order.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h2>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                order.status === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : isCancelled
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Invoice: <strong className="text-gray-700">{order.invoiceNumber}</strong> • Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Actions: Download Invoice & Cancel */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={api.getInvoiceUrl(order.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition border border-emerald-200"
          >
            <Download className="w-4 h-4" />
            <span>Download Tax Bill (PDF)</span>
          </a>

          {isEligibleForCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition border border-red-200"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Timeline */}
      {isCancelled ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-900 text-sm">This order was {order.status}</h4>
            <p className="text-xs text-red-700 mt-0.5">
              Reason: {order.cancellationReason || 'Cancelled upon customer request'}. All inventory stock has been automatically returned to store.
            </p>
          </div>
        </div>
      ) : (
        <div className="py-4">
          <div className="relative">
            {/* Connecting Track */}
            <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0">
              <div
                className="h-full bg-emerald-600 transition-all duration-500"
                style={{
                  width: `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%`,
                }}
              />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentIndex >= idx;
                const isCurrent = currentIndex === idx;

                return (
                  <div key={step.key} className="flex sm:flex-col items-center gap-3 sm:gap-2 sm:text-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-colors flex-shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          isCurrent ? 'text-emerald-700' : isPassed ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-gray-500 sm:block">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Order Details & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 text-xs">
        {/* Shipping address & slot */}
        <div className="space-y-2">
          <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
            Delivery Address & Slot
          </h4>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <p className="font-bold text-gray-900">{order.customerName}</p>
            <p className="text-gray-600 mt-0.5">Phone: {order.customerPhone}</p>
            <p className="text-gray-600 mt-1">
              {order.shippingAddressSnapshot?.street}, {order.shippingAddressSnapshot?.city} -{' '}
              {order.shippingAddressSnapshot?.pincode}
            </p>
            <div className="mt-2 pt-2 border-t border-gray-200 text-emerald-800 font-semibold">
              Slot: {order.deliverySlot || 'Standard Delivery'} ({order.deliveryType})
            </div>
          </div>
        </div>

        {/* Bill calculation snapshot */}
        <div className="space-y-2">
          <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
            Payment & Total Breakdown
          </h4>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Items Subtotal</span>
              <span className="font-medium text-gray-900">₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon ({order.couponCodeSnapshot || 'DISCOUNT'})</span>
                <span>- ₹{Number(order.discountTotal).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charge</span>
              <span>{Number(order.deliveryCharge) === 0 ? 'FREE' : `₹${Number(order.deliveryCharge).toFixed(2)}`}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline font-bold">
              <span className="text-gray-900">Total Payable on Delivery (COD)</span>
              <span className="text-emerald-700 text-sm">₹{Number(order.grandTotal).toFixed(2)}</span>
            </div>
            <div className="text-[10px] text-gray-500 text-right">
              Payment Status: <strong className="text-gray-700">{order.paymentStatus}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Items Table */}
      <div className="pt-4 border-t border-gray-100">
        <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-3">
          Ordered Items ({order.items?.length || 0})
        </h4>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item: any) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-gray-900">{item.productName}</span>
                {item.isSubstituted && (
                  <span className="ml-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Substituted
                  </span>
                )}
                <div className="text-[11px] text-gray-500">
                  {item.unit} • ₹{Number(item.unitPrice).toFixed(0)} × {item.quantity}
                </div>
              </div>
              <span className="font-bold text-gray-900">₹{Number(item.lineTotal).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-gray-900">Cancel Order #{order.orderNumber}</h3>
            <p className="text-xs text-gray-600">
              Are you sure you want to cancel this order? Once cancelled, items are automatically returned to store inventory.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Cancellation *
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Ordered by mistake, found alternative, delivery timing not suitable..."
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{errorMessage}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

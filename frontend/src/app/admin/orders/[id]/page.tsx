'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { api } from '@/lib/api';

const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REJECTED',
];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status update
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Item substitution modal
  const [substituteItem, setSubstituteItem] = useState<any>(null);
  const [replacementProductId, setReplacementProductId] = useState('');
  const [replacementQty, setReplacementQty] = useState(1);
  const [substitutionNote, setSubstitutionNote] = useState('');
  const [substituting, setSubstituting] = useState(false);

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const loadData = () => {
    if (!id) return;
    setIsLoading(true);
    api.trackOrder(String(id)).then((res) => {
      if (res.success && res.data) {
        setOrder(res.data);
        setNewStatus(res.data.status);
      }
      setIsLoading(false);
    });

    // Also load product catalogue for substitutions
    api.getProducts('limit=100').then((res) => {
      if (res.success && res.data) setProducts(res.data);
    });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus || newStatus === order.status) return;

    setUpdatingStatus(true);
    setMessage(null);

    const res = await api.adminUpdateOrderStatus(order.id, newStatus, statusNote);
    setUpdatingStatus(false);

    if (res.success && res.data) {
      setOrder(res.data);
      setMessage({ type: 'success', text: `Status successfully updated to ${newStatus}.` });
      setStatusNote('');
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to update status.' });
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
      setMessage({ type: 'success', text: 'Item substituted and customer notified.' });
      loadData();
    } else {
      setMessage({ type: 'error', text: res.message || 'Substitution failed.' });
    }
  };

  if (isLoading && !order) {
    return (
      <div className="py-20 text-center text-xs text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return <div className="py-20 text-center text-sm">Order not found.</div>;
  }

  const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';
  const isDelivered = order.status === 'DELIVERED';

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-emerald-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                Order #{order.orderNumber}
              </h1>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  isDelivered
                    ? 'bg-emerald-100 text-emerald-800'
                    : isCancelled
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Invoice: <strong className="text-gray-700 font-mono">{order.invoiceNumber}</strong> • Placed on{' '}
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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 text-xs font-bold transition shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Tax Bill (PDF)</span>
          </a>

          <a
            href={api.adminGetPackingSlipUrl(order.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-blue-700 text-xs font-bold transition shadow-sm"
          >
            <Package className="w-4 h-4 text-blue-600" />
            <span>Packing Slip</span>
          </a>

          <a
            href={api.adminGetDeliverySlipUrl(order.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-amber-700 text-xs font-bold transition shadow-sm"
          >
            <Truck className="w-4 h-4 text-amber-600" />
            <span>Delivery Slip</span>
          </a>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs font-medium ${
            message.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Substitution (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Order Items & Snapshots</h3>
                <p className="text-[11px] text-gray-500">
                  Fixed price snapshots at time of order creation
                </p>
              </div>
              <span className="text-xs font-bold text-gray-700">
                {order.items?.length || 0} Products
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold">
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
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50/60">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900 block">{item.productName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{item.productSku}</span>
                        {item.isSubstituted && (
                          <span className="mt-1 inline-block bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {item.substitutionNote}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.unit}</td>
                      <td className="py-3 px-4 font-mono">₹{Number(item.unitPrice).toFixed(2)}</td>
                      <td className="py-3 px-4">{Number(item.taxPercent)}%</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{item.quantity}</td>
                      <td className="py-3 px-4 font-extrabold text-gray-900">
                        ₹{Number(item.lineTotal).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isCancelled && !isDelivered && (
                          <button
                            onClick={() => {
                              setSubstituteItem(item);
                              setReplacementQty(item.quantity);
                            }}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
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
            <div className="p-5 bg-gray-50/70 border-t border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900">₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discountTotal) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({order.couponCodeSnapshot || 'PROMO'})</span>
                  <span>- ₹{Number(order.discountTotal).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-gray-900">
                  {Number(order.deliveryCharge) === 0 ? 'FREE' : `₹${Number(order.deliveryCharge).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 text-[11px]">
                <span>Total GST Included</span>
                <span>₹{Number(order.taxTotal).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline font-bold">
                <span className="text-gray-900 text-sm">Grand Total (COD)</span>
                <span className="text-xl font-black text-emerald-700">
                  ₹{Number(order.grandTotal).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Timeline History */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">Status Audit History</h3>
            <div className="space-y-3">
              {order.statusHistory?.map((hist: any) => (
                <div key={hist.id} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-gray-900">{hist.toStatus}</span>
                    <span className="text-gray-400 text-[11px] ml-2">
                      {new Date(hist.createdAt).toLocaleString()}
                    </span>
                    {hist.note && <p className="text-gray-600 mt-0.5">{hist.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Customer (1 col) */}
        <div className="space-y-6">
          {/* Status Controls */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Manage Fulfillment</h3>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Change Status
                </label>
                <select
                  disabled={isCancelled || isDelivered}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
                >
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Status Note / Comment (Optional)
                </label>
                <input
                  type="text"
                  disabled={isCancelled || isDelivered}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched with executive Amit"
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={updatingStatus || isCancelled || isDelivered || newStatus === order.status}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
              >
                {updatingStatus ? 'Updating...' : 'Save Status Update'}
              </button>
            </form>

            {/* Mark COD Collected Button */}
            {order.paymentStatus !== 'COLLECTED' && !isCancelled && (
              <button
                onClick={handleMarkCodCollected}
                className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-2.5 px-4 rounded-xl text-xs border border-emerald-200 transition flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Mark COD Payment as Collected</span>
              </button>
            )}

            {/* Cancel Button */}
            {!isCancelled && !isDelivered && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-4 rounded-xl text-xs border border-rose-200 transition flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Cancel Order (Restores Stock)</span>
              </button>
            )}
          </div>

          {/* Customer & Address Details */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-gray-900 text-sm">Customer & Delivery Snapshot</h3>

            <div>
              <span className="text-gray-400 text-[11px] block">Customer Name</span>
              <span className="font-bold text-gray-900 block">{order.customerName}</span>
            </div>

            <div>
              <span className="text-gray-400 text-[11px] block">Contact Phone</span>
              <span className="font-bold text-gray-900 font-mono block">{order.customerPhone}</span>
            </div>

            {order.customerEmail && (
              <div>
                <span className="text-gray-400 text-[11px] block">Email</span>
                <span className="text-gray-700 block">{order.customerEmail}</span>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <span className="text-gray-400 text-[11px] block">Shipping Address</span>
              <p className="text-gray-800 font-medium leading-relaxed mt-0.5">
                {order.shippingAddressSnapshot?.street}, {order.shippingAddressSnapshot?.city} -{' '}
                {order.shippingAddressSnapshot?.pincode}
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <span className="text-gray-400 text-[11px] block">Delivery Slot</span>
              <span className="font-bold text-emerald-800 block">
                {order.deliverySlot || order.deliveryType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Item Substitution Modal */}
      {substituteItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Substitute Item</h3>
              <button
                onClick={() => setSubstituteItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Replacing: <strong className="text-gray-900">{substituteItem.productName}</strong> ({substituteItem.quantity} {substituteItem.unit}). Old stock will be returned to inventory.
            </p>

            <form onSubmit={handleSubstituteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Replacement Product *
                </label>
                <select
                  required
                  value={replacementProductId}
                  onChange={(e) => setReplacementProductId(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Choose replacement item --</option>
                  {products
                    .filter((p) => p.stockQty > 0)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.unit}) - ₹{Number(p.price)} [Stock: {p.stockQty}]
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Replacement Quantity *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={replacementQty}
                  onChange={(e) => setReplacementQty(parseInt(e.target.value, 10))}
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Substitution *
                </label>
                <input
                  type="text"
                  required
                  value={substitutionNote}
                  onChange={(e) => setSubstitutionNote(e.target.value)}
                  placeholder="e.g. Hybrid tomatoes out of stock, replaced with fresh local tomatoes"
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubstituteItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={substituting || !replacementProductId}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {substituting ? 'Substituting...' : 'Confirm Substitution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Cancel Order #{order.orderNumber}</h3>
            <p className="text-xs text-gray-600">
              Rule 2 Enforcement: Cancelling this order will restore the quantities of all {order.items?.length} items back into product stock and record immutable audit ledger entries.
            </p>

            <form onSubmit={handleCancelOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Admin Cancellation Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer requested cancellation / Delivery address unreachable / Payment issue"
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {cancelling ? 'Restoring Stock...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


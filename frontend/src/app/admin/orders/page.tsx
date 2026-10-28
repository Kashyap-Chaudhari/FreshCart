'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { api } from '@/lib/api';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PLACED', label: 'Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const loadOrders = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    params.set('page', String(pagination.page));
    params.set('limit', '20');

    api.adminGetOrders(params.toString()).then((res) => {
      if (res.success && res.data) {
        setOrders(res.data);
        if (res.pagination) setPagination(res.pagination);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadOrders();
  }, [selectedStatus, pagination.page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadOrders();
  };

  const handleQuickStatusChange = async (orderId: string, nextStatus: string) => {
    const res = await api.adminUpdateOrderStatus(orderId, nextStatus);
    if (res.success) {
      loadOrders();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Orders & Dispatch</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Process orders, manage fulfillment stages, print slips, and handle substitutions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-64">
            <input
              type="text"
              placeholder="Search Order #, Phone, Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-white border border-gray-300 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          <button
            onClick={loadOrders}
            className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-emerald-700 rounded-xl"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm text-xs font-semibold">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setSelectedStatus(tab.key);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition ${
              selectedStatus === tab.key
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold">
              <tr>
                <th className="py-3 px-4">Order # / Invoice</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Items / Slot</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No orders found matching the filter.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-bold text-gray-900 hover:text-emerald-700 block"
                        >
                          #{order.orderNumber}
                        </Link>
                        <span className="text-[10px] text-gray-400 font-mono block">
                          {order.invoiceNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-900 block">{order.customerName}</span>
                        <span className="text-[11px] text-gray-500 font-mono block">
                          {order.customerPhone}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-800 block">
                          {order.items?.length || 0} grocery items
                        </span>
                        <span className="text-[10px] text-emerald-800 font-medium block truncate max-w-[150px]">
                          {order.deliverySlot || order.deliveryType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-gray-900 block text-sm">
                          ₹{Number(order.grandTotal).toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.paymentStatus === 'COLLECTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.paymentStatus} ({order.paymentMethod})
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'CANCELLED' || order.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Status advancement buttons */}
                          {order.status === 'PLACED' && (
                            <button
                              onClick={() => handleQuickStatusChange(order.id, 'CONFIRMED')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[11px] font-bold border border-emerald-200"
                            >
                              Accept
                            </button>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleQuickStatusChange(order.id, 'PACKED')}
                              className="px-2.5 py-1 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg text-[11px] font-bold border border-blue-200"
                            >
                              Pack
                            </button>
                          )}
                          {order.status === 'PACKED' && (
                            <button
                              onClick={() => handleQuickStatusChange(order.id, 'OUT_FOR_DELIVERY')}
                              className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-[11px] font-bold border border-amber-200"
                            >
                              Dispatch
                            </button>
                          )}
                          {order.status === 'OUT_FOR_DELIVERY' && (
                            <button
                              onClick={() => handleQuickStatusChange(order.id, 'DELIVERED')}
                              className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[11px] font-bold shadow-sm"
                            >
                              Deliver & Collect
                            </button>
                          )}

                          {/* Print Tax Bill */}
                          <a
                            href={api.getInvoiceUrl(order.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-gray-500 hover:text-emerald-700 rounded-lg hover:bg-gray-100"
                            title="Print Tax Bill PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          {/* View details */}
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                            title="Inspect Order"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
            </span>
            <div className="flex gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                  className={`w-7 h-7 rounded-lg font-bold ${
                    pagination.page === p
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, Clock, Search, Download } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function OrdersHistoryPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchOrderNumber, setSearchOrderNumber] = useState('');

  useEffect(() => {
    if (user) {
      api.getMyOrders().then((res) => {
        if (res.success && res.data) {
          setOrders(res.data);
        }
        setIsLoading(false);
      });
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const handleGuestLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderNumber.trim()) {
      router.push(`/orders/${encodeURIComponent(searchOrderNumber.trim())}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Order History & Tracking
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            View status, download official tax invoices, and track live grocery dispatches
          </p>
        </div>

        {/* Quick order tracking lookup for guests */}
        <form onSubmit={handleGuestLookup} className="flex gap-2">
          <input
            type="text"
            placeholder="Track by Order # (e.g. ORD-...)"
            value={searchOrderNumber}
            onChange={(e) => setSearchOrderNumber(e.target.value)}
            className="text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition"
          >
            Track
          </button>
        </form>
      </div>

      {!user ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">Sign in to view your complete order history</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Placed an order as a guest? You can track it directly using the search box above with your Order Number.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm transition"
            >
              Sign In with OTP / Email
            </Link>
          </div>
        </div>
      ) : isLoading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-3 shadow-sm">
          <h3 className="font-bold text-base text-gray-900">No orders placed yet</h3>
          <p className="text-xs text-gray-500">You haven&apos;t placed any grocery orders yet.</p>
          <Link
            href="/products"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm"
          >
            Start Shopping Fresh
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED' || order.status === 'REJECTED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900 text-sm">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCancelled
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">
                    Invoice: <strong className="text-gray-700">{order.invoiceNumber}</strong> •{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>

                  <p className="text-xs text-gray-600 line-clamp-1">
                    {order.items?.map((it: any) => `${it.productName} (${it.quantity})`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <div className="text-left md:text-right">
                    <span className="text-base font-extrabold text-emerald-700 block">
                      ₹{Number(order.grandTotal).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-gray-400">Cash on Delivery</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={api.getInvoiceUrl(order.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="Download PDF Bill"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                    >
                      <span>Track</span>
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

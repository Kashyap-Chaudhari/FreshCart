'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, RefreshCw, ShoppingBag, Home, History } from 'lucide-react';
import { api } from '@/lib/api';
import OrderTracker from '@/components/customer/OrderTracker';

export default function OrderDetailsPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const justConfirmed = searchParams.get('confirmed') === 'true';

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = () => {
    if (!id) return;
    setIsLoading(true);
    api
      .trackOrder(String(id))
      .then((res) => {
        if (res.success && res.data) {
          setOrder(res.data);
        } else {
          setError(res.message || 'Order not found');
        }
      })
      .catch(() => setError('Failed to retrieve order tracking info.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  if (isLoading && !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-xs text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Not Found</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400">{error || 'Please check your order number or link.'}</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition shadow-sm"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Home</span>
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <History className="w-3.5 h-3.5" />
            <span>Order History</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 pb-24 lg:pb-8 w-full min-w-0">
      {/* Just placed alert */}
      {justConfirmed && (
        <div className="bg-emerald-500 text-white rounded-3xl p-6 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg">Thank you! Your order is placed.</h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Order #{order.orderNumber} has been received. Our team is preparing your fresh items now.
            </p>
          </div>
        </div>
      )}

      {/* Nav back & Home & refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-bold text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition"
          >
            <Home className="w-4 h-4 text-emerald-600" />
            <span>Home</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link
            href="/orders"
            className="text-xs font-bold text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Order History</span>
          </Link>
        </div>

        <button
          onClick={fetchOrder}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Main Order Tracker & Bill Component */}
      <OrderTracker
        order={order}
        onOrderUpdated={(updated) => setOrder(updated)}
        canCancel={true}
      />
    </div>
  );
}


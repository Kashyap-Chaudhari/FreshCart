'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Boxes,
  ArrowRight,
  RefreshCw,
  Plus,
  Eye,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = () => {
    setIsLoading(true);
    api.adminGetDashboard().then((res) => {
      if (res.success && res.data) {
        setData(res.data);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
        Loading real-time store dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Operations Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time overview of today&apos;s orders, sales revenue, and inventory alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Manage Orders</span>
          </Link>
          <button
            onClick={loadDashboard}
            className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-emerald-700 rounded-xl transition"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Revenue */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today&apos;s Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-gray-900 block">
              ₹{Number(data?.todayRevenue || 0).toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              Delivered & Confirmed Sales
            </span>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today&apos;s Orders</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-gray-900 block">
              {data?.todayOrdersCount || 0}
            </span>
            <span className="text-[11px] text-gray-500 mt-1 block">
              Orders placed today
            </span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Orders</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-gray-900 block">
              {data?.pendingOrdersCount || 0}
            </span>
            <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
              Requires Packing / Dispatch
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-rose-600 block">
              {data?.lowStockAlertsCount || 0}
            </span>
            <Link
              href="/admin/inventory"
              className="text-[11px] text-rose-700 font-semibold mt-1 block hover:underline"
            >
              Reorder stock immediately →
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Recent Orders & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Recent Incoming Orders</h3>
              <p className="text-[11px] text-gray-500">Live stream of customer checkouts</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {data?.recentOrders?.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">No orders placed today.</p>
            ) : (
              data?.recentOrders?.map((order: any) => (
                <div key={order.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      {order.customerName} ({order.customerPhone}) • {order.items?.length || 0} items
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-gray-900 text-sm">
                      ₹{Number(order.grandTotal).toFixed(0)}
                    </span>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products (1 col) */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Top Selling Groceries</h3>
            <p className="text-[11px] text-gray-500">Highest volume items sold (Last 30 days)</p>
          </div>

          <div className="space-y-3">
            {data?.topProducts?.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">No sales history yet.</p>
            ) : (
              data?.topProducts?.map((p: any, idx: number) => (
                <div key={p.productId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-gray-900 truncate max-w-[150px]">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 block">{p.unitsSold} units</span>
                    <span className="text-[10px] text-emerald-700 font-medium">₹{p.revenue.toFixed(0)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

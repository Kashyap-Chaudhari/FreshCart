'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  CheckCircle2,
  Truck,
  BarChart3,
  PieChart,
  DollarSign,
  Calendar,
  Layers,
  CreditCard,
  Banknote,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';

export default function AdminDashboardPage() {
  const { socket, isConnected } = useSocket();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trendMetric, setTrendMetric] = useState<'revenue' | 'orders'>('revenue');
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);

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

  // Real-time synchronization: refresh dashboard KPIs and charts whenever order events occur
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      loadDashboard();
    };

    socket.on('new_order', handleUpdate);
    socket.on('order_status_updated', handleUpdate);
    socket.on('delivery_status_updated', handleUpdate);
    socket.on('order_assigned', handleUpdate);

    return () => {
      socket.off('new_order', handleUpdate);
      socket.off('order_status_updated', handleUpdate);
      socket.off('delivery_status_updated', handleUpdate);
      socket.off('order_assigned', handleUpdate);
    };
  }, [socket]);

  // Derived Trend Chart Metrics
  const trendData = data?.revenueTrend || [];
  const maxTrendVal = useMemo(() => {
    if (!trendData.length) return 100;
    const vals = trendData.map((d: any) => (trendMetric === 'revenue' ? d.revenue : d.orders));
    const max = Math.max(...vals);
    return max > 0 ? max * 1.15 : 100;
  }, [trendData, trendMetric]);

  const totalPeriodRevenue = useMemo(() => {
    return trendData.reduce((sum: number, d: any) => sum + (d.revenue || 0), 0);
  }, [trendData]);

  const totalPeriodOrders = useMemo(() => {
    return trendData.reduce((sum: number, d: any) => sum + (d.orders || 0), 0);
  }, [trendData]);

  if (isLoading && !data) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
        Loading real-time store dashboard & analysis charts...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Live Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Operations Dashboard</h1>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {isConnected ? 'Real-Time Sync Active' : 'Offline'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time sales velocity, live revenue tracking, stock alerts, and financial analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Manage Orders</span>
          </Link>
          <button
            onClick={loadDashboard}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition shadow-sm"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (6 metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        {/* 1. Today's Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 shadow-sm space-y-1.5 sm:space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Today&apos;s Revenue
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white block truncate">
              ₹{Number(data?.todayRevenue || 0).toFixed(2)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block truncate">
              Active / Today&apos;s Sales
            </span>
          </div>
        </div>

        {/* 2. Total Cumulative Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 shadow-sm space-y-1.5 sm:space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Total Revenue
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white block truncate">
              ₹{Number(data?.totalRevenue || data?.todayRevenue || 0).toFixed(2)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-teal-600 dark:text-teal-400 font-semibold block truncate">
              Cumulative Store Sales
            </span>
          </div>
        </div>

        {/* 3. Today's Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 shadow-sm space-y-1.5 sm:space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Today&apos;s Orders
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white block">
              {data?.todayOrdersCount || 0}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">
              Total {data?.totalOrdersCount || data?.todayOrdersCount || 0} all-time
            </span>
          </div>
        </div>

        {/* 4. Average Order Value (AOV) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 shadow-sm space-y-1.5 sm:space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Avg Order Value
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white block truncate">
              ₹{Number(data?.averageOrderValue || 0).toFixed(0)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block truncate">
              Per Order Average
            </span>
          </div>
        </div>

        {/* 5. Pending Dispatch */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 shadow-sm space-y-1.5 sm:space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Pending Orders
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white block">
              {data?.pendingOrdersCount || 0}
            </span>
            <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-semibold block truncate">
              Requires Dispatch
            </span>
          </div>
        </div>

        {/* 6. Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 shadow-sm space-y-1.5 sm:space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              Low Stock Alerts
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 block">
              {data?.lowStockAlertsCount || 0}
            </span>
            <Link
              href="/inventory"
              className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 font-semibold block hover:underline truncate"
            >
              Reorder stock →
            </Link>
          </div>
        </div>
      </div>

      {/* ================= SECTION 1: PRIMARY ANALYSIS CHARTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Sales & Revenue Trend (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Revenue & Sales Trend Analysis
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                7-day rolling performance: Total ₹{totalPeriodRevenue.toFixed(2)} across {totalPeriodOrders} orders
              </p>
            </div>

            {/* Metric Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setTrendMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  trendMetric === 'revenue'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Revenue (₹)
              </button>
              <button
                type="button"
                onClick={() => setTrendMetric('orders')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  trendMetric === 'orders'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Orders
              </button>
            </div>
          </div>

          {/* SVG Trend Area / Bar Chart */}
          <div className="relative pt-4">
            <div className="h-56 w-full flex items-end gap-3 sm:gap-6 justify-between px-2">
              {trendData.map((item: any, idx: number) => {
                const val = trendMetric === 'revenue' ? item.revenue : item.orders;
                const heightPercent = Math.max(8, Math.min(100, (val / maxTrendVal) * 100));
                const isHovered = hoveredTrendIdx === idx;

                return (
                  <div
                    key={item.date}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    onMouseEnter={() => setHoveredTrendIdx(idx)}
                    onMouseLeave={() => setHoveredTrendIdx(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
                        <div className="text-emerald-400 font-extrabold">₹{item.revenue.toFixed(2)}</div>
                        <div className="text-slate-300 font-medium text-[10px]">{item.orders} orders placed</div>
                      </div>
                    )}

                    {/* Bar visualization with rounded gradient cap */}
                    <div className="w-full max-w-[42px] flex flex-col justify-end items-center h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-2xl transition-all duration-300 relative ${
                          trendMetric === 'revenue'
                            ? isHovered
                              ? 'bg-emerald-500 shadow-md shadow-emerald-500/30'
                              : 'bg-emerald-600/80 hover:bg-emerald-600'
                            : isHovered
                            ? 'bg-blue-500 shadow-md shadow-blue-500/30'
                            : 'bg-blue-600/80 hover:bg-blue-600'
                        }`}
                      >
                        {/* Top Indicator Dot */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-xs" />
                      </div>
                    </div>

                    {/* Date label */}
                    <div className="text-center mt-3">
                      <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        {item.dayName}
                      </span>
                      <span className="block text-[10px] font-medium text-slate-400">{item.date.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">7-Day Revenue</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                ₹{totalPeriodRevenue.toFixed(0)}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">7-Day Orders</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{totalPeriodOrders} orders</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Avg Daily Run-rate</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                ₹{(totalPeriodRevenue / (trendData.length || 7)).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Chart 2: Order Status Distribution (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Order Lifecycle Distribution
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live status across customer orders
            </p>
          </div>

          {/* Status Breakdown Items */}
          <div className="space-y-3.5">
            {(data?.orderStatusDistribution || []).map((status: any) => (
              <div key={status.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                    <span>{status.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{status.count}</span>
                    <span className="text-[10px] text-slate-400">({status.percent}%)</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(status.percent, status.count > 0 ? 5 : 0)}%`, backgroundColor: status.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Fulfillment Success</span>
            </div>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm">
              {data?.deliverySuccessRate || 100}%
            </span>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2: CATEGORY SALES, PAYMENT SPLIT & HOURLY VELOCITY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Revenue Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-primary" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Category Sales Share</h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Revenue generated by grocery department</p>
          </div>

          <div className="space-y-3">
            {(data?.categoryBreakdown || []).map((cat: any) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">₹{cat.revenue.toFixed(0)}</span>
                    <span className="text-[10px] text-slate-400">({cat.sharePercent}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(cat.sharePercent, cat.revenue > 0 ? 5 : 0)}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Split */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5 transition-colors">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Payment Methods Mix</h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Cash collection vs Online checkouts</p>
          </div>

          <div className="space-y-4">
            {(data?.paymentMethodSplit || []).map((pm: any) => (
              <div key={pm.method} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">{pm.method}</span>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    ₹{pm.revenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{pm.orders} orders processed</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{pm.percent}% of sales</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(pm.percent, 5)}%`, backgroundColor: pm.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Order Velocity */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Peak Shopping Hours</h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Order velocity from 06:00 to 23:00</p>
          </div>

          <div className="h-44 flex items-end gap-1.5 justify-between px-1">
            {(data?.hourlyVelocity || []).map((slot: any) => {
              const maxHour = Math.max(...(data?.hourlyVelocity || []).map((s: any) => s.orders), 1);
              const barH = Math.max(10, (slot.orders / maxHour) * 100);

              return (
                <div key={slot.hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Tooltip */}
                  <div className="hidden group-hover:block absolute -top-8 z-10 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                    {slot.hour}: {slot.orders} orders
                  </div>

                  <div
                    style={{ height: `${barH}%` }}
                    className={`w-full rounded-t transition-all ${
                      slot.orders > 0 ? 'bg-amber-500 hover:bg-amber-400' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  />
                  <span className="text-[8px] text-slate-400 mt-1 font-mono">{slot.hourNum}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Morning Rush: 7 - 10 AM</span>
            <span>Evening Rush: 6 - 9 PM</span>
          </div>
        </div>
      </div>

      {/* ================= SECTION 3: RECENT ORDERS STREAM & TOP PRODUCTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Stream (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Live Order Activity Stream</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Customer checkout & delivery confirmation log</p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data?.recentOrders?.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No orders placed today.</p>
            ) : (
              data?.recentOrders?.map((order: any) => (
                <div key={order.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">#{order.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
                            : order.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {order.customerName} ({order.customerPhone}) • {order.items?.length || 0} items • {order.paymentMethod}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      ₹{Number(order.grandTotal).toFixed(0)}
                    </span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      title="Inspect Order"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Selling Groceries (1 col) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-colors">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Top Selling Groceries</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Highest volume items sold (Last 30 days)</p>
          </div>

          <div className="space-y-3">
            {data?.topProducts?.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No sales history yet.</p>
            ) : (
              data?.topProducts?.map((p: any, idx: number) => (
                <div key={p.productId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white block">{p.unitsSold} units</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ₹{p.revenue.toFixed(0)}
                    </span>
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

'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  XCircle,
  Package,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<'SALES' | 'PRODUCTS' | 'COD' | 'CANCELLED' | 'VALUATION'>('SALES');
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

  const [salesData, setSalesData] = useState<any>(null);
  const [productData, setProductData] = useState<any>(null);
  const [codData, setCodData] = useState<any>(null);
  const [cancelledData, setCancelledData] = useState<any>(null);
  const [valuationData, setValuationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = () => {
    setIsLoading(true);

    if (reportType === 'SALES') {
      api.adminGetSalesReport(`period=${period}`).then((res) => {
        if (res.success) setSalesData(res);
        setIsLoading(false);
      });
    } else if (reportType === 'PRODUCTS') {
      api.adminGetSalesByProduct().then((res) => {
        if (res.success) setProductData(res);
        setIsLoading(false);
      });
    } else if (reportType === 'COD') {
      api.adminGetCodReport().then((res) => {
        if (res.success) setCodData(res);
        setIsLoading(false);
      });
    } else if (reportType === 'CANCELLED') {
      api.adminGetCancelledReport().then((res) => {
        if (res.success) setCancelledData(res);
        setIsLoading(false);
      });
    } else if (reportType === 'VALUATION') {
      api.adminGetStockValuation().then((res) => {
        if (res.success) setValuationData(res);
        setIsLoading(false);
      });
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Financial & Sales Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Aggregated revenue metrics, COD reconciliation, product margins, and stock valuation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reportType === 'SALES' && (
            <a
              href={api.adminGetSalesCsvUrl(`period=${period}`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Sales CSV</span>
            </a>
          )}

          {reportType === 'VALUATION' && (
            <a
              href={api.adminGetStockCsvUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Valuation CSV</span>
            </a>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <button
          onClick={() => setReportType('SALES')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            reportType === 'SALES' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Sales Over Time</span>
        </button>

        <button
          onClick={() => setReportType('PRODUCTS')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            reportType === 'PRODUCTS' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>By Product & Category</span>
        </button>

        <button
          onClick={() => setReportType('COD')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            reportType === 'COD' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>COD Collection Audit</span>
        </button>

        <button
          onClick={() => setReportType('CANCELLED')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            reportType === 'CANCELLED' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancelled Orders</span>
        </button>

        <button
          onClick={() => setReportType('VALUATION')}
          className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
            reportType === 'VALUATION' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Stock Valuation</span>
        </button>
      </div>

      {/* 1. SALES REPORT */}
      {reportType === 'SALES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200">
            <span className="text-xs font-bold text-gray-700">Aggregation Period:</span>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              {(['day', 'week', 'month'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 rounded-lg capitalize transition ${
                    period === p ? 'bg-white text-emerald-800 font-bold shadow-sm' : 'text-gray-600'
                  }`}
                >
                  {p}ly
                </button>
              ))}
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Total Orders</span>
              <span className="text-2xl font-black text-gray-900 block">{salesData?.summary?.totalOrders || 0}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Gross Sales</span>
              <span className="text-2xl font-black text-gray-900 block">₹{Number(salesData?.summary?.totalGrossSales || 0).toFixed(2)}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Discounts Given</span>
              <span className="text-2xl font-black text-rose-600 block">₹{Number(salesData?.summary?.totalDiscounts || 0).toFixed(2)}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Net Realized Revenue</span>
              <span className="text-2xl font-black text-emerald-700 block">₹{Number(salesData?.summary?.totalNetRevenue || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold">
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Gross Sales</th>
                  <th className="py-3 px-4">Discounts</th>
                  <th className="py-3 px-4">Taxes (GST)</th>
                  <th className="py-3 px-4">Delivery Fees</th>
                  <th className="py-3 px-4 text-right">Net Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {salesData?.data?.map((row: any) => (
                  <tr key={row.date} className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{row.date}</td>
                    <td className="py-3.5 px-4">{row.orderCount}</td>
                    <td className="py-3.5 px-4 font-mono">₹{row.grossSales.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono text-rose-600">- ₹{row.discounts.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono">₹{row.taxes.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono">₹{row.deliveryCharges.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700">
                      ₹{row.netRevenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. BY PRODUCT & CATEGORY */}
      {reportType === 'PRODUCTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products breakdown */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Product Sales Breakdown</h3>
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 text-xs">
              {productData?.products?.map((p: any) => (
                <div key={p.productId} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-gray-900 block">{p.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{p.sku} • {p.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 block">{p.unitsSold} units</span>
                    <span className="text-emerald-700 font-extrabold text-[11px]">₹{p.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Categories breakdown */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Category Performance</h3>
            <div className="space-y-3">
              {productData?.categories?.map((c: any) => (
                <div key={c.category} className="p-3 bg-gray-50 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-900 block">{c.category}</span>
                    <span className="text-[11px] text-gray-500">{c.unitsSold} total units</span>
                  </div>
                  <span className="text-sm font-black text-emerald-700">₹{c.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. COD COLLECTION */}
      {reportType === 'COD' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Total COD Orders</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{codData?.summary?.totalCodOrders || 0}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Cash Collected</span>
              <span className="text-2xl font-black text-emerald-700 block mt-1">₹{Number(codData?.summary?.collectedAmount || 0).toFixed(2)}</span>
              <span className="text-[10px] text-gray-400">({codData?.summary?.collectedCount || 0} orders)</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-amber-700 uppercase">Pending Collection</span>
              <span className="text-2xl font-black text-amber-700 block mt-1">₹{Number(codData?.summary?.pendingAmount || 0).toFixed(2)}</span>
              <span className="text-[10px] text-gray-400">({codData?.summary?.pendingCount || 0} orders in transit)</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer Name & Phone</th>
                  <th className="py-3 px-4">Amount to Collect</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {codData?.orders?.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4 font-bold text-gray-900">#{o.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold block">{o.customerName}</span>
                      <span className="text-[10px] text-gray-400">{o.customerPhone}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-gray-900">₹{Number(o.grandTotal).toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        o.paymentStatus === 'COLLECTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{o.status}</td>
                    <td className="py-3.5 px-4 text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CANCELLED ORDERS */}
      {reportType === 'CANCELLED' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Total Cancelled Orders</span>
              <span className="text-2xl font-black text-rose-600 block mt-1">{cancelledData?.totalCancelled || 0}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Lost Revenue Opportunity</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">₹{Number(cancelledData?.lostRevenue || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">Cancellation Breakdown & Reasons</h3>
            <div className="space-y-3">
              {cancelledData?.orders?.map((o: any) => (
                <div key={o.id} className="p-3.5 bg-gray-50 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-900">#{o.orderNumber} - {o.customerName}</span>
                    <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                      Reason: {o.cancellationReason || 'Unspecified'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-gray-900 block">₹{Number(o.grandTotal).toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400">Stock restored to inventory</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. STOCK VALUATION */}
      {reportType === 'VALUATION' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Total SKUs</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{valuationData?.summary?.totalProducts || 0}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Total Inventory Units</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">{valuationData?.summary?.totalQuantity || 0}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-gray-400 uppercase">Cost Valuation</span>
              <span className="text-2xl font-black text-blue-700 block mt-1">₹{Number(valuationData?.summary?.totalCostValue || 0).toFixed(2)}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Retail Selling Valuation</span>
              <span className="text-2xl font-black text-emerald-700 block mt-1">₹{Number(valuationData?.summary?.totalRetailValue || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold">
                <tr>
                  <th className="py-3 px-4">SKU / Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stock Units</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4">Est. Cost</th>
                  <th className="py-3 px-4">Cost Value</th>
                  <th className="py-3 px-4 text-right">Retail Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {valuationData?.items?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/60">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{item.name}</td>
                    <td className="py-3.5 px-4 text-gray-500">{item.category}</td>
                    <td className="py-3.5 px-4 font-bold">{item.stockQty}</td>
                    <td className="py-3.5 px-4 font-mono">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-500">₹{item.costPrice.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-mono">₹{item.costValue.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                      ₹{item.retailValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


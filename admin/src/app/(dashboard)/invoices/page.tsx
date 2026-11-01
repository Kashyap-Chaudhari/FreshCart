'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Download,
  Printer,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Eye,
  RefreshCw,
  Building2,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  X,
  FileCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminInvoicesPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'creditNotes'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [viewInvoiceData, setViewInvoiceData] = useState<any>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [issueCreditNoteTarget, setIssueCreditNoteTarget] = useState<any>(null);
  const [cnReason, setCnReason] = useState('');
  const [cnSubmitting, setCnSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParts = [];
      if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
      if (statusFilter && statusFilter !== 'ALL') queryParts.push(`status=${encodeURIComponent(statusFilter)}`);
      if (fromDate) queryParts.push(`fromDate=${encodeURIComponent(fromDate)}`);
      if (toDate) queryParts.push(`toDate=${encodeURIComponent(toDate)}`);
      const queryStr = queryParts.join('&');

      const [invRes, statsRes, cnRes] = await Promise.all([
        api.adminGetInvoices(queryStr),
        api.adminGetInvoiceStats(),
        api.adminGetCreditNotes(search ? `search=${encodeURIComponent(search)}` : ''),
      ]);

      if (invRes.success && invRes.data) {
        setInvoices(invRes.data.invoices || []);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (cnRes.success && cnRes.data) {
        setCreditNotes(cnRes.data.creditNotes || []);
      }
    } catch (err) {
      console.error('Error loading invoices data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, fromDate, toDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenBreakdown = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setViewLoading(true);
    try {
      const res = await api.adminGetInvoiceData(invoice.orderId || invoice.invoiceNumber);
      if (res.success && res.data) {
        setViewInvoiceData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setViewLoading(false);
    }
  };

  const handleIssueCreditNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueCreditNoteTarget) return;

    setCnSubmitting(true);
    try {
      const res = await api.adminIssueCreditNote(issueCreditNoteTarget.orderId || issueCreditNoteTarget.invoiceNumber, {
        reason: cnReason || 'Admin issued credit reversal and refund',
      });

      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Credit Note issued successfully under Section 34 of CGST Act.`,
        });
        setIssueCreditNoteTarget(null);
        setCnReason('');
        loadData();
      } else {
        setActionMessage({
          type: 'error',
          text: res.message || 'Failed to issue credit note.',
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'An error occurred while generating credit note.',
      });
    } finally {
      setCnSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                GST Tax Invoices & Compliance
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rule 46 & Section 31 / 34 CGST Act, 2017 • FreshCart Supermarket Pvt Ltd (Gujarat - 24)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-600 text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between ${
            actionMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoices</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {stats?.totalInvoices || 0}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            {stats?.activeInvoices || 0} Active Issued
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taxable Turnover</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            ₹{Number(stats?.totalTaxableTurnover || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Excluding GST</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            CGST Collected (9%)
          </span>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            ₹{Number(stats?.totalCgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Central Tax Share</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            SGST Collected (9%)
          </span>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            ₹{Number(stats?.totalSgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Gujarat State Share</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Total GST Invoiced
          </span>
          <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">
            ₹{Number(stats?.totalTaxCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">CGST + SGST + IGST</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Credit Notes</span>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {stats?.totalCreditNotes || 0}
          </div>
          <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">
            ₹{Number(stats?.totalRefundAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} Reversed
          </span>
        </div>
      </div>

      {/* Tabs navigation & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'invoices'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Tax Invoices ({invoices.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('creditNotes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'creditNotes'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Credit Notes (Section 34) ({creditNotes.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Supplier GSTIN: <strong>24AABCF1234F1Z8</strong></span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Invoice # (e.g. INV-2026-27), Order #, Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {activeTab === 'invoices' && (
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Invoice Statuses</option>
                <option value="ISSUED">Valid / Issued</option>
                <option value="CREDIT_NOTE_ISSUED">Adjusted via Credit Note</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
              title="From Date"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
              title="To Date"
            />
          </div>
        </div>
      </div>

      {/* Main Table view */}
      {activeTab === 'invoices' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Invoice No & Date</th>
                  <th className="py-3.5 px-4">Order Reference</th>
                  <th className="py-3.5 px-4">Billed Customer</th>
                  <th className="py-3.5 px-4 text-right">Taxable Turnover</th>
                  <th className="py-3.5 px-4 text-right">CGST + SGST</th>
                  <th className="py-3.5 px-4 text-right">Total Value</th>
                  <th className="py-3.5 px-4 text-center">GST Status</th>
                  <th className="py-3.5 px-4 text-center">Official Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No GST invoices matching your criteria.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                          {inv.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/orders/${inv.orderId}`}
                          className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <span>#{inv.orderNumber}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                        <div className="text-[10px] text-slate-400">Place: Gujarat (24)</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{inv.customerName}</div>
                        <div className="text-[11px] text-slate-400">{inv.customerPhone}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                        ₹{Number(inv.taxableAmount || 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          ₹{(Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0)).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ₹{Number(inv.cgstAmount || 0).toFixed(2)} + ₹{Number(inv.sgstAmount || 0).toFixed(2)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-slate-900 dark:text-white">
                          ₹{Number(inv.grandTotal || 0).toFixed(2)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {inv.status === 'CREDIT_NOTE_ISSUED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <RotateCcw className="w-3 h-3" />
                            <span>Credit Note {inv.creditNoteNumber ? `(${inv.creditNoteNumber})` : 'Issued'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Valid Tax Invoice</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Breakdown */}
                          <button
                            onClick={() => handleOpenBreakdown(inv)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                            title="View GST Breakdown"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print HTML */}
                          <a
                            href={api.adminGetInvoicePrintUrl(inv.orderId || inv.invoiceNumber)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                            title="1-Click Print Tax Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </a>

                          {/* Download PDF */}
                          <a
                            href={api.adminGetInvoicePdfUrl(inv.orderId || inv.invoiceNumber)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                            title="Download A4 PDF Tax Invoice"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* Issue Credit Note if not already issued */}
                          {inv.status !== 'CREDIT_NOTE_ISSUED' && (
                            <button
                              onClick={() => {
                                setIssueCreditNoteTarget(inv);
                                setCnReason(`Refund / Cancellation for Invoice ${inv.invoiceNumber}`);
                              }}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                              title="Issue Legal GST Credit Note (Sec 34)"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Credit Notes Tab */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40 text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Credit Note No</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Original Invoice Ref</th>
                  <th className="py-3.5 px-4">Order Reference</th>
                  <th className="py-3.5 px-4">Reason for Credit Adjustment</th>
                  <th className="py-3.5 px-4 text-right">Tax Reversal</th>
                  <th className="py-3.5 px-4 text-right">Refund Total</th>
                  <th className="py-3.5 px-4 text-center">Legal Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {creditNotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No GST Credit Notes issued yet.
                    </td>
                  </tr>
                ) : (
                  creditNotes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-rose-600 dark:text-rose-400">
                        {cn.creditNoteNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(cn.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {cn.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/orders/${cn.orderId}`}
                          className="font-bold text-emerald-600 hover:underline"
                        >
                          #{cn.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {cn.reason}
                      </td>
                      <td className="py-3.5 px-4 text-right text-rose-600 font-semibold">
                        -₹{Number(cn.taxReversed || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-rose-700 dark:text-rose-400">
                        ₹{Number(cn.refundAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <a
                          href={api.adminGetCreditNotePdfUrl(cn.orderId || cn.creditNoteNumber)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold text-[11px] border border-rose-200 dark:border-rose-800 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF Credit Note</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Breakdown Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">
                  Official GST Tax Invoice Record
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedInvoice(null);
                  setViewInvoiceData(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Computing real-time GST tax breakdown...</span>
              </div>
            ) : viewInvoiceData ? (
              <div className="space-y-5 text-xs">
                {/* Meta dual grid */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supplier Details</span>
                    <div className="font-extrabold text-slate-900 dark:text-white mt-1">
                      {viewInvoiceData.supplier.legalName}
                    </div>
                    <div className="text-[11px] text-slate-500">{viewInvoiceData.supplier.address}</div>
                    <div className="mt-2 text-[11px]">
                      <strong>GSTIN:</strong> {viewInvoiceData.supplier.gstin} | <strong>PAN:</strong> {viewInvoiceData.supplier.pan}
                    </div>
                    <div className="text-[11px]">
                      <strong>FSSAI:</strong> {viewInvoiceData.supplier.fssai} | <strong>State:</strong> {viewInvoiceData.supplier.state} (Code: 24)
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed & Shipped To</span>
                    <div className="font-extrabold text-slate-900 dark:text-white mt-1">
                      {viewInvoiceData.customer.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {viewInvoiceData.customer.street}, {viewInvoiceData.customer.city}, {viewInvoiceData.customer.state} - {viewInvoiceData.customer.pincode}
                    </div>
                    <div className="mt-2 text-[11px]">
                      <strong>Contact:</strong> {viewInvoiceData.customer.phone}
                    </div>
                    <div className="text-[11px]">
                      <strong>Place of Supply:</strong> {viewInvoiceData.placeOfSupply}
                    </div>
                  </div>
                </div>

                {/* Items breakdown */}
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white mb-2">Itemized HSN & Tax Breakdown</h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2 px-3">Item Description</th>
                          <th className="py-2 px-3 text-center">HSN/SAC</th>
                          <th className="py-2 px-3 text-right">Qty</th>
                          <th className="py-2 px-3 text-right">Rate</th>
                          <th className="py-2 px-3 text-right">Taxable</th>
                          <th className="py-2 px-3 text-right">CGST</th>
                          <th className="py-2 px-3 text-right">SGST</th>
                          <th className="py-2 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {viewInvoiceData.items.map((it: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-medium">{it.productName}</td>
                            <td className="py-2 px-3 text-center font-mono">{it.hsnCode}</td>
                            <td className="py-2 px-3 text-right">{it.quantity}</td>
                            <td className="py-2 px-3 text-right">₹{it.unitMrp.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right">₹{it.taxableAmount.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right">₹{it.cgstAmount.toFixed(2)} ({it.cgstRate}%)</td>
                            <td className="py-2 px-3 text-right">₹{it.sgstAmount.toFixed(2)} ({it.sgstRate}%)</td>
                            <td className="py-2 px-3 text-right font-bold">₹{it.lineTotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* HSN Summary Box */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <h4 className="font-extrabold text-slate-900 dark:text-white mb-2 text-[11px] uppercase tracking-wider">
                    HSN / SAC Tax Aggregation
                  </h4>
                  <div className="grid grid-cols-5 gap-2 text-[11px] font-semibold text-slate-500 border-b pb-1 mb-2">
                    <div>HSN/SAC Code</div>
                    <div className="text-right">Taxable Turnover</div>
                    <div className="text-right">CGST (₹)</div>
                    <div className="text-right">SGST (₹)</div>
                    <div className="text-right">Total Tax (₹)</div>
                  </div>
                  {viewInvoiceData.hsnSummary.map((h: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-5 gap-2 text-[11px] py-1">
                      <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{h.hsnCode}</div>
                      <div className="text-right">₹{h.taxableAmount.toFixed(2)}</div>
                      <div className="text-right text-emerald-600">₹{h.cgstAmount.toFixed(2)}</div>
                      <div className="text-right text-emerald-600">₹{h.sgstAmount.toFixed(2)}</div>
                      <div className="text-right font-bold text-slate-900 dark:text-white">₹{h.totalTax.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                {/* Totals and words */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                      Total Invoice Value (INR)
                    </span>
                    <div className="text-xs text-emerald-900 dark:text-emerald-200 italic mt-0.5">
                      {viewInvoiceData.amountInWords}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 font-mono">
                    ₹{viewInvoiceData.totals.grandTotal.toFixed(2)}
                  </div>
                </div>

                {/* Actions bottom */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <a
                    href={api.adminGetInvoicePrintUrl(viewInvoiceData.orderId)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-xs font-bold transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Tax Invoice</span>
                  </a>

                  <a
                    href={api.adminGetInvoicePdfUrl(viewInvoiceData.orderId)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Official PDF</span>
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Issue Credit Note Modal */}
      {issueCreditNoteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleIssueCreditNoteSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Issue GST Credit Note
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIssueCreditNoteTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Under Section 34 of the CGST Act, issued invoices cannot be silently changed. A legally numbered Credit Note will be generated and linked to Invoice{' '}
              <strong className="text-slate-800 dark:text-slate-200">{issueCreditNoteTarget.invoiceNumber}</strong>.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Reason for Credit Adjustment & Refund *
              </label>
              <textarea
                required
                rows={3}
                value={cnReason}
                onChange={(e) => setCnReason(e.target.value)}
                placeholder="e.g. Order cancelled, items returned, or defective goods credit reversal"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
              Credit Amount to Reverse: <strong>₹{Number(issueCreditNoteTarget.grandTotal).toFixed(2)}</strong>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIssueCreditNoteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={cnSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {cnSubmitting ? 'Issuing...' : 'Generate Credit Note'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


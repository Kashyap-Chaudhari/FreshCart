'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  History,
  Edit,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'LEDGER'>('PRODUCTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustType, setAdjustType] = useState('PURCHASE');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Product Add / Edit Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodUnit, setProdUnit] = useState('1 kg');
  const [prodPrice, setProdPrice] = useState<number>(50);
  const [prodMrp, setProdMrp] = useState<number>(60);
  const [prodTax, setProdTax] = useState<number>(5);
  const [prodStock, setProdStock] = useState<number>(20);
  const [prodLowStock, setProdLowStock] = useState<number>(5);
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const loadData = (page: number = currentPage) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryFilter) params.set('category', categoryFilter);
    params.set('page', String(page));
    params.set('limit', '50');

    api.adminGetProducts(params.toString()).then((res) => {
      if (res.success && res.data) {
        setProducts(res.data);
        if (res.pagination) {
          setCurrentPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
          setTotalCount(res.pagination.total);
        }
      }
      setIsLoading(false);
    });

    api.getCategories().then((res) => {
      if (res.success && res.data) {
        setCategories(res.data);
        if (!prodCategoryId && res.data.length > 0) {
          setProdCategoryId(res.data[0].id);
        }
      }
    });

    api.adminGetStockLedger().then((res) => {
      if (res.success && res.items) setLedger(res.items);
    });
  };

  useEffect(() => {
    loadData(1);
  }, [categoryFilter]);

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage({ type: 'success', text: `Uploading and processing "${file.name}"...` });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const csvData = evt.target?.result as string;
        const res = await api.adminImportProductsCsv(csvData);
        if (res.success) {
          setMessage({
            type: 'success',
            text: res.message || `CSV imported successfully! (${res.data?.total || 0} products processed)`,
          });
          loadData(1);
        } else {
          setMessage({ type: 'error', text: res.message || 'Failed to import CSV' });
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Error reading CSV file' });
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjustQuantity === 0 || !adjustReason.trim()) return;

    setIsAdjusting(true);
    const res = await api.adminAdjustStock(adjustingProduct.id, {
      quantityChange: Number(adjustQuantity),
      type: adjustType,
      reason: adjustReason,
    });
    setIsAdjusting(false);

    if (res.success) {
      setAdjustingProduct(null);
      setAdjustQuantity(0);
      setAdjustReason('');
      setMessage({ type: 'success', text: 'Stock adjusted and ledger recorded successfully.' });
      loadData();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to adjust stock.' });
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);

    const payload = {
      name: prodName,
      sku: prodSku,
      unit: prodUnit,
      price: Number(prodPrice),
      mrp: Number(prodMrp),
      taxPercent: Number(prodTax),
      stockQty: Number(prodStock),
      lowStockThreshold: Number(prodLowStock),
      categoryId: prodCategoryId,
      images: prodImage ? [prodImage] : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'],
    };

    let res;
    if (editingProductId) {
      res = await api.adminUpdateProduct(editingProductId, payload);
    } else {
      res = await api.adminCreateProduct(payload);
    }
    setSavingProduct(false);

    if (res.success) {
      setShowProductModal(false);
      resetForm();
      setMessage({ type: 'success', text: `Product ${editingProductId ? 'updated' : 'created'} successfully.` });
      loadData();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to save product.' });
    }
  };

  const handleToggleAvailable = async (product: any) => {
    const res = await api.adminUpdateProduct(product.id, {
      isAvailable: !product.isAvailable,
    });
    if (res.success) {
      loadData();
    }
  };

  const resetForm = () => {
    setEditingProductId(null);
    setProdName('');
    setProdSku('');
    setProdUnit('1 kg');
    setProdPrice(50);
    setProdMrp(60);
    setProdTax(5);
    setProdStock(20);
    setProdLowStock(5);
    setProdImage('');
  };

  const openEditModal = (p: any) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdUnit(p.unit);
    setProdPrice(Number(p.price));
    setProdMrp(Number(p.mrp));
    setProdTax(Number(p.taxPercent));
    setProdStock(p.stockQty);
    setProdLowStock(p.lowStockThreshold);
    setProdCategoryId(p.categoryId);
    setProdImage(p.images?.[0] || '');
    setShowProductModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Inventory & Stock Ledger</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage SKU listings, trigger stock adjustments with audit reasons, and export CSVs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 text-xs font-bold rounded-xl transition shadow-sm">
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>{isImporting ? 'Importing CSV...' : 'Import CSV'}</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              disabled={isImporting}
              onChange={handleCsvFileUpload}
            />
          </label>

          <a
            href={api.adminGetStockCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 hover:text-emerald-700 text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Stock CSV</span>
          </a>

          <button
            onClick={() => {
              resetForm();
              setShowProductModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
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

      {/* Tabs: Products vs Stock Movement Ledger */}
      <div className="flex items-center justify-between">
        <div className="flex bg-white p-1 rounded-2xl border border-gray-200 shadow-sm text-xs font-semibold">
          <button
            onClick={() => setActiveTab('PRODUCTS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'PRODUCTS'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Product Catalog ({totalCount || products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'LEDGER'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stock Movement Ledger</span>
          </button>
        </div>

        {activeTab === 'PRODUCTS' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData(1)}
                placeholder="Search SKU or name..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-gray-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => loadData(1)}
              className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
              title="Search & Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: PRODUCTS TABLE */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold">
                <tr>
                  <th className="py-3 px-4">Product Name & Category</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Selling Price / MRP</th>
                  <th className="py-3 px-4">Tax %</th>
                  <th className="py-3 px-4">Available Stock</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Loading inventory...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.stockQty <= p.lowStockThreshold && p.stockQty > 0;
                    const isOut = p.stockQty <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=80&q=80'}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                            />
                            <div>
                              <span className="font-bold text-gray-900 block">{p.name}</span>
                              <span className="text-[10px] text-emerald-800 font-semibold block">
                                {p.category?.name || 'Category'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-gray-800">{p.sku}</td>
                        <td className="py-3.5 px-4">{p.unit}</td>

                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-gray-900 block">
                            ₹{Number(p.price).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-gray-400 line-through block">
                            MRP ₹{Number(p.mrp).toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">{Number(p.taxPercent)}%</td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-black text-sm ${
                                isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-gray-900'
                              }`}
                            >
                              {p.stockQty}
                            </span>
                            {isOut ? (
                              <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                OUT
                              </span>
                            ) : isLow ? (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                LOW
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[10px] text-gray-400 block">
                            Min Alert: {p.lowStockThreshold}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleAvailable(p)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {p.isAvailable ? 'Available' : 'Hidden'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setAdjustingProduct(p);
                                setAdjustQuantity(0);
                                setAdjustReason('');
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg border border-emerald-200 transition"
                            >
                              Adjust Stock
                            </button>
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                              title="Edit product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              <span>
                Showing page <strong className="text-gray-900">{currentPage}</strong> of{' '}
                <strong className="text-gray-900">{totalPages}</strong> ({totalCount} total items)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => loadData(currentPage - 1)}
                  className="px-3 py-1 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 font-bold transition shadow-sm"
                >
                  Previous
                </button>
                <span className="px-2 font-mono text-[11px] font-bold text-gray-800">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => loadData(currentPage + 1)}
                  className="px-3 py-1 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 font-bold transition shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: STOCK MOVEMENT LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
            <strong>Immutable Stock Ledger:</strong> Every inventory change (sales deduction, cancellation return, manual adjustment, purchase) is logged permanently with row locks.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Product Name / SKU</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4">Change</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Reference / Reason</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No stock movement entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50/60">
                      <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900 block">{entry.product?.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{entry.product?.sku}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            entry.type === 'SALE_DEDUCTION'
                              ? 'bg-rose-100 text-rose-800'
                              : entry.type === 'ORDER_CANCEL_RESTORE' || entry.type === 'PURCHASE' || entry.type === 'RETURN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-black">
                        <span
                          className={entry.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-600'}
                        >
                          {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {entry.balanceAfter}
                      </td>

                      <td className="py-3 px-4 text-gray-600">
                        <span className="font-medium text-gray-900 block">{entry.reason}</span>
                        {entry.referenceId && (
                          <span className="text-[10px] text-gray-400 font-mono block">
                            Ref: {entry.referenceType} #{entry.referenceId}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-gray-500">
                        {entry.createdByUser?.name || 'System / Auto'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Adjust Stock: {adjustingProduct.name}</h3>
            <p className="text-xs text-gray-500">
              Current Stock: <strong className="text-gray-900">{adjustingProduct.stockQty} {adjustingProduct.unit}</strong>
            </p>

            <form onSubmit={handleAdjustStockSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Adjustment Type *
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5 bg-white font-medium"
                >
                  <option value="PURCHASE">Purchase / Inventory Restock (+)</option>
                  <option value="RETURN">Customer / Warehouse Return (+)</option>
                  <option value="DAMAGE">Damaged / Expired Goods (-)</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Count Audit (+ / -)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity Change (+ to add, - to deduct) *
                </label>
                <input
                  type="number"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(parseInt(e.target.value, 10))}
                  placeholder="e.g. 20 or -5"
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5 font-bold"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  New stock after adjustment will be:{' '}
                  <strong>{adjustingProduct.stockQty + Number(adjustQuantity || 0)}</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Fresh crate received from farm / Supplier PO #4092"
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting || adjustQuantity === 0}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isAdjusting ? 'Saving...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-gray-900 text-base">
              {editingProductId ? 'Edit Product' : 'Add New Grocery Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Organic Brown Eggs"
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value.toUpperCase())}
                    placeholder="e.g. EGG-ORG-01"
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    required
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    placeholder="e.g. 1 kg / Pack of 6"
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(parseFloat(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">MRP *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodMrp}
                    onChange={(e) => setProdMrp(parseFloat(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">GST Tax % *</label>
                  <select
                    value={prodTax}
                    onChange={(e) => setProdTax(parseFloat(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5 bg-white font-medium"
                  >
                    <option value={0}>0% (Fresh)</option>
                    <option value={5}>5% (Staples)</option>
                    <option value={12}>12% (Dairy/Oils)</option>
                    <option value={18}>18% (Packaged)</option>
                    <option value={28}>28% (Drinks)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(parseInt(e.target.value, 10))}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Min Alert Level</label>
                  <input
                    type="number"
                    value={prodLowStock}
                    onChange={(e) => setProdLowStock(parseInt(e.target.value, 10))}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5 bg-white truncate"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {savingProduct ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


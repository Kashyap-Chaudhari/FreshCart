'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, Search, SlidersHorizontal, Check, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/customer/ProductCard';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentSortBy = searchParams.get('sortBy') || 'createdAt';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [inStockOnly, setInStockOnly] = useState(currentInStock);

  useEffect(() => {
    // Load categories
    api.getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (currentCategory) params.set('category', currentCategory);
    if (currentSearch) params.set('search', currentSearch);
    if (inStockOnly) params.set('inStock', 'true');
    params.set('sortBy', currentSortBy);
    params.set('sortOrder', currentSortOrder);
    params.set('page', String(pagination.page));
    params.set('limit', '20');

    api
      .getProducts(params.toString())
      .then((res) => {
        if (res.success && res.data) {
          setProducts(res.data);
          if (res.pagination) setPagination(res.pagination);
        }
      })
      .finally(() => setIsLoading(false));
  }, [currentCategory, currentSearch, inStockOnly, currentSortBy, currentSortOrder, pagination.page]);

  const updateFilters = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters('search', searchInput);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {currentCategory
              ? categories.find((c) => c.slug === currentCategory)?.name || 'Products'
              : currentSearch
              ? `Search results for "${currentSearch}"`
              : 'All Grocery Products'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Showing {products.length} of {pagination.total} fresh items
          </p>
        </div>

        {/* Search bar & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Filter products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>

          {/* Sort By */}
          <select
            value={`${currentSortBy}-${currentSortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-');
              const params = new URLSearchParams(searchParams.toString());
              params.set('sortBy', sb);
              params.set('sortOrder', so);
              router.push(`/products?${params.toString()}`);
            }}
            className="bg-white border border-gray-300 text-xs font-semibold rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* In-Stock Filter Toggle */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold text-gray-900">In-Stock Only</span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  updateFilters('inStock', e.target.checked ? 'true' : '');
                }}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </label>
            <p className="text-[11px] text-gray-500 mt-1">Hide out-of-stock items</p>
          </div>

          {/* Categories Filter List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              Categories
            </h3>
            <ul className="space-y-1 text-xs">
              <li>
                <button
                  onClick={() => updateFilters('category', '')}
                  className={`w-full text-left px-3 py-2 rounded-xl font-medium transition ${
                    !currentCategory
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => updateFilters('category', cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl font-medium transition flex items-center justify-between ${
                      currentCategory === cat.slug
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-gray-400">{cat._count?.products || 0}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-medium">Fetching fresh inventory...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 space-y-3">
              <h3 className="font-bold text-base text-gray-900">No products found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No items match your selected filters. Try choosing another category or clearing your search term.
              </p>
              <button
                onClick={() => router.push('/products')}
                className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-700"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                        pagination.page === p
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Loading catalog...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

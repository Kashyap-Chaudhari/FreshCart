'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Filter,
  Search,
  SlidersHorizontal,
  Check,
  RefreshCw,
  ShoppingBag,
  Percent,
  Sparkles,
  Zap,
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/customer/ProductCard';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const urlPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const currentLimit = Math.max(1, parseInt(searchParams.get('limit') || '12', 10));
  const [currentPage, setCurrentPage] = useState<number>(urlPage);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Keep local page state synced with URL navigation
  useEffect(() => {
    setCurrentPage(urlPage);
  }, [urlPage]);

  const currentCategory = searchParams.get('category') || '';
  const currentSubcategory = searchParams.get('subcategory') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentSortBy = searchParams.get('sortBy') || 'createdAt';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';
  const currentPriceRange = searchParams.get('priceRange') || '';
  const currentDiscount = searchParams.get('minDiscount') || '';

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [inStockOnly, setInStockOnly] = useState(currentInStock);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    api.getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (currentCategory) params.set('category', currentCategory);
    if (currentSubcategory) params.set('subcategory', currentSubcategory);
    if (currentSearch) params.set('search', currentSearch);
    if (inStockOnly) params.set('inStock', 'true');
    params.set('sortBy', currentSortBy);
    params.set('sortOrder', currentSortOrder);
    params.set('page', String(currentPage));
    params.set('limit', String(currentLimit));

    api
      .getProducts(params.toString())
      .then((res) => {
        if (res.success && res.data) {
          let list = res.data;

          // Client-side price range filter fallback
          if (currentPriceRange) {
            const [min, max] = currentPriceRange.split('-').map(Number);
            list = list.filter((p: any) => {
              const price = Number(p.price);
              if (max) return price >= min && price <= max;
              return price >= min;
            });
          }

          // Client-side discount filter fallback
          if (currentDiscount) {
            const minDisc = Number(currentDiscount);
            list = list.filter((p: any) => {
              if (!p.mrp || Number(p.mrp) <= Number(p.price)) return false;
              const disc = Math.round(((Number(p.mrp) - Number(p.price)) / Number(p.mrp)) * 100);
              return disc >= minDisc;
            });
          }

          setProducts(list);
          if (res.pagination) setPagination(res.pagination);
        }
      })
      .finally(() => setIsLoading(false));
  }, [
    currentCategory,
    currentSubcategory,
    currentSearch,
    inStockOnly,
    currentSortBy,
    currentSortOrder,
    currentPriceRange,
    currentDiscount,
    currentPage,
    currentLimit,
  ]);

  const updateFilters = (key: string, val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'category') {
      params.delete('subcategory');
    }
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (pagination.totalPages > 0 && newPage > pagination.totalPages) || newPage === currentPage) return;
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/products?${params.toString()}`);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpPageInput.trim(), 10);
    if (!isNaN(parsed)) {
      const validPage = Math.max(1, Math.min(pagination.totalPages || 1, parsed));
      handlePageChange(validPage);
      setJumpPageInput('');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters('search', searchInput);
  };

  const getPageNumbers = () => {
    const { totalPages } = pagination;
    if (totalPages <= 1) return [1];
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage === 1) {
      return [1, 2, '...', totalPages];
    }
    if (currentPage === 2) {
      return [1, 2, 3, '...', totalPages];
    }
    if (currentPage === 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage === totalPages) {
      return [1, '...', totalPages - 1, totalPages];
    }
    if (currentPage === totalPages - 1) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }
    if (currentPage === totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const activeCategoryObj = categories.find((c) => c.slug === currentCategory);
  const activeFiltersCount =
    (currentCategory ? 1 : 0) +
    (currentSubcategory ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (currentPriceRange ? 1 : 0) +
    (currentDiscount ? 1 : 0) +
    (currentSearch ? 1 : 0);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'grocery-staples': return '🌾';
      case 'fruits-vegetables': return '🍎';
      case 'dairy-bread-eggs': return '🥛';
      case 'oils-ghee': return '🫒';
      case 'packaged-food': return '🍪';
      case 'snacks-confectionery': return '🍟';
      case 'beverages': return '🧃';
      case 'frozen-foods': return '🧊';
      case 'personal-care-beauty': return '🧴';
      case 'bath-body': return '🧼';
      case 'oral-care': return '🪥';
      case 'mens-grooming': return '🪒';
      case 'baby-care': return '👶';
      case 'womens-hygiene': return '🌸';
      case 'household-cleaning': return '🧹';
      case 'home-kitchen': return '🍳';
      case 'home-furnishing': return '🛏️';
      case 'plastic-home-utility': return '🪣';
      case 'pooja-needs': return '🪔';
      case 'stationery-office': return '✏️';
      case 'toys-games': return '🧸';
      case 'apparel-fashion': return '👕';
      case 'electronics-electrical': return '⚡';
      case 'pet-care': return '🐾';
      case 'seasonal-special': return '🎉';
      default: return '🛒';
    }
  };

  return (
    <div className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 py-3 sm:py-4 space-y-4 pb-20 lg:pb-8 w-full min-w-0">
      {/* Sleek Breadcrumb & Category Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="hover:text-emerald-700 transition"
            >
              Home
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => router.push('/products')}
              className="hover:text-emerald-700 transition"
            >
              Catalogue
            </button>
            {activeCategoryObj && (
              <>
                <span>/</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {activeCategoryObj.name}
                </span>
              </>
            )}
          </div>

          {/* Heading */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeCategoryObj
                ? activeCategoryObj.name
                : currentSearch
                ? `Results for "${currentSearch}"`
                : 'All Grocery Products'}
            </h1>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              {pagination.total > 0 ? `${pagination.total.toLocaleString()} Items` : `${products.length} Items`}
            </span>
          </div>
        </div>

        {/* 10-15 Min Delivery Guarantee Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 px-3.5 py-1.5 rounded-full text-xs text-emerald-800 dark:text-emerald-300 font-bold shadow-xs">
          <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 animate-pulse" />
          <span>Superfast 10-15 Min Doorstep Delivery in Gujarat</span>
        </div>
      </div>

      {/* Main Layout: Left-Side Category Navigation Rail / Sidebar + Products Grid */}
      <div className="flex items-start gap-1.5 sm:gap-3 lg:gap-6 w-full min-w-0">
        {/* ========================================================================= */}
        {/* 📱 MOBILE CATEGORY LEFT RAIL (lg:hidden)                                  */}
        {/* Slim, professional quick-commerce rail (Zepto / Blinkit style)            */}
        {/* ========================================================================= */}
        <aside className="lg:hidden w-[68px] sm:w-[74px] shrink-0 sticky top-14 max-h-[calc(100vh-64px)] overflow-y-auto no-scrollbar rounded-xl bg-[#F6F7F9] dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1 shadow-2xs space-y-1">
          {/* All Items Pill Button */}
          <button
            type="button"
            onClick={() => updateFilters('category', '')}
            className={`w-full py-2 px-0.5 rounded-lg flex flex-col items-center text-center transition active:scale-95 ${
              !currentCategory
                ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-black border-l-[3px] border-emerald-600 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 font-medium'
            }`}
          >
            <span className="text-base">🛒</span>
            <span className="text-[9.5px] leading-[11px] mt-0.5 font-bold">All Items</span>
            {!currentCategory && <Check className="w-2.5 h-2.5 stroke-[3] mt-0.5 text-emerald-600" />}
          </button>

          {/* Category Pill Buttons */}
          {categories.map((cat) => {
            const isSelected = currentCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilters('category', cat.slug)}
                className={`w-full py-2 px-0.5 rounded-lg flex flex-col items-center text-center transition active:scale-95 ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-black border-l-[3px] border-emerald-600 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 font-medium'
                }`}
              >
                <span className="text-base">{getCategoryIcon(cat.slug)}</span>
                <span className="text-[9.5px] leading-[11px] mt-0.5 line-clamp-2 px-0.5">
                  {cat.name}
                </span>
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3] mt-0.5 text-emerald-600" />}
              </button>
            );
          })}
        </aside>

        {/* ========================================================================= */}
        {/* 💻 DESKTOP UNIFIED SIDEBAR (hidden lg:block)                              */}
        {/* ========================================================================= */}
        <div className="hidden lg:block lg:w-72 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 sticky top-20 space-y-5">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Filters & Categories
                </h3>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={() => router.push('/products')}
                  className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>

            {/* In-Stock Toggle Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  In-Stock Only
                </span>
                <span className="text-[10px] text-slate-400">Hide out of stock items</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    updateFilters('inStock', e.target.checked ? 'true' : '');
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            {/* Categories Navigation */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Categories
              </h4>
              <div className="space-y-0.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => updateFilters('category', '')}
                  className={`w-full text-left px-3 py-2 rounded-xl font-bold transition flex items-center justify-between ${
                    !currentCategory
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>🛒</span>
                    <span>All Items</span>
                  </span>
                  {!currentCategory && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>

                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => updateFilters('category', c.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between ${
                      currentCategory === c.slug
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border-l-4 border-emerald-600'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span>{getCategoryIcon(c.slug)}</span>
                      <span className="truncate">{c.name}</span>
                    </span>
                    {currentCategory === c.slug && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Price Range
              </h4>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { label: 'All Prices', val: '' },
                  { label: 'Under ₹50', val: '0-50' },
                  { label: '₹50 to ₹100', val: '50-100' },
                  { label: '₹100 to ₹200', val: '100-200' },
                  { label: '₹200 & Above', val: '200-10000' },
                ].map((range) => (
                  <button
                    key={range.val}
                    type="button"
                    onClick={() => updateFilters('priceRange', range.val)}
                    className={`p-2 rounded-lg text-left text-xs font-semibold transition border ${
                      currentPriceRange === range.val
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block truncate">{range.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Discount Filter */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Deals & Offers
              </h4>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { label: 'All Deals', val: '' },
                  { label: '10% or more', val: '10' },
                  { label: '20% or more', val: '20' },
                  { label: '30% or more', val: '30' },
                ].map((disc) => (
                  <button
                    key={disc.val}
                    type="button"
                    onClick={() => updateFilters('minDiscount', disc.val)}
                    className={`p-2 rounded-lg text-left text-xs font-semibold transition border ${
                      currentDiscount === disc.val
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block truncate">{disc.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🛍️ PRODUCT GRID AREA (Main right-side view)                               */}
        {/* ========================================================================= */}
        <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-4">
          {/* Sleek, Non-Wrapping Control Bar for Mobile & Desktop */}
          <div className="px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Mobile Filter Sheet Trigger Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10.5px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95 transition"
              >
                <SlidersHorizontal className="w-3 h-3 text-emerald-600" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <span className="text-[11px] text-slate-500 font-semibold truncate hidden sm:inline">
                Showing <strong>{pagination.total > 0 ? (currentPage - 1) * currentLimit + 1 : 0}–{Math.min(currentPage * currentLimit, pagination.total)}</strong> of <strong>{pagination.total.toLocaleString()}</strong> items
              </span>

              {/* Mobile Active Category Pill Indicator */}
              <span className="text-[10px] text-slate-400 font-semibold sm:hidden truncate">
                {activeCategoryObj?.name || 'All Items'} ({pagination.total})
              </span>
            </div>

            {/* Sort Selector Dropdown */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 hidden sm:inline">Sort:</span>
              <select
                value={`${currentSortBy}-${currentSortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split('-');
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('sortBy', sb);
                  params.set('sortOrder', so);
                  router.push(`/products?${params.toString()}`);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] sm:text-xs font-bold rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical (A to Z)</option>
              </select>
            </div>
          </div>

          {/* Subcategories Filter Chips (Zepto / Blinkit style) */}
          {activeCategoryObj && activeCategoryObj.subcategories && activeCategoryObj.subcategories.length > 0 && (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
              <button
                type="button"
                onClick={() => updateFilters('subcategory', '')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  !currentSubcategory
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                }`}
              >
                All {activeCategoryObj.name}
              </button>
              {activeCategoryObj.subcategories.map((sub: string) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => updateFilters('subcategory', sub)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    currentSubcategory === sub
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Product Cards Grid: Spacious 4-column layout on desktop, 2-column on mobile */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-4.5">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 h-72 skeleton-shimmer"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-800 dark:text-white text-base">
                No Products Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn&apos;t find any items matching your active filters. Try resetting your search or category filters.
              </p>
              <button
                type="button"
                onClick={() => router.push('/products')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-4.5 w-full min-w-0">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Exact Zepto/FreshCart Numbered Pagination Bar */}
          {pagination.totalPages > 1 && (
            <div
              className={`mt-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3 transition-all duration-200 ${
                isLoading ? 'opacity-70 pointer-events-none' : 'opacity-100'
              }`}
            >
              {/* Primary Pagination Bar: Status text on left, < Prev [1] [2] ... [355] [Next >] on right */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Left: Showing 1 to 12 of 4,260 items (Page 1 of 355) */}
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
                  Showing{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {pagination.total > 0 ? (currentPage - 1) * currentLimit + 1 : 0}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {Math.min(currentPage * currentLimit, pagination.total)}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {pagination.total.toLocaleString()}
                  </strong>{' '}
                  items (Page{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {currentPage}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {pagination.totalPages}
                  </strong>
                  )
                </div>

                {/* Right: Navigation Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                  {/* Prev Button */}
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`h-9 sm:h-10 px-3.5 sm:px-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border ${
                      currentPage <= 1
                        ? 'opacity-40 cursor-not-allowed bg-white/60 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 shadow-2xs'
                    }`}
                    title="Previous Page"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span>Prev</span>
                  </button>

                  {/* Number Buttons & Dots */}
                  {getPageNumbers().map((p, idx) => {
                    if (typeof p === 'string') {
                      return (
                        <span
                          key={`dots-${idx}`}
                          className="px-1 text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm select-none tracking-widest flex items-center justify-center"
                        >
                          ...
                        </span>
                      );
                    }

                    const isActive = p === currentPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 px-2.5 sm:px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center ${
                          isActive
                            ? 'bg-[#168447] text-white shadow-sm shadow-[#168447]/30'
                            : 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#168447] hover:text-[#168447] dark:hover:border-emerald-500 dark:hover:text-emerald-400 shadow-2xs'
                        }`}
                        aria-label={`Page ${p}`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    type="button"
                    disabled={currentPage >= pagination.totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`h-9 sm:h-10 px-3.5 sm:px-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 border ${
                      currentPage >= pagination.totalPages
                        ? 'opacity-40 cursor-not-allowed bg-white/60 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 shadow-2xs'
                    }`}
                    title="Next Page"
                    aria-label="Next Page"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Secondary Sleek Jump & Per-Page Row */}
              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-400">Jump to:</span>
                  <input
                    type="number"
                    min={1}
                    max={pagination.totalPages}
                    placeholder={String(currentPage)}
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    className="w-12 h-7 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    aria-label="Target page number"
                  />
                  <button
                    type="submit"
                    className="px-2.5 h-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition active:scale-95 shadow-2xs flex items-center gap-0.5"
                  >
                    <span>Go</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </form>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-400">Show:</span>
                  <select
                    value={currentLimit}
                    onChange={(e) => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('limit', e.target.value);
                      params.set('page', '1');
                      router.push(`/products?${params.toString()}`);
                    }}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 cursor-pointer shadow-2xs"
                  >
                    <option value="12">12 / page</option>
                    <option value="16">16 / page</option>
                    <option value="24">24 / page</option>
                    <option value="36">36 / page</option>
                    <option value="48">48 / page</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs lg:hidden">
          <div
            className="fixed inset-0"
            onClick={() => setMobileFilterOpen(false)}
            aria-label="Close filters"
          />
          <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 flex-shrink-0" />

            {/* Header */}
            <div className="px-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-primary" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Filters</h3>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-soft text-brand-primary font-bold text-[10px]">
                    {activeFiltersCount} applied
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* In-Stock Toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">In-Stock Only</span>
                  <span className="text-[11px] text-slate-400">Hide out of stock items</span>
                </div>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    updateFilters('inStock', e.target.checked ? 'true' : '');
                  }}
                  className="w-5 h-5 accent-brand-primary rounded cursor-pointer"
                />
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                  Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateFilters('category', '')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      !currentCategory
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>All</span>
                    {!currentCategory && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => updateFilters('category', c.slug)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        currentCategory === c.slug
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{c.name}</span>
                      {currentCategory === c.slug && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategories (if category selected) */}
              {activeCategoryObj && activeCategoryObj.subcategories && activeCategoryObj.subcategories.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                    Subcategories ({activeCategoryObj.name})
                  </h4>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => updateFilters('subcategory', '')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        !currentSubcategory
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>All</span>
                      {!currentSubcategory && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    {activeCategoryObj.subcategories.map((sub: string) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => updateFilters('subcategory', sub)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          currentSubcategory === sub
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{sub}</span>
                        {currentSubcategory === sub && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                  Price Range
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'All Prices', val: '' },
                    { label: 'Under ₹50', val: '0-50' },
                    { label: '₹50 to ₹100', val: '50-100' },
                    { label: '₹100 to ₹200', val: '100-200' },
                    { label: '₹200 & Above', val: '200-10000' },
                  ].map((range) => (
                    <button
                      key={range.val}
                      type="button"
                      onClick={() => updateFilters('priceRange', range.val)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition text-left flex items-center justify-between border ${
                        currentPriceRange === range.val
                          ? 'bg-brand-soft text-brand-primary border-brand-primary dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-700'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>{range.label}</span>
                      {currentPriceRange === range.val && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Discount */}
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
                  Discounts & Deals
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Any Price', val: '' },
                    { label: '10% or more', val: '10' },
                    { label: '20% or more', val: '20' },
                    { label: '30% or more', val: '30' },
                  ].map((disc) => (
                    <button
                      key={disc.val}
                      type="button"
                      onClick={() => updateFilters('minDiscount', disc.val)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition text-left flex items-center justify-between border ${
                        currentDiscount === disc.val
                          ? 'bg-brand-soft text-brand-primary border-brand-primary dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-700'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>{disc.label}</span>
                      {currentDiscount === disc.val && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  router.push('/products');
                  setMobileFilterOpen(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 active:scale-98 transition"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-[2] py-3 px-4 rounded-xl bg-brand-primary text-white text-xs font-black shadow-md shadow-brand-primary/25 active:scale-98 transition"
              >
                Apply Filters ({products.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1720px] mx-auto px-4 py-16 text-center text-xs text-slate-400">
          Loading grocery catalog...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

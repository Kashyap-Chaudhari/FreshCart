'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, Clock, Flame, ArrowRight, ShoppingBag, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';

interface OmniSearchProps {
  className?: string;
  isMobile?: boolean;
}

const POPULAR_SEARCH_KEYWORDS = [
  'Amul Milk',
  'Onions & Potatoes',
  'Tomatoes',
  'Amul Butter',
  'Paneer',
  'Apples & Bananas',
  'Aashirvaad Atta',
  'Fortune Oil',
];

export default function OmniSearch({ className = '', isMobile = false }: OmniSearchProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('freshcart_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch {}
  }, []);

  const saveRecentSearch = (kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('freshcart_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (e: React.MouseEvent, kw: string) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s !== kw);
      setRecentSearches(updated);
      localStorage.setItem('freshcart_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  // Debounced search suggestions
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await api.getProducts(`search=${encodeURIComponent(query.trim())}&limit=5`);
        if (res.success && res.data) {
          setSuggestions(res.data);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;
    saveRecentSearch(term);
    setIsOpen(false);
    router.push(`/products?search=${encodeURIComponent(term)}`);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query);
        }}
        className="relative"
      >
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-brand-primary absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder='Search "milk", "bread", "atta", "veggies"...'
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-brand-text dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white dark:focus:bg-slate-900 transition-all shadow-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete / Suggestions Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-elevated p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto">
          {/* Live Product Matches */}
          {query.trim().length >= 2 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                  {loadingSuggestions ? 'Searching...' : 'Products matching your search'}
                </span>
                {suggestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSearch(query)}
                    className="text-brand-primary dark:text-emerald-400 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {suggestions.length > 0 ? (
                <div className="space-y-1.5">
                  {suggestions.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between group"
                    >
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={() => {
                          saveRecentSearch(p.name);
                          setIsOpen(false);
                        }}
                        className="flex items-center gap-2.5 flex-1 min-w-0"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {p.images && p.images[0] ? (
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-900 dark:text-white block truncate group-hover:text-brand-primary">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {p.unit} • ₹{p.price} {p.mrp && p.mrp > p.price ? <span className="line-through text-slate-400">₹{p.mrp}</span> : null}
                          </span>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p, 1);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-brand-soft dark:bg-emerald-950/60 text-brand-primary dark:text-emerald-400 font-bold hover:bg-brand-primary hover:text-white transition flex items-center gap-1 border border-brand-primary/20"
                      >
                        <Plus className="w-3 h-3" />
                        <span>ADD</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : !loadingSuggestions ? (
                <div className="p-3 text-center text-slate-400 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <span>No exact products found for "{query}". Try checking category or spelling.</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('freshcart_recent_searches');
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-500 font-bold"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSearch(s)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-soft hover:text-brand-primary transition"
                  >
                    <span>{s}</span>
                    <span
                      onClick={(e) => removeRecentSearch(e, s)}
                      className="text-slate-400 hover:text-rose-500 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          <div>
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
              <Flame className="w-3 h-3 text-brand-offer" />
              Trending & Popular Searches
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SEARCH_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleSearch(kw)}
                  className="px-3 py-1.5 rounded-full bg-brand-soft/70 dark:bg-emerald-950/40 text-brand-primary dark:text-emerald-300 border border-brand-soft dark:border-emerald-900/60 hover:bg-brand-primary hover:text-white transition font-medium text-xs"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


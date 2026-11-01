'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Package, ShoppingBag, User, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, subtotal, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const [hasOrders, setHasOrders] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('freshcart_guest_orders') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHasOrders(true);
        }
      }
    } catch {
      // ignore
    }
  }, [pathname]);

  const isHome = pathname === '/';
  const isCategories = pathname === '/products';
  const isOrders = pathname.startsWith('/orders');
  const isAccount = pathname === '/account' || pathname === '/login';

  return (
    <>
      {/* Floating Zepto-Style Quick Cart Strip on Mobile */}
      {totalItems > 0 && pathname !== '/checkout' && pathname !== '/cart' && (
        <div className="lg:hidden fixed bottom-14 left-3 right-3 z-40 animate-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#168447] hover:bg-[#106B39] text-white p-2.5 sm:p-3 rounded-2xl shadow-xl shadow-emerald-900/25 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xs font-mono">
                {totalItems}
              </div>
              <div className="text-left">
                <span className="text-xs font-black block leading-none font-mono">₹{Math.round(subtotal)}</span>
                <span className="text-[10px] text-white/80 font-medium">plus taxes • ⚡ 10-15m delivery</span>
              </div>
            </div>
            <div className="flex items-center gap-1 font-black text-xs bg-white/20 px-3 py-1.5 rounded-xl">
              <span>View Cart</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </button>
        </div>
      )}

      {/* 5-Tab Fixed Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-bottom-nav px-2 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around transition-colors">
      {/* 1. Home */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
          isHome
            ? 'text-brand-primary dark:text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5">Home</span>
      </Link>

      {/* 2. Categories */}
      <Link
        href="/products"
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
          isCategories
            ? 'text-brand-primary dark:text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Grid className={`w-5 h-5 ${isCategories ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5">Categories</span>
      </Link>

      {/* 3. Orders */}
      <Link
        href="/orders"
        className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
          isOrders
            ? 'text-brand-primary dark:text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <div className="relative">
          <Package className={`w-5 h-5 ${isOrders ? 'stroke-[2.5]' : ''}`} />
          {(hasOrders || user) && (
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </div>
        <span className="text-[10px] mt-0.5">Orders</span>
      </Link>

      {/* 4. Cart */}
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className="relative flex flex-col items-center justify-center py-1 px-2.5 text-slate-700 dark:text-slate-300"
        aria-label="Open Shopping Cart"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 stroke-[2.2] text-slate-600 dark:text-slate-300" />
          {totalItems > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-brand-primary text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-cart-bounce border border-white dark:border-slate-900">
              {totalItems}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
          {totalItems > 0 ? `₹${Math.round(subtotal)}` : 'Cart'}
        </span>
      </button>

      {/* 5. Account */}
      <Link
        href={user ? '/account' : '/login'}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
          isAccount
            ? 'text-brand-primary dark:text-emerald-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <User className={`w-5 h-5 ${isAccount ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5">{user ? 'Account' : 'Login'}</span>
      </Link>
    </nav>
    </>
  );
}


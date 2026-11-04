'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ShoppingBag,
  MapPin,
  ChevronDown,
  User as UserIcon,
  Sun,
  Moon,
  Truck,
  Zap,
  Phone,
  ShieldCheck,
  Menu,
  X,
  Compass,
  Home,
  History,
  Package,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import OmniSearch from './OmniSearch';
import LocationModal from './LocationModal';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems, subtotal, setIsCartOpen } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Location modal & state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentPincode, setCurrentPincode] = useState('380015');
  const [areaName, setAreaName] = useState('Vastrapur, Ahmedabad');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const savedPin = localStorage.getItem('freshcart_pincode');
      const savedArea = localStorage.getItem('freshcart_area_name');
      if (savedPin) setCurrentPincode(savedPin);
      if (savedArea) setAreaName(savedArea);
    } catch { }
  }, []);

  const handleSelectPincode = (newPin: string, newArea: string) => {
    setCurrentPincode(newPin);
    setAreaName(newArea);
    try {
      localStorage.setItem('freshcart_pincode', newPin);
      localStorage.setItem('freshcart_area_name', newArea);
    } catch { }
  };

  return (
    <>
      {/* Top Quick Commerce Announcement Strip */}
      <div className="bg-brand-deep text-white text-[11px] py-1 px-4 text-center flex items-center justify-between font-medium">
        <div className="hidden md:flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-brand-offer fill-brand-offer" />
          <span>Superfast 10-15 Mins Delivery across Gujarat</span>
        </div>

        <div className="mx-auto md:mx-0 flex items-center gap-1.5 font-bold">
          <span>⚡ Minimum Order ₹99 • FREE Delivery over ₹499 • Cash on Delivery Available</span>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <span>Support: +91 98250 00001</span>
          <span className="bg-brand-primary px-2 py-0.5 rounded-full font-bold text-[10px] text-white">
            CODE: FRESH15 (15% OFF)
          </span>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors w-full">
        <div className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 w-full">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4 lg:gap-6 w-full min-w-0">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-brand-primary to-emerald-500 flex items-center justify-center text-white font-black text-base sm:text-xl shadow-md shadow-brand-primary/20 group-hover:scale-105 transition-transform">
                🥦
              </div>
              <div>
                <span className="text-base sm:text-xl font-black tracking-tight text-brand-text dark:text-white leading-none flex items-center">
                  Fresh<span className="text-brand-primary dark:text-emerald-400">Cart</span>
                </span>
                <span className="hidden sm:block text-[10px] font-extrabold text-brand-offer uppercase tracking-wider mt-0.5">
                  10-15 Mins Groceries
                </span>
              </div>
            </Link>

            {/* Delivery Location Selector Pill (Optimized for Mobile & Desktop) */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-brand-secondary dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80 text-left hover:border-brand-primary/40 transition group max-w-[120px] xs:max-w-[135px] sm:max-w-[190px] lg:max-w-[240px] shrink min-w-0"
              title="Change Delivery Location"
            >
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-xl bg-brand-soft dark:bg-emerald-950/60 text-brand-primary dark:text-emerald-400 flex items-center justify-center shrink-0">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-brand-primary dark:text-emerald-400 tracking-wider truncate">
                    ⚡ 10-15m
                  </span>
                  <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 group-hover:text-brand-primary transition-colors shrink-0" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {areaName}
                </span>
              </div>
            </button>

            {/* Center OmniSearch Bar (Desktop & Tablet) */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <OmniSearch />
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Home Button (Desktop) */}
              <Link
                href="/"
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition group ${
                  pathname === '/'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title="Home"
              >
                <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline">Home</span>
              </Link>

              {/* Order History Button (Desktop & Tablet - Mobile uses bottom nav) */}
              <Link
                href="/orders"
                className={`hidden sm:inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-2xl text-xs font-bold transition group ${
                  pathname === '/orders'
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-brand-soft/80 hover:bg-brand-soft dark:bg-emerald-950/60 text-brand-primary dark:text-emerald-300 border border-brand-soft dark:border-emerald-900/60 hover:border-brand-primary/40'
                }`}
                title="View Order History & Live Tracking"
              >
                <History className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Orders</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </Link>

              {/* Theme Toggle (Compact on Mobile) */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shrink-0"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />}
              </button>

              {/* User Login / Profile (Desktop & Tablet - Mobile uses bottom nav Account tab) */}
              <div className="hidden sm:flex items-center">
                {user ? (
                  <div className="relative group">
                    <Link
                      href="/account"
                      className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
                    >
                      <UserIcon className="w-4 h-4 text-brand-primary" />
                      <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                    </Link>

                    {/* Dropdown Menu */}
                    <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 rounded-3xl shadow-elevated border border-slate-200/90 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Account</span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate block">
                          {user.name}
                        </span>
                      </div>
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-brand-primary" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span className="flex items-center gap-2">
                          <History className="w-3.5 h-3.5 text-brand-primary" />
                          <span>Order History</span>
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </Link>
                      {isAdmin && (
                        <a
                          href={process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Admin Portal ↗</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition mt-1"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-brand-soft text-brand-primary dark:bg-emerald-950/60 dark:text-emerald-400 font-extrabold text-xs hover:bg-brand-primary hover:text-white transition shadow-xs"
                  >
                    <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Login</span>
                  </Link>
                )}
              </div>

              {/* Blinkit/Zepto-style Green Cart Pill Button (Fully Visible, NEVER Clipped!) */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 bg-brand-primary hover:bg-brand-deep text-white px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-2xl font-black text-xs shadow-md shadow-brand-primary/20 transition active:scale-95 shrink-0"
                aria-label="Open Cart"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-brand-offer text-brand-text font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-brand-primary">
                      {totalItems}
                    </span>
                  )}
                </div>
                <div className="flex flex-col text-left leading-none">
                  {totalItems > 0 ? (
                    <>
                      <span className="text-[9px] sm:text-[10px] opacity-90 font-bold hidden sm:inline">{totalItems} items</span>
                      <span className="text-xs font-black font-mono whitespace-nowrap">₹{Math.round(subtotal)}</span>
                    </>
                  ) : (
                    <span className="hidden sm:inline">My Cart</span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Row (Clean, High-Impact) */}
          <div className="md:hidden pb-2.5 pt-1">
            <OmniSearch isMobile />
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3 animate-in fade-in duration-150">
            {/* Location selector on mobile */}
            <button
              type="button"
              onClick={() => {
                setIsLocationModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-primary" />
                <span>Deliver to: {areaName} ({currentPincode})</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-3 rounded-2xl flex items-center gap-2 transition ${pathname === '/'
                    ? 'bg-brand-primary text-white'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-brand-soft hover:text-brand-primary'
                  }`}
              >
                <Home className="w-4 h-4 text-brand-primary" />
                <span>Home</span>
              </Link>
              <Link
                href="/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-3 rounded-2xl flex items-center justify-between transition ${pathname === '/orders'
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-soft/80 dark:bg-emerald-950/60 text-brand-primary dark:text-emerald-300 border border-brand-soft dark:border-emerald-900/60'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 text-brand-primary" />
                  <span>Order History</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </Link>
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-brand-soft hover:text-brand-primary flex items-center gap-2"
              >
                <span>🛒 All Products</span>
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-brand-soft hover:text-brand-primary flex items-center gap-2"
              >
                <span>🌱 Farm Direct</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentPincode={currentPincode}
        onSelectPincode={handleSelectPincode}
      />
    </>
  );
}

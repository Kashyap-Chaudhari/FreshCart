'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Grid,
  Tag,
  MapPin,
  Users,
  Settings,
  BarChart3,
  History,
  LogOut,
  Store,
  ShieldCheck,
  ExternalLink,
  Sun,
  Moon,
  Bike,
  CheckCircle2,
  Receipt,
  Bell,
  X,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSocket } from '@/context/SocketContext';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isOwner, isStaff, logout, loading } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { isConnected, activeAlert, dismissAlert } = useSocket();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'OWNER' && user.role !== 'STAFF'))) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs gap-2">
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span>Authenticating administrator credentials...</span>
      </div>
    );
  }

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/orders', label: 'Orders & Dispatch', icon: ShoppingCart },
    { href: '/invoices', label: 'GST Tax Invoices', icon: Receipt },
    { href: '/delivery-management', label: 'Delivery Management', icon: Bike },
    { href: '/inventory', label: 'Inventory & Stock', icon: Boxes },
    { href: '/categories', label: 'Categories', icon: Grid },
    { href: '/coupons', label: 'Coupons & Offers', icon: Tag },
    { href: '/delivery-areas', label: 'Service Areas (Gujarat)', icon: MapPin },
    { href: '/reports', label: 'Sales Reports & Export', icon: BarChart3 },
    // Owner Only Links
    ...(isOwner
      ? [
          { href: '/customers', label: 'Customer Directory', icon: Users, ownerOnly: true },
          { href: '/settings', label: 'Store Settings (GST/Hours)', icon: Settings, ownerOnly: true },
          { href: '/audit-logs', label: 'Security Audit Logs', icon: History, ownerOnly: true },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      {/* Mobile Top Header (Zepto / Blinkit Operations style) */}
      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/20">
            FC
          </div>
          <div>
            <span className="font-extrabold text-slate-900 dark:text-white text-xs block leading-tight">FreshCart Admin</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">{user.name.split(' ')[0]} ({user.role})</span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar (Desktop static, Mobile slide-over drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 flex-shrink-0 transition-transform duration-200 ease-in-out md:static md:w-64 md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20">
                FC
              </div>
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block leading-tight">FreshCart Admin</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">Store Management</span>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-200" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform duration-200" />
                )}
              </button>

              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Open Customer Store in new tab"
              >
                <Store className="w-4 h-4" />
              </a>

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User profile card */}
          <div className="bg-slate-100 dark:bg-slate-950/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-300 dark:border-emerald-800/50">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{user.name}</span>
                <span
                  className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isOwner
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                      : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30'
                  }`}
                >
                  {user.role === 'OWNER' ? 'Store Owner' : 'Operations Staff'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.ownerOnly && (
                    <span className="text-[9px] uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold border border-slate-300 dark:border-slate-700">
                      Owner
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          {/* Quick theme status / switcher in footer */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <div className="flex items-center gap-2">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {theme}
            </span>
          </button>

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Customer Storefront</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          </a>

          <a
            href="http://localhost:3002"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl transition font-medium"
          >
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Delivery Portal (:3002) ↗</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
          </a>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition font-medium text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (Spans full available width with responsive padding) */}
      <main className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950 p-3 sm:p-5 lg:p-8 overflow-y-auto transition-colors duration-200 relative">
        <div className="w-full max-w-[1800px] mx-auto space-y-6">
        {/* Floating Real-Time Order Alert Banner */}
        {activeAlert && (
          <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl p-4 shadow-2xl shadow-emerald-500/20 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {activeAlert.type === 'NEW_ORDER'
                        ? '🔔 New Order Placed!'
                        : activeAlert.type === 'DELIVERY_COMPLETED'
                        ? '✅ Order Delivered!'
                        : activeAlert.type === 'DELIVERY_FAILED'
                        ? '❌ Delivery Attempt Failed'
                        : '⚠️ Cancellation Request'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-200 font-semibold mt-0.5">
                    {activeAlert.message}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Customer: {activeAlert.customerName} ({activeAlert.timestamp})
                  </p>
                </div>
              </div>

              <button
                onClick={dismissAlert}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={dismissAlert}
                className="px-3 py-1.5 rounded-xl text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Dismiss
              </button>
              <Link
                href={`/orders/${activeAlert.orderNumber || activeAlert.id}`}
                onClick={dismissAlert}
                className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
              >
                View Order →
              </Link>
            </div>
          </div>
        )}

        {children}
        </div>
      </main>
    </div>
  );
}

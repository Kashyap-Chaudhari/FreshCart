'use client';

import React, { useEffect } from 'react';
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
  ShieldAlert,
  LogOut,
  Store,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isOwner, isStaff, logout, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/login');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-xs">
        Verifying administrator credentials...
      </div>
    );
  }

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/orders', label: 'Orders & Dispatch', icon: ShoppingCart },
    { href: '/admin/inventory', label: 'Inventory & Stock', icon: Boxes },
    { href: '/admin/categories', label: 'Categories', icon: Grid },
    { href: '/admin/coupons', label: 'Coupons & Offers', icon: Tag },
    { href: '/admin/delivery-areas', label: 'Delivery Areas', icon: MapPin },
    { href: '/admin/reports', label: 'Sales Reports', icon: BarChart3 },
    // Owner Only Links
    ...(isOwner
      ? [
          { href: '/admin/customers', label: 'Customer Accounts', icon: Users, ownerOnly: true },
          { href: '/admin/settings', label: 'Store Settings', icon: Settings, ownerOnly: true },
          { href: '/admin/audit-logs', label: 'Audit Logs', icon: History, ownerOnly: true },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-950 text-gray-300 flex flex-col justify-between p-4 flex-shrink-0 border-r border-gray-800">
        <div className="space-y-6">
          {/* Logo & Store link */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg">
                FC
              </div>
              <div>
                <span className="font-extrabold text-white text-sm block">FreshCart Admin</span>
                <span className="text-[10px] text-gray-400 block">Operations Portal</span>
              </div>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
              title="Open Customer Website"
            >
              <Store className="w-4 h-4" />
            </Link>
          </div>

          {/* User badge */}
          <div className="bg-gray-900 p-3 rounded-2xl border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-800/50">
                {user?.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">{user?.name}</span>
                <span
                  className={`inline-block text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isOwner ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
                  }`}
                >
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1 text-xs">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.ownerOnly && (
                    <span className="text-[9px] uppercase tracking-wider bg-gray-800 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                      Owner
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-gray-800 space-y-2 text-xs">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-2 rounded-xl transition hover:bg-gray-900"
          >
            <Store className="w-4 h-4" />
            <span>Customer Storefront</span>
          </Link>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 px-3 py-2 rounded-xl transition hover:bg-red-950/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}


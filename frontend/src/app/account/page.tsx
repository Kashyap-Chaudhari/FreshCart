'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Settings,
  LogOut,
  Truck,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  X,
  FileText,
  ShieldCheck,
  AlertCircle,
  Home,
  History,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'ADDRESSES' | 'WISHLIST' | 'SETTINGS'>('ORDERS');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Address modal state
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newCity, setNewCity] = useState('Ahmedabad');
  const [newPincode, setNewPincode] = useState('380015');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && activeTab === 'ORDERS') {
      setLoadingOrders(true);
      api
        .getMyOrders()
        .then((res) => {
          if (res.success && res.data) {
            setOrders(res.data);
          }
        })
        .finally(() => setLoadingOrders(false));
    }
  }, [user, activeTab]);

  if (isLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading customer account...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 lg:pb-8 w-full min-w-0">
      {/* Top Breadcrumb & Home Return Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition group shadow-xs"
        >
          <Home className="w-3.5 h-3.5 text-brand-primary group-hover:scale-110 transition-transform" />
          <span>Home</span>
          <span className="text-slate-400">/</span>
          <span className="text-brand-primary dark:text-emerald-400">My Account</span>
        </Link>

        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary dark:text-emerald-400 hover:underline"
        >
          <History className="w-4 h-4" />
          <span>Go to Order History Page →</span>
        </Link>
      </div>

      {/* Top Profile Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-soft text-brand-primary flex items-center justify-center font-black text-2xl shadow-soft">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-black text-brand-text dark:text-white leading-tight">
              {user.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {user.phone ? `+91 ${user.phone}` : ''} {user.email ? `• ${user.email}` : ''}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary dark:text-emerald-400 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified FreshCart Member
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold text-xs hover:bg-rose-100 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button
            type="button"
            onClick={() => setActiveTab('ORDERS')}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-between transition ${
              activeTab === 'ORDERS'
                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Order History</span>
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ADDRESSES')}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-between transition ${
              activeTab === 'ADDRESSES'
                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Saved Delivery Addresses</span>
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WISHLIST')}
            className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-between transition ${
              activeTab === 'WISHLIST'
                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>Favorites & Saved Items</span>
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tab Content */}
        <div className="lg:col-span-3">
          {/* ORDERS TAB */}
          {activeTab === 'ORDERS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-brand-text dark:text-white">
                  Order Fulfillment & History
                </h2>
                <Link
                  href="/orders"
                  className="text-xs font-bold text-brand-primary dark:text-emerald-400 hover:underline"
                >
                  View Full Tracking Page ➔
                </Link>
              </div>

              {loadingOrders ? (
                <div className="py-16 text-center text-xs text-slate-400">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="font-black text-slate-800 dark:text-white text-sm">No Orders Yet</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    You haven&apos;t placed any grocery orders yet. Start shopping fresh items!
                  </p>
                  <Link
                    href="/products"
                    className="inline-block px-5 py-2.5 rounded-2xl bg-brand-primary text-white text-xs font-bold"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                            #{ord.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              ord.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : ord.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(ord.createdAt).toLocaleDateString()} • {ord.items?.length || 0} items
                        </p>
                        <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                          ₹{Number(ord.grandTotal).toFixed(0)} • {ord.paymentMethod} ({ord.paymentStatus})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                          href={`/orders/${ord.id}`}
                          className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-brand-soft text-brand-primary hover:bg-brand-primary hover:text-white dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-xs transition text-center"
                        >
                          Live Track
                        </Link>
                        <a
                          href={api.getInvoiceUrl(ord.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-50"
                          title="Download Tax Invoice"
                        >
                          Invoice
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'ADDRESSES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-brand-text dark:text-white">
                  Saved Delivery Addresses in Gujarat
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(true)}
                  className="px-4 py-2 rounded-2xl bg-brand-primary text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-brand-primary/40 p-5 shadow-card relative">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-brand-soft text-brand-primary text-[10px] font-black uppercase tracking-wider mb-2">
                    Default Delivery Address
                  </span>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    {user.name}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Vastrapur Lake Road, Opp SG Highway, Near AlphaOne Mall, Ahmedabad, Gujarat - 380015
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono block mt-2">
                    Phone: +91 {user.phone || '9876543210'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* WISHLIST TAB */}
          {activeTab === 'WISHLIST' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-3">
              <Heart className="w-12 h-12 text-rose-400 mx-auto" />
              <h3 className="font-black text-slate-800 dark:text-white text-base">Your Wishlist</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Save your favorite everyday groceries, organic vegetables, and fruits for 1-click reordering.
              </p>
              <Link
                href="/products"
                className="inline-block px-5 py-2.5 rounded-2xl bg-brand-primary text-white text-xs font-bold"
              >
                Explore Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


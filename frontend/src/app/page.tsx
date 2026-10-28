'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Clock,
  MapPin,
  Tag,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/customer/ProductCard';

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeResult, setPincodeResult] = useState<any>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  useEffect(() => {
    // Fetch categories
    api.getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });

    // Fetch featured products
    api.getProducts('limit=8').then((res) => {
      if (res.success && res.data) setFeaturedProducts(res.data);
    });

    // Fetch store settings
    api.getStoreSettings().then((res) => {
      if (res.success && res.data) setSettings(res.data);
    });
  }, []);

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeInput || pincodeInput.length !== 6) return;

    setCheckingPincode(true);
    const res = await api.checkPincode(pincodeInput);
    setCheckingPincode(false);

    if (res.success && res.data) {
      setPincodeResult(res.data);
    }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Banner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-600 text-white shadow-xl">
          <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/30 backdrop-blur-md border border-emerald-300/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-100 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              100% Farm Fresh & Daily Essentials
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Fresh Groceries Delivered in <span className="text-amber-300">2 Hours</span>
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Order fresh fruits, vegetables, dairy, atta, rice and snacks at wholesale prices. Pay via Cash on Delivery at your doorstep.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/products"
                className="bg-amber-400 hover:bg-amber-300 text-gray-900 font-extrabold px-6 py-3 rounded-xl text-sm transition shadow-lg flex items-center gap-2"
              >
                <span>Shop All Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-xs text-emerald-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-300" />
                <span>Use code <strong>FRESH15</strong> for 15% OFF</span>
              </div>
            </div>
          </div>

          {/* Decorative background overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none hidden md:block" />
        </div>
      </section>

      {/* Pincode Serviceability Check Widget */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Check Express Delivery in Your Area</h3>
              <p className="text-xs text-gray-500">
                Enter your 6-digit postal PIN code to check serviceability and delivery slots.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter PIN (e.g. 560034)"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                className="w-48 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={checkingPincode || pincodeInput.length !== 6}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                {checkingPincode ? 'Checking...' : 'Check'}
              </button>
            </form>

            {pincodeResult && (
              <div className="mt-2 text-xs">
                {pincodeResult.isDeliverable ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Delivering to {pincodeResult.areaName}! (Express in {pincodeResult.estimatedHours || 2} hrs, Delivery ₹{pincodeResult.deliveryCharge})
                  </span>
                ) : (
                  <span className="text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {pincodeResult.message}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Explore by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Shop by Category</h2>
            <p className="text-xs text-gray-500 mt-0.5">Explore freshly stocked sections</p>
          </div>
          <Link
            href="/products"
            className="text-emerald-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-50 mb-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className="text-xs font-bold text-gray-800 group-hover:text-emerald-700 transition-colors line-clamp-2">
                {cat.name}
              </h3>
              <span className="text-[10px] text-gray-400 mt-1">
                {cat._count?.products || 0} items
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Groceries & Best Deals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Today&apos;s Best Deals</h2>
            <p className="text-xs text-gray-500 mt-0.5">Handpicked farm-fresh items and daily essentials</p>
          </div>
          <Link
            href="/products"
            className="text-emerald-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-1"
          >
            <span>See More</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Trust & Store Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-12 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-amber-300 mx-auto md:mx-0">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base">Store Timings & Hours</h4>
              <p className="text-xs text-emerald-200 leading-relaxed">
                Open 7 days a week from 7:00 AM to 10:00 PM. Instant customer support and order dispatch.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-amber-300 mx-auto md:mx-0">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base">Hygienic Temperature Controlled</h4>
              <p className="text-xs text-emerald-200 leading-relaxed">
                Vegetables and dairy stored at optimum temperatures to guarantee freshness at delivery.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-amber-300 mx-auto md:mx-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base">Accurate GST Tax Invoices</h4>
              <p className="text-xs text-emerald-200 leading-relaxed">
                Sequential tax invoice with store GSTIN provided for every order. Download anytime.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

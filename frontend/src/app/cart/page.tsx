'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowRight,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShieldCheck,
  Tag,
  Check,
  AlertCircle,
  Zap,
  Lock,
  Home,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const freeDeliveryThreshold = 499;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery || subtotal === 0 ? 0 : 29;
  const handlingFee = subtotal > 0 ? 4 : 0;
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee + handlingFee);

  const amountNeeded = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  const totalMrp = items.reduce(
    (acc, it) => acc + (it.product.mrp ? Number(it.product.mrp) : Number(it.product.price)) * it.quantity,
    0
  );
  const totalSavings = Math.max(0, totalMrp - subtotal + discountAmount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const res = await api.validateCoupon(couponCode.trim(), subtotal);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
      } else {
        setCouponError(res.message || 'Invalid or expired coupon code.');
      }
    } catch {
      setCouponError('Error validating coupon. Please try again.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-brand-soft text-brand-primary flex items-center justify-center mx-auto shadow-soft">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-brand-text dark:text-white">Your Basket is Empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          You haven&apos;t added any groceries to your cart yet. Browse our catalogue for fresh produce and staples.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs px-6 py-3 rounded-2xl transition shadow-md shadow-brand-primary/20"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs px-6 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <span>Start Shopping Now</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-6 space-y-6 pb-32 lg:pb-6 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-text dark:text-white tracking-tight">
            My Grocery Basket
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{totalItems} fresh items in your cart</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-slate-600 dark:text-slate-300 hover:text-brand-primary text-xs font-bold flex items-center gap-1.5"
          >
            <Home className="w-4 h-4 text-brand-primary" />
            <span>Home</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <Link
            href="/products"
            className="text-brand-primary dark:text-emerald-400 hover:underline text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* Free Delivery Bar */}
      <div className="bg-brand-soft/80 dark:bg-emerald-950/40 p-4 rounded-3xl border border-brand-soft dark:border-emerald-900/50">
        <div className="flex justify-between items-center text-xs font-bold text-brand-deep dark:text-emerald-300 mb-1.5">
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 fill-brand-primary" />
            {isFreeDelivery
              ? '🎉 Congratulations! You unlocked FREE 10-15 Min Delivery'
              : `Add ₹${amountNeeded} more to unlock FREE Delivery!`}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/60 rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-card divide-y divide-slate-100 dark:divide-slate-800">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-secondary dark:bg-slate-800 p-1 flex-shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ShoppingBag className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${product.slug}`}
                  className="font-bold text-sm text-slate-900 dark:text-white hover:text-brand-primary transition-colors block truncate"
                >
                  {product.name}
                </Link>
                <span className="text-xs text-slate-400 font-semibold block mt-0.5">{product.unit}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono font-black text-xs text-brand-text dark:text-white">
                    ₹{Number(product.price).toFixed(0)}
                  </span>
                  {product.mrp && Number(product.mrp) > Number(product.price) && (
                    <span className="text-[10px] text-slate-400 line-through font-mono">
                      ₹{Number(product.mrp).toFixed(0)}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity buttons */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded-xl bg-brand-primary text-white text-xs font-bold shadow-xs">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="px-2.5 py-1.5 hover:bg-black/15 transition"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <span className="px-2 font-mono font-black text-xs">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    disabled={quantity >= product.stockQty}
                    className="px-2.5 py-1.5 hover:bg-black/15 transition disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(product.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bill Summary Column */}
        <div className="space-y-4">
          {/* Coupon Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-card space-y-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-primary" />
              Coupons & Offers
            </h3>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter Code (e.g. FRESH15)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold tracking-wider placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
              <button
                type="submit"
                disabled={validatingCoupon || !couponCode}
                className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs transition disabled:opacity-50"
              >
                {validatingCoupon ? 'Checking...' : 'Apply'}
              </button>
            </form>

            {appliedCoupon && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex justify-between items-center">
                <span className="font-bold">
                  Code "{appliedCoupon.code}" applied: Saved ₹{appliedCoupon.discountAmount}!
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode('');
                  }}
                  className="text-slate-400 hover:text-rose-500"
                >
                  Remove
                </button>
              </div>
            )}

            {couponError && (
              <p className="text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{couponError}</span>
              </p>
            )}
          </div>

          {/* Bill Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-card space-y-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Bill Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{subtotal.toFixed(0)}</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-brand-primary dark:text-emerald-400 font-bold">
                  <span>Total Discount Savings</span>
                  <span className="font-mono">- ₹{totalSavings.toFixed(0)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Delivery Partner Fee</span>
                <span className="font-mono font-bold">
                  {deliveryFee === 0 ? (
                    <strong className="text-brand-primary dark:text-emerald-400">FREE</strong>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Handling Fee</span>
                <span className="font-mono font-bold">₹{handlingFee}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center font-black text-sm text-slate-900 dark:text-white">
                <span>Grand Total</span>
                <span className="font-mono text-lg text-brand-primary dark:text-emerald-400">
                  ₹{grandTotal.toFixed(0)}
                </span>
              </div>
            </div>

            {!user && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl p-2.5 text-xs text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-2 mt-2">
                <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Customer login required to place & confirm order</span>
              </div>
            )}

            <Link
              href="/checkout"
              className="w-full py-3.5 px-4 rounded-2xl bg-brand-primary hover:bg-brand-deep text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/25 transition active:scale-98 mt-3"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-2 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
              <span>100% Safe & Secure Checkout with Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Checkout Bar */}
      <div className="lg:hidden fixed bottom-[56px] left-0 right-0 z-30 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-xl flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-slate-400 truncate">Total ({totalItems} items)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black text-slate-900 dark:text-white font-mono">
              ₹{grandTotal.toFixed(0)}
            </span>
            {totalSavings > 0 && (
              <span className="text-[10px] font-bold text-brand-primary dark:text-emerald-400 bg-brand-soft dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md truncate">
                Save ₹{totalSavings.toFixed(0)}
              </span>
            )}
          </div>
        </div>

        <Link
          href="/checkout"
          className="flex-1 max-w-[200px] py-3 px-4 rounded-2xl bg-brand-primary hover:bg-brand-deep text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/25 transition active:scale-98"
        >
          <span>Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

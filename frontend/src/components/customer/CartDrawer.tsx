'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Tag,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  if (!isCartOpen) return null;

  const freeDeliveryThreshold = 499;
  const deliveryFee = subtotal >= freeDeliveryThreshold || subtotal === 0 ? 0 : 29;
  const handlingFee = subtotal > 0 ? 4 : 0;
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee + handlingFee);

  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  // Total savings on MRP
  const totalMrp = items.reduce((acc, it) => acc + (it.product.mrp ? Number(it.product.mrp) : Number(it.product.price)) * it.quantity, 0);
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 text-brand-text dark:text-slate-100 shadow-2xl flex flex-col transition-colors">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-soft text-brand-primary flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 dark:text-white text-sm leading-none">
                  My Grocery Basket
                </h2>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                  ⚡ 10-15 Mins Superfast Delivery
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-brand-soft text-brand-primary dark:bg-emerald-950/80 dark:text-emerald-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-brand-soft dark:border-emerald-900">
                {totalItems} items
              </span>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Free Delivery Tracker Meter */}
          {items.length > 0 && (
            <div className="bg-brand-soft/70 dark:bg-emerald-950/40 px-5 py-3 border-b border-brand-soft dark:border-emerald-900/50">
              <div className="flex justify-between items-center text-xs font-bold text-brand-deep dark:text-emerald-300 mb-1.5">
                <span>
                  {amountNeededForFreeDelivery === 0
                    ? '🎉 You unlocked FREE Delivery!'
                    : `Add ₹${amountNeededForFreeDelivery} more for FREE delivery`}
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
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {items.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-3xl bg-brand-soft text-brand-primary flex items-center justify-center mb-4 shadow-soft">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="font-black text-slate-800 dark:text-white text-base">Your basket is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-6">
                  Explore fresh farm produce, dairy, bakery, and daily essentials delivered in 10-15 minutes!
                </p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-2xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs shadow-md shadow-brand-primary/20 transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((it) => (
                <div
                  key={it.product.id}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3 transition"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 p-1 flex-shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                    {it.product.images && it.product.images[0] ? (
                      <img
                        src={it.product.images[0]}
                        alt={it.product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white text-xs block truncate">
                      {it.product.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium block">
                      {it.product.unit}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 font-mono">
                      <span className="font-black text-xs text-brand-text dark:text-white">
                        ₹{Number(it.product.price).toFixed(0)}
                      </span>
                      {it.product.mrp && Number(it.product.mrp) > Number(it.product.price) && (
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{Number(it.product.mrp).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="inline-flex items-center rounded-xl bg-brand-primary text-white text-xs font-bold shadow-xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(it.product.id, it.quantity - 1)}
                      className="px-2 py-1 hover:bg-black/15 transition"
                      aria-label="Decrease"
                    >
                      <Minus className="w-3 h-3 stroke-[3]" />
                    </button>
                    <span className="px-1.5 font-mono font-black text-xs">{it.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(it.product.id, it.quantity + 1)}
                      disabled={it.quantity >= it.product.stockQty}
                      className="px-2 py-1 hover:bg-black/15 transition disabled:opacity-50"
                      aria-label="Increase"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bill & Checkout */}
          {items.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 space-y-4">
              {/* Coupon Section */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-brand-primary absolute left-3 top-3" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon (e.g. FRESH15)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold tracking-wider placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponCode}
                  className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {validatingCoupon ? 'Applying...' : 'Apply'}
                </button>
              </form>

              {appliedCoupon && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex justify-between items-center">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coupon "{appliedCoupon.code}" applied: Saved ₹{appliedCoupon.discountAmount}!</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                    }}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{couponError}</span>
                </p>
              )}

              {/* Bill Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Item Total (Subtotal)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">₹{subtotal.toFixed(0)}</span>
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
                  <span>Handling & Packaging Fee</span>
                  <span className="font-mono font-bold">₹{handlingFee}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-black text-sm text-slate-900 dark:text-white">
                  <span>To Pay</span>
                  <span className="font-mono text-base text-brand-primary dark:text-emerald-400">
                    ₹{grandTotal.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Sticky Proceed Button */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-primary hover:bg-brand-deep text-white font-black text-xs flex items-center justify-between shadow-lg shadow-brand-primary/25 transition active:scale-98"
              >
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[10px] opacity-90 font-bold uppercase tracking-wider">{totalItems} items</span>
                  <span className="text-sm font-black font-mono">₹{grandTotal.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

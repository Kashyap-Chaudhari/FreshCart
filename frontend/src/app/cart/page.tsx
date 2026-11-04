'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Tag,
  Check,
  AlertCircle,
  Zap,
  ShieldCheck,
  Clock,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Percent,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface AdminCoupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number | null;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, addToCart, subtotal, totalItems } = useCart();
  const { user } = useAuth();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AdminCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);

  // Delivery instruction note
  const [showOrderNote, setShowOrderNote] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  // Recommended products
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Free delivery calculations
  const freeDeliveryThreshold = 499;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery || subtotal === 0 ? 0 : 29;
  const handlingFee = subtotal > 0 ? 4 : 0;
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee + handlingFee);

  const amountNeeded = Math.max(0, freeDeliveryThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  // MRP & Total Savings calculations
  const totalMrp = items.reduce(
    (acc, it) => acc + (it.product.mrp ? Number(it.product.mrp) : Number(it.product.price)) * it.quantity,
    0
  );
  const mrpSavings = Math.max(0, totalMrp - subtotal);
  const totalSavings = mrpSavings + discountAmount;

  // Load active coupons managed by Admin Panel
  const fetchActiveCoupons = () => {
    setLoadingCoupons(true);
    api
      .getActiveCoupons()
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAvailableCoupons(res.data);
        } else {
          // Default initial fallback
          setAvailableCoupons([
            {
              id: 'coup-1',
              code: 'FRESH15',
              description: 'Get 15% OFF on minimum order of ₹399',
              discountType: 'PERCENTAGE',
              discountValue: 15,
              minOrderValue: 399,
              maxDiscount: 150,
            },
            {
              id: 'coup-2',
              code: 'FLAT50',
              description: 'Flat ₹50 OFF on orders above ₹299',
              discountType: 'FLAT',
              discountValue: 50,
              minOrderValue: 299,
              maxDiscount: null,
            },
            {
              id: 'coup-3',
              code: 'WELCOME50',
              description: 'Flat ₹50 OFF on your first cart above ₹199',
              discountType: 'FLAT',
              discountValue: 50,
              minOrderValue: 199,
              maxDiscount: null,
            },
          ]);
        }
      })
      .catch(() => {
        setAvailableCoupons([
          {
            id: 'coup-1',
            code: 'FRESH15',
            description: 'Get 15% OFF on minimum order of ₹399',
            discountType: 'PERCENTAGE',
            discountValue: 15,
            minOrderValue: 399,
            maxDiscount: 150,
          },
          {
            id: 'coup-2',
            code: 'FLAT50',
            description: 'Flat ₹50 OFF on orders above ₹299',
            discountType: 'FLAT',
            discountValue: 50,
            minOrderValue: 299,
            maxDiscount: null,
          },
        ]);
      })
      .finally(() => {
        setLoadingCoupons(false);
      });
  };

  useEffect(() => {
    fetchActiveCoupons();
  }, []);

  // Re-validate coupon if cart subtotal drops below coupon minimum
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.minOrderValue && subtotal < appliedCoupon.minOrderValue) {
      setCouponError(`Coupon "${appliedCoupon.code}" was removed because cart subtotal is now below ₹${appliedCoupon.minOrderValue}.`);
      setAppliedCoupon(null);
      setCouponSuccess('');
    }
  }, [subtotal, appliedCoupon]);

  // Load recommended products
  useEffect(() => {
    let isMounted = true;
    setLoadingRecs(true);
    api
      .getProducts('limit=12')
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          const cartIds = new Set(items.map((i) => i.product.id));
          const available = res.data.filter((p: any) => !cartIds.has(p.id) && p.isAvailable && p.stockQty > 0);
          setRecommended(available.slice(0, 4));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingRecs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [items]);

  // Apply Coupon
  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCode).trim().toUpperCase();
    if (!targetCode) return;

    setValidatingCoupon(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await api.validateCoupon(targetCode, subtotal);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        setCouponCode(targetCode);
        setCouponSuccess(`✓ Coupon "${targetCode}" applied! You saved ₹${Number(res.data.discountAmount || 0).toFixed(0)}`);
      } else {
        setCouponError(res.message || 'Invalid or expired coupon code for this cart total.');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Unable to validate coupon. Please check your connection.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    setCouponSuccess('');
  };

  // =========================================================================
  // 🧺 EMPTY CART STATE
  // =========================================================================
  if (items.length === 0) {
    return (
      <div className="min-h-[82vh] bg-[#F7F6F2] py-12 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-[#EAE8E2] p-8 sm:p-12 text-center shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-6">
          {/* Custom FreshCart Grocery Basket Illustration */}
          <div className="relative w-32 h-32 mx-auto">
            <div className="w-32 h-32 rounded-3xl bg-[#F7F6F2] border border-[#EAE8E2] flex items-center justify-center shadow-inner">
              <svg
                viewBox="0 0 120 120"
                className="w-20 h-20 text-[#176B36]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Woven Basket Body */}
                <path
                  d="M24 48H96L88 100H32L24 48Z"
                  fill="#EFECE5"
                  stroke="#176B36"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                {/* Basket Rim */}
                <rect x="20" y="42" width="80" height="9" rx="4.5" fill="#176B36" />
                {/* Basket Handle */}
                <path
                  d="M38 42C38 22 82 22 82 42"
                  stroke="#176B36"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Fresh Produce Peeking Out */}
                <circle cx="50" cy="38" r="11" fill="#35A853" />
                <circle cx="70" cy="36" r="10" fill="#E65100" />
                <path
                  d="M50 25C54 22 58 24 58 28C54 28 50 27 50 25Z"
                  fill="#176B36"
                />
                {/* Subtle shine mark */}
                <path
                  d="M36 58L42 90"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#176B36] text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#252525] tracking-tight">
              Your Basket is Empty
            </h1>
            <p className="text-xs sm:text-sm text-[#858585] max-w-sm mx-auto leading-relaxed">
              Looks like you haven&apos;t added any groceries yet. Explore farm-fresh produce, dairy, bakery, and daily staples delivered in 10-15 minutes.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-[#EAE8E2] text-xs font-bold text-[#252525] bg-white hover:bg-[#F7F6F2] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#176B36] hover:bg-[#12552b] text-white text-xs font-black tracking-wide shadow-md shadow-[#176B36]/20 transition active:scale-98"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Start Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 🛒 POPULATED CART LAYOUT (PREMIUM TWO-COLUMN INTERFACE)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F7F6F2] py-6 sm:py-8 pb-32 lg:pb-12 text-[#252525]">
      <div className="max-w-[1400px] mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6">
        {/* Top Announcement Bar */}
        <div className="bg-white rounded-xl border border-[#EAE8E2] px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#252525]">
            <span className="w-6 h-6 rounded-full bg-[#176B36]/10 text-[#176B36] flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 fill-[#176B36]" />
            </span>
            <span>
              Express <strong>10–15 Min Delivery</strong> to your doorstep in Gujarat
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#858585] hidden sm:inline">Prices inclusive of all taxes</span>
            <span className="text-[#EAE8E2] hidden sm:inline">|</span>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 font-bold text-[#176B36] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MAIN TWO-COLUMN SPLIT: 64% LEFT BASKET | 36% RIGHT ORDER SUMMARY       */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ================================================================= */}
          {/* 1. LEFT SECTION – SHOPPING CART (lg:col-span-8 ≈ 64% width)        */}
          {/* ================================================================= */}
          <section className="lg:col-span-8 space-y-5">
            {/* Basket Card */}
            <div className="bg-white rounded-2xl border border-[#EAE8E2] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
              {/* Header */}
              <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-[#EAE8E2] flex flex-wrap items-center justify-between gap-2 bg-[#FCFBF9]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#252525]">
                      YOUR BASKET
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#176B36] text-white text-[11px] font-black">
                      {totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#858585] mt-1 font-medium">
                    ⚡ Items reserved for 15 minutes • Guaranteed fresh dispatch
                  </p>
                </div>

                <Link
                  href="/products"
                  className="text-xs font-bold text-[#176B36] hover:text-[#12552b] hover:underline flex items-center gap-1 transition"
                >
                  <span>+ Add More Items</span>
                </Link>
              </div>

              {/* Free Delivery Progress Meter Banner Inside Cart */}
              <div className="px-5 sm:px-7 py-3.5 bg-[#FAF9F5] border-b border-[#EAE8E2]">
                <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                  <span className="flex items-center gap-1.5 text-[#176B36]">
                    <Sparkles className="w-3.5 h-3.5 text-[#176B36]" />
                    {isFreeDelivery ? (
                      <span className="text-[#176B36] font-extrabold">
                        🎉 You have unlocked FREE Express Delivery!
                      </span>
                    ) : (
                      <span>
                        Add <strong>₹{amountNeeded.toFixed(0)}</strong> more to unlock <strong>FREE Delivery</strong>!
                      </span>
                    )}
                  </span>
                  <span className="text-[#858585] font-mono text-[11px]">{progressPercent}%</span>
                </div>
                <div className="w-full bg-[#EAE8E2] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#176B36] h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Product Rows List */}
              <div className="divide-y divide-[#EAE8E2]">
                {items.map(({ product, quantity }) => {
                  const mrp = product.mrp ? Number(product.mrp) : Number(product.price);
                  const price = Number(product.price);
                  const hasDiscount = mrp > price;
                  const discountPct = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;
                  const itemSavings = hasDiscount ? (mrp - price) * quantity : 0;
                  const itemTotal = price * quantity;
                  const brand =
                    (product as any).brand ||
                    (product as any).description?.match(/by\s+([^.]+)\./)?.[1]?.trim() ||
                    product.name.split(' ')[0];
                  const sku = product.sku || `FC-${product.id.slice(-6).toUpperCase()}`;

                  return (
                    <div
                      key={product.id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#FAF9F6] transition-colors duration-150 group"
                    >
                      {/* Left: Product Image & Details */}
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        {/* Large Square Product Thumbnail */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#F7F6F2] border border-[#EAE8E2] p-2 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              loading="lazy"
                            />
                          ) : (
                            <ShoppingBag className="w-8 h-8 text-[#858585]/40" />
                          )}
                          {discountPct > 0 && (
                            <span className="absolute top-1 left-1 bg-[#176B36] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                              {discountPct}% OFF
                            </span>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="min-w-0 flex-1 space-y-1">
                          {/* Brand & SKU Badge */}
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-extrabold text-[#176B36]">
                            <span>{brand}</span>
                            <span className="text-[#858585]">•</span>
                            <span className="text-[#858585] font-mono font-medium">{sku}</span>
                          </div>

                          {/* Product Title */}
                          <Link
                            href={`/products/${product.slug}`}
                            className="text-xs sm:text-sm font-bold text-[#252525] hover:text-[#176B36] transition-colors line-clamp-2 leading-snug"
                          >
                            {product.name}
                          </Link>

                          {/* Pack Size / Variant */}
                          <div className="flex items-center gap-2 pt-0.5 text-xs text-[#858585]">
                            <span className="px-2 py-0.5 rounded bg-[#F7F6F2] border border-[#EAE8E2] text-[11px] font-semibold text-[#252525]">
                              {product.unit}
                            </span>
                            {product.stockQty <= 5 && product.stockQty > 0 ? (
                              <span className="text-amber-700 text-[11px] font-bold">
                                Only {product.stockQty} left
                              </span>
                            ) : (
                              <span className="text-[#176B36] text-[11px] font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" /> In Stock
                              </span>
                            )}
                          </div>

                          {/* Savings Tag */}
                          {itemSavings > 0 && (
                            <div className="text-[11px] font-bold text-[#176B36]">
                              Saved ₹{itemSavings.toFixed(0)} on this item
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Quantity Selector & Pricing */}
                      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EAE8E2]">
                        {/* Custom Quantity Controller (- 1 +) */}
                        <div className="flex items-center gap-1.5">
                          <div className="inline-flex items-center rounded-lg border border-[#EAE8E2] bg-white text-[#252525] shadow-xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#F7F6F2] text-[#252525] transition active:scale-90"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                            <span className="w-8 text-center font-mono font-bold text-xs select-none">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              disabled={quantity >= product.stockQty}
                              className="w-8 h-8 flex items-center justify-center hover:bg-[#F7F6F2] text-[#252525] transition active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                          </div>

                          {/* Trash / Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            className="p-2 text-[#858585] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Remove item"
                            aria-label="Remove item from basket"
                          >
                            <Trash2 className="w-4 h-4 stroke-[2]" />
                          </button>
                        </div>

                        {/* Price Breakdown */}
                        <div className="text-right min-w-[80px]">
                          <div className="text-sm sm:text-base font-black text-[#252525] font-mono">
                            ₹{itemTotal.toFixed(0)}
                          </div>
                          {hasDiscount && (
                            <div className="text-[11px] text-[#858585] line-through font-mono">
                              ₹{(mrp * quantity).toFixed(0)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expandable Delivery Instruction / Order Note */}
            <div className="bg-white rounded-2xl border border-[#EAE8E2] p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <button
                type="button"
                onClick={() => setShowOrderNote(!showOrderNote)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#F7F6F2] text-[#176B36] flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-[#252525]">
                      Add Delivery Instructions or Note
                    </h3>
                    <p className="text-[11px] text-[#858585]">
                      e.g., &quot;Ring doorbell&quot;, &quot;Leave with security guard&quot;, &quot;Call before arriving&quot;
                    </p>
                  </div>
                </div>
                {showOrderNote ? (
                  <ChevronUp className="w-4 h-4 text-[#858585]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#858585]" />
                )}
              </button>

              {showOrderNote && (
                <div className="mt-3 pt-3 border-t border-[#EAE8E2]">
                  <textarea
                    rows={2}
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Enter instructions for the delivery partner..."
                    className="w-full p-3 rounded-xl bg-[#F7F6F2] border border-[#EAE8E2] text-xs font-medium text-[#252525] placeholder:text-[#858585] focus:outline-none focus:ring-1 focus:ring-[#176B36]"
                  />
                  <div className="flex justify-end mt-1.5">
                    <span className="text-[10px] text-[#858585]">Note will be shared with the rider</span>
                  </div>
                </div>
              )}
            </div>

            {/* Recommended Products Carousel ("You might also need") */}
            {recommended.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#EAE8E2] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#176B36]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#252525]">
                      YOU MIGHT ALSO NEED
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#858585]">Instant 1-Click Add</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {recommended.map((prod) => (
                    <div
                      key={prod.id}
                      className="rounded-xl border border-[#EAE8E2] p-2.5 bg-[#FAF9F6] flex flex-col justify-between hover:border-[#176B36]/60 transition group"
                    >
                      <div className="w-full aspect-square rounded-lg bg-white border border-[#EAE8E2] p-1.5 mb-2 overflow-hidden flex items-center justify-center">
                        {prod.images && prod.images[0] ? (
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-[#858585]/40" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#858585] block truncate">
                          {prod.unit}
                        </span>
                        <h4 className="text-xs font-bold text-[#252525] line-clamp-2 leading-tight">
                          {prod.name}
                        </h4>
                      </div>
                      <div className="pt-2 flex items-center justify-between gap-1 mt-auto">
                        <span className="text-xs font-black font-mono text-[#252525]">
                          ₹{Number(prod.price).toFixed(0)}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(prod, 1)}
                          className="px-2.5 py-1 rounded-lg bg-[#176B36] hover:bg-[#12552b] text-white text-[11px] font-extrabold shadow-xs transition active:scale-95 flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>ADD</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ================================================================= */}
          {/* 2. RIGHT SECTION – SMART ORDER DASHBOARD (lg:col-span-4 ≈ 36%)     */}
          {/* ================================================================= */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            {/* Main Order Summary Card */}
            <div className="bg-white rounded-2xl border border-[#EAE8E2] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
              <div className="pb-3 border-b border-[#EAE8E2] flex items-center justify-between">
                <h3 className="text-xs font-black tracking-wider uppercase text-[#252525]">
                  ORDER SUMMARY
                </h3>
                <span className="text-[11px] font-semibold text-[#858585]">
                  {totalItems} items
                </span>
              </div>

              {/* Dynamic Savings Highlight Banner */}
              {totalSavings > 0 && (
                <div className="p-3 rounded-xl bg-[#EAF5EE] border border-[#C6E6D1] text-[#176B36] text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#176B36]" />
                  <span>
                    🎉 You are saving <strong>₹{totalSavings.toFixed(0)}</strong> on this order!
                  </span>
                </div>
              )}

              {/* Coupon Application Box */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#252525]">
                  Have a Coupon?
                </label>

                {!appliedCoupon ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleApplyCoupon();
                    }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-[#858585] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="ENTER COUPON CODE"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F6F2] border border-[#EAE8E2] text-xs font-bold text-[#252525] tracking-wider placeholder:text-[#858585] focus:outline-none focus:ring-1 focus:ring-[#176B36]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="px-4 py-2 rounded-xl bg-[#176B36] hover:bg-[#12552b] text-white text-xs font-bold transition disabled:opacity-50"
                    >
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </form>
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#EAF5EE] border border-[#C6E6D1] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[#176B36]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Code &quot;{appliedCoupon.code}&quot; applied</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Validation Feedback Messages */}
                {couponError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{couponError}</span>
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-xs text-[#176B36] flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{couponSuccess}</span>
                  </p>
                )}

                {/* Available Coupon Chips / Suggestions (Managed via Admin Panel) */}
                <div className="space-y-2 pt-2 border-t border-[#EAE8E2]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-[#252525] uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#176B36]" />
                      <span>Available Coupons & Offers</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#858585] bg-[#F7F6F2] px-2 py-0.5 rounded-full border border-[#EAE8E2]">
                      {availableCoupons.length} {availableCoupons.length === 1 ? 'Offer' : 'Offers'}
                    </span>
                  </div>

                  {loadingCoupons ? (
                    <div className="space-y-2 py-2">
                      <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                      <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                    </div>
                  ) : availableCoupons.length === 0 ? (
                    <div className="p-3 rounded-xl bg-[#FAF9F5] border border-dashed border-[#EAE8E2] text-center text-xs text-[#858585]">
                      No active promo coupons at the moment.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-0.5">
                      {availableCoupons.map((c) => {
                        const isApplied = appliedCoupon?.code === c.code;
                        const isEligible = subtotal >= Number(c.minOrderValue || 0);
                        const discountBadge =
                          c.discountType === 'PERCENTAGE'
                            ? `${Number(c.discountValue)}% OFF${c.maxDiscount ? ` (up to ₹${c.maxDiscount})` : ''}`
                            : `FLAT ₹${Number(c.discountValue)} OFF`;
                        const shortDesc =
                          c.description ||
                          (c.discountType === 'PERCENTAGE'
                            ? `Save ${c.discountValue}% on your order`
                            : `Instant ₹${c.discountValue} discount`);
                        const neededToUnlock = Math.max(0, Number(c.minOrderValue || 0) - subtotal);
                        const progress =
                          c.minOrderValue > 0
                            ? Math.min(100, Math.round((subtotal / Number(c.minOrderValue)) * 100))
                            : 100;

                        return (
                          <div
                            key={c.id || c.code}
                            className={`p-2.5 rounded-xl border transition-all duration-150 relative ${
                              isApplied
                                ? 'bg-[#EAF5EE] border-[#176B36] shadow-xs'
                                : isEligible
                                ? 'bg-[#FAF9F5] hover:bg-[#F2F8F4] border-[#EAE8E2] hover:border-[#176B36]/60'
                                : 'bg-white/80 border-[#EAE8E2] opacity-80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-black text-[#176B36] text-[11px] bg-white border border-dashed border-[#176B36]/50 px-2 py-0.5 rounded shadow-2xs">
                                    {c.code}
                                  </span>
                                  <span className="text-[11px] font-bold text-[#176B36] bg-emerald-50 px-1.5 py-0.5 rounded">
                                    {discountBadge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#252525] font-semibold leading-snug line-clamp-2">
                                  {shortDesc}
                                </p>
                                <div className="text-[10px] text-[#858585]">
                                  {Number(c.minOrderValue) > 0 ? (
                                    <span>
                                      Valid on orders above <strong>₹{Number(c.minOrderValue)}</strong>
                                    </span>
                                  ) : (
                                    <span>No minimum order required</span>
                                  )}
                                </div>
                              </div>

                              {/* Action Button */}
                              <div className="flex-shrink-0 text-right">
                                {isApplied ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-[#176B36] text-white text-[10px] font-bold uppercase tracking-wider">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      Applied
                                    </span>
                                    <button
                                      type="button"
                                      onClick={handleRemoveCoupon}
                                      className="block w-full text-[10px] text-rose-600 font-bold hover:underline"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : isEligible ? (
                                  <button
                                    type="button"
                                    disabled={validatingCoupon}
                                    onClick={() => {
                                      setCouponCode(c.code);
                                      handleApplyCoupon(c.code);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-[#176B36] hover:bg-[#12552b] active:scale-95 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50"
                                  >
                                    {validatingCoupon && couponCode === c.code ? 'Applying...' : 'Apply'}
                                  </button>
                                ) : (
                                  <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-bold">
                                    Locked
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Unlock Progress when Cart Total < Minimum Order */}
                            {!isEligible && Number(c.minOrderValue) > 0 && (
                              <div className="mt-2 pt-2 border-t border-dashed border-[#EAE8E2] space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-[#858585]">
                                    Add <strong>₹{neededToUnlock.toFixed(0)}</strong> more to unlock
                                  </span>
                                  <span className="font-bold text-[#176B36]">{progress}%</span>
                                </div>
                                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#176B36] transition-all duration-300 rounded-full"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-[#EAE8E2] space-y-2.5 text-xs">
                <div className="flex justify-between text-[#858585]">
                  <span>Item Total (Subtotal)</span>
                  <span className="font-mono font-bold text-[#252525]">₹{subtotal.toFixed(0)}</span>
                </div>

                {mrpSavings > 0 && (
                  <div className="flex justify-between text-[#176B36] font-bold">
                    <span>Product Discount (MRP Savings)</span>
                    <span className="font-mono">- ₹{mrpSavings.toFixed(0)}</span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="flex justify-between text-[#176B36] font-bold">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span className="font-mono">- ₹{discountAmount.toFixed(0)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#858585]">
                  <span>Delivery Charges</span>
                  <span className="font-mono font-bold">
                    {deliveryFee === 0 ? (
                      <span className="text-[#176B36]">FREE</span>
                    ) : (
                      <span className="text-[#252525]">₹{deliveryFee}</span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-[#858585]">
                  <span>Handling & Packaging Fee</span>
                  <span className="font-mono font-bold text-[#252525]">₹{handlingFee}</span>
                </div>

                <div className="flex justify-between text-[#858585] text-[11px]">
                  <span>Applicable GST / Taxes</span>
                  <span className="font-semibold text-[#176B36]">Included in item prices</span>
                </div>

                {/* Final Payable Amount */}
                <div className="pt-3 border-t border-[#EAE8E2] flex justify-between items-center">
                  <div>
                    <span className="text-xs font-black uppercase text-[#252525] block">
                      To Pay
                    </span>
                    <span className="text-[10px] text-[#858585]">Inclusive of all charges</span>
                  </div>
                  <span className="font-mono text-xl font-black text-[#176B36]">
                    ₹{grandTotal.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Authentication Notice if Guest */}
              {!user && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Quick OTP or Password login on next step</span>
                </div>
              )}

              {/* Large Checkout Button */}
              <Link
                href="/checkout"
                className="w-full py-4 rounded-xl bg-[#176B36] hover:bg-[#12552b] text-white font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-md shadow-[#176B36]/25 transition active:scale-98"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Security & Payment Badges */}
              <div className="space-y-1.5 pt-1 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#858585]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#176B36]" />
                  <span>100% Safe & Secure Checkout</span>
                </div>
                <div className="text-[10px] text-[#858585]">
                  Cash on Delivery • UPI • Cards Accepted
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📱 MOBILE STICKY CHECKOUT BAR (Visible on mobile screens)                  */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE8E2] px-4 py-3 shadow-xl flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-[#252525] font-mono">
              ₹{grandTotal.toFixed(0)}
            </span>
            {totalSavings > 0 && (
              <span className="text-[10px] font-bold text-[#176B36] bg-[#EAF5EE] px-1.5 py-0.5 rounded truncate">
                Saved ₹{totalSavings.toFixed(0)}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-[#858585] truncate">
            {totalItems} items • Incl. all taxes
          </span>
        </div>

        <Link
          href="/checkout"
          className="flex-1 max-w-[210px] py-3.5 px-4 rounded-xl bg-[#176B36] hover:bg-[#12552b] text-white font-black text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-md shadow-[#176B36]/20 transition active:scale-98"
        >
          <span>CHECKOUT</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

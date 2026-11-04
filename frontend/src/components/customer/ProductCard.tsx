'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus, Zap, Clock, ShoppingBag } from 'lucide-react';
import { useCart, CartProduct } from '@/context/CartContext';

export interface ProductCardProps {
  product: CartProduct & {
    category?: { name: string; slug: string };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addToCart, updateQuantity } = useCart();
  const [animating, setAnimating] = useState(false);

  const cartItem = items.find((it) => it.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = !product.isAvailable || product.stockQty <= 0;

  // Extract authentic Brand from product or description
  const brandName =
    (product as any).brand ||
    (product as any).description?.match(/by\s+([^.]+)\./)?.[1]?.trim() ||
    product.name.split(' ')[0];

  const discountPercent =
    product.mrp && Number(product.mrp) > Number(product.price)
      ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
      : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    setAnimating(true);
    addToCart(product, 1);
    setTimeout(() => setAnimating(false), 300);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCartQty < product.stockQty) {
      setAnimating(true);
      updateQuantity(product.id, inCartQty + 1);
      setTimeout(() => setAnimating(false), 300);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    updateQuantity(product.id, inCartQty - 1);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800/90 hover:border-emerald-500/60 dark:hover:border-emerald-600/60 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden relative p-2 sm:p-3 w-full min-w-0 box-border">
      {/* Product Image Box with Floating Badges */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 mb-1.5 sm:mb-2 group/img"
      >
        {product.images && product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className={`w-full h-full object-contain p-1 sm:p-2 group-hover:scale-105 transition-transform duration-300 ${
              isOutOfStock ? 'grayscale opacity-60' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <ShoppingBag className="w-8 h-8 opacity-40" />
          </div>
        )}

        {/* Floating Discount Badge (Top Right) */}
        {discountPercent > 0 && (
          <div className="absolute top-1.5 right-1.5 z-10 bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
            {discountPercent}% OFF
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 text-center">
            <span className="text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-rose-600 shadow-md">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between min-w-0 w-full">
        <div className="min-w-0 w-full">
          {/* Brand Name */}
          <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate block">
            {brandName}
          </span>

          {/* Product Title */}
          <Link
            href={`/products/${product.slug}`}
            className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors leading-tight mt-0.5 min-h-[2rem] sm:min-h-[2.3rem]"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Unit / Pack Size */}
          <span className="text-[10px] font-medium text-slate-400 block mt-0.5 truncate">
            {product.unit}
          </span>
        </div>

        {/* Bottom Price & Add to Cart Action */}
        <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-slate-100 dark:border-slate-800/80 gap-1.5 min-w-0 w-full">
          {/* Price & MRP (Stacked vertically - Price above, Strikethrough MRP below - Never Truncates) */}
          <div className="flex flex-col justify-center min-w-0 flex-shrink leading-tight">
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono whitespace-nowrap leading-tight">
              ₹{Number(product.price).toFixed(0)}
            </span>
            {product.mrp && Number(product.mrp) > Number(product.price) && (
              <span className="text-[10px] text-slate-400 line-through font-mono font-medium whitespace-nowrap leading-tight">
                ₹{Number(product.mrp).toFixed(0)}
              </span>
            )}
          </div>

          {/* Add / Quantity Button */}
          {isOutOfStock ? (
            <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-[9px] text-center flex-shrink-0">
              Out
            </span>
          ) : inCartQty === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-emerald-600 bg-emerald-50/80 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500 dark:hover:bg-emerald-600 dark:hover:text-white font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-0.5 shadow-2xs active:scale-95 flex-shrink-0 ${
                animating ? 'scale-105 bg-emerald-600 text-white' : ''
              }`}
            >
              <span>ADD</span>
              <Plus className="w-2.5 h-2.5 stroke-[3]" />
            </button>
          ) : (
            <div className="inline-flex items-center rounded-lg bg-emerald-600 text-white shadow-xs overflow-hidden text-xs font-bold justify-between flex-shrink-0 min-w-[62px] sm:min-w-[72px]">
              <button
                type="button"
                onClick={handleDecrement}
                className="p-1 sm:p-1.5 hover:bg-emerald-700 transition active:scale-90"
                aria-label="Decrease quantity"
              >
                <Minus className="w-2.5 h-2.5 stroke-[3]" />
              </button>
              <span className="px-1 font-black text-[11px] sm:text-xs font-mono text-center">
                {inCartQty}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={inCartQty >= product.stockQty}
                className="p-1 sm:p-1.5 hover:bg-emerald-700 transition active:scale-90 disabled:opacity-50"
                aria-label="Increase quantity"
              >
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart, CartProduct } from '@/context/CartContext';

export interface ProductCardProps {
  product: CartProduct & {
    category?: { name: string; slug: string };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { items, addToCart, updateQuantity } = useCart();

  const cartItem = items.find((it) => it.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = !product.isAvailable || product.stockQty <= 0;

  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
      : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addToCart(product, 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inCartQty < product.stockQty) {
      updateQuantity(product.id, inCartQty + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    updateQuantity(product.id, inCartQty - 1);
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden relative">
      {/* Discount Badge */}
      {discountPercent > 0 && (
        <span className="absolute top-2.5 left-2.5 z-10 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          {discountPercent}% OFF
        </span>
      )}

      {/* Stock Status Badge */}
      {isOutOfStock ? (
        <span className="absolute top-2.5 right-2.5 z-10 bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
          Out of Stock
        </span>
      ) : product.stockQty <= 5 ? (
        <span className="absolute top-2.5 right-2.5 z-10 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
          Only {product.stockQty} left!
        </span>
      ) : null}

      {/* Image Container */}
      <Link href={`/products/${product.slug}`} className="block relative pt-[75%] bg-gray-50 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isOutOfStock ? 'opacity-60 grayscale' : ''
          }`}
          loading="lazy"
        />
      </Link>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {product.category && (
            <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block mb-1">
              {product.category.name}
            </span>
          )}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 hover:text-emerald-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          <span className="text-xs text-gray-500 font-medium block mt-1">
            {product.unit}
          </span>
        </div>

        {/* Price & Action */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-gray-900">
                ₹{Number(product.price).toFixed(0)}
              </span>
              {Number(product.mrp) > Number(product.price) && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{Number(product.mrp).toFixed(0)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400">Inclusive of GST</span>
          </div>

          {/* Add / Qty Control */}
          <div>
            {isOutOfStock ? (
              <button
                disabled
                className="px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-semibold rounded-xl cursor-not-allowed"
              >
                Unavailable
              </button>
            ) : inCartQty > 0 ? (
              <div className="flex items-center bg-emerald-50 border border-emerald-300 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={handleDecrement}
                  className="p-1.5 text-emerald-800 hover:bg-emerald-100 transition"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-bold text-emerald-900 min-w-[20px] text-center">
                  {inCartQty}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={inCartQty >= product.stockQty}
                  className="p-1.5 text-emerald-800 hover:bg-emerald-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

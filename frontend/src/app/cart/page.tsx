'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, totalItems } = useCart();

  const freeDeliveryThreshold = 499;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Your Basket is Empty</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          You haven&apos;t added any groceries to your cart yet. Browse our catalogue for fresh produce and staples.
        </p>
        <Link
          href="/products"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-sm"
        >
          Start Shopping Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Shopping Cart</h1>
          <p className="text-xs text-gray-500 mt-0.5">{totalItems} items in your basket</p>
        </div>
        <Link
          href="/products"
          className="text-emerald-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items list */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm divide-y divide-gray-100">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="py-4 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'}
                alt={product.name}
                className="w-20 h-20 rounded-2xl object-cover border border-gray-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Link href={`/products/${product.slug}`} className="font-bold text-gray-900 text-sm hover:text-emerald-600 block truncate">
                  {product.name}
                </Link>
                <span className="text-xs text-gray-500 block">{product.unit}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm font-extrabold text-gray-900">
                    ₹{(Number(product.price) * quantity).toFixed(0)}
                  </span>
                  <span className="text-xs text-gray-400">
                    (₹{Number(product.price)} each)
                  </span>
                </div>
              </div>

              {/* Counter */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-bold text-gray-800">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    disabled={quantity >= product.stockQty}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(product.id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary box */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4 self-start">
          <h3 className="font-bold text-gray-900 text-base pb-3 border-b border-gray-100">
            Order Summary
          </h3>

          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Items Total ({totalItems})</span>
              <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span className="font-medium text-emerald-700">
                {isFreeDelivery ? 'FREE' : 'Calculated at checkout (₹30-₹50)'}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline font-bold">
            <span className="text-gray-900 text-sm">Estimated Total</span>
            <span className="text-xl font-black text-emerald-700">₹{subtotal.toFixed(2)}</span>
          </div>

          <p className="text-[11px] text-gray-500">
            Payment accepted: <strong>Cash on Delivery (COD)</strong> at doorstep.
          </p>

          <Link
            href="/checkout"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

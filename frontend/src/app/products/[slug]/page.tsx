'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { items, addToCart, updateQuantity, setIsCartOpen } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    api
      .getProduct(String(slug))
      .then((res) => {
        if (res.success && res.data) {
          setProduct(res.data);
        } else {
          setError(res.message || 'Product not found');
        }
      })
      .catch(() => setError('Failed to load product details.'))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-gray-400">
        Loading product information...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
        <p className="text-xs text-gray-500">{error || 'This item may have been discontinued.'}</p>
        <Link
          href="/products"
          className="inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700"
        >
          Back to Catalogue
        </Link>
      </div>
    );
  }

  const cartItem = items.find((it) => it.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = !product.isAvailable || product.stockQty <= 0;

  const discountPercent =
    product.mrp && Number(product.mrp) > Number(product.price)
      ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
      : 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addToCart(product, 1);
    setIsCartOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/products" className="hover:text-emerald-600">Catalogue</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-emerald-600">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm">
        {/* Left: Product Image */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-50 aspect-square border border-gray-100">
          {discountPercent > 0 && (
            <span className="absolute top-4 left-4 z-10 bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md">
              {discountPercent}% OFF
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
            alt={product.name}
            className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
          />
        </div>

        {/* Right: Info & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            {product.category && (
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Unit: <strong className="text-gray-800">{product.unit}</strong></span>
              <span>•</span>
              <span>SKU: <strong className="text-gray-800">{product.sku}</strong></span>
              <span>•</span>
              <span>GST: <strong className="text-gray-800">{Number(product.taxPercent)}%</strong></span>
            </div>

            {/* Price section */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-gray-900">
                  ₹{Number(product.price).toFixed(0)}
                </span>
                {Number(product.mrp) > Number(product.price) && (
                  <span className="text-base text-gray-400 line-through">
                    ₹{Number(product.mrp).toFixed(0)}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                (Inclusive of all applicable taxes)
              </span>
            </div>

            {/* Stock status indicator */}
            <div className="pt-2">
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                  <AlertCircle className="w-4 h-4" />
                  Currently Out of Stock
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  In Stock ({product.stockQty} available for fast delivery)
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-4 text-xs text-gray-600 leading-relaxed border-t border-gray-100">
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1">
                  Product Overview
                </h4>
                <p>{product.description}</p>
              </div>
            )}
          </div>

          {/* Add to cart / Quantity buttons */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            {isOutOfStock ? (
              <button
                disabled
                className="w-full bg-gray-100 text-gray-400 font-bold py-3.5 rounded-2xl text-xs cursor-not-allowed"
              >
                Out of Stock - Cannot be Added to Cart
              </button>
            ) : inCartQty > 0 ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-emerald-50 border-2 border-emerald-500 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => updateQuantity(product.id, inCartQty - 1)}
                    className="p-3 text-emerald-900 hover:bg-emerald-100 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-extrabold text-emerald-900 min-w-[36px] text-center">
                    {inCartQty}
                  </span>
                  <button
                    onClick={() => updateQuantity(product.id, inCartQty + 1)}
                    disabled={inCartQty >= product.stockQty}
                    className="p-3 text-emerald-900 hover:bg-emerald-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>View in Cart ({inCartQty})</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-2xl text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Grocery Basket</span>
              </button>
            )}

            {/* Highlights */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-gray-600 text-center">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>2-Hr Delivery</span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pay on Delivery</span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                <span>Doorstep Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

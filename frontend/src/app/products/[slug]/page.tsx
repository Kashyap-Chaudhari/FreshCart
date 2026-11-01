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
  Zap,
  Tag,
  Clock,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/customer/ProductCard';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { items, addToCart, updateQuantity, setIsCartOpen } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    setError('');

    api
      .getProduct(String(slug))
      .then((res) => {
        if (res.success && res.data) {
          const p = res.data;
          setProduct(p);
          if (p.images && p.images.length > 0) {
            setSelectedImage(p.images[0]);
          }

          // Persist to Recently Viewed in localStorage
          try {
            const saved = localStorage.getItem('freshcart_recently_viewed');
            const list = saved ? JSON.parse(saved) : [];
            const filtered = [p, ...list.filter((item: any) => item.id !== p.id)].slice(0, 10);
            localStorage.setItem('freshcart_recently_viewed', JSON.stringify(filtered));
          } catch {}

          // Fetch related products from category
          if (p.categoryId || p.category?.slug) {
            const catParam = p.category?.slug ? `category=${p.category.slug}&limit=5` : 'limit=5';
            api.getProducts(catParam).then((r) => {
              if (r.success && r.data) {
                setRelatedProducts(r.data.filter((item: any) => item.id !== p.id));
              }
            });
          }
        } else {
          setError(res.message || 'Product not found');
        }
      })
      .catch(() => setError('Failed to load product details.'))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span>Loading product details...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-brand-text dark:text-white">Product Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'This item may have been moved or discontinued.'}</p>
        <Link
          href="/products"
          className="inline-block bg-brand-primary text-white text-xs font-bold px-5 py-2.5 rounded-2xl hover:bg-brand-deep transition"
        >
          Explore All Groceries
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

  const savings = product.mrp && Number(product.mrp) > Number(product.price)
    ? Number(product.mrp) - Number(product.price)
    : 0;

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 pb-24 lg:pb-8 w-full min-w-0">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-brand-primary">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-brand-primary">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand-primary">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-card">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          {/* Main Large Image Container */}
          <div className="relative aspect-square w-full rounded-3xl bg-brand-secondary dark:bg-slate-800/50 p-6 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800">
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 z-10 bg-brand-primary text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-xs">
                {discountPercent}% OFF
              </span>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="absolute top-4 right-4 z-10 p-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-slate-600 dark:text-slate-300 hover:text-brand-primary transition shadow-xs"
              title="Share product link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <ShoppingBag className="w-16 h-16 text-slate-300" />
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                <span className="text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-2xl bg-rose-600 shadow-md">
                  Currently Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-2xl bg-brand-secondary dark:bg-slate-800 p-1 flex-shrink-0 border-2 transition ${
                    selectedImage === img
                      ? 'border-brand-primary ring-2 ring-brand-primary/20'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain rounded-xl" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Details & Purchase Controls */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Quick Delivery Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft dark:bg-emerald-950/60 text-brand-primary dark:text-emerald-300 text-xs font-bold border border-brand-soft dark:border-emerald-900">
              <Zap className="w-3.5 h-3.5 fill-brand-primary" />
              <span>Express Delivery in 10-15 Mins</span>
            </div>

            {/* Product Title & Brand */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-brand-text dark:text-white tracking-tight leading-snug">
                {product.name}
              </h1>
              <span className="text-xs font-bold text-slate-500 block mt-1">
                Net Quantity: <strong className="text-slate-800 dark:text-slate-200">{product.unit}</strong>
              </span>
            </div>

            {/* Price & Savings Banner */}
            <div className="p-4 rounded-2xl bg-brand-secondary dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-brand-text dark:text-white font-mono">
                    ₹{Number(product.price).toFixed(0)}
                  </span>
                  {product.mrp && Number(product.mrp) > Number(product.price) && (
                    <span className="text-sm text-slate-400 line-through font-mono">
                      ₹{Number(product.mrp).toFixed(0)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Inclusive of all applicable taxes ({product.taxPercent || 0}% GST)
                </span>
              </div>

              {savings > 0 && (
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-xl bg-brand-primary text-white text-xs font-black shadow-xs">
                    Save ₹{savings.toFixed(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Stock State */}
            <div>
              {!isOutOfStock ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    In Stock ({product.stockQty} {product.unit} available)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Out of stock at nearest local fulfillment hub</span>
                </div>
              )}
            </div>

            {/* Main ADD / QUANTITY Action */}
            <div className="pt-2">
              {isOutOfStock ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed"
                >
                  Currently Unavailable
                </button>
              ) : inCartQty === 0 ? (
                <button
                  type="button"
                  onClick={() => addToCart(product, 1)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-brand-primary hover:bg-brand-deep text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/25 transition active:scale-98"
                >
                  <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                  <span>ADD TO CART</span>
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center rounded-2xl bg-brand-primary text-white text-sm font-black shadow-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, inCartQty - 1)}
                      className="px-4 py-3 hover:bg-black/15 transition"
                    >
                      <Minus className="w-4 h-4 stroke-[3]" />
                    </button>
                    <span className="px-4 font-mono text-base">{inCartQty}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, inCartQty + 1)}
                      disabled={inCartQty >= product.stockQty}
                      className="px-4 py-3 hover:bg-black/15 transition disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCartOpen(true)}
                    className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition text-center"
                  >
                    View in Basket ({inCartQty})
                  </button>
                </div>
              )}
            </div>

            {/* Quick Guarantees Strip */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <Clock className="w-4 h-4 text-brand-primary mx-auto mb-1" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">10-15 Mins</span>
                <span className="text-[9px] text-slate-400">Quick Delivery</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <ShieldCheck className="w-4 h-4 text-brand-primary mx-auto mb-1" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">Quality Assured</span>
                <span className="text-[9px] text-slate-400">Farm Verified</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <RotateCcw className="w-4 h-4 text-brand-primary mx-auto mb-1" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">Doorstep Check</span>
                <span className="text-[9px] text-slate-400">Instant Return</span>
              </div>
            </div>
          </div>

          {/* Description & Details */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-400">Product Highlights</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description || 'Farm-fresh quality handpicked daily for maximum nutrition and taste.'}
            </p>
          </div>
        </div>
      </div>

      {/* Related Products Rail */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-brand-text dark:text-white">
              Frequently Bought Together & Related
            </h2>
            <Link
              href="/products"
              className="text-xs font-bold text-brand-primary dark:text-emerald-400 hover:underline"
            >
              See More
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Sticky Add to Cart Bar */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 shadow-elevated flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-slate-400 block font-bold">{product.unit}</span>
          <span className="text-base font-black font-mono text-brand-text dark:text-white">
            ₹{Number(product.price).toFixed(0)}
          </span>
        </div>

        {isOutOfStock ? (
          <button disabled className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs">
            Unavailable
          </button>
        ) : inCartQty === 0 ? (
          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            className="px-6 py-2.5 rounded-xl bg-brand-primary text-white font-black text-xs shadow-md shadow-brand-primary/20 flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ADD TO CART</span>
          </button>
        ) : (
          <div className="inline-flex items-center rounded-xl bg-brand-primary text-white font-black text-xs shadow-xs">
            <button
              type="button"
              onClick={() => updateQuantity(product.id, inCartQty - 1)}
              className="px-3 py-2"
            >
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <span className="px-2 font-mono">{inCartQty}</span>
            <button
              type="button"
              onClick={() => updateQuantity(product.id, inCartQty + 1)}
              disabled={inCartQty >= product.stockQty}
              className="px-3 py-2 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

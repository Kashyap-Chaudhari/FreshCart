'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Truck,
  Clock,
  Sparkles,
  Flame,
  Tag,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  TrendingUp,
  RotateCcw,
  Percent,
  Check,
  Grid,
  ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/customer/ProductCard';

interface PromoBanner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  discount: string;
  ctaText: string;
  link: string;
  bgColor: string;
  image: string;
}

const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'b1',
    badge: 'DAILY ESSENTIALS',
    title: 'Farm Fresh Dairy, Milk & Artisanal Bread',
    subtitle: 'Amul Milk, Pure Desi Ghee, Farm Eggs & Fresh Bread in 15 mins',
    discount: 'UP TO 20% OFF',
    ctaText: 'Shop Dairy & Bread',
    link: '/products?category=dairy-bread-eggs',
    bgColor: 'from-emerald-700 via-emerald-600 to-teal-700',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'b2',
    badge: 'KITCHEN STAPLES',
    title: 'Chakki Fresh Atta, Basmati Rice & Dals',
    subtitle: 'Aashirvaad Atta, India Gate Basmati, Fortune Oil & Tata Salt',
    discount: 'FLAT 15% OFF',
    ctaText: 'Stock Up Staples',
    link: '/products?category=grocery-staples',
    bgColor: 'from-amber-600 via-emerald-700 to-emerald-800',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'b3',
    badge: 'SNACKS & DRINKS',
    title: 'Crispy Namkeen, Biscuits & Beverages',
    subtitle: 'Haldiram’s Bhujia, Parle-G, Maggi Noodles, Tata Tea & Juices',
    discount: 'BIG SAVINGS',
    ctaText: 'Shop Munchies',
    link: '/products?category=packaged-food',
    bgColor: 'from-teal-800 via-emerald-700 to-green-700',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
  },
];

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Banner carousel state
  const [currentBanner, setCurrentBanner] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Mobile categories toggle (show 8 vs all)
  const [showAllMobileCategories, setShowAllMobileCategories] = useState(false);

  // Touch swipe handlers for banner
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 45) {
      setCurrentBanner((prev) => (prev + 1) % PROMO_BANNERS.length);
    } else if (distance < -45) {
      setCurrentBanner((prev) => (prev === 0 ? PROMO_BANNERS.length - 1 : prev - 1));
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Recently viewed products from localStorage
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    // Auto-advance banner carousel
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch categories and products in parallel
    Promise.all([api.getCategories(), api.getProducts('limit=60')])
      .then(([catRes, prodRes]) => {
        if (catRes.success && catRes.data) {
          setCategories(catRes.data);
        }
        if (prodRes.success && prodRes.data) {
          setAllProducts(prodRes.data);
        }
      })
      .finally(() => setLoading(false));

    // Load recently viewed from localStorage
    try {
      const saved = localStorage.getItem('freshcart_recently_viewed');
      if (saved) {
        setRecentlyViewed(JSON.parse(saved).slice(0, 6));
      }
    } catch {}
  }, []);

  // Filtered product slices (8 items each: 2 balanced rows of 4 on desktop, 4 neat rows on mobile)
  const staplesAndAtta = allProducts.filter(
    (p) =>
      p.category?.slug === 'grocery-staples' ||
      p.name?.toLowerCase().includes('atta') ||
      p.name?.toLowerCase().includes('rice') ||
      p.name?.toLowerCase().includes('dal') ||
      p.name?.toLowerCase().includes('oil')
  ).slice(0, 8);

  const bestSellers = allProducts.slice(0, 8);

  const specialOffers = allProducts.filter(
    (p) => p.mrp && Number(p.mrp) > Number(p.price)
  ).slice(0, 8);

  const dailyEssentials = allProducts.filter(
    (p) =>
      p.category?.slug === 'dairy-bread-eggs' ||
      p.name?.toLowerCase().includes('milk') ||
      p.name?.toLowerCase().includes('bread') ||
      p.name?.toLowerCase().includes('butter') ||
      p.name?.toLowerCase().includes('paneer') ||
      p.name?.toLowerCase().includes('egg')
  ).slice(0, 8);

  return (
    <div className="space-y-5 sm:space-y-10 pb-20 lg:pb-8 w-full min-w-0 overflow-x-hidden">
      {/* 1. HERO PROMOTIONAL BANNER CAROUSEL */}
      <section className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 pt-2.5 sm:pt-3 w-full min-w-0">
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-card border border-slate-200/60 dark:border-slate-800 touch-pan-y w-full"
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
          >
            {PROMO_BANNERS.map((b) => (
              <div
                key={b.id}
                className={`w-full flex-shrink-0 bg-gradient-to-r ${b.bgColor} text-white relative min-h-[160px] sm:min-h-[240px] lg:min-h-[290px] flex items-center p-4 sm:p-8 lg:p-12`}
              >
                {/* Background image illustration */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 sm:opacity-35 pointer-events-none overflow-hidden">
                  <img
                    src={b.image}
                    alt={b.title}
                    className="w-full h-full object-cover mix-blend-overlay"
                  />
                </div>

                {/* Banner Content */}
                <div className="relative z-10 max-w-xl space-y-1.5 sm:space-y-2.5">
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white border border-white/30">
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-offer fill-brand-offer" />
                    {b.badge} • {b.discount}
                  </span>

                  <h2 className="text-base sm:text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight leading-tight drop-shadow-xs">
                    {b.title}
                  </h2>

                  <p className="text-[11px] sm:text-sm text-white/90 line-clamp-2 max-w-md">
                    {b.subtitle}
                  </p>

                  <div className="pt-1 sm:pt-2">
                    <Link
                      href={b.link}
                      className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-2xl bg-white text-brand-primary font-black text-xs sm:text-sm shadow-md hover:bg-brand-soft transition active:scale-95"
                    >
                      <span>{b.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Navigation Arrows */}
          <button
            type="button"
            onClick={() =>
              setCurrentBanner((prev) => (prev === 0 ? PROMO_BANNERS.length - 1 : prev - 1))
            }
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-xs transition"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setCurrentBanner((prev) => (prev + 1) % PROMO_BANNERS.length)
            }
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-xs transition"
            aria-label="Next banner"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2.5 left-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {PROMO_BANNERS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentBanner(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  currentBanner === idx ? 'w-5 sm:w-6 bg-white' : 'w-1.5 sm:w-2 bg-white/50'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION BENEFIT STRIP */}
      <section className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12">
        {/* Mobile View: Ultra-sleek single horizontal scroll strip */}
        <div className="md:hidden overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-2 min-w-max px-0.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-800 shadow-2xs text-[11px] font-bold text-slate-800 dark:text-slate-200">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 flex-shrink-0" />
              <span>10-15 Min Delivery</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-[11px] font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>100% Quality Checked</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-[11px] font-bold text-slate-800 dark:text-slate-200">
              <Tag className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Direct Real MRP</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-[11px] font-bold text-slate-800 dark:text-slate-200">
              <Truck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span>Pay on Delivery</span>
            </div>
          </div>
        </div>

        {/* Desktop & Tablet: Full 4-column benefit cards */}
        <div className="hidden md:grid md:grid-cols-4 gap-3 sm:gap-3.5">
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3 shadow-xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-soft text-brand-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-brand-primary" />
            </div>
            <div className="min-w-0">
              <span className="font-black text-xs text-brand-text dark:text-white block truncate">
                10-15 Min Delivery
              </span>
              <span className="text-[10px] text-brand-muted dark:text-slate-400 block truncate">
                Local Gujarat hubs
              </span>
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3 shadow-xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-black text-xs text-brand-text dark:text-white block truncate">
                100% Quality Checked
              </span>
              <span className="text-[10px] text-brand-muted dark:text-slate-400 block truncate">
                Handpicked farm fresh
              </span>
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3 shadow-xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-black text-xs text-brand-text dark:text-white block truncate">
                Real File MRP
              </span>
              <span className="text-[10px] text-brand-muted dark:text-slate-400 block truncate">
                Authentic prices
              </span>
            </div>
          </div>

          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5 sm:gap-3 shadow-xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-black text-xs text-brand-text dark:text-white block truncate">
                Pay on Delivery
              </span>
              <span className="text-[10px] text-brand-muted dark:text-slate-400 block truncate">
                Cash or UPI at doorstep
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOP BY CATEGORY SECTION */}
      <section className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-xl font-black text-brand-text dark:text-white tracking-tight leading-none">
              Shop by Categories
            </h2>
            <p className="text-[11px] sm:text-xs text-brand-muted dark:text-slate-400 mt-1">
              Farm-fresh produce, dairy, staples, snacks & daily essentials
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold text-brand-primary dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>See All ({categories.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile View: Curated Top 8 Categories Only (2 Clean Rows of 4) */}
        <div className="md:hidden space-y-2.5">
          <div className="grid grid-cols-4 gap-2">
            {(showAllMobileCategories ? categories : categories.slice(0, 7)).map((cat) => (
              <Link
                key={`m-${cat.id}`}
                href={`/products?category=${cat.slug}`}
                className="flex flex-col items-center text-center p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-500 transition active:scale-95"
              >
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-b from-emerald-50/70 to-slate-50 dark:from-slate-800 dark:to-slate-900 p-2 flex items-center justify-center mb-1 border border-slate-100 dark:border-slate-800/60">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-contain drop-shadow-2xs"
                      loading="lazy"
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1 leading-tight mt-0.5">
                  {cat.name}
                </span>
              </Link>
            ))}

            {/* The 8th Tile: "All Categories" Quick Tile */}
            {!showAllMobileCategories && (
              <button
                type="button"
                onClick={() => setShowAllMobileCategories(true)}
                className="flex flex-col items-center justify-center text-center p-2 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-xs active:scale-95 transition"
              >
                <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1">
                  <Grid className="w-6 h-6 text-white stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-white leading-tight">
                  All Aisles
                </span>
              </button>
            )}
          </div>

          {/* Clean Expand/Collapse Pill on Mobile */}
          {categories.length > 8 && (
            <div className="text-center pt-0.5">
              <button
                type="button"
                onClick={() => setShowAllMobileCategories(!showAllMobileCategories)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-4 py-1.5 rounded-full border border-emerald-200/80 dark:border-emerald-800 transition active:scale-95 shadow-2xs"
              >
                <span>{showAllMobileCategories ? 'Show Less (8 Categories)' : `Explore All ${categories.length} Aisles`}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllMobileCategories ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Desktop & Tablet: Full Adaptive Grid (100% Unchanged) */}
        <div className="hidden md:grid md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 2xl:grid-cols-13 gap-2 sm:gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group flex flex-col items-center text-center p-2 sm:p-3 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:border-brand-primary/50 shadow-card hover:shadow-card-hover transition-all duration-200"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-brand-secondary dark:bg-slate-800 p-1.5 sm:p-2 mb-1.5 sm:mb-2 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-contain drop-shadow-xs"
                    loading="lazy"
                  />
                ) : (
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-brand-text dark:text-slate-200 group-hover:text-brand-primary transition-colors line-clamp-2 leading-tight">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. DAILY ESSENTIALS SECTION */}
      <section className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-brand-soft text-brand-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-brand-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-brand-text dark:text-white leading-none">
                Daily Essentials
              </h2>
              <span className="text-[10px] sm:text-[11px] text-brand-muted dark:text-slate-400 mt-0.5 block">
                Fresh Milk, Curd, Paneer, Farm Eggs & Bread
              </span>
            </div>
          </div>

          <Link
            href="/products"
            className="text-xs font-bold text-brand-primary dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-4.5 w-full min-w-0">
          {dailyEssentials.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 5. STAPLES & GRAINS */}
      <section className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 w-full min-w-0">
        <div className="p-2.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-brand-soft/50 dark:bg-slate-900/60 border border-brand-soft dark:border-slate-800 w-full min-w-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">🌾</span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-brand-deep dark:text-emerald-300 leading-none">
                  Chakki Atta, Basmati Rice & Dals
                </h2>
                <span className="text-[10px] sm:text-[11px] text-brand-muted dark:text-slate-400 mt-0.5 block">
                  Aashirvaad, Fortune, Tata Sampann, India Gate — delivered in 10-15 mins
                </span>
              </div>
            </div>

            <Link
              href="/products?category=grocery-staples"
              className="text-xs font-bold text-brand-primary dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>See Staples</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-4.5 w-full min-w-0">
            {(staplesAndAtta.length > 0 ? staplesAndAtta : allProducts.slice(0, 8)).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. BEST SELLERS & TRENDING NOW */}
      <section className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 w-full min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-offer fill-brand-offer" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-brand-text dark:text-white leading-none">
                Trending & Best Sellers
              </h2>
              <span className="text-[10px] sm:text-[11px] text-brand-muted dark:text-slate-400 mt-0.5 block">
                Most ordered grocery items in your neighborhood today
              </span>
            </div>
          </div>

          <Link
            href="/products"
            className="text-xs font-bold text-brand-primary dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-4.5 w-full min-w-0">
          {bestSellers.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 7. SUPER SAVER SPECIAL OFFERS */}
      {specialOffers.length > 0 && (
        <section className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 w-full min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-brand-text dark:text-white leading-none">
                  Super Saver Deals
                </h2>
                <span className="text-[10px] sm:text-[11px] text-brand-muted dark:text-slate-400 mt-0.5 block">
                  Biggest price drops & bundle discounts
                </span>
              </div>
            </div>

            <Link
              href="/products"
              className="text-xs font-bold text-brand-primary dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View Offers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-4.5 w-full min-w-0">
            {specialOffers.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* 8. RECENTLY VIEWED (PERSISTENT FROM LOCALSTORAGE) */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 w-full min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-brand-text dark:text-white leading-none">
                  Recently Viewed
                </h2>
                <span className="text-[10px] sm:text-[11px] text-brand-muted dark:text-slate-400 mt-0.5 block">
                  Pick up right where you left off
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-4 lg:gap-4.5 w-full min-w-0">
            {recentlyViewed.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

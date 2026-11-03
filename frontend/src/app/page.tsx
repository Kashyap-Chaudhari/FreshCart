'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag,
  ChevronRight,
  ChevronLeft,
  ShoppingBag,
  RotateCcw,
  Percent,
  Search,
  FileText,
  Bookmark,
} from 'lucide-react';
import { api } from '@/lib/api';
import ProductCard from '@/components/customer/ProductCard';
import { HOME_CATEGORY_GROUPS, SHOP_BY_STORES } from '@/data/homeCategories';

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
    link: '/products?category=beverages',
    bgColor: 'from-teal-800 via-emerald-700 to-green-700',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
  },
];

const SEARCH_PLACEHOLDERS = [
  "'A2 Ghee'",
  "'Organic Dishwash'",
  "'Diwali Decor'",
  "'Amul Butter'",
  "'Chakki Atta'",
  "'Cold Drinks'",
  "'Maggi Noodles'",
  "'Basmati Rice'",
];

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Rotating search placeholder state (Mobile only)
  const [searchPlaceholderIdx, setSearchPlaceholderIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Banner carousel state
  const [currentBanner, setCurrentBanner] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Recently viewed products from localStorage
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    // Auto-advance banner carousel
    const bannerTimer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 5000);

    // Auto-rotate search placeholder
    const searchTimer = setInterval(() => {
      setSearchPlaceholderIdx((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);

    return () => {
      clearInterval(bannerTimer);
      clearInterval(searchTimer);
    };
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim() || SEARCH_PLACEHOLDERS[searchPlaceholderIdx].replace(/['"]/g, '');
    router.push(`/products?search=${encodeURIComponent(query)}`);
  };

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

  // Filtered product slices
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
    <div className="w-full min-w-0 overflow-x-hidden relative bg-[#FAFCFF] dark:bg-slate-950 pb-16">
      {/* ========================================================================= */}
      {/* 📱 MOBILE VIEW ONLY (md:hidden) — EXACT MATCH TO USER'S SCREENSHOTS       */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-4 pb-4">
        {/* Mobile Search Bar with rotating placeholders */}
        <section className="px-3 pt-2">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-1.5 shadow-xs transition focus-within:ring-2 focus-within:ring-emerald-500"
          >
            <div className="flex-1 flex items-center gap-2 pl-1.5 min-w-0">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search for ${SEARCH_PLACEHOLDERS[searchPlaceholderIdx]}...`}
                className="w-full bg-transparent text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 pr-0.5">
              <button type="submit" aria-label="Search" className="p-1 text-slate-500">
                <Search className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <Link href="/cart" aria-label="Shopping list" className="p-1 text-slate-500">
                <FileText className="w-4 h-4" />
              </Link>
              <Link
                href="/orders"
                aria-label="Saved items"
                className="p-1 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
              >
                <Bookmark className="w-3.5 h-3.5 stroke-[2.2]" />
              </Link>
            </div>
          </form>
        </section>

        {/* Mobile Promo Banner Carousel */}
        <section className="px-2.5">
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative rounded-xl overflow-hidden shadow-xs border border-slate-200/60 dark:border-slate-800"
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
              {PROMO_BANNERS.map((b) => (
                <div
                  key={b.id}
                  className={`w-full flex-shrink-0 bg-gradient-to-r ${b.bgColor} text-white relative min-h-[135px] flex items-center p-3.5`}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none overflow-hidden">
                    <img src={b.image} alt={b.title} className="w-full h-full object-cover mix-blend-overlay" />
                  </div>

                  <div className="relative z-10 max-w-xl space-y-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[9px] font-black uppercase tracking-wider text-white border border-white/30">
                      <Zap className="w-2.5 h-2.5 text-brand-offer fill-brand-offer" />
                      {b.badge} • {b.discount}
                    </span>

                    <h2 className="text-sm font-black tracking-tight leading-tight">{b.title}</h2>
                    <p className="text-[10px] text-white/90 line-clamp-1 max-w-md">{b.subtitle}</p>

                    <div className="pt-0.5">
                      <Link
                        href={b.link}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-emerald-800 font-black text-[11px] shadow-xs active:scale-95"
                      >
                        <span>{b.ctaText}</span>
                        <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {PROMO_BANNERS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentBanner(idx)}
                  className={`h-1 rounded-full transition-all ${
                    currentBanner === idx ? 'w-4 bg-white' : 'w-1 bg-white/50'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Mobile Horizontal Benefit Strip */}
        <section className="px-3">
          <div className="overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 min-w-max px-0.5">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-800 shadow-2xs text-[10px] font-bold text-slate-800 dark:text-slate-200">
                <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600 flex-shrink-0" />
                <span>10-15 Min Delivery</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-[10px] font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>100% Quality Checked</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-[10px] font-bold text-slate-800 dark:text-slate-200">
                <Tag className="w-3 h-3 text-amber-600 flex-shrink-0" />
                <span>Direct Real MRP</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs text-[10px] font-bold text-slate-800 dark:text-slate-200">
                <Truck className="w-3 h-3 text-teal-600 flex-shrink-0" />
                <span>Pay on Delivery</span>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Categorized 4-Column Sections */}
        <div className="px-3 space-y-4">
          {HOME_CATEGORY_GROUPS.map((group) => (
            <section key={group.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                  {group.title}
                </h2>
                <Link
                  href="/products"
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    className="group flex flex-col items-center text-center transition active:scale-95"
                  >
                    <div className="w-full aspect-square rounded-xl bg-[#EEF5FF] dark:bg-slate-800/80 p-1.5 flex items-center justify-center relative overflow-hidden border border-sky-100/60 dark:border-slate-700/50">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain drop-shadow-2xs"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 text-center line-clamp-2 leading-tight tracking-tight mt-1">
                      {item.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {/* Shop by Store (Arched Cards) */}
          <section className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                Shop by Store
              </h2>
              <Link
                href="/products"
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                <span>Explore</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {SHOP_BY_STORES.map((store) => (
                <Link
                  key={store.id}
                  href={store.link}
                  className="group flex flex-col items-center text-center transition active:scale-95"
                >
                  <div
                    className={`w-full aspect-[4/4.8] rounded-t-full rounded-b-2xl bg-gradient-to-b ${store.bgColor} dark:from-slate-800 dark:to-slate-900 p-2.5 flex items-end justify-center relative overflow-hidden border border-slate-200/60 dark:border-slate-700/60`}
                  >
                    <img
                      src={store.image}
                      alt={store.name}
                      className="w-full h-[80%] object-contain drop-shadow-md"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 text-center line-clamp-1 mt-1">
                    {store.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Promotional Dairy Banner */}
          <section className="pt-1">
            <Link
              href="/products?category=dairy-bread-eggs"
              className="block w-full rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 relative overflow-hidden shadow-xs active:scale-98"
            >
              <div className="relative z-10 max-w-sm space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                  Powered by NOICE!
                </span>
                <h3 className="text-lg font-black tracking-tight leading-tight">
                  Fresh Dairy? <br />Try NOICE!
                </h3>
                <p className="text-[11px] text-blue-100">
                  100% Pure A2 Milk, Desi Ghee & Fresh Curd Delivered in 15 Minutes
                </p>
              </div>

              <div className="absolute right-0 bottom-0 top-0 w-2/5 flex items-center justify-end pr-2 pointer-events-none">
                <img
                  src="https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80"
                  alt="Dairy essentials"
                  className="w-24 h-24 object-contain drop-shadow-md"
                />
              </div>
            </Link>
          </section>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 💻 DESKTOP VIEW ONLY (hidden md:block) — STRICTLY PROTECTED DESKTOP LAYOUT  */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-8 sm:space-y-10 pt-4 max-w-[1720px] mx-auto px-6 lg:px-8 2xl:px-12">
        {/* Desktop Hero Promotional Banner Carousel */}
        <section className="w-full">
          <div className="relative rounded-3xl overflow-hidden shadow-card border border-slate-200/60 dark:border-slate-800">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentBanner * 100}%)` }}
            >
              {PROMO_BANNERS.map((b) => (
                <div
                  key={b.id}
                  className={`w-full flex-shrink-0 bg-gradient-to-r ${b.bgColor} text-white relative min-h-[260px] lg:min-h-[300px] flex items-center p-8 lg:p-12`}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-35 pointer-events-none overflow-hidden">
                    <img src={b.image} alt={b.title} className="w-full h-full object-cover mix-blend-overlay" />
                  </div>

                  <div className="relative z-10 max-w-xl space-y-2.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-white border border-white/30">
                      <Zap className="w-3.5 h-3.5 text-brand-offer fill-brand-offer" />
                      {b.badge} • {b.discount}
                    </span>

                    <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight leading-tight">
                      {b.title}
                    </h2>

                    <p className="text-sm text-white/90 line-clamp-2 max-w-md">{b.subtitle}</p>

                    <div className="pt-2">
                      <Link
                        href={b.link}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-white text-brand-primary font-black text-sm shadow-md hover:bg-brand-soft transition active:scale-95"
                      >
                        <span>{b.ctaText}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentBanner((prev) => (prev === 0 ? PROMO_BANNERS.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-xs transition"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentBanner((prev) => (prev + 1) % PROMO_BANNERS.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-xs transition"
              aria-label="Next banner"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {PROMO_BANNERS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentBanner(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    currentBanner === idx ? 'w-6 bg-white' : 'w-2 bg-white/50'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Desktop 4-Column Value Benefit Cards */}
        <section className="grid grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-brand-soft text-brand-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 fill-brand-primary" />
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

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
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

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Tag className="w-5 h-5" />
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

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5" />
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
        </section>

        {/* Desktop Shop by Categories — Full Adaptive Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-brand-text dark:text-white tracking-tight leading-none">
                Shop by Categories
              </h2>
              <p className="text-xs text-brand-muted dark:text-slate-400 mt-1">
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

          <div className="grid grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 2xl:grid-cols-13 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center text-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:border-brand-primary/50 shadow-card hover:shadow-card-hover transition-all duration-200"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-secondary dark:bg-slate-800 p-2 mb-2 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-contain drop-shadow-xs"
                      loading="lazy"
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-brand-primary" />
                  )}
                </div>
                <span className="text-[11px] font-extrabold text-brand-text dark:text-slate-200 group-hover:text-brand-primary transition-colors line-clamp-2 leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 🛒 PRODUCT SHOWCASE SECTIONS (RESPONSIVE FOR BOTH MOBILE & DESKTOP)       */}
      {/* ========================================================================= */}
      <div className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 space-y-5 sm:space-y-8 pt-4">
        {/* Daily Essentials */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-brand-soft text-brand-primary flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-brand-primary" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                  Daily Essentials
                </h2>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Fresh Milk, Curd, Paneer, Farm Eggs & Bread
                </span>
              </div>
            </div>

            <Link
              href="/products?category=dairy-bread-eggs"
              className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
            {dailyEssentials.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>

        {/* Kitchen Staples & Atta */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                  Kitchen Staples & Atta
                </h2>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Aashirvaad Atta, India Gate Basmati, Fortune Oil & Dals
                </span>
              </div>
            </div>

            <Link
              href="/products?category=grocery-staples"
              className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
            {staplesAndAtta.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>

        {/* Bestsellers */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                  Bestsellers
                </h2>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Most ordered grocery items across Gujarat
                </span>
              </div>
            </div>

            <Link
              href="/products"
              className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
            {bestSellers.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>

        {/* Super Saver Deals */}
        {specialOffers.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                    Super Saver Deals
                  </h2>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    Biggest price drops & bundle discounts
                  </span>
                </div>
              </div>

              <Link
                href="/products"
                className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                <span>View Offers</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
              {specialOffers.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                    Recently Viewed
                  </h2>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                    Pick up right where you left off
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 w-full">
              {recentlyViewed.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

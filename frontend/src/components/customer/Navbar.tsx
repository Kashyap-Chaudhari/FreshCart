'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  User as UserIcon,
  MapPin,
  Menu,
  X,
  ShieldCheck,
  Phone,
  Home,
  Grid,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* Top Banner / Store announcement */}
      <div className="bg-emerald-800 text-white text-xs py-1.5 px-4 text-center flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" />
          <span>Quick Support: +91 98765 43210 (7 AM - 10 PM)</span>
        </div>
        <div className="w-full sm:w-auto text-center font-medium">
          ⚡ 2-Hour Express Delivery in Koramangala & HSR | COD Available
        </div>
        <div className="hidden sm:block">
          Use Code <span className="bg-emerald-600 px-1.5 py-0.5 rounded font-bold">FRESH15</span> for 15% OFF
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                FC
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-gray-900">
                  Fresh<span className="text-emerald-600">Cart</span>
                </span>
                <span className="block text-[10px] text-gray-500 font-medium tracking-wide uppercase">
                  Supermarket
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-700">
              <Link href="/" className="hover:text-emerald-600 transition-colors">
                Home
              </Link>
              <Link href="/products" className="hover:text-emerald-600 transition-colors">
                All Products
              </Link>
              <Link href="/about" className="hover:text-emerald-600 transition-colors">
                About Store
              </Link>
              <Link href="/contact" className="hover:text-emerald-600 transition-colors">
                Delivery & Contact
              </Link>
            </nav>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search 1,000+ groceries, atta, milk, veggies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </form>

            {/* Right Action Icons */}
            <div className="flex items-center gap-3 sm:gap-4">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Admin Panel
                </Link>
              )}

              {user ? (
                <div className="relative group">
                  <Link
                    href="/orders"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-emerald-600 p-2 rounded-lg"
                  >
                    <UserIcon className="w-5 h-5 text-gray-600" />
                    <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                  </Link>
                  {/* Dropdown */}
                  <div className="hidden group-hover:block absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                    <div className="px-3 py-1.5 border-b border-gray-100 text-xs text-gray-500">
                      Signed in as <strong className="text-gray-800 block truncate">{user.name}</strong>
                    </div>
                    <Link href="/orders" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="block px-3 py-2 text-sm text-emerald-700 font-semibold hover:bg-emerald-50">
                        Admin Portal
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-2 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition shadow-sm"
                aria-label="View Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden sm:inline">Cart</span>
                {totalItems > 0 && (
                  <span className="bg-amber-400 text-gray-900 text-xs font-black px-2 py-0.5 rounded-full ml-0.5">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile search input */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vegetables, milk, atta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-100 border-none rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </form>
          </div>
        </div>

        {/* Mobile slide menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-gray-800 hover:text-emerald-600 py-1"
            >
              Home
            </Link>
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-gray-800 hover:text-emerald-600 py-1"
            >
              All Products & Categories
            </Link>
            <Link
              href="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-gray-800 hover:text-emerald-600 py-1"
            >
              My Orders & Invoices
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-gray-800 hover:text-emerald-600 py-1"
            >
              About FreshCart
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-gray-800 hover:text-emerald-600 py-1"
            >
              Contact & Store Hours
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-base font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg"
              >
                Admin Control Panel
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (app-like mobile feel) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex items-center justify-around py-2.5 shadow-lg">
        <Link href="/" className="flex flex-col items-center text-gray-600 hover:text-emerald-600 text-[11px] font-medium">
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>
        <Link href="/products" className="flex flex-col items-center text-gray-600 hover:text-emerald-600 text-[11px] font-medium">
          <Grid className="w-5 h-5 mb-0.5" />
          <span>Categories</span>
        </Link>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center text-emerald-600 text-[11px] font-semibold"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span>Cart</span>
        </button>
        <Link href={user ? '/orders' : '/login'} className="flex flex-col items-center text-gray-600 hover:text-emerald-600 text-[11px] font-medium">
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span>{user ? 'Orders' : 'Account'}</span>
        </Link>
      </div>
    </>
  );
}

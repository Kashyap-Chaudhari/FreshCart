import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, Clock, Heart, Award, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
          About FreshCart Supermarket
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
          Your Trusted Daily Fresh Grocery Partner
        </h1>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Founded with a simple mission: bringing freshly harvested farm vegetables, authentic staples, and daily essentials straight to families across Gujarat with zero compromise on quality and swift express delivery.
        </p>
      </div>

      {/* Story & Commitment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-xl font-black text-gray-900">Direct From Farms, Right to Your Kitchen</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Unlike traditional middlemen channels where produce sits for days in wholesale yards, FreshCart sources vegetables and fruits daily from verified local farmers across Gujarat.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Every item undergoes rigorous quality grading before being temperature-controlled in our Ahmedabad central fulfillment hub.
          </p>
          <div className="space-y-2 pt-2 text-xs font-semibold text-gray-800">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>100% Quality Checked before packing</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Doorstep inspection with Cash on Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Strict compliance with GST & FSSAI standards</span>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden aspect-video md:aspect-square bg-gray-100 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
            alt="Fresh grocery store shelves"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Lightning Express</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Orders are packed fresh and dispatched via optimized delivery routes to reach you within 2 hours.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Transparency First</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Every rupee is accounted for with sequential GST invoices, transparent rates, and zero hidden charges.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Customer Trust</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            If any item doesn&apos;t meet your freshness expectations, hand it right back to our courier with no friction.
          </p>
        </div>
      </div>

      <div className="bg-emerald-800 text-white rounded-3xl p-8 sm:p-10 text-center space-y-4">
        <h2 className="text-2xl font-black">Ready to Experience Truly Fresh Groceries?</h2>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto">
          Join thousands of happy families in Bengaluru who rely on FreshCart for their daily vegetables, milk, and pantry staples.
        </p>
        <Link
          href="/products"
          className="inline-block bg-amber-400 hover:bg-amber-300 text-gray-900 font-extrabold text-xs px-6 py-3 rounded-xl transition shadow-lg"
        >
          Explore Catalogue Now
        </Link>
      </div>
    </div>
  );
}


import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-20 md:pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-10 border-b border-gray-800 text-center sm:text-left">
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">2-Hour Express Delivery</h4>
              <p className="text-xs text-gray-400">Fresh from store to your doorstep</p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Pay on Delivery (COD)</h4>
              <p className="text-xs text-gray-400">Verify your groceries before paying</p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Easy Returns & Refunds</h4>
              <p className="text-xs text-gray-400">No questions asked return at doorstep</p>
            </div>
          </div>
        </div>

        {/* Links & Information */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-base">
                FC
              </div>
              <span className="text-lg font-bold text-white">FreshCart</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Your trusted local neighborhood grocery store delivering farm-fresh produce, staples, dairy and household essentials.
            </p>
            <div className="text-xs text-emerald-400 font-medium">
              GSTIN: 29AAAAA0000A1Z5 | FSSAI: 11223344556677
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-3">Quick Links</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition">Home</Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-emerald-400 transition">Product Catalogue</Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-emerald-400 transition">Track Orders & Invoices</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition">About Our Store</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-emerald-400 transition">Service Areas & PIN Codes</Link>
              </li>
            </ul>
          </div>

          {/* Delivery Hubs */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-3">Service Areas (PIN Codes)</h5>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="bg-gray-800 px-2 py-1 rounded text-gray-300">560034 Koramangala</span>
              <span className="bg-gray-800 px-2 py-1 rounded text-gray-300">560102 HSR Layout</span>
              <span className="bg-gray-800 px-2 py-1 rounded text-gray-300">560095 Ejipura</span>
              <span className="bg-gray-800 px-2 py-1 rounded text-gray-300">560001 MG Road</span>
              <span className="bg-gray-800 px-2 py-1 rounded text-gray-300">560037 Marathahalli</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-3">Free delivery on orders above ₹499 in Koramangala.</p>
          </div>

          {/* Contact Details */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-3">Store Contact</h5>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>123 Market Road, Koramangala 4th Block, Bengaluru 560034</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>support@freshcart.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Open 7:00 AM - 10:00 PM (All 7 Days)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-gray-800 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} FreshCart Supermarket. All rights reserved.</p>
          <p className="text-gray-400">Payment accepted: <strong className="text-white">Cash on Delivery (COD)</strong></p>
        </div>
      </div>
    </footer>
  );
}

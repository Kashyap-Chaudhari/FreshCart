import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Truck, RefreshCw, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-text text-slate-300 pt-10 sm:pt-12 pb-24 md:pb-8 border-t border-slate-800">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12">
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pb-10 border-b border-slate-800 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-brand-primary/40 flex items-center justify-center text-brand-offer">
              <Zap className="w-6 h-6 fill-brand-offer" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs">10-15 Mins Delivery</h4>
              <p className="text-[11px] text-slate-400">Direct from local Gujarat hubs</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-brand-primary/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs">Farm Fresh Quality</h4>
              <p className="text-[11px] text-slate-400">Handpicked organic produce</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-brand-primary/40 flex items-center justify-center text-emerald-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs">Pay on Delivery (COD)</h4>
              <p className="text-[11px] text-slate-400">Cash or UPI at your doorstep</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-brand-primary/40 flex items-center justify-center text-emerald-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs">Instant Replacement</h4>
              <p className="text-[11px] text-slate-400">No questions asked doorstep check</p>
            </div>
          </div>
        </div>

        {/* Links & Information */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-black text-lg shadow-sm">
                🥦
              </div>
              <span className="text-xl font-black text-white">Fresh<span className="text-brand-primary">Cart</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gujarat&apos;s favorite quick-commerce grocery delivery service. Farm-fresh fruits, vegetables, daily dairy, atta, pulses, and household essentials in 10-15 minutes.
            </p>
            <div className="text-[11px] text-emerald-400 font-medium">
              GSTIN: 24AAAAA0000A1Z5 | FSSAI: 11223344556677
            </div>
          </div>

          {/* Categories */}
          <div>
            <h5 className="text-white text-xs font-black uppercase tracking-wider mb-3">Popular Categories</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/products?category=fruits-vegetables" className="hover:text-brand-primary transition">
                  Fresh Fruits & Vegetables
                </Link>
              </li>
              <li>
                <Link href="/products?category=rice-flour-grains" className="hover:text-brand-primary transition">
                  Chakki Atta, Rice & Grains
                </Link>
              </li>
              <li>
                <Link href="/products?category=pulses-dals" className="hover:text-brand-primary transition">
                  Organic Dals & Pulses
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-brand-primary transition">
                  Dairy, Milk & Morning Bakery
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Commerce Delivery Hubs in Gujarat */}
          <div>
            <h5 className="text-white text-xs font-black uppercase tracking-wider mb-3">Service Areas (Gujarat)</h5>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• Ahmedabad (Vastrapur, Bopal, SG Hwy, CG Rd)</li>
              <li>• Gandhinagar (Sector 1-30, Infocity)</li>
              <li>• Surat (Athwa, Vesu, Adajan, Varachha)</li>
              <li>• Vadodara (Alkapuri, Gotri, Manjalpur)</li>
              <li>• Rajkot (Kalawad Road, Yagnik Road)</li>
              <li>• Bhavnagar, Jamnagar, Anand & all 33 Districts</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h5 className="text-white text-xs font-black uppercase tracking-wider mb-3">Customer Support</h5>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span>+91 98250 00001 (7 AM - 11 PM)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span>support@freshcart.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span>10-15 Mins Delivery (Daily 6 AM - Midnight)</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/orders"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary/20 text-emerald-400 border border-brand-primary/40 font-bold text-xs hover:bg-brand-primary hover:text-white transition"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Track Your Order</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 FreshCart Supermarket Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-slate-300">About Store</Link>
            <Link href="/contact" className="hover:text-slate-300">Delivery Coverage</Link>
            <Link href="/orders" className="hover:text-slate-300">My Orders</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

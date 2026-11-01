'use client';

import React, { useEffect } from 'react';
import { ShieldCheck, ArrowRight, ExternalLink, Store } from 'lucide-react';

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

export default function AdminRedirectPage() {
  useEffect(() => {
    // Optionally auto-redirect after 1.5 seconds
    const timer = setTimeout(() => {
      window.location.href = ADMIN_URL;
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full">
            Separate Administrative Website
          </span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Admin Portal has Moved!
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            The FreshCart Admin Portal is hosted as a dedicated management website at <strong className="text-gray-900">{ADMIN_URL}</strong> with its own authentication and full store management suite.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href={ADMIN_URL}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 px-6 rounded-xl transition shadow-lg shadow-emerald-600/20"
          >
            <span>Open Dedicated Admin Website</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <a
            href="/"
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-medium py-2 transition"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Return to Customer Storefront (Port 3000)</span>
          </a>
        </div>
      </div>
    </div>
  );
}

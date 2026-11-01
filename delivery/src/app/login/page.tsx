'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, ShieldCheck, Phone, Lock, ArrowRight, Sun, Moon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDeliveryAuth } from '@/context/DeliveryAuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function DeliveryLoginPage() {
  const router = useRouter();
  const { deliveryPerson, login, loading: authLoading } = useDeliveryAuth();
  const { isDark, toggleTheme } = useTheme();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && deliveryPerson) {
      router.push('/');
    }
  }, [deliveryPerson, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please provide your driver email or phone and password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await login(identifier, password);
    setSubmitting(false);

    if (res.success) {
      router.push('/');
    } else {
      setError(res.message || 'Invalid delivery credentials. Please verify your phone/email and password.');
    }
  };

  const handleQuickFill = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto w-full relative">
      {/* Top Navbar */}
      <div className="flex items-center justify-between pt-2 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              FreshCart <span className="text-emerald-600 dark:text-emerald-400">Rider</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Dedicated Delivery Fleet App
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm hover:text-emerald-600 transition"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none my-auto">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-3 border border-emerald-200/60 dark:border-emerald-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Driver Portal (No OTP Confirmation)</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Sign in to start deliveries
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access your assigned orders across Gujarat with direct one-click self-confirmation.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Email or Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. amit.delivery@freshcart.com or 9825000001"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 mt-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <>
                <span>Sign In to Delivery App</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Autofill */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Demo Driver One-Click Fill
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('amit.delivery@freshcart.com', 'Delivery@123')}
              className="w-full text-left p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition flex items-center justify-between group"
            >
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block group-hover:text-emerald-600">
                  Amit Dave
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Motorcycle (GJ-01-AB-1234) • amit.delivery@freshcart.com
                </span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-60 group-hover:opacity-100" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('ketan.delivery@freshcart.com', 'Delivery@123')}
              className="w-full text-left p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition flex items-center justify-between group"
            >
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block group-hover:text-emerald-600">
                  Ketan Solanki
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  EV Scooter (GJ-01-CD-5678) • ketan.delivery@freshcart.com
                </span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-60 group-hover:opacity-100" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('bhavin.delivery@freshcart.com', 'Delivery@123')}
              className="w-full text-left p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition flex items-center justify-between group"
            >
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block group-hover:text-emerald-600">
                  Bhavin Shah
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Delivery Van (GJ-27-EF-9012) • bhavin.delivery@freshcart.com
                </span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-60 group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-4 text-[11px] text-slate-500 dark:text-slate-400">
        <span>Delivery confirmation uses independent authenticated verification. </span>
        <strong className="text-emerald-600 dark:text-emerald-400">No OTP required.</strong>
      </div>
    </div>
  );
}


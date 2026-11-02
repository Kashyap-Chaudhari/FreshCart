'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, Mail, Lock, ShieldCheck, ArrowRight, User as UserIcon, History } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';
  const isOrdering = redirectTarget.includes('checkout') || redirectTarget.includes('cart');

  const { loginWithEmail, verifyOtpAndLogin, registerUser } = useAuth();

  const [tab, setTab] = useState<'OTP' | 'EMAIL' | 'REGISTER'>('OTP');

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');

  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      setMessage({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const res = await api.requestOtp(phone);
    setIsLoading(false);

    if (res.success) {
      setOtpSent(true);
      setMessage({ type: 'success', text: '6-digit OTP has been sent to your mobile.' });
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp);
      }
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to send OTP.' });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the 6-digit OTP.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const res = await verifyOtpAndLogin(phone, otp, customerName || undefined);
    setIsLoading(false);

    if (res.success) {
      router.push(redirectTarget);
    } else {
      setMessage({ type: 'error', text: res.message || 'Verification failed.' });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const res = await loginWithEmail(email, password);
    setIsLoading(false);

    if (res.success) {
      router.push(redirectTarget);
    } else {
      setMessage({ type: 'error', text: res.message || 'Invalid email or password.' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const res = await registerUser({
      name: regName,
      phone: regPhone,
      email: regEmail || undefined,
      password: regPassword,
    });
    setIsLoading(false);

    if (res.success) {
      router.push(redirectTarget);
    } else {
      setMessage({ type: 'error', text: res.message || 'Registration failed.' });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {isOrdering && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl p-4 shadow-sm flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              Customer Sign In Required to Place Order
            </h3>
            <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">
              Please log in or register below. Afterwards, you will be taken directly back to checkout to confirm your order.
            </p>
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md">
          FC
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Welcome to FreshCart</h1>
        <p className="text-xs text-gray-500">
          Sign in to save delivery addresses and track past orders
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Tab switchers */}
        <div className="grid grid-cols-3 bg-gray-100 p-1 rounded-2xl text-xs font-bold text-gray-600">
          <button
            onClick={() => {
              setTab('OTP');
              setMessage(null);
            }}
            className={`py-2 rounded-xl transition ${
              tab === 'OTP' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-gray-900'
            }`}
          >
            Phone OTP
          </button>
          <button
            onClick={() => {
              setTab('EMAIL');
              setMessage(null);
            }}
            className={`py-2 rounded-xl transition ${
              tab === 'EMAIL' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-gray-900'
            }`}
          >
            Email Login
          </button>
          <button
            onClick={() => {
              setTab('REGISTER');
              setMessage(null);
            }}
            className={`py-2 rounded-xl transition ${
              tab === 'REGISTER' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-gray-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-medium ${
              message.type === 'error'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* TAB 1: PHONE OTP */}
        {tab === 'OTP' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mobile Number (10 digits)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full text-xs border border-gray-300 rounded-xl pl-12 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    We will send a 6-digit confirmation code via SMS.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.length !== 10}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-md"
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Enter 6-Digit OTP sent to +91 {phone}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-lg font-black border border-gray-300 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {devOtpHint && (
                    <div className="mt-1.5">
                      <button
                        type="button"
                        onClick={() => setOtp(devOtpHint)}
                        className="text-[11px] text-emerald-700 font-extrabold hover:underline inline-flex items-center gap-1"
                      >
                        <span>⚡ One-Click Auto-Fill Demo OTP:</span>
                        <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800 font-bold">{devOtpHint}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Your Name (Optional for first-time login)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-1/3 bg-gray-100 text-gray-700 font-bold py-3 px-2 rounded-xl text-xs hover:bg-gray-200"
                  >
                    Change #
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-md"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: EMAIL LOGIN (Customer / Staff / Owner) */}
        {tab === 'EMAIL' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@freshcart.com"
                className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* 1-Click Demo Accounts */}
            <div className="pt-1 space-y-1.5">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                ⚡ 1-Click Fill Demo Credentials:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('customer@example.com');
                    setPassword('CustomerPass@2026');
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition text-left flex items-center justify-between"
                >
                  <span>👤 Priya Patel (Customer)</span>
                  <span className="text-[10px] text-emerald-600 font-mono">Fill →</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('owner@freshcart.com');
                    setPassword('OwnerPass@2026');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold hover:bg-slate-200 transition text-left flex items-center justify-between"
                >
                  <span>👑 Store Owner / Admin</span>
                  <span className="text-[10px] text-slate-500 font-mono">Fill →</span>
                </button>
              </div>
              <p className="text-[11px] text-gray-500 italic">
                * You can also type ANY real email & password to sign in or register below!
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-md"
            >
              {isLoading ? 'Logging In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* TAB 3: REGISTER NEW CUSTOMER */}
        {tab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile (10 digits) *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="ramesh@example.com"
                className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Create Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-md mt-2"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>

      {/* Quick Track Order Link for Guests or returning mobile shoppers */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/40 rounded-3xl p-4 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-gray-900 dark:text-white block truncate">Looking for past orders?</span>
            <span className="text-[11px] text-gray-500 dark:text-slate-400 block truncate">Track orders placed on this device or Order #</span>
          </div>
        </div>
        <Link
          href="/orders"
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold hover:bg-emerald-50 transition shrink-0 shadow-xs"
        >
          View Orders →
        </Link>
      </div>

      <div className="text-center">
        <Link href="/" className="text-xs text-gray-500 hover:text-emerald-700">
          ← Return to Store
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-20 text-center text-xs text-gray-400">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading secure sign-in...</span>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}


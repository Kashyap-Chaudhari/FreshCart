'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, Mail, Lock, ShieldCheck, ArrowRight, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
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
      router.push('/');
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
      router.push('/');
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
      router.push('/');
    } else {
      setMessage({ type: 'error', text: res.message || 'Registration failed.' });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
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
                    <p className="text-[11px] text-emerald-700 font-mono mt-1">
                      Dev OTP Hint: <strong>{devOtpHint}</strong>
                    </p>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-md"
            >
              {isLoading ? 'Logging In...' : 'Sign In'}
            </button>

            <div className="pt-2 text-center text-[11px] text-gray-400">
              Demo Owner: <code>owner@freshcart.com</code> / <code>OwnerPass@2026</code>
            </div>
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

      <div className="text-center">
        <Link href="/" className="text-xs text-gray-500 hover:text-emerald-700">
          ← Return to Store
        </Link>
      </div>
    </div>
  );
}

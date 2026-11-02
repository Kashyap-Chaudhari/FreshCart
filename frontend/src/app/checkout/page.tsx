'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Check,
  Zap,
  Phone,
  User,
  CreditCard,
  Banknote,
  Home,
  Building,
  Lock,
  X,
  Mail,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const DELIVERY_SLOTS = [
  '⚡ Express 10-15 Mins Delivery (Immediate Dispatch)',
  'Morning Slot (8:00 AM - 11:00 AM)',
  'Afternoon Slot (1:00 PM - 4:00 PM)',
  'Evening Slot (5:00 PM - 8:00 PM)',
];

const DELIVERY_INSTRUCTIONS = [
  'Leave at doorstep',
  'Do not ring bell',
  'Avoid calling',
  'Leave with security / guard',
  'Directions: Landmark near gate',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, totalItems } = useCart();
  const { user, isLoading: authLoading, loginWithEmail, verifyOtpAndLogin } = useAuth();

  // Quick In-Checkout Login Modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [quickLoginTab, setQuickLoginTab] = useState<'OTP' | 'EMAIL'>('OTP');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickOtp, setQuickOtp] = useState('');
  const [quickOtpSent, setQuickOtpSent] = useState(false);
  const [quickDevOtp, setQuickDevOtp] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickPassword, setQuickPassword] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [loginSuccessNotice, setLoginSuccessNotice] = useState('');

  // Customer contact
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  // Shipping Address
  const defaultAddr = user?.addresses?.find((a: any) => a.isDefault) || user?.addresses?.[0];
  const [street, setStreet] = useState(defaultAddr?.street || '');
  const [landmark, setLandmark] = useState(defaultAddr?.landmark || '');
  const [city, setCity] = useState(defaultAddr?.city || 'Ahmedabad');
  const [state, setState] = useState(defaultAddr?.state || 'Gujarat');
  const [pincode, setPincode] = useState(defaultAddr?.pincode || '380015');

  // Update contact & address when user logs in
  useEffect(() => {
    if (user) {
      if (user.name) setCustomerName(user.name);
      if (user.phone) setCustomerPhone(user.phone);
      if (user.email) setCustomerEmail(user.email);
      const def = user.addresses?.find((a: any) => a.isDefault) || user.addresses?.[0];
      if (def) {
        if (def.street) setStreet(def.street);
        if (def.landmark) setLandmark(def.landmark);
        if (def.city) setCity(def.city);
        if (def.state) setState(def.state);
        if (def.pincode) setPincode(def.pincode);
      }
    }
  }, [user]);

  // Delivery Preferences
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [deliverySlot, setDeliverySlot] = useState(DELIVERY_SLOTS[0]);
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [orderNotes, setOrderNotes] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');

  // Pincode validation state
  const [pincodeArea, setPincodeArea] = useState<any>(null);
  const [isPincodeValid, setIsPincodeValid] = useState<boolean | null>(null);
  const [pincodeMessage, setPincodeMessage] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Check pincode on change
  useEffect(() => {
    if (pincode && pincode.length === 6) {
      api.checkPincode(pincode).then((res) => {
        if (res.success && res.data) {
          const deliverable = res.data.isDeliverable ?? res.data.isAvailable ?? true;
          if (deliverable) {
            setIsPincodeValid(true);
            setPincodeArea(res.data);
            setPincodeMessage(
              `✓ Serviceable: ${res.data.areaName || 'Gujarat Hub'} (${res.data.city || 'Gujarat'}) - 10-15 mins express delivery`
            );
            if (res.data.city) setCity(res.data.city);
            if (res.data.state) setState(res.data.state);
          } else {
            setIsPincodeValid(false);
            setPincodeArea(null);
            setPincodeMessage(res.data.message || 'Delivery is available across Gujarat (e.g. 380015, 380054, 395001).');
          }
        } else {
          // If 6 digits, mark valid as fallback
          setIsPincodeValid(true);
          setPincodeMessage('✓ Express 10-15 mins grocery delivery available');
        }
      }).catch(() => {
        setIsPincodeValid(true);
        setPincodeMessage('✓ Express 10-15 mins grocery delivery available');
      });
    } else {
      setIsPincodeValid(null);
      setPincodeArea(null);
      setPincodeMessage('');
    }
  }, [pincode]);

  // Delivery charge calculation
  let deliveryCharge = 0;
  if (deliveryType === 'DELIVERY') {
    if (subtotal >= 499) {
      deliveryCharge = 0;
    } else if (pincodeArea) {
      deliveryCharge = pincodeArea.deliveryCharge || 29;
    } else {
      deliveryCharge = 29;
    }
  }

  // Coupon discount calculation
  const couponDiscount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryCharge);

  const toggleInstruction = (inst: string) => {
    if (selectedInstructions.includes(inst)) {
      setSelectedInstructions(selectedInstructions.filter((i) => i !== inst));
    } else {
      setSelectedInstructions([...selectedInstructions, inst]);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const res = await api.validateCoupon(couponCode.trim(), subtotal);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
      } else {
        setCouponError(res.message || 'Invalid coupon code.');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Error validating coupon. Please try again.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleSendQuickOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setQuickError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setQuickLoading(true);
    setQuickError('');
    try {
      const res = await api.requestOtp(clean);
      if (res.success) {
        setQuickOtpSent(true);
        if (res.data?.devOtp) setQuickDevOtp(res.data.devOtp);
      } else {
        setQuickError(res.message || 'Failed to send OTP.');
      }
    } catch {
      setQuickError('Failed to send OTP. Please check your network.');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleVerifyQuickOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickOtp || quickOtp.length !== 6) {
      setQuickError('Please enter the 6-digit OTP code.');
      return;
    }
    setQuickLoading(true);
    setQuickError('');
    try {
      const clean = quickPhone.replace(/\D/g, '').slice(-10);
      const res = await verifyOtpAndLogin(clean, quickOtp, quickName || undefined);
      if (res.success) {
        setShowLoginModal(false);
        setSubmitError('');
        setLoginSuccessNotice('✓ Successfully logged in! You can now place and confirm your order below.');
      } else {
        setQuickError(res.message || 'Incorrect OTP code.');
      }
    } catch {
      setQuickError('OTP verification failed.');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleQuickEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEmail || !quickPassword) {
      setQuickError('Please enter both email and password.');
      return;
    }
    setQuickLoading(true);
    setQuickError('');
    try {
      const res = await loginWithEmail(quickEmail, quickPassword);
      if (res.success) {
        setShowLoginModal(false);
        setSubmitError('');
        setLoginSuccessNotice('✓ Successfully logged in! You can now place and confirm your order below.');
      } else {
        setQuickError(res.message || 'Invalid email or password.');
      }
    } catch {
      setQuickError('Sign-in failed. Please try again.');
    } finally {
      setQuickLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || isSubmitting) return;

    // Enforce login requirement: customer cannot order without logging in
    if (!user) {
      setSubmitError('First please do login. Afterwards you can give or confirm order.');
      setShowLoginModal(true);
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setSubmitError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (deliveryType === 'DELIVERY') {
      const cleanPin = pincode.replace(/\D/g, '');
      if (cleanPin.length !== 6) {
        setSubmitError('Please enter a 6-digit PIN code (e.g. 380015, 380054, 395001).');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError('');

    const combinedNotes = [
      orderNotes.trim(),
      selectedInstructions.length > 0 ? `Instructions: ${selectedInstructions.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const orderPayload = {
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      customerEmail: customerEmail.trim() || undefined,
      shippingAddress: {
        street: street.trim(),
        landmark: landmark.trim() || undefined,
        city: city.trim() || 'Ahmedabad',
        state: state.trim() || 'Gujarat',
        pincode: pincode.trim(),
      },
      deliveryType,
      deliverySlot: deliveryType === 'DELIVERY' ? deliverySlot : 'Store Pickup (Counter)',
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      notes: combinedNotes || undefined,
      paymentMethod,
      items: items.map((it) => ({
        productId: it.product.id,
        quantity: it.quantity,
      })),
    };

    try {
      const res = await api.checkout(orderPayload);
      if (res.success && res.data) {
        // Persist guest order reference in local storage for instant tracking without login
        try {
          const guestOrders = JSON.parse(localStorage.getItem('freshcart_guest_orders') || '[]');
          const filtered = guestOrders.filter((o: any) => o.id !== res.data.id && o.orderNumber !== res.data.orderNumber);
          filtered.unshift({
            id: res.data.id,
            orderNumber: res.data.orderNumber,
            placedAt: new Date().toISOString(),
          });
          localStorage.setItem('freshcart_guest_orders', JSON.stringify(filtered.slice(0, 30)));
        } catch {
          // ignore storage errors
        }

        clearCart();
        router.push(`/orders/${res.data.id}?confirmed=true`);
      } else {
        setSubmitError(res.message || 'Failed to place order. Please review your cart.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network error placing order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-brand-soft text-brand-primary flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-brand-text dark:text-white">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Please add items to your cart before proceeding to checkout.</p>
        <Link
          href="/products"
          className="inline-block bg-brand-primary text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-md shadow-brand-primary/20"
        >
          Browse Groceries
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1720px] mx-auto px-2.5 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-6 space-y-6 pb-24 lg:pb-8 w-full min-w-0">
      {/* Title */}
      <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black text-brand-text dark:text-white tracking-tight">
          Quick Express Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Fast doorstep delivery in 10-15 minutes across Gujarat with Cash on Delivery
        </p>
      </div>

      {loginSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{loginSuccessNotice}</span>
          </div>
          <button onClick={() => setLoginSuccessNotice('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Customer Authentication Status Banner */}
      {!user ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider">
                  Login Required
                </span>
                <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">
                  Customer Sign In Required to Place Order
                </h3>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1">
                Without login customer cannot place or confirm order. <strong>First please do login, afterwards you can give order.</strong> Your cart items are safely reserved.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20 transition whitespace-nowrap flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login First to Order</span>
            </button>
            <Link
              href="/login?redirect=/checkout"
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold text-xs hover:bg-amber-100/50 transition whitespace-nowrap flex items-center gap-1"
            >
              <span>Full Page</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Verified Customer Account</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Ordering as <strong>{user.name}</strong> ({user.phone || user.email})
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            ✓ Logged In & Ready to Confirm
          </span>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Contact Information */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-card space-y-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-xl bg-brand-soft text-brand-primary text-xs font-black flex items-center justify-center">
                1
              </span>
              Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Priya Patel"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number * (10-digit Indian Mobile)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400 font-mono">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address (Optional for PDF tax invoice receipt)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Delivery Address & Gujarat Area */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-card space-y-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-xl bg-brand-soft text-brand-primary text-xs font-black flex items-center justify-center">
                2
              </span>
              Delivery Address in Gujarat
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Flat / House / Building / Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Flat 402, Shivalik Residency, Vastrapur Lake Road"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near AlphaOne Mall / Opp SG Highway"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  6-Digit Gujarat PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="380015"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  disabled
                  value={state}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            {pincodeMessage && (
              <p
                className={`text-xs font-semibold mt-1 flex items-center gap-1.5 ${
                  isPincodeValid ? 'text-brand-primary dark:text-emerald-400' : 'text-rose-600'
                }`}
              >
                {isPincodeValid ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{pincodeMessage}</span>
              </p>
            )}
          </div>

          {/* Step 3: Delivery Preferences & Instructions */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-card space-y-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-xl bg-brand-soft text-brand-primary text-xs font-black flex items-center justify-center">
                3
              </span>
              Delivery Preferences
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Choose Delivery Slot
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DELIVERY_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setDeliverySlot(slot)}
                    className={`p-3 rounded-2xl border text-left text-xs font-semibold transition ${
                      deliverySlot === slot
                        ? 'border-brand-primary bg-brand-soft/70 dark:bg-emerald-950/40 text-brand-primary dark:text-emerald-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{slot}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Delivery Instructions Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Delivery Instructions for Rider
              </label>
              <div className="flex flex-wrap gap-2">
                {DELIVERY_INSTRUCTIONS.map((inst) => {
                  const isSelected = selectedInstructions.includes(inst);
                  return (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => toggleInstruction(inst)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                        isSelected
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {inst}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 4: Payment Method Selection */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-card space-y-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-xl bg-brand-soft text-brand-primary text-xs font-black flex items-center justify-center">
                4
              </span>
              Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                  paymentMethod === 'COD'
                    ? 'border-brand-primary bg-brand-soft/70 dark:bg-emerald-950/40 text-brand-primary dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-xs block">Cash on Delivery (COD)</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Pay with cash or scan QR code when your rider arrives at doorstep
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('ONLINE')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${
                  paymentMethod === 'ONLINE'
                    ? 'border-brand-primary bg-brand-soft/70 dark:bg-emerald-950/40 text-brand-primary dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-xs block">UPI / Online Payment</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Google Pay, PhonePe, Paytm, Debit/Credit Card or NetBanking
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="space-y-4">
          {/* Coupon Input Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-card space-y-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-primary" />
              Apply Coupon
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Code: FRESH15"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={validatingCoupon || !couponCode}
                className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs transition disabled:opacity-50"
              >
                {validatingCoupon ? 'Validating...' : 'Apply'}
              </button>
            </div>

            {appliedCoupon && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex justify-between items-center">
                <span className="font-bold">
                  "{appliedCoupon.code}" applied! Saved ₹{appliedCoupon.discountAmount}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode('');
                  }}
                  className="text-slate-400 hover:text-rose-500"
                >
                  Remove
                </button>
              </div>
            )}

            {couponError && (
              <p className="text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{couponError}</span>
              </p>
            )}
          </div>

          {/* Items Summary & Totals */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-card space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Order Summary ({totalItems} items)
            </h3>

            {/* Items Mini List */}
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border-b border-slate-100 dark:border-slate-800 pb-3">
              {items.map((it) => (
                <div key={it.product.id} className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                    <strong>{it.quantity}x</strong> {it.product.name}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{(Number(it.product.price) * it.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill Rows */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{subtotal.toFixed(0)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-brand-primary dark:text-emerald-400 font-bold">
                  <span>Coupon Discount</span>
                  <span className="font-mono">- ₹{couponDiscount.toFixed(0)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Express Delivery Fee</span>
                <span className="font-mono font-bold">
                  {deliveryCharge === 0 ? (
                    <strong className="text-brand-primary dark:text-emerald-400">FREE</strong>
                  ) : (
                    `₹${deliveryCharge}`
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center font-black text-sm text-slate-900 dark:text-white">
                <span>Amount to Pay</span>
                <span className="font-mono text-xl text-brand-primary dark:text-emerald-400">
                  ₹{grandTotal.toFixed(0)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className={`w-full py-4 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98 disabled:opacity-50 ${
                !user
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25 ring-2 ring-amber-400'
                  : 'bg-brand-primary hover:bg-brand-deep text-white shadow-brand-primary/25'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing Order...
                </span>
              ) : !user ? (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Login First to Confirm Order (₹{grandTotal.toFixed(0)})</span>
                </span>
              ) : (
                <>
                  <span>Confirm & Place Order (₹{grandTotal.toFixed(0)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-1 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
              <span>Safe & Secure Instant Order Confirmation</span>
            </div>
          </div>
        </div>
      </form>

      {/* Quick Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Lock className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Please Login First
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sign in to confirm and place your order
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Customer cannot place order without login. First please sign in below. Afterwards your order can be confirmed!</span>
            </div>

            {quickError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs font-semibold">
                {quickError}
              </div>
            )}

            {/* Quick Login Tabs */}
            <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => {
                  setQuickLoginTab('OTP');
                  setQuickError('');
                }}
                className={`py-2 rounded-lg transition ${
                  quickLoginTab === 'OTP'
                    ? 'bg-white dark:bg-slate-900 text-brand-primary dark:text-emerald-400 shadow-sm'
                    : 'hover:text-slate-900'
                }`}
              >
                Mobile OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickLoginTab('EMAIL');
                  setQuickError('');
                }}
                className={`py-2 rounded-lg transition ${
                  quickLoginTab === 'EMAIL'
                    ? 'bg-white dark:bg-slate-900 text-brand-primary dark:text-emerald-400 shadow-sm'
                    : 'hover:text-slate-900'
                }`}
              >
                Email & Password
              </button>
            </div>

            {quickLoginTab === 'OTP' ? (
              <form onSubmit={quickOtpSent ? handleVerifyQuickOtp : handleSendQuickOtp} className="space-y-3">
                {!quickOtpSent ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Enter 10-Digit Mobile Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                        <input
                          type="tel"
                          maxLength={10}
                          value={quickPhone}
                          onChange={(e) => setQuickPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="9876543210"
                          required
                          className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={quickLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      {quickLoading ? 'Sending OTP...' : 'Send OTP & Continue'}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Enter 6-Digit OTP sent to +91 {quickPhone}
                        </label>
                        <button
                          type="button"
                          onClick={() => setQuickOtpSent(false)}
                          className="text-[10px] text-brand-primary font-bold hover:underline"
                        >
                          Change Number
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={quickOtp}
                        onChange={(e) => setQuickOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        required
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-center text-lg font-mono font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                      <div className="flex items-center justify-between mt-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickOtp(quickDevOtp || '123456')}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline inline-flex items-center gap-1"
                        >
                          <span>⚡ One-Click Auto-Fill OTP:</span>
                          <span className="font-mono bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-200">{quickDevOtp || '123456'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Your Full Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        placeholder="Priya Patel"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={quickLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      {quickLoading ? 'Verifying...' : 'Verify OTP & Confirm Order'}
                    </button>
                  </>
                )}
              </form>
            ) : (
              <form onSubmit={handleQuickEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={quickEmail}
                    onChange={(e) => setQuickEmail(e.target.value)}
                    placeholder="customer@example.com"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={quickPassword}
                    onChange={(e) => setQuickPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                  />
                </div>

                {/* 1-click test fill buttons */}
                <div className="pt-1 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Quick One-Click Demo Accounts:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickEmail('customer@example.com');
                        setQuickPassword('CustomerPass@2026');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold hover:bg-emerald-100 transition"
                    >
                      👤 Priya Patel (Customer Demo)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickEmail('owner@freshcart.com');
                        setQuickPassword('OwnerPass@2026');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-bold hover:bg-slate-200 transition"
                    >
                      👑 Store Owner Demo
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={quickLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold text-xs transition disabled:opacity-50 shadow-sm"
                >
                  {quickLoading ? 'Signing In...' : 'Sign In & Confirm Order'}
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                href="/login?redirect=/checkout"
                className="text-xs text-brand-primary dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Or open full login / registration page</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

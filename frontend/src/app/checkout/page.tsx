'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Tag,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const DELIVERY_SLOTS = [
  'Express 2-Hour Delivery (Immediate dispatch)',
  'Morning Slot (8:00 AM - 11:00 AM)',
  'Afternoon Slot (1:00 PM - 4:00 PM)',
  'Evening Slot (5:00 PM - 8:00 PM)',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  // Customer contact
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  // Shipping Address
  const defaultAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
  const [street, setStreet] = useState(defaultAddr?.street || '');
  const [landmark, setLandmark] = useState(defaultAddr?.landmark || '');
  const [city, setCity] = useState(defaultAddr?.city || 'Bengaluru');
  const [state, setState] = useState(defaultAddr?.state || 'Karnataka');
  const [pincode, setPincode] = useState(defaultAddr?.pincode || '560034');

  // Options
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [deliverySlot, setDeliverySlot] = useState(DELIVERY_SLOTS[0]);
  const [orderNotes, setOrderNotes] = useState('');

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
          if (res.data.isDeliverable) {
            setIsPincodeValid(true);
            setPincodeArea(res.data);
            setPincodeMessage(`Express delivery available in ${res.data.areaName}!`);
          } else {
            setIsPincodeValid(false);
            setPincodeArea(null);
            setPincodeMessage(res.data.message || 'We currently do not deliver to this pincode.');
          }
        }
      });
    } else {
      setIsPincodeValid(null);
      setPincodeArea(null);
      setPincodeMessage('');
    }
  }, [pincode]);

  // Delivery charge calculation
  let deliveryCharge = 0;
  if (deliveryType === 'DELIVERY' && pincodeArea) {
    if (pincodeArea.freeDeliveryAbove && subtotal >= pincodeArea.freeDeliveryAbove) {
      deliveryCharge = 0;
    } else {
      deliveryCharge = pincodeArea.deliveryCharge || 40;
    }
  }

  // Coupon discount calculation
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryCharge);
  const minOrderRequired = pincodeArea?.minOrderValue || 0;
  const isMinOrderMet = deliveryType === 'PICKUP' || subtotal >= minOrderRequired;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setValidatingCoupon(true);
    setCouponError('');

    const res = await api.validateCoupon(couponCode.trim(), subtotal);
    setValidatingCoupon(false);

    if (res.success && res.data) {
      setAppliedCoupon(res.data);
    } else {
      setCouponError(res.message || 'Invalid coupon code.');
      setAppliedCoupon(null);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (deliveryType === 'DELIVERY' && !isPincodeValid) {
      setSubmitError('Please enter a serviceable PIN code to proceed with delivery.');
      return;
    }

    if (!isMinOrderMet) {
      setSubmitError(`Minimum order value for ${pincodeArea?.areaName || 'delivery'} is ₹${minOrderRequired}.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const orderPayload = {
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      shippingAddress: {
        street,
        landmark: landmark || undefined,
        city,
        state,
        pincode,
      },
      deliveryType,
      deliverySlot: deliveryType === 'DELIVERY' ? deliverySlot : 'Store Pickup (Counter)',
      couponCode: appliedCoupon ? appliedCoupon.code : undefined,
      notes: orderNotes || undefined,
      paymentMethod: 'COD',
      items: items.map((it) => ({
        productId: it.product.id,
        quantity: it.quantity,
      })),
    };

    const res = await api.checkout(orderPayload);
    setIsSubmitting(false);

    if (res.success && res.data) {
      clearCart();
      router.push(`/orders/${res.data.id}?confirmed=true`);
    } else {
      setSubmitError(res.message || 'Failed to place order. Please review your cart.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-gray-900">Your Cart is Empty</h2>
        <p className="text-xs text-gray-500">Please add items to your cart before proceeding to checkout.</p>
        <Link
          href="/products"
          className="inline-block bg-emerald-600 text-white font-bold text-xs px-6 py-3 rounded-xl"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Checkout</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Review your address, delivery preferences, and payment details
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                1
              </span>
              Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210"
                  className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address (Optional for bill copy)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Delivery or Pickup Selection */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                2
              </span>
              Delivery Method
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDeliveryType('DELIVERY')}
                className={`p-4 rounded-2xl border text-left transition ${
                  deliveryType === 'DELIVERY'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <h4 className="font-bold text-sm text-gray-900">Doorstep Delivery</h4>
                <p className="text-[11px] text-gray-500 mt-1">2-hour express delivery to your home or office</p>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('PICKUP')}
                className={`p-4 rounded-2xl border text-left transition ${
                  deliveryType === 'PICKUP'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <h4 className="font-bold text-sm text-gray-900">Store Pickup</h4>
                <p className="text-[11px] text-gray-500 mt-1">Pick up fresh at store counter (Zero delivery charge)</p>
              </button>
            </div>

            {/* Address fields */}
            {deliveryType === 'DELIVERY' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Postal PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 560034"
                      className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                    {pincodeMessage && (
                      <p
                        className={`text-[11px] mt-1 font-medium flex items-center gap-1 ${
                          isPincodeValid ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {isPincodeValid ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {pincodeMessage}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Preferred Delivery Slot *
                    </label>
                    <select
                      value={deliverySlot}
                      onChange={(e) => setDeliverySlot(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {DELIVERY_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Flat / House No., Apartment & Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. Flat 301, Lakeview Residency, 8th Main Road"
                      className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Sony World Signal"
                      className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      City & State
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-xl p-3 bg-gray-50"
                      />
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-xl p-3 bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Order Delivery Notes (Optional)
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g. Ring the doorbell, leave at security desk if unavailable"
                className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                3
              </span>
              Payment Method
            </h2>

            <div className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  COD
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">Cash on Delivery (COD)</h4>
                  <p className="text-xs text-gray-500">Pay cash or UPI directly to our delivery executive</p>
                </div>
              </div>
              <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              * Note: Online Card & UPI gateway integration slots are extensible and ready for production payment hooks.
            </p>
          </div>
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div className="lg:col-span-1 space-y-6">
          {/* Coupon Box */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              Apply Coupon Code
            </h3>

            {appliedCoupon ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 text-xs">{appliedCoupon.code}</span>
                  <p className="text-[11px] text-emerald-700">₹{appliedCoupon.discountAmount} saved!</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs text-red-600 font-semibold hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. FRESH15)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 text-xs border border-gray-300 rounded-xl px-3 py-2 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCode.trim()}
                    className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                  >
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-rose-600">{couponError}</p>}
                <div className="text-[11px] text-gray-400">
                  Try: <strong className="text-gray-600">FRESH15</strong> (15% off) or{' '}
                  <strong className="text-gray-600">FLAT50</strong> (₹50 off)
                </div>
              </div>
            )}
          </div>

          {/* Bill Breakdown */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base pb-3 border-b border-gray-100">
              Bill Breakdown
            </h3>

            {/* Mini items list */}
            <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 text-xs">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="py-2 flex justify-between">
                  <span className="text-gray-700 truncate max-w-[180px]">
                    {product.name} × {quantity}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₹{(Number(product.price) * quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount</span>
                  <span>- ₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-medium text-emerald-700">
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline font-bold">
              <span className="text-gray-900 text-sm">Payable on Delivery</span>
              <span className="text-2xl font-black text-emerald-700">₹{grandTotal.toFixed(2)}</span>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (deliveryType === 'DELIVERY' && !isPincodeValid)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
            >
              {isSubmitting ? (
                <span>Locking Inventory & Placing Order...</span>
              ) : (
                <>
                  <span>Confirm Order (COD ₹{grandTotal.toFixed(0)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure Grocery Transaction</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Check, X } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(299);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(100);
  const [usageLimit, setUsageLimit] = useState<number | undefined>(500);

  const loadCoupons = () => {
    api.adminGetCoupons().then((res) => {
      if (res.success && res.data) setCoupons(res.data);
    });
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code,
      description,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usageLimit: usageLimit ? Number(usageLimit) : null,
    };

    const res = await api.adminCreateCoupon(payload);
    if (res.success) {
      setShowModal(false);
      setCode('');
      setDescription('');
      loadCoupons();
    }
  };

  const handleToggle = async (c: any) => {
    await api.adminUpdateCoupon(c.id, { isActive: !c.isActive });
    loadCoupons();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Coupons & Promo Offers</h1>
          <p className="text-xs text-gray-500 mt-0.5">Configure discounts, usage caps, and cart thresholds</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 font-mono">
                {c.code}
              </span>
              <button
                onClick={() => handleToggle(c)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {c.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>

            <p className="text-xs text-gray-700 font-medium">{c.description}</p>

            <div className="pt-2 border-t border-gray-100 text-xs space-y-1 text-gray-500">
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="font-bold text-gray-900">
                  {c.discountType === 'PERCENTAGE' ? `${Number(c.discountValue)}% OFF` : `₹${Number(c.discountValue)} FLAT`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Min Order Value</span>
                <span>₹{Number(c.minOrderValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Times Used</span>
                <span className="font-bold text-emerald-800">
                  {c.timesUsed} {c.usageLimit ? `/ ${c.usageLimit}` : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Create Discount Coupon</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER20"
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5 font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. 20% off on first order"
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5 bg-white font-medium"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(parseFloat(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    value={maxDiscount || ''}
                    onChange={(e) => setMaxDiscount(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Optional"
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl shadow-sm"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('FreshCart Supermarket');
  const [tagLine, setTagLine] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [gstin, setGstin] = useState('');
  const [fssai, setFssai] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [invoiceNextNumber, setInvoiceNextNumber] = useState(1001);
  const [invoiceFooterText, setInvoiceFooterText] = useState('');
  const [minOrderValue, setMinOrderValue] = useState(199);
  const [defaultDeliveryCharge, setDefaultDeliveryCharge] = useState(40);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    api.getStoreSettings().then((res) => {
      if (res.success && res.data) {
        const s = res.data;
        setStoreName(s.storeName || '');
        setTagLine(s.tagLine || '');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setAddress(s.address || '');
        setOpeningHours(s.openingHours || '');
        setGstin(s.gstin || '');
        setFssai(s.fssai || '');
        setInvoicePrefix(s.invoicePrefix || 'INV-');
        setInvoiceNextNumber(s.invoiceNextNumber || 1001);
        setInvoiceFooterText(s.invoiceFooterText || '');
        setMinOrderValue(Number(s.minOrderValue) || 199);
        setDefaultDeliveryCharge(Number(s.defaultDeliveryCharge) || 40);
      }
      setIsLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const payload = {
      storeName,
      tagLine,
      phone,
      email,
      address,
      openingHours,
      gstin,
      fssai,
      invoicePrefix,
      invoiceNextNumber: Number(invoiceNextNumber),
      invoiceFooterText,
      minOrderValue: Number(minOrderValue),
      defaultDeliveryCharge: Number(defaultDeliveryCharge),
    };

    const res = await api.adminUpdateSettings(payload);
    setIsSaving(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Store settings and tax configuration saved successfully!' });
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to save settings.' });
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-gray-400">Loading store settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Store Configuration & Tax Settings</h1>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
            Owner Only
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage official store details, invoice prefix, GSTIN/FSSAI, and customer support channels
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold ${
            message.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Section 1: Store identity */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
            Store Identity & Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl p-3 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl p-3"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Support Phone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl p-3 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Support Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl p-3"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Physical Store Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl p-3"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store Opening Hours *</label>
              <input
                type="text"
                required
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl p-3"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Statutory and Invoicing */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
            Tax Compliance & Invoicing Prefix
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store GSTIN *</label>
              <input
                type="text"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full text-xs border border-gray-300 rounded-xl p-3 font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">FSSAI License Number</label>
              <input
                type="text"
                value={fssai}
                onChange={(e) => setFssai(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl p-3 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Prefix *</label>
              <input
                type="text"
                required
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                className="w-full text-xs border border-gray-300 rounded-xl p-3 font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Next Sequence Integer</label>
              <input
                type="number"
                required
                value={invoiceNextNumber}
                onChange={(e) => setInvoiceNextNumber(parseInt(e.target.value, 10))}
                className="w-full text-xs border border-gray-300 rounded-xl p-3 font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Footer / Return Policy</label>
              <textarea
                rows={2}
                value={invoiceFooterText}
                onChange={(e) => setInvoiceFooterText(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl p-3"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Fallback Rates */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
            Default Order Rules
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Default Min Order (₹)</label>
              <input
                type="number"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(parseFloat(e.target.value))}
                className="w-full text-xs border border-gray-300 rounded-xl p-3"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Default Delivery Fee (₹)</label>
              <input
                type="number"
                value={defaultDeliveryCharge}
                onChange={(e) => setDefaultDeliveryCharge(parseFloat(e.target.value))}
                className="w-full text-xs border border-gray-300 rounded-xl p-3"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Store Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, X, Check, Search, Zap, Building2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPincode: string;
  onSelectPincode: (pincode: string, areaName: string) => void;
}

const POPULAR_GUJARAT_HUBS = [
  { city: 'Ahmedabad (Vastrapur / SG Highway)', pincode: '380015', time: '10-15 mins' },
  { city: 'Ahmedabad (Navrangpura / CG Road)', pincode: '380009', time: '12-18 mins' },
  { city: 'Ahmedabad (Bopal / South Bopal)', pincode: '380058', time: '15-20 mins' },
  { city: 'Gandhinagar (Sector 21)', pincode: '382021', time: '15-20 mins' },
  { city: 'Surat (Athwa Lines / Vesu)', pincode: '395007', time: '15-25 mins' },
  { city: 'Vadodara (Alkapuri)', pincode: '390007', time: '15-25 mins' },
  { city: 'Rajkot (Kalawad Road)', pincode: '360005', time: '15-25 mins' },
];

export default function LocationModal({
  isOpen,
  onClose,
  currentPincode,
  onSelectPincode,
}: LocationModalProps) {
  const [inputPincode, setInputPincode] = useState(currentPincode || '380015');
  const [checking, setChecking] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    area?: any;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (pincodeToVerify: string) => {
    if (!pincodeToVerify || pincodeToVerify.length !== 6) {
      setValidationResult({ valid: false, message: 'Please enter a valid 6-digit Gujarat pincode.' });
      return;
    }

    setChecking(true);
    setValidationResult(null);

    try {
      const res = await api.checkPincode(pincodeToVerify);
      if (res.success && res.data) {
        setValidationResult({ valid: true, area: res.data });
        onSelectPincode(pincodeToVerify, res.data.areaName || res.data.city || 'Gujarat');
        setTimeout(() => onClose(), 600);
      } else {
        setValidationResult({
          valid: false,
          message: res.message || 'Delivery is currently not available for this pincode.',
        });
      }
    } catch {
      setValidationResult({
        valid: false,
        message: 'Could not verify delivery area. Please try again.',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-soft text-brand-primary flex items-center justify-center">
              <Zap className="w-5 h-5 fill-brand-primary" />
            </div>
            <div>
              <h3 className="font-extrabold text-brand-text dark:text-white text-base">
                Choose Delivery Location
              </h3>
              <p className="text-xs text-brand-muted dark:text-slate-400">
                Express 10-15 mins delivery across Gujarat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pincode Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(inputPincode);
          }}
          className="mb-4"
        >
          <div className="relative">
            <MapPin className="w-4 h-4 text-brand-primary absolute left-3.5 top-3.5" />
            <input
              type="text"
              maxLength={6}
              value={inputPincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setInputPincode(val);
                if (val.length === 6) {
                  handleVerify(val);
                }
              }}
              placeholder="Enter 6-digit Pincode (e.g. 380015)"
              className="w-full pl-10 pr-24 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
            <button
              type="submit"
              disabled={checking || inputPincode.length !== 6}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-xl bg-brand-primary hover:bg-brand-deep text-white text-xs font-bold transition disabled:opacity-50"
            >
              {checking ? 'Checking...' : 'Check'}
            </button>
          </div>
        </form>

        {/* Validation Result Feedback */}
        {validationResult && (
          <div
            className={`p-3 rounded-2xl mb-4 text-xs flex items-start gap-2 ${
              validationResult.valid
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {validationResult.valid ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Delivery Available!</span>
                  <span>
                    Delivering to {validationResult.area?.areaName || validationResult.area?.city} in 10-15 mins.
                  </span>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{validationResult.message}</span>
              </>
            )}
          </div>
        )}

        {/* Popular Locations Quick Select */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Popular Quick-Delivery Hubs
          </span>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {POPULAR_GUJARAT_HUBS.map((hub) => (
              <button
                key={hub.pincode}
                type="button"
                onClick={() => {
                  setInputPincode(hub.pincode);
                  handleVerify(hub.pincode);
                }}
                className={`w-full text-left p-2.5 rounded-2xl border transition flex items-center justify-between group ${
                  currentPincode === hub.pincode
                    ? 'bg-brand-soft/70 dark:bg-emerald-950/40 border-brand-primary/40'
                    : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block group-hover:text-brand-primary">
                      {hub.city}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      PIN: {hub.pincode}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-brand-primary dark:text-emerald-400 px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-brand-soft dark:border-emerald-900">
                    ⚡ {hub.time}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


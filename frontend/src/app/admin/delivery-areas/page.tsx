'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Check, Edit } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminDeliveryAreasPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [pincode, setPincode] = useState('');
  const [areaName, setAreaName] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [minOrder, setMinOrder] = useState(199);
  const [deliveryCharge, setDeliveryCharge] = useState(40);
  const [freeAbove, setFreeAbove] = useState(599);
  const [hours, setHours] = useState(2);

  const loadAreas = () => {
    api.getDeliveryAreas().then((res) => {
      if (res.success && res.data) setAreas(res.data);
    });
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      pincode,
      areaName,
      city,
      state,
      minOrderValue: Number(minOrder),
      deliveryCharge: Number(deliveryCharge),
      freeDeliveryAbove: freeAbove ? Number(freeAbove) : null,
      estimatedDeliveryHours: Number(hours),
      isDeliverable: true,
    };

    const res = await api.adminCreateDeliveryArea(payload);
    if (res.success) {
      setShowModal(false);
      setPincode('');
      setAreaName('');
      loadAreas();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Delivery Areas & Rates</h1>
          <p className="text-xs text-gray-500 mt-0.5">Define serviceable postal pincodes and delivery fee rules</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Area</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold">
            <tr>
              <th className="py-3 px-4">PIN Code</th>
              <th className="py-3 px-4">Area Name & City</th>
              <th className="py-3 px-4">Min Order</th>
              <th className="py-3 px-4">Delivery Fee</th>
              <th className="py-3 px-4">Free Delivery Above</th>
              <th className="py-3 px-4">SLA (Hours)</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {areas.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/60">
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">{a.pincode}</td>
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-gray-900 block">{a.areaName}</span>
                  <span className="text-[10px] text-gray-400">{a.city}, {a.state}</span>
                </td>
                <td className="py-3.5 px-4">₹{Number(a.minOrderValue).toFixed(0)}</td>
                <td className="py-3.5 px-4">₹{Number(a.deliveryCharge).toFixed(0)}</td>
                <td className="py-3.5 px-4 font-bold text-emerald-700">
                  {a.freeDeliveryAbove ? `₹${Number(a.freeDeliveryAbove).toFixed(0)}` : 'N/A'}
                </td>
                <td className="py-3.5 px-4">{a.estimatedDeliveryHours} Hours</td>
                <td className="py-3.5 px-4">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Deliverable
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Add Serviceable Pincode</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="560034"
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery SLA (Hrs)</label>
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value, 10))}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Area / Locality Name *</label>
                <input
                  type="text"
                  required
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g. Indiranagar (100ft Road)"
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={minOrder}
                    onChange={(e) => setMinOrder(parseFloat(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(parseFloat(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Free Above (₹)</label>
                  <input
                    type="number"
                    value={freeAbove}
                    onChange={(e) => setFreeAbove(parseFloat(e.target.value))}
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
                  Save Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

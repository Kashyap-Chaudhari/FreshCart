'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadCustomers = () => {
    setIsLoading(true);
    api.adminGetCustomers(search ? `search=${search}` : '').then((res) => {
      if (res.success && res.data) setCustomers(res.data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleToggleBlock = async (c: any) => {
    const reason = prompt(
      `Enter reason to ${c.isBlocked ? 'unblock' : 'block'} customer "${c.name}":`,
      c.isBlocked ? 'Account restored by owner' : 'Violation of store policy / spam checkouts'
    );
    if (reason === null) return;

    await api.adminToggleBlockCustomer(c.id, !c.isBlocked, reason);
    loadCustomers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customer Accounts</h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
              Owner Only
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage customer accounts, verify order statistics, and block suspicious users
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search Name, Phone, Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs bg-white border border-gray-300 rounded-xl px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={loadCustomers}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl"
          >
            Search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-bold">
            <tr>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Contact Phone</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Total Orders</th>
              <th className="py-3 px-4">Joined Date</th>
              <th className="py-3 px-4">Account Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">Loading customers...</td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400">No customers found.</td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60">
                  <td className="py-3.5 px-4 font-bold text-gray-900">{c.name}</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-gray-800">{c.phone || 'N/A'}</td>
                  <td className="py-3.5 px-4 text-gray-500">{c.email || 'N/A'}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-800">{c._count?.orders || 0}</td>
                  <td className="py-3.5 px-4 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.isBlocked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {c.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleBlock(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                        c.isBlocked
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200'
                      }`}
                    >
                      {c.isBlocked ? 'Unblock' : 'Block User'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

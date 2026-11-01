'use client';

import React, { useState, useEffect } from 'react';
import {
  Bike,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Shield,
  Truck,
  AlertCircle,
  ExternalLink,
  X,
  RefreshCw,
  MapPin,
  Calendar,
  Lock,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';

interface DeliveryPerson {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  vehicleNumber?: string;
  vehicleType?: string;
  isActive: boolean;
  totalAssigned: number;
  activeOrders: number;
  deliveredToday: number;
  totalDelivered: number;
  createdAt: string;
}

export default function DeliveryManagementPage() {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPersonForHistory, setSelectedPersonForHistory] = useState<DeliveryPerson | null>(null);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleNumber: '',
    vehicleType: 'Motorcycle',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchDeliveryPersons = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetDeliveryPersons();
      if (res.success && res.data) {
        setDeliveryPersons(res.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryPersons();
  }, []);

  const handleToggleStatus = async (person: DeliveryPerson) => {
    const newStatus = !person.isActive;
    try {
      const res = await api.adminUpdateDeliveryPerson(person.id, { isActive: newStatus });
      if (res.success) {
        setDeliveryPersons((prev) =>
          prev.map((p) => (p.id === person.id ? { ...p, isActive: newStatus } : p))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update delivery person status');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    try {
      const res = await api.adminCreateDeliveryPerson(formData);
      if (res.success) {
        setFormSuccess(`Delivery agent "${formData.name}" registered successfully!`);
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          vehicleNumber: '',
          vehicleType: 'Motorcycle',
        });
        fetchDeliveryPersons();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setFormSuccess('');
        }, 1200);
      } else {
        setFormError(res.message || 'Failed to create delivery person');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistoryModal = async (person: DeliveryPerson) => {
    setSelectedPersonForHistory(person);
    setHistoryLoading(true);
    try {
      const res = await api.adminGetDeliveryPersonHistory(person.id);
      if (res.success && res.data) {
        setHistoryOrders(res.data.orders || []);
      }
    } catch {
      setHistoryOrders([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filtered persons
  const filteredPersons = deliveryPersons.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.vehicleNumber && p.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPersonnel = deliveryPersons.length;
  const activePersonnel = deliveryPersons.filter((p) => p.isActive).length;
  const totalInTransit = deliveryPersons.reduce((acc, p) => acc + (p.activeOrders || 0), 0);
  const totalDeliveredAll = deliveryPersons.reduce((acc, p) => acc + (p.totalDelivered || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Delivery Management</h1>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
              Fleet & Dispatch
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your in-house delivery agents, vehicle fleet, assignments, and real-time self-confirmation tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDeliveryPersons}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href="http://localhost:3002"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Delivery Portal (:3002) ↗</span>
          </a>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Partner</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
            <span>Total Delivery Agents</span>
            <Bike className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{totalPersonnel}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Registered delivery personnel</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
            <span>Active on Duty</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activePersonnel}</p>
          <p className="text-[10px] text-emerald-600/80 font-medium mt-0.5">Ready for order assignments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
            <span>Active In-Transit</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalInTransit}</p>
          <p className="text-[10px] text-amber-600/80 font-medium mt-0.5">Orders out for delivery right now</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
            <span>Total Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalDeliveredAll}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Successfully fulfilled</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, phone or vehicle number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-800 dark:text-white">{filteredPersons.length}</span> agents
        </div>
      </div>

      {/* Delivery Persons Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Loading delivery fleet...</span>
          </div>
        ) : filteredPersons.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Bike className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">No delivery agents found</p>
            <p className="mt-1">Add your first delivery agent or adjust search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-bold">Delivery Partner</th>
                  <th className="py-3 px-4 font-bold">Contact Details</th>
                  <th className="py-3 px-4 font-bold">Vehicle Details</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Active Deliveries</th>
                  <th className="py-3 px-4 font-bold">Total Delivered</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPersons.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                          {person.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{person.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {person.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{person.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{person.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold text-[11px]">
                        <Bike className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{person.vehicleNumber || 'Unassigned'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {person.vehicleType || 'Two Wheeler'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(person)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                          person.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            person.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        <span>{person.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                          person.activeOrders > 0
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {person.activeOrders} orders
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {person.totalDelivered || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({person.deliveredToday || 0} today)
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openHistoryModal(person)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold text-xs transition"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Delivery Partner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Add Delivery Partner</h3>
                  <p className="text-[11px] text-slate-400">Creates credentials for delivery dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300">
                  {formSuccess}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit Dave"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9825000001"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="amit.delivery@freshcart.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Login Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters (e.g. Delivery@123)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Used by delivery person to log in to /delivery</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    placeholder="GJ-01-AB-1234"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Electric Scooter">Electric Scooter</option>
                    <option value="Delivery Van">Delivery Van</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Register Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery History Modal */}
      {selectedPersonForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                  {selectedPersonForHistory.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedPersonForHistory.name} — Fulfillment History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vehicle: {selectedPersonForHistory.vehicleNumber} ({selectedPersonForHistory.vehicleType}) • Phone: {selectedPersonForHistory.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPersonForHistory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1 space-y-3">
              {historyLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Loading fulfillment history...</span>
                </div>
              ) : historyOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <Truck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">No orders assigned to this agent yet</p>
                  <p className="mt-1">Orders can be assigned directly from the Orders section.</p>
                </div>
              ) : (
                historyOrders.map((ord: any) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          #{ord.orderNumber}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            ord.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : ord.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {ord.status}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          Delivery Status: <strong className="text-slate-700 dark:text-slate-200">{ord.deliveryStatus || 'ASSIGNED'}</strong>
                        </span>
                      </div>

                      <div className="text-slate-600 dark:text-slate-300 mt-1 font-medium">
                        Customer: {ord.customerName} ({ord.customerPhone})
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>
                          {ord.shippingAddressSnapshot?.street || ord.shippingAddressSnapshot?.addressLine1}, {ord.shippingAddressSnapshot?.city} - {ord.pincode}
                        </span>
                      </div>

                      {ord.deliveredAt && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                          ✓ Self-Confirmed Delivered: {new Date(ord.deliveredAt).toLocaleString('en-IN')} (No OTP)
                        </div>
                      )}
                    </div>

                    <div className="text-right sm:flex-shrink-0">
                      <div className="font-black text-slate-900 dark:text-white text-sm">
                        ₹{Number(ord.grandTotal).toFixed(0)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">
                        {ord.paymentMethod} • {ord.paymentStatus}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPersonForHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


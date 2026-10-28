'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function ContactPage() {
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [sentMessage, setSentMessage] = useState(false);

  useEffect(() => {
    api.getDeliveryAreas().then((res) => {
      if (res.success && res.data) setDeliveryAreas(res.data);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSentMessage(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
          Store Information & Support
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Visit Us or Reach Out
        </h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          We are here to answer your questions and fulfill your daily grocery needs 7 days a week.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Store Location</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              FreshCart Supermarket<br />
              123 Market Road, Koramangala 4th Block,<br />
              Bengaluru, Karnataka 560034
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Phone Support</h3>
            <p className="text-xs text-gray-600">
              Customer Desk: <strong className="text-gray-900">+91 98765 43210</strong><br />
              WhatsApp Orders: <strong className="text-gray-900">+91 98765 43211</strong>
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Opening Hours</h3>
            <p className="text-xs text-gray-600">
              Monday - Sunday: <strong>7:00 AM - 10:00 PM</strong><br />
              Open all 365 days including holidays.
            </p>
          </div>
        </div>

        {/* Map & Inquiry Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Map Box */}
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-800">Store Map Location (Koramangala, Bengaluru)</span>
              <a
                href="https://maps.google.com/?q=12.9352,77.6245"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-semibold hover:underline"
              >
                Open in Google Maps ↗
              </a>
            </div>
            <iframe
              title="FreshCart Supermarket Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15553.336495116744!2d77.6185!3d12.9352!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae144e13284ff3%3A0x6b4f708298782a20!2sKoramangala%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="260"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
            />
          </div>

          {/* Quick Message Form */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Send Us a Message</h3>
            {sentMessage ? (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Thank you! Your message has been received. Our team will contact you shortly.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="tel"
                  required
                  placeholder="Phone Number"
                  className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="sm:col-span-2">
                  <textarea
                    rows={3}
                    required
                    placeholder="How can we assist you with your groceries or delivery?"
                    className="w-full text-xs border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md"
                  >
                    Submit Inquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Serviceable Delivery Areas Table */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            Serviceable Delivery Areas & Rates
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Check minimum order values and free delivery thresholds by postal PIN code
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 font-bold">PIN Code</th>
                <th className="py-3 px-4 font-bold">Area Name</th>
                <th className="py-3 px-4 font-bold">Min Order Value</th>
                <th className="py-3 px-4 font-bold">Standard Delivery</th>
                <th className="py-3 px-4 font-bold">Free Delivery Above</th>
                <th className="py-3 px-4 font-bold">Estimated Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {deliveryAreas.map((area) => (
                <tr key={area.id} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-800">{area.pincode}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">{area.areaName}</td>
                  <td className="py-3 px-4">₹{Number(area.minOrderValue).toFixed(0)}</td>
                  <td className="py-3 px-4">₹{Number(area.deliveryCharge).toFixed(0)}</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">
                    {area.freeDeliveryAbove ? `₹${Number(area.freeDeliveryAbove).toFixed(0)}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4">{area.estimatedDeliveryHours || 2} Hours</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

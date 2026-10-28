'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Grid } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);

  const loadCategories = () => {
    api.adminGetCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, description, imageUrl, displayOrder: Number(displayOrder) };
    if (editingId) {
      await api.adminUpdateCategory(editingId, payload);
    } else {
      await api.adminCreateCategory(payload);
    }
    setShowModal(false);
    setName('');
    setDescription('');
    setImageUrl('');
    setEditingId(null);
    loadCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Grocery Categories</h1>
          <p className="text-xs text-gray-500 mt-0.5">Organize store sections and catalogue navigation</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setName('');
            setDescription('');
            setImageUrl('');
            setShowModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                alt={cat.name}
                className="w-12 h-12 rounded-xl object-cover border border-gray-100"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm truncate">{cat.name}</h3>
                <span className="text-[11px] text-gray-400 font-mono">/{cat.slug}</span>
              </div>
              <button
                onClick={() => {
                  setEditingId(cat.id);
                  setName(cat.name);
                  setDescription(cat.description || '');
                  setImageUrl(cat.imageUrl || '');
                  setDisplayOrder(cat.displayOrder || 0);
                  setShowModal(true);
                }}
                className="p-1.5 text-gray-400 hover:text-emerald-700"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">{cat.description || 'No description'}</p>
            <div className="pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>Display Order: {cat.displayOrder}</span>
              <span className="font-bold text-emerald-800">{cat._count?.products || 0} Products</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-base">
              {editingId ? 'Edit Category' : 'Create Category'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10))}
                  className="w-full text-xs border border-gray-300 rounded-xl p-2.5"
                />
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

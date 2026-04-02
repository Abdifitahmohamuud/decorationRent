"use client";

import { useState, useEffect } from "react";
import { Package, Trash2, RefreshCw, Search, Edit2, Check, X } from "lucide-react";

interface BookingItem {
  id: string;
  quantity: number;
  price: number;
  decoration: { id: string; name: string; price: number };
  booking: { id: string; user: { fullName: string } };
}

export default function BookingItemsPage() {
  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(1);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/booking-items");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const saveQty = async (id: string) => {
    await fetch("/api/admin/booking-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, quantity: editQty }),
    });
    setEditingId(null);
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Remove this item and restore inventory?")) return;
    await fetch(`/api/admin/booking-items?id=${id}`, { method: "DELETE" });
    fetchItems();
  };

  const filtered = search
    ? items.filter(i =>
        i.decoration.name.toLowerCase().includes(search.toLowerCase()) ||
        i.booking.user.fullName.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Booking Items</h1>
          <p className="text-gray-500 font-medium">
            {items.length} total items across all bookings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search decoration or customer..."
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-60"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={fetchItems}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Decoration</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Booking ID</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Quantity</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Unit Price</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Subtotal</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-8 py-12 text-center text-gray-500 animate-pulse">Loading items...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-12 text-center text-gray-500">No booking items found.</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="group hover:bg-gray-50/50 transition">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Package className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-900">{item.decoration.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-medium text-gray-700">{item.booking.user.fullName}</td>
                  <td className="px-8 py-5">
                    <code className="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                      #{item.booking.id.slice(0, 8)}
                    </code>
                  </td>
                  <td className="px-8 py-5">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          className="w-16 border border-indigo-300 rounded-lg px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                          value={editQty}
                          onChange={e => setEditQty(parseInt(e.target.value) || 1)}
                        />
                        <button onClick={() => saveQty(item.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-50 rounded-lg transition"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900 text-lg">{item.quantity}</span>
                        <button
                          onClick={() => { setEditingId(item.id); setEditQty(item.quantity); }}
                          className="p-1 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 font-medium text-gray-700">${item.price.toLocaleString()}</td>
                  <td className="px-8 py-5 font-extrabold text-gray-900">${(item.price * item.quantity).toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

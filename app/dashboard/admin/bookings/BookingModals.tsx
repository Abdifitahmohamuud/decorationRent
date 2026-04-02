"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Calendar, MapPin, User, Package } from "lucide-react";

export function CreateBookingModal({ onClose, onSuccess }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [decorations, setDecorations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    eventDate: "",
    endDate: "",
    location: "",
    items: [] as { decorationId: string; quantity: number }[]
  });

  useEffect(() => {
    fetch("/api/admin/users?role=ALL").then(r => r.json()).then(setUsers);
    fetch("/api/admin/decorations").then(r => r.json()).then(setDecorations);
  }, []);

  const handleAddItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { decorationId: "", quantity: 1 }] }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to create booking");
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create Manual Booking</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 flex-grow">
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><User className="w-3 h-3 inline mr-1" />Customer</label>
            <select 
              required
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
            >
              <option value="">Select a user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Calendar className="w-3 h-3 inline mr-1" />Event Date</label>
              <input 
                required type="date"
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Calendar className="w-3 h-3 inline mr-1" />Return Date</label>
              <input 
                required type="date"
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><MapPin className="w-3 h-3 inline mr-1" />Location</label>
            <input 
              required type="text" placeholder="Event Location"
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
               <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Package className="w-3 h-3 inline mr-1" />Items</label>
               <button type="button" onClick={handleAddItem} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-100 flex items-center">
                 <Plus className="w-3 h-3 mr-1" /> Add Item
               </button>
            </div>
            {formData.items.map((item, index) => (
              <div key={index} className="flex space-x-3 items-center">
                <select 
                  required
                  className="flex-grow px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                  value={item.decorationId}
                  onChange={(e) => updateItem(index, "decorationId", e.target.value)}
                >
                  <option value="">Select Decoration...</option>
                  {decorations.filter(d => d.isActive).map(d => (
                    <option key={d.id} value={d.id}>{d.name} (${d.price})</option>
                  ))}
                </select>
                <input 
                  required type="number" min="1" placeholder="Qty"
                  className="w-24 px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold text-center"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                />
                <button type="button" onClick={() => removeItem(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {formData.items.length === 0 && <p className="text-xs text-center text-gray-500">No items added yet. Click Add Item.</p>}
          </div>

          <div className="pt-8 flex items-center space-x-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 rounded-[1.5rem] font-bold text-gray-500 transition">Cancel</button>
            <button type="submit" disabled={loading || formData.items.length === 0} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-indigo-100 transition active:scale-[0.98] disabled:opacity-50">
              {loading ? "Creating..." : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditBookingModal({ booking, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    eventDate: formatDate(booking.eventDate),
    endDate: formatDate(booking.endDate),
    location: booking.location,
    status: booking.status
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) alert("Failed to update booking");
      else onSuccess();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Booking Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Calendar className="w-3 h-3 inline mr-1" />Event Date</label>
              <input 
                required type="date"
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Calendar className="w-3 h-3 inline mr-1" />Return Date</label>
              <input 
                required type="date"
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><MapPin className="w-3 h-3 inline mr-1" />Location</label>
            <input 
              required type="text"
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">Status</label>
            <select 
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900 uppercase tracking-wider text-sm"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="pt-8 flex items-center space-x-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 rounded-[1.5rem] font-bold text-gray-500 transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-indigo-100 transition active:scale-[0.98] disabled:opacity-50">
              {loading ? "Updating..." : "Update Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

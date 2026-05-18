"use client";

import { useState, useEffect } from "react";
import { Package, AlertCircle, CheckCircle, Search, Calendar, User, DollarSign, Edit2, Trash2, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function TakenItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for adding pickup
  const [showForm, setShowForm] = useState(false);
  const [searchBookingId, setSearchBookingId] = useState("");
  const [booking, setBooking] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Item remarks: map decorationId -> remarks
  const [itemRemarks, setItemRemarks] = useState<Record<string, string>>({});

  // History filtering & CRUD states
  const [filterQuery, setFilterQuery] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editQty, setEditQty] = useState(0);
  const [editRemarks, setEditRemarks] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/taken-items");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchBookingId.trim()) return;
    setSearching(true);
    setSearchError("");
    setBooking(null);
    setItemRemarks({});

    try {
      const res = await fetch(`/api/bookings/${searchBookingId.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch booking");

      if (data.status !== "REQUEST" && data.status !== "PENDING") {
        throw new Error(`Only bookings with REQUEST status can be processed for pickup. Current status is ${data.status}`);
      }

      setBooking(data);
      // Initialize remarks
      const initialRemarks: any = {};
      data.bookingItems.forEach((item: any) => {
        initialRemarks[item.decorationId] = "";
      });
      setItemRemarks(initialRemarks);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleRemarkChange = (decorationId: string, value: string) => {
    setItemRemarks(prev => ({
      ...prev,
      [decorationId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!booking) return;
    setSubmitting(true);
    try {
      // Process each item in the booking
      const promises = booking.bookingItems.map((item: any) => {
        return fetch("/api/taken-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            decorationId: item.decorationId,
            quantity: item.quantity,
            remarks: itemRemarks[item.decorationId] || "",
            userId: user?.id,
          }),
        });
      });

      await Promise.all(promises);
      
      alert("Booking pickup processed successfully!");
      setSearchBookingId("");
      setBooking(null);
      setShowForm(false);
      fetchItems();
    } catch (err: any) {
      alert("Error processing pickup: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pickup record? This will revert the booking status if no other pickup records remain for this booking.")) return;
    try {
      const res = await fetch(`/api/taken-items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      alert("Pickup record deleted successfully!");
      fetchItems();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (item: any) => {
    setEditingItem(item);
    setEditQty(item.quantity);
    setEditRemarks(item.remarks || "");
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/taken-items/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(editQty),
          remarks: editRemarks
        })
      });
      if (!res.ok) throw new Error("Failed to update record");
      alert("Pickup record updated successfully!");
      setEditingItem(null);
      fetchItems();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredItems = items.filter(item => {
    const q = filterQuery.toLowerCase();
    return (
      item.bookingId?.toLowerCase().includes(q) ||
      item.decoration?.name?.toLowerCase().includes(q) ||
      item.remarks?.toLowerCase().includes(q) ||
      item.user?.fullName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Taken Items (Pickup)</h1>
          <p className="text-gray-500">Record, monitor and manage decoration items picked up by customers.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setBooking(null); setSearchBookingId(""); setSearchError(""); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
        >
          {showForm ? "Cancel" : "+ Process New Pickup"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border mb-8 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Process Pickup</h2>
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text" 
                value={searchBookingId} 
                onChange={e => setSearchBookingId(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500" 
                placeholder="Enter Booking ID to search..." 
              />
            </div>
            <button 
              onClick={handleSearch} 
              disabled={searching}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold text-sm disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search Booking"}
            </button>
          </div>

          {searchError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm mb-6 font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> {searchError}
            </div>
          )}

          {booking && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Booking Info Header */}
              <div className="bg-gray-50 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b">
                <div>
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Customer Details</h3>
                  <p className="font-bold text-gray-900 flex items-center gap-2 mb-1"><User className="w-4 h-4 text-gray-400" /> {booking.user?.fullName}</p>
                  <p className="text-sm text-gray-600">{booking.user?.email} • {booking.user?.phone}</p>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Booking Details</h3>
                  <p className="font-bold text-gray-900 flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-gray-400" /> {new Date(booking.eventDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600 font-bold flex items-center gap-2"><DollarSign className="w-4 h-4 text-gray-400" /> Total: ${booking.totalPrice} (Paid: ${booking.totalPrice - booking.balance})</p>
                </div>
              </div>

              {/* Items to Take */}
              <div className="p-6">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Items to Pick Up</h3>
                <div className="space-y-4">
                  {booking.bookingItems.map((item: any) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white border rounded-xl">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.decoration?.image ? <img src={item.decoration.image} className="w-full h-full object-cover" /> : <Package className="text-gray-400 w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{item.decoration?.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="w-72">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Defect Notes / Remarks (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Scratched but okay, missing a screw..."
                          value={itemRemarks[item.decorationId] || ""}
                          onChange={(e) => handleRemarkChange(item.decorationId, e.target.value)}
                          className="w-full border rounded-lg p-2 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                  >
                    {submitting ? "Processing..." : "Complete Pickup"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Filter Bar */}
      <div className="bg-white p-4 rounded-xl border mb-6 shadow-sm flex items-center relative">
        <Search className="w-5 h-5 absolute left-7 text-gray-400" />
        <input 
          type="text"
          value={filterQuery}
          onChange={e => setFilterQuery(e.target.value)}
          className="w-full border bg-gray-50 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          placeholder="Search pickups by booking ID, decoration name, remarks, customer name..."
        />
      </div>

      {/* Taken History Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading picked up items...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-4">Decoration</th>
                <th className="px-6 py-4">Booking ID</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Defect Notes / Remarks</th>
                <th className="px-6 py-4">Processed By</th>
                <th className="px-6 py-4">Date Taken</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No picked up items matched your search.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.decoration?.image ? (
                          <img src={item.decoration.image} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="font-bold text-gray-900">{item.decoration?.name || item.decorationId}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">{item.bookingId}</td>
                    <td className="px-6 py-4 font-bold">{item.quantity}</td>
                    <td className="px-6 py-4 text-amber-600 font-semibold italic text-xs">
                      {item.remarks || "None (Perfect Condition)"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.user?.fullName || 'System'}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(item.takenAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => startEdit(item)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b">
              <h3 className="font-bold text-gray-900">Edit Pickup Record</h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Decoration</label>
                <p className="font-bold text-gray-900">{editingItem.decoration?.name}</p>
              </div>

              <div>
                <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Quantity</label>
                <input 
                  type="number"
                  value={editQty}
                  onChange={e => setEditQty(Number(e.target.value))}
                  className="w-full border rounded-lg p-2.5 text-sm"
                  min={1}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Defect Notes / Remarks</label>
                <input 
                  type="text"
                  value={editRemarks}
                  onChange={e => setEditRemarks(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm"
                  placeholder="E.g. scratched, missing part..."
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              <button 
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

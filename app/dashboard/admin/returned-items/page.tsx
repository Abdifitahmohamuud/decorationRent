"use client";

import { useState, useEffect } from "react";
import { Package, AlertCircle, CheckCircle, Search, Calendar, User, DollarSign } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function ReturnedItemsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [searchBookingId, setSearchBookingId] = useState("");
  const [booking, setBooking] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Item statuses: map decorationId -> status & remarks
  const [itemStatuses, setItemStatuses] = useState<Record<string, { status: string, remarks: string }>>({});

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/returned-items");
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
    setItemStatuses({});

    try {
      const res = await fetch(`/api/bookings/${searchBookingId.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch booking");

      if (data.returnedItems && data.returnedItems.length > 0) {
        throw new Error("This booking has already been processed and returned.");
      }

      setBooking(data);
      // Initialize statuses
      const initialStatuses: any = {};
      data.bookingItems.forEach((item: any) => {
        initialStatuses[item.decorationId] = { status: "OK", remarks: "" };
      });
      setItemStatuses(initialStatuses);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleStatusChange = (decorationId: string, field: "status"|"remarks", value: string) => {
    setItemStatuses(prev => ({
      ...prev,
      [decorationId]: { ...prev[decorationId], [field]: value }
    }));
  };

  const handleSubmit = async () => {
    if (!booking) return;
    setSubmitting(true);
    try {
      // Process each item in the booking
      const promises = booking.bookingItems.map((item: any) => {
        return fetch("/api/returned-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            decorationId: item.decorationId,
            quantity: item.quantity,
            status: itemStatuses[item.decorationId].status,
            remarks: itemStatuses[item.decorationId].remarks,
            userId: user?.id,
          }),
        });
      });

      await Promise.all(promises);
      
      alert("Booking return processed successfully!");
      setSearchBookingId("");
      setBooking(null);
      setShowForm(false);
      fetchItems();
    } catch (err: any) {
      alert("Error processing returns: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returned Items</h1>
          <p className="text-gray-500">Record and monitor returned decoration items.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setBooking(null); setSearchBookingId(""); setSearchError(""); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
        >
          {showForm ? "Cancel" : "+ Process New Return"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border mb-8 shadow-sm">
          <h2 className="text-lg font-bold mb-4">Process Returned Booking</h2>
          
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

              {/* Items to Return */}
              <div className="p-6">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-4">Items Included in Booking</h3>
                <div className="space-y-4">
                  {booking.bookingItems.map((item: any) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white border rounded-xl">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.decoration?.image ? <img src={item.decoration.image} className="w-full h-full object-cover rounded-lg" /> : <Package className="text-gray-400 w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{item.decoration?.name}</p>
                        <p className="text-sm text-gray-500">Qty Rented: {item.quantity}</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-40">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Condition</label>
                          <select 
                            value={itemStatuses[item.decorationId]?.status || "OK"} 
                            onChange={(e) => handleStatusChange(item.decorationId, "status", e.target.value)}
                            className="w-full border rounded-lg p-2 text-sm font-bold bg-gray-50"
                          >
                            <option value="OK">OK</option>
                            <option value="DAMAGED">DAMAGED</option>
                          </select>
                        </div>
                        <div className="w-48">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">Remarks (Opt)</label>
                          <input 
                            type="text" 
                            placeholder="Add note..."
                            value={itemStatuses[item.decorationId]?.remarks || ""}
                            onChange={(e) => handleStatusChange(item.decorationId, "remarks", e.target.value)}
                            className="w-full border rounded-lg p-2 text-sm"
                          />
                        </div>
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
                    {submitting ? "Processing..." : "Complete Return"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading returns...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-4">Decoration</th>
                <th className="px-6 py-4">Booking ID</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Processed By</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No returned items recorded yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{item.decoration?.name || item.decorationId}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">{item.bookingId}</td>
                    <td className="px-6 py-4 font-bold">{item.quantity}</td>
                    <td className="px-6 py-4">
                      {item.status === "OK" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[10px] uppercase tracking-widest bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                          <AlertCircle className="w-3 h-3" /> DAMAGED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.user?.fullName || 'System'}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(item.returnedAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

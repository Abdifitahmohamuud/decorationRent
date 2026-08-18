"use client";

import { useState, useEffect } from "react";
import { PhoneCall, CheckCircle, RefreshCcw, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";

interface PendingBooking {
  id: string;
  user: { fullName: string; email: string; phone: string | null };
  totalPrice: number;
  deposit: number;
  balance: number;
  status: string;
  createdAt: string; // needed to sort by most recent first
}

export default function AdminCheckoutPage() {
  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [payerPhone, setPayerPhone] = useState<string>('');
  const [methods, setMethods] = useState<Record<string, string>>({});

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/admin/checkout");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: PendingBooking[] = await res.json();

      // Sort so the most recently created booking shows first (newest -> oldest)
      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setBookings(sorted);
    } catch (err) {
      toast.error("Could not load pending payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleComplete = async (bookingId: string) => {
    if (!confirm("Are you sure you want to mark this balance as paid and complete the booking?")) return;
    setProcessing(bookingId);
    try {
      // Find the booking to get phone & balance
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");
      if (!payerPhone) throw new Error("Payer phone number is required");

      // ---- WaafiPay purchase ----
      const waafiRes = await fetch('/api/waafi/purchase', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNo: payerPhone,
          amount: booking.balance,
          currency: "USD",
          referenceId: booking.id,
          bookingId: booking.id,
        })
      });
      const waafiData = await waafiRes.json();
      if (!waafiRes.ok || !waafiData.success) {
        const state = (waafiData.state ?? '').toUpperCase();
        let errMsg = waafiData.message || "WaafiPay purchase failed";
        if (state === 'REJECTED') errMsg = "Payment rejected by customer.";
        else if (state === 'CANCELLED') errMsg = "Payment cancelled.";
        else if (state === 'TIMEOUT') errMsg = "Payment request timed out.";
        else if (state === 'FAILED') errMsg = waafiData.message || "Payment failed.";
        throw new Error(errMsg);
      }

      // ---- Existing admin checkout ----
      const selectedMethod = methods[bookingId] || "LOCAL_EVC";
      const res = await fetch("/api/admin/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, method: selectedMethod })
      });

      if (!res.ok) {
        const errData = await res.json();
        const errMessage = errData.error || errData.message || "Failed to complete checkout";
        throw new Error(errMessage);
      }

      toast.success("Payment collected! Booking marked as COMPLETED.");
      fetchPending();
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Loading pending payouts...</div>;

  return (
    <div className="p-8 lg:p-12 space-y-8">
      {/* Phone Number Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Payer Mobile Number</label>
        <input
          type="text"
          placeholder="Enter mobile number (e.g., 252611111111)"
          value={payerPhone}
          onChange={(e) => setPayerPhone(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
          <DollarSign className="w-8 h-8 mr-3 text-indigo-600" />
          Outstanding Collections
        </h1>
        <p className="text-gray-500 mt-2">Manage customer balances and finalize checkouts directly.</p>
      </header>

      {bookings.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Clear!</h2>
          <p className="text-gray-500">There are no outstanding balances to collect.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{b.user.fullName}</h3>
                  <div className="flex items-center mt-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full w-max text-sm font-bold">
                    <PhoneCall className="w-4 h-4 mr-2" />
                    {b.user.phone || "No Phone Provided"}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{b.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pending Balance</p>
                  <p className="text-3xl font-extrabold text-rose-600">${b.balance.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-gray-50 px-4 py-3 rounded-2xl flex-1 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase">Deposit Paid</p>
                  <p className="text-lg font-bold text-gray-900">${b.deposit.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 px-4 py-3 rounded-2xl flex-1 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase">Total Bill</p>
                  <p className="text-lg font-bold text-gray-900">${b.totalPrice.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Payment Method</label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={methods[b.id] || "LOCAL_EVC"}
                    onChange={(e) => setMethods({ ...methods, [b.id]: e.target.value })}
                  >
                    <optgroup label="Local Methods">
                      <option value="LOCAL_EVC">EVC Plus</option>
                      
                    
                    </optgroup>
                 
                  </select>
                </div>

                <button
                  onClick={() => handleComplete(b.id)}
                  disabled={processing === b.id}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center transition"
                >
                  {processing === b.id ? (
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Complete Action / Collect ${b.balance}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
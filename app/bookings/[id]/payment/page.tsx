"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CreditCard, Smartphone, CheckCircle, ArrowRight, Globe, MapPin, DollarSign } from "lucide-react";

interface Booking {
  id: string;
  totalPrice: number;
  deposit: number;
  balance: number;
  status: string;
}

type PaymentMethod = "LOCAL_EVC" | "LOCAL_EDAHAB" | "LOCAL_SAHAL" | "LOCAL_PREMIER_WALLET" | "GLOBAL_MASTERCARD" | "GLOBAL_PAYPAL";

export default function PaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>("LOCAL_EVC");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings`)
      .then((res) => res.json())
      .then((data: Booking[]) => {
        const found = data.find((b) => b.id === id);
        if (found) {
          setBooking(found);
          setCustomAmount(found.balance.toString());
        }
        setLoading(false);
      });
  }, [id]);

  const actualAmount = Number(customAmount);

  const handlePayment = async () => {
    if (!booking) return;

    if (actualAmount <= 0) {
      alert("Payment amount must be greater than 0.");
      return;
    }
    if (actualAmount > booking.balance) {
      alert("Payment amount cannot exceed the remaining balance.");
      return;
    }

    setProcessing(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: actualAmount,
          method,
          transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        }),
      });

      if (res.ok) {
        router.push("/bookings/success");
      } else {
        alert("Payment failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-gray-500 animate-pulse">Retrieving balance details...</div>;
  if (!booking) return <div className="p-20 text-center text-red-600 font-bold">Booking not found</div>;
  if (booking.balance <= 0) return <div className="p-20 text-center text-emerald-600 font-bold">This booking is fully paid!</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl space-y-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center mb-4">
                <DollarSign className="w-6 h-6 mr-2 text-indigo-600" />
                Payment Amount
              </h1>
              <p className="text-sm text-gray-500 mb-2">You can pay any amount up to your remaining balance.</p>
              <input 
                 type="number"
                 min="1"
                 max={booking.balance}
                 step="0.01"
                 value={customAmount}
                 onChange={(e) => setCustomAmount(e.target.value)}
                 className="w-full text-2xl font-extrabold text-indigo-700 bg-indigo-50 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-indigo-500/20"
              />
              <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">Maximum Limit: ${booking.balance.toFixed(2)}</p>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h1 className="text-xl font-bold flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                Local Payment Methods
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {[
                  { id: "LOCAL_EVC", label: "EVC Plus" },
                  { id: "LOCAL_EDAHAB", label: "eDahab" },
                  { id: "LOCAL_SAHAL", label: "Sahal" },
                  { id: "LOCAL_PREMIER_WALLET", label: "Premier" }
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setMethod(pm.id as PaymentMethod)}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all ${
                      method === pm.id ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-indigo-200"
                    }`}
                  >
                    <Smartphone className={`w-6 h-6 mb-2 ${method === pm.id ? "text-indigo-600" : "text-gray-400"}`} />
                    <span className={`text-xs font-bold ${method === pm.id ? "text-indigo-900" : "text-gray-600"}`}>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            <div>
              <h1 className="text-xl font-bold flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-600" />
                Global Payment Methods
              </h1>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {[
                  { id: "GLOBAL_MASTERCARD", label: "Mastercard" },
                  { id: "GLOBAL_PAYPAL", label: "PayPal" },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setMethod(pm.id as PaymentMethod)}
                     className={`flex items-center p-4 border-2 rounded-2xl transition-all ${
                      method === pm.id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-200"
                    }`}
                 >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mr-3 ${
                      method === pm.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-bold ${method === pm.id ? "text-blue-900" : "text-gray-600"}`}>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handlePayment}
                disabled={processing || actualAmount <= 0 || actualAmount > booking.balance}
                className={`w-full text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl disabled:opacity-50 flex items-center justify-center ${
                  method.startsWith("GLOBAL") ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                }`}
              >
                {processing ? "Processing..." : `Pay $${actualAmount.toFixed(2)}`}
                {!processing && <ArrowRight className="ml-2 w-5 h-5" />}
              </button>
              <p className="mt-4 text-center text-xs text-gray-500">
                Your payment is encrypted and secure. By proceeding, you agree to our terms of service.
              </p>
            </div>
          </div>
        </div>

        <div className={`${method.startsWith("GLOBAL") ? "bg-blue-600" : "bg-indigo-600"} rounded-3xl p-8 text-white space-y-6 transition-colors duration-300 sticky top-24`}>
          <h2 className="text-xl font-bold">Balance Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between pb-4 border-b border-white/20">
              <span className="opacity-80">Total Price</span>
              <span className="font-bold">${booking.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-white/20">
              <span className="opacity-80">Paid So Far</span>
              <span className="font-bold">${(booking.totalPrice - booking.balance).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-4">
              <span className="opacity-80">Remaining Balance</span>
              <span className="text-xl font-extrabold">${booking.balance.toFixed(2)}</span>
            </div>
          </div>
          <div className="pt-4 space-y-2">
            <p className="text-xs opacity-70 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" /> Partial payments accepted until limit
            </p>
            <p className="text-xs opacity-70 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" /> Balance due 48h before event
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

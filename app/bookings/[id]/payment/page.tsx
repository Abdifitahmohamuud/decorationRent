"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CreditCard, Smartphone, CheckCircle, ArrowRight, Globe, MapPin } from "lucide-react";

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
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings`)
      .then((res) => res.json())
      .then((data: Booking[]) => {
        const found = data.find((b) => b.id === id);
        if (found) setBooking(found);
        setLoading(false);
      });
  }, [id]);

  const handlePayment = async () => {
    if (!booking) return;
    setProcessing(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: booking.deposit, // Pays deposit initially
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

  if (loading) return <div className="p-20 text-center text-gray-500">Retrieving booking details...</div>;
  if (!booking) return <div className="p-20 text-center text-red-600 font-bold">Booking not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl space-y-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-indigo-600" />
                Local Payment Methods
              </h1>
              <p className="text-sm text-gray-500 mb-4">Mobile money and local wallets</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <Smartphone className={`w-8 h-8 mb-2 ${method === pm.id ? "text-indigo-600" : "text-gray-400"}`} />
                    <span className={`text-sm font-bold ${method === pm.id ? "text-indigo-900" : "text-gray-600"}`}>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <h1 className="text-xl font-bold flex items-center">
                <Globe className="w-5 h-5 mr-2 text-blue-600" />
                Global Payment Methods
              </h1>
              <p className="text-sm text-gray-500 mb-4">Credit cards and global options</p>
              <div className="grid grid-cols-2 gap-4">
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
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                      method === pm.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className={`font-bold ${method === pm.id ? "text-blue-900" : "text-gray-600"}`}>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handlePayment}
                disabled={processing}
                className={`w-full text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl disabled:opacity-50 flex items-center justify-center ${
                  method.startsWith("GLOBAL") ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                }`}
              >
                {processing ? "Processing..." : `Pay $${booking.deposit.toFixed(2)} Deposit`}
                {!processing && <ArrowRight className="ml-2 w-5 h-5" />}
              </button>
              <p className="mt-4 text-center text-xs text-gray-500">
                Your payment is encrypted and secure. By proceeding, you agree to our terms of service.
              </p>
            </div>
          </div>
        </div>

        <div className={`${method.startsWith("GLOBAL") ? "bg-blue-600" : "bg-indigo-600"} rounded-3xl p-8 text-white space-y-6 transition-colors duration-300`}>
          <h2 className="text-xl font-bold">Booking Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between pb-4 border-b border-white/20">
              <span className="opacity-80">Total Price</span>
              <span className="font-bold">${booking.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-white/20">
              <span className="opacity-80 text-sm">Deposit (20%)</span>
              <span className="font-bold">${booking.deposit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-4">
              <span className="opacity-80">Remaining Balance</span>
              <span className="text-xl font-extrabold">${booking.balance.toFixed(2)}</span>
            </div>
          </div>
          <div className="pt-4 space-y-2">
            <p className="text-xs opacity-70 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" /> Booking will be confirmed after deposit
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

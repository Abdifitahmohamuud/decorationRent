"use client";

import { useCart } from "@/app/context/CartContext";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Package, CheckCircle, Trash2, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookingData, setBookingData] = useState({
    eventDate: "",
    endDate: "",
    location: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const deposit = totalPrice * 0.20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (status !== "authenticated") {
      router.push("/auth/login?callbackUrl=/cart");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingData,
          items: cartItems.map((item) => ({
            decorationId: item.decorationId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create booking");
        setIsSubmitting(false);
        return;
      }

      const booking = await res.json();
      clearCart();
      router.push(`/bookings/${booking.id}/payment`);
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Package className="w-20 h-20 mx-auto text-gray-300 mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8">Looks like you haven't added any decorations for your event yet.</p>
        <Link
          href="/decorations"
          className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition"
        >
          Browse Decorations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Package className="w-5 h-5 mr-2 text-indigo-600" />
              Cart Items
            </h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.decorationId} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 rounded-2xl gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">${item.price} / day</p>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white px-3 py-2 rounded-xl border border-gray-200">
                    <button 
                      onClick={() => updateQuantity(item.decorationId, item.quantity - 1)}
                      className="text-gray-500 hover:text-indigo-600 p-1"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.decorationId, item.quantity + 1)}
                      className="text-gray-500 hover:text-indigo-600 p-1"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="font-bold text-gray-900 w-24 text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.decorationId)}
                    className="text-red-400 hover:text-red-600 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <form id="checkout-form" onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
              Event Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Event Start Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  value={bookingData.eventDate}
                  onChange={(e) => setBookingData({ ...bookingData, eventDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Event End Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  value={bookingData.endDate}
                  onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4 mr-2" /> Venue Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Ballroom, Hilton Hotel"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  value={bookingData.location}
                  onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white space-y-6 sticky top-24">
            <h2 className="text-xl font-bold">Booking Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between pb-4 border-b border-indigo-500/50">
                <span className="opacity-80">Subtotal</span>
                <span className="font-bold">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="opacity-80 text-sm">Deposit Required (20%)</span>
                <span className="text-xl font-extrabold">${deposit.toFixed(2)}</span>
              </div>
            </div>
            <div className="pt-4 space-y-2 border-t border-indigo-500/50 mt-4">
              <p className="text-xs opacity-70 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" /> Booking is confirmed after deposit Payment
              </p>
            </div>
            
            <button
              form="checkout-form"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl disabled:opacity-50 mt-6"
            >
              {isSubmitting ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCart } from "@/app/context/CartContext";
import { useState, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Package, CheckCircle, Trash2, Plus, Minus, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

type PaymentMethod = "LOCAL_EVC" | "LOCAL_EDAHAB" | "LOCAL_SAHAL" | "LOCAL_PREMIER_WALLET" | "GLOBAL_MASTERCARD" | "GLOBAL_PAYPAL";

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();

  const [bookingData, setBookingData] = useState({
    eventDate: "",
    endDate: "",
    location: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("LOCAL_EVC");
  const [customPayment, setCustomPayment] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const durationHours = useMemo(() => {
    if (!bookingData.eventDate || !bookingData.endDate) return 0;
    const diff = new Date(bookingData.endDate).getTime() - new Date(bookingData.eventDate).getTime();
    return Math.max(1, diff / (1000 * 60 * 60));
  }, [bookingData.eventDate, bookingData.endDate]);

  const dynamicTotalPrice = useMemo(() => {
    if (durationHours === 0) {
       // if no dates selected, just show base price (1 unit block)
       return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }
    return cartItems.reduce((acc, item) => {
      const priceUnit = (item as any).priceUnitHours || 1;
      const blocks = Math.ceil(durationHours / priceUnit);
      return acc + (item.price * blocks * item.quantity);
    }, 0);
  }, [cartItems, durationHours]);

  const depositRequired = Math.round((dynamicTotalPrice * 0.20) * 100) / 100;
  
  // if customPayment is empty, default to deposit. Otherwise use user input
  const actualPaymentAmount = customPayment !== "" ? Number(customPayment) : depositRequired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!user) {
      router.push("/auth/login?callbackUrl=/cart");
      return;
    }
    if (durationHours <= 0) {
      toast.error("Please enter valid event dates.");
      return;
    }
    
    if (actualPaymentAmount < depositRequired - 0.1) {
       toast.error(`Minimum payment required is $${depositRequired}`);
       return;
    }
    if (actualPaymentAmount > dynamicTotalPrice + 0.1) {
       toast.error(`Payment cannot exceed the total price of $${dynamicTotalPrice}`);
       return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingData,
          paymentAmount: actualPaymentAmount,
          paymentMethod,
          items: cartItems.map((item) => ({
            decorationId: item.decorationId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to process booking";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch (e) {}
        toast.error(errorMsg);
        setIsSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/bookings/success`);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout & Payment</h1>
      
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
                    <p className="text-sm text-gray-500">${item.price} / {(item as any).priceUnitHours === 1 ? 'hr' : `${(item as any).priceUnitHours || 1} hrs`}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white px-3 py-2 rounded-xl border border-gray-200">
                    <button 
                      type="button"
                      onClick={() => updateQuantity(item.decorationId, item.quantity - 1)}
                      className="text-gray-500 hover:text-indigo-600 p-1"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                    <button 
                      type="button"
                      onClick={() => updateQuantity(item.decorationId, item.quantity + 1)}
                      className="text-gray-500 hover:text-indigo-600 p-1"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="font-bold text-gray-900 w-24 text-right">
                    ${(durationHours > 0 
                      ? item.price * Math.ceil(durationHours / ((item as any).priceUnitHours || 1)) * item.quantity 
                      : item.price * item.quantity).toFixed(2)}
                  </div>

                  <button 
                    type="button"
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
                <label className="text-sm font-medium text-gray-700">Event Start</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  value={bookingData.eventDate}
                  onChange={(e) => setBookingData({ ...bookingData, eventDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Event End</label>
                <input
                  type="datetime-local"
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

            <hr className="my-6 border-gray-100" />

            <h2 className="text-xl font-bold mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-emerald-600" />
              Payment Details
            </h2>
            
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Payment Amount ($)</label>
                  <p className="text-xs text-gray-500 mb-2">You can pay any amount from the minimum deposit up to the total price.</p>
                  <input
                     type="number"
                     step="0.01"
                     min={depositRequired}
                     max={dynamicTotalPrice}
                     placeholder={depositRequired.toString()}
                     value={customPayment}
                     onChange={(e) => setCustomPayment(e.target.value)}
                     className="w-full px-4 py-3 font-extrabold text-indigo-700 bg-indigo-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                  {durationHours > 0 && <p className="text-[10px] font-bold text-gray-400">Min: ${depositRequired.toFixed(2)} | Max: ${dynamicTotalPrice.toFixed(2)}</p>}
                </div>
                
                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-700">Payment Method</label>
                   <select 
                     className="w-full px-4 py-3 font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                     value={paymentMethod}
                     onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                   >
                     <optgroup label="Local Mobile Money">
                        <option value="LOCAL_EVC">EVC Plus</option>
                        <option value="LOCAL_EDAHAB">eDahab</option>
                        <option value="LOCAL_SAHAL">Sahal</option>
                        <option value="LOCAL_PREMIER_WALLET">Premier Wallet</option>
                     </optgroup>
                     <optgroup label="Global Cards">
                        <option value="GLOBAL_MASTERCARD">Mastercard</option>
                        <option value="GLOBAL_PAYPAL">PayPal</option>
                     </optgroup>
                   </select>
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white space-y-6 sticky top-24">
            <h2 className="text-xl font-bold">Booking Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between pb-4 border-b border-indigo-500/50">
                <span className="opacity-80">Duration</span>
                <span className="font-bold">{durationHours > 0 ? `${durationHours.toFixed(1)} hrs` : '---'}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-indigo-500/50">
                <span className="opacity-80">Total Price</span>
                <span className="font-bold">${dynamicTotalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="opacity-80 text-sm">Amount You Are Paying Now</span>
                <span className="text-xl font-extrabold text-emerald-300">
                  ${actualPaymentAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="opacity-80 text-sm">Remaining Balance</span>
                <span className="text-sm font-bold opacity-80">
                  ${Math.max(0, dynamicTotalPrice - actualPaymentAmount).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="pt-4 space-y-2 border-t border-indigo-500/50 mt-4">
              <p className="text-xs opacity-70 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" /> Payment securely processed via your selection
              </p>
            </div>
            
            <button
              form="checkout-form"
              type="submit"
              disabled={isSubmitting || durationHours <= 0}
              className="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl disabled:opacity-50 mt-6 flex items-center justify-center"
            >
              {isSubmitting ? "Processing..." : `Pay \$${actualPaymentAmount.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

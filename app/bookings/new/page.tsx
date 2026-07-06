"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { Calendar, MapPin, Package, CheckCircle, Loader2 } from "lucide-react";

interface Decoration {
  id: string;
  name: string;
  price: number;
  availableQty: number;
}

function BookingForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedItemId = searchParams.get("item");

  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [fetchingDecorations, setFetchingDecorations] = useState(true);
  const [bookingData, setBookingData] = useState({
    eventDate: "",
    endDate: "",
    location: "",
    items: [] as { decorationId: string; quantity: number }[],
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const LOCATIONS = [
    "Hodan",
    "Wadajir",
    "Dharkiinleey",
    "Wabari",
    "Xamar Wayne",
    "Boondheer",
    "Kaaraan",
    "Kaxda",
    "Dayniile",
    "Garasbaaleey",
    "Cabdicasiis",
    "Gubadleey",
    "Shibi",
    "Yaaqshiid",
    "Hawlwadaag"
  ];

  useEffect(() => {
    fetch("/api/decorations")
      .then((res) => res.json())
      .then((data) => {
        setDecorations(data);
        if (selectedItemId) {
          setBookingData((prev) => ({
            ...prev,
            items: [{ decorationId: selectedItemId, quantity: 1 }],
          }));
        }
        setFetchingDecorations(false);
      });
  }, [selectedItemId]);

  const handleAddItem = () => {
    setBookingData((prev) => ({
      ...prev,
      items: [...prev.items, { decorationId: "", quantity: 1 }],
    }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...bookingData.items];
    (newItems[index] as any)[field] = value;
    setBookingData({ ...bookingData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to create a booking");
      router.push("/auth/login");
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create booking");
        return;
      }

      const booking = await res.json();
      toast.success("Booking created! Proceeding to payment...");
      router.push(`/bookings/${booking.id}/payment`);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  if (loading || fetchingDecorations) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-gray-500 font-medium anim-pulse">Loading booking details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white">
          <h1 className="text-3xl font-bold">New Booking</h1>
          <p className="opacity-90">Fill in the details to reserve your decor.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Dates and Location */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 mr-2" /> Event Start Date
              </label>
              <input
                type="date"
                required
                min={todayStr}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                value={bookingData.eventDate}
                onChange={(e) => setBookingData({ ...bookingData, eventDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 mr-2" /> Event End Date
              </label>
              <input
                type="date"
                required
                min={bookingData.eventDate || todayStr}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                value={bookingData.endDate}
                onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <MapPin className="w-4 h-4 mr-2" /> Venue Location
              </label>
              <select
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                value={bookingData.location}
                onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
              >
                <option value="">Select a location</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Items Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <Package className="w-5 h-5 mr-2" /> Selected Items
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-indigo-600 font-bold hover:text-indigo-700"
              >
                + Add Another Item
              </button>
            </div>

            {bookingData.items.map((item, index) => (
              <div key={index} className="flex gap-4 items-end bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex-grow space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Item</label>
                  <select
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg"
                    value={item.decorationId}
                    onChange={(e) => handleItemChange(index, "decorationId", e.target.value)}
                  >
                    <option value="">Select an item</option>
                    {decorations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (${d.price}/day)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center"
            >
              <CheckCircle className="w-6 h-6 mr-2" />
              Confirm and Proceed to Deposit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    }>
      <BookingForm />
    </Suspense>
  );
}

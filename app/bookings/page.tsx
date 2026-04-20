"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Clock, Package, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, DollarSign, CreditCard, AlertCircle
} from "lucide-react";
import Link from "next/link";

interface BookingItem {
  id: string;
  quantity: number;
  price: number;
  decoration: { id: string; name: string; image: string | null };
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string;
  createdAt: string;
}

interface Booking {
  id: string;
  eventDate: string;
  endDate: string;
  location: string;
  status: string;
  totalPrice: number;
  deposit: number;
  balance: number;
  createdAt: string;
  bookingItems: BookingItem[];
  payments: Payment[];
}

const STATUS_CFG: Record<string, { classes: string; icon: React.ReactNode }> = {
  PENDING:   { classes: "bg-amber-50 text-amber-600 border-amber-200",   icon: <Clock className="w-3.5 h-3.5" /> },
  CONFIRMED: { classes: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  COMPLETED: { classes: "bg-blue-50 text-blue-600 border-blue-200",       icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CANCELLED: { classes: "bg-red-50 text-red-600 border-red-200",          icon: <XCircle className="w-3.5 h-3.5" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide ${cfg.classes}`}>
      {cfg.icon}{status}
    </span>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Main row */}
      <div className="p-6 flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest mb-0.5">ID: {booking.id}</p>
            <p className="font-extrabold text-gray-900 text-lg flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />{booking.location}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(booking.eventDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <StatusBadge status={booking.status} />
          <p className="text-2xl font-extrabold text-indigo-600">${booking.totalPrice.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment bar */}
      <div className="flex flex-wrap gap-6 px-6 py-3 bg-gray-50 border-y border-gray-200 text-sm">
        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
          <DollarSign className="w-4 h-4" />Paid: ${(booking.totalPrice - booking.balance).toLocaleString()}
        </div>
        <div className="flex items-center gap-1.5 text-amber-600 font-bold">
          <AlertCircle className="w-4 h-4" />Balance: ${booking.balance.toLocaleString()}
        </div>
        <span className="ml-auto text-xs text-gray-500">
          Booked {new Date(booking.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center px-6 py-4 text-sm font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/40 transition-colors"
      >
        <span>{booking.bookingItems.length} decoration{booking.bookingItems.length !== 1 ? "s" : ""} reserved</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 pt-2 space-y-5 border-t border-gray-50">
          {/* Items */}
          <div>
            <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Reserved Items</p>
            <div className="divide-y divide-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
              {booking.bookingItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.decoration.image
                      ? <img src={item.decoration.image} alt={item.decoration.name} className="w-full h-full object-cover" />
                      : <Package className="w-5 h-5 text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{item.decoration.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-extrabold text-gray-900">${(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payments */}
          {booking.payments.length > 0 && (
            <div>
              <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Payment History</p>
              <div className="divide-y divide-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                {booking.payments.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{p.transactionId}</p>
                      <p className="text-xs text-gray-500">{p.method.replace("_"," ")} · {new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-gray-900">${p.amount.toLocaleString()}</p>
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                        p.status === "SUCCESS" ? "text-emerald-600" : p.status === "FAILED" ? "text-red-500" : "text-amber-500"
                      }`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {booking.status === "PENDING" && (
            <Link
              href={`/bookings/${booking.id}/payment`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
            >
              <CreditCard className="w-4 h-4" /> Pay Deposit
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
      return;
    }
    if (user) {
      fetch("/api/user/bookings")
        .then((r) => r.json())
        .then((data) => {
          setBookings(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user, isLoading, router]);

  const filtered = filter === "ALL" ? bookings : bookings.filter(b => b.status === filter);

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Bookings</h1>
            <p className="text-gray-500 mt-1">Track your decoration reservations and payments.</p>
          </div>
          <Link href="/" className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition text-sm">
            + New Booking
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {["ALL","PENDING","CONFIRMED","COMPLETED","CANCELLED"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest border transition-all ${
                filter === s
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {s === "ALL" ? "All" : s}
              {s !== "ALL" && <span className="ml-1 opacity-70">({bookings.filter(b => b.status === s).length})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-3xl animate-pulse border border-gray-200" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-200">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">No bookings found</h3>
            <p className="text-gray-500 mt-2">{filter === "ALL" ? "You haven't made any reservations yet." : `No ${filter.toLowerCase()} bookings.`}</p>
            <Link href="/" className="mt-6 inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition">
              Browse Decorations
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(b => <BookingCard key={b.id} booking={b} />)}
          </div>
        )}
      </div>
    </main>
  );
}

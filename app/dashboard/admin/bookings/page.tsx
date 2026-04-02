"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Search, 
  Filter, 
  MoreHorizontal, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Eye,
  User as UserIcon,
  Package,
  ArrowRight,
  TrendingUp,
  X,
  Trash2,
  Plus,
  Edit2
} from "lucide-react";
import { CreateBookingModal, EditBookingModal } from "./BookingModals";

interface Booking {
  id: string;
  user: { fullName: string; email: string };
  eventDate: string;
  endDate: string;
  location: string;
  status: string;
  totalPrice: number;
  deposit: number;
  balance: number;
  bookingItems: any[];
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    const params = new URLSearchParams({
      status: statusFilter,
      search: search
    });
    const res = await fetch(`/api/admin/bookings?${params.toString()}`);
    const data = await res.json();
    setBookings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, search]);

  const updateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) fetchBookings();
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Delete this booking and restore inventory?")) return;
    const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    if (res.ok) fetchBookings();
    else {
      const d = await res.json();
      alert(d.error || "Delete failed");
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Booking Management</h1>
          <p className="text-gray-500 font-medium">Track reservations, manage event dates, and update rental statuses.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
          <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
             <input 
               type="text" 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search by customer..." 
               className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-64"
             />
          </div>
          <div className="h-8 w-px bg-gray-100 mx-2" />
          <select 
            className="bg-gray-50 border-none rounded-xl text-sm font-bold px-4 py-2 text-gray-600 focus:ring-0"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="ml-4 flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </button>
        </div>
      </header>

      {/* Bookings Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Booking ID & Customer</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Event Detail</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Total Price</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-500 animate-pulse">Loading bookings...</td>
                </tr>
              ) : bookings.map((booking) => (
                <tr key={booking.id} className="group hover:bg-gray-50/50 transition duration-200">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">#{booking.id.slice(0, 8)}</p>
                        <p className="font-bold text-gray-900 text-base mb-0.5">{booking.user.fullName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-sm font-bold text-gray-700">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                        {new Date(booking.eventDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 font-medium">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-[150px]">{booking.location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-gray-900">${booking.totalPrice.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Paid: ${booking.deposit}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <StatusChip status={booking.status} />
                      <div className="w-px h-4 bg-gray-100" />
                      <select 
                        className="bg-transparent border-none text-[10px] font-bold text-gray-500 uppercase tracking-widest focus:ring-0 cursor-pointer hover:text-indigo-600"
                        value={booking.status}
                        onChange={(e) => updateStatus(booking.id, e.target.value)}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => deleteBooking(booking.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingBooking(booking)}
                        className="p-2 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit booking"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedBooking(booking)}
                        className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all font-bold text-sm flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Details</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBooking && (
        <BookingDetailModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
        />
      )}

      {isCreateModalOpen && (
        <CreateBookingModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => { setIsCreateModalOpen(false); fetchBookings(); }}
        />
      )}

      {editingBooking && (
        <EditBookingModal 
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSuccess={() => { setEditingBooking(null); fetchBookings(); }}
        />
      )}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const configs: any = {
    CONFIRMED: { icon: <CheckCircle2 className="w-3 h-3" />, class: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    PENDING: { icon: <Clock className="w-3 h-3" />, class: "bg-amber-50 text-amber-600 border-amber-100" },
    COMPLETED: { icon: <CheckCircle2 className="w-3 h-3" />, class: "bg-blue-50 text-blue-600 border-blue-100" },
    CANCELLED: { icon: <XCircle className="w-3 h-3" />, class: "bg-rose-50 text-rose-600 border-rose-100" },
  };
  const config = configs[status] || configs.PENDING;
  
  return (
    <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${config.class}`}>
      {config.icon}
      <span>{status}</span>
    </div>
  );
}

function BookingDetailModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Booking Details</h2>
            <p className="text-sm text-gray-500 font-medium">#{booking.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
               <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Customer Information</h4>
               <div className="flex items-center space-x-3">
                 <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold uppercase">
                   {booking.user.fullName[0]}
                 </div>
                 <div>
                   <p className="font-bold text-gray-900">{booking.user.fullName}</p>
                   <p className="text-xs text-gray-500">{booking.user.email}</p>
                 </div>
               </div>
            </div>
            <div className="space-y-4">
               <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Event Timeline</h4>
               <div className="space-y-2">
                 <div className="flex items-center text-sm font-bold text-gray-700">
                   <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                   Start: {new Date(booking.eventDate).toLocaleDateString()}
                 </div>
                 <div className="flex items-center text-sm font-bold text-gray-700">
                   <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                   End: {new Date(booking.endDate).toLocaleDateString()}
                 </div>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Reserved Items</h4>
             <div className="bg-gray-50 rounded-[2rem] p-6 space-y-4">
               {booking.bookingItems.map((item: any) => (
                 <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-gray-200 overflow-hidden">
                         {item.decoration.image ? (
                           <img src={item.decoration.image} alt="" className="w-full h-full object-cover" />
                         ) : <Package className="w-5 h-5 text-gray-300" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.decoration.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">${(item.price * item.quantity).toLocaleString()}</span>
                 </div>
               ))}
               <div className="pt-4 border-t border-gray-200 mt-4 flex justify-between items-center px-2">
                 <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Grand Total</span>
                 <span className="text-2xl font-extrabold text-indigo-600">${booking.totalPrice.toLocaleString()}</span>
               </div>
             </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50 flex items-center justify-between">
           <div className="space-y-1">
             <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Current Status</p>
             <StatusChip status={booking.status} />
           </div>
           <button 
             onClick={onClose}
             className="px-8 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition shadow-sm"
           >
             Close Details
           </button>
        </div>
      </div>
    </div>
  );
}

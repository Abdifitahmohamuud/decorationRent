"use client";

import { useState, useEffect } from "react";
import {
  Bell, Plus, Trash2, Mail, CheckCircle, Clock, Tag, User as UserIcon, RefreshCw, X
} from "lucide-react";

interface Notification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  sentEmail: boolean;
  createdAt: string;
  user: { fullName: string; email: string };
}

interface User { id: string; fullName: string; email: string; }

const TYPE_CFG: Record<string, string> = {
  BOOKING: "bg-indigo-50 text-indigo-600 border-indigo-100",
  PAYMENT: "bg-emerald-50 text-emerald-600 border-emerald-100",
  REMINDER: "bg-amber-50 text-amber-600 border-amber-100",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ userId: "", message: "", type: "BOOKING" });
  const [saving, setSaving] = useState(false);

  const fetchNotifications = async () => {
    const params = new URLSearchParams(typeFilter !== "ALL" ? { type: typeFilter } : {});
    const res = await fetch(`/api/admin/notifications?${params}`);
    const data = await res.json();
    setNotifications(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchNotifications(); }, [typeFilter]);

  const toggleRead = async (n: Notification) => {
    await fetch(`/api/admin/notifications/${n.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: !n.isRead }),
    });
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
    fetchNotifications();
  };

  const createNotification = async () => {
    if (!form.userId || !form.message) return alert("Please fill all required fields");
    setSaving(true);
    
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Could not send the email notification");
      
      setShowCreate(false);
      setForm({ userId: "", message: "", type: "BOOKING" });
      fetchNotifications();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-gray-500 font-medium">
            {unreadCount} unread · {notifications.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-white border border-gray-200 rounded-xl text-sm font-bold px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="BOOKING">Booking</option>
            <option value="PAYMENT">Payment</option>
            <option value="REMINDER">Reminder</option>
          </select>
          <button
            onClick={() => { setShowCreate(true); fetchUsers(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" /> Send Notification
          </button>
        </div>
      </header>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-200 p-8 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-gray-900">Send New Message</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="space-y-4">
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                value={form.userId}
                onChange={e => setForm({ ...form, userId: e.target.value })}
              >
                <option value="">Select Target User</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
              </select>
              
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="BOOKING">Booking Related</option>
                <option value="PAYMENT">Payment Update</option>
                <option value="REMINDER">Notification/Reminder</option>
              </select>

              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 resize-none h-32"
                placeholder="Compose your email message here..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
              />

              <div className="flex items-center space-x-2 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sent via Nodemailer Service</span>
              </div>
            </div>

            <button
              onClick={createNotification}
              disabled={saving}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              {saving ? "Dispatching..." : "Send Email Notification"}
            </button>
          </div>
        </div>
      )}

      {/* Message History Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-medium">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Recipient</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Message</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Via Email</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Sent On</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-gray-400 animate-pulse">Fetching message history...</td></tr>
              ) : notifications.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-gray-400">No message history found.</td></tr>
              ) : notifications.map(n => (
                <tr key={n.id} className={`group hover:bg-gray-50/20 transition ${!n.isRead ? "bg-indigo-50/20" : ""}`}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {n.user.fullName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{n.user.fullName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{n.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 max-w-xs">
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${TYPE_CFG[n.type] || TYPE_CFG.BOOKING}`}>
                        {n.type}
                      </span>
                      <p className={`text-sm ${!n.isRead ? "font-bold text-gray-900" : "text-gray-500"} truncate block`}>
                        {n.message}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center">
                       {n.sentEmail ? (
                         <div className="flex flex-col items-center gap-1 group/email cursor-help">
                           <Mail className="w-4 h-4 text-emerald-500" />
                           <span className="text-[8px] font-black text-emerald-500 uppercase opacity-0 group-hover/email:opacity-100 transition">Sent Success</span>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center gap-1 group/email cursor-help">
                           <Mail className="w-4 h-4 text-orange-400" />
                           <span className="text-[8px] font-black text-orange-400 uppercase opacity-0 group-hover/email:opacity-100 transition tracking-tighter">In-App Only</span>
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button onClick={() => toggleRead(n)} className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full transition-all ${
                      n.isRead
                        ? "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                        : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                    }`}>
                      {n.isRead ? "Mark New" : "Mark Seen"}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-xs text-gray-400 font-bold">{new Date(n.createdAt).toLocaleDateString()}</td>
                  <td className="px-8 py-5 text-right">
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


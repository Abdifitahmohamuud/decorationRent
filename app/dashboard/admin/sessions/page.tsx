"use client";

import { useState, useEffect } from "react";
import { LogIn, Trash2, RefreshCw, Clock, Shield, User as UserIcon, AlertCircle } from "lucide-react";

interface Session {
  id: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  user: { fullName: string; email: string; role: string };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sessions");
    const data = await res.json();
    setSessions(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  const deleteSession = async (id: string) => {
    if (!confirm("Terminate this session? The user will be logged out.")) return;
    await fetch(`/api/admin/sessions?id=${id}`, { method: "DELETE" });
    fetchSessions();
  };

  const clearExpired = async () => {
    if (!confirm("Delete all expired sessions?")) return;
    await fetch("/api/admin/sessions", { method: "DELETE" });
    fetchSessions();
  };

  const now = new Date();
  const active = sessions.filter(s => new Date(s.expiresAt) > now);
  const expired = sessions.filter(s => new Date(s.expiresAt) <= now);

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sessions</h1>
          <p className="text-gray-500 font-medium">
            {active.length} active · {expired.length} expired
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSessions}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={clearExpired}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 transition text-sm"
          >
            <Trash2 className="w-4 h-4" /> Clear Expired
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg shadow-indigo-100">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Active Sessions</p>
          <p className="text-4xl font-extrabold">{active.length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Expired Sessions</p>
          <p className="text-4xl font-extrabold text-gray-900">{expired.length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total Sessions</p>
          <p className="text-4xl font-extrabold text-gray-900">{sessions.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">User</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Token</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Expires</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-gray-500 animate-pulse">Loading sessions...</td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-gray-500">No sessions found.</td></tr>
              ) : sessions.map(s => {
                const isExpired = new Date(s.expiresAt) <= now;
                return (
                  <tr key={s.id} className={`hover:bg-gray-50/50 transition ${isExpired ? "opacity-60" : ""}`}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                          {s.user.fullName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{s.user.fullName}</p>
                          <p className="text-xs text-gray-500">{s.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                        s.user.role === "ADMIN" ? "bg-indigo-600 text-white" : "bg-blue-50 text-blue-700"
                      }`}>{s.user.role}</span>
                    </td>
                    <td className="px-8 py-5">
                      <code className="text-[10px] font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                        {s.token.slice(0, 20)}…
                      </code>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${
                        isExpired ? "text-red-500" : "text-emerald-600"
                      }`}>
                        {isExpired ? <AlertCircle className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                        {isExpired ? "Expired" : "Active"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-500">
                      {new Date(s.expiresAt).toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => deleteSession(s.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                        title="Terminate session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

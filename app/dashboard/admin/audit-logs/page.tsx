"use client";

import { useState, useEffect } from "react";
import {
  Shield, Search, Trash2, RefreshCw, AlertTriangle, User as UserIcon,
  Database, Clock, Filter
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { fullName: string; email: string } | null;
}

const ENTITY_COLORS: Record<string, string> = {
  User: "bg-indigo-50 text-indigo-600",
  Decoration: "bg-purple-50 text-purple-600",
  Booking: "bg-amber-50 text-amber-600",
  Payment: "bg-emerald-50 text-emerald-600",
  Session: "bg-gray-100 text-gray-600",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams(entityFilter !== "ALL" ? { entity: entityFilter } : {});
    const res = await fetch(`/api/admin/audit-logs?${params}`);
    const data = await res.json();
    setLogs(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [entityFilter]);

  const clearLogs = async () => {
    if (!confirm(`Clear all${entityFilter !== "ALL" ? " " + entityFilter : ""} audit logs?`)) return;
    const params = new URLSearchParams(entityFilter !== "ALL" ? { entity: entityFilter } : {});
    await fetch(`/api/admin/audit-logs?${params}`, { method: "DELETE" });
    fetchLogs();
  };

  const filtered = search
    ? logs.filter(l =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entity.toLowerCase().includes(search.toLowerCase()) ||
        (l.user?.fullName || "").toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const entities = ["ALL", "User", "Decoration", "Booking", "Payment", "Session"];

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Audit Logs</h1>
          <p className="text-gray-500 font-medium">Track all admin and system actions for security compliance.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search logs..."
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-52"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-white border border-gray-200 rounded-xl text-sm font-bold px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20"
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
          >
            {entities.map(e => <option key={e} value={e}>{e === "ALL" ? "All Entities" : e}</option>)}
          </select>
          <button
            onClick={fetchLogs}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold hover:bg-red-100 transition text-sm"
          >
            <Trash2 className="w-4 h-4" /> Clear Logs
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["All", "User", "Booking", "Payment"].map(e => {
          const count = e === "All" ? logs.length : logs.filter(l => l.entity === e).length;
          return (
            <div key={e} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-1">{e} Events</p>
              <p className="text-3xl font-extrabold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Action</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Entity</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Performed By</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">IP Address</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-12 text-center text-gray-500 animate-pulse">Loading audit logs...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-12 text-center text-gray-500">No logs found.</td></tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-300" />
                      <span className="font-bold text-gray-900 text-sm">{log.action}</span>
                    </div>
                    {log.entityId && <p className="text-[10px] text-gray-500 mt-0.5 font-mono">ID: {log.entityId.slice(0,12)}…</p>}
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-widest ${ENTITY_COLORS[log.entity] || "bg-gray-50 text-gray-500"}`}>
                      {log.entity}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    {log.user ? (
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{log.user.fullName}</p>
                        <p className="text-xs text-gray-500">{log.user.email}</p>
                      </div>
                    ) : <span className="text-xs text-gray-500 italic">System</span>}
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs font-mono text-gray-500">{log.ipAddress || "—"}</span>
                  </td>
                  <td className="px-8 py-4 text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
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

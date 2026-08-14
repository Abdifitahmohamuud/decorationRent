"use client";

import { useState } from "react";
import { X, User, Mail, Lock, Shield } from "lucide-react";

export function CreateUserModal({ onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "CUSTOMER",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to create user");
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create New User</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 flex-grow">
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><User className="w-3 h-3 inline mr-1" />Full Name</label>
            <input
              required type="text" placeholder="John Doe"
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Mail className="w-3 h-3 inline mr-1" />Email Address</label>
            <input
              required type="email" placeholder="john@example.com"
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Lock className="w-3 h-3 inline mr-1" />Password</label>
            <input
              required type="password" placeholder="••••••••" minLength={6}
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Shield className="w-3 h-3 inline mr-1" />Role</label>
            <select
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900 uppercase tracking-wider text-sm"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="CUSTOMER">Customer</option>
              {/* <option value="STAFF">Staff</option> */}
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="pt-8 flex items-center space-x-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 rounded-[1.5rem] font-bold text-gray-500 transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-indigo-100 transition active:scale-[0.98] disabled:opacity-50">
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditUserModal({ user, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const isAdmin = user.role === "ADMIN"; // Admin accounts can't have their role changed from here
  const [formData, setFormData] = useState({
    fullName: user.fullName || "",
    email: user.email || "",
    role: user.role || "CUSTOMER",
    password: "", // Only update if typed
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Avoid sending empty password
      const payload = { ...formData };
      if (!payload.password) delete (payload as any).password;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Failed to update user");
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><User className="w-3 h-3 inline mr-1" />Full Name</label>
            <input
              required type="text"
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Mail className="w-3 h-3 inline mr-1" />Email Address</label>
            <input
              required type="email"
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Lock className="w-3 h-3 inline mr-1" />Reset Password (Optional)</label>
            <input
              type="password" placeholder="Leave blank to keep unchanged" minLength={6}
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900 placeholder:text-gray-400"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {/* Role selector is hidden for ADMIN accounts — only name, email, password stay editable */}
          {!isAdmin && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Shield className="w-3 h-3 inline mr-1" />Role</label>
              <select
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900 uppercase tracking-wider text-sm"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="CUSTOMER">Customer</option>
                {/* <option value="STAFF">Staff</option> */}
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          )}

          {isAdmin && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1"><Shield className="w-3 h-3 inline mr-1" />Role</label>
              <div className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl font-medium text-gray-400 uppercase tracking-wider text-sm cursor-not-allowed">
                Admin
              </div>
              <p className="text-[11px] font-bold text-gray-400 ml-1">Admin role cannot be changed from this screen</p>
            </div>
          )}

          <div className="pt-8 flex items-center space-x-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 rounded-[1.5rem] font-bold text-gray-500 transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-indigo-100 transition active:scale-[0.98] disabled:opacity-50">
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
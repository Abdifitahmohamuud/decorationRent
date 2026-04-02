"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Shield, 
  User as UserIcon, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Mail,
  Calendar,
  Plus
} from "lucide-react";

import { CreateUserModal, EditUserModal } from "./UserModals";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    const params = new URLSearchParams({
      search,
      role: roleFilter
    });
    const res = await fetch(`/api/admin/users?${params.toString()}`);
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const toggleStatus = async (user: User) => {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive })
    });
    if (res.ok) fetchUsers();
  };

  const changeRole = async (user: User, newRole: string) => {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole })
    });
    if (res.ok) fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) fetchUsers();
    else {
      const data = await res.json();
      alert(data.error);
    }
  };

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 font-medium">Manage permissions, roles, and account status for all system users.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
          <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
             <input 
               type="text" 
               placeholder="Search by name or email..." 
               className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-64"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <div className="h-8 w-px bg-gray-100 mx-2" />
          <select 
            className="bg-gray-50 border-none rounded-xl text-sm font-bold px-4 py-2 text-gray-600 focus:ring-0"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="CUSTOMER">Customer</option>
            <option value="STAFF">Staff</option>
          </select>
          <div className="h-8 w-px bg-gray-100 mx-2 hidden md:block" />
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add User
          </button>
        </div>
      </header>

      {/* Users Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">User Details</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Role</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Joined Date</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-500 animate-pulse">Loading users...</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user.id} className="group hover:bg-gray-50/50 transition duration-200">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <UserIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base mb-0.5">{user.fullName}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail className="w-3 h-3 mr-1" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <RoleBadge role={user.role} onUpdate={(role) => changeRole(user, role)} />
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => toggleStatus(user)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border transition ${
                        user.isActive 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" 
                        : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {user.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{user.isActive ? "Active" : "Disabled"}</span>
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm font-bold text-gray-700">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                       <button 
                         onClick={() => deleteUser(user.id)}
                         className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                         title="Delete User"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                       <button 
                         onClick={() => setEditingUser(user)}
                         className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                         title="Edit User"
                       >
                         <MoreHorizontal className="w-5 h-5" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isCreateModalOpen && (
        <CreateUserModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => { setIsCreateModalOpen(false); fetchUsers(); }}
        />
      )}
      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => { setEditingUser(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}

function RoleBadge({ role, onUpdate }: { role: string; onUpdate: (role: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const configs: any = {
    ADMIN: "bg-indigo-600 text-white",
    CUSTOMER: "bg-blue-100 text-blue-700",
    STAFF: "bg-purple-100 text-purple-700",
  };

  if (isEditing) {
    return (
      <select 
        autoFocus
        className="text-[10px] font-bold rounded-lg border-gray-200 py-1"
        value={role}
        onChange={(e) => {
          onUpdate(e.target.value);
          setIsEditing(false);
        }}
        onBlur={() => setIsEditing(false)}
      >
        <option value="ADMIN">ADMIN</option>
        <option value="CUSTOMER">CUSTOMER</option>
        <option value="STAFF">STAFF</option>
      </select>
    );
  }

  return (
    <button 
      onClick={() => setIsEditing(true)}
      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm hover:ring-2 hover:ring-offset-1 ring-indigo-500/20 transition ${configs[role]}`}
    >
      {role}
    </button>
  );
}

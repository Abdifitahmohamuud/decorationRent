"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Package, Calendar, DollarSign,
  LogOut, Sparkles, Bell, Shield, LogIn, ClipboardList, Wallet, CreditCard, Clock, XCircle, RotateCcw, Truck, CornerUpLeft
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { cn } from "@/lib/utils";

const menuGroups = [
  {
    label: "Core",
    items: [
      { icon: LayoutDashboard, label: "Overview",       href: "/dashboard/admin" },
      { icon: Package,         label: "Inventory",      href: "/dashboard/admin/inventory" },
      { icon: Truck,           label: "Taken Items",    href: "/dashboard/admin/taken-items" },
      { icon: RotateCcw,       label: "Returned Items", href: "/dashboard/admin/returned-items" },
      { icon: Calendar,        label: "Bookings",       href: "/dashboard/admin/bookings" },
      { icon: XCircle,         label: "Cancellations",  href: "/dashboard/admin/cancellations" },
      { icon: CornerUpLeft,    label: "Refund History", href: "/dashboard/admin/refunds" },
      { icon: Clock,           label: "Booking History", href: "/dashboard/admin/bookings/history" },
      { icon: ClipboardList,   label: "Booking Items",  href: "/dashboard/admin/booking-items" },
      { icon: Users,           label: "Users",          href: "/dashboard/admin/users" },
      { icon: DollarSign,      label: "Payments",       href: "/dashboard/admin/payments" },
      { icon: CreditCard,      label: "Checkout",       href: "/dashboard/admin/checkout" },
      { icon: Wallet,          label: "Finance",        href: "/dashboard/admin/finance" },
    ],
  },
  {
    label: "System",
    items: [
      { icon: Bell,    label: "Notifications", href: "/dashboard/admin/notifications" },
      { icon: Shield,  label: "Audit Logs",    href: "/dashboard/admin/audit-logs" },
      { icon: LogIn,   label: "Sessions",      href: "/dashboard/admin/sessions" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-8">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 leading-none">
            Decor<span className="text-indigo-600">Rent</span>
            <span className="block text-[10px] uppercase tracking-widest text-gray-500 mt-1 font-medium">Admin Portal</span>
          </span>
        </Link>
      </div>

      <nav className="flex-grow px-4 space-y-6 mt-2 overflow-y-auto pb-4">
        {menuGroups.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest px-4 mb-2">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group",
                      isActive
                        ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-gray-500 group-hover:text-gray-600")} />
                      <span className="font-semibold text-[15px]">{item.label}</span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {user?.fullName?.[0] || "A"}
            </div>
            <div className="flex-grow overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName || "Administrator"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition font-semibold text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

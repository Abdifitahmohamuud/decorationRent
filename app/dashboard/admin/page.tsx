"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Package, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface Stats {
  totalUsers: number;
  totalBookings: number;
  activeRentals: number;
  totalRevenue: number;
}

interface Booking {
  id: string;
  user: { fullName: string; email: string };
  eventDate: string;
  totalPrice: number;
  status: string;
}

interface ChartData {
  date: string;
  amount: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setRecentBookings(data.recentBookings);
        setChartData(data.chartData);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-12 space-y-8 animate-pulse text-gray-500 text-center">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Business Overview</h1>
          <p className="text-gray-500 font-medium">Welcome back, {user?.fullName || "Admin"}. Here's what's happening today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search data..." 
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64 shadow-sm"
            />
          </div>
          <button className="bg-white border border-gray-200 p-2 rounded-xl shadow-sm hover:bg-gray-50 transition">
             <Calendar className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Revenue" 
          value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`} 
          icon={<DollarSign className="w-6 h-6" />}
          trend="+12.5%"
          trendUp={true}
          color="bg-emerald-500"
        />
        <StatCard 
          title="Total Bookings" 
          value={stats?.totalBookings ?? 0} 
          icon={<Calendar className="w-6 h-6" />}
          trend="+8.2%"
          trendUp={true}
          color="bg-indigo-500"
        />
        <StatCard 
          title="Active Rentals" 
          value={stats?.activeRentals ?? 0} 
          icon={<Package className="w-6 h-6" />}
          trend="-2.4%"
          trendUp={false}
          color="bg-amber-500"
        />
        <StatCard 
          title="Total Customers" 
          value={stats?.totalUsers ?? 0} 
          icon={<Users className="w-6 h-6" />}
          trend="+5.1%"
          trendUp={true}
          color="bg-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Revenue Growth</h2>
              <p className="text-sm text-gray-500">Last 30 days performance</p>
            </div>
            <select className="bg-gray-50 border-none rounded-lg text-xs font-bold px-3 py-1 text-gray-600 focus:ring-0">
              <option>Last 30 days</option>
              <option>Last 6 months</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData || []}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 500}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 500}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="space-y-6">
          <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500" />
            <div className="relative z-10">
              <TrendingUp className="w-8 h-8 text-indigo-200 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Monthly Target</h3>
              <p className="text-indigo-100 text-sm opacity-80 mb-6">You've reached 85% of your monthly goal.</p>
              <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                <div className="bg-white h-full rounded-full transition-all" style={{ width: '85%' }} />
              </div>
              <p className="text-right text-xs font-bold text-indigo-100">85% Complete</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold mb-6">Status Overview</h3>
            <div className="space-y-4">
               <StatusProgress label="Pending Bookings" count={recentBookings?.filter(b => b.status === 'PENDING').length ?? 0} total={stats?.totalBookings || 1} color="bg-amber-400" />
               <StatusProgress label="Confirmed" count={recentBookings?.filter(b => b.status === 'CONFIRMED').length ?? 0} total={stats?.totalBookings || 1} color="bg-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
            <p className="text-sm text-gray-500">Track and manage latest customer interactions</p>
          </div>
          <button className="text-indigo-600 text-sm font-bold hover:underline">View All Bookings</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-gray-50/50">
               <tr>
                 <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                 <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                 <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Total</th>
                 <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                 <th className="px-8 py-4"></th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {recentBookings?.map((booking) => (
                 <tr key={booking.id} className="group hover:bg-gray-50/50 transition">
                   <td className="px-8 py-6">
                     <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition">
                         {booking.user.fullName[0]}
                       </div>
                       <div>
                         <p className="font-bold text-gray-900 leading-none mb-1">{booking.user.fullName}</p>
                         <p className="text-xs text-gray-500">{booking.user.email}</p>
                       </div>
                     </div>
                   </td>
                   <td className="px-8 py-6 text-sm font-medium text-gray-600">
                     {new Date(booking.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                   </td>
                   <td className="px-8 py-6">
                     <span className="font-extrabold text-gray-900">${booking.totalPrice.toLocaleString()}</span>
                   </td>
                   <td className="px-8 py-6">
                     <StatusChip status={booking.status} />
                   </td>
                   <td className="px-8 py-6 text-right">
                     <button className="text-indigo-600 font-bold text-sm hover:underline">Details</button>
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

function StatCard({ title, value, icon, trend, trendUp, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200 hover:border-indigo-100 transition duration-300 relative overflow-hidden group">
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${color} opacity-[0.03] rounded-full group-hover:scale-150 transition duration-500`} />
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-indigo-200/20`}>
          {icon}
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-bold ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{trend}</span>
        </div>
      </div>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-extrabold text-gray-900">{value}</h3>
    </div>
  );
}

function StatusProgress({ label, count, total, color }: any) {
  const percentage = (count / total) * 100;
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <p className="text-sm font-bold text-gray-700">{label}</p>
        <span className="text-xs font-bold text-gray-500">{count} items</span>
      </div>
      <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const configs: any = {
    CONFIRMED: { icon: <CheckCircle2 className="w-3 h-3" />, class: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    PENDING: { icon: <Clock className="w-3 h-3" />, class: "bg-amber-50 text-amber-600 border-amber-100" },
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

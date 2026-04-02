"use client";

import { useState, useEffect } from "react";
import { DollarSign, Wallet, TrendingUp, CreditCard, Smartphone, CheckCircle2, History } from "lucide-react";
import { toast } from "react-hot-toast";

interface PaymentBreakdown {
  method: string;
  totalAmount: number;
  count: number;
}

interface RecentTransaction {
  id: string;
  booking: { user: { fullName: string } };
  method: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface FinanceStats {
  cashOnHand: number;
  outstandingMoney: number;
  expectedRevenue: number;
  paymentBreakdown: PaymentBreakdown[];
  recentTransactions: RecentTransaction[];
}

export default function AdminFinanceDashboard() {
  const [data, setData] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/finance")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load finance data");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Loading finance metrics...</div>;
  if (!data) return <div className="p-12 text-center text-red-500">Error loading finances.</div>;

  return (
    <div className="p-8 lg:p-12 space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
          <Wallet className="w-8 h-8 mr-3 text-indigo-600" />
          Finance Overview
        </h1>
        <p className="text-gray-500 font-medium mt-2">Track your total revenues, cash on hand, and pending collections.</p>
      </header>

      {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-600 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group hover:shadow-2xl transition">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500" />
          <div className="relative z-10">
            <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs mb-2 flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              Cash on Hand
            </p>
            <h2 className="text-4xl font-extrabold mb-1">${data.cashOnHand.toLocaleString()}</h2>
            <p className="text-sm opacity-80 mt-4">Actual money received successfully</p>
          </div>
        </div>

        <div className="bg-rose-500 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group hover:shadow-2xl transition">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500" />
          <div className="relative z-10">
            <p className="text-rose-100 font-bold uppercase tracking-widest text-xs mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Outstanding Collections
            </p>
            <h2 className="text-4xl font-extrabold mb-1">${data.outstandingMoney.toLocaleString()}</h2>
            <p className="text-sm opacity-80 mt-4">Pending balances to be collected</p>
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group hover:shadow-2xl transition">
          <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition duration-500" />
          <div className="relative z-10">
            <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-2 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Expected Revenue
            </p>
            <h2 className="text-4xl font-extrabold mb-1">${data.expectedRevenue.toLocaleString()}</h2>
            <p className="text-sm opacity-80 mt-4">Total worth of active bookings</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Method Breakdown */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 flex items-center mb-6">
            <CreditCard className="w-5 h-5 mr-2 text-gray-400" />
            Payment Methods
          </h3>
          <div className="space-y-4">
            {data.paymentBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500">No payment data available.</p>
            ) : (
              data.paymentBreakdown.map((pb) => {
                const isGlobal = pb.method.startsWith("GLOBAL");
                return (
                  <div key={pb.method} className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-500">{isGlobal ? "Global" : "Local"}</span>
                        <span className="font-bold text-gray-900">{pb.method.replace("LOCAL_", "").replace("GLOBAL_", "")}</span>
                       </div>
                       {isGlobal ? <CreditCard className="w-6 h-6 text-blue-500" /> : <Smartphone className="w-6 h-6 text-indigo-500" />}
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <span className="text-2xl font-extrabold text-gray-900">${pb.totalAmount.toLocaleString()}</span>
                      <span className="text-sm font-medium text-gray-500">{pb.count} txns</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <History className="w-5 h-5 mr-2 text-gray-400" />
              Recent Transactions
            </h3>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-gray-50/50">
                 <tr>
                   <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                   <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                   <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Method</th>
                   <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {data.recentTransactions.map((tx) => (
                   <tr key={tx.id} className="hover:bg-gray-50/50 transition">
                     <td className="px-8 py-4">
                       <p className="font-bold text-gray-900">{tx.booking.user.fullName}</p>
                     </td>
                     <td className="px-8 py-4">
                       <span className="font-extrabold text-gray-900">${tx.amount.toLocaleString()}</span>
                     </td>
                     <td className="px-8 py-4">
                       <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-xs font-bold">
                         {tx.method.replace("LOCAL_", "").replace("GLOBAL_", "")}
                       </span>
                     </td>
                     <td className="px-8 py-4 text-sm text-gray-500 font-medium">
                       {new Date(tx.paidAt || tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {data.recentTransactions.length === 0 && (
               <div className="p-12 text-center text-gray-500">No recent transactions.</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

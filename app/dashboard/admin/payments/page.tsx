"use client";

import { useState, useEffect } from "react";
import { 
  DollarSign, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  Download,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  method: string;
  transactionId: string;
  status: string;
  createdAt: string;
  bookingId: string;
  booking: {
    user: { fullName: string; email: string };
  };
  refundTransactionId?: string | null;
  refundReferenceId?: string | null;
  refundReason?: string | null;
  refundDate?: string | null;
  refundResponseCode?: string | null;
  refundResponseMessage?: string | null;
  refundCount?: number;
}

export default function PaymentTracking() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);

  const fetchPayments = async () => {
    const params = new URLSearchParams({
      status: statusFilter,
    });
    const res = await fetch(`/api/admin/payments?${params.toString()}`);
    const data = await res.json();
    setPayments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
    setExpandedPaymentId(null);
  }, [statusFilter]);

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      p.id.toLowerCase().includes(term) ||
      p.transactionId.toLowerCase().includes(term) ||
      p.amount.toString().includes(term) ||
      p.status.toLowerCase().includes(term) ||
      p.method.toLowerCase().replace("_", " ").includes(term) ||
      p.bookingId.toLowerCase().includes(term) ||
      p.booking.user.fullName.toLowerCase().includes(term) ||
      new Date(p.createdAt).toLocaleDateString().includes(term)
    );
  });

  const totalRevenue = payments
    .filter(p => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingRevenue = payments
    .filter(p => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  const toggleExpand = (id: string) => {
    setExpandedPaymentId(expandedPaymentId === id ? null : id);
  };

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Financial Ledger</h1>
          <p className="text-gray-500 font-medium">Monitor all incoming transactions, verify mobile money, and track revenue.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
          <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
             <input 
               type="text" 
               placeholder="Transaction ID or Customer..." 
               className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-64"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <div className="h-8 w-px bg-gray-100 mx-2" />
          <select 
            className="bg-gray-50 border-none rounded-xl text-sm font-bold px-4 py-2 text-gray-600 focus:ring-0"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </header>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl text-white">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <DollarSign className="w-6 h-6" />
             </div>
             <div className="flex items-center space-x-1 px-2 py-1 bg-white/20 rounded-lg text-xs font-bold">
                <ArrowUpRight className="w-3 h-3" />
                <span>+14.2%</span>
             </div>
           </div>
           <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Settled Revenue</p>
           <h3 className="text-3xl font-extrabold">${totalRevenue.toLocaleString()}</h3>
        </div>
        
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                <Clock className="w-6 h-6" />
             </div>
           </div>
           <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Pending Amount</p>
           <h3 className="text-3xl font-extrabold text-gray-900">${pendingRevenue.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200 flex flex-col justify-center">
           <button className="flex items-center justify-center space-x-3 w-full py-4 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition font-bold text-gray-600">
             <Download className="w-5 h-5" />
             <span>Export Financial Report</span>
           </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Transaction Detail</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Method</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-gray-500 animate-pulse">Loading transactions...</td>
                </tr>
              ) : filteredPayments.map((payment) => (
                <>
                  <tr key={payment.id} className="group hover:bg-gray-50/50 transition">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                           <FileText className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="text-sm font-bold text-gray-900 leading-none mb-1">{payment.transactionId}</p>
                           <div className="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                             <Calendar className="w-3 h-3 mr-1" />
                             {new Date(payment.createdAt).toLocaleDateString()}
                           </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {payment.booking.user.fullName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-700">{payment.booking.user.fullName}</span>
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest text-ellipsis overflow-hidden">BK: {payment.bookingId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-extrabold text-gray-900">${payment.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="flex items-center text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl w-max">
                        {payment.method.startsWith("GLOBAL") ? <CreditCard className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                        <span className="ml-2">{payment.method.replace("LOCAL_", "").replace("GLOBAL_", "")}</span>
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <StatusChip status={payment.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => toggleExpand(payment.id)}
                        className="text-gray-400 hover:text-indigo-600 transition flex items-center space-x-1 font-bold text-xs"
                      >
                        {expandedPaymentId === payment.id ? (
                          <>
                            <span>Hide</span>
                            <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>Details</span>
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {expandedPaymentId === payment.id && (
                    <tr className="bg-indigo-50/20">
                      <td colSpan={6} className="px-8 py-6 border-t border-b border-indigo-100/30">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-xs text-indigo-600 uppercase tracking-widest">Transaction Audit Metadata</h4>
                            {payment.status === "REFUNDED" && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">REVERSED</span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-100">
                            {payment.status === "REFUNDED" ? (
                              <>
                                <div className="space-y-1">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Refund Date</span>
                                  <span className="font-bold text-gray-800 text-sm">
                                    {payment.refundDate ? new Date(payment.refundDate).toLocaleString() : "N/A"}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Refund Transaction ID</span>
                                  <span className="font-mono text-gray-800 text-xs font-bold bg-gray-50 px-2 py-1 rounded">
                                    {payment.refundTransactionId || "N/A"}
                                  </span>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Refund Reason</span>
                                  <span className="font-medium text-gray-700 text-sm italic">
                                    "{payment.refundReason || "No reason provided"}"
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Refund Reference ID</span>
                                  <span className="font-mono text-gray-800 text-xs bg-gray-50 px-2 py-1 rounded">
                                    {payment.refundReferenceId || "N/A"}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Refund Response Code</span>
                                  <span className="font-bold text-gray-800 text-sm">
                                    {payment.refundResponseCode || "N/A"} - {payment.refundResponseMessage || ""}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="space-y-1">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Original Reference ID</span>
                                  <span className="font-mono text-gray-800 text-xs bg-gray-50 px-2 py-1 rounded">
                                    {payment.refundReferenceId || payment.id}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Refund Attempt</span>
                                  <span className="font-medium text-gray-800 text-sm">
                                    {payment.lastRefundAttempt ? new Date(payment.lastRefundAttempt).toLocaleString() : "Never attempted"}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Refund Count</span>
                                  <span className="font-bold text-gray-800 text-sm">
                                    {payment.refundCount || 0}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status Status</span>
                                  <span className="font-semibold text-gray-800 text-sm uppercase">
                                    {payment.status}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const configs: any = {
    SUCCESS: { icon: <CheckCircle2 className="w-3 h-3" />, class: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    PENDING: { icon: <Clock className="w-3 h-3" />, class: "bg-amber-50 text-amber-600 border-amber-100" },
    FAILED: { icon: <XCircle className="w-3 h-3" />, class: "bg-rose-50 text-rose-600 border-rose-100" },
    REFUNDED: { icon: <ArrowDownRight className="w-3 h-3" />, class: "bg-blue-50 text-blue-600 border-blue-100" },
  };
  const config = configs[status] || configs.PENDING;
  
  return (
    <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${config.class}`}>
      {config.icon}
      <span>{status}</span>
    </div>
  );
}

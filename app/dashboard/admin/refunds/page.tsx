"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  X,
  FileText,
  User,
  ArrowLeftRight,
  TrendingDown,
  Info,
  ChevronRight,
  Loader2
} from "lucide-react";

interface Refund {
  id: string;
  paymentId: string;
  bookingId: string;
  originalTransactionId: string;
  refundTransactionId: string | null;
  referenceId: string | null;
  amount: number;
  originalAmount: number | null;
  reason: string;
  status: "SUCCESS" | "FAILED";
  responseCode: string;
  responseMessage: string;
  state: string | null;
  requestedBy: string;
  requestedAt: string;
  completedAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  rawRequest: any;
  rawResponse: any;
  adminName: string;
  booking?: {
    id: string;
    totalPrice: number;
    status: string;
    eventDate: string;
    endDate: string;
    location: string;
    user?: {
      fullName: string;
      email: string;
    }
  };
  payment?: {
    id: string;
    amount: number;
    method: string;
    status: string;
  };
}

export default function RefundHistoryPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [fullDetail, setFullDetail] = useState<Refund | null>(null);

  const fetchRefunds = async () => {
    try {
      const res = await fetch("/api/admin/refunds");
      const data = await res.json();
      setRefunds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch refunds:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const openDetails = async (refundId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/refunds/${refundId}`);
      if (res.ok) {
        const data = await res.json();
        setFullDetail(data);
      }
    } catch (err) {
      console.error("Failed to fetch refund details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredRefunds = refunds.filter((r) => {
    const statusMatches = statusFilter === "ALL" || r.status === statusFilter;
    if (!statusMatches) return false;

    if (!search) return true;
    const term = search.toLowerCase();
    return (
      r.id.toLowerCase().includes(term) ||
      (r.customerName || "").toLowerCase().includes(term) ||
      r.bookingId.toLowerCase().includes(term) ||
      r.originalTransactionId.toLowerCase().includes(term) ||
      (r.refundTransactionId || "").toLowerCase().includes(term) ||
      r.reason.toLowerCase().includes(term) ||
      r.adminName.toLowerCase().includes(term)
    );
  });

  const totalRefunded = refunds
    .filter(r => r.status === "SUCCESS")
    .reduce((sum, r) => sum + r.amount, 0);

  const failedRefundsCount = refunds.filter(r => r.status === "FAILED").length;
  const successfulRefundsCount = refunds.filter(r => r.status === "SUCCESS").length;

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Refund History</h1>
          <p className="text-gray-500 font-medium">Audit processed transaction reversals, track failed attempts, and review logs.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
          <div className="relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
             <input 
               type="text" 
               placeholder="Search by customer, booking, tx..." 
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
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </header>

      {/* Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-500 font-bold uppercase tracking-widest mb-1">Total Refunded</p>
            <h3 className="text-3xl font-extrabold text-rose-700">${totalRefunded.toLocaleString()}</h3>
          </div>
          <div className="p-4 bg-rose-100 rounded-2xl text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mb-1">Successful Refunds</p>
            <h3 className="text-3xl font-extrabold text-emerald-700">{successfulRefundsCount}</h3>
          </div>
          <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-6 rounded-[2rem] flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Failed Attempts</p>
            <h3 className="text-3xl font-extrabold text-gray-700">{failedRefundsCount}</h3>
          </div>
          <div className="p-4 bg-gray-200/60 rounded-2xl text-gray-500">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer / Booking</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Refund status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Transaction IDs</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Reason / date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Admin</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 animate-pulse font-medium">Loading refund records...</td>
                </tr>
              ) : filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">No refund records found.</td>
                </tr>
              ) : filteredRefunds.map((refund) => (
                <tr key={refund.id} className="group hover:bg-gray-50/50 transition">
                  {/* Customer / Booking */}
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-bold text-gray-900 leading-tight">{refund.customerName || "Unknown Customer"}</p>
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">BK: {refund.bookingId.slice(-8).toUpperCase()}</p>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-gray-900">${refund.amount.toLocaleString()}</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Orig: ${refund.originalAmount || refund.amount}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                      refund.status === "SUCCESS" 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    }`}>
                      {refund.status === "SUCCESS" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{refund.status}</span>
                    </span>
                  </td>

                  {/* Transaction IDs */}
                  <td className="px-6 py-5">
                    <div className="text-xs font-mono space-y-0.5">
                      <div className="text-gray-400"><span className="font-bold text-gray-500 text-[10px] tracking-wider mr-1">ORIG:</span>{refund.originalTransactionId}</div>
                      <div className="text-gray-600"><span className="font-bold text-gray-500 text-[10px] tracking-wider mr-1">REFUND:</span>{refund.refundTransactionId || "N/A"}</div>
                    </div>
                  </td>

                  {/* Reason / date */}
                  <td className="px-6 py-5">
                    <div>
                      <p className="text-sm text-gray-700 font-medium truncate max-w-[150px]">{refund.reason}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        {new Date(refund.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </td>

                  {/* Admin */}
                  <td className="px-6 py-5">
                    <span className="text-sm font-semibold text-gray-600">{refund.adminName}</span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => {
                        setSelectedRefund(refund);
                        openDetails(refund.id);
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition flex items-center space-x-1 text-xs font-bold"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-8 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Refund Audit Record</h2>
                <p className="text-xs text-gray-500 font-medium font-mono">Refund ID: #{selectedRefund.id}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedRefund(null);
                  setFullDetail(null);
                }} 
                className="p-2 hover:bg-gray-50 rounded-full transition text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 flex-1">
              {detailLoading ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="font-bold">Loading full records...</span>
                </div>
              ) : (
                <>
                  {/* Timeline representation */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Workflow Timeline</h4>
                    <div className="flex items-center space-x-2 text-xs font-bold text-gray-600 bg-gray-50 p-4 rounded-2xl">
                      <span>Booking Created</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span>Original Payment Successful</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span>Cancellation Request PENDING</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className={selectedRefund.status === "SUCCESS" ? "text-emerald-600" : "text-rose-600"}>
                        {selectedRefund.status === "SUCCESS" ? "Refund APPROVED" : "Refund FAILED"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    {/* Customer & Booking */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Customer Details</h4>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold uppercase">
                          {selectedRefund.customerName?.[0] || "C"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{selectedRefund.customerName}</p>
                          <p className="text-xs text-gray-500">{selectedRefund.customerPhone || "No Phone Number"}</p>
                          {fullDetail?.booking?.user?.email && (
                            <p className="text-[10px] text-gray-400">{fullDetail.booking.user.email}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Refund info */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Refund Parameters</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">Refund Amount:</span>
                          <span className="font-extrabold text-rose-600">${selectedRefund.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">Original Paid:</span>
                          <span className="font-bold text-gray-900">${selectedRefund.originalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">Requested By:</span>
                          <span className="font-bold text-gray-700">{selectedRefund.adminName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 font-medium">Requested At:</span>
                          <span className="text-gray-600 font-medium text-xs">{new Date(selectedRefund.requestedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Snapshots if available */}
                  {fullDetail?.booking && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Linked Booking</h4>
                      <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-900">ID: #{fullDetail.booking.id.toUpperCase()}</p>
                          <p className="text-xs text-gray-500 font-medium">Location: {fullDetail.booking.location}</p>
                          <p className="text-xs text-gray-500 font-medium">
                            Period: {new Date(fullDetail.booking.eventDate).toLocaleDateString()} to {new Date(fullDetail.booking.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Booking Status</p>
                            <span className="text-sm font-bold text-rose-600">{fullDetail.booking.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Refund Response Details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Gateway Response</h4>
                    <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">Response Code</p>
                          <p className="font-semibold text-gray-800">{selectedRefund.responseCode}</p>
                        </div>
                        <div>
                          <p className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">Response Msg</p>
                          <p className="font-semibold text-gray-800">{selectedRefund.responseMessage}</p>
                        </div>
                        <div>
                          <p className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">Waafi State</p>
                          <p className={`font-semibold ${selectedRefund.state === "APPROVED" ? "text-emerald-600" : "text-rose-600"}`}>
                            {selectedRefund.state || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">Reason for Refund</p>
                          <p className="font-semibold text-gray-800">{selectedRefund.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Raw WaafiPay Response JSON */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Raw WaafiPay Payload</h4>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Read Only</span>
                    </div>
                    <pre className="p-6 bg-gray-900 rounded-[2rem] text-xs text-emerald-400 font-mono overflow-x-auto max-h-48 overflow-y-auto">
                      {JSON.stringify(selectedRefund.rawResponse, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>

            <div className="p-8 border-t border-gray-50 bg-gray-50 flex items-center justify-between sticky bottom-0">
              <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-semibold">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>Audited immutable record. Re-refund impossible.</span>
              </div>
              <button 
                onClick={() => {
                  setSelectedRefund(null);
                  setFullDetail(null);
                }}
                className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition shadow-sm text-sm"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

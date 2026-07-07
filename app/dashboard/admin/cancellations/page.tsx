"use client";

import { useState, useEffect } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  DollarSign, 
  User, 
  Calendar, 
  MapPin,
  HelpCircle
} from "lucide-react";

export default function CancellationsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [refundReason, setRefundReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/cancellations");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const openApproveModal = (req: any) => {
    setSelectedReq(req);
    setRefundReason("");
    setModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    const hasSuccessfulPayment = selectedReq.booking?.payments?.some((p: any) => p.status === "SUCCESS");
    
    if (hasSuccessfulPayment && !refundReason.trim()) {
      alert("Refund reason is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/cancellations/${selectedReq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "APPROVE", 
          reason: hasSuccessfulPayment ? refundReason : undefined 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.reason || "Failed to approve cancellation.");
      }

      showToast(
        hasSuccessfulPayment 
          ? `Cancellation approved. WaafiPay Refund successful! (Tx: ${data.refundTransactionId || 'N/A'})` 
          : "Cancellation approved successfully (Unpaid booking).", 
        "success"
      );
      setModalOpen(false);
      fetchRequests();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this cancellation request? This will keep the booking active.")) return;
    try {
      const res = await fetch(`/api/cancellations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT" }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject cancellation request.");
      }
      showToast("Cancellation request rejected. Booking remains active.", "success");
      fetchRequests();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="font-bold">Loading cancellation requests...</span>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-top-5 ${
          toast.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
            : "bg-rose-50 text-rose-800 border-rose-100"
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cancellation Requests</h1>
          <p className="text-gray-500 font-medium">Review customer cancellation requests, process automatic WaafiPay refunds, and update inventory.</p>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer / Requester</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Booking Info</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Info</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest">Request Status</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-500 font-medium">
                    No cancellation requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const booking = req.booking;
                  const successfulPayment = booking?.payments?.find((p: any) => p.status === "SUCCESS");
                  const refundedPayment = booking?.payments?.find((p: any) => p.status === "REFUNDED");
                  
                  let paymentStatusText = "UNPAID";
                  let paidAmount = 0;
                  if (successfulPayment) {
                    paymentStatusText = "SUCCESS";
                    paidAmount = successfulPayment.amount;
                  } else if (refundedPayment) {
                    paymentStatusText = "REFUNDED";
                    paidAmount = refundedPayment.amount;
                  } else if (booking?.payments?.length > 0) {
                    paymentStatusText = booking.payments[0].status;
                  }

                  return (
                    <tr key={req.id} className="group hover:bg-gray-50/50 transition">
                      {/* Customer / Requester */}
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                            {req.userName?.[0] || <User className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-none mb-1">{req.userName}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Requester</p>
                          </div>
                        </div>
                      </td>

                      {/* Booking Info */}
                      <td className="px-8 py-6">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-bold text-gray-900 truncate">BK: {req.originalBookingId.slice(-8).toUpperCase()}</p>
                          <div className="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            <span className={`px-1.5 py-0.5 rounded border ${
                              booking?.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              booking?.status === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-100" :
                              booking?.status === "CANCELLED" ? "bg-rose-50 text-rose-600 border-rose-100" :
                              "bg-gray-50 text-gray-600 border-gray-100"
                            }`}>
                              {booking?.status || "UNKNOWN"}
                            </span>
                            <span className="mx-2">•</span>
                            <span>Total: ${booking?.totalPrice || 0}</span>
                          </div>
                        </div>
                      </td>

                      {/* Payment Info */}
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-gray-900">${paidAmount.toLocaleString()}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest w-max mt-1 ${
                            paymentStatusText === "SUCCESS" ? "text-emerald-600" :
                            paymentStatusText === "REFUNDED" ? "text-blue-500" :
                            paymentStatusText === "UNPAID" ? "text-gray-400" : "text-rose-500"
                          }`}>
                            {paymentStatusText}
                          </span>
                        </div>
                      </td>

                      {/* Request Status */}
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                          req.status === "PENDING" ? "bg-amber-50 text-amber-600 border-amber-100" :
                          req.status === "SUCCESS_CANCELED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          req.status === "REFUND_FAILED" ? "bg-rose-50 text-rose-600 border-rose-100" :
                          "bg-gray-50 text-gray-600 border-gray-100"
                        }`}>
                          {req.status === "PENDING" && <Clock className="w-3 h-3 animate-pulse" />}
                          {req.status === "SUCCESS_CANCELED" && <CheckCircle className="w-3 h-3" />}
                          {req.status === "REFUND_FAILED" && <AlertTriangle className="w-3 h-3" />}
                          <span>{req.status.replace("_", " ")}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-6 text-right">
                        {req.status === "PENDING" && (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => openApproveModal(req)}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                            >
                              {successfulPayment ? "Approve (Refund)" : "Approve Cancellation"}
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                            >
                              Reject (Keep)
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation & Refund Modal */}
      {modalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-gray-100 flex items-center space-x-3 bg-rose-50/50">
              <div className="p-3 bg-rose-100 rounded-2xl text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Approve Booking Cancellation</h3>
                <p className="text-xs text-gray-500">Booking ID: #{selectedReq.originalBookingId.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-bold text-gray-900">{selectedReq.userName}</span>
                </div>
                {selectedReq.booking?.payments?.some((p: any) => p.status === "SUCCESS") ? (
                  <>
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                      <span className="font-extrabold text-rose-600">${selectedReq.booking.payments.find((p: any) => p.status === "SUCCESS").amount.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-amber-600 font-semibold mt-1">
                      ⚠️ This will trigger an automatic refund of the paid amount to the customer's wallet via WaafiPay.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    ✅ No successful payment recorded. Booking status will be updated to CANCELLED and inventory restored without calling WaafiPay.
                  </p>
                )}
              </div>

              {selectedReq.booking?.payments?.some((p: any) => p.status === "SUCCESS") && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Refund Reason (Required)</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Enter reason for the refund (sent to WaafiPay)..."
                    className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none h-24"
                    disabled={submitting}
                  />
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition text-sm shadow-sm"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition text-sm flex items-center space-x-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm Approval</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

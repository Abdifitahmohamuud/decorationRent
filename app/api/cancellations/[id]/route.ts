import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { waafiRefund } from "@/lib/waafi_api";
import { z } from "zod";

const cancelActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.id || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ipAddress = req.headers.get("x-forwarded-for") || "";
  const userAgent = req.headers.get("user-agent") || "";

  try {
    const body = await req.json();
    const parsed = cancelActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { action, reason } = parsed.data;
    const resolvedParams = await params;
    const reqId = resolvedParams.id;

    // Fetch the cancellation request
    const cancelReq = await prisma.cancellationRequest.findUnique({
      where: { id: reqId },
      include: { user: true },
    });

    if (!cancelReq) {
      return NextResponse.json({ error: "Cancellation request not found" }, { status: 404 });
    }

    if (cancelReq.status !== "PENDING") {
      return NextResponse.json({ error: "Cancellation request has already been processed" }, { status: 409 });
    }

    const bookingId = cancelReq.originalBookingId;

    if (action === "APPROVE") {
      // Fetch booking with items and payments
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { bookingItems: true, payments: true },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const successfulPayments = booking.payments.filter(p => p.status === "SUCCESS");

      // ---------- Paid bookings (process refunds) ----------
      if (successfulPayments.length > 0) {
        if (!reason) {
          return NextResponse.json({ error: "Refund reason is required for paid bookings" }, { status: 400 });
        }

        const refundInfos: any[] = [];

        for (const payment of successfulPayments) {
          // Idempotency check: already refunded?
          if (payment.refundTransactionId || payment.status === "REFUNDED") {
            refundInfos.push({ payment, alreadyRefunded: true });
            continue;
          }

          console.log(`[REFUND] Initiating WaafiPay Reversal for booking ${bookingId}, payment ${payment.id}, original tx ${payment.transactionId}`);
          let waafiResp;
          try {
            waafiResp = await waafiRefund(payment.transactionId, reason);
            console.log("[REFUND] WaafiPay raw response:", waafiResp);
          } catch (waafiErr: any) {
            console.error("[REFUND] WaafiPay Reversal call failed with error:", waafiErr);
            return NextResponse.json({ success: false, refundStatus: "FAILED", reason: waafiErr.message || "Failed to connect to WaafiPay", raw: waafiErr }, { status: 502 });
          }

          const responseCode = waafiResp.responseCode;
          const responseMsg = waafiResp.responseMsg;
          const params = waafiResp.params ?? {};
          const state = (params.state ?? "").toUpperCase();
          const refundTransactionId = params.transactionId ?? null;
          const refundReferenceId = params.referenceId ?? null;
          const refundAmount = params.txAmount ? Number(params.txAmount) : payment.amount;

          const isSuccess = responseCode === "2001" && state === "APPROVED";
          const isAlready = responseCode === "5202" && waafiResp.errorCode === "E10207";

          if (isSuccess || isAlready) {
            refundInfos.push({
              payment,
              alreadyRefunded: isAlready,
              waafiResp,
              responseCode,
              responseMsg,
              refundTransactionId,
              refundReferenceId,
              refundAmount,
              state,
            });
          } else {
            console.error(`[REFUND] WaafiPay returned failure for payment ${payment.id}:`, waafiResp);
            return NextResponse.json({ success: false, refundStatus: "FAILED", responseCode, responseMessage: responseMsg, reason: responseMsg || "Payment gateway declined refund" }, { status: 400 });
          }
        }

        // Persist all changes in a single transaction
        try {
          await prisma.$transaction(async (tx) => {
            for (const info of refundInfos) {
              const { payment, alreadyRefunded, waafiResp, responseCode, responseMsg, refundTransactionId, refundReferenceId, refundAmount, state } = info;

              // Update payment record
              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  status: "REFUNDED",
                  refundTransactionId: refundTransactionId ?? null,
                  refundReferenceId: refundReferenceId ?? null,
                  refundReason: reason,
                  refundDate: new Date(),
                  refundResponseCode: responseCode ?? (alreadyRefunded ? "5202" : undefined),
                  refundResponseMessage: responseMsg ?? (alreadyRefunded ? "Already refunded" : undefined),
                  rawWaafiResponse: waafiResp ? JSON.parse(JSON.stringify(waafiResp)) : null,
                  lastRefundAttempt: new Date(),
                  refundCount: { increment: 1 },
                },
              });

              // Ensure a Refund record exists
              const existing = await tx.refund.findUnique({ where: { paymentId: payment.id } });
              if (!existing) {
                await tx.refund.create({
                  data: {
                    paymentId: payment.id,
                    bookingId,
                    originalTransactionId: payment.transactionId,
                    refundTransactionId: refundTransactionId ?? null,
                    referenceId: refundReferenceId ?? null,
                    amount: refundAmount ?? payment.amount,
                    originalAmount: payment.amount,
                    reason,
                    status: "SUCCESS",
                    responseCode: responseCode ?? "5202",
                    responseMessage: responseMsg ?? "Already refunded",
                    state,
                    requestedBy: session.id,
                    completedAt: new Date(),
                    customerName: cancelReq.user.name ?? "Customer",
                    customerPhone: payment.phoneNumber || null,
                    rawRequest: { transactionId: payment.transactionId, description: reason },
                    rawResponse: waafiResp ? JSON.parse(JSON.stringify(waafiResp)) : null,
                  },
                });
              }
            }

            // Update booking status to CANCELLED
            await tx.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

            // Restore inventory quantities
            for (const item of booking.bookingItems) {
              await tx.decoration.update({ where: { id: item.decorationId }, data: { availableQty: { increment: item.quantity } } });
            }

            // Mark cancellation request as successful
            await tx.cancellationRequest.update({ where: { id: reqId }, data: { status: "SUCCESS_CANCELED" } });

            // Audit log entry
            await tx.auditLog.create({
              data: {
                userId: session.id,
                action: "REFUND_SUCCESS",
                entity: "Booking",
                entityId: bookingId,
                ipAddress,
                userAgent,
              },
            });
          });

          const anyNewRefund = refundInfos.some(i => !i.alreadyRefunded);
          const message = anyNewRefund ? "All refunds processed and booking cancelled." : "Refunds were already completed previously. Database synchronized successfully.";
          return NextResponse.json({ success: true, message, bookingId, refundedPayments: refundInfos.map(i => i.payment.id) });
        } catch (txErr: any) {
          console.error("[REFUND] Database transaction failed after refunds. Rolled back.", txErr);
          return NextResponse.json({ success: false, refundStatus: "FAILED", reason: `Database rollback: ${txErr.message}` }, { status: 500 });
        }
      }

      // ---------- Unpaid bookings (no successful payments) ----------
      console.log(`[CANCELLATION] Approving cancellation for unpaid booking ${bookingId}. Skipping WaafiPay.`);
      try {
        await prisma.$transaction(async (tx) => {
          // Update booking status
          await tx.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
          // Restore inventory
          for (const item of booking.bookingItems) {
            await tx.decoration.update({ where: { id: item.decorationId }, data: { availableQty: { increment: item.quantity } } });
          }
          // Update cancellation request status
          await tx.cancellationRequest.update({ where: { id: reqId }, data: { status: "SUCCESS_CANCELED" } });
          // Audit log
          await tx.auditLog.create({
            data: {
              userId: session.id,
              action: "CANCEL_UNPAID_SUCCESS",
              entity: "Booking",
              entityId: bookingId,
              ipAddress,
              userAgent,
            },
          });
        });
        console.log(`[CANCELLATION] Database transaction successfully committed for unpaid booking ${bookingId}`);
        return NextResponse.json({ message: "Cancellation approved, booking status updated." });
      } catch (txErr: any) {
        console.error("[CANCELLATION] Unpaid booking cancellation transaction failed. Rolled back.", txErr);
        return NextResponse.json({ error: txErr.message }, { status: 500 });
      }
    }

    // ---------- Reject path ----------
    if (action === "REJECT") {
      console.log(`[CANCELLATION] Rejecting cancellation request ${reqId} for booking ${bookingId}`);
      await prisma.$transaction(async (tx) => {
        await tx.cancellationRequest.update({
          where: { id: reqId },
          data: { status: "REJECTED" },
        });
        await tx.auditLog.create({
          data: {
            userId: session.id,
            action: "CANCEL_REJECT",
            entity: "Booking",
            entityId: bookingId,
            ipAddress,
            userAgent,
          },
        });
      });
      return NextResponse.json({ message: "Cancellation rejected, request status set to REJECTED." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[CANCELLATION] Global handler error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

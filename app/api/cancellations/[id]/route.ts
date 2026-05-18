import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.id || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await req.json(); // "APPROVE" or "REJECT"
    const resolvedParams = await params;
    const reqId = resolvedParams.id;

    const cancelReq = await prisma.cancellationRequest.findUnique({
      where: { id: reqId }
    });

    if (!cancelReq) {
      return NextResponse.json({ error: "Cancellation request not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      // 1. Restore decoration quantities
      const bookingItems = await prisma.bookingItem.findMany({
        where: { bookingId: cancelReq.originalBookingId }
      });

      await prisma.$transaction(async (tx) => {
        // Restore available quantities
        for (const item of bookingItems) {
          await tx.decoration.update({
            where: { id: item.decorationId },
            data: { availableQty: { increment: item.quantity } }
          });
        }

        // Delete BookingItems
        await tx.bookingItem.deleteMany({
          where: { bookingId: cancelReq.originalBookingId }
        });

        // Delete Payments
        await tx.payment.deleteMany({
          where: { bookingId: cancelReq.originalBookingId }
        });

        // Delete Booking
        await tx.booking.delete({
          where: { id: cancelReq.originalBookingId }
        });

        // Update CancellationRequest status
        await tx.cancellationRequest.update({
          where: { id: reqId },
          data: { status: "SUCCESS_CANCELED" }
        });
      });

      return NextResponse.json({ message: "Cancellation approved, booking deleted." });
    } else if (action === "REJECT") {
      // Reject cancellation (convince user to keep booking) -> delete the cancellation row
      await prisma.cancellationRequest.delete({
        where: { id: reqId }
      });
      return NextResponse.json({ message: "Cancellation rejected, request deleted." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

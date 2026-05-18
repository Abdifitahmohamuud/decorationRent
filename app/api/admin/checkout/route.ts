import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { BookingStatus, PaymentStatus } from "@prisma/client";

export async function GET() {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const pendingBookings = await prisma.booking.findMany({
      where: {
        balance: { gt: 0 },
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED] },
      },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "asc" }, // Oldest balances first
    });

    return NextResponse.json(pendingBookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { bookingId, method } = await req.json();

    if (!method) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Create payment record for the remainder
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.balance,
          method: method as any, // Cast to any to bypass generated type lag, or use raw
          transactionId: `ADMIN-TXN-${Date.now()}`,
          status: PaymentStatus.SUCCESS,
          paidAt: new Date()
        }
      });

      // Mark the booking as paid (balance = 0)
      return await tx.booking.update({
        where: { id: booking.id },
        data: {
          balance: 0
        }
      });
    });

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error("ADMIN CHECKOUT ERROR: ", error);
    try { require('fs').writeFileSync('d:\\RP\\decoration-rental\\checkout-debug.txt', String(error) + '\n' + String(error.message) + '\n' + String(error.stack)); } catch (e) {}
    return NextResponse.json({ error: error?.message || 'Unknown Server Error', stack: error?.stack }, { status: 500 });
  }
}

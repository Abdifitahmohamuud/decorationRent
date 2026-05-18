import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { bookingId } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingItems: {
          include: { decoration: true }
        },
        user: true,
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if within 30 minutes
    const now = new Date();
    const createdAt = new Date(booking.createdAt);
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes > 30) {
      return NextResponse.json({ error: "Booking cannot be cancelled after 30 minutes" }, { status: 400 });
    }

    // Check if cancellation request already exists
    const existingReq = await prisma.cancellationRequest.findUnique({
      where: { originalBookingId: bookingId }
    });

    if (existingReq) {
      return NextResponse.json({ error: "Cancellation request already exists" }, { status: 400 });
    }

    const cancelReq = await prisma.cancellationRequest.create({
      data: {
        originalBookingId: booking.id,
        userId: session.id,
        userName: booking.user.fullName || session.email || "Unknown",
        bookingData: JSON.parse(JSON.stringify(booking)), // Store snapshot
        status: "PENDING",
      }
    });

    return NextResponse.json(cancelReq);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.id || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await prisma.cancellationRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true }
    });
    return NextResponse.json(requests);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

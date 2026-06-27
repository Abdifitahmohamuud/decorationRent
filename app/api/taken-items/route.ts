import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.id || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookingId, decorationId, userId, quantity, remarks } = body;
    console.log('POST /taken-items received body:', body);

    // Basic validation of required fields
    if (!bookingId || !decorationId || !userId || quantity == null) {
      return NextResponse.json({ error: "Missing required fields: bookingId, decorationId, userId, quantity" }, { status: 400 });
    }

    // Verify related records exist
    const [booking, decoration] = await Promise.all([
      prisma.booking.findUnique({ where: { id: bookingId } }),
      prisma.decoration.findUnique({ where: { id: decorationId } })
    ]);
    console.log('Fetched booking:', booking, 'Fetched decoration:', decoration);
    if (!booking) {
      return NextResponse.json({ error: `Booking with id ${bookingId} not found` }, { status: 404 });
    }
    if (!decoration) {
      return NextResponse.json({ error: `Decoration with id ${decorationId} not found` }, { status: 404 });
    }

    const takenItem = await prisma.$transaction(async (tx) => {
      const item = await tx.takenItem.create({
        data: {
          bookingId,
          decorationId,
          userId,
          quantity: Number(quantity),
          remarks,
        }
      });
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.TAKEN }
      });
      return item;
    });

    return NextResponse.json(takenItem);
  } catch (error: any) {
    console.error('Error in POST /taken-items:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.id || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const takenItems = await prisma.takenItem.findMany({
      orderBy: { takenAt: "desc" },
      include: {
        decoration: true,
        user: true,
        booking: true,
      }
    });

    const formatted = takenItems.map(item => {
      let imageData = null;
      if (item.decoration.image) {
        imageData = `data:image/jpeg;base64,${Buffer.from(item.decoration.image).toString("base64")}`;
      }
      return {
        ...item,
        decoration: {
          ...item.decoration,
          image: imageData
        }
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ,messgae : "error 2"}, { status: 500 });
  }
}
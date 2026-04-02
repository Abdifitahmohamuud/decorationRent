import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { bookingService } from "@/server/services/booking-service";
export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        ...(status && status !== "ALL" ? { status: status as any } : {}),
        ...(search ? {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { user: { fullName: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ]
        } : {})
      },
      include: {
        user: true,
        bookingItems: {
          include: { decoration: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, eventDate, endDate, location, items } = body;

    if (!userId || !eventDate || !endDate || !location || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const booking = await bookingService.createBooking({
      userId,
      location,
      items,
      eventDate: new Date(eventDate),
      endDate: new Date(endDate),
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Admin create booking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

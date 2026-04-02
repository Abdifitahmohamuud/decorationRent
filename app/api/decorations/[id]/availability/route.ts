import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = await props.params;
    
    // Find active bookings (CONFIRMED or PENDING) that include this decoration
    const activeBookings = await prisma.bookingItem.findMany({
      where: {
        decorationId: id,
        booking: {
          status: { in: ["CONFIRMED", "PENDING"] },
          endDate: { gte: new Date() } // Only look at bookings returning in the future
        }
      },
      include: {
        booking: true
      },
      orderBy: {
        booking: { endDate: "asc" }
      }
    });

    if (activeBookings.length === 0) {
      return NextResponse.json({ availableDate: null });
    }

    // Return the earliest end date among active bookings
    const nextAvailableDate = activeBookings[0].booking.endDate;
    
    return NextResponse.json({ availableDate: nextAvailableDate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

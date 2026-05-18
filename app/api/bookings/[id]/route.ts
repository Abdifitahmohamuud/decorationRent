import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        bookingItems: {
          include: { decoration: true }
        },
        payments: true,
        returnedItems: true, // Check if it's already returned
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Convert decoration images to base64 for display
    const formattedItems = [];
    for (let j = 0; j < booking.bookingItems.length; j++) {
      const item = booking.bookingItems[j];
      let imageData = null;
      if (item.decoration.image) {
        imageData = `data:image/jpeg;base64,${Buffer.from(item.decoration.image).toString("base64")}`;
      }
      
      formattedItems.push({
        ...item,
        decoration: {
          ...item.decoration,
          image: imageData
        }
      });
    }

    const formattedBooking = {
      ...booking,
      bookingItems: formattedItems
    };

    // Only Admin/Staff can view ANY booking, customers can only view their own
    if (session.role !== "ADMIN" && session.role !== "STAFF" && booking.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(formattedBooking);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

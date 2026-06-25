import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: session.id },
      include: {
        bookingItems: {
          include: { decoration: true }
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" }
    });

    const cancellationRequests = await prisma.cancellationRequest.findMany({
      where: { userId: session.id }
    });
    const cancelRequestBookingIds = new Set(cancellationRequests.map(r => r.originalBookingId));

    // Convert decoration images to base64 for display
    const formatted = [];
    for (let i = 0; i < bookings.length; i++) {
      const b = bookings[i];
      const formattedItems = [];

      for (let j = 0; j < b.bookingItems.length; j++) {
        const item = b.bookingItems[j];
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

      formatted.push({
        ...b,
        bookingItems: formattedItems,
        hasCancelRequest: cancelRequestBookingIds.has(b.id)
      });
    }

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("User bookings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

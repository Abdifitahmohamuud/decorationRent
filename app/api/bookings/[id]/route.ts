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
    

   

  // Only Admin/Staff can view ANY booking, customers can only view their own
  if (session.role !== "ADMIN" && session.role !== "STAFF" && booking.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(booking);
} catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
}

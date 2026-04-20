import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status } = await req.json();
    const oldBooking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { bookingItems: true }
    });

    if (!oldBooking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Handle inventory if status turns to CANCELLED
    if (status === "CANCELLED" && oldBooking.status !== "CANCELLED") {
       for (const item of oldBooking.bookingItems) {
         await prisma.decoration.update({
           where: { id: item.decorationId },
           data: { availableQty: { increment: item.quantity } }
         });
       }
    }

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

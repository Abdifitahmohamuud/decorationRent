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
    const { status, eventDate, endDate, location } = await req.json();
    const oldBooking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { bookingItems: true }
    });

    if (!oldBooking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Restore inventory when CANCELLED
    if (status === "CANCELLED" && oldBooking.status !== "CANCELLED") {
       for (const item of oldBooking.bookingItems) {
         await prisma.decoration.update({
           where: { id: item.decorationId },
           data: { availableQty: { increment: item.quantity } }
         });
       }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (eventDate) updateData.eventDate = new Date(eventDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (location) updateData.location = location;

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Booking update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { bookingItems: true }
    });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Restore inventory
    for (const item of booking.bookingItems) {
      await prisma.decoration.update({
        where: { id: item.decorationId },
        data: { availableQty: { increment: item.quantity } }
      });
    }

    // Delete related items then booking
    await prisma.bookingItem.deleteMany({ where: { bookingId: params.id } });
    await prisma.payment.deleteMany({ where: { bookingId: params.id } });
    await prisma.booking.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2003') {
       return NextResponse.json({ error: "Cannot delete this booking because it is linked to other active records (like audit logs). Try modifying its status instead." }, { status: 400 });
    }
    console.error("Booking delete error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}

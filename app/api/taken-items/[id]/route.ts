import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.id || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { quantity, remarks } = body;

    const oldItem = await prisma.takenItem.findUnique({
      where: { id }
    });

    if (!oldItem) {
      return NextResponse.json({ error: "Taken item record not found" }, { status: 404 });
    }

    const updatedItem = await prisma.takenItem.update({
      where: { id },
      data: {
        quantity: Number(quantity),
        remarks,
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session?.id || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const item = await prisma.takenItem.findUnique({
      where: { id }
    });

    if (!item) {
      return NextResponse.json({ error: "Taken item record not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete taken item record
      await tx.takenItem.delete({
        where: { id }
      });

      // Check if there are other taken items left for this booking
      const remaining = await tx.takenItem.count({
        where: { bookingId: item.bookingId }
      });

      // If no taken items remain, revert the booking status back to REQUEST
      if (remaining === 0) {
        await tx.booking.update({
          where: { id: item.bookingId },
          data: { status: "REQUEST" }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ,messgae : "error 3" }, { status: 500 });
  }
}
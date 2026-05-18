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
    const { quantity, status, remarks } = body;

    const oldItem = await prisma.returnedItem.findUnique({
      where: { id },
      include: { decoration: true }
    });

    if (!oldItem) {
      return NextResponse.json({ error: "Returned item record not found" }, { status: 404 });
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      // Revert old inventory effect if it was damaged
      if (oldItem.status === "DAMAGED") {
        await tx.decoration.update({
          where: { id: oldItem.decorationId },
          data: {
            totalQty: { increment: oldItem.quantity },
            availableQty: { increment: oldItem.quantity }
          }
        });
      }

      // Apply new inventory effect if it is damaged
      if (status === "DAMAGED") {
        await tx.decoration.update({
          where: { id: oldItem.decorationId },
          data: {
            totalQty: { decrement: Number(quantity) },
            availableQty: { decrement: Number(quantity) }
          }
        });
      }

      // Update returned item record
      return await tx.returnedItem.update({
        where: { id },
        data: {
          quantity: Number(quantity),
          status,
          remarks,
        }
      });
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

    const item = await prisma.returnedItem.findUnique({
      where: { id }
    });

    if (!item) {
      return NextResponse.json({ error: "Returned item record not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Revert inventory effect if it was damaged
      if (item.status === "DAMAGED") {
        await tx.decoration.update({
          where: { id: item.decorationId },
          data: {
            totalQty: { increment: item.quantity },
            availableQty: { increment: item.quantity }
          }
        });
      }

      // Delete returned item record
      await tx.returnedItem.delete({
        where: { id }
      });

      // Check if there are other returned items left for this booking
      const remaining = await tx.returnedItem.count({
        where: { bookingId: item.bookingId }
      });

      // If no returned items remain, revert the booking status back to TAKEN
      if (remaining === 0) {
        await tx.booking.update({
          where: { id: item.bookingId },
          data: { status: "TAKEN" }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.id || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookingId, decorationId, userId, quantity, status, remarks } = body;

    const returnedItem = await prisma.$transaction(async (tx) => {
      // Create the returned item record
      const item = await tx.returnedItem.create({
        data: {
          bookingId,
          decorationId,
          userId,
          quantity: Number(quantity),
          status,
          remarks,
        }
      });

      // If damaged, remove from total and available inventory
      if (status === "DAMAGED") {
        await tx.decoration.update({
          where: { id: decorationId },
          data: {
            totalQty: { decrement: Number(quantity) },
            availableQty: { decrement: Number(quantity) }
          }
        });
      }

      return item;
    });

    return NextResponse.json(returnedItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.id || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const returnedItems = await prisma.returnedItem.findMany({
      orderBy: { returnedAt: "desc" },
      include: {
        decoration: true,
        user: true,
        booking: true,
      }
    });
    return NextResponse.json(returnedItems);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

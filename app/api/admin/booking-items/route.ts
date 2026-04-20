import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");
  try {
    const now = new Date();
    const items = await prisma.bookingItem.findMany({
      where: {
        ...(bookingId ? { bookingId } : {
           booking: {
             AND: [
               { status: { notIn: ["CANCELLED", "COMPLETED"] } },
               { endDate: { gte: now } }
             ]
           }
        }),
      },
      include: {
        decoration: { select: { id: true, name: true, price: true } },
        booking: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { booking: { createdAt: "desc" } },
    });
    return NextResponse.json(items);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, quantity } = await req.json();
    if (!id || !quantity) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const item = await prisma.bookingItem.update({ where: { id }, data: { quantity } });
    return NextResponse.json(item);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    // Restore inventory
    const item = await prisma.bookingItem.findUnique({ where: { id } });
    if (item) {
      await prisma.decoration.update({ where: { id: item.decorationId }, data: { availableQty: { increment: item.quantity } } });
    }
    await prisma.bookingItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

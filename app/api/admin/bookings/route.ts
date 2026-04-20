import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const type = searchParams.get("type");

  try {
    const now = new Date();
    const bookings = await prisma.booking.findMany({
      where: {
        ...(status && status !== "ALL" ? { status: status as any } : {}),
        ...(type === "active" ? {
          AND: [
             { status: { notIn: ["CANCELLED"] } },
             { endDate: { gte: now } }
          ]
        } : {}),
        ...(type === "history" ? {
          OR: [
            { status: { equals: "CANCELLED" } },
            { endDate: { lt: now } }
          ]
        } : {}),
        ...(search ? {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { user: { fullName: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { location: { contains: search, mode: "insensitive" } },
            ...( !isNaN(Number(search)) ? [
               { totalPrice: { equals: Number(search) } },
               { deposit: { equals: Number(search) } },
               { balance: { equals: Number(search) } },
            ] : [] )
          ]
        } : {})
      },
      include: {
        user: true,
        bookingItems: {
          include: { decoration: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, eventDate, endDate, location, items } = body;

    if (!userId || !eventDate || !endDate || !location || !items || !items.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const eventDateObj = new Date(eventDate);
    const endDateObj = new Date(endDate);

    const booking = await prisma.$transaction(async (tx) => {
      let totalPrice = 0;
      const bookingItemsData = [];

      for (const item of items) {
        const decoration = await tx.decoration.findUnique({ where: { id: item.decorationId } });
        if (!decoration) throw new Error(`Decoration ${item.decorationId} not found`);

        let isAvailable = false;
        const overlappingBookings = await tx.booking.findMany({
          where: {
            status: { in: ["CONFIRMED", "PENDING"] },
            OR: [
              {
                eventDate: { lte: endDateObj },
                endDate: { gte: eventDateObj },
              },
            ],
            bookingItems: {
              some: { decorationId: item.decorationId },
            },
          },
          include: {
            bookingItems: {
              where: { decorationId: item.decorationId },
            },
          },
        });

        let reservedQty = 0;
        for (let i = 0; i < overlappingBookings.length; i++) {
          const b = overlappingBookings[i];
          for (let j = 0; j < b.bookingItems.length; j++) {
            if (b.bookingItems[j].decorationId === item.decorationId) {
              reservedQty += b.bookingItems[j].quantity;
            }
          }
        }

        if (decoration.totalQty - reservedQty >= item.quantity) {
             isAvailable = true;
        }

        if (!isAvailable) throw new Error(`Decoration ${decoration.name} is not available for these dates`);

        totalPrice += decoration.price * item.quantity;
        bookingItemsData.push({
          decorationId: item.decorationId,
          quantity: item.quantity,
          price: decoration.price,
        });
      }

      const deposit = totalPrice * 0.2;
      const balance = totalPrice - deposit;

      const createdBooking = await tx.booking.create({
        data: {
          userId,
          eventDate: eventDateObj,
          endDate: endDateObj,
          location,
          totalPrice,
          deposit,
          balance,
          status: "PENDING",
          bookingItems: {
            create: bookingItemsData,
          },
        },
        include: {
          bookingItems: true,
        },
      });

      for (const item of items) {
        await tx.decoration.update({
          where: { id: item.decorationId },
          data: { availableQty: { decrement: item.quantity } },
        });
      }

      return createdBooking;
    });

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Admin create booking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

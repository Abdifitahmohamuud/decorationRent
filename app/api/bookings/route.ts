import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { getServerSession } from "@/lib/auth-helper";
import { sendEmail, emailTemplates } from "@/lib/email";
import { NextResponse } from "next/server";

async function checkAvailability(tx: any, decorationId: string, startDate: Date, endDate: Date, requestedQty: number) {
  const decoration = await tx.decoration.findUnique({ where: { id: decorationId } });
  if (!decoration) throw new Error("Decoration not found");

  const overlappingBookings = await tx.booking.findMany({
    where: {
      status: { in: [BookingStatus.REQUEST, BookingStatus.TAKEN, BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      OR: [
        {
          eventDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
      bookingItems: {
        some: { decorationId },
      },
    },
    include: {
      bookingItems: {
        where: { decorationId },
      },
    },
  });

  let reservedQty = 0;
  for (let i = 0; i < overlappingBookings.length; i++) {
    const booking = overlappingBookings[i];
    for (let j = 0; j < booking.bookingItems.length; j++) {
      if (booking.bookingItems[j].decorationId === decorationId) {
        reservedQty += booking.bookingItems[j].quantity;
      }
    }
  }

  return decoration.totalQty - reservedQty >= requestedQty;
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.id;
    const role = session.role;
    
    let bookings;
    if (role === "ADMIN") {
      bookings = await prisma.booking.findMany({
        include: { user: true, bookingItems: { include: { decoration: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else {
      bookings = await prisma.booking.findMany({
        where: { userId },
        include: { bookingItems: { include: { decoration: true } } },
        orderBy: { createdAt: "desc" },
      });
    }
      
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const eventDate = new Date(body.eventDate);
    const endDate = new Date(body.endDate);

    const booking = await prisma.$transaction(async (tx) => {
      let totalPrice = 0;
      const bookingItemsData = [];

      for (const item of body.items) {
        const decoration = await tx.decoration.findUnique({ where: { id: item.decorationId } });
        if (!decoration) throw new Error(`Decoration ${item.decorationId} not found`);

        const isAvailable = await checkAvailability(tx, item.decorationId, eventDate, endDate, item.quantity);
        if (!isAvailable) throw new Error(`Decoration ${decoration.name} is not available for these dates`);

        let durationHours = (endDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60);
        if (durationHours <= 0) durationHours = 1;
        
        const priceUnit = decoration.priceUnitHours || 1;
        const blocks = Math.ceil(durationHours / priceUnit);
        const lineTotal = decoration.price * blocks * item.quantity;

        totalPrice += lineTotal;
        bookingItemsData.push({
          decorationId: item.decorationId,
          quantity: item.quantity,
          price: decoration.price,
        });
      }

      const deposit = Math.round((totalPrice * 0.2) * 100) / 100;
      
      let paymentAmount = body.paymentAmount !== undefined ? Number(body.paymentAmount) : deposit;
      if (paymentAmount > totalPrice) {
        paymentAmount = totalPrice;
      }
      
      if (paymentAmount < deposit - 0.1) {
        throw new Error(`Payment amount must be at least the 20% deposit of $${deposit}. (Provided: $${paymentAmount})`);
      }

      const balance = Math.round((totalPrice - paymentAmount) * 100) / 100;

      const createdBooking = await tx.booking.create({
        data: {
          userId: session.id,
          eventDate,
          endDate,
          location: body.location,
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

      if (paymentAmount > 0 && body.paymentMethod) {
         await tx.payment.create({
           data: {
             bookingId: createdBooking.id,
             amount: paymentAmount,
             method: body.paymentMethod,
             transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
             status: "SUCCESS",
             paidAt: new Date(),
           }
         });
      }

      for (const item of body.items) {
        await tx.decoration.update({
          where: { id: item.decorationId },
          data: { availableQty: { decrement: item.quantity } },
        });
      }

      return createdBooking;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    if (session.email) {
      const template = emailTemplates.bookingConfirmation(
        booking.id,
        booking.eventDate.toDateString(),
        booking.totalPrice
      );
      await sendEmail({ to: session.email, ...template });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

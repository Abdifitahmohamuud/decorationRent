import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { getServerSession } from "@/lib/auth-helper";
import { sendEmail, emailTemplates } from "@/lib/email";
import { NextResponse } from "next/server";

/**
 * Manual booking creation for admins — creates a booking on behalf of a
 * chosen customer (userId is supplied in the body instead of taken from
 * the session). Every other piece of logic — availability check, pricing,
 * transaction shape, notification, timeouts — is an exact copy of
 * /api/bookings/route.ts (the online customer flow), so both stay in sync.
 */

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

export async function POST(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // --- Admin-only requirement: which customer is this booking for ---
    if (!body.userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const targetUser = await prisma.user.findUnique({ where: { id: body.userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "Selected customer was not found" }, { status: 400 });
    }

    const eventDate = new Date(body.eventDate);
    const endDate = new Date(body.endDate);

    // Event Date Validations — identical to /api/bookings
    const now = new Date();
    let isDateOnly = false;
    if (typeof body.eventDate === 'string' && !body.eventDate.includes(':') && !body.eventDate.includes('T')) {
      isDateOnly = true;
    }

    if (isDateOnly) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const eventDateStart = new Date(eventDate);
      eventDateStart.setHours(0, 0, 0, 0);
      if (eventDateStart < todayStart) {
        return NextResponse.json({ error: "Booking date cannot be in the past" }, { status: 400 });
      }
    } else {
      if (eventDate.getTime() < now.getTime() - 5 * 60 * 1000) {
        return NextResponse.json({ error: "Booking date cannot be in the past" }, { status: 400 });
      }
    }

    if (endDate <= eventDate) {
      return NextResponse.json({ error: "End date must be after event start date" }, { status: 400 });
    }

    // Location Validation — identical to /api/bookings
    const ALLOWED_LOCATIONS = [
      "hodan",
      "wadajir", "wadij",
      "dharkiinleey", "dharkenley",
      "wabari",
      "xamar wayne", "xamar weyne",
      "boondheer", "boondheere",
      "kaaraan",
      "kaxda",
      "dayniile", "deynile",
      "garasbaaleey", "garasbaley",
      "cabdicasiis", "abdiaziz",
      "gubadleey", "gubadley",
      "shibi", "shibis",
      "yaaqshiid", "yaqshid", "yaaqshid",
      "hawlwadaag", "howlwadag"
    ];
    const locationLower = body.location?.trim().toLowerCase();
    if (!locationLower || !ALLOWED_LOCATIONS.includes(locationLower)) {
      return NextResponse.json({ error: "Invalid location. Please select one of the allowed locations." }, { status: 400 });
    }

    const booking = await prisma.$transaction(async (tx) => {
      let totalPrice = 0;
      const bookingItemsData = [];

      for (const item of body.items) {
        const decoration = await tx.decoration.findUnique({ where: { id: item.decorationId } });
        if (!decoration) {
          throw new Error(`DECORATION_NOT_FOUND:${item.decorationId}`);
        }

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
          userId: body.userId,
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

      // NOTE: Payment is NOT recorded here — same as /api/bookings. It's
      // recorded by /api/waafi/purchase (when called with a bookingId),
      // to avoid duplicate payment records / unique constraint errors.

      for (const item of body.items) {
        await tx.decoration.update({
          where: { id: item.decorationId },
          data: { availableQty: { decrement: item.quantity } },
        });
      }

      // Create Database Notification for the customer this booking is for
      await tx.notification.create({
        data: {
          userId: body.userId,
          type: "BOOKING",
          message: `Booking registered for you by administration. Booking ID: #${createdBooking.id.slice(-6).toUpperCase()}. Total: $${totalPrice.toFixed(2)}, Paid: $${paymentAmount.toFixed(2)}, Balance: $${balance.toFixed(2)}. Event: ${eventDate.toDateString()} to ${endDate.toDateString()}.`,
        }
      });

      // Fetch the full details to return
      const finalBooking = await tx.booking.findUnique({
        where: { id: createdBooking.id },
        include: {
          bookingItems: {
            include: {
              decoration: true
            }
          },
          payments: true
        }
      });

      return finalBooking;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    if (targetUser.email && booking) {
      try {
        const template = emailTemplates.bookingReport({
          bookingId: booking.id,
          eventDate: booking.eventDate.toDateString(),
          endDate: booking.endDate.toDateString(),
          location: booking.location,
          totalPrice: booking.totalPrice,
          paidAmount: booking.payments?.[0]?.amount || (booking.totalPrice - booking.balance),
          balance: booking.balance,
          items: booking.bookingItems.map((item: any) => ({
            name: item.decoration?.name || "Decoration Item",
            quantity: item.quantity,
            price: item.price
          }))
        });
        await sendEmail({ to: targetUser.email, ...template });
      } catch (emailError) {
        console.error('Failed to send admin manual booking confirmation email:', emailError);
        // Continue without failing the request
      }
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    // Detect missing decoration error and respond with 400 Bad Request
    if (error.message?.startsWith('DECORATION_NOT_FOUND')) {
      const missingId = error.message.split(':')[1];
      return NextResponse.json({ error: `Decoration ${missingId} not found` }, { status: 400 });
    }
    console.error("Admin manual booking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
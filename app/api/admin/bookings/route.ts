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

    // Event Date Validations
    const now = new Date();
    let isDateOnly = false;
    if (typeof eventDate === 'string' && !eventDate.includes(':') && !eventDate.includes('T')) {
      isDateOnly = true;
    }

    const eventDateObj = new Date(eventDate);
    const endDateObj = new Date(endDate);

    if (isDateOnly) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const eventDateStart = new Date(eventDateObj);
      eventDateStart.setHours(0, 0, 0, 0);
      if (eventDateStart < todayStart) {
        return NextResponse.json({ error: "Booking date cannot be in the past" }, { status: 400 });
      }
    } else {
      if (eventDateObj.getTime() < now.getTime() - 5 * 60 * 1000) {
        return NextResponse.json({ error: "Booking date cannot be in the past" }, { status: 400 });
      }
    }

    if (endDateObj <= eventDateObj) {
      return NextResponse.json({ error: "End date must be after event start date" }, { status: 400 });
    }

    // Location Validation
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
    const locationLower = location?.trim().toLowerCase();
    if (!locationLower || !ALLOWED_LOCATIONS.includes(locationLower)) {
      return NextResponse.json({ error: "Invalid location. Please select one of the allowed locations." }, { status: 400 });
    }

    const booking = await prisma.$transaction(async (tx : any) => {
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

      // Create Database Notification for customer
      await tx.notification.create({
        data: {
          userId,
          type: "BOOKING",
          message: `Booking registered for you by administration. Booking ID: #${createdBooking.id.slice(-6).toUpperCase()}. Total: $${totalPrice.toFixed(2)}, Balance: $${balance.toFixed(2)}. Event: ${eventDateObj.toDateString()} to ${endDateObj.toDateString()}.`,
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
          payments: true,
          user: true
        }
      });

      return finalBooking;
    });

    const emailTemplatesImport = require("@/lib/email");
    const { sendEmail, emailTemplates } = emailTemplatesImport;
    if (booking?.user?.email) {
      try {
        const template = emailTemplates.bookingReport({
          bookingId: booking.id,
          eventDate: booking.eventDate.toDateString(),
          endDate: booking.endDate.toDateString(),
          location: booking.location,
          totalPrice: booking.totalPrice,
          paidAmount: 0,
          balance: booking.balance,
          items: booking.bookingItems.map((item: any) => ({
            name: item.decoration?.name || "Decoration Item",
            quantity: item.quantity,
            price: item.price
          }))
        });
        await sendEmail({ to: booking.user.email, ...template });
      } catch (emailError) {
        console.error('Failed to send admin booking confirmation email:', emailError);
      }
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Admin create booking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

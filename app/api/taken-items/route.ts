import { prisma } from "@/lib/prisma"; // 1. Kani wuxuu ka maqnaa feylkaaga labaad!
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";

// ==========================================
// POST: Abuurista Taken Item & Validation
// ==========================================
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.id || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookingId, decorationId, userId, quantity, remarks } = body;

    // Payload validation caadi ah
    if (!bookingId || !decorationId || !userId || quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: "Invalid quantity supplied." }, { status: 400 });
    }

    const takenItem = await prisma.$transaction(async (tx) => {
      // 1. Hubi in Booking-ku jiro
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        throw new Error("Booking not found.");
      }

      // 2. Hubi in Decoration-ku jiro, stock-na laga heli karo
      const decoration = await tx.decoration.findUnique({ where: { id: decorationId } });
      if (!decoration) {
        throw new Error("Decoration not found.");
      }
      if (decoration.availableQty !== null && decoration.availableQty < qty) {
        throw new Error("Insufficient available quantity for the decoration.");
      }

      // 3. Abuur diiwaanka ah in alaabta la qaatay (Taken Item)
      const item = await tx.takenItem.create({
        data: {
          bookingId,
          decorationId,
          userId,
          quantity: qty,
          remarks,
        }
      });

      // 4. Ka dhim tirada stock-ka ee u diiwaangashan Decoration-ka
      if (decoration.availableQty !== null) {
        await tx.decoration.update({
          where: { id: decorationId },
          data: { availableQty: decoration.availableQty - qty }
        });
      }

      // 5. U beddel Booking status-kiisa TAKEN
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.TAKEN }
      });

      return item;
    });

    return NextResponse.json(takenItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// GET: Soo aqrinaya dhamaan Taken Items
// ==========================================
export async function GET() {
  const session = await getServerSession();
  if (!session?.id || (session.role !== "ADMIN" && session.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const takenItems = await prisma.takenItem.findMany({
      orderBy: { takenAt: "desc" },
      include: {
        decoration: true,
        user: true,
        booking: true,
      }
    });

    // Maadaama `image` uu hadda yahay URL caadi ah oo Supabase ah,
    // Looma baahna Buffer conversion, si toos ah u dhiib.
    const formatted = takenItems.map(item => {
      return {
        ...item,
        decoration: {
          ...item.decoration,
          image: item.decoration.image // Waa URL nadiif ah sidayda hore
        }
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
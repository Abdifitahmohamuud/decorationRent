import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helper";
import { uploadToSupabase } from "@/lib/uploud"; // Hubi haddii uu yahay upload ama uploud sidayda hore

// 1. GET ROUTE (Kii aad hore u haysatay)
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = params;
    
    // Find active bookings (CONFIRMED or PENDING) that include this decoration
    const activeBookings = await prisma.bookingItem.findMany({
      where: {
        decorationId: id,
        booking: {
          status: { in: ["CONFIRMED", "PENDING"] },
          endDate: { gte: new Date() } // Only look at bookings returning in the future
        }
      },
      include: {
        booking: true
      },
      orderBy: {
        booking: { endDate: "asc" }
      }
    });

    if (activeBookings.length === 0) {
      return NextResponse.json({ availableDate: null });
    }

    // Return the earliest end date among active bookings
    const nextAvailableDate = activeBookings[0].booking.endDate;
    
    return NextResponse.json({ availableDate: nextAvailableDate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. PATCH ROUTE (Cusboonaysiinta / Update-ka Saxda ah)
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  // Hubi badbaadada inuu qofku Admin yahay
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { image, ...rest } = data;

    // Diyaari xogta la cusboonaysiinayo
    const updateData: any = { ...rest };

    // Hubi haddii sawir cusub la soo geliyey (wuxuu ku bilaabmaa data:image)
    if (image && image.startsWith("data:image")) {
      const imageUrl = await uploadToSupabase(image);
      updateData.image = imageUrl;
    } else if (image) {
      // Haddii uu yahay URL-kii hore oo aan la beddelin
      updateData.image = image;
    }

    // Hubi haddii totalQty la beddelay, in availableQty isna lala simo (ikhtiyaari)
    if (rest.totalQty !== undefined) {
      updateData.availableQty = rest.totalQty;
    }

    // Ku cusboonaysii database-ka Prisma
    const updatedDecoration = await prisma.decoration.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedDecoration);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
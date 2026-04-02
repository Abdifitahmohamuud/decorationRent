import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        bookingItems: {
          include: { decoration: true }
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" }
    });

    // Convert decoration images to base64 for display
    const formatted = bookings.map(b => ({
      ...b,
      bookingItems: b.bookingItems.map(item => ({
        ...item,
        decoration: {
          ...item.decoration,
          image: item.decoration.image
            ? `data:image/jpeg;base64,${Buffer.from(item.decoration.image).toString("base64")}`
            : null
        }
      }))
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("User bookings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

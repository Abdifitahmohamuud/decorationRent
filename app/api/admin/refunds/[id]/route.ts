import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            user: true,
            bookingItems: {
              include: {
                decoration: true,
              }
            }
          }
        },
        payment: true,
      }
    });

    if (!refund) {
      return NextResponse.json({ error: "Refund not found" }, { status: 404 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: refund.requestedBy },
      select: { fullName: true }
    });

    const responseData = {
      ...refund,
      adminName: admin?.fullName || "System / Unknown Admin",
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

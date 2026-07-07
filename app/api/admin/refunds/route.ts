import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const refunds = await prisma.refund.findMany({
      orderBy: { requestedAt: "desc" },
      include: {
        booking: {
          include: {
            user: true,
          }
        },
        payment: true,
      }
    });

    // Fetch the admins to get their names for requestedBy
    const adminIds = Array.from(new Set(refunds.map(r => r.requestedBy).filter(Boolean)));
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, fullName: true }
    });
    const adminMap = new Map(admins.map(a => [a.id, a.fullName]));

    const responseData = refunds.map(r => ({
      ...r,
      adminName: adminMap.get(r.requestedBy) || "System / Unknown Admin",
    }));

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

  try {
    const payments = await prisma.payment.findMany({
      where: {
        ...(status && status !== "ALL" ? { status: status as any } : {}),
        ...(search ? {
          OR: [
            { transactionId: { contains: search, mode: "insensitive" } },
            { booking: { user: { fullName: { contains: search, mode: "insensitive" } } } },
          ]
        } : {})
      },
      include: {
        booking: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

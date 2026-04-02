import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const type = searchParams.get("type");
  const isRead = searchParams.get("isRead");

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(type && type !== "ALL" ? { type: type as any } : {}),
        ...(isRead === "true" ? { isRead: true } : isRead === "false" ? { isRead: false } : {}),
      },
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { userId, message, type } = await req.json();
    const notification = await prisma.notification.create({
      data: { userId, message, type: type || "BOOKING" },
    });
    return NextResponse.json(notification);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

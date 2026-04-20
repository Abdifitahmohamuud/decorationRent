import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

// 1. GET: Liiska Notifications (Basic CRUD)
export async function GET(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    // Direct Prisma call, no abstract services
    const notifications = await prisma.notification.findMany({
      where: {
        ...(type && type !== "ALL" ? { type: type as any } : {}),
      },
      include: { 
        user: { 
          select: { fullName: true, email: true } 
        } 
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Dirista Notification (Basic CRUD)
export async function POST(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, message, type } = await req.json();

    if (!userId || !message) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true }
    });

    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Dir Email
    const emailRes = await sendEmail({ 
       to: targetUser.email, 
       message: message,
       subject: `Update: ${type || "Notification"}`
    });

    // Save to DB (Basic Prisma)
    const notification = await prisma.notification.create({
      data: { 
        userId, 
        message, 
        type: type || "BOOKING",
        sentEmail: emailRes.success
      },
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
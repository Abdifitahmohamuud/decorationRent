import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("NOTIFICATION_DEBUG: Send request received");
  try {
    const body = await req.json();
    const { userId, message, type } = body;
    console.log("NOTIFICATION_DEBUG: Params:", { userId, message, type });

    if (!userId || !message) {
      return NextResponse.json({ error: "Fill all fields" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Send Email (via Nodemailer)
    const emailRes = await sendEmail({ 
      to: targetUser.email, 
      subject: `Update: ${type || "Notification"}`,
      message 
    });
    const emailStatus = emailRes.success;

    // 2. Create Dashboard Notification Record (Email only tracking)
    const notification = await prisma.notification.create({
      data: {
        userId,
        message,
        type: type || "BOOKING",
        sentEmail: emailStatus,
      }
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    console.error("Notification Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

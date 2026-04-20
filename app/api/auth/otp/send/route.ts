import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendEmail, emailTemplates } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB
    await prisma.otp.create({
      data: {
        email,
        code: otp,
        expiresAt,
      },
    });

    // Send Email
    const template = emailTemplates.otp(otp);
    const emailRes = await sendEmail({
      to: email,
      subject: template.subject,
      message: template.message,
      html: template.html,    
    });

    if (!emailRes.success) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Code sent successfully" });
  } catch (error: any) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  
}

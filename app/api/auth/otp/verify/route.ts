import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!otp || !email) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Find the latest valid OTP for this email
    const record = await prisma.otp.findFirst({
      where: {
        email,
        code: otp,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Optional: Delete the OTP after verification so it can't be used again
    await prisma.otp.delete({
      where: { id: record.id },
    });

    const cookieStore = await cookies();
    cookieStore.set("reg_verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 15, // 15 mins
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Email verified" });
  } catch (error: any) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

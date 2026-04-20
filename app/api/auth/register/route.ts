import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { sendEmail, emailTemplates } from "@/lib/email";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { fullName, email, phone, password } = await req.json();

    // 1. Basic Validation
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Custom Verification Check (Optional legacy step)
    const cookieStore = await cookies();
    const isVerified = cookieStore.get("reg_verified")?.value === "true";
    if (!isVerified) {
      return NextResponse.json({ error: "Please verify your email via OTP first." }, { status: 400 });
    }

    // 3. User Existence Check
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    // 4. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        role: "USER" // Default role
      },
    });

    // 5.1 Send Welcome Email
    try {
      const welcomeTemplate = emailTemplates.welcome(user.fullName);
      await sendEmail({ to: user.email, ...welcomeTemplate });
    } catch (emailErr) {
      console.error("Welcome Email Failed:", emailErr);
    }
    
    // 6. Generate Token
    const payload = { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
    const token = signToken(payload);

    // 7. Set Auth Cookie
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // 8. Clear Verification Cookies
    cookieStore.delete("reg_otp");
    cookieStore.delete("reg_verified");

    return NextResponse.json({ user: payload, token });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}

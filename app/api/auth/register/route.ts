import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { sendEmail, emailTemplates } from "@/lib/email";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const TIMEOUT_MS = 20000; // 20 second timeout for registration (includes email sending)

function createTimeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
    ),
  ]);
}

export async function POST(req: Request) {
  try {
    console.log("[REGISTER] Request received");

    // Parse request
    let fullName: string;
    let email: string;
    let phone: string;
    let password: string;

    try {
      const body = await createTimeoutPromise(req.json(), TIMEOUT_MS);
      fullName = body.fullName;
      email = body.email;
      phone = body.phone;
      password = body.password;
    } catch (error) {
      console.error("[REGISTER] Request parse error:", error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Basic Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("[REGISTER] Validating registration for email:", email);

    // Custom Verification Check (Optional legacy step)
    let cookieStore;
    let isVerified = false;

    try {
      cookieStore = await cookies();
      isVerified = cookieStore.get("reg_verified")?.value === "true";
    } catch (error) {
      console.error("[REGISTER] Cookie error:", error);
      cookieStore = await cookies(); // Retry
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: "Please verify your email via OTP first." },
        { status: 400 }
      );
    }

    // User Existence Check
    let existingUser;
    try {
      existingUser = await createTimeoutPromise(
        prisma.user.findUnique({ where: { email } }),
        TIMEOUT_MS
      );
    } catch (error) {
      console.error("[REGISTER] Database query error:", error);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    console.log("[REGISTER] Hashing password");

    // Hash Password
    let hashedPassword;
    try {
      hashedPassword = await createTimeoutPromise(
        bcrypt.hash(password, 10),
        TIMEOUT_MS
      );
    } catch (error) {
      console.error("[REGISTER] Password hashing error:", error);
      return NextResponse.json(
        { error: "Failed to process password" },
        { status: 500 }
      );
    }

    console.log("[REGISTER] Creating user in database");

    // Create User
    let user;
    try {
      user = await createTimeoutPromise(
        prisma.user.create({
          data: {
            fullName,
            email,
            phone,
            password: hashedPassword,
            role: "CUSTOMER", // Default role
          },
        }),
        TIMEOUT_MS
      );
    } catch (error) {
      console.error("[REGISTER] User creation error:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    console.log("[REGISTER] User created successfully, sending welcome email");

    // Send Welcome Email (non-blocking)
    try {
      const welcomeTemplate = emailTemplates.welcome(user.fullName);
      // Don't await, send email in background
      sendEmail({ to: user.email, ...welcomeTemplate }).catch((emailErr) => {
        console.error("[REGISTER] Welcome email failed:", emailErr);
      });
    } catch (emailErr) {
      console.error("[REGISTER] Email sending error:", emailErr);
      // Continue anyway, user is registered
    }

    console.log("[REGISTER] Generating token");

    // Generate Token
    const payload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
    const token = signToken(payload);

    console.log("[REGISTER] Setting auth cookie and clearing verification cookies");

    // Set Auth Cookie
    try {
      cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      // Clear Verification Cookies
      cookieStore.delete("reg_otp");
      cookieStore.delete("reg_verified");
    } catch (error) {
      console.error("[REGISTER] Cookie management error:", error);
      // Continue anyway, token is in response
    }

    console.log("[REGISTER] Registration successful for user:", email);

    return NextResponse.json(
      { 
        success: true,
        user: payload, 
        token,
        message: "Registration successful"
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[REGISTER] Unexpected error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again.", details: error?.message },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Add timeout handler
const TIMEOUT_MS = 15000; // 15 second timeout

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
    console.log("[LOGIN] Request received");

    // Parse request with timeout
    let email: string;
    let password: string;

    try {
      const body = await createTimeoutPromise(req.json(), TIMEOUT_MS);
      email = body.email;
      password = body.password;
    } catch (error) {
      console.error("[LOGIN] Request parse error:", error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.log("[LOGIN] Attempting login for email:", email);

    // Query with timeout
    let user;
    try {
      user = await createTimeoutPromise(
        prisma.user.findUnique({ where: { email } }),
        TIMEOUT_MS
      );
    } catch (error) {
      console.error("[LOGIN] Database query error:", error);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    if (!user) {
      console.log("[LOGIN] User not found:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log("[LOGIN] User found, comparing password");

    // Compare password with timeout
    let isMatch = false;
    try {
      isMatch = await createTimeoutPromise(
        bcrypt.compare(password, user.password),
        TIMEOUT_MS
      );
    } catch (error) {
      console.error("[LOGIN] Password comparison error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }

    if (!isMatch) {
      console.log("[LOGIN] Password mismatch for user:", email);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log("[LOGIN] Password matched, creating token");

    const payload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    const token = signToken(payload);
    console.log("[LOGIN] Token created successfully");

    // Set cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set("auth_token", token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === "production",
        secure: false,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
      console.log("[LOGIN] Cookie set successfully");
    } catch (error) {
      console.error("[LOGIN] Cookie setting error:", error);
      // Continue anyway, return token in response
    }

    console.log("[LOGIN] Login successful for user:", email);

    return NextResponse.json(
      {
        success: true,
        user: payload,
        token: token,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[LOGIN] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}

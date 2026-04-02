import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: "admin@decorrent.com" },
      update: {
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
      create: {
        fullName: "System Admin",
        email: "admin@decorrent.com",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Admin user updated successfully", 
      email: user.email,
      role: user.role
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { role, isActive, fullName, email, password } = await req.json();
    
    let updateData: any = {
      ...(role ? { role: role as any } : {}),
      ...(typeof isActive === "boolean" ? { isActive } : {}),
      ...(fullName ? { fullName } : {}),
      ...(email ? { email } : {}),
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if user has bookings
    const bookingsCount = await prisma.booking.count({ where: { userId: params.id } });
    if (bookingsCount > 0) {
      return NextResponse.json({ error: "Cannot delete user with active bookings. Deactivate instead." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Cannot delete this user because they are linked to existing system records (e.g. payments or notifications)." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}

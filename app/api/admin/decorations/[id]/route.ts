import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, category, price, totalQty, image, isActive } = await req.json();
    
    // Convert Base64 to Buffer if image is provided
    let updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    // if (category) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (totalQty !== undefined) updateData.totalQty = parseInt(totalQty);
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (image && typeof image === "string") {
      const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
      updateData.image = Buffer.from(base64Data, "base64");
    }

    const decoration = await prisma.decoration.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(decoration);
  } catch (error: any) {
    console.error("Decoration Update Error:", error);
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
    // Check if decoration is in any bookings
    const bookingItemsCount = await prisma.bookingItem.count({ where: { decorationId: params.id } });
    if (bookingItemsCount > 0) {
      return NextResponse.json({ error: "Cannot delete decoration used in existing bookings. Deactivate it instead." }, { status: 400 });
    }

    await prisma.decoration.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Cannot delete this decoration because it is linked to other records. Try deactivating it instead." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}

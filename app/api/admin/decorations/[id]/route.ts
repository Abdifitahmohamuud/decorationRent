import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { uploadToSupabase } from "@/lib/uploud";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession();
  
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, category, price, priceUnitHours, totalQty, image, isActive, availableQty } = await req.json();

    const priceFloat = price !== undefined ? Number(price) : undefined;
    const priceUnitHoursFloat = priceUnitHours !== undefined ? Number(priceUnitHours) : undefined;
    const totalQtyInt = totalQty !== undefined ? Number(totalQty) : undefined;
    const availableQtyInt = availableQty !== undefined ? Number(availableQty) : undefined;

    // Validation checks
    if (priceFloat !== undefined && Number.isNaN(priceFloat)) {
      return NextResponse.json({ error: "Invalid price." }, { status: 400 });
    }

    if (priceUnitHoursFloat !== undefined && Number.isNaN(priceUnitHoursFloat)) {
      return NextResponse.json({ error: "Invalid price unit hours." }, { status: 400 });
    }

    if (totalQtyInt !== undefined && Number.isNaN(totalQtyInt)) {
      return NextResponse.json({ error: "Invalid total quantity." }, { status: 400 });
    }

    if (availableQtyInt !== undefined && Number.isNaN(availableQtyInt)) {
      return NextResponse.json({ error: "Invalid available quantity." }, { status: 400 });
    }

    if (availableQtyInt !== undefined && totalQtyInt !== undefined && availableQtyInt > totalQtyInt) {
      return NextResponse.json({ error: "Available quantity cannot exceed total quantity." }, { status: 400 });
    }

    // Diyaari xogta la cusboonaysiinayo (Update)
    let updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (priceFloat !== undefined) updateData.price = priceFloat;
    if (priceUnitHoursFloat !== undefined) updateData.priceUnitHours = priceUnitHoursFloat;
    if (totalQtyInt !== undefined) updateData.totalQty = totalQtyInt;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (availableQtyInt !== undefined) updateData.availableQty = availableQtyInt;

    // MAARAYNTA SAWIRKA (Halkan waxaa loo habeeyay sidii POST-kaaga):
    if (image && typeof image === "string") {
      // Haddii uu yahay sawir cusub oo foomka laga soo doortay (Base64)
      if (image.startsWith("data:image") || !image.startsWith("http")) {
        const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
        const imageBuffer = Buffer.from(base64Data, "base64");
        
        // U dhiib Object sax ah siday `uploadToSupabase` u baahnayd
        const uploadedUrl = await uploadToSupabase({
          originalname: `update_${Date.now()}.jpg`,
          mimetype: "image/jpeg",
          buffer: imageBuffer
        }, "decorations");
        
        updateData.image = uploadedUrl; 
      } else {
        // Haddii uu yahay URL-kii hore oo aan la beddelin (wuxuu ku bilaawdaa http)
        updateData.image = image;
      }
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
  const session = await getServerSession();
  
  if (session?.role !== "ADMIN") {
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
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  try {
    const decorations = await prisma.decoration.findMany({
      where: {
        ...(search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ]
        } : {})
      },
      orderBy: { updatedAt: "desc" }
    });

    // Convert Buffer to Base64 for delivery
    const formattedDecorations = decorations.map(d => {
        let image = null;
        if (d.image) {
            image = `data:image/jpeg;base64,${Buffer.from(d.image).toString("base64")}`;
        }
        return {
            ...d,
            image
        };
    });

    return NextResponse.json(formattedDecorations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, category, price, totalQty, image, availableQty } = await req.json();
    
    // Convert Base64 (with or without data: URI) to Buffer
    let imageBuffer = null;
    if (image && typeof image === "string") {
      const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
      imageBuffer = Buffer.from(base64Data, "base64");
    }

    const priceFloat = Number(price);
    const totalQtyInt = Number(totalQty);
    const availableQtyInt = availableQty === undefined ? undefined : Number(availableQty);

    if (Number.isNaN(priceFloat) || Number.isNaN(totalQtyInt)) {
      return NextResponse.json({ error: "Invalid price or total quantity." }, { status: 400 });
    }

    if (availableQtyInt !== undefined && Number.isNaN(availableQtyInt)) {
      return NextResponse.json({ error: "Invalid available quantity." }, { status: 400 });
    }

    if (availableQtyInt !== undefined && availableQtyInt > totalQtyInt) {
      return NextResponse.json({ error: "Available quantity cannot exceed total quantity." }, { status: 400 });
    }

    const decoration = await prisma.decoration.create({
      data: {
        name,
        description,
        // category: category || "General",
        price: priceFloat,
        totalQty: totalQtyInt,
        availableQty: availableQtyInt ?? totalQtyInt,
        image: imageBuffer,
      }
    });

    return NextResponse.json(decoration);
  } catch (error: any) {
    console.error("Decoration Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

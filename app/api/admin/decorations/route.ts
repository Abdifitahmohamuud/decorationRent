import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
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
    const formattedDecorations = decorations.map(d => ({
      ...d,
      image: d.image ? `data:image/jpeg;base64,${Buffer.from(d.image).toString("base64")}` : null
    }));

    return NextResponse.json(formattedDecorations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, category, price, totalQty, image } = await req.json();
    
    // Convert Base64 (with or without data: URI) to Buffer
    let imageBuffer = null;
    if (image && typeof image === "string") {
      const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
      imageBuffer = Buffer.from(base64Data, "base64");
    }

    const decoration = await prisma.decoration.create({
      data: {
        name,
        description,
        // category: category || "General",
        price: parseFloat(price),
        totalQty: parseInt(totalQty),
        availableQty: parseInt(totalQty),
        image: imageBuffer,
      }
    });

    return NextResponse.json(decoration);
  } catch (error: any) {
    console.error("Decoration Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

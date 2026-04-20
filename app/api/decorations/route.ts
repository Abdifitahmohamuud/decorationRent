import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const decorations = await prisma.decoration.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    
    const formattedDecorations = [];
    for (let i = 0; i < decorations.length; i++) {
      const d = decorations[i];
      let imageData = null;
      if (d.image) {
        imageData = `data:image/jpeg;base64,${Buffer.from(d.image).toString("base64")}`;
      }
      formattedDecorations.push({
        ...d,
        image: imageData
      });
    }
    
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
    const data = await req.json();
    const { image, category, ...rest } = data;
    
    let imageBuffer = null;
    if (image) {
      const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
      imageBuffer = Buffer.from(base64Data, "base64");
    }

    const decoration = await prisma.decoration.create({
      data: {
        ...rest,
        image: imageBuffer,
        availableQty: rest.totalQty,
      },
    });
    
    return NextResponse.json(decoration);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

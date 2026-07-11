import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { uploadToSupabase} from './../.././../lib/uploud'
export async function GET() {
  try {
    const decorations = await prisma.decoration.findMany({
      where: { isActive: true },
       
      orderBy: { createdAt: "desc" },
    });

   

    return NextResponse.json(decorations);
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

   const imageUrl =await uploadToSupabase(image)

    const decoration = await prisma.decoration.create({
      data: {
        ...rest,
        image: imageUrl,
        availableQty: rest.totalQty,
      },
    });

    return NextResponse.json(decoration);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

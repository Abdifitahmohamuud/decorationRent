import { decorationService } from "@/server/services/decoration-service";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const decorations = await decorationService.getAll();
    return NextResponse.json(decorations);
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
    const body = await req.json();
    const decoration = await decorationService.create(body);
    return NextResponse.json(decoration);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

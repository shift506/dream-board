import { NextRequest, NextResponse } from "next/server";
import { getBusinessContext, setBusinessContext } from "@/lib/context";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get("boardroom-id")?.value ?? "anonymous";
  const mode = req.nextUrl.searchParams.get("mode") ?? "business";
  const content = await getBusinessContext(userId, mode);
  return NextResponse.json({ content });
}

export async function PUT(req: NextRequest) {
  const userId = req.cookies.get("boardroom-id")?.value ?? "anonymous";
  const { content, mode = "business" } = (await req.json()) as { content: string; mode?: string };
  if (typeof content !== "string") {
    return NextResponse.json({ error: "Invalid content." }, { status: 400 });
  }
  try {
    await setBusinessContext(content, userId, mode);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[context PUT]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

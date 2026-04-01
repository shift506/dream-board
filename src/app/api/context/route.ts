import { NextRequest, NextResponse } from "next/server";
import { getBusinessContext, setBusinessContext } from "@/lib/context";

export async function GET() {
  const content = await getBusinessContext();
  return NextResponse.json({ content });
}

export async function PUT(req: NextRequest) {
  const { content } = (await req.json()) as { content: string };
  if (typeof content !== "string") {
    return NextResponse.json({ error: "Invalid content." }, { status: 400 });
  }
  try {
    await setBusinessContext(content);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[context PUT]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONTEXT_PATH = path.join(process.cwd(), "context.md");

export async function GET() {
  const content = fs.existsSync(CONTEXT_PATH)
    ? fs.readFileSync(CONTEXT_PATH, "utf-8")
    : "";
  return NextResponse.json({ content });
}

export async function PUT(req: NextRequest) {
  const { content } = (await req.json()) as { content: string };
  if (typeof content !== "string") {
    return NextResponse.json({ error: "Invalid content." }, { status: 400 });
  }
  fs.writeFileSync(CONTEXT_PATH, content, "utf-8");
  return NextResponse.json({ ok: true });
}

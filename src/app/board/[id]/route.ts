import { NextRequest, NextResponse } from "next/server";

// Visiting /board/{id} sets that ID as your boardroom-id cookie and redirects to context
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const res = NextResponse.redirect(new URL("/context", req.url));
  res.cookies.set("boardroom-id", id, {
    maxAge: 60 * 60 * 24 * 365 * 10,
    sameSite: "lax",
    path: "/",
  });
  return res;
}

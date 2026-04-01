import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (req.cookies.get("boardroom-id")) return NextResponse.next();
  const res = NextResponse.next();
  res.cookies.set("boardroom-id", crypto.randomUUID(), {
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    sameSite: "lax",
    path: "/",
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

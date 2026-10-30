import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const hasToken = req.cookies.has("token");
  const onLogin = req.nextUrl.pathname === "/login";

  if (!hasToken && !onLogin) return NextResponse.redirect(new URL("/login", req.url));
  if (hasToken && onLogin) return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

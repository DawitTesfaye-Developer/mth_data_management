import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000/api";

export async function POST(req: NextRequest) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: await req.text(),
    cache: "no-store",
  }).catch(() => null);

  if (!res) {
    return NextResponse.json({ message: "Cannot reach the API. Check that the Laravel server is running." }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  // The token stays in an httpOnly cookie; the browser only ever receives the user.
  const out = NextResponse.json({ user: data.user });
  out.cookies.set("token", data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return out;
}

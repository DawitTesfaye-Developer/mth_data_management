import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000/api";

export async function POST() {
  const token = cookies().get("token")?.value;
  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    }).catch(() => null);
  }
  const out = NextResponse.json({ message: "Signed out." });
  out.cookies.delete("token");
  return out;
}

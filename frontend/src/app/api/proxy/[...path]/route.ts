import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000/api";

/** Forwards browser calls to Laravel, attaching the bearer token from the httpOnly cookie. */
async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const token = cookies().get("token")?.value;
  const url = `${API_URL}/${params.path.join("/")}${req.nextUrl.search}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  if (token) headers.Authorization = `Bearer ${token}`;

  const hasBody = !["GET", "HEAD"].includes(req.method);
  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: hasBody ? await req.text() : undefined,
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ message: "Cannot reach the API. Check that the Laravel server is running." }, { status: 502 });
  }

  const body = upstream.status === 204 ? null : await upstream.text();
  const out = new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
  if (upstream.status === 401) out.cookies.delete("token");
  return out;
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };

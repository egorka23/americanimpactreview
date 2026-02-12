import { NextResponse } from "next/server";
import { isLocalHost } from "@/lib/local-admin";

export async function POST(request: Request) {
  const host = request.headers.get("host") || "";
  if (process.env.NODE_ENV !== "development" || !isLocalHost(host)) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("air_admin", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

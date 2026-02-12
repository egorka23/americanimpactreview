import { NextResponse } from "next/server";

function isLocalHost(host: string) {
  const value = host.toLowerCase();
  return value.includes("localhost") || value.includes("127.0.0.1");
}

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

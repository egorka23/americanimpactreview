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

  const password = process.env.LOCAL_ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.json(
      { error: "LOCAL_ADMIN_PASSWORD is not set." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const input = typeof body?.password === "string" ? body.password : "";

  if (input !== password) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("air_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}

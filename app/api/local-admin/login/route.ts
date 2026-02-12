import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
    secure: true,
  });
  return response;
}

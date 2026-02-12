import { NextResponse } from "next/server";

export async function POST() {
  // TODO: restore password check later
  const response = NextResponse.json({ ok: true });
  response.cookies.set("air_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: true,
  });
  return response;
}

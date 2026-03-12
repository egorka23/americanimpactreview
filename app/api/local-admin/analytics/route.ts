import { NextRequest, NextResponse } from "next/server";
import { isLocalAdminRequest } from "@/lib/local-admin";

const MATOMO_URL = process.env.MATOMO_URL || "https://a.meret.tech";
const MATOMO_TOKEN = process.env.MATOMO_TOKEN || "";
const MATOMO_SITE_ID = process.env.MATOMO_SITE_ID || "4";

export async function POST(req: NextRequest) {
  if (!isLocalAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { method, params } = await req.json();

    const body = new URLSearchParams({
      module: "API",
      method,
      idSite: MATOMO_SITE_ID,
      format: "JSON",
      token_auth: MATOMO_TOKEN,
      ...params,
    });

    const res = await fetch(`${MATOMO_URL}/index.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Matomo API error" },
      { status: 500 }
    );
  }
}

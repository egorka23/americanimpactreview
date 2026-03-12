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

    const url = `${MATOMO_URL.replace(/\/+$/, "")}/index.php`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const text = await res.text();

    // Matomo sometimes returns HTML on error (redirect, auth issue)
    if (text.startsWith("<!") || text.startsWith("<html")) {
      return NextResponse.json(
        { error: `Matomo returned HTML (status ${res.status}). Check MATOMO_URL and MATOMO_TOKEN env vars.` },
        { status: 502 }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Matomo API error" },
      { status: 500 }
    );
  }
}

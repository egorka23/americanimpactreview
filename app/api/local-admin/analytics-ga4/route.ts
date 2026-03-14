import { NextRequest, NextResponse } from "next/server";
import { isLocalAdminRequest } from "@/lib/local-admin";

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || "";
const GA4_CLIENT_ID = process.env.GA4_CLIENT_ID || "";
const GA4_CLIENT_SECRET = process.env.GA4_CLIENT_SECRET || "";
const GA4_REFRESH_TOKEN = process.env.GA4_REFRESH_TOKEN || "";

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GA4_CLIENT_ID,
      client_secret: GA4_CLIENT_SECRET,
      refresh_token: GA4_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }).toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("GA4 token refresh failed");
  return data.access_token;
}

export async function POST(req: NextRequest) {
  if (!isLocalAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!GA4_REFRESH_TOKEN) {
    return NextResponse.json({ error: "GA4_REFRESH_TOKEN not configured" }, { status: 500 });
  }

  try {
    const { report } = await req.json();
    const token = await getAccessToken();

    // Default: top article pages last 30 days
    const body = report || {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "activeUsers" },
        { name: "userEngagementDuration" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "BEGINS_WITH", value: "/article/" },
        },
      },
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 25,
    };

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GA4 API error" },
      { status: 500 }
    );
  }
}

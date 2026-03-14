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

async function runReport(token: string, body: Record<string, unknown>) {
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
  if (!res.ok) {
    console.error("GA4 runReport error:", JSON.stringify(data));
    throw new Error(data?.error?.message || `GA4 API ${res.status}`);
  }
  return data;
}

export async function POST(req: NextRequest) {
  if (!isLocalAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!GA4_REFRESH_TOKEN) {
    return NextResponse.json({ error: "GA4_REFRESH_TOKEN not configured" }, { status: 500 });
  }

  try {
    const { report, mode } = await req.json();
    const token = await getAccessToken();

    // Full dashboard mode: return all key metrics in one call
    if (mode === "dashboard") {
      const safe = async (fn: () => Promise<Record<string, unknown>>) => {
        try { return await fn(); } catch (e) { console.error("GA4 partial error:", e); return {}; }
      };

      const [articles, summary, prev, engagement] = await Promise.all([
        // Top articles by views
        safe(() => runReport(token, {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "userEngagementDuration" },
            { name: "bounceRate" },
          ],
          dimensionFilter: {
            filter: {
              fieldName: "pagePath",
              stringFilter: { matchType: "BEGINS_WITH", value: "/article/" },
            },
          },
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 25,
        })),
        // Overall site summary (current period)
        safe(() => runReport(token, {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "newUsers" },
            { name: "engagedSessions" },
            { name: "sessions" },
            { name: "engagementRate" },
            { name: "bounceRate" },
            { name: "averageSessionDuration" },
            { name: "screenPageViewsPerSession" },
            { name: "eventCount" },
          ],
        })),
        // Previous period for comparison
        safe(() => runReport(token, {
          dateRanges: [{ startDate: "60daysAgo", endDate: "31daysAgo" }],
          metrics: [
            { name: "screenPageViews" },
            { name: "activeUsers" },
            { name: "newUsers" },
            { name: "engagedSessions" },
            { name: "sessions" },
            { name: "engagementRate" },
            { name: "bounceRate" },
            { name: "averageSessionDuration" },
          ],
        })),
        // Key events breakdown
        safe(() => runReport(token, {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: {
            orGroup: {
              expressions: [
                { filter: { fieldName: "eventName", stringFilter: { value: "file_download" } } },
                { filter: { fieldName: "eventName", stringFilter: { value: "scroll" } } },
                { filter: { fieldName: "eventName", stringFilter: { value: "click" } } },
                { filter: { fieldName: "eventName", stringFilter: { value: "form_start" } } },
                { filter: { fieldName: "eventName", stringFilter: { value: "form_submit" } } },
              ],
            },
          },
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        })),
      ]);

      return NextResponse.json({ articles, summary, prev, engagement });
    }

    // Single report mode (backward compatible)
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

    const data = await runReport(token, body);
    return NextResponse.json(data);
  } catch (err) {
    console.error("GA4 route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GA4 API error" },
      { status: 500 }
    );
  }
}

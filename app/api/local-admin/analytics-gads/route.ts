import { NextRequest, NextResponse } from "next/server";
import { isLocalAdminRequest } from "@/lib/local-admin";

const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "";
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID || "";
const CLIENT_ID = process.env.GA4_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GA4_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN || "";
const LOGIN_CUSTOMER_ID = process.env.GOOGLE_ADS_MCC_ID || "";

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }).toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Google Ads token refresh failed");
  return data.access_token;
}

async function searchGoogleAds(token: string, query: string) {
  const res = await fetch(
    `https://googleads.googleapis.com/v19/customers/${CUSTOMER_ID}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "developer-token": DEVELOPER_TOKEN,
        "login-customer-id": LOGIN_CUSTOMER_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    console.error("Google Ads API error:", JSON.stringify(data));
    throw new Error(data?.error?.message || `Google Ads API ${res.status}`);
  }
  return data;
}

export async function POST(req: NextRequest) {
  if (!isLocalAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!DEVELOPER_TOKEN || !REFRESH_TOKEN) {
    return NextResponse.json(
      { error: "Google Ads API not configured" },
      { status: 500 }
    );
  }

  try {
    const token = await getAccessToken();

    // Campaign performance last 30 days
    const campaignQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.impressions DESC
    `;

    // Account-level summary
    const summaryQuery = `
      SELECT
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM customer
      WHERE segments.date DURING LAST_30_DAYS
    `;

    const [campaigns, summary] = await Promise.all([
      searchGoogleAds(token, campaignQuery).catch((e) => {
        console.error("Google Ads campaigns error:", e);
        return null;
      }),
      searchGoogleAds(token, summaryQuery).catch((e) => {
        console.error("Google Ads summary error:", e);
        return null;
      }),
    ]);

    return NextResponse.json({ campaigns, summary });
  } catch (err) {
    console.error("Google Ads route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Google Ads API error" },
      { status: 500 }
    );
  }
}

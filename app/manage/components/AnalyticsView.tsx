"use client";

import { useCallback, useEffect, useState } from "react";

type Summary = {
  nb_uniq_visitors: number;
  nb_visits: number;
  nb_actions: number;
  bounce_rate: string;
  avg_time_on_site: number;
  nb_actions_per_visit: number;
};

type PageRow = {
  label: string;
  nb_visits: number;
  nb_hits: number;
  bounce_rate: string;
  avg_time_on_page: number;
};

type ReferrerRow = {
  label: string;
  nb_visits: number;
  nb_actions: number;
};

type CountryRow = {
  label: string;
  nb_visits: number;
  nb_uniq_visitors: number;
  logo: string;
};

type DeviceRow = {
  label: string;
  nb_visits: number;
};

type KeywordRow = {
  label: string;
  nb_visits: number;
  nb_actions: number;
};

type SearchEngineRow = {
  label: string;
  nb_visits: number;
};

type DownloadRow = {
  label: string;
  nb_visits: number;
  nb_hits: number;
  url: string;
};

type LiveVisit = {
  idVisit: string;
  visitIp: string;
  visitorId: string;
  country: string;
  countryFlag: string;
  referrerName: string;
  referrerTypeName: string;
  browser: string;
  operatingSystem: string;
  deviceType: string;
  actions: number;
  visitDurationPretty: string;
  lastActionDateTime: string;
  actionDetails?: { type: string; url?: string; pageTitle?: string }[];
};

type GA4Row = {
  pagePath: string;
  views: number;
  users: number;
  engagementSec: number;
};

type GA4Summary = {
  totalViews: number;
  totalUsers: number;
  avgEngagement: number;
};

type DailyData = Record<string, Summary | []>;

const MATOMO_EXT = "https://a.meret.tech/index.php?module=CoreHome&action=index&idSite=4&period=day&date=today";
const GA4_EXT = "https://analytics.google.com/analytics/web/#/p527755533/reports/intellligence";

function fmtTime(seconds: number): string {
  if (!seconds) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

async function matomoQuery(method: string, params: Record<string, string> = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("/api/local-admin/analytics", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${text}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function ga4Query(report?: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("/api/local-admin/analytics-ga4", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GA4 ${res.status}: ${text}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function parseGA4Rows(data: Record<string, unknown>): GA4Row[] {
  const rows = data?.rows as Array<{
    dimensionValues: { value: string }[];
    metricValues: { value: string }[];
  }>;
  if (!rows) return [];
  return rows.map((r) => ({
    pagePath: r.dimensionValues[0].value,
    views: parseInt(r.metricValues[0].value) || 0,
    users: parseInt(r.metricValues[1].value) || 0,
    engagementSec: Math.round(parseFloat(r.metricValues[2].value) || 0),
  }));
}

export default function AnalyticsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");

  // Data
  const [summary, setSummary] = useState<Summary | null>(null);
  const [todaySummary, setTodaySummary] = useState<Summary | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [referrers, setReferrers] = useState<ReferrerRow[]>([]);
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [searchEngines, setSearchEngines] = useState<SearchEngineRow[]>([]);
  const [downloads, setDownloads] = useState<DownloadRow[]>([]);
  const [liveVisits, setLiveVisits] = useState<LiveVisit[]>([]);
  const [dailyData, setDailyData] = useState<DailyData>({});
  const [ga4Articles, setGa4Articles] = useState<GA4Row[]>([]);
  const [ga4Summary, setGa4Summary] = useState<GA4Summary | null>(null);
  const [ga4Loading, setGa4Loading] = useState(false);
  const [ga4Error, setGa4Error] = useState<string | null>(null);

  const fetchGA4 = useCallback(async () => {
    setGa4Loading(true);
    setGa4Error(null);
    try {
      // Top articles (default report)
      const articlesData = await ga4Query();
      const rows = parseGA4Rows(articlesData);
      setGa4Articles(rows);

      // Overall summary (all pages)
      const summaryData = await ga4Query({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "activeUsers" },
          { name: "averageSessionDuration" },
        ],
      });
      const totals = summaryData?.rows?.[0]?.metricValues;
      if (totals) {
        setGa4Summary({
          totalViews: parseInt(totals[0].value) || 0,
          totalUsers: parseInt(totals[1].value) || 0,
          avgEngagement: Math.round(parseFloat(totals[2].value) || 0),
        });
      }
    } catch (err) {
      setGa4Error(err instanceof Error ? err.message : "GA4 failed");
    } finally {
      setGa4Loading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, today, live, pg, ref, co, dev, kw, se, dl, lv, daily] = await Promise.all([
        matomoQuery("VisitsSummary.get", { period, date: "today" }),
        matomoQuery("VisitsSummary.get", { period: "day", date: "today" }),
        matomoQuery("Live.getCounters", { lastMinutes: "30" }),
        matomoQuery("Actions.getPageUrls", { period, date: "today", flat: "1", filter_limit: "15" }),
        matomoQuery("Referrers.getAll", { period, date: "today", filter_limit: "10" }),
        matomoQuery("UserCountry.getCountry", { period, date: "today", filter_limit: "10" }),
        matomoQuery("DevicesDetection.getType", { period, date: "today", filter_limit: "5" }),
        matomoQuery("Referrers.getKeywords", { period, date: "today", filter_limit: "20" }),
        matomoQuery("Referrers.getSearchEngines", { period, date: "today", filter_limit: "10" }),
        matomoQuery("Actions.getDownloads", { period, date: "today", flat: "1", filter_limit: "20" }),
        matomoQuery("Live.getLastVisitsDetails", { period: "day", date: "today", filter_limit: "10" }),
        matomoQuery("VisitsSummary.get", { period: "day", date: "last14" }),
      ]);
      setSummary(sum);
      setTodaySummary(today);
      setLiveCount(Array.isArray(live) && live[0] ? live[0].visitors : 0);
      setPages(Array.isArray(pg) ? pg : []);
      setReferrers(Array.isArray(ref) ? ref : []);
      setCountries(Array.isArray(co) ? co : []);
      setDevices(Array.isArray(dev) ? dev : []);
      setKeywords(Array.isArray(kw) ? kw : []);
      setSearchEngines(Array.isArray(se) ? se : []);
      setDownloads(Array.isArray(dl) ? dl : []);
      setLiveVisits(Array.isArray(lv) ? lv : []);
      setDailyData(daily && typeof daily === "object" ? daily : {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    fetchGA4();
    const iv = setInterval(fetchData, 60_000);
    return () => clearInterval(iv);
  }, [fetchData, fetchGA4]);

  // Mini chart from daily data
  const chartDays = Object.entries(dailyData)
    .map(([date, d]) => ({
      date,
      visitors: Array.isArray(d) ? 0 : (d as Summary).nb_uniq_visitors || 0,
      visits: Array.isArray(d) ? 0 : (d as Summary).nb_visits || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const maxVisitors = Math.max(1, ...chartDays.map((d) => d.visitors));

  return (
    <div className="flex-1 flex flex-col overflow-y-auto" style={{ background: "#fafafa" }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0" style={{ background: "#fff" }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: "#0a1628",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0a1628", margin: 0 }}>Analytics</h2>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>americanimpactreview.com</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500,
                border: "1px solid", cursor: "pointer",
                background: period === p ? "#0a1628" : "#fff",
                color: period === p ? "#fff" : "#334155",
                borderColor: period === p ? "#0a1628" : "#e2e0dc",
              }}
            >
              {p === "day" ? "Today" : p === "week" ? "Week" : "Month"}
            </button>
          ))}
          {/* Refresh */}
          <button
            onClick={fetchData}
            style={{
              padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e0dc",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
            }}
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
          {/* External links */}
          <a
            href={MATOMO_EXT}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500,
              border: "1px solid #e2e0dc", background: "#fff", color: "#334155",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            Matomo
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7" /><path d="M7 7h10v10" />
            </svg>
          </a>
          <a
            href={GA4_EXT}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500,
              border: "1px solid #e2e0dc", background: "#fff", color: "#334155",
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            GA4
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7" /><path d="M7 7h10v10" />
            </svg>
          </a>
        </div>
      </div>

      {loading && !summary ? (
        <div className="flex-1 flex items-center justify-center">
          <div style={{ fontSize: 14, color: "#64748b" }}>Loading analytics...</div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div style={{ fontSize: 14, color: "#dc2626" }}>{error}</div>
        </div>
      ) : (
        <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: liveCount > 0 ? "#22c55e" : "#94a3b8",
              display: "inline-block",
              animation: liveCount > 0 ? "pulse 2s infinite" : "none",
            }} />
            <span style={{ fontSize: 13, color: "#64748b" }}>
              <strong style={{ color: "#0a1628" }}>{liveCount}</strong> visitor{liveCount !== 1 ? "s" : ""} in last 30 min
            </span>
            {loading && (
              <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>updating...</span>
            )}
          </div>

          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Unique Visitors", value: summary?.nb_uniq_visitors ?? 0, today: todaySummary?.nb_uniq_visitors ?? 0 },
              { label: "Total Visits", value: summary?.nb_visits ?? 0, today: todaySummary?.nb_visits ?? 0 },
              { label: "Page Views", value: summary?.nb_actions ?? 0, today: todaySummary?.nb_actions ?? 0 },
              { label: "Bounce Rate", value: summary?.bounce_rate ?? "0%", today: null },
            ].map((kpi) => (
              <div key={kpi.label} style={{
                background: "#fff", borderRadius: 12, padding: "20px 24px",
                border: "1px solid #e2e0dc",
              }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 500 }}>{kpi.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#0a1628" }}>
                  {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                </div>
                {kpi.today !== null && period !== "day" && (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    Today: {(kpi.today as number).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Extra KPIs row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 24px", border: "1px solid #e2e0dc" }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Avg. Visit Duration</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0a1628" }}>
                {fmtTime(summary?.avg_time_on_site ?? 0)}
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 24px", border: "1px solid #e2e0dc" }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Pages / Visit</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0a1628" }}>
                {(summary?.nb_actions_per_visit ?? 0).toFixed(1)}
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 24px", border: "1px solid #e2e0dc" }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Devices</div>
              <div style={{ fontSize: 13, color: "#334155", marginTop: 4 }}>
                {devices.length > 0 ? devices.map((d) => (
                  <span key={d.label} style={{ marginRight: 12 }}>
                    {d.label}: <strong>{d.nb_visits}</strong>
                  </span>
                )) : <span style={{ color: "#94a3b8" }}>No data</span>}
              </div>
            </div>
          </div>

          {/* Visitors chart (last 14 days) */}
          <div style={{
            background: "#fff", borderRadius: 12, padding: "24px",
            border: "1px solid #e2e0dc", marginBottom: 24,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0a1628", marginBottom: 16 }}>
              Visitors — Last 14 Days
            </div>
            {chartDays.length > 0 ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
                {chartDays.map((day) => {
                  const h = maxVisitors > 0 ? (day.visitors / maxVisitors) * 100 : 0;
                  return (
                    <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 10, color: "#64748b" }}>{day.visitors || ""}</span>
                      <div
                        style={{
                          width: "100%", maxWidth: 40, borderRadius: "4px 4px 0 0",
                          background: day.visitors > 0 ? "#0a1628" : "#e2e0dc",
                          height: Math.max(h, 2),
                          transition: "height 0.3s",
                        }}
                        title={`${day.date}: ${day.visitors} visitors, ${day.visits} visits`}
                      />
                      <span style={{ fontSize: 9, color: "#94a3b8", transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>
                No data yet — chart will appear as visitors arrive
              </div>
            )}
          </div>

          {/* Real-time visitor log */}
          <div style={{
            background: "#fff", borderRadius: 12, padding: "24px",
            border: "1px solid #e2e0dc", marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
                display: "inline-block", animation: "pulse 2s infinite",
              }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0a1628" }}>Recent Visitors</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Last 10 visits today</span>
            </div>
            {liveVisits.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {liveVisits.map((v) => {
                  const lastPage = v.actionDetails?.filter((a) => a.type === "action").pop();
                  const time = v.lastActionDateTime ? new Date(v.lastActionDateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <div key={v.idVisit} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                      borderBottom: "1px solid #f1f5f9", fontSize: 13,
                    }}>
                      <span style={{ color: "#94a3b8", fontSize: 12, minWidth: 52 }}>{time}</span>
                      <span style={{ fontSize: 16 }} title={v.country}>{v.countryFlag || "🌍"}</span>
                      <span style={{ color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lastPage?.url}>
                        {lastPage?.pageTitle || lastPage?.url || "—"}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>
                        {v.actions} pg · {v.visitDurationPretty}
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: 11 }} title={v.referrerName}>
                        {v.referrerTypeName === "Direct Entry" ? "Direct" : v.referrerName || v.referrerTypeName}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 13, padding: "16px 0", textAlign: "center" }}>
                No visits recorded today yet
              </div>
            )}
          </div>

          {/* Search Queries — full width */}
          <div style={{
            background: "#fff", borderRadius: 12, padding: "24px",
            border: "1px solid #e2e0dc", marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a1628" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#0a1628" }}>Search Queries</span>
              </div>
              {searchEngines.length > 0 && (
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b" }}>
                  {searchEngines.slice(0, 5).map((se, i) => (
                    <span key={i}>{se.label}: <strong style={{ color: "#0a1628" }}>{se.nb_visits}</strong></span>
                  ))}
                </div>
              )}
            </div>
            {keywords.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {keywords.slice(0, 20).map((kw, i) => {
                  const maxKw = keywords[0]?.nb_visits || 1;
                  const pct = (kw.nb_visits / maxKw) * 100;
                  return (
                    <div key={i} style={{ position: "relative", padding: "8px 12px", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: `${pct}%`, background: "#f1f5f9", borderRadius: 6,
                      }} />
                      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#334155" }}>{kw.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#0a1628", marginLeft: 8 }}>{kw.nb_visits}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
                No search query data yet — keywords will appear as visitors find your site via search engines
              </div>
            )}
          </div>

          {/* PDF Downloads */}
          <div style={{
            background: "#fff", borderRadius: 12, padding: "24px",
            border: "1px solid #e2e0dc", marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a1628" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0a1628" }}>PDF Downloads</span>
              {downloads.length > 0 && (
                <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>
                  {downloads.reduce((s, d) => s + d.nb_hits, 0)} total
                </span>
              )}
            </div>
            {downloads.length > 0 ? (
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e0dc" }}>
                    <th style={{ textAlign: "left", padding: "6px 0", color: "#64748b", fontWeight: 500 }}>File</th>
                    <th style={{ textAlign: "right", padding: "6px 0", color: "#64748b", fontWeight: 500 }}>Downloads</th>
                    <th style={{ textAlign: "right", padding: "6px 0", color: "#64748b", fontWeight: 500 }}>Unique</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.slice(0, 15).map((d, i) => {
                    const maxDl = downloads[0]?.nb_hits || 1;
                    const pct = (d.nb_hits / maxDl) * 100;
                    const fileName = d.label.split("/").pop() || d.label;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 0", color: "#334155", position: "relative" }} title={d.label}>
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "#fef3c7", borderRadius: 3 }} />
                          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            {fileName}
                          </span>
                        </td>
                        <td style={{ padding: "8px 0", textAlign: "right", color: "#0a1628", fontWeight: 600 }}>{d.nb_hits}</td>
                        <td style={{ padding: "8px 0", textAlign: "right", color: "#64748b" }}>{d.nb_visits}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 13, padding: "16px 0", textAlign: "center" }}>
                No PDF downloads recorded yet
              </div>
            )}
          </div>

          {/* GA4 — Article Performance */}
          <div style={{
            background: "#fff", borderRadius: 12, padding: "24px",
            border: "1px solid #e2e0dc", marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: "linear-gradient(135deg, #4285f4, #ea4335, #fbbc04, #34a853)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff",
                }}>G</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#0a1628" }}>GA4 — Article Performance</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Last 30 days</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {ga4Loading && <span style={{ fontSize: 11, color: "#94a3b8" }}>loading...</span>}
                <button
                  onClick={fetchGA4}
                  style={{
                    padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e0dc",
                    background: "#fff", cursor: "pointer", fontSize: 12, color: "#64748b",
                  }}
                >↻</button>
                <a
                  href={GA4_EXT}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}
                >GA4 ↗</a>
              </div>
            </div>
            {ga4Error ? (
              <div style={{ color: "#dc2626", fontSize: 13, padding: "12px 0", textAlign: "center" }}>{ga4Error}</div>
            ) : (
              <>
                {ga4Summary && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                    <div style={{ background: "#f8f6f3", borderRadius: 8, padding: "12px 16px" }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Total Page Views</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#0a1628" }}>{ga4Summary.totalViews.toLocaleString()}</div>
                    </div>
                    <div style={{ background: "#f8f6f3", borderRadius: 8, padding: "12px 16px" }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Unique Users</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#0a1628" }}>{ga4Summary.totalUsers.toLocaleString()}</div>
                    </div>
                    <div style={{ background: "#f8f6f3", borderRadius: 8, padding: "12px 16px" }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Avg Session</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#0a1628" }}>{fmtTime(ga4Summary.avgEngagement)}</div>
                    </div>
                  </div>
                )}
                {ga4Articles.length > 0 ? (
                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e2e0dc" }}>
                        <th style={{ textAlign: "left", padding: "6px 0", color: "#64748b", fontWeight: 500 }}>Article</th>
                        <th style={{ textAlign: "right", padding: "6px 0", color: "#64748b", fontWeight: 500, width: 60 }}>Views</th>
                        <th style={{ textAlign: "right", padding: "6px 0", color: "#64748b", fontWeight: 500, width: 60 }}>Users</th>
                        <th style={{ textAlign: "right", padding: "6px 0", color: "#64748b", fontWeight: 500, width: 80 }}>Eng. Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ga4Articles.map((a, i) => {
                        const maxV = ga4Articles[0]?.views || 1;
                        const pct = (a.views / maxV) * 100;
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px 0", color: "#334155", position: "relative", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.pagePath}>
                              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "#eff6ff", borderRadius: 3 }} />
                              <span style={{ position: "relative" }}>{a.pagePath.replace("/article/", "")}</span>
                            </td>
                            <td style={{ padding: "8px 0", textAlign: "right", color: "#0a1628", fontWeight: 600 }}>{a.views}</td>
                            <td style={{ padding: "8px 0", textAlign: "right", color: "#64748b" }}>{a.users}</td>
                            <td style={{ padding: "8px 0", textAlign: "right", color: "#64748b" }}>{fmtTime(a.engagementSec)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : !ga4Loading ? (
                  <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No GA4 data</div>
                ) : null}
              </>
            )}
          </div>

          {/* Bottom grid: Pages, Referrers, Countries */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Top Pages */}
            <div style={{
              background: "#fff", borderRadius: 12, padding: "24px",
              border: "1px solid #e2e0dc",
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0a1628", marginBottom: 12 }}>
                Top Pages
              </div>
              {pages.length > 0 ? (
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e2e0dc" }}>
                      <th style={{ textAlign: "left", padding: "6px 0", color: "#64748b", fontWeight: 500 }}>Page</th>
                      <th style={{ textAlign: "right", padding: "6px 0", color: "#64748b", fontWeight: 500 }}>Views</th>
                      <th style={{ textAlign: "right", padding: "6px 0", color: "#64748b", fontWeight: 500 }}>Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.slice(0, 10).map((p, i) => {
                      const maxPg = pages[0]?.nb_hits || 1;
                      const pct = (p.nb_hits / maxPg) * 100;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 0", color: "#334155", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", position: "relative" }} title={p.label}>
                            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "#f1f5f9", borderRadius: 3 }} />
                            <span style={{ position: "relative" }}>{p.label === "/" ? "/" : p.label}</span>
                          </td>
                          <td style={{ padding: "8px 0", textAlign: "right", color: "#0a1628", fontWeight: 600 }}>{p.nb_hits}</td>
                          <td style={{ padding: "8px 0", textAlign: "right", color: "#64748b" }}>{p.nb_visits}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>No page data yet</div>
              )}
            </div>

            {/* Referrers + Countries */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Referrers */}
              <div style={{
                background: "#fff", borderRadius: 12, padding: "24px",
                border: "1px solid #e2e0dc", flex: 1,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0a1628", marginBottom: 12 }}>
                  Traffic Sources
                </div>
                {referrers.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {referrers.slice(0, 8).map((r, i) => {
                      const maxRef = referrers[0]?.nb_visits || 1;
                      const pct = (r.nb_visits / maxRef) * 100;
                      return (
                        <div key={i} style={{ position: "relative", padding: "6px 10px", borderRadius: 6, overflow: "hidden" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "#f1f5f9", borderRadius: 6 }} />
                          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "#334155" }}>{r.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#0a1628" }}>{r.nb_visits}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0", textAlign: "center" }}>No referrer data yet</div>
                )}
              </div>

              {/* Countries */}
              <div style={{
                background: "#fff", borderRadius: 12, padding: "24px",
                border: "1px solid #e2e0dc", flex: 1,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0a1628", marginBottom: 12 }}>
                  Countries
                </div>
                {countries.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {countries.slice(0, 8).map((c, i) => {
                      const maxCo = countries[0]?.nb_visits || 1;
                      const pct = (c.nb_visits / maxCo) * 100;
                      return (
                        <div key={i} style={{ position: "relative", padding: "6px 10px", borderRadius: 6, overflow: "hidden" }}>
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "#f1f5f9", borderRadius: 6 }} />
                          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "#334155" }}>{c.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#0a1628" }}>{c.nb_visits}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0", textAlign: "center" }}>No country data yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

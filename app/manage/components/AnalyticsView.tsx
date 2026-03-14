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
  bounceRate: number;
};

type GA4Summary = {
  totalViews: number;
  totalUsers: number;
  newUsers: number;
  sessions: number;
  engagedSessions: number;
  engagementRate: number;
  bounceRate: number;
  avgSessionDuration: number;
  pagesPerSession: number;
  // Previous period for deltas
  prevViews: number;
  prevUsers: number;
  prevSessions: number;
  prevEngagementRate: number;
  // Key events
  events: Record<string, number>;
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

type ArticleMap = Record<string, { title: string; authors: string[] }>;

async function fetchArticleMap(): Promise<ArticleMap> {
  try {
    const res = await fetch("/api/local-admin/analytics-articles", {
      credentials: "same-origin",
    });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

function resolveArticleName(path: string, map: ArticleMap): { label: string; slug: string | null } {
  // Extract slug from paths like "/article/e2026018" or full URLs
  const m = path.match(/\/article\/([a-z0-9]+)/i);
  if (m) {
    const slug = m[1];
    const article = map[slug];
    if (article) {
      const shortTitle = article.title.length > 60 ? article.title.slice(0, 57) + "..." : article.title;
      return { label: shortTitle, slug };
    }
    return { label: slug, slug };
  }
  // Known pages
  const names: Record<string, string> = {
    "/": "Home",
    "/explore": "Explore Articles",
    "/about-journal": "About Journal",
    "/editorial-board": "Editorial Board",
    "/contact": "Contact",
    "/for-authors": "For Authors",
    "/submit": "Submit Manuscript",
    "/manage": "Admin Panel",
    "/signup": "Sign Up",
    "/login": "Login",
    "/privacy-policy": "Privacy Policy",
    "/terms-of-use": "Terms of Use",
    "/reviewers": "Reviewers",
    "/why-publish-with-us": "Why Publish",
  };
  const clean = path.replace(/^https?:\/\/americanimpactreview\.com/, "").replace(/\/$/, "") || "/";
  return { label: names[clean] || clean, slug: null };
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
    bounceRate: parseFloat(r.metricValues[3]?.value) || 0,
  }));
}

export default function AnalyticsView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

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
  const [articleMap, setArticleMap] = useState<ArticleMap>({});
  const [ga4Articles, setGa4Articles] = useState<GA4Row[]>([]);
  const [ga4Summary, setGa4Summary] = useState<GA4Summary | null>(null);
  const [ga4Loading, setGa4Loading] = useState(false);
  const [ga4Error, setGa4Error] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsText, setInsightsText] = useState<string | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const buildAnalyticsPrompt = useCallback(() => {
    const dateStr = period === "day"
      ? new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : period === "week"
      ? `${new Date(Date.now() - 6 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : `${new Date(Date.now() - 29 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    const matomoLines: string[] = [];
    if (summary) {
      matomoLines.push(`Visitors: ${summary.nb_uniq_visitors}, Visits: ${summary.nb_visits}, Page Views: ${summary.nb_actions}`);
      matomoLines.push(`Bounce Rate: ${summary.bounce_rate}, Avg Duration: ${fmtTime(summary.avg_time_on_site)}, Pages/Visit: ${summary.nb_actions_per_visit.toFixed(1)}`);
    }
    if (liveCount > 0) matomoLines.push(`Live now: ${liveCount} visitors`);
    if (devices.length > 0) matomoLines.push(`Devices: ${devices.map(d => `${d.label}: ${d.nb_visits}`).join(", ")}`);
    if (pages.length > 0) {
      matomoLines.push(`\nTop Pages:`);
      pages.slice(0, 15).forEach(p => {
        const { label } = resolveArticleName(p.label, articleMap);
        matomoLines.push(`  ${label} — ${p.nb_hits} views, ${p.nb_visits} visits`);
      });
    }
    if (referrers.length > 0) {
      matomoLines.push(`\nTraffic Sources:`);
      referrers.slice(0, 10).forEach(r => matomoLines.push(`  ${r.label}: ${r.nb_visits} visits`));
    }
    if (countries.length > 0) {
      matomoLines.push(`\nCountries:`);
      countries.slice(0, 10).forEach(c => matomoLines.push(`  ${c.label}: ${c.nb_visits} visits`));
    }
    if (keywords.length > 0) {
      matomoLines.push(`\nSearch Queries:`);
      keywords.slice(0, 10).forEach(kw => matomoLines.push(`  "${kw.label}": ${kw.nb_visits} visits`));
    }
    if (downloads.length > 0) {
      matomoLines.push(`\nPDF Downloads (${downloads.reduce((s, d) => s + d.nb_hits, 0)} total):`);
      downloads.slice(0, 10).forEach(d => {
        const { label } = resolveArticleName(d.label, articleMap);
        matomoLines.push(`  ${label} — ${d.nb_hits} downloads`);
      });
    }
    if (liveVisits.length > 0) {
      matomoLines.push(`\nRecent Visitors:`);
      liveVisits.slice(0, 10).forEach(v => {
        const lastPage = v.actionDetails?.filter(a => a.type === "action").pop();
        const pageName = lastPage?.url ? resolveArticleName(lastPage.url, articleMap).label : "—";
        const time = v.lastActionDateTime ? new Date(v.lastActionDateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
        const src = v.referrerTypeName === "Direct Entry" ? "Direct" : v.referrerName || v.referrerTypeName;
        matomoLines.push(`  ${time} ${v.country} → ${pageName} (${v.actions} pages, ${v.visitDurationPretty}) via ${src}`);
      });
    }

    const ga4Lines: string[] = [];
    if (ga4Summary) {
      ga4Lines.push(`Page Views: ${ga4Summary.totalViews.toLocaleString()} (prev 30d: ${ga4Summary.prevViews.toLocaleString()})`);
      ga4Lines.push(`Users: ${ga4Summary.totalUsers.toLocaleString()} (${ga4Summary.newUsers} new) (prev 30d: ${ga4Summary.prevUsers.toLocaleString()})`);
      ga4Lines.push(`Sessions: ${ga4Summary.sessions.toLocaleString()} (${ga4Summary.engagedSessions} engaged) (prev 30d: ${ga4Summary.prevSessions.toLocaleString()})`);
      ga4Lines.push(`Engagement Rate: ${(ga4Summary.engagementRate * 100).toFixed(1)}% (prev: ${(ga4Summary.prevEngagementRate * 100).toFixed(1)}%)`);
      ga4Lines.push(`Bounce Rate: ${(ga4Summary.bounceRate * 100).toFixed(1)}%`);
      ga4Lines.push(`Avg Session: ${fmtTime(ga4Summary.avgSessionDuration)}, Pages/Session: ${ga4Summary.pagesPerSession.toFixed(1)}`);
      if (Object.keys(ga4Summary.events).length > 0) {
        ga4Lines.push(`Key Events: ${Object.entries(ga4Summary.events).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
      }
    }
    if (ga4Articles.length > 0) {
      ga4Lines.push(`\nTop Articles (GA4, 30 days):`);
      ga4Articles.slice(0, 15).forEach(a => {
        const { label } = resolveArticleName(a.pagePath, articleMap);
        ga4Lines.push(`  ${label} — ${a.views} views, ${a.users} users, ${fmtTime(a.engagementSec)} eng, ${(a.bounceRate * 100).toFixed(0)}% bounce`);
      });
    }

    const chartLines: string[] = [];
    const days = Object.entries(dailyData)
      .map(([date, d]) => ({ date, visitors: Array.isArray(d) ? 0 : (d as Summary).nb_uniq_visitors || 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (days.length > 0) {
      chartLines.push(`Daily visitors (last 14 days): ${days.map(d => `${d.date.slice(5)}: ${d.visitors}`).join(", ")}`);
    }

    return `Вот данные аналитики сайта americanimpactreview.com за период: ${dateStr}

Это академический журнал (научные статьи). Дай детальное саммари и инсайты на русском языке:
1. Общая картина: трафик растёт или падает? Сравни с предыдущим периодом.
2. Самые важные наблюдения — что бросается в глаза?
3. Какие статьи привлекают больше всего внимания и почему?
4. Откуда приходят люди (источники, страны, поисковые запросы)?
5. Есть ли проблемы? (высокий bounce rate на конкретных страницах, мало engaged sessions, и т.д.)
6. Конкретные рекомендации — что можно сделать прямо сейчас чтобы улучшить показатели?

== MATOMO (${period === "day" ? "today" : period}) ==
${matomoLines.join("\n")}

== GA4 (last 30 days) ==
${ga4Lines.join("\n")}

${chartLines.length > 0 ? `== TRAFFIC TREND ==\n${chartLines.join("\n")}` : ""}`;
  }, [period, summary, liveCount, devices, pages, referrers, countries, keywords, downloads, liveVisits, ga4Summary, ga4Articles, articleMap, dailyData]);

  const getInsights = useCallback(async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    setInsightsText(null);
    try {
      const prompt = buildAnalyticsPrompt();
      const res = await fetch("/api/local-admin/analytics-insights", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyticsData: prompt }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const { insights } = await res.json();
      setInsightsText(insights);
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : "Failed");
    } finally {
      setInsightsLoading(false);
    }
  }, [buildAnalyticsPrompt]);

  const fetchGA4 = useCallback(async () => {
    setGa4Loading(true);
    setGa4Error(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch("/api/local-admin/analytics-ga4", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "dashboard" }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`GA4 ${res.status}`);
      const { articles, summary: sum, prev, engagement } = await res.json();

      // Parse article rows (now includes bounceRate)
      const rows = (articles?.rows || []).map((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
        pagePath: r.dimensionValues[0].value,
        views: parseInt(r.metricValues[0].value) || 0,
        users: parseInt(r.metricValues[1].value) || 0,
        engagementSec: Math.round(parseFloat(r.metricValues[2].value) || 0),
        bounceRate: parseFloat(r.metricValues[3].value) || 0,
      }));
      setGa4Articles(rows);

      // Parse summary totals
      const cur = sum?.rows?.[0]?.metricValues;
      const prv = prev?.rows?.[0]?.metricValues;
      if (cur) {
        const events: Record<string, number> = {};
        (engagement?.rows || []).forEach((r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
          events[r.dimensionValues[0].value] = parseInt(r.metricValues[0].value) || 0;
        });
        setGa4Summary({
          totalViews: parseInt(cur[0].value) || 0,
          totalUsers: parseInt(cur[1].value) || 0,
          newUsers: parseInt(cur[2].value) || 0,
          engagedSessions: parseInt(cur[3].value) || 0,
          sessions: parseInt(cur[4].value) || 0,
          engagementRate: parseFloat(cur[5].value) || 0,
          bounceRate: parseFloat(cur[6].value) || 0,
          avgSessionDuration: Math.round(parseFloat(cur[7].value) || 0),
          pagesPerSession: parseFloat(cur[8].value) || 0,
          prevViews: prv ? parseInt(prv[0].value) || 0 : 0,
          prevUsers: prv ? parseInt(prv[1].value) || 0 : 0,
          prevSessions: prv ? parseInt(prv[4].value) || 0 : 0,
          prevEngagementRate: prv ? parseFloat(prv[5].value) || 0 : 0,
          events,
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
    fetchArticleMap().then(setArticleMap);
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
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>americanimpactreview.com</p>
          </div>
        </div>
        {/* Date range display */}
        <div style={{
          padding: "8px 20px", borderRadius: 8,
          background: "#f8f6f3", border: "1px solid #e2e0dc",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a1628" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#0a1628" }}>
            {period === "day"
              ? new Date().toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })
              : period === "week"
              ? `${new Date(Date.now() - 6 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : `${new Date(Date.now() - 29 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "6px 14px", borderRadius: 6, fontSize: 13,
                fontWeight: period === p ? 700 : 500,
                border: period === p ? "2px solid #0a1628" : "1px solid #e2e0dc",
                cursor: "pointer",
                background: period === p ? "#0a1628" : "#fff",
                color: period === p ? "#fff" : "#334155",
                boxShadow: period === p ? "0 2px 8px rgba(10,22,40,0.25)" : "none",
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
          {/* AI Insights button */}
          <button
            onClick={getInsights}
            disabled={insightsLoading || (loading && !summary)}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: "none",
              backgroundColor: insightsLoading ? "#475569" : "#0a1628",
              color: "#ffffff",
              cursor: insightsLoading ? "wait" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 7,
              opacity: loading && !summary ? 0.4 : 1,
            }}
          >
            {insightsLoading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                <span style={{ color: "#ffffff" }}>Analyzing...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
                <span style={{ color: "#ffffff" }}>AI Insights</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Insights panel */}
      {(insightsText || insightsError || insightsLoading) && (
        <div style={{
          margin: "16px 24px 0", padding: "20px 24px", borderRadius: 12,
          background: insightsError ? "#fef2f2" : "#f0f9ff",
          border: `1px solid ${insightsError ? "#fecaca" : "#bae6fd"}`,
          position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: insightsText ? 12 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={insightsError ? "#dc2626" : "#0369a1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: insightsError ? "#dc2626" : "#0369a1" }}>
                {insightsLoading ? "Analyzing your data..." : insightsError ? "Error" : "AI Insights"}
              </span>
            </div>
            {!insightsLoading && (
              <button
                onClick={() => { setInsightsText(null); setInsightsError(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#94a3b8", fontSize: 18, lineHeight: 1 }}
              >×</button>
            )}
          </div>
          {insightsLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Claude is reading your analytics data...
            </div>
          )}
          {insightsError && (
            <div style={{ fontSize: 13, color: "#dc2626" }}>{insightsError}</div>
          )}
          {insightsText && (
            <div style={{ fontSize: 13, lineHeight: 1.7, color: "#1e293b", whiteSpace: "pre-wrap" }}>
              {insightsText}
            </div>
          )}
        </div>
      )}

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
              { label: "Unique Visitors", value: summary?.nb_uniq_visitors ?? 0, today: todaySummary?.nb_uniq_visitors ?? 0, tip: "Уникальные люди, зашедшие на сайт за выбранный период" },
              { label: "Total Visits", value: summary?.nb_visits ?? 0, today: todaySummary?.nb_visits ?? 0, tip: "Общее число визитов (один человек может зайти несколько раз)" },
              { label: "Page Views", value: summary?.nb_actions ?? 0, today: todaySummary?.nb_actions ?? 0, tip: "Сколько страниц было просмотрено всего" },
              { label: "Bounce Rate", value: summary?.bounce_rate ?? "0%", today: null, tip: "% визитов, где человек посмотрел только одну страницу и ушёл. Для академического журнала 50-70% — норма" },
            ].map((kpi) => (
              <div key={kpi.label} style={{
                background: "#fff", borderRadius: 12, padding: "20px 24px",
                border: "1px solid #e2e0dc", cursor: "help",
              }} title={kpi.tip}>
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
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 24px", border: "1px solid #e2e0dc", cursor: "help" }} title="Сколько в среднем человек проводит на сайте за один визит. 1-2 мин — хорошо для журнала">
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Avg. Visit Duration</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0a1628" }}>
                {fmtTime(summary?.avg_time_on_site ?? 0)}
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: "16px 24px", border: "1px solid #e2e0dc", cursor: "help" }} title="Сколько страниц в среднем смотрит один посетитель. 2+ = хорошо, значит люди изучают сайт">
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
                      {lastPage?.url ? (
                        <a
                          href={lastPage.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#1e3a5f", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none", fontWeight: 500 }}
                          title={lastPage.url}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                        >
                          {(() => { const r = resolveArticleName(lastPage.url, articleMap); return r.label; })()}
                        </a>
                      ) : (
                        <span style={{ color: "#94a3b8", flex: 1 }}>—</span>
                      )}
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
                    const { label: dlLabel, slug: dlSlug } = resolveArticleName(d.label, articleMap);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px 0", color: "#334155", position: "relative" }} title={d.label}>
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "#fef3c7", borderRadius: 3 }} />
                          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            {dlSlug ? (
                              <a href={`/article/${dlSlug}`} target="_blank" rel="noopener noreferrer"
                                style={{ color: "#1e3a5f", textDecoration: "none" }}
                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                              >{dlLabel}</a>
                            ) : fileName}
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

          {/* GA4 — Site Overview */}
          <div style={{
            background: "#fff", borderRadius: 12, padding: "24px",
            border: "1px solid #e2e0dc", marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: "linear-gradient(135deg, #4285f4, #ea4335, #fbbc04, #34a853)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#fff",
                }}>G</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#0a1628" }}>Google Analytics</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Last 30 days vs previous 30</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {ga4Loading && <span style={{ fontSize: 11, color: "#94a3b8" }}>loading...</span>}
                <button onClick={fetchGA4} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e0dc", background: "#fff", cursor: "pointer", fontSize: 12, color: "#64748b" }}>↻</button>
                <a href={GA4_EXT} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>GA4 ↗</a>
              </div>
            </div>
            {ga4Error ? (
              <div style={{ color: "#dc2626", fontSize: 13, padding: "12px 0", textAlign: "center" }}>{ga4Error}</div>
            ) : (
              <>
                {/* KPI Cards with deltas */}
                {ga4Summary && (() => {
                  const delta = (cur: number, prev: number) => prev > 0 ? ((cur - prev) / prev) * 100 : 0;
                  const deltaViews = delta(ga4Summary.totalViews, ga4Summary.prevViews);
                  const deltaUsers = delta(ga4Summary.totalUsers, ga4Summary.prevUsers);
                  const deltaSessions = delta(ga4Summary.sessions, ga4Summary.prevSessions);
                  const deltaEngRate = ga4Summary.engagementRate - ga4Summary.prevEngagementRate;
                  const DeltaBadge = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
                    const isUp = value > 0;
                    const isFlat = Math.abs(value) < 0.5;
                    return (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                        background: isFlat ? "#f1f5f9" : isUp ? "#dcfce7" : "#fef2f2",
                        color: isFlat ? "#64748b" : isUp ? "#16a34a" : "#dc2626",
                        display: "inline-flex", alignItems: "center", gap: 2,
                      }}>
                        {!isFlat && (isUp ? "↑" : "↓")}
                        {Math.abs(value).toFixed(1)}{suffix}
                      </span>
                    );
                  };
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
                      <div style={{ background: "#f8f6f3", borderRadius: 10, padding: "14px 16px", cursor: "help" }} title="Page Views — сколько раз загружались страницы сайта (один человек может сделать несколько просмотров)">
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Page Views</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ fontSize: 22, fontWeight: 700, color: "#0a1628" }}>{ga4Summary.totalViews.toLocaleString()}</span>
                          <DeltaBadge value={deltaViews} />
                        </div>
                      </div>
                      <div style={{ background: "#f8f6f3", borderRadius: 10, padding: "14px 16px", cursor: "help" }} title="Users — уникальные посетители за период. New = те, кто зашёл на сайт впервые">
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Users</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ fontSize: 22, fontWeight: 700, color: "#0a1628" }}>{ga4Summary.totalUsers.toLocaleString()}</span>
                          <DeltaBadge value={deltaUsers} />
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{ga4Summary.newUsers} new</div>
                      </div>
                      <div style={{ background: "#f8f6f3", borderRadius: 10, padding: "14px 16px", cursor: "help" }} title="Engagement Rate — % сессий, где пользователь провёл 10+ сек, или просмотрел 2+ страницы, или совершил конверсию. Выше = лучше. 50%+ это хорошо">
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Engagement Rate</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ fontSize: 22, fontWeight: 700, color: "#0a1628" }}>{(ga4Summary.engagementRate * 100).toFixed(1)}%</span>
                          <DeltaBadge value={deltaEngRate * 100} suffix="pp" />
                        </div>
                      </div>
                      <div style={{ background: "#f8f6f3", borderRadius: 10, padding: "14px 16px", cursor: "help" }} title="Sessions — общее число визитов. Engaged = сессии с активным взаимодействием (10+ сек на сайте, 2+ страницы, или конверсия)">
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Sessions</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{ fontSize: 22, fontWeight: 700, color: "#0a1628" }}>{ga4Summary.sessions.toLocaleString()}</span>
                          <DeltaBadge value={deltaSessions} />
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{ga4Summary.engagedSessions} engaged</div>
                      </div>
                      <div style={{ background: "#f8f6f3", borderRadius: 10, padding: "14px 16px", cursor: "help" }} title="Avg Session — средняя длительность визита. Pages/visit — сколько страниц в среднем смотрит один посетитель">
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 500 }}>Avg Session</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: "#0a1628" }}>{fmtTime(ga4Summary.avgSessionDuration)}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{ga4Summary.pagesPerSession.toFixed(1)} pages/visit</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Key Events */}
                {ga4Summary && Object.keys(ga4Summary.events).length > 0 && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                    {Object.entries(ga4Summary.events).map(([name, count]) => {
                      const icons: Record<string, string> = {
                        scroll: "↕", click: "👆", file_download: "📄", form_start: "📝", form_submit: "✅",
                      };
                      const tips: Record<string, string> = {
                        scroll: "Сколько раз пользователи прокрутили страницу до 90% — значит дочитали",
                        click: "Клики по внешним ссылкам",
                        file_download: "Скачивания PDF файлов",
                        form_start: "Начали заполнять форму (submit, contact и т.д.)",
                        form_submit: "Отправили форму",
                      };
                      return (
                        <div key={name} style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "6px 12px", borderRadius: 6,
                          border: "1px solid #e2e0dc", background: "#fafafa", cursor: "help",
                        }} title={tips[name] || name}>
                          <span style={{ fontSize: 14 }}>{icons[name] || "·"}</span>
                          <span style={{ fontSize: 12, color: "#64748b" }}>{name.replace(/_/g, " ")}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0a1628" }}>{count.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Article table */}
                {ga4Articles.length > 0 ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0a1628", marginBottom: 10 }}>Top Articles</div>
                    <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e2e0dc" }}>
                          <th style={{ textAlign: "left", padding: "6px 0", color: "#64748b", fontWeight: 500 }}>Article</th>
                          <th style={{ textAlign: "right", padding: "6px 0", color: "#64748b", fontWeight: 500, width: 60, cursor: "help" }} title="Сколько раз открыли эту страницу">Views</th>
                          <th style={{ textAlign: "right", padding: "6px 0", color: "#64748b", fontWeight: 500, width: 60, cursor: "help" }} title="Сколько уникальных людей открыли эту страницу">Users</th>
                          <th style={{ textAlign: "right", padding: "6px 0", color: "#64748b", fontWeight: 500, width: 80, cursor: "help" }} title="Суммарное время, проведённое всеми пользователями на этой странице">Eng. Time</th>
                          <th style={{ textAlign: "right", padding: "6px 0", color: "#64748b", fontWeight: 500, width: 70, cursor: "help" }} title="Bounce Rate — % посетителей, которые ушли с сайта после этой страницы, не перейдя никуда. Ниже = лучше. Для статей 60-70% это нормально">Bounce</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ga4Articles.map((a, i) => {
                          const maxV = ga4Articles[0]?.views || 1;
                          const pct = (a.views / maxV) * 100;
                          const { label, slug } = resolveArticleName(a.pagePath, articleMap);
                          const bounce = (a.bounceRate * 100).toFixed(0);
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "8px 0", color: "#334155", position: "relative", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={articleMap[slug || ""]?.title || a.pagePath}>
                                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "#eff6ff", borderRadius: 3 }} />
                                <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  {slug && <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{slug}</span>}
                                  <a
                                    href={`/article/${slug || a.pagePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: "#1e3a5f", textDecoration: "none", fontWeight: 500 }}
                                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                                  >
                                    {label}
                                  </a>
                                </span>
                              </td>
                              <td style={{ padding: "8px 0", textAlign: "right", color: "#0a1628", fontWeight: 600 }}>{a.views}</td>
                              <td style={{ padding: "8px 0", textAlign: "right", color: "#64748b" }}>{a.users}</td>
                              <td style={{ padding: "8px 0", textAlign: "right", color: "#64748b" }}>{fmtTime(a.engagementSec)}</td>
                              <td style={{ padding: "8px 0", textAlign: "right", color: parseFloat(bounce) > 70 ? "#dc2626" : "#64748b" }}>{bounce}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
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
                      const { label, slug } = resolveArticleName(p.label, articleMap);
                      const href = slug ? `/article/${slug}` : p.label === "/" ? "/" : p.label;
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "8px 0", color: "#334155", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", position: "relative" }} title={articleMap[slug || ""]?.title || p.label}>
                            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: "#f1f5f9", borderRadius: 3 }} />
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ position: "relative", color: "#1e3a5f", textDecoration: "none", fontWeight: 500 }}
                              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                            >
                              {label}
                            </a>
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

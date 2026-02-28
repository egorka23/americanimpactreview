import { useMemo, useState } from "react";

type Submission = {
  id: string;
  title: string;
  status: "published" | "accepted" | "under_review";
  date: string;
};

type KpiCard = {
  key: string;
  label: string;
  value: string;
  spark: number[];
};

type ChartPoint = { label: string; value: number };

type StatusSlice = {
  label: string;
  value: number;
  color: string;
};

const KPI_CARDS: KpiCard[] = [
  { key: "total", label: "Total Submissions", value: "12", spark: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8] },
  { key: "under_review", label: "Under Review", value: "0", spark: [1, 1, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0] },
  { key: "accepted", label: "Accepted", value: "0", spark: [0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0] },
  { key: "published", label: "Published", value: "12", spark: [1, 2, 2, 3, 4, 5, 6, 6, 7, 9, 10, 12] },
  { key: "pending_payments", label: "Pending Payments", value: "0", spark: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { key: "paid_revenue", label: "Paid Revenue", value: "$400.00", spark: [50, 120, 80, 180, 210, 250, 280, 320, 360, 380, 390, 400] },
  { key: "overdue_reviews", label: "Overdue Reviews", value: "3", spark: [1, 2, 1, 3, 2, 2, 3, 4, 3, 3, 2, 3] },
  { key: "active_reviewers", label: "Active Reviewers", value: "15", spark: [8, 9, 10, 11, 12, 12, 13, 14, 14, 15, 15, 15] },
];

const SUBMISSIONS: Submission[] = [
  {
    id: "s1",
    title: "Pricing Strategies and Consumer Price Sensitivity in E-Commerce: Evidence From U.S. Online Retailers, 2022-2025",
    status: "published",
    date: "2026-02-25",
  },
  {
    id: "s2",
    title: "Moisture as a Plasticity Switch in Blowouts: Glass-Transition Behavior, Viscoelastic Response, and Tension-Defined Shape",
    status: "published",
    date: "2026-02-22",
  },
  {
    id: "s3",
    title: "Customer Acquisition Cost Optimization: A Comparative Study of Paid Versus Organic Growth Strategies in Direct-to-Consumer Brands",
    status: "published",
    date: "2026-02-21",
  },
  {
    id: "s4",
    title: "Effects of Low-Level Laser Therapy on HSP70 Dynamics and Recovery Biomarkers in Elite Athletes: A Multi-Sport Longitudinal Investigation",
    status: "published",
    date: "2026-02-16",
  },
  {
    id: "s5",
    title: "Syndromic Analysis of the Comorbidity of Reading Disorders and Neurodevelopmental Disorders in Children with Preserved Intellectual Functioning",
    status: "published",
    date: "2026-02-15",
  },
];

const STATUS_PILLS: Record<Submission["status"], string> = {
  published: "air-pill air-pill--success",
  accepted: "air-pill air-pill--info",
  under_review: "air-pill air-pill--warning",
};

const TREND_POINTS: ChartPoint[] = [
  { label: "Jan 29", value: 3 },
  { label: "Jan 30", value: 5 },
  { label: "Jan 31", value: 4 },
  { label: "Feb 1", value: 6 },
  { label: "Feb 2", value: 8 },
  { label: "Feb 3", value: 7 },
  { label: "Feb 4", value: 10 },
  { label: "Feb 5", value: 9 },
  { label: "Feb 6", value: 12 },
  { label: "Feb 7", value: 11 },
  { label: "Feb 8", value: 13 },
  { label: "Feb 9", value: 12 },
  { label: "Feb 10", value: 14 },
  { label: "Feb 11", value: 13 },
  { label: "Feb 12", value: 16 },
  { label: "Feb 13", value: 14 },
  { label: "Feb 14", value: 18 },
  { label: "Feb 15", value: 16 },
  { label: "Feb 16", value: 20 },
  { label: "Feb 17", value: 19 },
  { label: "Feb 18", value: 22 },
  { label: "Feb 19", value: 20 },
  { label: "Feb 20", value: 25 },
  { label: "Feb 21", value: 24 },
  { label: "Feb 22", value: 26 },
  { label: "Feb 23", value: 25 },
  { label: "Feb 24", value: 28 },
  { label: "Feb 25", value: 30 },
  { label: "Feb 26", value: 29 },
  { label: "Feb 27", value: 31 },
];

const STATUS_DISTRIBUTION: StatusSlice[] = [
  { label: "Published", value: 12, color: "#16a34a" },
  { label: "Under review", value: 0, color: "#f59e0b" },
  { label: "Accepted", value: 0, color: "#3b82f6" },
];

const REVIEW_ACTIVITY = {
  assigned: 9,
  completed: 7,
  completionRate: 0.78,
  overdue: 3,
  overdueItems: [
    "AI Review: Cost Optimization — 4 days late",
    "HSP70 Recovery Study — 2 days late",
    "Pricing Strategies Paper — 1 day late",
  ],
};

const PAYMENTS = {
  paidRevenue: "$400.00",
  pending: 0,
  unpaid: 10,
  paidPct: 0.7,
};

const CHART_GRID = Array.from({ length: 6 }, (_, i) => i);

export default function DashboardView() {
  const [activeKpi, setActiveKpi] = useState<string>("total");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [trendHover, setTrendHover] = useState<number | null>(null);
  const [isLoading] = useState(false);

  const filteredSubmissions = useMemo(() => {
    const base = SUBMISSIONS.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));
    const byStatusFilter = statusFilter === "all" ? base : base.filter((s) => s.status === statusFilter);
    const byKpi = activeKpi === "total" ? byStatusFilter : byStatusFilter.filter((s) => s.status === activeKpi);
    const sorted = [...byKpi].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sortDir === "desc" ? db - da : da - db;
    });
    return sorted;
  }, [activeKpi, search, sortDir, statusFilter]);

  const sparkPath = (points: number[], height = 36) => {
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const step = 100 / (points.length - 1);
    return points
      .map((p, i) => {
        const x = i * step;
        const y = height - ((p - min) / range) * (height - 6) - 3;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const trendPath = () => {
    const values = TREND_POINTS.map((p) => p.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const width = 600;
    const height = 200;
    const step = width / (values.length - 1);
    const line = values
      .map((p, i) => {
        const x = i * step;
        const y = height - ((p - min) / range) * (height - 30) - 15;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
    return line;
  };

  const trendArea = () => `M0 200 ${trendPath()} L600 200 Z`;

  const totalStatus = STATUS_DISTRIBUTION.reduce((sum, s) => sum + s.value, 0) || 1;
  const publishedPct = STATUS_DISTRIBUTION[0].value / totalStatus;

  return (
    <div className="air-dashboard" data-testid="air-dashboard">
      <header className="air-dashboard__topbar">
        <div>
          <p className="air-breadcrumb">Editorial overview / Dashboard</p>
          <h2 className="air-title">Editorial Dashboard</h2>
        </div>
        <div className="air-topbar__actions">
          <label className="air-select">
            <span className="air-visually-hidden">Date range</span>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} aria-label="Select date range">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </label>
          <div className="air-search">
            <input
              type="search"
              placeholder="Search submissions by title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search submissions"
            />
          </div>
          <span className="air-chip" aria-live="polite">Last updated: Feb 27</span>
          <button className="air-icon-btn" aria-label="Notifications">
            <span className="air-dot" aria-hidden="true" />
            <span aria-hidden="true">🔔</span>
          </button>
        </div>
      </header>

      <section className="air-kpi-grid" aria-label="Key performance indicators">
        {isLoading
          ? Array.from({ length: 8 }).map((_, index) => (
            <div className="air-kpi air-kpi--skeleton" key={`skeleton-${index}`} aria-hidden="true">
              <div className="air-skeleton air-skeleton--title" />
              <div className="air-skeleton air-skeleton--value" />
              <div className="air-skeleton air-skeleton--spark" />
            </div>
          ))
          : KPI_CARDS.map((card) => (
            <button
              key={card.key}
              className={`air-kpi ${activeKpi === card.key ? "air-kpi--active" : ""}`}
              onClick={() => setActiveKpi(card.key)}
              aria-pressed={activeKpi === card.key}
            >
              <div className="air-kpi__header">
                <span>{card.label}</span>
                <span className="air-pill air-pill--live">Live</span>
              </div>
              <div className="air-kpi__value">{card.value}</div>
              <div className="air-kpi__footer">Click to filter</div>
              <svg className="air-spark" viewBox="0 0 100 36" aria-hidden="true">
                <path d={sparkPath(card.spark)} />
              </svg>
            </button>
          ))}
      </section>

      <section className="air-grid air-grid--charts" aria-label="Editorial analytics">
        <div className="air-card air-card--chart">
          <div className="air-card__header">
            <div>
              <h3>Submissions Trend</h3>
              <span>{dateRange}</span>
            </div>
            <span className="air-pill air-pill--info">Last 30 days</span>
          </div>
          <div
            className="air-chart-wrap"
            onMouseLeave={() => setTrendHover(null)}
            onMouseMove={(event) => {
              const bounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
              const x = event.clientX - bounds.left;
              const idx = Math.min(
                TREND_POINTS.length - 1,
                Math.max(0, Math.round((x / bounds.width) * (TREND_POINTS.length - 1)))
              );
              setTrendHover(idx);
            }}
          >
            <svg className="air-chart" viewBox="0 0 600 200" role="img" aria-label="Submissions trend chart">
              <defs>
                <linearGradient id="airTrend" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(37, 99, 235, 0.24)" />
                  <stop offset="100%" stopColor="rgba(37, 99, 235, 0)" />
                </linearGradient>
              </defs>
              {CHART_GRID.map((line) => (
                <line
                  key={line}
                  x1="0"
                  x2="600"
                  y1={30 + line * 28}
                  y2={30 + line * 28}
                  className="air-chart__grid"
                />
              ))}
              <path className="air-chart__area" d={trendArea()} fill="url(#airTrend)" />
              <path className="air-chart__line" d={trendPath()} />
              {trendHover !== null && (
                <g>
                  <circle
                    cx={(trendHover / (TREND_POINTS.length - 1)) * 600}
                    cy={200 - ((TREND_POINTS[trendHover].value - 3) / 28) * 170 - 15}
                    r="5"
                    className="air-chart__dot"
                  />
                </g>
              )}
            </svg>
            {trendHover !== null && (
              <div
                className="air-tooltip"
                style={{
                  left: `${(trendHover / (TREND_POINTS.length - 1)) * 100}%`,
                }}
              >
                <strong>{TREND_POINTS[trendHover].value} submissions</strong>
                <span>{TREND_POINTS[trendHover].label}</span>
              </div>
            )}
          </div>
        </div>
        <div className="air-card air-card--stacked">
          <div className="air-card__header">
            <h3>Status Distribution</h3>
            <span>Current</span>
          </div>
          <div className="air-donut">
            <div className="air-donut__chart">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="48" stroke="#e5e7eb" strokeWidth="16" fill="none" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  stroke={STATUS_DISTRIBUTION[0].color}
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${publishedPct * 300} ${300 - publishedPct * 300}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <div className="air-donut__label">
                <strong>12</strong>
                <span>Published</span>
              </div>
            </div>
            <div className="air-donut__legend">
              {STATUS_DISTRIBUTION.map((item) => (
                <div key={item.label}>
                  <span className="air-dot" style={{ background: item.color }} />
                  {item.label} ({item.value})
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="air-card">
          <div className="air-card__header">
            <h3>Review SLA</h3>
            <span>78% on time</span>
          </div>
          <div className="air-sla">
            <div className="air-sla__ring">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="48" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                <circle cx="60" cy="60" r="48" stroke="#2563eb" strokeWidth="12" fill="none" strokeDasharray="301" strokeDashoffset="66" strokeLinecap="round" />
              </svg>
              <div className="air-sla__value">78%</div>
            </div>
            <div className="air-sla__stats">
              <div><strong>{REVIEW_ACTIVITY.assigned}</strong><span>Assigned</span></div>
              <div><strong>{REVIEW_ACTIVITY.completed}</strong><span>Completed</span></div>
              <div><strong className="air-text-danger">{REVIEW_ACTIVITY.overdue}</strong><span>Overdue</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="air-grid air-grid--table" aria-label="Recent submissions">
        <div className="air-card air-card--table">
          <div className="air-card__header air-card__header--table">
            <div>
              <h3>Recent Submissions</h3>
              <span>Last 5</span>
            </div>
            <div className="air-table__filters">
              <label className="air-select">
                <span className="air-visually-hidden">Filter by status</span>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
                  <option value="all">Status: All</option>
                  <option value="published">Published</option>
                  <option value="accepted">Accepted</option>
                  <option value="under_review">Under review</option>
                </select>
              </label>
              <label className="air-select">
                <span className="air-visually-hidden">Filter by date</span>
                <select aria-label="Filter by date">
                  <option>Date: {dateRange}</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </label>
            </div>
          </div>
          <table className="air-table" role="table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <button
                    className="air-table__sort"
                    onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                    aria-label="Sort by date"
                  >
                    Date
                  </button>
                </th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4}>
                    <div className="air-table__skeleton">
                      <div className="air-skeleton air-skeleton--row" />
                      <div className="air-skeleton air-skeleton--row" />
                      <div className="air-skeleton air-skeleton--row" />
                    </div>
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="air-empty">
                    No submissions match your filters.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((row) => (
                  <tr key={row.id}>
                    <td title={row.title}>
                      <span className="air-truncate">{row.title}</span>
                    </td>
                    <td>
                      <span className={STATUS_PILLS[row.status]}>{row.status.replace("_", " ")}</span>
                    </td>
                    <td>{new Date(row.date).toLocaleDateString("en-US")}</td>
                    <td>
                      <div className="air-actions">
                        <button aria-label={`View ${row.title}`}>View</button>
                        <button aria-label={`Open ${row.title}`}>Open</button>
                        <button aria-label={`Copy link for ${row.title}`}>Copy link</button>
                        <button aria-label={`More actions for ${row.title}`}>⋮</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="air-panel-stack">
          <div className="air-card">
            <div className="air-card__header">
              <h3>Review Activity</h3>
              <span>Pipeline</span>
            </div>
            <div className="air-progress" role="progressbar" aria-valuenow={Math.round(REVIEW_ACTIVITY.completionRate * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="air-progress__bar" style={{ width: `${Math.round(REVIEW_ACTIVITY.completionRate * 100)}%` }} />
            </div>
            <div className="air-metrics">
              <div>
                <strong>{REVIEW_ACTIVITY.assigned}</strong>
                <span>Assigned</span>
              </div>
              <div>
                <strong>{REVIEW_ACTIVITY.completed}</strong>
                <span>Completed</span>
              </div>
              <div>
                <strong className="air-text-danger">{REVIEW_ACTIVITY.overdue}</strong>
                <span>Overdue</span>
              </div>
            </div>
            {KPI_CARDS.find((card) => card.key === "under_review")?.value === "0" && (
              <div className="air-empty air-empty--compact">
                No submissions are currently under review. You are all caught up.
              </div>
            )}
            <div className="air-overdue">
              <p>Overdue items</p>
              <ul>
                {REVIEW_ACTIVITY.overdueItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="air-card">
            <div className="air-card__header">
              <h3>Payments</h3>
              <span>Finance</span>
            </div>
            <div className="air-metrics">
              <div>
                <strong>{PAYMENTS.paidRevenue}</strong>
                <span>Paid revenue</span>
              </div>
              <div>
                <strong>{PAYMENTS.pending}</strong>
                <span>Pending</span>
              </div>
              <div>
                <strong>{PAYMENTS.unpaid}</strong>
                <span>Unpaid / failed</span>
              </div>
            </div>
            <div className="air-mini-bars" aria-hidden="true">
              <span style={{ height: "60%" }} />
              <span style={{ height: "40%" }} />
              <span style={{ height: "70%" }} />
              <span style={{ height: "45%" }} />
              <span style={{ height: "65%" }} />
            </div>
            <div className="air-segment" aria-hidden="true">
              <span style={{ width: `${Math.round(PAYMENTS.paidPct * 100)}%` }} />
              <span style={{ width: `${Math.round((1 - PAYMENTS.paidPct) * 100)}%` }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

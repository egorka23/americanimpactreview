const STORAGE_KEY = "air_first_touch";

const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gad_source",
] as const;

export interface FirstTouch {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  gad_source?: string;
  landing_page: string;
  referrer: string;
  timestamp: string;
}

/** Capture first-touch attribution on first visit. Runs client-side only. */
export function captureFirstTouch(): void {
  if (typeof window === "undefined") return;

  // Already captured — don't overwrite
  if (localStorage.getItem(STORAGE_KEY)) return;

  const url = new URL(window.location.href);
  const data: FirstTouch = {
    landing_page: url.pathname + url.search,
    referrer: document.referrer || "(direct)",
    timestamp: new Date().toISOString(),
  };

  for (const param of UTM_PARAMS) {
    const val = url.searchParams.get(param);
    if (val) {
      (data as unknown as Record<string, string>)[param] = val;
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Read stored first-touch data (returns null if not yet captured). */
export function getFirstTouch(): FirstTouch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FirstTouch) : null;
  } catch {
    return null;
  }
}

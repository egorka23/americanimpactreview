interface Window {
  gtag?: (
    command: "event" | "config" | "consent" | "set" | "js",
    targetOrName: string | Date,
    params?: Record<string, unknown>
  ) => void;
  dataLayer?: unknown[];
}

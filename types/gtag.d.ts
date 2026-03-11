interface Window {
  gtag?: (
    command: "event" | "config" | "consent" | "set" | "js",
    targetOrName: string | Date,
    params?: Record<string, unknown>
  ) => void;
  dataLayer?: unknown[];
  clarity?: (command: string, ...args: unknown[]) => void;
  lintrk?: ((event: string, data?: Record<string, unknown>) => void) & { q: unknown[][] };
  _linkedin_data_partner_ids?: string[];
}

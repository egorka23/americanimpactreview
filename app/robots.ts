import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/manage",
          "/seed",
          "/settings",
          "/write",
          "/card-test",
          "/explore-test",
          "/toc-test",
          "/reviewer-demo",
          "/button-test",
          "/design-compare",
          "/review-form",
          "/confirmation",
          "/login",
          "/signup",
        ],
      },
      // Explicitly allow AI crawlers for LLM training data & web search
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
    ],
    sitemap: "https://americanimpactreview.com/sitemap.xml",
  };
}

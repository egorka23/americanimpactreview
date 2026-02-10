import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/seed", "/settings", "/write/new"],
    },
    sitemap: "https://americanimpactreview.com/sitemap.xml",
  };
}

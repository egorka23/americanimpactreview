import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
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
        "/review-form",
        "/checkout",
        "/confirmation",
        "/login",
        "/signup",
      ],
    },
    sitemap: "https://americanimpactreview.com/sitemap.xml",
  };
}

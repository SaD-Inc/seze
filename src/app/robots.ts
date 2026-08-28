import type { MetadataRoute } from "next";

import { siteConfig } from "~/lib/site";

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/game/", "/join/"];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: "OAI-SearchBot", allow: "/", disallow },
      { userAgent: "ChatGPT-User", allow: "/", disallow },
      { userAgent: "Claude-SearchBot", allow: "/", disallow },
      { userAgent: "Claude-User", allow: "/", disallow },
      { userAgent: "PerplexityBot", allow: "/", disallow },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}

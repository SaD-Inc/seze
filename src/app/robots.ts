import type { MetadataRoute } from "next";

import { siteConfig } from "~/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/rules"],
      disallow: ["/api/", "/game/", "/join/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}

import type { MetadataRoute } from "next";

import { siteConfig } from "~/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date("2026-08-27"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/rules`,
      lastModified: new Date("2026-08-27"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

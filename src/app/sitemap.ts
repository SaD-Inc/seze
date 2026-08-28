import type { MetadataRoute } from "next";

import { siteConfig } from "~/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(siteConfig.contentLastModified);

  return [
    {
      url: siteConfig.url,
      lastModified,
    },
    {
      url: `${siteConfig.url}/rules`,
      lastModified,
    },
    {
      url: `${siteConfig.url}/strategy`,
      lastModified,
    },
  ];
}

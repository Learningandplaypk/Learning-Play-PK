import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

const SITE = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
/**
 * WHAT IS BLOCKED FROM CRAWLING, and what deliberately is not.
 *
 * Disallow is for areas a crawler must never fetch (customer, checkout, API,
 * one-use review links). A page that is merely not worth indexing says so
 * itself with a `noindex` meta (lib/seo-policy.ts) and MUST stay fetchable:
 * a Disallow would stop the crawler from ever reading that directive, and a
 * URL that is blocked yet linked can still be indexed "without content".
 *
 * BUG-05 (2026-10-29): `/already-registered` was both disallowed here and
 * `noindex, nofollow` in the page — the conflict. The page is a public,
 * anonymous, static notice (owner wording, no query echo, no customer data; it
 * only ends the session), so the Disallow is removed and its noindex can be
 * read. Nothing else changes.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return { rules: { userAgent: "*", allow: "/", disallow: ["/account", "/checkout", "/api", "/review/"] }, sitemap: `${base}/sitemap.xml` };
}

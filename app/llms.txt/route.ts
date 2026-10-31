import { hub } from "@/lib/hub-api";
import { buildLlmsTxt } from "@/lib/llms-txt";

/**
 * GET /llms.txt (Master Plan PHASE 6 add-on; the rules are in lib/llms-txt.ts).
 *
 * Served as text/plain. The two Hub reads are the cached catalog reads the
 * sitemap uses (tag `catalog`, busted by the Hub on any collection change), so
 * the file follows the sitemap within a minute of a Hub edit. A failed read
 * costs that section only — the static pages are always listed — and the
 * route never answers an error page for a crawler that came for this file.
 *
 * The middleware never sees this path (its matcher skips paths with a file
 * extension), so no language cookie, redirect or locale rule applies.
 */
export const revalidate = 60;

export async function GET() {
  const [collections, categories] = await Promise.all([hub.collections().catch(() => []), hub.categories().catch(() => [])]);
  return new Response(buildLlmsTxt({ collections, categories }), {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=60, stale-while-revalidate=3600" },
  });
}

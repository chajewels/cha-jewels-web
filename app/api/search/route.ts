import { NextResponse } from "next/server";
import { asLang, DEFAULT_LANG } from "@/lib/i18n";
import { normalize, search, toSuggestion } from "@/lib/search";

/**
 * Suggestions for the header search box (components/site/search-box.tsx).
 *
 * `no-store`: this is typed at keystroke rate and the answer depends on a
 * catalog that changes under it. The expensive half — the index — is cached for
 * 60s inside lib/search.ts, so refusing to cache the response costs a scan of a
 * warm array, not a Hub round trip.
 *
 * The language is a parameter rather than a cookie read so the box can ask in
 * whatever language the page it is mounted on is rendering, without this route
 * having to resolve a session.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const lang = asLang(url.searchParams.get("lang")) ?? DEFAULT_LANG;
  const headers = { "cache-control": "no-store" };

  if (normalize(q).length < 1) {
    return NextResponse.json({ error: "q_required" }, { status: 400, headers });
  }

  const { products, total } = await search(q, lang);
  return NextResponse.json({ products: products.map((p) => toSuggestion(p, lang)), total }, { headers });
}

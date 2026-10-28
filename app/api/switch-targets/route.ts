import { NextResponse } from "next/server";
import { switchTargets } from "@/lib/locale-nav";

/**
 * GET /api/switch-targets?path=/en/faq — the language switcher's destinations
 * for a path, for the switcher after a client-side navigation
 * (components/site/use-switch-targets.ts explains why the layout's own answer
 * goes stale). The SAME rule the layout uses (lib/locale-nav.ts), so a link the
 * switcher shows can never differ from what a full page load would show.
 *
 * Read-only and anonymous: the answer depends on the path alone (and on which
 * languages a post exists in), never on the visitor, and `switchTargets`
 * refuses anything that is not a site path. Outside the middleware's matcher
 * (/api), so it never writes the language cookie either.
 */
export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path");
  try {
    return NextResponse.json(await switchTargets(path), { headers: { "Cache-Control": "private, max-age=60" } });
  } catch {
    // The switcher falls back to each language's home page on a failed answer.
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

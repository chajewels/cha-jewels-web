import { isSitePath, splitPath } from "@/lib/locale";
import { switchTargets } from "@/lib/locale-nav";

/**
 * GET /api/switch-targets?path=/en/faq — the language switcher's destinations
 * for a path, for the switcher after a client-side navigation
 * (components/site/use-switch-targets.ts explains why the layout's own answer
 * goes stale). The SAME rule the layout uses (lib/locale-nav.ts), so a link the
 * switcher shows can never differ from what a full page load would show.
 *
 * Read-only and anonymous: the answer depends on the path alone (and on which
 * languages a post exists in), never on the visitor — no cookie is read and
 * none is written (this route is outside the middleware's matcher, /api).
 *
 * THE INPUT IS A PATHNAME, NOTHING MORE (security review 2026-10-28): at most
 * MAX_PATH characters, a site path by `isSitePath` (no scheme, no `//host`, no
 * backslash, no control character, no empty segment), and any `?query` or
 * `#fragment` is dropped — the layout computes its answer from the bare
 * pathname too, so the two cannot disagree. Anything else is a 400. Every
 * answer is built by `switchTargets` from `localePath`/`siblingPath`, so it is
 * a same-site path, a language home, or null; never another host, never a
 * private route, never /ja/layaway.
 */
const MAX_PATH = 512;

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("path");
  if (raw === null || raw.length > MAX_PATH || !isSitePath(raw)) {
    return Response.json({ error: "bad_path" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    // Private for the browser's own cache only: the answer is the same for
    // everyone, but a shared cache must not hold it past a Hub content change.
    return Response.json(await switchTargets(splitPath(raw).path), { headers: { "Cache-Control": "private, max-age=60" } });
  } catch {
    // The switcher falls back to each language's home page on a failed answer.
    return Response.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

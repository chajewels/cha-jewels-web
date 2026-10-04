/**
 * Reading a CSP violation report (app/api/csp-report/route.ts) — pure, so it
 * can be unit-tested (tests/csp.test.mjs). Query strings and fragments are
 * dropped from every URL: a URL on this site can carry an order id or a
 * return path, and a log line must not.
 */
export const CSP_REPORT_MAX_BYTES = 16 * 1024;
/** At most this many lines per request — a reports+json batch can hold many. */
export const CSP_REPORT_MAX_LINES = 10;

export type CspViolation = { blocked: string; directive: string; document: string };

/** Origin + path of a URL, or a bare keyword ("inline", "eval", "self") as sent. Never a query or fragment. */
function noQuery(v: unknown): string {
  if (typeof v !== "string" || !v) return "-";
  try {
    const u = new URL(v);
    return `${u.origin}${u.pathname}`.slice(0, 200);
  } catch {
    return v.split(/[?#]/)[0].slice(0, 80);
  }
}

/** The document is always this site: its path only. */
function pathOnly(v: unknown): string {
  if (typeof v !== "string" || !v) return "-";
  try {
    return new URL(v).pathname.slice(0, 200);
  } catch {
    return v.split(/[?#]/)[0].slice(0, 200);
  }
}

export function readCspViolations(body: unknown): CspViolation[] {
  const out: CspViolation[] = [];
  if (Array.isArray(body)) {
    for (const r of body) {
      const b = r && typeof r === "object" ? (r as { type?: unknown; body?: Record<string, unknown> }) : null;
      if (!b || b.type !== "csp-violation" || !b.body || typeof b.body !== "object") continue;
      out.push({ blocked: noQuery(b.body.blockedURL), directive: String(b.body.effectiveDirective ?? b.body.violatedDirective ?? "-").slice(0, 60), document: pathOnly(b.body.documentURL) });
    }
  } else if (body && typeof body === "object" && "csp-report" in body) {
    const r = (body as { "csp-report"?: Record<string, unknown> })["csp-report"];
    if (r && typeof r === "object") {
      out.push({ blocked: noQuery(r["blocked-uri"]), directive: String(r["effective-directive"] ?? r["violated-directive"] ?? "-").slice(0, 60), document: pathOnly(r["document-uri"]) });
    }
  }
  return out;
}


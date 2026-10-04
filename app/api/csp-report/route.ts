/**
 * CSP VIOLATION REPORTS (owner 6A, SQ19, 2026-10-04; lib/csp.ts).
 *
 * Browsers POST here when a page's policy blocks (pay-card, enforced) or would
 * have blocked (every other page, report-only) something. Two body shapes:
 *   application/csp-report      { "csp-report": { "blocked-uri", "violated-directive", "document-uri", … } }
 *   application/reports+json    [ { type: "csp-violation", body: { blockedURL, effectiveDirective, documentURL, … } } ]
 *
 * One compact console.warn line per violation — blocked URI, directive and the
 * document's PATH only. Query strings are dropped everywhere: a URL on this
 * site can carry an order id or a return path, and a log line must not.
 * Nothing is stored. Bodies over 16 KB are refused (413); anything that is not
 * a report is answered 400. A good report is 204 with no body.
 */
import { CSP_REPORT_MAX_BYTES as MAX_BYTES, CSP_REPORT_MAX_LINES as MAX_LINES, readCspViolations } from "@/lib/csp-report";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BYTES) return new Response(null, { status: 413 });
  const type = (req.headers.get("content-type") ?? "").toLowerCase();
  if (!type.includes("application/csp-report") && !type.includes("application/reports+json") && !type.includes("application/json")) {
    return new Response(null, { status: 415 });
  }
  let text: string;
  try {
    text = await req.text();
  } catch {
    return new Response(null, { status: 400 });
  }
  // content-length can be absent (chunked): the size is checked on what arrived too.
  if (new TextEncoder().encode(text).length > MAX_BYTES) return new Response(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const violations = readCspViolations(body);
  if (!violations.length) return new Response(null, { status: 400 });
  for (const v of violations.slice(0, MAX_LINES)) {
    console.warn(`[csp] blocked=${v.blocked} directive=${v.directive} page=${v.document}`);
  }
  return new Response(null, { status: 204 });
}

import "server-only";

/**
 * WAS THIS CHECKOUT SESSION SIGNED?
 *
 * The layaway agreement is signed on a separate Firebase site, and the record
 * of it is a Google Sheet row plus a PDF — never a row in the Hub. So the
 * storefront cannot answer "did this customer sign?" from its own data, and it
 * must never take the browser's word for it. It asks the Apps Script that owns
 * the sheet, server to server, with a shared secret.
 *
 * ONE QUESTION, ONE ANSWER. The endpoint returns whether the session was
 * signed, at which agreement version, and when. It returns no name, no email,
 * no Facebook name, no country, no locale, no signature image and no PDF link.
 * Nothing here needs them, and an endpoint that cannot disclose them cannot
 * leak them.
 *
 * EVERY RESPONSE IS HTTP 200. Apps Script's ContentService cannot set a status
 * code, so the outcome is in the body and never in the status. That is why this
 * module keys on `ok` first and `signed` second, and why a 200 is not on its
 * own good news.
 *
 * THREE OUTCOMES, AND THE THIRD IS NOT THE SECOND:
 *   { ok: true, signed: true,  … }  the customer signed
 *   { ok: true, signed: false }     the customer did not sign
 *   { ok: false, reason }           WE DO NOT KNOW
 * The caller fails CLOSED on the third and says something different to the
 * customer, because "you have not signed yet" and "we could not check" need
 * different next steps. Collapsing them would turn a Sheets outage into an
 * accusation.
 *
 * The URL and the token are server-only env vars. They are read here, in a
 * module that cannot be imported from a client component, and neither value is
 * ever returned to a caller.
 */

export type AgreementStatus =
  | { ok: true; signed: true; version: string; signedAt: string }
  | { ok: true; signed: false }
  | { ok: false; reason: string };

/** The preview mode that fakes the whole Hub fakes this too — see below. */
const FIXTURES = process.env.NEXT_PUBLIC_PREVIEW_FIXTURES === "1";

/**
 * 15 s per attempt, at most two attempts.
 *
 * MEASURED, NOT GUESSED (2026-09-19). This started at 5 s and timed out in
 * production: Vercel logged "agreement lookup failed: TimeoutError" while Apps
 * Script's own Executions log showed the same doGet finishing in 1.2–1.8 s.
 * The difference is the transport — Apps Script answers `/exec` with a 302 to
 * script.googleusercontent.com, so one lookup is two TLS connections from
 * Vercel's region (hnd1) into Google, plus the script's own cold start — and
 * that regularly exceeded 5 s end to end. A budget the real path cannot meet
 * turns a signed customer into `agreement_unverified`, and that is the worse
 * outcome by far.
 *
 * Two attempts at 15 s: a cold start gets its second chance, and the worst case
 * for a genuinely unreachable script is ~30 s before a clear refusal. Accepted
 * (owner decision 2026-09-19): a slow answer beats a false "we could not check".
 * The house precedent is `AbortSignal.timeout(6000)` in hub-api.ts; this one is
 * looser because its destination is Apps Script behind a redirect, not the Hub.
 */
const TIMEOUT_MS = 15000;
const ATTEMPTS = 2;

/** A uuid, checked here so a malformed id never costs a round trip. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function agreementStatus(quoteId: string): Promise<AgreementStatus> {
  // Consistent with every other Hub call in this repo: the fixtures preview
  // fakes the backend wholesale, and a gate that refused everything there would
  // make the mode useless for reviewing layaway. NEXT_PUBLIC_PREVIEW_FIXTURES
  // is never set in production — see hub-api.ts, which branches the same way on
  // the same constant.
  if (FIXTURES) {
    return { ok: true, signed: true, version: "2026-v3", signedAt: new Date().toISOString() };
  }

  if (!UUID.test(quoteId)) return { ok: false, reason: "bad_quote_id" };

  const base = (process.env.AGREEMENT_LOOKUP_URL ?? "").trim();
  const token = (process.env.AGREEMENT_LOOKUP_TOKEN ?? "").trim();
  // Missing configuration is an error, never "not signed". A preview deploy
  // without the secrets refuses layaway rather than waving it through.
  if (!base || !token) return { ok: false, reason: "not_configured" };

  const url = new URL(base);
  url.searchParams.set("sig", "1");
  url.searchParams.set("session", quoteId);
  // Apps Script's doGet cannot read custom request headers, so the secret has
  // to be a query parameter. It travels server-to-server over HTTPS and is
  // never sent to a browser; it does appear in the Apps Script execution log,
  // which is why it is rotatable and read-only in what it unlocks.
  url.searchParams.set("token", token);

  let lastReason = "unreachable";

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: "GET",
        // Never cached. A stale "not signed" would block a customer who has
        // just signed, and a stale "signed" is worse than that.
        cache: "no-store",
        redirect: "follow", // Apps Script /exec answers via a 302 to googleusercontent
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      // A non-200 from Apps Script means the platform, not the answer — the
      // script itself always answers 200. Not retried: it is not transient.
      if (!res.ok) return { ok: false, reason: `http_${res.status}` };

      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; signed?: boolean; agreement_version?: unknown; signed_at?: unknown; error?: unknown }
        | null;

      if (!body || typeof body !== "object") return { ok: false, reason: "malformed" };
      if (body.ok !== true) {
        // unauthorized / not_configured / bad_request / lookup_failed — all
        // "we do not know", none of them "not signed".
        return { ok: false, reason: typeof body.error === "string" ? body.error : "lookup_failed" };
      }
      if (body.signed !== true) return { ok: true, signed: false };

      const version = typeof body.agreement_version === "string" ? body.agreement_version.trim() : "";
      const signedAt = typeof body.signed_at === "string" ? body.signed_at.trim() : "";
      // A row that says signed but carries no version or no timestamp cannot
      // satisfy what the plan has to record, and section 4 exists so that the
      // stored version is the one the customer actually signed. Half a record
      // is an error, not a pass — it must not become a NULL on the plan.
      if (!version || !signedAt) return { ok: false, reason: "incomplete_record" };

      return { ok: true, signed: true, version, signedAt };
    } catch (err) {
      // Timeout, DNS, TLS, socket. Transient by nature, so this is the only
      // case worth a second attempt — and an ok:false body above never is.
      lastReason = err instanceof Error && err.name ? err.name : "unreachable";
    }
  }

  return { ok: false, reason: lastReason };
}

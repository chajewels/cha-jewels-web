/**
 * WHAT A LOG LINE MAY SAY ABOUT AN ERROR (W-09, security batch 2, 2026-11-01).
 *
 * Logging the whole error object writes everything it carries into Vercel's
 * logs: a fetch failure's `cause` can hold the request URL, headers and socket
 * details, and a wrapped error can carry a body. On the card and checkout paths
 * that is customer and payment context in a log anyone with dashboard access
 * reads. So these paths log only the error's NAME and a short machine CODE
 * (`err.code` or `err.cause.code`, e.g. "UND_ERR_CONNECT_TIMEOUT"), never the
 * message, the stack or the object.
 *
 * Pure; unit-tested (tests/security-batch2.test.mjs).
 */
const CODE = /^[A-Za-z0-9_.:-]{1,64}$/;
const NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

function codeOf(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const c = (v as { code?: unknown }).code;
  return typeof c === "string" && CODE.test(c) ? c : typeof c === "number" && Number.isFinite(c) ? String(c) : null;
}

/** "TypeError UND_ERR_SOCKET", "TimeoutError", or "unknown" — never a message or an object. */
export function errorTag(err: unknown): string {
  const rawName = err instanceof Error ? err.name : typeof err === "object" && err !== null ? (err as { name?: unknown }).name : null;
  const name = typeof rawName === "string" && NAME.test(rawName) ? rawName : "unknown";
  const code = codeOf(err) ?? codeOf(err && typeof err === "object" ? (err as { cause?: unknown }).cause : null);
  return code ? `${name} ${code}` : name;
}

import { isIP } from "node:net";

/**
 * THE VISITOR'S IP, AS VERCEL SAW IT (W-06, security batch 2, 2026-11-01).
 *
 * The Hub limits the public forms (contact, newsletter, loyalty sign-up,
 * wholesale, reviews, receipt checks) per IP. Every one of those calls is made
 * by this server, so without the visitor's address the Hub sees Vercel's own
 * address and every visitor shares one budget — one abuser locks everyone out,
 * and a limit per visitor is impossible.
 *
 * Headers, in order — all three are set by Vercel's edge, which overwrites
 * whatever the client sent:
 *   1. `x-vercel-forwarded-for` — Vercel's own copy of the client address;
 *   2. `x-real-ip`;
 *   3. the FIRST entry of `x-forwarded-for`.
 *
 * Only a literal IPv4/IPv6 address is returned (node:net isIP); anything else —
 * a hostname, junk, an over-long value — is ignored and the next header is
 * tried. Nothing usable → undefined, and the caller sends no header at all
 * (never an empty one, never a guess).
 */
export type HeaderReader = { get(name: string): string | null };

const MAX_LEN = 64;

function literal(raw: string | null | undefined): string | undefined {
  const v = (raw ?? "").split(",")[0].trim();
  if (!v || v.length > MAX_LEN) return undefined;
  return isIP(v) ? v : undefined;
}

export function clientIp(headers: HeaderReader | null | undefined): string | undefined {
  if (!headers) return undefined;
  return literal(headers.get("x-vercel-forwarded-for"))
    ?? literal(headers.get("x-real-ip"))
    ?? literal(headers.get("x-forwarded-for"));
}

/** `{ "x-forwarded-for": ip }`, or no header at all when the address is unknown. */
export function forwardedFor(ip: string | null | undefined): Record<string, string> {
  return ip ? { "x-forwarded-for": ip } : {};
}

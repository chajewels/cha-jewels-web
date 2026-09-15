import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { combineChunks, stringFromBase64URL } from "@supabase/ssr";
import { hub } from "@/lib/hub-api";
import type { HubMe } from "@/lib/types";

/**
 * Who is signed in, read from the auth cookie WITHOUT touching Supabase Auth.
 *
 * The header renders on every page, so it must not pay a GoTrue round trip per
 * request — and it must never trigger a token refresh from a Server Component:
 * a layout cannot write cookies, so a refresh there would rotate the refresh
 * token server-side while the browser keeps the old one, and the customer's
 * next gated visit would fail as "already used". Reading the cookie is the only
 * safe move here. It decides what to RENDER (name or "Account"); the Hub still
 * validates the JWT on every customer call, and middleware still gates and
 * refreshes on /account and /checkout.
 *
 * An expired access token still counts as signed in: the refresh token behind
 * it is normally live and middleware refreshes it on the next gated page. The
 * header then shows the generic label (the Hub rejects the stale JWT) rather
 * than logging the customer out on a product page.
 */
export type CookieSession = { jwt: string; expired: boolean };

const PROJECT_REF = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname.split(".")[0] || null; } catch { return null; }
})();

export async function readSession(): Promise<CookieSession | null> {
  if (!PROJECT_REF) return null;
  try {
    const store = await cookies();
    const raw = await combineChunks(`sb-${PROJECT_REF}-auth-token`, (name) => store.get(name)?.value);
    if (!raw) return null;
    const json = raw.startsWith("base64-") ? stringFromBase64URL(raw.slice("base64-".length)) : raw;
    const session = JSON.parse(json) as { access_token?: string; expires_at?: number } | null;
    const jwt = session?.access_token;
    if (!jwt) return null;
    const expiresAt = Number(session?.expires_at ?? 0);
    return { jwt, expired: expiresAt > 0 && expiresAt * 1000 <= Date.now() };
  } catch {
    return null;
  }
}

/** One /me per request: the header and an account page share the result. */
export const hubMe = cache((jwt: string): Promise<HubMe> => hub.me(jwt));

/**
 * The customer's given name for the header. Filipino and Western names split
 * on the space; a Japanese name written without one is shown whole. Null when
 * the Hub has no name, is slow (the header waits at most `timeoutMs`) or the
 * token is stale — callers fall back to the generic label.
 */
export async function customerFirstName(session: CookieSession, timeoutMs = 1500): Promise<string | null> {
  if (session.expired) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), timeoutMs); });
  try {
    const me = await Promise.race([hubMe(session.jwt).catch(() => null), late]);
    return firstName(me?.customer.full_name);
  } finally {
    clearTimeout(timer);
  }
}

export function firstName(fullName: string | null | undefined): string | null {
  const first = (fullName ?? "").trim().split(/[\s　]+/)[0] ?? "";
  return first || null;
}

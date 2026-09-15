import { cookies, headers } from "next/headers";
import { LANG_COOKIE, resolveLang, type Lang } from "./i18n";

/**
 * Language for a server render: the visitor's explicit choice if they have made
 * one, otherwise what their browser asks for. Server-only.
 *
 * The middleware normally resolves this first and writes the cookie, so most
 * requests take the cookie path. The Accept-Language fallback here is not
 * redundant: the middleware's matcher is an allow-list, and a path it does not
 * match must still answer in the visitor's language rather than defaulting to
 * Japanese. Both callers share `resolveLang` so there is only one rule to
 * change.
 */
export async function getLang(): Promise<Lang> {
  const [c, h] = await Promise.all([cookies(), headers()]);
  return resolveLang(c.get(LANG_COOKIE)?.value, h.get("accept-language"));
}

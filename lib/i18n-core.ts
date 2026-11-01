/**
 * THE LANGUAGE RULES WITHOUT THE DICTIONARY (redesign/lumiere P2b, report §10:
 * "per-route dictionaries"). Everything a client component needs that is not
 * a string — the language type, the cookie, the header names, the resolution
 * rules — lives here, so importing it costs the bundle nothing. lib/i18n.ts
 * re-exports all of it beside `dict` and `tr` for the server; a client
 * component reads strings through lib/i18n-client.ts and the generated
 * lib/i18n/sections/*.ts it names.
 */
export type Lang = "ja" | "en";
export const LANG_COOKIE = "cj-lang";
export const DEFAULT_LANG: Lang = "ja";

/**
 * Query parameter that sets the language for a shareable link, e.g.
 * /layaway?lang=en. Honoured by the middleware, which treats it exactly like
 * pressing the toggle: it writes the cookie, so the choice sticks for the rest
 * of the visit. This is what makes an English link postable — the Filipino
 * customer base arrives from Facebook, and without it every such link lands on
 * Japanese and therefore on no layaway at all.
 */
export const LANG_PARAM = "lang";

/**
 * Request header the middleware uses to tell a server render which path it is.
 *
 * `generateMetadata` is handed params and searchParams but never the pathname,
 * and a layout's metadata is what every page inherits — so without this the
 * root layout cannot name the page it is describing. That is exactly how every
 * URL on the site came to declare rel=canonical pointing at the home page.
 */
export const PATH_HEADER = "x-cj-path";

/**
 * Request header that carries the URL's locale on /en/* and /ja/* routes
 * (Phase 2B, OD-15). MIDDLEWARE-OWNED: the middleware deletes any client-sent
 * value on every matched request and sets it only from the pathname, so a
 * render that sees it can trust it. On these routes the URL is the
 * authoritative display language; the cookie remains authority everywhere else.
 */
export const LANG_HEADER = "x-cj-lang";

/**
 * THE MIDDLEWARE'S WHOLE LANGUAGE DECISION, pure so tests can hold it still.
 *
 * Legacy paths (no locale prefix) reproduce the pre-2B behaviour exactly:
 * ?lang= wins for this request and is persisted; otherwise a first visit is
 * detected from Accept-Language and persisted; a returning cookie is left
 * alone. A locale path makes the URL authoritative: the request renders in the
 * URL's language whatever the cookie or ?lang= says, and the cookie is synced
 * to it when it differs (OD-15 cookie synchronisation).
 */
/**
 * THE LANGUAGE A LAYAWAY GATE JUDGES (OD-15, Phase 2C). A server action may be
 * handed the language of the page the customer was actually shown; a value that
 * is not exactly "en" or "ja" is ignored and the gate falls back to the
 * caller's own resolution (the cookie), which is the pre-2C behaviour. This is
 * NOT authentication and NOT payment authorization: the language was always
 * self-selected (the cookie is client state too); the gate only keeps the
 * refusal consistent with what the customer saw. An explicit "ja" still refuses
 * layaway — the strict direction never loosens.
 */
export function gateLang(explicit: unknown, fallback: Lang): Lang {
  return asLang(typeof explicit === "string" ? explicit : null) ?? fallback;
}

export function langDecision(input: {
  urlLocale: Lang | null;
  cookieLang: Lang | null;
  paramLang: Lang | null;
  acceptLanguage: string | null;
}): { lang: Lang; header: Lang | null; write: Lang | null } {
  const { urlLocale, cookieLang, paramLang, acceptLanguage } = input;
  if (urlLocale) {
    return { lang: urlLocale, header: urlLocale, write: urlLocale !== cookieLang ? urlLocale : null };
  }
  const decided = paramLang ?? (cookieLang ? null : detectLang(acceptLanguage));
  return { lang: decided ?? cookieLang ?? detectLang(acceptLanguage), header: null, write: decided };
}

/** A value we are willing to treat as a language choice. */
export function asLang(value: string | null | undefined): Lang | null {
  return value === "ja" || value === "en" ? value : null;
}

/**
 * WHICH LANGUAGE DOES THIS VISITOR GET? ONE RULE, ONE PLACE.
 *
 * Order of authority:
 *   1. An explicit choice — the `cj-lang` cookie, written by the toggle or by
 *      ?lang=. It always wins; detection never overrides a person.
 *   2. Accept-Language, on a FIRST visit only (owner decision 2026-09-15).
 *   3. DEFAULT_LANG (ja) when the browser expresses no preference at all.
 *
 * THE DETECTION RULE, stated so it can be argued with rather than reverse
 * engineered: Japanese only for a visitor who actually asks for Japanese.
 * A header that ranks Japanese above every other tag we understand gets `ja`;
 * anything else gets `en`, including languages we do not serve — someone whose
 * browser asks for `tl`, `fil`, `zh` or `de` reads neither of our two
 * languages natively, and English is the likelier second. No header at all
 * (most crawlers, some bots) falls through to DEFAULT_LANG.
 *
 * WHY THIS EXISTS: before it, `ja` was served to every first-time visitor
 * because nothing looked at the browser at all, so a Filipino customer
 * following a link landed on Japanese — and since 2026-09-15 that also means
 * landing on a site with no layaway. The default was working against the
 * customer base the feature is for.
 *
 * q-values are respected, so `en;q=0.9, ja;q=0.4` is an English reader who can
 * also read some Japanese, and gets English. `q=0` is an explicit refusal of
 * that language, and a bare `*` is "anything" — no preference, so DEFAULT_LANG.
 */
export function detectLang(acceptLanguage: string | null | undefined): Lang {
  if (!acceptLanguage || !acceptLanguage.trim()) return DEFAULT_LANG;

  let best: { lang: Lang; q: number } | null = null;
  for (const part of acceptLanguage.split(",")) {
    const [tagRaw, ...params] = part.trim().split(";");
    const tag = tagRaw.trim().toLowerCase();
    if (!tag) continue;

    // "*" is "any language is acceptable" — no preference at all, so it is not
    // evidence that the visitor cannot read Japanese. Treated as no signal.
    if (tag === "*") return DEFAULT_LANG;

    const lang: Lang | null = tag === "ja" || tag.startsWith("ja-")
      ? "ja"
      : tag === "en" || tag.startsWith("en-")
        ? "en"
        : null;
    if (!lang) continue;

    const qParam = params.map((s) => s.trim()).find((s) => s.startsWith("q="));
    const parsed = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
    const q = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 1;
    if (q <= 0) continue; // q=0 is an explicit refusal of that language.

    // Strictly greater, so the earliest tag wins a tie — the order the browser
    // sent is itself a preference.
    if (!best || q > best.q) best = { lang, q };
  }

  // A header that named languages but none of ours (tl, fil, zh, de …) reaches
  // here with best === null. That visitor is not a Japanese reader, so English.
  if (!best) return "en";
  return best.lang;
}

/** The whole resolution in one call: explicit choice, else detection. */
export function resolveLang(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Lang {
  return asLang(cookieValue) ?? detectLang(acceptLanguage);
}

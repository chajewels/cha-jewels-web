import { track } from "@vercel/analytics";
import { normalize } from "@/lib/search-normalize";
import type { SearchOrigin } from "@/lib/search-origin";
import { DEFAULT_LANG } from "@/lib/i18n";

/**
 * The single door to the analytics provider. Every call site goes through the
 * helpers here, so swapping Vercel for something else is one file.
 *
 * WHAT THIS MEASURES, AND WHAT IT DELIBERATELY DOES NOT
 * ----------------------------------------------------
 * The browser is only trusted for what the browser can actually see: a product
 * was looked at, and a cart addition resolved. It is NOT the source of truth for
 * orders or payments. A click on "pay" is not `create_web_order_atomic`
 * succeeding, and it is certainly not a CSR confirming a bank transfer days
 * later. Those come from the Hub — see docs/measurement-log.md.
 *
 * There is no per-visitor join between the two sides and none is implied: these
 * events carry no order reference, because a visitor browsing products does not
 * have one yet. The two sides are read as aggregates side by side.
 *
 * PROPERTY BUDGET — Vercel Pro allows TWO custom properties per event.
 * `product_view` and `add_to_cart` spend them on `sku` and `lang`; `search`
 * spends them on `q` (the normalized term, at most 64 characters) and
 * `results`; `hero_slide_cta` spends them on `slug` and `lang`;
 * `service_request` spends them on `kind` and `lang`. Adding a third
 * silently costs money (Web Analytics Plus), so it is an owner decision, not a
 * code decision — emit() drops any event that carries more than the ceiling
 * rather than let one slip through.
 */

/** Vercel Pro's ceiling. Exported so the guard below can be asserted in a test. */
export const MAX_EVENT_PROPERTIES = 2;

/** At most MAX_EVENT_PROPERTIES keys — emit() enforces it. */
type EventProps = Record<string, string | number>;

/**
 * Whether this browser should emit at all.
 *
 * Excluded, and each for its own reason:
 *  - anything that is not a Vercel *production* deployment (previews would
 *    pollute the baseline with our own clicks),
 *  - fixture mode, which renders invented products whose SKUs are not real,
 *  - localhost, which covers `next dev`, `next start` and any tunnel to it.
 *
 * Read at call time rather than module load: `window` does not exist while the
 * module is being evaluated on the server.
 */
export function analyticsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production") return false;
  if (process.env.NEXT_PUBLIC_PREVIEW_FIXTURES === "1") return false;
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".local")) return false;
  return true;
}

/**
 * How long to keep waiting for the analytics queue to exist before giving up on
 * an event. Generous, because the cost of waiting is nothing and the cost of
 * dropping is a hole in the baseline; short enough that a browser which blocks
 * the script entirely does not retry forever.
 */
const QUEUE_WAIT_MS = 10_000;
const QUEUE_POLL_MS = 50;

/**
 * Whether `track()` has anywhere to put an event yet.
 *
 * `@vercel/analytics`'s `track()` is `window.va?.call(window, "event", …)` — if
 * `window.va` is undefined the event is a SILENT NO-OP. It is not queued, not
 * retried and not logged. `window.va` is created by `initQueue()` inside
 * `inject()`, which runs in the `<Analytics/>` component's own effect, and from
 * that moment events buffer safely into `window.vaq` until the script loads.
 *
 * So the only hole is the window BEFORE that effect runs — and that hole is
 * exactly where a mount effect lands.
 */
const queueReady = () => typeof (window as unknown as { va?: unknown }).va === "function";

/**
 * Fire and forget. Analytics must never throw into a render, block an
 * interaction, or interrupt shopping, so every failure is swallowed here —
 * a missing script, a blocked request, an ad blocker, a provider outage.
 * There is no user-visible consequence of analytics failing, ever.
 *
 * `onSent` runs only when the event actually reached the queue. Nothing that
 * de-duplicates may record a send before this fires; see trackProductView.
 *
 * WHY THE WAIT EXISTS (found in production 2026-09-15). `add_to_cart` worked
 * and `product_view` never appeared once. The difference was never the event or
 * the SKU — it was WHEN each is called. `add_to_cart` fires from a click, long
 * after everything has mounted. `product_view` fires from a mount effect, and
 * on the product page that effect runs BEFORE the provider's, because
 * `<AnalyticsProvider/>` sat after `{children}` in the layout. Observed order of
 * `window.va` access on a real product page:
 *
 *     GET  <- track(), called by emit()      window.va undefined  -> dropped
 *     GET  <- Analytics.useEffect
 *     GET  <- initQueue() inside inject()
 *     SET  <- window.va finally defined
 *
 * The layout order is fixed too, so the common path needs no wait at all. This
 * wait is here so that a future layout edit, a slower hydration, or any other
 * re-ordering cannot quietly reopen the same hole — the failure mode is
 * invisible by construction, which is what let it ship.
 */
function emit(name: string, props: EventProps, onSent?: () => void): void {
  if (!analyticsEnabled()) return;
  if (Object.keys(props).length > MAX_EVENT_PROPERTIES) return; // Over budget: never sent, never billed.

  const send = () => {
    try {
      track(name, props);
      onSent?.();
    } catch {
      // Intentionally silent. See above.
    }
  };

  if (queueReady()) { send(); return; }

  const startedAt = Date.now();
  const retry = () => {
    if (queueReady()) { send(); return; }
    if (Date.now() - startedAt >= QUEUE_WAIT_MS) return; // Give up quietly.
    setTimeout(retry, QUEUE_POLL_MS);
  };
  setTimeout(retry, QUEUE_POLL_MS);
}

/**
 * Product views already counted in this JavaScript context.
 *
 * Module scope, not component state, so one entry survives everything that
 * would otherwise double-count: React re-renders, Strict Mode's deliberate
 * double-invocation of effects in development, a remount, client-side
 * navigation away and back, and the language toggle (which is a navigation to
 * the same path with `?lang=`, in the same document).
 *
 * Keyed on SKU ALONE, not SKU+lang, on purpose: a shopper toggling to English
 * has not viewed a second product, and counting them twice would inflate every
 * bilingual visitor. The trade is that `lang` records the language the piece
 * was FIRST seen in, which is the honest reading of "the language they browsed
 * in" anyway.
 *
 * A full page reload clears this, and that is correct — a fresh document is a
 * fresh view.
 */
const viewedSkus = new Set<string>();

/** Test seam. Not used by application code. */
export function __resetViewedForTest(): void {
  viewedSkus.clear();
  inFlight.clear();
}

/**
 * Product detail page, once per SKU per page-load session.
 *
 * THE SKU IS RECORDED ONLY ONCE THE EVENT HAS ACTUALLY BEEN SENT. It used to be
 * added before `emit()`, which meant a dropped event still consumed the SKU's
 * one slot: the first view was lost AND every later view of the same piece was
 * suppressed by the guard, with nothing anywhere to say so. The de-duplication
 * is still exactly one view per SKU per page-load session — it just can no
 * longer eat a view it failed to report.
 *
 * `inFlight` keeps that promise while an event is waiting for the queue: a
 * second mount in that gap (Strict Mode's double-invoked effect, a remount, the
 * language toggle) must not start a second send, and cannot be stopped by
 * `viewedSkus` yet because nothing has been sent.
 */
const inFlight = new Set<string>();

export function trackProductView(sku: string, lang: string): void {
  if (!sku) return;
  if (viewedSkus.has(sku) || inFlight.has(sku)) return;
  inFlight.add(sku);
  emit("product_view", { sku, lang }, () => {
    viewedSkus.add(sku);
    inFlight.delete(sku);
  });
}

/**
 * A cart addition that actually landed. Call this only after the server action
 * has resolved without throwing — never from the click handler itself, or the
 * number measures intent rather than additions.
 */
export function trackAddToCart(sku: string, lang: string): void {
  if (!sku) return;
  emit("add_to_cart", { sku, lang });
}

/**
 * A newsletter sign-up attempt and how it ended.
 *
 * `result` is the form's own state word — subscribed, already, invalid,
 * rate_limited, error — so the failures are countable too: a form that only
 * reports its successes cannot tell you it has stopped working. The email is
 * NEVER a property; it is the one thing about this event that identifies a
 * person, and the baseline does not need it to answer any question worth
 * asking.
 */
export function trackNewsletterSubscribe(result: string, lang: string): void {
  if (!result) return;
  emit("newsletter_subscribe", { result, lang });
}

/** Longest `q` the search event carries. Enough for any real query; short enough to keep property values small. */
export const SEARCH_QUERY_MAX = 64;

/**
 * A search that was actually run: the results page on load, and the header
 * combobox when Enter or "See all" submits the raw term. `q` is normalized the
 * same way lib/search matches it (NFKC, lower-case, spaces stripped, katakana
 * folded to hiragana) and cut to SEARCH_QUERY_MAX, so two spellings of one
 * query aggregate together and no property value can grow without bound.
 * `results` is the total the search returned for that term, not the number of
 * suggestions shown. Exactly two properties — see the budget above.
 */
/**
 * How the last recorded search was reached. Not a property of the event: the
 * budget above is two and `q` and `results` spend both, and a third is silently
 * billable. It is kept here so the distinction survives — promoting it to a
 * property is a one-line change the day an owner decides to pay for it, and
 * until then a debug session can still ask which path a search came in by.
 */
let lastOrigin: SearchOrigin | null = null;
export const lastSearchOrigin = (): SearchOrigin | null => lastOrigin;

/**
 * A search that was actually run. THE RESULTS PAGE IS THE ONLY CALLER — see
 * components/analytics/search-view.tsx, and the assertion in
 * scripts/check-analytics.mjs that keeps it that way.
 *
 * It used to be called from the header combobox as well, which meant a search
 * typed there was counted twice (once on submit, once when the page it
 * navigated to loaded) while a pasted /search link was counted once. The total
 * was therefore neither searches nor results-page views, and no amount of
 * reading it could tell you which. One emitter, one search, one event.
 *
 * `q` is normalized the same way lib/search matches it (NFKC, lower-case,
 * spaces stripped, katakana folded to hiragana) and cut to SEARCH_QUERY_MAX, so
 * two spellings of one query aggregate together and no property value can grow
 * without bound. `results` is the total the search returned for that term, not
 * the number of suggestions shown.
 */
export function trackSearch(q: string, results: number, origin: SearchOrigin = "direct"): void {
  const term = normalize(q).slice(0, SEARCH_QUERY_MAX);
  if (!term) return;
  lastOrigin = origin;
  emit("search", { q: term, results: Math.max(0, Math.floor(Number.isFinite(results) ? results : 0)) });
}

/**
 * A hero slide's button was pressed, named by the category it leads to.
 *
 * This is the deck's own measure: which category earns the click, and in which
 * language. Paired with the category page's own traffic it answers whether a
 * slide is doing work or just occupying the fold — which is the question that
 * decides a category's sort_order in the Hub.
 *
 * `lang` is read from the document rather than passed in. The language is
 * already on <html lang>, set by the same server render that chose the slide's
 * copy, so taking it from there cannot disagree with the words the visitor
 * actually clicked; threading it through the component would add a second
 * source for the same fact. Falls back to the site default before hydration or
 * if the attribute is ever missing.
 *
 * Fired on the click itself, not on the navigation that follows: the click is
 * the intent, and a slow route change must not decide whether it was counted.
 */
export function trackHeroSlideCta(slug: string): void {
  if (!slug) return;
  const lang = (typeof document !== "undefined" && document.documentElement.lang) || DEFAULT_LANG;
  emit("hero_slide_cta", { slug, lang });
}

/**
 * A contact-form submission and how it ended.
 *
 * Same shape and same reasoning as trackNewsletterSubscribe: `result` is the
 * form's own state word — sent, invalid, rate_limited, error — so the failures
 * are countable too, because a form that only reports its successes cannot
 * tell you it has stopped working.
 *
 * NOTHING THE PERSON TYPED IS A PROPERTY. Not the name, not the address, not a
 * word of the message. The baseline needs none of it to answer whether the
 * form works, and a contact form is the one place on the site where a visitor
 * hands over a sentence meant for a human rather than a database.
 *
 * `lang` is read from the document rather than passed in, like
 * trackHeroSlideCta: it is already on <html lang>, set by the same render that
 * chose the form's labels. Two properties: the budget, spent.
 */
export function trackContactSubmit(result: string): void {
  if (!result) return;
  const lang = (typeof document !== "undefined" && document.documentElement.lang) || DEFAULT_LANG;
  emit("contact_submit", { result, lang });
}

/**
 * A service request that actually landed. Called after the Server Action has
 * resolved ok — never from the click, or the number measures intent rather
 * than requests, the same rule as trackAddToCart. `kind` is one of the five
 * request kinds (resize, cleaning, repair, appraisal, other); `lang` is the
 * language the form was filled in. Two properties: the budget, spent.
 */
export function trackServiceRequest(kind: string, lang: string): void {
  if (!kind) return;
  emit("service_request", { kind, lang });
}

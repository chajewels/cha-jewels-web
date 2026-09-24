import "server-only";
import type { Category, CheckoutMode, Collection, FxRate, HubAddress, HubCustomer, HubLayawayDetail, HubLayawayPayResult, HubLayawayPlan, HubMe, HubOrder, HubOrderDetail, HubPayResult, HubProfileInput, HubQuote, HubTier, LayawayQuote, OrderType, Product, ServiceRequest, ServiceRequestInput, SettlementCurrency, SiteSettings, HubFaqSection, HubPost, PostType, Testimonial, ContactResult } from "@/lib/types";
import * as fx from "@/lib/fixtures";
import type { NewsletterSubscribeResult, NewsletterUnsubscribeResult } from "@/lib/types";

/**
 * The website's only door into Cha Jewels Hub.
 * Every call goes to edge functions owned by Lovable (spec: supabase/contracts/api.md).
 * No table names, no RLS assumptions, no service role key on this side.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CHROME DEGRADES, CONTENT THROWS.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every read here throws on a network failure or a non-2xx — none of them
 * returns `[]` on its own. What a failure MEANS is decided at the call site,
 * and there are exactly two answers:
 *
 *   CONTENT THROWS. A page whose substance comes from the Hub — /blog,
 *   /blog/[slug], /faq, /contact's ways-to-reach-us panel, the homepage's
 *   testimonials — lets the error out.
 *
 *   CHROME DEGRADES. The furniture wrapped around every page — the header's
 *   menus, the footer's collection list, tagline and social row, the
 *   announcement strip — catches and omits the part it could not load.
 *
 * WHY CONTENT THROWS, because this reads like the less robust choice and is the
 * opposite:
 *
 *   These pages are CACHED. A read that swallows its failure returns an empty
 *   list, the page renders successfully with nothing in it, and Next caches
 *   THAT — a blank FAQ, a blog with no posts — and serves it for the next hour
 *   to everyone, long after the Hub came back. One five-second blip during one
 *   revalidation is enough. A throw produces no page, so there is nothing to
 *   cache: Next keeps serving the last render that succeeded, which is the real
 *   FAQ with all thirty-nine answers in it. The outage costs freshness, not
 *   content. It is also the only version that is VISIBLE — an empty section
 *   looks like an owner who has not written anything yet; a 500 and a failed
 *   build look like what they are.
 *
 * WHY CHROME DOES NOT: the footer and the announcement bar are on /about and on
 * the four legal documents, none of which contains a word that came from the
 * Hub. Throwing there took down pages that had nothing to do with the outage,
 * to protect content they do not have. A blank FAQ is a lie about the FAQ; a
 * footer missing its collection links is a footer missing its collection links.
 *
 * The line between the two is not "which function" but "would a reader notice
 * something MISSING, or something WRONG?" — so the same getter is caught in the
 * footer and uncaught on /contact, where it is the page.
 *
 * AN EMPTY 200 IS STILL EMPTY. A Hub that answers with no rows means there are
 * no rows, and the callers render nothing: no posts, no FAQ section, no social
 * row, no testimonials block. "Nothing published" and "cannot reach the Hub"
 * are different states and must not share an outcome.
 *
 * CUSTOMER READS are their own case and always catch: a 404 there is an
 * ordinary answer, not a failure.
 *
 * FIXTURES MODE IS UNAFFECTED. `NEXT_PUBLIC_PREVIEW_FIXTURES=1` never reaches
 * the network, so there is nothing to throw.
 */
const FIXTURES = process.env.NEXT_PUBLIC_PREVIEW_FIXTURES === "1";
const BASE = (process.env.HUB_API_URL ?? "").replace(/\/$/, "");
const KEY = process.env.HUB_API_KEY ?? "";

/**
 * `code` is the Hub's machine-readable error string (e.g. "transfer_unavailable"),
 * when it sent one. `requestId` is the Hub's x-request-id for that call: shown
 * to the shopper as "Ref: …" so a failure on screen can be matched to the one
 * Hub log line that names its cause.
 */
export class HubError extends Error {
  constructor(public status: number, message: string, public code: string | null = null, public requestId: string | null = null) { super(message); }
}

/**
 * How long a SECONDARY read may take before it is treated as unavailable.
 *
 * A streamed homepage section that never resolves is a section that never
 * arrives and a response that never finishes. Three seconds is well past any
 * healthy Hub response and well short of a reader's patience. It applies only
 * where a caller asks for it (`timeout: SECONDARY_TIMEOUT_MS`), so a checkout
 * or a customer read is never cut short mid-write.
 */
export const SECONDARY_TIMEOUT_MS = 3000;

async function call<T>(path: string, init: RequestInit & { revalidate?: number | false; tags?: string[]; jwt?: string; timeout?: number } = {}): Promise<T> {
  if (!BASE || !KEY) throw new HubError(500, "HUB_API_URL / HUB_API_KEY not configured");
  const { revalidate = 60, tags = ["catalog"], jwt, timeout, ...rest } = init;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    // A timeout is an ABORT, which rejects — so it lands on whatever the
    // caller does with a failure, which for a homepage section is "no section"
    // and for page content is still a throw. Same rule either way.
    ...(timeout ? { signal: AbortSignal.timeout(timeout) } : {}),
    headers: {
      "content-type": "application/json",
      "x-api-key": KEY,
      // Customer routes need BOTH the server key and the customer's JWT.
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      ...(rest.headers ?? {}),
    },
    next: revalidate === false ? undefined : { revalidate, tags },
    cache: revalidate === false ? "no-store" : undefined,
  });
  if (res.status === 404) throw new HubError(404, "Not found");
  if (!res.ok) {
    // Read the body's error code so callers can tell one 409 from another.
    // A body that is missing or not JSON is normal for gateway-level failures.
    const body = await res.clone().json().then((b) => (b && typeof b === "object" ? b : null), () => null);
    const code = typeof body?.error === "string" ? body.error : null;
    const requestId = (typeof body?.request_id === "string" && body.request_id) || res.headers.get("x-request-id") || null;
    throw new HubError(res.status, `Hub API ${res.status} on ${path}${code ? ` (${code})` : ""}${requestId ? ` ref ${requestId}` : ""}`, code, requestId);
  }
  return res.json() as Promise<T>;
}
const notFoundToNull = async <T>(p: Promise<T>): Promise<T | null> => { try { return await p; } catch (e) { if (e instanceof HubError && e.status === 404) return null; throw e; } };

export const hub = {
  /**
   * Merchandising categories, in the Hub's sort_order. The homepage hero and
   * /categories are both built from this, so the deck's contents and its order
   * are an owner decision made in the Hub rather than a list in this repo.
   */
  categories: (): Promise<Category[]> =>
    FIXTURES
      ? Promise.resolve([...fx.categories].sort((a, b) => a.sort_order - b.sort_order))
      : call("/catalog/categories"),
  /** One category and the pieces in it. 404 → null, like collection(). */
  category: (slug: string): Promise<(Category & { products: Product[] }) | null> =>
    FIXTURES
      ? Promise.resolve((() => {
          const c = fx.categories.find((x) => x.slug === slug);
          return c ? { ...c, products: fx.products.filter((p) => (p.category_slugs ?? []).includes(slug)) } : null;
        })())
      : notFoundToNull(call(`/catalog/categories/${encodeURIComponent(slug)}`)),
  collections: (): Promise<Collection[]> => FIXTURES ? Promise.resolve(fx.collections) : call("/catalog/collections"),
  collection: (slug: string): Promise<(Collection & { products: Product[] }) | null> =>
    FIXTURES ? Promise.resolve((() => { const c = fx.collections.find((x) => x.slug === slug); return c ? { ...c, products: fx.products.filter((p) => p.col === slug) } : null; })())
             : notFoundToNull(call(`/catalog/collections/${encodeURIComponent(slug)}`)),
  product: (slug: string): Promise<Product | null> =>
    FIXTURES ? Promise.resolve(fx.products.find((p) => p.slug === slug) ?? null) : notFoundToNull(call(`/catalog/products/${encodeURIComponent(slug)}`)),
  featured: (limit = 8): Promise<Product[]> => FIXTURES ? Promise.resolve(fx.products.slice(0, limit)) : call(`/catalog/products?featured=1&limit=${limit}`, { timeout: SECONDARY_TIMEOUT_MS }),
  /**
   * The whole active catalog, for the storefront's own search index
   * (lib/search.ts). The Hub's /catalog/products has no `q` parameter, so
   * matching is done on this side against a cached copy of the catalog rather
   * than per keystroke against the Hub. Cached like every other catalog read:
   * 60s, tag "catalog", so the Hub's notify_website webhook busts it too.
   */
  allProducts: (limit = 5000): Promise<Product[]> =>
    FIXTURES ? Promise.resolve(fx.products) : call(`/catalog/products?limit=${limit}`),
  productSlugs: (): Promise<{ slug: string; updated_at: string }[]> => FIXTURES ? Promise.resolve(fx.products.map((p) => ({ slug: p.slug, updated_at: "2026-09-01" }))) : call("/catalog/products?fields=slug,updated_at&limit=5000"),
  /** Quote is always computed in JPY by the Hub. Peso display uses hub.fx(). */
  layawayQuote: (price: number, term_months: number): Promise<LayawayQuote> =>
    FIXTURES ? Promise.resolve(fx.quote(price, term_months, "JPY")) : call("/layaway/quote", { method: "POST", body: JSON.stringify({ price, term_months, currency: "JPY" }), revalidate: false }),
  /**
   * Published testimonials.
   *
   * THROWS, since 2026-09-22. It used to swallow every failure so the homepage
   * could fall back to three illustrative placeholder cards — and those cards
   * are gone, so swallowing now means caching a homepage with no testimonials
   * section on it. Zero published rows still renders nothing; that is the
   * empty-200 case and it is not an error.
   */
  testimonials: (): Promise<Testimonial[]> =>
    FIXTURES ? Promise.resolve([]) : call("/testimonials", { tags: ["content"], timeout: SECONDARY_TIMEOUT_MS }),
  /**
   * The owner-editable strings and links for this site (lib/settings.ts reads
   * them by key). A flat map, so a key either side has not learned yet is
   * absent rather than an error.
   *
   * Cached on tag "content", NOT "catalog": a product change and a settings
   * change are different events and must not bust each other's cache. The 60s
   * revalidate is a BACKSTOP — the Hub busts the tag through /api/revalidate
   * when the owner saves, and this is only what happens if that POST is lost.
   *
   * THROWS like any other call. It has to: lib/settings.ts is the one place
   * that decides what a failure means, and a `catch { return {} }` here would
   * make "the Hub is down" indistinguishable from "the Hub has no settings".
   */
  settings: (): Promise<SiteSettings> =>
    FIXTURES ? Promise.resolve(fx.settingsFixture) : call("/content/settings", { tags: ["content"] }),

  /**
   * Editorial posts, newest first. `type` narrows to one kind; omitted, both
   * come back, because /blog lists them together.
   *
   * Tag "content", like the settings: an owner publishing a post and an owner
   * editing the footer are the same kind of event, and the Hub busts them with
   * the same POST. The 60s revalidate is the backstop under it.
   *
   * THROWS. lib/posts.ts is the one place that decides what a Hub failure
   * means, and it means the static posts still render.
   */
  posts: (type?: PostType): Promise<HubPost[]> =>
    FIXTURES
      ? Promise.resolve(type ? fx.postsFixture.filter((p) => p.type === type) : fx.postsFixture)
      : call(`/content/posts${type ? `?type=${encodeURIComponent(type)}` : ""}`, { tags: ["content"] }),
  /** One post. 404 → null, like collection() — an unknown slug is not an error. */
  post: (slug: string): Promise<HubPost | null> =>
    FIXTURES
      ? Promise.resolve(fx.postsFixture.find((p) => p.slug === slug) ?? null)
      : notFoundToNull(call(`/content/posts/${encodeURIComponent(slug)}`, { tags: ["content"] })),

  /**
   * The FAQ, sections in order with their questions inside them.
   *
   * Tag "content", with the posts and the settings: they are one editorial
   * surface as far as an owner is concerned, and the Hub busts them together.
   *
   * THROWS, like the other two. lib/faq.ts is the one place that decides what a
   * Hub failure means, and it means the answers this repo already holds.
   */
  faq: (): Promise<HubFaqSection[]> =>
    FIXTURES ? Promise.resolve(fx.faqFixture()) : call("/content/faq", { tags: ["content"] }),

  /**
   * Newsletter sign-up. x-api-key only — there is no customer auth here, so a
   * signed-out visitor can subscribe from the footer. `already_subscribed` is
   * a SUCCESS, not an error: re-submitting an address must not tell a stranger
   * whether it is already on the list, and must not read as a failure to the
   * person who simply forgot.
   *
   * `revalidate: false` because this is a write; nothing about it is cacheable.
   */
  /**
   * A contact-form message. x-api-key only: a signed-out visitor is exactly
   * who this form is for, so there is no customer auth on it.
   *
   * `page` is the path the message was sent from, so a reply can see what the
   * person was looking at. `newsletter` is the opt-in checkbox, passed through
   * for the Hub to act on — this side never subscribes anyone itself, because
   * one message must not become two writes that can half-fail.
   *
   * `revalidate: false` because this is a write; nothing about it is cacheable.
   */
  contact: (body: {
    full_name: string; email: string; phone?: string; message: string;
    lang?: string; page?: string; newsletter?: boolean;
  }): Promise<ContactResult> =>
    FIXTURES
      ? Promise.resolve({ status: "received" as const })
      : call("/contact", { method: "POST", body: JSON.stringify(body), revalidate: false }),

  subscribe: (body: { email: string; lang?: string; source?: string }): Promise<NewsletterSubscribeResult> =>
    FIXTURES
      ? Promise.resolve({ status: fx.rememberSubscriber(body.email) ? "already_subscribed" : "subscribed" })
      : call("/newsletter", { method: "POST", body: JSON.stringify(body), revalidate: false }),

  /**
   * Unsubscribe by token. ALWAYS answers `unsubscribed`, whether the token was
   * live, spent or nonsense — the page exists to end the relationship, and a
   * token that turns out to be invalid is not something to make a visitor
   * argue with.
   */
  unsubscribe: (token: string): Promise<NewsletterUnsubscribeResult> =>
    FIXTURES
      ? Promise.resolve({ status: "unsubscribed" })
      : call(`/newsletter/unsubscribe?token=${encodeURIComponent(token)}`, { revalidate: false }),

  fx: (): Promise<FxRate> => FIXTURES ? Promise.resolve({ jpy_php: 0.39, as_of: "2026-09-08" }) : call("/fx", { revalidate: 3600, tags: ["fx"], timeout: SECONDARY_TIMEOUT_MS }),
  loyaltyTiers: (): Promise<HubTier[]> =>
    FIXTURES ? Promise.resolve(fx.tiers) : call("/loyalty/tiers", { revalidate: 300, tags: ["loyalty"] }),
  loyaltyJoin: (body: { name: string; contact: string; region: string; lang: string }): Promise<{ ok: true }> =>
    FIXTURES ? Promise.resolve({ ok: true }) : call("/loyalty/join", { method: "POST", body: JSON.stringify(body), revalidate: false }),
  /**
   * Links or creates the customers row for a signed-in customer. Idempotent.
   *
   * Without a profile the body is `{}`: the Hub links a customer that already
   * holds this email, and otherwise answers 422 `profile_required` (nothing is
   * created) — the caller sends her to /account/complete-profile. With a
   * profile, a new customer is created from it, unless her details match an
   * existing customer: 409 `already_registered`, nothing created. See
   * lib/profile.ts for both checks.
   */
  authCustomer: (jwt: string, profile?: HubProfileInput): Promise<{ customer: HubCustomer; created: boolean }> =>
    FIXTURES
      ? Promise.resolve({ customer: fx.meFixture.customer, created: false })
      : call("/auth/customer", { method: "POST", body: JSON.stringify(profile ?? {}), jwt, revalidate: false }),
  /** Profile, addresses, loyalty snapshot. 404 before authCustomer has run. */
  me: (jwt: string): Promise<HubMe> =>
    // NEXT_PUBLIC_PREVIEW_BLANK=1 serves the empty-record fixture instead, so
    // the "we cannot see any orders or plans" branch can be looked at. Preview
    // only; it is read inside the FIXTURES branch and nowhere else.
    FIXTURES
      ? Promise.resolve(process.env.NEXT_PUBLIC_PREVIEW_BLANK === "1" ? fx.meBlankFixture : fx.meFixture)
      : call("/me", { jwt, revalidate: false }),
  /** Replaces the whole address list. The Hub applies it atomically. */
  putAddresses: (jwt: string, addresses: HubAddress[]): Promise<{ ok: true; count: number }> =>
    FIXTURES
      ? Promise.resolve({ ok: true, count: addresses.length })
      : call("/me/addresses", { method: "PUT", body: JSON.stringify({ addresses }), jwt, revalidate: false }),
  /**
   * Prices a basket. Does NOT reserve stock — the decrement happens at pay
   * time, so an abandoned checkout never sits on a one-of-a-kind piece.
   * Throws HubError(409) when a piece sold out between browsing and checkout.
   */
  quote: (jwt: string, body: { items: { variant_id: string; qty: number }[]; order_type: OrderType; ship_to_address_id: string; recipient_name?: string; recipient_phone?: string; gift_note?: string; mode?: CheckoutMode; term_months?: number; settlement_currency?: SettlementCurrency }): Promise<HubQuote> =>
    FIXTURES
      ? Promise.resolve(fx.quoteFixture(body))
      : call("/checkout/quote", { method: "POST", body: JSON.stringify({ mode: "full", ...body }), jwt, revalidate: false }),
  /** Turns a quote into a real order. Transfer only in this step; Square is 501. */
  /** `lang` is stored on the order: the confirmation and every later email about it are written in it. */
  /**
   * Read back a quote this customer already took.
   *
   * The layaway agreement is signed on another site, so the customer leaves and
   * returns. `quote_id` is what the signature is keyed on, so the SAME quote has
   * to be the one paid against — re-quoting would mint a new id and orphan the
   * signature. Checkout state lives in React only, so on a same-tab return the
   * id from the URL is all there is, and this turns it back into the figures.
   *
   * 404 is another customer's quote as well as a missing one; 409 is spent or
   * expired. Both come back as HubError for the caller to map.
   */
  quoteById: (jwt: string, quote_id: string): Promise<HubQuote | null> =>
    FIXTURES
      ? Promise.resolve(null)
      : notFoundToNull(call(`/checkout/quote/${encodeURIComponent(quote_id)}`, { jwt, revalidate: false })),
  pay: (jwt: string, quote_id: string, lang: "ja" | "en"): Promise<HubPayResult> =>
    FIXTURES
      ? Promise.resolve(fx.payFixture())
      : call("/checkout/pay", { method: "POST", body: JSON.stringify({ quote_id, method: "transfer", lang }), jwt, revalidate: false }),
  /**
   * The same endpoint, for a quote whose mode is layaway. The Hub decides from
   * the quote which it is; the two answers differ, so they are typed apart
   * rather than merged into one shape with everything optional.
   */
  payLayaway: (
    jwt: string,
    quote_id: string,
    lang: "ja" | "en",
    /**
     * The agreement the customer actually signed, verified server-side against
     * the signing record before this is called (lib/agreement-lookup.ts). The
     * Hub stores both on the plan. Never a literal and never client state: the
     * Hub's own NewCashOrder.tsx hardcodes 'v1' and has been wrong against the
     * live agreement ever since, which is the defect not to repeat.
     */
    agreement: { version: string; signed_at: string },
  ): Promise<HubLayawayPayResult> =>
    FIXTURES
      ? Promise.resolve(fx.layawayPayFixture())
      : call("/checkout/pay", {
          method: "POST",
          body: JSON.stringify({
            quote_id,
            method: "transfer",
            lang,
            agreement_version: agreement.version,
            agreement_signed_at: agreement.signed_at,
          }),
          jwt,
          revalidate: false,
        }),
  /** The customer's own plans, newest first. */
  layawayPlans: (jwt: string): Promise<HubLayawayPlan[]> =>
    FIXTURES ? Promise.resolve(fx.layawayPlansFixture) : call("/layaway", { jwt, revalidate: false }),
  layawayPlan: (jwt: string, id: string): Promise<HubLayawayDetail | null> =>
    FIXTURES
      ? Promise.resolve(fx.layawayPlanFixture(id))
      : notFoundToNull(call(`/layaway/${encodeURIComponent(id)}`, { jwt, revalidate: false })),
  /**
   * Reports a transfer. This creates a SUBMISSION, never a payment: nothing is
   * on the books until a Cha Jewels reviewer confirms it in the Hub. Proof is
   * required — the Hub refuses without it, as it does on every other path.
   */
  layawayPay: (jwt: string, id: string, body: { amount: number; payment_date: string; payment_method: string; reference_number?: string; proof_url: string }): Promise<{ ok: true; is_deposit: boolean }> =>
    FIXTURES
      ? Promise.resolve({ ok: true as const, is_deposit: false })
      : call(`/layaway/${encodeURIComponent(id)}/pay`, { method: "POST", body: JSON.stringify(body), jwt, revalidate: false }),
  orders: (jwt: string): Promise<HubOrder[]> =>
    FIXTURES ? Promise.resolve(fx.ordersFixture) : call("/orders", { jwt, revalidate: false }),
  order: (jwt: string, id: string): Promise<HubOrderDetail | null> =>
    FIXTURES
      ? Promise.resolve(fx.orderFixture(id))
      : notFoundToNull(call(`/orders/${encodeURIComponent(id)}`, { jwt, revalidate: false })),
  /** The customer's own service requests, every order and plan, newest first. */
  serviceRequests: (jwt: string): Promise<ServiceRequest[]> =>
    FIXTURES ? Promise.resolve(fx.serviceRequestsFixture()) : call("/me/service-requests", { jwt, revalidate: false }),
  /**
   * Raises one request against one order or one plan. The Hub checks that the
   * reference belongs to this customer and answers with the stored row; status
   * starts at "requested" and only staff move it from there.
   */
  createServiceRequest: (jwt: string, body: ServiceRequestInput): Promise<ServiceRequest> =>
    FIXTURES
      ? Promise.resolve(fx.createServiceRequestFixture(body))
      : call("/me/service-requests", { method: "POST", body: JSON.stringify(body), jwt, revalidate: false }),
  wholesaleInquiry: (body: { name: string; business: string; email: string; phone?: string; market: "JP" | "PH" | "BOTH" | "OTHER"; volume: "TEST" | "20_50" | "50_200" | "200_PLUS"; notes?: string; lang: string }): Promise<{ ok: true }> =>
    FIXTURES ? Promise.resolve({ ok: true }) : call("/wholesale/inquiry", { method: "POST", body: JSON.stringify(body), revalidate: false }),
};

/**
 * Uploads a proof of payment and returns its public URL.
 *
 * This is the one Hub call that does NOT go through the website API. The
 * `upload-proof` function is a sibling edge function in the same Supabase
 * project, and it already does exactly what is needed here: it authenticates
 * the customer's JWT and checks that the account belongs to them before
 * writing anything. Reaching for it directly reuses that check rather than
 * building a second uploader with a second chance to get ownership wrong.
 *
 * No new secret: the function URL is derived from the Supabase URL the site
 * already signs customers in against, and the gateway's `apikey` is the
 * publishable anon key that ships in the browser bundle regardless. The
 * customer's JWT is what actually authorizes the write.
 */
export async function uploadProof(jwt: string, accountId: string, file: File): Promise<string> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!base || !anon) throw new HubError(500, "Supabase URL / anon key not configured");

  const form = new FormData();
  form.set("file", file);
  form.set("account_id", accountId);
  // Namespaced by time so a second upload never silently replaces the first.
  form.set("file_name", `web-${Date.now()}-${file.name}`);

  const res = await fetch(`${base}/functions/v1/upload-proof`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, apikey: anon },
    body: form,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.proof_url) {
    throw new HubError(res.status, typeof body?.error === "string" ? body.error : "upload_failed", "upload_failed");
  }
  return String(body.proof_url);
}

/**
 * Enrols the signed-in customer in the loyalty programme.
 *
 * Calls `join-loyalty-program` directly rather than going through the
 * `website` function, for the same reason `uploadProof` does: that function
 * already takes the customer's JWT, resolves it to their customer row via
 * `resolvePortalAuth`, and is idempotent — it answers `already_enrolled` rather
 * than creating a second membership. Routing it through a new `website` endpoint
 * would add a Hub deploy and a second place for the ownership check to be wrong.
 *
 * No new secret: the URL comes from the Supabase project the site already signs
 * customers in against, and `apikey` is the publishable anon key that ships in
 * the browser bundle anyway. The customer's JWT is what authorises the write.
 *
 * NEVER throws. Enrolment happens after an order is paid for, and an order that
 * exists must not be disturbed by a loyalty failure. The caller gets a result it
 * can record, not an exception it has to remember to swallow.
 *
 * `source` tells the Hub which storefront entry point enrolled the customer
 * (stored on loyalty_members.enrollment_source).
 */
export type EnrolSource = "storefront_checkout" | "storefront_join";

export type EnrolResult =
  | { ok: true; already: boolean; memberId: string | null }
  | { ok: false; status: number | null; reason: string };

export async function loyaltyEnrol(jwt: string, source: EnrolSource): Promise<EnrolResult> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!base || !anon) return { ok: false, status: null, reason: "not_configured" };

  try {
    const res = await fetch(`${base}/functions/v1/join-loyalty-program`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
      // The order is already placed; the confirmation screen is waiting on this
      // call and must not wait long. A slow Hub becomes a recorded failure, not
      // a checkout that hangs.
      signal: AbortSignal.timeout(6000),
    });
    const body = (await res.json().catch(() => null)) as
      | { enrolled?: boolean; already_enrolled?: boolean; member_id?: string; error?: string }
      | null;
    if (!res.ok) {
      // 403 is the loyalty_enabled go-live gate, 401 an auth mismatch, 500 the
      // Hub. All three mean the same thing here: not enrolled, say so plainly.
      return { ok: false, status: res.status, reason: typeof body?.error === "string" ? body.error : `http_${res.status}` };
    }
    return {
      ok: true,
      already: body?.already_enrolled === true,
      memberId: typeof body?.member_id === "string" ? body.member_id : null,
    };
  } catch (err) {
    // Timeout, DNS, TLS — anything at all. The order stands.
    return { ok: false, status: null, reason: err instanceof Error ? err.name : "unreachable" };
  }
}

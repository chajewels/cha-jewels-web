import "server-only";
import type { Collection, FxRate, HubAddress, HubCustomer, HubMe, HubOrder, HubOrderDetail, HubPayResult, HubQuote, HubTier, LayawayQuote, LiveClaim, OrderType, Product } from "@/lib/types";
import * as fx from "@/lib/fixtures";

/**
 * The website's only door into Cha Jewels Hub.
 * Every call goes to edge functions owned by Lovable (spec: supabase/contracts/api.md).
 * No table names, no RLS assumptions, no service role key on this side.
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

async function call<T>(path: string, init: RequestInit & { revalidate?: number | false; tags?: string[]; jwt?: string } = {}): Promise<T> {
  if (!BASE || !KEY) throw new HubError(500, "HUB_API_URL / HUB_API_KEY not configured");
  const { revalidate = 60, tags = ["catalog"], jwt, ...rest } = init;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
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
  collections: (): Promise<Collection[]> => FIXTURES ? Promise.resolve(fx.collections) : call("/catalog/collections"),
  collection: (slug: string): Promise<(Collection & { products: Product[] }) | null> =>
    FIXTURES ? Promise.resolve((() => { const c = fx.collections.find((x) => x.slug === slug); return c ? { ...c, products: fx.products.filter((p) => p.col === slug) } : null; })())
             : notFoundToNull(call(`/catalog/collections/${encodeURIComponent(slug)}`)),
  product: (slug: string): Promise<Product | null> =>
    FIXTURES ? Promise.resolve(fx.products.find((p) => p.slug === slug) ?? null) : notFoundToNull(call(`/catalog/products/${encodeURIComponent(slug)}`)),
  featured: (limit = 8): Promise<Product[]> => FIXTURES ? Promise.resolve(fx.products.slice(0, limit)) : call(`/catalog/products?featured=1&limit=${limit}`),
  productSlugs: (): Promise<{ slug: string; updated_at: string }[]> => FIXTURES ? Promise.resolve(fx.products.map((p) => ({ slug: p.slug, updated_at: "2026-09-01" }))) : call("/catalog/products?fields=slug,updated_at&limit=5000"),
  /** Quote is always computed in JPY by the Hub. Peso display uses hub.fx(). */
  layawayQuote: (price: number, term_months: number): Promise<LayawayQuote> =>
    FIXTURES ? Promise.resolve(fx.quote(price, term_months, "JPY")) : call("/layaway/quote", { method: "POST", body: JSON.stringify({ price, term_months, currency: "JPY" }), revalidate: false }),
  fx: (): Promise<FxRate> => FIXTURES ? Promise.resolve({ jpy_php: 0.39, as_of: "2026-09-08" }) : call("/fx", { revalidate: 3600, tags: ["fx"] }),
  claim: (code: string): Promise<LiveClaim | null> =>
    FIXTURES ? Promise.resolve(fx.claims.find((c) => c.code === code.toUpperCase()) ?? null) : notFoundToNull(call(`/claims/${encodeURIComponent(code.toUpperCase())}`, { revalidate: false })),
  loyaltyTiers: (): Promise<HubTier[]> =>
    FIXTURES ? Promise.resolve(fx.tiers) : call("/loyalty/tiers", { revalidate: 300, tags: ["loyalty"] }),
  loyaltyJoin: (body: { name: string; contact: string; region: string; lang: string }): Promise<{ ok: true }> =>
    FIXTURES ? Promise.resolve({ ok: true }) : call("/loyalty/join", { method: "POST", body: JSON.stringify(body), revalidate: false }),
  /** Links or creates the customers row for a signed-in customer. Idempotent. */
  authCustomer: (jwt: string, full_name?: string): Promise<{ customer: HubCustomer; created: boolean }> =>
    FIXTURES
      ? Promise.resolve({ customer: fx.meFixture.customer, created: false })
      : call("/auth/customer", { method: "POST", body: JSON.stringify({ full_name }), jwt, revalidate: false }),
  /** Profile, addresses, loyalty snapshot. 404 before authCustomer has run. */
  me: (jwt: string): Promise<HubMe> =>
    FIXTURES ? Promise.resolve(fx.meFixture) : call("/me", { jwt, revalidate: false }),
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
  quote: (jwt: string, body: { items: { variant_id: string; qty: number }[]; order_type: OrderType; ship_to_address_id: string; recipient_name?: string; recipient_phone?: string; gift_note?: string }): Promise<HubQuote> =>
    FIXTURES
      ? Promise.resolve(fx.quoteFixture(body))
      : call("/checkout/quote", { method: "POST", body: JSON.stringify({ ...body, mode: "full" }), jwt, revalidate: false }),
  /** Turns a quote into a real order. Transfer only in this step; Square is 501. */
  pay: (jwt: string, quote_id: string): Promise<HubPayResult> =>
    FIXTURES
      ? Promise.resolve(fx.payFixture())
      : call("/checkout/pay", { method: "POST", body: JSON.stringify({ quote_id, method: "transfer" }), jwt, revalidate: false }),
  orders: (jwt: string): Promise<HubOrder[]> =>
    FIXTURES ? Promise.resolve(fx.ordersFixture) : call("/orders", { jwt, revalidate: false }),
  order: (jwt: string, id: string): Promise<HubOrderDetail | null> =>
    FIXTURES
      ? Promise.resolve(fx.orderFixture(id))
      : notFoundToNull(call(`/orders/${encodeURIComponent(id)}`, { jwt, revalidate: false })),
  wholesaleInquiry: (body: { name: string; business: string; email: string; phone?: string; market: "JP" | "PH" | "BOTH" | "OTHER"; volume: "TEST" | "20_50" | "50_200" | "200_PLUS"; notes?: string; lang: string }): Promise<{ ok: true }> =>
    FIXTURES ? Promise.resolve({ ok: true }) : call("/wholesale/inquiry", { method: "POST", body: JSON.stringify(body), revalidate: false }),
};

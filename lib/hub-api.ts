import "server-only";
import type { Collection, LayawayQuote, LiveClaim, Product } from "@/lib/types";
import * as fx from "@/lib/fixtures";

/**
 * The website's only door into Cha Jewels Hub.
 * Every call goes to edge functions owned by Lovable (spec: supabase/contracts/api.md).
 * No table names, no RLS assumptions, no service role key on this side.
 */
const FIXTURES = process.env.NEXT_PUBLIC_PREVIEW_FIXTURES === "1";
const BASE = (process.env.HUB_API_URL ?? "").replace(/\/$/, "");
const KEY = process.env.HUB_API_KEY ?? "";

class HubError extends Error { constructor(public status: number, message: string) { super(message); } }

async function call<T>(path: string, init: RequestInit & { revalidate?: number | false; tags?: string[] } = {}): Promise<T> {
  if (!BASE || !KEY) throw new HubError(500, "HUB_API_URL / HUB_API_KEY not configured");
  const { revalidate = 60, tags = ["catalog"], ...rest } = init;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: { "content-type": "application/json", "x-api-key": KEY, ...(rest.headers ?? {}) },
    next: revalidate === false ? undefined : { revalidate, tags },
    cache: revalidate === false ? "no-store" : undefined,
  });
  if (res.status === 404) throw new HubError(404, "Not found");
  if (!res.ok) throw new HubError(res.status, `Hub API ${res.status} on ${path}`);
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
  layawayQuote: (price: number, term_months: number, currency: "JPY" | "PHP"): Promise<LayawayQuote> =>
    FIXTURES ? Promise.resolve(fx.quote(price, term_months, currency)) : call("/layaway/quote", { method: "POST", body: JSON.stringify({ price, term_months, currency }), revalidate: false }),
  claim: (code: string): Promise<LiveClaim | null> =>
    FIXTURES ? Promise.resolve(fx.claims.find((c) => c.code === code.toUpperCase()) ?? null) : notFoundToNull(call(`/claims/${encodeURIComponent(code.toUpperCase())}`, { revalidate: false })),
  loyaltyJoin: (body: { name: string; contact: string; region: string; lang: string }): Promise<{ ok: true }> =>
    FIXTURES ? Promise.resolve({ ok: true }) : call("/loyalty/join", { method: "POST", body: JSON.stringify(body), revalidate: false }),
};

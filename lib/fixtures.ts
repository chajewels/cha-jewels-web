import type { Collection, LayawayQuote, LiveClaim, Product } from "@/lib/types";
/** Local preview data. Active only when NEXT_PUBLIC_PREVIEW_FIXTURES=1. Never shipped to production. */
export const collections: Collection[] = [
  { id: "c1", slug: "k18-gold", name: "K18 Gold", hero_media: null, description: "Chains, bangles, rings and hoops in 75% pure gold. The everyday pieces that still weigh something." },
  { id: "c2", slug: "pearls", name: "Pearls", hero_media: null, description: "Akoya and freshwater strands graded for luster and match, finished with K18 clasps." },
  { id: "c3", slug: "diamonds", name: "Diamonds", hero_media: null, description: "Certified stones in K18 and PT900. Carat weight and clarity stated on every piece." },
  { id: "c4", slug: "preloved-luxury", name: "Preloved Luxury", hero_media: null, description: "Pieces from iconic houses, authenticated and serviced in Japan before they reach you." },
];
const mk = (i: number, name: string, karat: Product["karat"], w: number, jpy: number, stone: string | null, col: string): Product & { col: string } => ({
  id: `p${i}`, sku: `CJ-${1000 + i}`, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, karat, weight_g: w, status: "active", col,
  description_en: `${name}. ${karat} ${stone ? "with " + stone + ", " : ""}crafted in Japan and priced by weight.`, description_ja: null, description_tl: null,
  product_variants: [{ id: `v${i}`, size: null, stone, price_jpy: jpy, price_php: Math.round(jpy * 0.39), stock_qty: i % 5 === 0 ? 0 : 3, product_media: [] }],
});
export const products = [
  mk(1, "Double-sided diamond pendant", "PT900", 16.9, 1480000, "2.62 ct diamonds", "diamonds"),
  mk(2, "Kihei chain 50 cm", "K18", 20.4, 398000, null, "k18-gold"),
  mk(3, "Twist bangle", "K18", 12.1, 236000, null, "k18-gold"),
  mk(4, "Akoya strand 7.5 mm", "K18", 4.2, 168000, "Akoya pearls", "pearls"),
  mk(5, "Solitaire ring", "PT950", 3.8, 312000, "0.5 ct diamond", "diamonds"),
  mk(6, "Hoop earrings", "K18", 5.6, 118000, null, "k18-gold"),
  mk(7, "Baby bangle", "K18", 6.3, 124000, null, "k18-gold"),
  mk(8, "Freshwater drop earrings", "K18", 3.1, 62000, "freshwater pearls", "pearls"),
];
export const claims: LiveClaim[] = [{ id: "l1", code: "CJ-4821", price_locked: 236000, status: "held", expires_at: new Date(Date.now() + 36e5 * 6).toISOString(), product_variant_id: "v3" }];
export function quote(price: number, term: number, currency: "JPY" | "PHP"): LayawayQuote {
  const threshold = currency === "PHP" ? 300000 * 0.39 : 300000;
  const max = price >= threshold ? 8 : 6;
  const t = Math.min(Math.max(term, 3), max);
  const dp = Math.round(price * 0.3);
  return { down_payment: dp, monthly: Math.round((price - dp) / t), term_months: t, total: price, max_term_months: max, currency };
}

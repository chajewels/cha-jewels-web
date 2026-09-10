import type { Collection, HubTier, LayawayQuote, LiveClaim, Product } from "@/lib/types";
import { tiers as localTiers } from "@/lib/loyalty";
/** Local preview data. Active only when NEXT_PUBLIC_PREVIEW_FIXTURES=1. Never shipped to production. */
export const collections: Collection[] = [
  { id: "c1", slug: "necklaces", name: "Necklaces", hero_media: null, description: "Chains and strands in K18 and pearl, sized for daily wear." },
  { id: "c2", slug: "pendants", name: "Pendants", hero_media: null, description: "Diamond, pearl and gold pendants to hang on your own chain or ours." },
  { id: "c3", slug: "earrings", name: "Earrings", hero_media: null, description: "Hoops, studs and drops in K18 and platinum." },
  { id: "c4", slug: "bracelets", name: "Bracelets", hero_media: null, description: "Bangles and chain bracelets, weight stated on every piece." },
  { id: "c5", slug: "rings", name: "Rings", hero_media: null, description: "Solitaires, bands and statement rings, resizable in Japan." },
  { id: "c6", slug: "anklets", name: "Anklets", hero_media: null, description: "Fine K18 anklets for everyday wear." },
]; 
const mk = (i: number, name: string, karat: Product["karat"], w: number, jpy: number, stone: string | null, col: string): Product & { col: string } => ({
  id: `p${i}`, sku: `CJ-${1000 + i}`, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, karat, weight_g: w, status: "active", col,
  // Rings are the preloved line in preview data; everything else is New.
  condition: col === "rings" ? "Preloved" : "New",
  description_en: `${name}. ${karat} ${stone ? "with " + stone + ", " : ""}crafted in Japan and priced by weight.`, description_ja: null, description_tl: null,
  product_variants: [{ id: `v${i}`, size: null, stone, price_jpy: jpy, price_php: Math.round(jpy * 0.39), stock_qty: i % 5 === 0 ? 0 : 3, product_media: [] }],
});
export const products = [
  mk(1, "Double-sided diamond pendant", "PT900", 16.9, 1480000, "2.62 ct diamonds", "pendants"),
  mk(2, "Kihei chain 50 cm", "K18", 20.4, 398000, null, "necklaces"),
  mk(3, "Twist bangle", "K18", 12.1, 236000, null, "bracelets"),
  mk(4, "Akoya strand 7.5 mm", "K18", 4.2, 168000, "Akoya pearls", "earrings"),
  mk(5, "Solitaire ring", "PT950", 3.8, 312000, "0.5 ct diamond", "rings"),
  mk(6, "Hoop earrings", "K18", 5.6, 118000, null, "necklaces"),
  mk(7, "Baby bangle", "K18", 6.3, 124000, null, "bracelets"),
  mk(8, "Freshwater drop earrings", "K18", 3.1, 62000, "freshwater pearls", "earrings"),
];
export const claims: LiveClaim[] = [{ id: "l1", code: "CJ-4821", price_locked: 236000, status: "held", expires_at: new Date(Date.now() + 36e5 * 6).toISOString(), product_variant_id: "v3" }];
export function quote(price: number, term: number, currency: "JPY" | "PHP"): LayawayQuote {
  const threshold = currency === "PHP" ? 300000 * 0.39 : 300000;
  const max = price >= threshold ? 8 : 6;
  const t = Math.min(Math.max(term, 3), max);
  const dp = Math.round(price * 0.3);
  return { down_payment: dp, monthly: Math.round((price - dp) / t), term_months: t, total: price, max_term_months: max, currency };
}
export const tiers: HubTier[] = localTiers.map((t) => ({ slug: t.slug, name: t.name, threshold_jpy: t.thresholdJpy, requalify_spend: t.requalifyJpy, multiplier: t.multiplier, hold_minutes: t.holdMinutes, benefits_ja: t.perks.ja, benefits_en: t.perks.en }));

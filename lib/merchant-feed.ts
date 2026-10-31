import type { Product, ProductVariant } from "@/lib/types";
import type { Lang } from "@/lib/i18n";
import { variantAvailability } from "@/lib/availability";
import { localePath } from "@/lib/locale";
import { productDescription, productName } from "@/lib/catalog-i18n";
import { metalsLabel, productMetals } from "@/lib/metals";
import { displayedVariant } from "@/lib/json-ld";

/**
 * GOOGLE MERCHANT CENTER PRODUCT FEED — THE PURE BUILDER (Phase 5, Master Plan
 * §15; readiness: docs/seo/phase-5/MERCHANT-CENTER-READINESS.md; gaps MC-G1 to
 * MC-G13 in docs/seo/SEO-REQUIREMENTS-REGISTER.md §4).
 *
 * WHAT THIS IS AND IS NOT. A product → feed-item mapping and an RSS 2.0 renderer
 * with the `g:` namespace, unit-tested, with NO route behind it: the feed URL
 * (`app/api/merchant-feed/route.ts`, Option B) is a new route and needs the
 * owner's route-change approval (OD-MC-7) plus the account decisions X8 and
 * OD-MC-1..3 before it is written. docs/seo/phase-5/MERCHANT-FEED-IMPLEMENTATION-
 * PROPOSAL.md carries the exact route code for that approval. Nothing here is
 * reachable from a browser.
 *
 * RULES KEPT BY CONSTRUCTION (each proved in tests/merchant-feed.test.mjs):
 *  - MONEY: every figure is the Hub's own, copied. `price` is `full_price_jpy`
 *    while on sale (the regular price) and `price_jpy` otherwise; `sale_price`
 *    is `price_jpy` while on sale. No rounding, no conversion, no percentage.
 *    `price_php`, `down_payment_*` and `down_payment_pct` never appear.
 *  - LANDING-PAGE AGREEMENT (MC-G8): the product page renders ONE variant,
 *    `product_variants[0]` (the same `displayedVariant` the Product JSON-LD
 *    uses), so the feed sends ONE item per product describing that variant:
 *    its price, its stock state (through the one `variantAvailability` rule the
 *    buy buttons use), its size and stone. A per-variant feed would disagree
 *    with its landing page for every other variant; that mode is deliberately
 *    not offered until the page can show a chosen variant (owner decision).
 *  - IDENTIFIERS (MC-G7): `identifier_exists: no` is sent only for pieces the
 *    Hub does not mark as branded (`origin !== "BRAND"`): unique or hallmarked
 *    jewelry without GS1 codes. A BRANDED piece may carry a manufacturer model
 *    or part number Google expects, and no identifier evidence exists in the
 *    Website API, so branded pieces are EXCLUDED (reason recorded) until the
 *    owner's written identifier rule exists. Nothing is invented.
 *  - BRAND: never filled for an unbranded piece (OD-MC-4, rule 11).
 *  - ORIGIN: no made-in field, no origin claim; the Hub's `origin` is used only
 *    to tell branded pieces apart.
 *  - LANGUAGE: the EN feed links /en/products/<slug> and uses the English name
 *    and description; the JA feed links /ja/… and uses the Japanese ones. A
 *    product with no description in the feed's language is EXCLUDED (never a
 *    fallback to the other language: the landing page must be in the feed's
 *    language). Names fall back through catalog-i18n exactly as the page does.
 *  - SOLD PIECES (OD-MC-9 / D3): sent as `out_of_stock`, never dropped, because
 *    their pages stay live. Archived and variant-less products: `out_of_stock`
 *    with no price is not a valid item, so a product with NO variant is
 *    excluded (its page shows it as sold).
 *  - FULL-CATALOG RETRIEVAL (MC-G10): `reconcile()` compares the items plus the
 *    recorded exclusions with the catalog's slug list; any slug unaccounted for
 *    is a problem, and a route must refuse to serve a feed that has one.
 *  - CATEGORY: Google's taxonomy id by the first collection slug, from the
 *    taxonomy read on 2026-10-29 (188 Jewelry, 200 Rings, 196 Necklaces,
 *    191 Bracelets, 194 Earrings, 192 Charms & Pendants, 189 Anklets,
 *    201 Watches). Collections that are not jewelry (bags, wallets, other
 *    accessories) get NO category rather than a guessed one.
 *  - XML: every text value is escaped; nothing from a product can break the
 *    document or inject an element.
 */
export type FeedLang = Lang;
export type FeedItem = {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  additional_image_link: string[];
  availability: "in_stock" | "out_of_stock";
  price: string;
  sale_price?: string;
  condition: "new" | "used";
  brand?: string;
  identifier_exists?: "no";
  google_product_category?: number;
  product_type?: string;
  material?: string;
  size?: string;
};
export type FeedExclusion = { slug: string; reason: "no_variant" | "no_price" | "no_image" | "no_description" | "branded_identifier_rule_pending" | "no_slug" };
export type FeedBuild = { items: FeedItem[]; excluded: FeedExclusion[] };

/** Google product taxonomy ids by Hub collection slug (taxonomy-with-ids.en-US.txt, read 2026-10-29). Unmapped: no category. */
export const GOOGLE_CATEGORY_BY_COLLECTION: Readonly<Record<string, number>> = {
  rings: 200, necklaces: 196, bracelets: 191, "handmade-gemstone-bracelets": 191, earrings: 194, pendants: 192, anklets: 189, pearls: 188, "luxury-watches": 201,
};
const WATCH_CATEGORY = 201;

const JPY = (n: number) => `${n} JPY`;
const isInt = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;
const absHttps = (u: unknown): u is string => typeof u === "string" && /^https:\/\/\S+$/.test(u);

/** The item's price fields, the Hub's figures verbatim; null when the displayed variant has no usable price. */
export function feedPrice(v: Pick<ProductVariant, "price_jpy" | "full_price_jpy" | "on_sale">): { price: string; sale_price?: string } | null {
  if (!isInt(v.price_jpy)) return null;
  if (v.on_sale === true && isInt(v.full_price_jpy)) return { price: JPY(v.full_price_jpy), sale_price: JPY(v.price_jpy) };
  return { price: JPY(v.price_jpy) };
}

export function googleCategory(p: Pick<Product, "collection_slugs" | "category_slugs" | "item_type">): number | undefined {
  if (p.item_type === "Watch") return WATCH_CATEGORY;
  if ((p.category_slugs ?? []).includes("preloved-watches")) return WATCH_CATEGORY;
  for (const s of p.collection_slugs ?? []) if (s in GOOGLE_CATEGORY_BY_COLLECTION) return GOOGLE_CATEGORY_BY_COLLECTION[s];
  return undefined;
}

/** One product → one feed item (the displayed variant), or an exclusion with its reason. */
export function feedItem(p: Product, lang: FeedLang, base: string): { item: FeedItem } | { excluded: FeedExclusion } {
  const slug = p.slug?.trim();
  if (!slug) return { excluded: { slug: p.sku ?? p.id ?? "?", reason: "no_slug" } };
  if (p.origin === "BRAND") return { excluded: { slug, reason: "branded_identifier_rule_pending" } };
  const v = displayedVariant(p);
  if (!v) return { excluded: { slug, reason: "no_variant" } };
  const price = feedPrice(v);
  if (!price) return { excluded: { slug, reason: "no_price" } };
  const description = (lang === "ja" ? p.description_ja : p.description_en)?.trim();
  if (!description) return { excluded: { slug, reason: "no_description" } };
  const images = [...(v.product_media ?? [])].sort((a, b) => a.sort - b.sort).map((m) => m.url).filter(absHttps);
  if (images.length === 0) return { excluded: { slug, reason: "no_image" } };
  const metals = productMetals(p);
  const size = v.size?.trim();
  const stone = v.stone?.trim();
  const item: FeedItem = {
    id: p.id,
    title: [productName(p, lang), size ? `— ${size}` : null, stone ? `— ${stone}` : null].filter(Boolean).join(" ").slice(0, 150),
    description: description.slice(0, 5000),
    link: `${base}${localePath(`/products/${slug}`, lang)}`,
    image_link: images[0],
    additional_image_link: images.slice(1, 11),
    availability: variantAvailability(v, p.status) === "available" ? "in_stock" : "out_of_stock",
    ...price,
    condition: p.condition === "Preloved" ? "used" : "new",
    identifier_exists: "no",
    ...(googleCategory(p) !== undefined ? { google_product_category: googleCategory(p) } : {}),
    ...(p.collection_slugs?.[0] ? { product_type: p.condition === "Preloved" ? `Preloved > ${p.collection_slugs[0]}` : p.collection_slugs[0] } : {}),
    ...(metals.length ? { material: metalsLabel(metals, lang) } : {}),
    ...(size ? { size } : {}),
  };
  void productDescription; // the feed deliberately does NOT use the page's cross-language fallback (see the header)
  return { item };
}

export function buildFeed(products: readonly Product[], lang: FeedLang, base: string): FeedBuild {
  const items: FeedItem[] = [];
  const excluded: FeedExclusion[] = [];
  const seen = new Set<string>();
  for (const p of products) {
    if (p.status && p.status !== "active") continue; // the API returns active pieces only; an archived row is not an item
    const slug = p.slug?.trim();
    if (slug && seen.has(slug)) continue;
    if (slug) seen.add(slug);
    const r = feedItem(p, lang, base);
    if ("item" in r) items.push(r.item); else excluded.push(r.excluded);
  }
  return { items, excluded };
}

/**
 * MC-G10 / MC-G11: the feed is complete or it is not served. Every active slug
 * the catalog lists must be either an item or a recorded exclusion; a slug that
 * is neither (a truncated read, a malformed row) is a problem, and an empty
 * catalog or an empty item list is a problem too (an empty feed delists every
 * product). The route must answer a non-success status on any problem.
 */
export function reconcile(build: FeedBuild, catalogSlugs: readonly string[]): string[] {
  const problems: string[] = [];
  const have = new Set([...build.items.map((i) => new URL(i.link).pathname.split("/products/")[1]), ...build.excluded.map((e) => e.slug)]);
  const expected = [...new Set(catalogSlugs.map((s) => s?.trim()).filter(Boolean))];
  if (expected.length === 0) problems.push("the catalog slug list is empty");
  if (build.items.length === 0) problems.push("the feed has no items");
  const missing = expected.filter((s) => !have.has(s));
  if (missing.length) problems.push(`${missing.length} catalog slug(s) unaccounted for, e.g. ${missing.slice(0, 3).join(", ")}`);
  return problems;
}

const escXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const tag = (name: string, value: string | number) => `<${name}>${escXml(String(value))}</${name}>`;

/** RSS 2.0 with Google's `g:` namespace. Deterministic, escaped, one <item> per feed item. */
export function renderRss(build: FeedBuild, args: { title: string; link: string; description: string }): string {
  const items = build.items.map((i) => [
    "<item>",
    tag("g:id", i.id), tag("g:title", i.title), tag("g:description", i.description), tag("g:link", i.link), tag("g:image_link", i.image_link),
    ...i.additional_image_link.map((u) => tag("g:additional_image_link", u)),
    tag("g:availability", i.availability), tag("g:price", i.price), ...(i.sale_price ? [tag("g:sale_price", i.sale_price)] : []),
    tag("g:condition", i.condition), ...(i.brand ? [tag("g:brand", i.brand)] : []), ...(i.identifier_exists ? [tag("g:identifier_exists", i.identifier_exists)] : []),
    ...(i.google_product_category !== undefined ? [tag("g:google_product_category", i.google_product_category)] : []),
    ...(i.product_type ? [tag("g:product_type", i.product_type)] : []), ...(i.material ? [tag("g:material", i.material)] : []), ...(i.size ? [tag("g:size", i.size)] : []),
    "</item>",
  ].join(""));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>${tag("title", args.title)}${tag("link", args.link)}${tag("description", args.description)}${items.join("\n")}</channel></rss>\n`;
}

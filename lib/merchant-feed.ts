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
 * PROPOSAL.md carries the PROPOSED route code for that approval. Nothing here is
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
 *  - IDENTIFIERS ARE EVIDENCE, NOT A DEFAULT (MC-G7, OD-MC-11): the Website API
 *    carries no GTIN, MPN or identifier field, so the builder has NO opinion of
 *    its own. Every call supplies an `IdentifierRule` — the owner's written
 *    rule per piece class, turned into code when it exists — that answers, per
 *    product, "no identifier exists" (→ `identifier_exists: no`), "these
 *    identifiers exist" (→ `gtin`/`mpn` with `brand`), or UNKNOWN (null → the
 *    product is EXCLUDED with reason `identifier_unknown`). The only built-in
 *    rule is `IDENTIFIERS_UNDECIDED`, which answers UNKNOWN for everything: with
 *    it the feed has no items, which is the truthful state before OD-MC-11.
 *    A rule's answer is cross-checked against the Hub: "no identifier" for a
 *    piece the Hub marks branded (`origin === "BRAND"` or a non-empty `brand`)
 *    is a conflict (a branded piece has a brand by definition), as is an MPN
 *    without a brand or an "ids" answer without any id; such products are
 *    excluded with reason `identifier_conflict`, never sent.
 *  - BRAND: filled only from an "ids" answer, never guessed (OD-MC-4, rule 11).
 *  - ORIGIN: no made-in field, no origin claim; the Hub's `origin` is used only
 *    for the branded cross-check above.
 *  - LANGUAGE: the EN feed links /en/products/<slug> and uses the English name
 *    and description; the JA feed links /ja/… and uses the Japanese ones. A
 *    product with no description in the feed's language is EXCLUDED (never a
 *    fallback to the other language: the landing page must be in the feed's
 *    language). Names fall back through catalog-i18n exactly as the page does.
 *  - SOLD PIECES (OD-MC-9 / D3): sent as `out_of_stock`, never dropped, because
 *    their pages stay live. A product with NO variant has no price and is
 *    excluded (its page shows it as sold).
 *  - UNKNOWN IS EXCLUDED, NOT ASSUMED: a product whose `status` is not
 *    `active` (`not_active`), whose `status` is missing (`status_unknown`),
 *    whose `condition` is missing (`condition_unknown`: Google's `condition` is
 *    required and the builder does not assume "new"), whose slug is missing
 *    (`no_slug`), or whose slug repeats an earlier row (`duplicate_slug`) is
 *    recorded as an exclusion with that reason. Nothing is silently skipped:
 *    every input row is in `items` or in `excluded`, so `reconcile()` can see it.
 *  - CATALOG COMPLETENESS (MC-G10): `reconcile()` demands EXACT membership —
 *    the set of accounted slugs (items + exclusions) equals the catalog slug
 *    list, no slug missing, none extra, none repeated on either side, no row
 *    without a slug, no duplicate exclusions — and, when an authoritative total
 *    is supplied, that the catalog list is that long. LIMIT, stated plainly:
 *    the Website API exposes no total count (both `/catalog/products?limit=5000`
 *    and the `?fields=slug` projection are reads of the same table with the
 *    same limit), so a truncated read of both lists would agree with itself.
 *    Until the Hub contract carries a total (OD-MC-12, a Hub work item),
 *    "complete" means "two independent reads agree and the list is under the
 *    limit", not "authoritatively complete"; the route must say so.
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
  gtin?: string;
  mpn?: string;
  identifier_exists?: "no";
  google_product_category?: number;
  product_type?: string;
  material?: string;
  size?: string;
};
export type ExclusionReason =
  | "no_slug" | "duplicate_slug" | "not_active" | "status_unknown" | "condition_unknown"
  | "identifier_unknown" | "identifier_conflict" | "no_variant" | "no_price" | "no_description" | "no_image";
export type FeedExclusion = { slug: string; reason: ExclusionReason };
/** One entry per INPUT ROW, in input order: what became of it. `slug` is null for a row without one. */
export type FeedMembership = { slug: string | null; outcome: "item" | ExclusionReason };
export type FeedBuild = { items: FeedItem[]; excluded: FeedExclusion[]; membership: FeedMembership[] };

/** What the owner's identifier rule (OD-MC-11) says about one product. `null` = unknown → excluded. */
export type IdentifierEvidence = { kind: "none" } | { kind: "ids"; gtin?: string; mpn?: string; brand?: string };
export type IdentifierRule = (p: Product) => IdentifierEvidence | null;
/** The only built-in rule: no identifier rule exists yet, so every product is UNKNOWN and the feed is empty. */
export const IDENTIFIERS_UNDECIDED: IdentifierRule = () => null;

/** Google product taxonomy ids by Hub collection slug (taxonomy-with-ids.en-US.txt, read 2026-10-29). Unmapped: no category. */
export const GOOGLE_CATEGORY_BY_COLLECTION: Readonly<Record<string, number>> = {
  rings: 200, necklaces: 196, bracelets: 191, "handmade-gemstone-bracelets": 191, earrings: 194, pendants: 192, anklets: 189, pearls: 188, "luxury-watches": 201,
};
const WATCH_CATEGORY = 201;

const JPY = (n: number) => `${n} JPY`;
const isInt = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;
const absHttps = (u: unknown): u is string => typeof u === "string" && /^https:\/\/\S+$/.test(u);
const text = (s: unknown): string | undefined => (typeof s === "string" && s.trim() ? s.trim() : undefined);

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

/**
 * The identifier fields for one product from the rule's answer, or the exclusion reason. The cross-checks are
 * the builder's own and cannot be switched off by a rule.
 */
export function identifierFields(p: Product, rule: IdentifierRule): { fields: Pick<FeedItem, "brand" | "gtin" | "mpn" | "identifier_exists"> } | { reason: "identifier_unknown" | "identifier_conflict" } {
  const ev = rule(p);
  if (ev === null) return { reason: "identifier_unknown" };
  const branded = p.origin === "BRAND" || text(p.brand) !== undefined;
  if (ev.kind === "none") return branded ? { reason: "identifier_conflict" } : { fields: { identifier_exists: "no" } };
  const gtin = text(ev.gtin), mpn = text(ev.mpn), brand = text(ev.brand);
  if (!gtin && !mpn) return { reason: "identifier_conflict" };
  if (mpn && !brand) return { reason: "identifier_conflict" };
  return { fields: { ...(brand ? { brand } : {}), ...(gtin ? { gtin } : {}), ...(mpn ? { mpn } : {}) } };
}

/** One product → one feed item (the displayed variant), or an exclusion with its reason. */
export function feedItem(p: Product, lang: FeedLang, base: string, identifiers: IdentifierRule): { item: FeedItem } | { excluded: FeedExclusion } {
  const slug = text(p.slug);
  if (!slug) return { excluded: { slug: p.sku ?? p.id ?? "?", reason: "no_slug" } };
  const excluded = (reason: ExclusionReason) => ({ excluded: { slug, reason } });
  if (p.status === undefined || p.status === null) return excluded("status_unknown");
  if (p.status !== "active") return excluded("not_active");
  if (p.condition !== "New" && p.condition !== "Preloved") return excluded("condition_unknown");
  const ids = identifierFields(p, identifiers);
  if ("reason" in ids) return excluded(ids.reason);
  const v = displayedVariant(p);
  if (!v) return excluded("no_variant");
  const price = feedPrice(v);
  if (!price) return excluded("no_price");
  const description = text(lang === "ja" ? p.description_ja : p.description_en);
  if (!description) return excluded("no_description");
  const images = [...(v.product_media ?? [])].sort((a, b) => a.sort - b.sort).map((m) => m.url).filter(absHttps);
  if (images.length === 0) return excluded("no_image");
  const metals = productMetals(p);
  const size = text(v.size);
  const stone = text(v.stone);
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
    ...ids.fields,
    ...(googleCategory(p) !== undefined ? { google_product_category: googleCategory(p) } : {}),
    ...(p.collection_slugs?.[0] ? { product_type: p.condition === "Preloved" ? `Preloved > ${p.collection_slugs[0]}` : p.collection_slugs[0] } : {}),
    ...(metals.length ? { material: metalsLabel(metals, lang) } : {}),
    ...(size ? { size } : {}),
  };
  void productDescription; // the feed deliberately does NOT use the page's cross-language fallback (see the header)
  return { item };
}

/** Every input row becomes an item or a recorded exclusion; the first row of a slug wins, later repeats are `duplicate_slug`. */
export function buildFeed(products: readonly Product[], lang: FeedLang, base: string, identifiers: IdentifierRule): FeedBuild {
  const items: FeedItem[] = [];
  const excluded: FeedExclusion[] = [];
  const membership: FeedMembership[] = [];
  const seen = new Set<string>();
  for (const p of products) {
    const slug = text(p.slug) ?? null;
    if (slug && seen.has(slug)) { excluded.push({ slug, reason: "duplicate_slug" }); membership.push({ slug, outcome: "duplicate_slug" }); continue; }
    if (slug) seen.add(slug);
    const r = feedItem(p, lang, base, identifiers);
    if ("item" in r) { items.push(r.item); membership.push({ slug, outcome: "item" }); }
    else { excluded.push(r.excluded); membership.push({ slug, outcome: r.excluded.reason }); }
  }
  return { items, excluded, membership };
}

/**
 * MC-G10 / MC-G11: the feed is complete or it is not served. EXACT membership: the slugs accounted for by the
 * build (items + exclusions) and the catalog's slug list must be the same set — nothing missing, nothing extra,
 * nothing repeated on either side, no row without a slug — and the feed must have at least one item. When the
 * caller has an authoritative total (none exists in the Website API today; OD-MC-12), the catalog list must be
 * exactly that long. Returns the problems; an empty list means the route may serve the feed.
 */
export function reconcile(build: FeedBuild, catalogSlugs: readonly string[], { authoritativeTotal }: { authoritativeTotal?: number | null } = {}): string[] {
  const problems: string[] = [];
  const few = (xs: string[]) => xs.slice(0, 3).join(", ");
  const expectedList = catalogSlugs.map((s) => text(s)).filter((s): s is string => s !== undefined);
  const expected = new Set(expectedList);
  if (expectedList.length !== catalogSlugs.length) problems.push(`${catalogSlugs.length - expectedList.length} blank slug(s) in the catalog list`);
  if (expected.size !== expectedList.length) problems.push(`${expectedList.length - expected.size} repeated slug(s) in the catalog list`);
  if (expected.size === 0) problems.push("the catalog slug list is empty");
  if (typeof authoritativeTotal === "number" && authoritativeTotal !== catalogSlugs.length) problems.push(`the catalog list has ${catalogSlugs.length} slug(s) but the authoritative total is ${authoritativeTotal}`);
  const noSlug = build.membership.filter((m) => m.slug === null).length;
  if (noSlug) problems.push(`${noSlug} input row(s) without a slug`);
  const dupes = build.membership.filter((m) => m.outcome === "duplicate_slug").map((m) => m.slug as string);
  if (dupes.length) problems.push(`${dupes.length} repeated slug(s) in the catalog read, e.g. ${few(dupes)}`);
  const have = new Set(build.membership.map((m) => m.slug).filter((s): s is string => s !== null));
  if (build.items.length === 0) problems.push("the feed has no items");
  const missing = expectedList.filter((s) => !have.has(s));
  if (missing.length) problems.push(`${missing.length} catalog slug(s) unaccounted for, e.g. ${few(missing)}`);
  const extra = [...have].filter((s) => !expected.has(s));
  if (extra.length) problems.push(`${extra.length} slug(s) in the feed read but not in the catalog list, e.g. ${few(extra)}`);
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
    tag("g:condition", i.condition), ...(i.brand ? [tag("g:brand", i.brand)] : []), ...(i.gtin ? [tag("g:gtin", i.gtin)] : []), ...(i.mpn ? [tag("g:mpn", i.mpn)] : []),
    ...(i.identifier_exists ? [tag("g:identifier_exists", i.identifier_exists)] : []),
    ...(i.google_product_category !== undefined ? [tag("g:google_product_category", i.google_product_category)] : []),
    ...(i.product_type ? [tag("g:product_type", i.product_type)] : []), ...(i.material ? [tag("g:material", i.material)] : []), ...(i.size ? [tag("g:size", i.size)] : []),
    "</item>",
  ].join(""));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>${tag("title", args.title)}${tag("link", args.link)}${tag("description", args.description)}${items.join("\n")}</channel></rss>\n`;
}

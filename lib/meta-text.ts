/**
 * Search-result text for pages whose words come from the Hub (launch pass,
 * 2026-10-02). Google shows about 60 characters of a title and about 160 of a
 * description; the crawl found product titles up to 93 characters (before the
 * " | Cha Jewels" suffix), descriptions up to 304, and pearl / bracelet pages
 * with no description at all.
 */

const SUFFIX = " | Cha Jewels";
const TITLE_MAX = 60;
const DESC_MAX = 160;

/** Cut at a word (or, in Japanese, a character) and add an ellipsis. */
export function clampText(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:、。・-]+$/u, "") + "…";
}

/**
 * The product <title>. Short names keep the site template ("Name | Cha Jewels");
 * a name too long for the suffix is shown alone (absolute), so the piece's own
 * words are what fits in the search result, never "… | Cha Jewels".
 *
 * THE SKU GOES LAST (SEO Step 1). Hub names begin with the SKU ("R1013 Ring
 * K18WG"), which spends the first characters of a result on a code nobody
 * searches for. When — and only when — the name starts with this product's own
 * SKU followed by a space, the <title> reads "Ring K18WG (R1013)". The Hub
 * name, the URL slug and the page's H1 are untouched; this is the tag only. A
 * name that does not start with its SKU is left exactly as it is, and the SKU
 * is never added to a name that did not carry it.
 */
export function productTitle(name: string, sku?: string | null): string | { absolute: string } {
  const n = productTitleText(name, sku);
  return n.length + SUFFIX.length <= TITLE_MAX ? n : { absolute: n };
}

function productTitleText(name: string, sku?: string | null): string {
  const n = name.trim();
  const code = sku?.trim();
  if (!code || n.length <= code.length + 1) return n;
  if (n.slice(0, code.length).toLowerCase() !== code.toLowerCase() || !/\s/.test(n[code.length])) return n;
  const rest = n.slice(code.length).trim();
  return rest ? `${rest} (${n.slice(0, code.length)})` : n;
}

/**
 * English category / collection <title>. The Hub's names are one or two words
 * ("Rings", "Pearls"), which makes a thin result, so for the jewelry-type
 * collections and the Fine Jewelry category — pages whose visible content is
 * jewelry of exactly that kind — the title names what the page is. Any other
 * page, any other language and any name the Hub has already made long keep the
 * Hub's name unchanged. Nothing is claimed beyond what the page shows: no
 * metal, origin or condition.
 */
const JEWELRY_TYPE_COLLECTIONS = new Set(["rings", "necklaces", "pendants", "bracelets", "earrings", "anklets", "pearls"]);
export function listingTitle(kind: "collection" | "category", slug: string, name: string, lang: "ja" | "en"): string {
  const n = name.trim();
  if (lang !== "en" || n.length >= 20) return n;
  if (kind === "collection" && JEWELRY_TYPE_COLLECTIONS.has(slug)) return `${n}: Jewelry Collection from Tokyo`;
  if (kind === "category" && slug === "fine-jewelry") return `${n}: Gold, Pearl, Diamond and Gemstone`;
  return n;
}

/** The product description: the Hub's text clamped, else a plain line from the name. */
export function productMetaDescription(name: string, description: string | null, lang: "ja" | "en"): string {
  const d = description?.trim();
  if (d) return clampText(d, DESC_MAX);
  const fallback = lang === "ja"
    ? `${name.trim()}。Cha Jewels（東京）から世界中へ配送。`
    : `${name.trim()} at Cha Jewels, Tokyo. Shipping worldwide.`;
  return clampText(fallback, DESC_MAX);
}

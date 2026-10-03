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
 * words are what fits in the search result, never "… | Cha Jew…".
 */
export function productTitle(name: string): string | { absolute: string } {
  const n = name.trim();
  return n.length + SUFFIX.length <= TITLE_MAX ? n : { absolute: n };
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

import { siteUrl } from "@/lib/site";
import { localePath, type Locale } from "@/lib/locale";
import { LAYAWAY_LANGS } from "@/lib/layaway-availability";
import { STATIC_PAGES } from "@/lib/sitemap-pages";
import { categoryName, collectionName } from "@/lib/catalog-i18n";
import type { Category, Collection } from "@/lib/types";

/**
 * llms.txt — THE SITE SUMMARY FOR AI ASSISTANTS (Master Plan PHASE 6 add-on,
 * owner decision 2026-10-31, PR #454). Built by this pure function and served
 * by app/llms.txt/route.ts as text/plain.
 *
 * What the owner's rules allow, and how each is kept by construction:
 *  - ONLY PUBLIC PAGES THAT ARE IN THE SITEMAP: the static list is the sitemap's
 *    own (lib/sitemap-pages.ts), the locale homes and /en/layaway follow the
 *    sitemap's rules (LAYAWAY_LANGS), and collections and categories are the
 *    same Hub rows app/sitemap.ts lists. Every URL goes through `localePath`,
 *    so a private, unknown or Japanese-layaway URL cannot be minted.
 *    tests/llms-txt.test.mjs proves every link is a sitemap entry.
 *  - NO PRODUCT LIST, PRICES, STOCK, POINTS OR ANY FIGURE: nothing numeric is
 *    written here; collections and categories are named, pieces are not.
 *  - JAPANESE PAGES NEVER LINK TO LAYAWAY: the Japanese section is built from
 *    the same lists minus layaway, because `localePath("/layaway", "ja")` does
 *    not exist and LAYAWAY_LANGS is English only.
 *  - WORDING follows "Terminology" (check:terms scans this file): purity is
 *    "K18 gold"; "authenticated in Japan" / "hallmark checked in Japan" are the
 *    approved service phrases; no origin claim, no country-branded gold.
 *  - It changes nothing else: robots.txt, the sitemap, canonicals and hreflang
 *    are untouched. Unofficial (llmstxt.org); Google Search does not use it.
 *
 * The collection and category names are the Hub's (read through catalog-i18n,
 * never a raw column), so a renamed collection renames here on the next read.
 * A Hub read that fails costs those two sections only: the static pages are
 * still listed, and the file is never an error page.
 */
export type LlmsInput = { collections: readonly Pick<Collection, "slug" | "name" | "name_en" | "name_ja">[]; categories: readonly Pick<Category, "slug" | "name" | "name_ja">[] };

/** Short page labels per language. Only the pages lib/sitemap-pages.ts and the sitemap list. */
const LABELS: Readonly<Record<string, Record<Locale, string>>> = {
  "/": { en: "Home", ja: "ホーム" },
  "/sale": { en: "Sale", ja: "セール" },
  "/loyalty": { en: "Loyalty programme", ja: "会員プログラム" },
  "/wholesale": { en: "Wholesale", ja: "卸売" },
  "/faq": { en: "FAQ", ja: "よくある質問" },
  "/jewelry-guide": { en: "Jewelry guide (ring sizes, necklace lengths, clasps, metal stamps, diamond 4C, care)", ja: "ジュエリーガイド（リングサイズ、ネックレスの長さ、留め具、刻印、ダイヤモンドの4C、お手入れ）" },
  "/shopping-guide": { en: "Shopping guide (ordering, payment, shipping, returns)", ja: "ショッピングガイド（ご注文、お支払い、配送、返品）" },
  "/about": { en: "About Cha Jewels", ja: "私たちについて" },
  "/why-cha-jewels": { en: "Why Cha Jewels", ja: "Cha Jewelsが選ばれる理由" },
  "/contact": { en: "Contact", ja: "お問い合わせ" },
  "/affiliations": { en: "Affiliations and registrations", ja: "所属・登録" },
  "/legal/privacy": { en: "Privacy policy", ja: "プライバシーポリシー" },
  "/legal/terms": { en: "Terms of service", ja: "利用規約" },
  "/legal/returns": { en: "Return, cancellation and refund policy", ja: "返品・キャンセル・返金ポリシー" },
  "/legal/tokusho": { en: "Specified Commercial Transactions Act notice", ja: "特定商取引法に基づく表記" },
  "/blog": { en: "Blog", ja: "ブログ" },
  "/layaway": { en: "Layaway (English site only)", ja: "分割予約" },
};

const esc = (s: string) => s.replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim();
const line = (label: string, url: string) => `- [${esc(label)}](${url})`;

/** The list of links for one language, in the sitemap's own order: home, static pages, layaway (where offered), categories, collections. */
export function llmsLinks(lang: Locale, input: LlmsInput, base: string = siteUrl()): { label: string; url: string }[] {
  const at = (path: string) => `${base}${localePath(path, lang)}`;
  const out: { label: string; url: string }[] = [{ label: LABELS["/"][lang], url: at("/") }];
  for (const { path } of STATIC_PAGES) out.push({ label: LABELS[path]?.[lang] ?? path, url: at(path) });
  if (LAYAWAY_LANGS.includes(lang)) out.push({ label: LABELS["/layaway"][lang], url: at("/layaway") });
  for (const c of input.categories) if (c.slug?.trim()) out.push({ label: categoryName(c, lang), url: at(`/categories/${c.slug.trim()}`) });
  for (const c of input.collections) if (c.slug?.trim()) out.push({ label: collectionName(c, lang), url: at(`/collections/${c.slug.trim()}`) });
  return out;
}

export function buildLlmsTxt(input: LlmsInput, base: string = siteUrl()): string {
  const en = llmsLinks("en", input, base);
  const ja = llmsLinks("ja", input, base);
  return [
    "# Cha Jewels",
    "",
    "> Cha Jewels Co., Ltd. is a jewelry company in Katsushika-ku, Tokyo, selling K18 gold, platinum, Akoya pearl and diamond jewelry, and preloved branded pieces that are authenticated and hallmark checked in Japan. The site is in English and Japanese; orders ship from Tokyo to customers worldwide. Wholesale is offered to trade customers. Layaway is offered on the English site only.",
    "",
    "Prices, stock and product details live on the product pages and change often; they are not repeated here. Product data is published by the Cha Jewels Hub, the single source of truth for the catalog.",
    "",
    "## English pages",
    "",
    ...en.map((l) => line(l.label, l.url)),
    "",
    "## 日本語ページ",
    "",
    ...ja.map((l) => line(l.label, l.url)),
    "",
  ].join("\n");
}

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { hub } from "@/lib/hub-api";
import { localePath, type Locale } from "@/lib/locale";
import { LAYAWAY_LANGS } from "@/lib/layaway-availability";
import { gatherSitemapData, isListablePost } from "@/lib/sitemap-data";
import { PAGE_LASTMOD } from "@/lib/page-lastmod.generated";
import { primaryImage } from "@/lib/product-facts";
import { STATIC_PAGES } from "@/lib/sitemap-pages";

/**
 * THE LOCALE SITEMAP (Phase 2D, owner-approved 2026-10-28).
 *
 * Every public page is listed at its /ja and /en URLs — the self-canonical
 * locale pages of Phase 2B — and NOT at its bare legacy URL, which Phase
 * 2E-stage-1 answers with a 307 to one of them. A sitemap lists canonical
 * URLs, never redirects.
 *
 * THE ROOT IS THE ONE EXCEPTION: `/` stays unchanged until its own Phase 2E
 * decision (OD-3), and it stays listed beside `/ja` and `/en` exactly as it is
 * listed today (owner approved, map §20.3), with its temporary duplication of
 * the home page until OD-3.
 *
 * NO HREFLANG HERE (OD-12, approved): the alternates live in the HTML only, one
 * source of truth (lib/locale-meta.ts). Entries carry no `alternates`.
 *
 * <lastmod> AND IMAGES (SEO Step 1, Master Plan §33.3e). A date appears only
 * where a real content-change timestamp exists: a Hub post's own `updated_at`
 * (an editor's last edit), the blog index's newest listed post, and — for the two pages
 * whose whole text is one repository file — that file's last Git change
 * (lib/page-lastmod.generated.ts). Never the build time, never today. Everything
 * else (collections and categories: the Hub sends no modification time;
 * pages whose words are spread across shared files) carries NO lastmod.
 * Product entries add the piece's primary photo as an image-sitemap entry, only
 * from the Hub's own absolute https image URL; no photo, no image tag.
 *
 * EVERY URL BUILT HERE GOES THROUGH `localePath`, so this file cannot mint a
 * private, unknown or not-yet-live locale URL: `/en/layaway` (Phase 3) and
 * `/ja/layaway` (never) are impossible by construction, not by care.
 *
 * THE STATIC PAGE LIST lives in lib/sitemap-pages.ts (shared with llms.txt,
 * lib/llms-txt.ts, so the two can never advertise different pages).
 */
/** Japanese first: the site's primary language. */
const ORDER: readonly Locale[] = ["ja", "en"];


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  // DP-15: every essential Hub read is typed ok/failed in lib/sitemap-data.ts. A
  // failed read THROWS (SitemapUnavailable) rather than becoming an empty list;
  // a successful empty list is data. The product-photo catalog is optional.
  const { cols, cats, prods, posts, langs, catalog } = await gatherSitemapData();
  const photo = new Map<string, string>();
  for (const p of Array.isArray(catalog) ? catalog : []) {
    let url: unknown;
    try { url = primaryImage(p)?.url; } catch { continue; } // a malformed row has no photo, nothing more
    if (p.slug && typeof url === "string" && /^https:\/\/\S+$/.test(url)) photo.set(p.slug, url);
  }

  /** One resource in both languages. */
  const both = (path: string, rest: Omit<MetadataRoute.Sitemap[number], "url">) =>
    ORDER.map((l) => ({ url: `${base}${localePath(path, l)}`, ...rest }));

  /**
   * POSTS: listed per language, only where the post page answers 200 in it.
   *
   * A post may have words in one language only (finding F2), and the Hub's list
   * route sends no bodies (lib/posts.ts), so the list cannot say which. Each
   * post is asked through `postLanguages` — the same predicate the language
   * switcher uses, one cached Hub read per post — so this file cannot advertise
   * a /ja/blog URL for an English-only post. A 404 is a successful absence; a
   * FAILED read fails the whole sitemap (DP-15), it is never a silent omission.
   *
   * LAYAWAY-ONLY POSTS STAY UNLISTED, as before 2D. Their /en pages do answer
   * 200, but layaway indexability is Phase 3, not this phase. `published` is
   * normally absent (the list route returns published rows only); an explicit
   * `false` is refused rather than trusted away.
   */
  const listable = posts.filter(isListablePost);
  const newestPost: Partial<Record<Locale, string>> = {};
  const postEntries = (
    await Promise.all(
      listable.map(async (p) => {
        const slug = p.slug.trim();
        const has = langs.get(slug) ?? { en: false, ja: false };
        // The last EDIT when the Hub records one; otherwise the day it went up.
        // A post that has never been edited has not been modified since.
        const lastModified = p.updated_at?.trim() || p.published_at;
        return ORDER.filter((l) => has[l])
          .map((l) => {
            // The blog index changes when its newest post does.
            const seen = newestPost[l];
            if (lastModified && !Number.isNaN(Date.parse(lastModified)) && (!seen || Date.parse(lastModified) > Date.parse(seen))) newestPost[l] = lastModified;
            return { url: `${base}${localePath(`/blog/${slug}`, l)}`, lastModified, changeFrequency: "monthly" as const, priority: 0.5 };
          });
      }),
    )
  ).flat();

  return [
    // The root, unchanged until OD-3 (see the header), then both locale homes.
    { url: base, changeFrequency: "daily", priority: 1 },
    ...both("/", { changeFrequency: "daily", priority: 1 }),
    ...STATIC_PAGES.flatMap(({ path, ...rest }) => ORDER.map((l) => {
      // Blog index: the newest post listed in THIS language; any other page: its
      // content file's Git date when it has one; otherwise no lastmod at all.
      const lastModified = path === "/blog" ? newestPost[l] : PAGE_LASTMOD[path];
      return { url: `${base}${localePath(path, l)}`, ...(lastModified ? { lastModified } : {}), ...rest };
    })),
    // LAYAWAY (Phase 3): listed in every language it is offered in — which is
    // English alone (LAYAWAY_LANGS, the one gate) — so /en/layaway and nothing
    // else. `localePath` can only produce the English URL for this family
    // (lib/locale.ts), so a /ja entry is impossible by construction twice over;
    // the bare /layaway is cookie-decided and 404s for a crawler, so it is never
    // listed. Layaway-only posts stay unlisted (a separate decision).
    ...LAYAWAY_LANGS.map((l) => ({ url: `${base}${localePath("/layaway", l)}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...postEntries,
    // Products, categories and collections exist in both languages: their pages
    // decide 200 or 404 on the slug alone, never on the language (OD-9 neutral-
    // text eligibility, approved).
    ...cats.flatMap((c) => both(`/categories/${c.slug}`, { changeFrequency: "daily", priority: 0.8 })),
    ...cols.flatMap((c) => both(`/collections/${c.slug}`, { changeFrequency: "daily", priority: 0.8 })),
    // NO lastmod on products. The Hub's `updated_at` is a row-level trigger on
    // website_products: it moves on administrative and Page365-sync writes that
    // change nothing a visitor sees, and it does NOT move when a price, stock
    // level or photo changes (those live in the variant and media tables). It is
    // not a public-content modification time, so it is not reported as one.
    // Each slug once, even if the Hub list repeats it.
    ...[...new Set(prods.map((p) => p.slug))].flatMap((slug) => both(`/products/${slug}`, { changeFrequency: "weekly", priority: 0.7, ...(photo.has(slug) ? { images: [photo.get(slug)!] } : {}) })),
  ];
}

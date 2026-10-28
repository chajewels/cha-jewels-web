import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { hub } from "@/lib/hub-api";
import { localePath, type Locale } from "@/lib/locale";
import { postLanguages } from "@/lib/posts";

/**
 * THE LOCALE SITEMAP (Phase 2D, owner-approved 2026-10-28).
 *
 * Every public page is listed at its /ja and /en URLs — the self-canonical
 * locale pages of Phase 2B — and NOT at its bare legacy URL, which Phase
 * 2E-stage-1 answers with a 307 to one of them. A sitemap lists canonical
 * URLs, never redirects.
 *
 * THE ROOT IS THE ONE EXCEPTION (map §7 (c), approved): `/` stays unchanged
 * until its own Phase 2E decision (OD-3), so it is listed beside `/ja` and
 * `/en`, accepting the temporary duplication of the home page.
 *
 * NO HREFLANG HERE (OD-12, approved): the alternates live in the HTML only, one
 * source of truth (lib/locale-meta.ts). Entries carry no `alternates`.
 *
 * EVERY URL BUILT HERE GOES THROUGH `localePath`, so this file cannot mint a
 * private, unknown or not-yet-live locale URL: `/en/layaway` (Phase 3) and
 * `/ja/layaway` (never) are impossible by construction, not by care.
 */
type Freq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

/** Japanese first: the site's primary language. */
const ORDER: readonly Locale[] = ["ja", "en"];

/**
 * The static public pages, each of which has an `app/[lang]` route that answers
 * 200 in both languages (tests/seo-sitemap.test.mjs holds this list to the
 * route files). /sale answers 200 even with nothing on sale (its empty state);
 * /legal/tokusho in both languages (only its layaway lines vary). The
 * /collections index has a route but was never listed, and 2D changes the URL
 * form of the entries, not which pages are advertised.
 *
 * /layaway is NOT here, and that is not an oversight: it is English-only and
 * its locale route is Phase 3. Its bare URL 404s in Japanese — the language a
 * crawler is served — so it was never listable either.
 */
const STATIC_PAGES: readonly { path: string; changeFrequency: Freq; priority: number }[] = [
  { path: "/sale", changeFrequency: "daily", priority: 0.8 },
  { path: "/loyalty", changeFrequency: "monthly", priority: 0.7 },
  { path: "/wholesale", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/jewelry-guide", changeFrequency: "monthly", priority: 0.6 },
  { path: "/shopping-guide", changeFrequency: "monthly", priority: 0.6 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
  { path: "/why-cha-jewels", changeFrequency: "yearly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/affiliations", changeFrequency: "yearly", priority: 0.4 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/returns", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/tokusho", changeFrequency: "yearly", priority: 0.3 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [cols, cats, prods, posts] = await Promise.all([
    hub.collections().catch(() => []),
    hub.categories().catch(() => []),
    hub.productSlugs().catch(() => []),
    // Tag "content", like every other editorial read, so a post published in
    // the Hub appears here on the next revalidateTag rather than the next
    // deploy. Caught like its three neighbours: a sitemap is a hint, and the
    // one thing worse than an incomplete one is /sitemap.xml returning a 500 to
    // the crawler that came for it. It self-heals — the next content change
    // busts the tag and rebuilds this.
    hub.posts().catch(() => []),
  ]);

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
   * a /ja/blog URL for an English-only post. A failed read answers neither
   * language: the post is left out, never listed as a guess.
   *
   * LAYAWAY-ONLY POSTS STAY UNLISTED, as before 2D. Their /en pages do answer
   * 200, but layaway indexability is Phase 3, not this phase. `published` is
   * normally absent (the list route returns published rows only); an explicit
   * `false` is refused rather than trusted away.
   */
  const listable = posts.filter((p) => p.slug?.trim() && p.layaway_only !== true && p.published !== false);
  const postEntries = (
    await Promise.all(
      listable.map(async (p) => {
        const slug = p.slug.trim();
        const has = await postLanguages(slug).catch(() => ({ en: false, ja: false }));
        // The last EDIT when the Hub records one; otherwise the day it went up.
        // A post that has never been edited has not been modified since.
        const lastModified = p.updated_at?.trim() || p.published_at;
        return ORDER.filter((l) => has[l])
          .map((l) => ({ url: `${base}${localePath(`/blog/${slug}`, l)}`, lastModified, changeFrequency: "monthly" as const, priority: 0.5 }));
      }),
    )
  ).flat();

  return [
    // The root, unchanged until OD-3 (see the header), then both locale homes.
    { url: base, changeFrequency: "daily", priority: 1 },
    ...both("/", { changeFrequency: "daily", priority: 1 }),
    ...STATIC_PAGES.flatMap(({ path, ...rest }) => both(path, rest)),
    ...postEntries,
    // Products, categories and collections exist in both languages: their pages
    // decide 200 or 404 on the slug alone, never on the language (OD-9 neutral-
    // text eligibility, approved).
    ...cats.flatMap((c) => both(`/categories/${c.slug}`, { changeFrequency: "daily", priority: 0.8 })),
    ...cols.flatMap((c) => both(`/collections/${c.slug}`, { changeFrequency: "daily", priority: 0.8 })),
    ...prods.flatMap((p) => both(`/products/${p.slug}`, { lastModified: p.updated_at, changeFrequency: "weekly", priority: 0.7 })),
  ];
}

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { hub } from "@/lib/hub-api";
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

  /**
   * POSTS, MINUS THE LAYAWAY-ONLY ONES — the same trap as /layaway below, and
   * the reason that page is not listed either.
   *
   * A layaway post 404s in Japanese (lib/layaway-availability.ts), and a
   * crawler with no cj-lang cookie is served Japanese because Googlebot does
   * not send Accept-Language. Listing such a post would advertise a URL that
   * 404s for the only visitor that reads this file. Its ?lang=en form resolves
   * for a person, but its canonical is the bare path — the one that 404s — so
   * listing that does not help either.
   *
   * `published` is normally absent (the Hub's list route returns published rows
   * only); an explicit `false` is refused rather than trusted away.
   */
  const indexablePosts = posts.filter((p) => p.slug?.trim() && p.layaway_only !== true && p.published !== false);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    // /layaway is NOT listed, and this is not an oversight — read this before
    // "fixing" it.
    //
    // It 404s in Japanese (owner decision 2026-09-15). A crawler with no
    // cj-lang cookie falls through to Accept-Language, which Googlebot usually
    // does not send, so it is served Japanese and gets the 404. Listing
    // `/layaway` would therefore advertise a URL that 404s for the only visitor
    // that reads this file.
    //
    // `/layaway?lang=en` DOES resolve for any crawler (see LANG_PARAM) — but
    // listing that does not work either: its canonical is `/layaway` (we drop
    // ?lang deliberately, so the parameter does not mint a second indexable URL
    // per page), and that canonical is the URL which 404s. Pointing a crawler
    // at a page whose canonical is a 404 is worse than saying nothing.
    //
    // So the page is genuinely unindexable today, and the fix is not in this
    // file: English needs its own path (an /en/... prefix), which is a URL-
    // scheme decision, not a sitemap entry. Until that exists, share the
    // English page as a link — /layaway?lang=en works perfectly for a person.
    { url: `${base}/loyalty`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/wholesale`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/gold-guide`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/why-cha-jewels`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/affiliations`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/returns`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.6 },
    ...indexablePosts.map((p) => ({
      url: `${base}/blog/${p.slug.trim()}`,
      // The last EDIT when the Hub records one; otherwise the day it went up.
      // A post that has never been edited has not been modified since.
      lastModified: p.updated_at?.trim() || p.published_at,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...cats.map((c) => ({ url: `${base}/categories/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...cols.map((c) => ({ url: `${base}/collections/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...prods.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}

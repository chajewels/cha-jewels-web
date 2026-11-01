import { hub } from "@/lib/hub-api";
import { PREVIEW_FIXTURES } from "@/lib/fixtures-mode";
import { postLanguages, postLanguagesStrict } from "@/lib/posts";
import {
  DEFAULT_TIMING, LOOKUP_WAVE, SitemapUnavailable, essential, inWaves, strictSitemap, type Timing,
} from "@/lib/sitemap-reads";

/** How long the OPTIONAL product-photo read may take before the sitemap goes out without image tags. */
export const IMAGE_LOOKUP_TIMEOUT_MS = 10_000;

type Langs = { en: boolean; ja: boolean };
type Posts = Awaited<ReturnType<typeof hub.posts>>;

export type SitemapData = {
  cols: Awaited<ReturnType<typeof hub.collections>>;
  cats: Awaited<ReturnType<typeof hub.categories>>;
  prods: Awaited<ReturnType<typeof hub.productSlugs>>;
  posts: Posts;
  /** post slug → languages its page answers 200 in (only for listable posts) */
  langs: Map<string, Langs>;
  catalog: Awaited<ReturnType<typeof hub.allProducts>>;
};

/** The same rule app/sitemap.ts applies to the posts list. */
export const isListablePost = (p: Posts[number]) => !!p.slug?.trim() && p.layaway_only !== true && p.published !== false;

async function optionalCatalog(): Promise<SitemapData["catalog"]> {
  // OPTIONAL and separate: never retried, never part of the essential budget.
  try { return await hub.allProducts(5000, { timeout: IMAGE_LOOKUP_TIMEOUT_MS }); }
  catch { console.warn("sitemap-images-unavailable"); return []; }
}

/**
 * Gathers every Hub read the sitemap needs.
 *
 * STRICT (a real Hub is read — production AND the real-data preview): each
 * essential read must succeed; any failure throws SitemapUnavailable so the
 * build/revalidation fails instead of caching a truncated 200. A successful
 * empty list is accepted.
 * TOLERANT (fixtures flag, or no Hub off production): today's behaviour,
 * logged as `sitemap-fixture-mode`, covered by its own tests.
 */
export async function gatherSitemapData(opts: { strict?: boolean; timing?: Timing } = {}): Promise<SitemapData> {
  const strict = opts.strict ?? strictSitemap(process.env, PREVIEW_FIXTURES);
  const timing = opts.timing ?? DEFAULT_TIMING;

  if (!strict) {
    console.warn("sitemap-fixture-mode");
    const [cols, cats, prods, posts, catalog] = await Promise.all([
      hub.collections().catch(() => []), hub.categories().catch(() => []), hub.productSlugs().catch(() => []),
      hub.posts().catch(() => []), optionalCatalog(),
    ]);
    const langs = new Map<string, Langs>();
    await Promise.all(posts.filter(isListablePost).map(async (p) => { langs.set(p.slug.trim(), await postLanguages(p.slug.trim()).catch(() => ({ en: false, ja: false }))); }));
    return { cols, cats, prods, posts, langs, catalog };
  }

  const cancel = new Error("sitemap read cancelled");
  const ctl = new AbortController();
  const deadline = setTimeout(() => ctl.abort(new SitemapUnavailable(["deadline"])), timing.globalMs);
  const failed: string[] = [];
  const guard = async <T>(family: string, read: (s: AbortSignal) => Promise<T>, validate?: (v: T) => boolean): Promise<T | undefined> => {
    try { return await essential(read, ctl.signal, timing, validate); }
    catch (e) {
      if (e !== cancel && !(e instanceof SitemapUnavailable)) failed.push(family);
      if (!ctl.signal.aborted) ctl.abort(cancel); // fail fast: stop everything still running
      return undefined;
    }
  };
  try {
    const catalogP = optionalCatalog();
    const [cols, cats, prods, posts] = await Promise.all([
      guard("collections", (signal) => hub.collections({ signal })),
      guard("categories", (signal) => hub.categories({ signal })),
      guard("product-slugs", (signal) => hub.productSlugs({ signal })),
      guard("posts", (signal) => hub.posts(undefined, { signal })),
    ]);
    const langs = new Map<string, Langs>();
    if (posts && !ctl.signal.aborted) {
      await inWaves(posts.filter(isListablePost), LOOKUP_WAVE, async (p) => {
        const slug = p.slug.trim();
        const l = await guard(`post-language:${slug}`, (signal) => postLanguagesStrict(slug, signal), (v) => typeof v?.en === "boolean" && typeof v?.ja === "boolean");
        if (l) langs.set(slug, l);
      });
    }
    if (ctl.signal.aborted || failed.length || !cols || !cats || !prods || !posts) {
      throw new SitemapUnavailable(failed.length ? failed : ["deadline"]);
    }
    return { cols, cats, prods, posts, langs, catalog: await catalogP };
  } finally {
    clearTimeout(deadline);
  }
}

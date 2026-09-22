import "server-only";
import { cache } from "react";
import { hub } from "@/lib/hub-api";
import { layawayOffered } from "@/lib/layaway-availability";
import { renderMarkdown } from "@/lib/markdown";
import type { Lang } from "@/lib/i18n";
import type { HubPost, PostType } from "@/lib/types";

/**
 * EDITORIAL, FROM THE HUB. There is no second source any more.
 *
 * Until 2026-09-22 this merged the Hub's posts over a hand-edited array in
 * lib/blog.ts, so the site kept reading while the migration was half done. Both
 * posts are now in `website_posts` (owner-verified), docs/posts-seed.sql is the
 * record of how they got there, and the array is gone. What follows from that
 * is the important part: a Hub that cannot answer is an ERROR, not an empty
 * list — see the header of lib/hub-api.ts for why that is the safer failure.
 */
export type ViewPost = {
  slug: string;
  type: PostType;
  /** YYYY-MM-DD. The Hub may send a timestamp; only the date is ever used. */
  date: string;
  title: string;
  excerpt: string;
  cover: string | null;
  layawayOnly: boolean;
  /** Rendered HTML, from the Hub's markdown. */
  bodyHtml: string;
};

/** One fetch per request however many callers ask; the HTTP cache is in hub-api. */
const hubPosts = cache(async (): Promise<HubPost[]> => {
  const rows = await hub.posts();
  return Array.isArray(rows) ? rows : [];
});

const day = (value: string) => (typeof value === "string" ? value.slice(0, 10) : "");

const pick = (value: string | null | undefined): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

/**
 * A Hub row in this language, or null when it has no words in it.
 *
 * A TITLE AND A BODY ARE BOTH REQUIRED. A row with an English title and no
 * English body is a draft somebody saved, not a post — rendering its empty page
 * is worse than not listing it. The excerpt is allowed to be missing and falls
 * back to nothing; an excerpt is a convenience, a body is the post.
 */
function fromHub(row: HubPost, lang: Lang): ViewPost | null {
  if (!row || typeof row.slug !== "string" || !row.slug.trim()) return null;
  const title = pick(lang === "ja" ? row.title_ja : row.title_en);
  const body = pick(lang === "ja" ? row.body_ja : row.body_en);
  if (!title || !body) return null;
  return {
    slug: row.slug.trim(),
    type: row.type === "news" ? "news" : "article",
    date: day(row.published_at),
    title,
    excerpt: pick(lang === "ja" ? row.excerpt_ja : row.excerpt_en) ?? "",
    cover: typeof row.cover_url === "string" && row.cover_url.trim() ? row.cover_url.trim() : null,
    layawayOnly: row.layaway_only === true,
    bodyHtml: renderMarkdown(body),
  };
}

/**
 * Every post this language may read, newest first.
 *
 * `type` narrows to one kind. The LAYAWAY RULE is applied here rather than at
 * each call site for the reason lib/layaway-availability.ts states: a rule
 * spread across pages is one somebody half-removes.
 */
export async function merge(lang: Lang, type?: PostType): Promise<ViewPost[]> {
  return (await hubPosts())
    .flatMap((row) => {
      const view = fromHub(row, lang);
      return view ? [view] : [];
    })
    .filter((p) => !p.layawayOnly || layawayOffered(lang))
    .filter((p) => !type || p.type === type)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

/**
 * One post, or null when this language may not read it.
 *
 * Goes through merge() rather than hub.post() so the language rule and the
 * layaway rule are decided in exactly one place. The list page and the post
 * page cannot disagree about what exists.
 */
export async function getPost(slug: string, lang: Lang): Promise<ViewPost | null> {
  return (await merge(lang)).find((p) => p.slug === slug) ?? null;
}

/**
 * Every slug the Hub knows, for generateStaticParams — in BOTH languages and
 * without the layaway filter, because a param list is about which URLs exist,
 * not about who may read them. The page itself 404s a reader who may not.
 */
export async function allPostSlugs(): Promise<string[]> {
  const slugs = new Set<string>();
  for (const row of await hubPosts()) if (typeof row?.slug === "string" && row.slug.trim()) slugs.add(row.slug.trim());
  return [...slugs];
}

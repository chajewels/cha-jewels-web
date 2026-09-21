import "server-only";
import { cache } from "react";
import { hub } from "@/lib/hub-api";
import { posts as staticPosts, type Post as StaticPost } from "@/lib/blog";
import { layawayOffered } from "@/lib/layaway-availability";
import { renderMarkdown, renderParagraphs } from "@/lib/markdown";
import type { Lang } from "@/lib/i18n";
import type { HubPost, PostType } from "@/lib/types";

/**
 * ONE LIST OF POSTS, OUT OF TWO SOURCES, WHILE THE MIGRATION IS HALF DONE.
 *
 * Editorial is moving from this repo (lib/blog.ts, a hand-edited array) into
 * the Hub, where the owner can write one without a deploy. Both exist for now,
 * so both are read and merged:
 *
 *   THE HUB WINS BY SLUG. A Hub row named `what-k18-means` replaces the static
 *   post of that name entirely — title, excerpt, body, cover and flags. It does
 *   not merge field by field: half a post from each source is a page nobody
 *   reviewed, and "why is the title new but the body old" is not a question
 *   worth anyone's afternoon.
 *
 *   THE STATIC POSTS ARE THE FALLBACK. They stay readable when the Hub has no
 *   rows yet, and they stay readable when the Hub cannot answer at all — /blog
 *   is a public page and a content outage must not empty it.
 *
 * `source` marks which is which. It exists so PR 8 can delete lib/blog.ts and
 * this file's fallback branch together, and so a reviewer can tell at a glance
 * which posts are still waiting to be moved. It is NOT rendered.
 *
 * NOTHING HERE THROWS. A Hub failure is the static list, not a 500.
 */
export type PostSource = "hub" | "static";

/**
 * A post as the pages render it, already resolved to ONE language.
 *
 * Resolved rather than bilingual because the two sources disagree about what a
 * missing language is: a static post always has both, a Hub row may have only
 * one. Deciding that here means a page never has to ask.
 */
export type ViewPost = {
  slug: string;
  type: PostType;
  source: PostSource;
  /** YYYY-MM-DD. The Hub may send a timestamp; only the date is ever used. */
  date: string;
  title: string;
  excerpt: string;
  cover: string | null;
  layawayOnly: boolean;
  /** Rendered HTML. Markdown from the Hub, plain paragraphs from lib/blog.ts. */
  bodyHtml: string;
};

/** One fetch per request however many callers ask; the HTTP cache is in hub-api. */
const hubPosts = cache(async (): Promise<HubPost[]> => {
  try {
    const rows = await hub.posts();
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
});

const day = (value: string) => (typeof value === "string" ? value.slice(0, 10) : "");

const pick = (a: string | null | undefined, b: string | null | undefined): string | null => {
  for (const v of [a, b]) if (typeof v === "string" && v.trim()) return v.trim();
  return null;
};

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
  const title = lang === "ja" ? pick(row.title_ja, null) : pick(row.title_en, null);
  const body = lang === "ja" ? pick(row.body_ja, null) : pick(row.body_en, null);
  if (!title || !body) return null;
  return {
    slug: row.slug.trim(),
    type: row.type === "news" ? "news" : "article",
    source: "hub",
    date: day(row.published_at),
    title,
    excerpt: (lang === "ja" ? pick(row.excerpt_ja, null) : pick(row.excerpt_en, null)) ?? "",
    cover: typeof row.cover_url === "string" && row.cover_url.trim() ? row.cover_url.trim() : null,
    layawayOnly: row.layaway_only === true,
    bodyHtml: renderMarkdown(body),
  };
}

/** A lib/blog.ts post in this language. Both languages are always present. */
function fromStatic(post: StaticPost, lang: Lang): ViewPost {
  return {
    slug: post.slug,
    type: "article",
    source: "static",
    date: post.date,
    title: post.title[lang],
    excerpt: post.excerpt[lang],
    cover: null,
    layawayOnly: post.layawayOnly === true,
    bodyHtml: renderParagraphs(post.body[lang]),
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
  const rows = await hubPosts();
  const bySlug = new Map<string, ViewPost>();

  // Static first, so the Hub's own row overwrites it by slug rather than the
  // other way round. The order of these two loops IS the precedence rule.
  for (const p of staticPosts) bySlug.set(p.slug, fromStatic(p, lang));
  for (const row of rows) {
    const view = fromHub(row, lang);
    // A Hub row with nothing in this language does NOT delete the static post
    // it shadows: the reader would lose a page that still reads perfectly well
    // because someone started a translation and did not finish it.
    if (view) bySlug.set(view.slug, view);
  }

  return [...bySlug.values()]
    .filter((p) => !p.layawayOnly || layawayOffered(lang))
    .filter((p) => !type || p.type === type)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

/**
 * One post, or null when this language may not read it.
 *
 * Goes through merge() rather than hub.post() so the precedence, the language
 * rule and the layaway rule are decided in exactly one place. The list page and
 * the post page cannot disagree about what exists.
 */
export async function getPost(slug: string, lang: Lang): Promise<ViewPost | null> {
  return (await merge(lang)).find((p) => p.slug === slug) ?? null;
}

/**
 * Every slug either source knows, for generateStaticParams — in BOTH languages
 * and without the layaway filter, because a param list is about which URLs
 * exist, not about who may read them. The page itself 404s a reader who may
 * not, which is the behaviour lib/blog.ts already had.
 */
export async function allPostSlugs(): Promise<string[]> {
  const rows = await hubPosts();
  const slugs = new Set(staticPosts.map((p) => p.slug));
  for (const row of rows) if (typeof row?.slug === "string" && row.slug.trim()) slugs.add(row.slug.trim());
  return [...slugs];
}

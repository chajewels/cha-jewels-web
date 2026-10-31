import { notFound } from "next/navigation";
import { redirectLegacy } from "@/lib/legacy-redirect-server";
import type { Metadata } from "next";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { allPostSlugs, getPost } from "@/lib/posts";
import { JsonLd } from "@/components/site/json-ld";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { CommentsSection } from "@/components/blog/comments-section";
import { ShareBar } from "@/components/blog/share-bar";
import { postShareUrl } from "@/lib/share";
import { siteUrl } from "@/lib/site";

/**
 * EVERY SLUG THE HUB KNOWS, AND NEITHER LANGUAGE'S RULES. A param list says
 * which URLs exist, not who may read them — lib/posts.ts decides that per
 * request, and the page 404s a reader who may not. That is why a layaway post's
 * slug stays listed here and still 404s in Japanese.
 *
 * A Hub that cannot answer during the BUILD now fails the build, deliberately:
 * a deploy that quietly shipped an empty blog is the outcome this replaced.
 * `dynamicParams` is on by default, so a post published after the build is
 * still rendered on demand.
 */
export async function generateStaticParams() {
  return (await allPostSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const lang = await getLang();
  const p = await getPost((await params).slug, lang);
  if (!p) return {};
  const description = p.excerpt || undefined;
  // A shared article previews with its own cover, title and excerpt (owner
  // decision 2026-10-16); it showed the site logo before.
  //
  // A page-level openGraph REPLACES the root layout's whole — Next merges
  // metadata shallowly — so siteName and the locales are repeated here on
  // purpose. That includes the root's app/opengraph-image.png, which Next
  // attaches only at the root segment: an article without a cover has to name
  // it, or it would preview with no image at all.
  //
  // No `url` here: on the legacy path <SeoLinks /> (lib/page-meta.tsx) renders
  // og:url with the canonical's value, and on the locale tree localizedMeta
  // (lib/locale-meta.ts) adds it from the canonical. Setting it here too would
  // duplicate it on the legacy path.
  return {
    title: p.title,
    description,
    openGraph: {
      type: "article",
      siteName: "Cha Jewels",
      locale: lang === "ja" ? "ja_JP" : "en_US",
      alternateLocale: [lang === "ja" ? "en_US" : "ja_JP"],
      title: p.title,
      description,
      publishedTime: p.date,
      images: [{ url: p.cover ?? "/opengraph-image.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description,
      // Without its own images Next copies openGraph.images, the fallback included.
      images: p.cover ? [p.cover] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  // getPost applies the layaway rule, so a layaway post 404s where layaway is
  // not offered. The slug stays in generateStaticParams, so without this the
  // Japanese site would serve a Japanese layaway explainer it hides everywhere
  // else. It is also what answers a slug that only the other language has.
  const [{ slug }, lang] = await Promise.all([params, getLang()]);
  const p = await getPost(slug, lang);
  if (!p) notFound();
  // A bare URL that exists in its language answers a 307 to its locale page
  // (Phase 2E-stage-1; lib/legacy-redirect-server.ts). Never on a locale route.
  await redirectLegacy();
  const t = tr(lang);

  return (
    <article className="py-[clamp(48px,7vw,96px)]">
      <JsonLd type="post" post={{ slug: p.slug, title: p.title, excerpt: p.excerpt, date: p.date, cover: p.cover, lang }} />
      <div className="wrap max-w-[760px]">
        {/* Blog › this article (Phase 4): the visible trail and its BreadcrumbList
            from one array. Its "Blog" link is the way back to the list, which the
            underlined back link here used to be. */}
        <Breadcrumbs lang={lang} label={t("pdp", "breadcrumb")} className="text-xs text-charcoal/70 sm:text-[13px]" items={[{ name: t("nav", "blog"), path: "/blog" }, { name: p.title, path: `/blog/${p.slug}` }]} />
        {p.cover && (
          // Hub media may come from hosts next/image is not configured for.
          // The article's lead image, and the one image search can index for
          // it: its alt is the article's title (SEO Step 1). The blog LIST's
          // thumbnails stay alt="" — there the image sits beside a linked title
          // that already names it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover} alt={p.title} className="mt-6 aspect-[16/9] w-full rounded-sm border border-hairline object-cover" />
        )}
        {/* Formatted the same way the list formats it. It printed the raw
            YYYY-MM-DD before, which was tolerable when every date was typed
            into a file in this repo and reads as a machine value now that
            they arrive from the Hub. */}
        <time dateTime={p.date} className="mt-6 block text-xs text-charcoal/70">
          {new Date(p.date).toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
        </time>
        <h1 className="mt-2 text-[clamp(32px,4.5vw,64px)]">{p.title}</h1>
        {/* The body is rendered HTML from lib/markdown.ts, which escapes its
            input before parsing it — there is no path from a post body to a
            tag. `.post-body` in globals.css is what styles the elements it
            emits; nothing inside carries a class of its own except links. */}
        <div className="post-body mt-8" dangerouslySetInnerHTML={{ __html: p.bodyHtml }} />
        {/* Share bar under EVERY post, articles and news (owner S1–S7,
            2026-10-16), above the comments. The URL is the canonical one in
            the reader's language, built here because siteUrl() is server-side. */}
        <ShareBar url={postShareUrl(siteUrl(), p.slug, lang)} title={p.title} slug={p.slug} lang={lang} />
        {/* Comments under ARTICLES only (owner plan C1–C8, 2026-10-16); news
            posts take none. The Hub still decides whether the form is open. */}
        {p.type === "article" && <CommentsSection slug={p.slug} lang={lang} />}
      </div>
    </article>
  );
}

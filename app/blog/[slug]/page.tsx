import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { allPostSlugs, getPost } from "@/lib/posts";
import { JsonLd } from "@/components/site/json-ld";

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
  return p ? { title: p.title, description: p.excerpt || undefined } : {};
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  // getPost applies the layaway rule, so a layaway post 404s where layaway is
  // not offered. The slug stays in generateStaticParams, so without this the
  // Japanese site would serve a Japanese layaway explainer it hides everywhere
  // else. It is also what answers a slug that only the other language has.
  const [{ slug }, lang] = await Promise.all([params, getLang()]);
  const p = await getPost(slug, lang);
  if (!p) notFound();
  const t = tr(lang);

  return (
    <article className="py-[clamp(48px,7vw,96px)]">
      <JsonLd type="post" post={{ slug: p.slug, title: p.title, excerpt: p.excerpt, date: p.date, cover: p.cover, lang }} />
      <div className="wrap max-w-[760px]">
        <Link href="/blog" className="text-sm text-gold-dark underline underline-offset-4">{t("blog", "back")}</Link>
        {p.cover && (
          // Hub media may come from hosts next/image is not configured for.
          // Decorative: the <h1> below is the page's name, and an alt repeating
          // it is the title read twice.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover} alt="" className="mt-6 aspect-[16/9] w-full rounded-sm border border-hairline object-cover" />
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
      </div>
    </article>
  );
}

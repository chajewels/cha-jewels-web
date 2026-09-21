import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getPostFor, posts } from "@/lib/blog";
export function generateStaticParams() { return posts.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const lang = await getLang();
  const p = getPostFor((await params).slug, lang);
  return p ? { title: p.title[lang], description: p.excerpt[lang] } : {};
}
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  // getPostFor, not getPost: a layaway post 404s where layaway is not offered.
  // The slug stays in generateStaticParams, so without this the Japanese site
  // would serve a Japanese layaway explainer it hides everywhere else.
  const [{ slug }, lang] = await Promise.all([params, getLang()]);
  const p = getPostFor(slug, lang);
  if (!p) notFound();
  const t = tr(lang);
  return (
    <article className="surface-light bg-chalk text-charcoal-deep py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[760px]">
        <Link href="/blog" className="text-sm text-gold-dark underline underline-offset-4">{t("blog", "back")}</Link>
        <time dateTime={p.date} className="mt-6 block text-xs text-charcoal/70">{p.date}</time>
        <h1 className="mt-2 text-[clamp(32px,4.5vw,64px)]">{p.title[lang]}</h1>
        <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-charcoal-deep">{p.body[lang].map((para, i) => <p key={i}>{para}</p>)}</div>
      </div>
    </article>
  );
}

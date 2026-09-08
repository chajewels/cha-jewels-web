import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getPost, posts } from "@/lib/blog";
export function generateStaticParams() { return posts.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getPost((await params).slug); const lang = await getLang();
  return p ? { title: p.title[lang], description: p.excerpt[lang] } : {};
}
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const [p, lang] = await Promise.all([getPost((await params).slug), getLang()]);
  if (!p) notFound();
  const t = tr(lang);
  return (
    <article className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[760px]">
        <Link href="/blog" className="text-sm text-gold-pale underline underline-offset-4">{t("blog", "back")}</Link>
        <time dateTime={p.date} className="mt-6 block text-xs text-champagne/55">{p.date}</time>
        <h1 className="mt-2 text-[clamp(32px,4.5vw,64px)]">{p.title[lang]}</h1>
        <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-champagne/85">{p.body[lang].map((para, i) => <p key={i}>{para}</p>)}</div>
      </div>
    </article>
  );
}

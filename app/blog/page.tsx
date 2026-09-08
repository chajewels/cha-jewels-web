import type { Metadata } from "next";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { posts } from "@/lib/blog";
export const metadata: Metadata = { title: "ブログ / Blog" };
export default async function Blog() {
  const lang = await getLang();
  const t = tr(lang);
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        <h1 className="text-[clamp(36px,5.5vw,80px)]">{t("blog", "h1")}</h1>
        <ul className="mt-12 divide-y divide-[rgba(201,162,39,.16)] border-y border-rule-soft">
          {posts.map((p) => (
            <li key={p.slug} className="py-8">
              <time dateTime={p.date} className="text-xs text-champagne/55">{new Date(p.date).toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
              <h2 className="mt-2 text-[clamp(24px,2.6vw,36px)]"><Link href={`/blog/${p.slug}`} className="hover:text-gold-pale">{p.title[lang]}</Link></h2>
              <p className="mt-2 max-w-[62ch] text-champagne/75">{p.excerpt[lang]}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

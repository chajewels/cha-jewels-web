import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { merge } from "@/lib/posts";
import type { PostType } from "@/lib/types";

export const generateMetadata = () => pageMeta("blog");

/**
 * The post list, from lib/posts.ts — Hub rows over the static ones.
 *
 * `?type=news` is the Company menu's "News & Updates" entry. It is a FILTER on
 * one list rather than a second route: the posts are one table in the Hub and
 * one cache here, and splitting the page in two would mean two of everything
 * for a difference the reader sees as a heading.
 *
 * An unrecognised `type` is ignored rather than refused. /blog?type=nonsense is
 * a link someone mistyped, and the whole list is a better answer than an error.
 *
 * Nothing filters by language here: merge() already dropped what this language
 * cannot read — the layaway posts on Japanese, and any Hub row with no words in
 * it. The empty state is reachable on the default list too, not only under a
 * filter: a Hub with no Japanese posts is an ordinary Tuesday. It means "the
 * Hub published nothing for this reader", never "the Hub could not be reached"
 * — that second case throws now and never reaches this page.
 */
const asType = (value: string | undefined): PostType | undefined =>
  value === "news" || value === "article" ? value : undefined;

export default async function Blog({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const [lang, sp] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);
  const type = asType(sp.type);
  const posts = await merge(lang, type);

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        <h1 className="text-[clamp(36px,5.5vw,80px)]">{type === "news" ? t("navMenu", "news") : t("blog", "h1")}</h1>
        {type && (
          <p className="mt-4">
            <Link href="/blog" className="text-sm text-gold-dark underline underline-offset-4">{t("blog", "back")}</Link>
          </p>
        )}
        {posts.length === 0 ? (
          <p className="mt-12 border border-hairline p-6 text-charcoal">{t("blog", "empty")}</p>
        ) : (
          <ul className="mt-12 divide-y divide-hairline border-y border-hairline">
            {posts.map((p) => (
              <li key={p.slug} className="py-8 sm:flex sm:gap-6">
                {p.cover && (
                  // Hub media may come from hosts next/image is not configured
                  // for. Decorative: the title beside it is the link's name, so
                  // an alt would be the same words read twice.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt="" loading="lazy" className="mb-4 h-40 w-full shrink-0 rounded-sm border border-hairline object-cover sm:mb-0 sm:h-28 sm:w-44" />
                )}
                <div className="min-w-0">
                  <time dateTime={p.date} className="text-xs text-charcoal/70">
                    {new Date(p.date).toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                  <h2 className="mt-2 text-[clamp(24px,2.6vw,36px)]">
                    <Link href={`/blog/${p.slug}`} className="hover:text-gold-dark">{p.title}</Link>
                  </h2>
                  {p.excerpt && <p className="mt-2 max-w-[62ch] text-charcoal">{p.excerpt}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

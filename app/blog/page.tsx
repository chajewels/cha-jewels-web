import { pageMeta } from "@/lib/page-meta";
import { localePath } from "@/lib/locale";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { merge } from "@/lib/posts";
import type { PostType } from "@/lib/types";
import { Emblem } from "@/components/fx/emblem";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";

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

  const dateFmt = (d: string) => new Date(d).toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  return (
    <>
      <PageHead
        title={type === "news" ? t("navMenu", "news") : t("blog", "h1")}
        aside={<Emblem name={type === "news" ? "news" : "blog"} sm={96} lg={128} />}
      >
        {type && (
          <p className="mt-5">
            <Link href={localePath("/blog", lang)} className="lm-tag ic-backtag">{t("blog", "back")}</Link>
          </p>
        )}
      </PageHead>
      <PageSection tone="sheet">
        {posts.length === 0 ? (
          <p className="lm-plate lm-plate--bone text-charcoal">{t("blog", "empty")}</p>
        ) : (
          <ul className="ic-posts">
            {posts.map((p, i) => (
              <li key={p.slug} className={`ic-post lm-rise ${i === 0 ? "ic-post--lead" : ""}`}>
                <Link href={localePath(`/blog/${p.slug}`, lang)} className="ic-post__link">
                  <span className="ic-post__cover" aria-hidden={p.cover ? undefined : true}>
                    {p.cover ? (
                      // Hub media may come from hosts next/image is not configured
                      // for. Decorative: the title beside it is the link's name, so
                      // an alt would be the same words read twice.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover} alt="" loading="lazy" />
                    ) : (
                      <span className="ic-post__nocover" />
                    )}
                    <span className="ic-post__band"><span>{t("blog", "read")}</span></span>
                  </span>
                  <span className="ic-post__text">
                    <time dateTime={p.date} className="lm-tag">{dateFmt(p.date)}</time>
                    <span className="ic-post__title font-display">{p.title}</span>
                    {p.excerpt && <span className="ic-post__excerpt">{p.excerpt}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageSection>
    </>
  );
}

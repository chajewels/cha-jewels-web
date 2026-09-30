import Image from "next/image";
import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { isOptimizableImage } from "@/lib/image-hosts";
import type { Review } from "@/lib/reviews";

/**
 * APPROVED REVIEWS, AS CARDS (PR-R2).
 *
 * Everything shown is what the Hub sent for this language: the text (the
 * customer's own words on the English site, the owner-checked translation on
 * the Japanese one), the name as first name + last initial, the piece name as
 * staff wrote it, and the photos the owner approved. Nothing is trimmed or
 * rewritten; line breaks are kept (`whitespace-pre-line`).
 */

/** Five stars, `value` of them filled. The label carries the number. */
export function Stars({ value, lang, size = 16 }: { value: number; lang: Lang; size?: number }) {
  const rounded = Math.round(value);
  return (
    <span role="img" aria-label={tr(lang)("reviews", "stars", { n: String(value) })} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} className={n <= rounded ? "fill-gold text-gold-dark" : "fill-none text-charcoal/60"} stroke="currentColor" strokeWidth="1.5">
          <path strokeLinejoin="round" d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9L12 2.8z" />
        </svg>
      ))}
    </span>
  );
}

/** "4.8 (12 reviews)" beside the stars; a link to the list when `href` is given. */
export function ReviewSummary({ average, count, lang, href }: { average: number; count: number; lang: Lang; href?: string }) {
  const t = tr(lang);
  const avg = average.toFixed(1);
  const text = count === 1 ? t("reviews", "summaryOne", { avg }) : t("reviews", "summary", { avg, n: String(count) });
  const inner = (
    <>
      <Stars value={average} lang={lang} />
      <span className="text-sm text-charcoal/80">{text}</span>
    </>
  );
  return href
    ? <a href={href} className="inline-flex min-h-8 items-center gap-2 underline-offset-4 hover:underline">{inner}</a>
    : <span className="inline-flex items-center gap-2">{inner}</span>;
}

function monthYear(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "long", timeZone: "Asia/Tokyo" }).format(d);
}

export function ReviewCard({ review, lang, showPiece = true }: { review: Review; lang: Lang; showPiece?: boolean }) {
  const t = tr(lang);
  const when = monthYear(review.approved_at, lang);
  return (
    <article className="flex h-full flex-col gap-3 border border-hairline bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Stars value={review.rating} lang={lang} />
        {when && <time dateTime={review.approved_at} className="text-xs text-charcoal/70">{when}</time>}
      </div>
      <p className="whitespace-pre-line text-[15px] leading-[1.75] text-charcoal-deep">{review.body}</p>
      {review.photos.length > 0 && (
        <ul className="grid grid-cols-4 gap-2">
          {review.photos.slice(0, 4).map((src, i) => {
            const alt = t("reviews", "photoAlt", { name: review.display_name, n: String(i + 1) });
            return (
              <li key={src} className="relative aspect-square overflow-hidden border border-hairline bg-chalk">
                <a href={src} target="_blank" rel="noreferrer" className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark">
                  {isOptimizableImage(src)
                    ? <Image src={src} alt={alt} fill sizes="96px" className="object-cover" />
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />}
                </a>
              </li>
            );
          })}
        </ul>
      )}
      <footer className="mt-auto grid gap-0.5 border-t border-hairline pt-3 text-sm">
        <p className="font-semibold text-charcoal-deep">
          {review.display_name} <span className="ml-1 text-xs font-normal text-charcoal/70">· {t("reviews", "verified")}</span>
        </p>
        {showPiece && (review.product
          ? <Link href={`/products/${review.product.slug}`} className="text-gold-dark underline-offset-4 hover:underline">{review.piece_name}</Link>
          : <p className="text-charcoal/75">{review.piece_name}</p>)}
      </footer>
    </article>
  );
}

export function ReviewGrid({ reviews, lang, showPiece = true }: { reviews: Review[]; lang: Lang; showPiece?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {reviews.map((r) => <ReviewCard key={r.id} review={r} lang={lang} showPiece={showPiece} />)}
    </div>
  );
}

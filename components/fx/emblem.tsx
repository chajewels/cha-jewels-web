import { EmblemStyle } from "@/components/fx/emblem-style";

export type EmblemName = "faq" | "blog" | "news" | "affiliations";


/**
 * A PAGE EMBLEM — the gold medallion beside or above a page's title (FAQ,
 * Blog, News & Updates, Affiliations). Owner-supplied AI artwork, cut to a
 * circle with a transparent edge; the English words baked into it are
 * decoration, so the whole mark is hidden from assistive tech and has no alt:
 * the page's <h1> carries the title, in Japanese or English.
 *
 * A SUPPORTING MARK, NEVER THE LCP. Small (`sm` px on phones, `lg` from lg
 * up), explicit dimensions so nothing moves when it arrives, AVIF with a WebP
 * fallback at exactly 2× the displayed size (192/288 px files), and low fetch
 * priority, so the title always paints first.
 *
 * MOTION. On every arrival — first load and client navigation alike, since
 * it is a CSS animation on a freshly mounted element — it turns in like a
 * coin (EMBLEM.turn → 0, EMBLEM.from → 1) and one band of gold light crosses
 * it. Transform and an overlay only: it is never faded in, so it is on screen
 * from the first frame (the LCP rule). Reduced motion: static.
 *
 * A server component: no JavaScript ships for it.
 */
export function Emblem({ name, sm = 96, lg = 128, className = "" }: { name: EmblemName; sm?: number; lg?: number; className?: string }) {
  const set = (ext: "avif" | "webp") => `/images/emblems/${name}-192.${ext} 192w, /images/emblems/${name}-288.${ext} 288w`;
  const sizes = `(min-width: 1024px) ${lg}px, ${sm}px`;
  return (
    <span aria-hidden="true" className={`fx-emblem ${className}`} style={{ ["--em-sm" as string]: `${sm}px`, ["--em-lg" as string]: `${lg}px` }}>
      <EmblemStyle />
      <span className="fx-emblem-coin">
        <picture>
          <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
          <img src={`/images/emblems/${name}-288.webp`} srcSet={set("webp")} sizes={sizes} alt="" width={288} height={288} decoding="async" fetchPriority="low" />
        </picture>
      </span>
      <span className="fx-emblem-sweep" />
    </span>
  );
}

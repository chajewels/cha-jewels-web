import { Droplets, CircleSlash, Gem } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import { stampIllustrations, type GuideSection } from "@/lib/content/gold-guide";
import { ComponentStyle, mix } from "@/components/fx/component-style";

/**
 * The plates' rules, inline (components/fx/component-style.tsx says why) —
 * and deliberately not Tailwind arbitrary classes: those land in the global
 * stylesheet, and ~2.6 kB of them pushed Next to split the root CSS into a
 * third render-blocking file on every page (measured).
 */
const CSS = `
.gp { position: relative; height: 100%; width: 100%; overflow: hidden; border: 1px solid var(--c-gold); color: var(--c-chalk);
  background: radial-gradient(120% 80% at 30% 20%, ${mix("gold", 16)}, transparent 60%), var(--c-charcoal-deep); }
.gp-in { display: flex; height: 100%; flex-direction: column; justify-content: center; gap: 2.5rem; padding: clamp(24px, 4vw, 48px); }
.gp-k18 { font-size: clamp(88px, 11vw, 168px); line-height: 1; }
.gp-track { position: relative; height: 12px; overflow: hidden; background: color-mix(in srgb, var(--c-chalk) 15%, transparent); }
.gp-fill { position: absolute; top: 0; bottom: 0; left: 0; width: 75%; background: linear-gradient(90deg, var(--c-gold-dark), var(--c-gold) 55%, var(--c-gold-pale)); }
.gp-legend { margin-top: .75rem; display: flex; justify-content: space-between; gap: 1rem; font-size: .875rem; }
.gp-gold { color: var(--c-gold-pale); }
.gp-muted { color: color-mix(in srgb, var(--c-chalk) 75%, transparent); text-align: right; }
.gp-photo { display: flex; flex-direction: column; }
.gp-shot { position: relative; flex: 1 1 auto; min-height: 0; overflow: hidden; background: #fff; }
.gp-shot img, .gp-thumb img { position: absolute; inset: 0; height: 100%; width: 100%; object-fit: cover; }
.gp-shot img { object-position: 50% 58%; }
.gp-cap { position: absolute; right: 8px; bottom: 8px; z-index: 1; padding: 2px 8px; font-size: .6875rem; letter-spacing: .08em;
  color: var(--c-chalk); background: color-mix(in srgb, var(--c-charcoal-deep) 85%, transparent); }
.gp-foot { display: flex; align-items: center; gap: 1rem; padding: clamp(14px, 2vw, 22px) clamp(16px, 2.4vw, 28px); border-top: 1px solid var(--c-gold); }
.gp-thumb { position: relative; height: 84px; width: 84px; flex-shrink: 0; overflow: hidden; border: 1px solid ${mix("gold", 60)}; background: #fff; }
.gp-thumb img { object-position: 55% 58%; }
.gp-thumb .gp-cap { right: 0; bottom: 0; padding: 1px 4px; font-size: .5625rem; }
.gp-k { font-size: .75rem; text-transform: uppercase; letter-spacing: .14em; color: var(--c-gold-pale); }
.gp-v { margin-top: .125rem; color: color-mix(in srgb, var(--c-chalk) 85%, transparent); }
.gp-care { gap: 2rem; }
.gp-care > li { display: flex; align-items: flex-start; gap: 1rem; }
.gp-icon { display: grid; height: 44px; width: 44px; flex-shrink: 0; place-items: center; border-radius: 999px; border: 1px solid var(--c-gold); color: var(--c-gold-pale); }
.gp-big { margin-top: .25rem; font-size: clamp(20px, 2vw, 26px); line-height: 1.35; color: var(--c-chalk); }`;

const K18 = "/images/gold-guide/k18-clasp-illustration.webp";
const PT900 = "/images/gold-guide/pt900-clasp-illustration.webp";
/**
 * The Next image optimiser's own URL (next/image's default loader). `w` must be
 * one of next.config's deviceSizes/imageSizes: 96, 256 (imageSizes) and 640,
 * 828, 1200 (the default deviceSizes) are. It negotiates AVIF/WebP itself.
 */
const OPT = (src: string, w: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;

/**
 * One plate of the gold guide's scroll story (components/fx/guide-story.tsx):
 * a dark, gold-edged panel that SHOWS the step's facts rather than a
 * photograph standing in for them — there is no photograph of a hallmark or
 * of care in the library, and a stock ring beside "how to read the stamp"
 * would be decoration pretending to be information. Every word and figure on
 * a plate comes from the step's own facts (lib/content/gold-guide.ts) or the
 * dictionary, so the plate can never say something the page does not.
 *
 * Plates 0 and 2 are decorative for assistive tech (the caller marks them
 * aria-hidden): the same facts are read from the step's list beside them.
 * Plate 1 is not — its two illustrations carry alt text. Plate 0 is K18 (the
 * 75 / 25 bar), plate 1 the stamp (illustrations of a stamped clasp), and any
 * other step shows its facts as a list (care, today).
 */
export function GuidePlate({ i, sec, lang }: { i: number; sec: GuideSection; lang: Lang }) {
  const t = tr(lang);
  const style = <ComponentStyle id="fx-guide-plate" css={CSS} />;
  if (i === 0) {
    return (
      <div className="gp">
        {style}
        <div className="gp-in">
          <p className="gilt font-display gp-k18">K18</p>
          <div>
            <div className="gp-track"><span className="gp-fill fx-bar-gold" /></div>
            <div className="gp-legend">
              <span className="gp-gold">{t("gold", "plateGold")}</span>
              <span className="gp-muted">{t("gold", "plateAlloy")}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (i === 1) {
    // THE STAMP, SHOWN. Owner-supplied AI illustrations (2026-09-24), each
    // captioned "Illustration" and described as one — never as a Cha Jewels
    // piece or a certified item, and nothing here names who struck the
    // hallmark. They replace the typographic "K18 · 750" mark this plate
    // used to draw: the photograph shows the real thing, so the drawing only
    // repeated it. The platinum clasp is the comparison the step's own text
    // makes ("Platinum is marked PT900 or PT950"), so it sits beside that line.
    // Below the fold on every layout: lazy, and sized for the column it fills.
    // A plain <img> with a SHORT srcset, not <Image>: next/image lists ~20
    // widths per image, each image is here twice (pinned and inline) and the
    // page's RSC payload repeats both — 3.8 kB gz of HTML, measured +16 ms of
    // LCP on a slow phone. These are the only widths the plate can use (the
    // K18 master is 1200px wide), served by the same optimiser.
    const k18 = { src: OPT(K18, 828), srcSet: [640, 828, 1200].map((w) => `${OPT(K18, w)} ${w}w`).join(", "), sizes: "(min-width:1024px) 40vw, 100vw" };
    const pt900 = { src: OPT(PT900, 256), srcSet: [96, 256].map((w) => `${OPT(PT900, w)} ${w}w`).join(", "), sizes: "84px" };
    return (
      <figure className="gp gp-photo">
        {style}
        <div className="gp-shot fx-shot">
          {/* eslint-disable-next-line @next/next/no-img-element -- optimised through /_next/image (OPT) */}
          <img {...k18} alt={stampIllustrations.k18Alt[lang]} loading="lazy" decoding="async" />
          <span className="gp-cap" aria-hidden="true">{t("gold", "illustration")}</span>
        </div>
        <figcaption className="gp-foot">
          <span className="gp-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element -- optimised through /_next/image (OPT) */}
            <img {...pt900} alt={stampIllustrations.pt900Alt[lang]} loading="lazy" decoding="async" />
            <span className="gp-cap" aria-hidden="true">{t("gold", "illustration")}</span>
          </span>
          <span>
            <span className="gp-k block">{sec.facts[1].k[lang]}</span>
            <span className="gp-v block">{stampIllustrations.pt900Compare[lang]}</span>
          </span>
        </figcaption>
      </figure>
    );
  }
  const icons = [Droplets, CircleSlash, Gem];
  return (
    <div className="gp">
      {style}
      <ul className="gp-in gp-care fx-care">
        {sec.facts.map((f, k) => {
          const Icon = icons[k % icons.length];
          return (
            <li key={f.k.en} style={{ ["--i" as string]: k }}>
              <span className="gp-icon"><Icon className="h-5 w-5" /></span>
              <div>
                <p className="gp-k">{f.k[lang]}</p>
                <p className="font-display gp-big">{f.v[lang]}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

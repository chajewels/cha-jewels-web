import { Droplets, CircleSlash, Gem } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import type { GuideSection } from "@/lib/content/gold-guide";
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
.gp-center { align-items: center; text-align: center; }
.gp-stamp { border-radius: 999px; border: 2px solid var(--c-gold); padding: clamp(18px, 2.6vw, 30px) clamp(28px, 4vw, 48px);
  box-shadow: inset 0 3px 10px rgba(0,0,0,.7), 0 0 24px ${mix("gold", 25)}; }
.gp-mark { font-size: clamp(52px, 6vw, 88px); line-height: 1; letter-spacing: .1em; color: var(--c-gold-pale); text-shadow: 0 2px 0 rgba(0,0,0,.7), 0 -1px 0 ${mix("gold-pale", 35)}; }
.gp-fine { margin-top: .5rem; font-size: clamp(26px, 3vw, 40px); line-height: 1; letter-spacing: .35em; color: var(--c-gold-pale); text-shadow: 0 2px 0 rgba(0,0,0,.7); }
.gp-dl { display: grid; gap: .75rem; font-size: .875rem; }
.gp-k { font-size: .75rem; text-transform: uppercase; letter-spacing: .14em; color: var(--c-gold-pale); }
.gp-v { margin-top: .125rem; color: color-mix(in srgb, var(--c-chalk) 85%, transparent); }
.gp-care { gap: 2rem; }
.gp-care > li { display: flex; align-items: flex-start; gap: 1rem; }
.gp-icon { display: grid; height: 44px; width: 44px; flex-shrink: 0; place-items: center; border-radius: 999px; border: 1px solid var(--c-gold); color: var(--c-gold-pale); }
.gp-big { margin-top: .25rem; font-size: clamp(20px, 2vw, 26px); line-height: 1.35; color: var(--c-chalk); }`;

/**
 * One plate of the gold guide's scroll story (components/fx/guide-story.tsx):
 * a dark, gold-edged panel that SHOWS the step's facts rather than a
 * photograph standing in for them — there is no photograph of a hallmark or
 * of care in the library, and a stock ring beside "how to read the stamp"
 * would be decoration pretending to be information. Every word and figure on
 * a plate comes from the step's own facts (lib/content/gold-guide.ts) or the
 * dictionary, so the plate can never say something the page does not.
 *
 * Decorative for assistive tech (the caller marks it aria-hidden): the same
 * facts are read from the step's list beside it. Plate 0 is K18 (the 75 / 25
 * bar), plate 1 the struck stamp, and any other step shows its facts as a
 * list (care, today).
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
    // "K18 / 750" → the two lines of the struck mark.
    const [mark, fine] = sec.facts[0].v[lang].split("/").map((x) => x.trim());
    return (
      <div className="gp">
        {style}
        <div className="gp-in gp-center">
          <div className="gp-stamp fx-stamp">
            <p className="font-display gp-mark">{mark}</p>
            {fine && <p className="font-display gp-fine">{fine}</p>}
          </div>
          <dl className="gp-dl">
            {sec.facts.slice(1).map((f) => (
              <div key={f.k.en}><dt className="gp-k">{f.k[lang]}</dt><dd className="gp-v">{f.v[lang]}</dd></div>
            ))}
          </dl>
        </div>
      </div>
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

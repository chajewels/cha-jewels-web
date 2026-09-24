import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { NavHeading, SplitHeading } from "@/components/fx/split-text";
import { aboutCopy } from "@/lib/content/about";
import { AboutLogoVideo } from "@/components/fx/about-logo-video";
import { StickyColumn } from "@/components/fx/sticky-column";
import { ComponentStyle } from "@/components/fx/component-style";

/** Stacked below lg; copy and a steady right column from lg (component CSS, not utilities — docs/perf-baseline.md). */
const CSS = `@media (min-width: 1024px) { .about-grid { grid-template-columns: 1.2fr .8fr; } }`;
export const generateMetadata = () => pageMeta("about");
export default async function About() {
  const lang = await getLang();
  const t = tr(lang);
  const c = aboutCopy[lang];
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <ComponentStyle id="about-grid" css={CSS} />
      <div className="wrap about-grid grid gap-12">
        <div>
          <NavHeading text={c.h1} lang={lang} className="text-[clamp(36px,5.5vw,80px)]" />
          <div className="mt-6 max-w-[58ch] space-y-5 text-[17px] text-charcoal-deep">
            <p>{c.intro}</p>
            <p>{c.questionsLead}</p>
          </div>
          {/* The two questions carry the gold-pale display treatment the facts
              block used for its <dt>, so the page keeps its visual anchor. */}
          <ul className="mt-6 max-w-[58ch] space-y-3 border-l border-hairline pl-6">
            {c.questions.map((q) => <li key={q} className="font-display text-2xl text-charcoal-deep">{q}</li>)}
          </ul>
          <div className="mt-6 max-w-[58ch] space-y-5 text-[17px] text-charcoal-deep">
            {c.body.map((p) => <p key={p}>{p}</p>)}
          </div>
          {/* Mission and Vision. Headed sections, so they take the page's
              display type for the heading and sit between the body and the
              closing statement. */}
          {c.sections.map((s) => (
            <div key={s.heading} className="mt-8 max-w-[58ch] border-t border-hairline pt-6">
              <SplitHeading text={s.heading} lang={lang} className="font-display text-2xl text-charcoal-deep" />
              <p className="mt-3 text-[17px] text-charcoal-deep">{s.body}</p>
            </div>
          ))}
          <div className="mt-8 max-w-[58ch] space-y-5 text-[17px] text-charcoal-deep">
            <p>{c.closing[0]}</p>
            <p className="font-display text-2xl text-charcoal-deep">{c.closing[1]}</p>
          </div>
          {/* One line to the memberships, rather than listing them here: they
              are facts about the business, and /affiliations is where the
              business's facts live next to the address and the registration
              number. */}
          <p className="mt-8 max-w-[58ch] text-[17px] text-charcoal-deep">
            <Link href="/affiliations" className="text-gold-dark underline underline-offset-4">{t("contact", "affiliationsFromAbout")}</Link>
          </p>
          <div className="mt-8"><Button asChild><Link href="/collections">{c.cta}</Link></Button></div>
        </div>
        {/* THE RIGHT COLUMN, STEADY FROM lg (components/fx/sticky-column.tsx):
            the logo clip above the products-and-services panel, both in the
            page's white hairline panel. Below lg it follows the copy. */}
        <StickyColumn>
          <div className="border border-hairline bg-white p-2">
            <AboutLogoVideo alt={t("about", "logoAlt")} sizes="(min-width: 1024px) 38vw, 100vw" />
          </div>
          {/* Replaces the former facts grid in the same column, same panel treatment. */}
          <div className="mt-6 border border-hairline bg-white p-6">
            <SplitHeading text={c.listHeading} lang={lang} className="font-display text-2xl text-charcoal-deep" />
            <ul className="rule-grid mt-5 grid">
              {c.list.map((item) => <li key={item} className="px-4 py-3 text-sm text-charcoal-deep">{item}</li>)}
            </ul>
          </div>
        </StickyColumn>
      </div>
    </section>
  );
}

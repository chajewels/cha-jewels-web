import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { aboutCopy } from "@/lib/content/about";
export const generateMetadata = () => pageMeta("about");
export default async function About() {
  const lang = await getLang();
  const t = tr(lang);
  const c = aboutCopy[lang];
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap grid gap-12 md:grid-cols-[1.2fr_.8fr]">
        <div>
          <h1 className="text-[clamp(36px,5.5vw,80px)]">{c.h1}</h1>
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
              <h2 className="font-display text-2xl text-charcoal-deep">{s.heading}</h2>
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
        {/* Replaces the former facts grid in the same column, same panel treatment. */}
        <div className="self-start border border-hairline bg-white p-6">
          <h2 className="font-display text-2xl text-charcoal-deep">{c.listHeading}</h2>
          <ul className="rule-grid mt-5 grid">
            {c.list.map((item) => <li key={item} className="px-4 py-3 text-sm text-charcoal-deep">{item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

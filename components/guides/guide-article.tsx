import { JsonLd } from "@/components/site/json-ld";
import type { PublishedGuide } from "@/lib/guides/registry";

/**
 * The article for ONE published guide (English only). Plain, accessible HTML: one h1, an intro, h2 sections, and a
 * visible FAQ. FAQ JSON-LD is emitted only from FAQ entries that are rendered here (governance rule 11). No product
 * data, no figures, no layaway. Visual styling follows the site's shared classes; the Lumière redesign restyles them.
 */
export function GuideArticle({ guide }: { guide: PublishedGuide }) {
  return (
    <article className="wrap guide">
      {guide.faq.length > 0 && <JsonLd type="faq" items={guide.faq} />}
      <h1>{guide.h1}</h1>
      <p className="guide-intro">{guide.intro}</p>
      {guide.sections.map((s) => (
        <section key={s.h2}>
          <h2>{s.h2}</h2>
          {s.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </section>
      ))}
      {guide.faq.length > 0 && (
        <section aria-label="FAQ">
          <h2>FAQ</h2>
          <dl>{guide.faq.map((f) => <div key={f.q}><dt>{f.q}</dt><dd>{f.a}</dd></div>)}</dl>
        </section>
      )}
    </article>
  );
}

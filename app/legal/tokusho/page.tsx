import { pageMeta } from "@/lib/page-meta";
import { tokusho } from "@/lib/content/legal";
export const generateMetadata = () => pageMeta("tokusho");
/**
 * Japanese only, by law — the language toggle does not change the body. The
 * title line carries the English subtitle so an English reader knows what the
 * page is. Content lives in lib/content/legal.ts.
 */
export default function Tokusho() {
  return (
    <section lang="ja" className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[820px]">
        <h1 className="text-[clamp(32px,4vw,56px)]">{tokusho.title.ja}</h1>
        <p lang="en" className="mt-2 font-display text-[clamp(18px,2.2vw,26px)] text-champagne/70">{tokusho.title.en}</p>
        <dl className="mt-10 divide-y divide-[rgba(201,162,39,.32)] border-y border-rule">
          {tokusho.rows.map(([k, v]) => (<div key={k} className="grid gap-2 py-4 sm:grid-cols-[200px_1fr]"><dt className="text-champagne/60">{k}</dt><dd>{v}</dd></div>))}
        </dl>
      </div>
    </section>
  );
}

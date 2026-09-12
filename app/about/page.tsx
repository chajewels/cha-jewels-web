import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { getLang } from "@/lib/i18n-server";
import { Button } from "@/components/ui/button";
import { aboutCopy } from "@/lib/content/about";
export const generateMetadata = () => pageMeta("about");
export default async function About() {
  const lang = await getLang();
  const c = aboutCopy[lang];
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap grid gap-12 md:grid-cols-[1.2fr_.8fr]">
        <div>
          <h1 className="text-[clamp(36px,5.5vw,80px)]">{c.h1}</h1>
          <div className="mt-6 max-w-[58ch] space-y-5 text-[17px] text-champagne/85"><p>{c.p1}</p><p>{c.p2}</p><p>{c.p3}</p></div>
          <div className="mt-8"><Button asChild><Link href="/collections">{c.cta}</Link></Button></div>
        </div>
        <dl className="rule-grid grid self-start sm:grid-cols-2">{c.facts.map(([k, v]) => <div key={k} className="bg-velvet-deep p-6"><dt className="font-display text-2xl text-gold-pale">{k}</dt><dd className="mt-1 text-sm text-champagne/75">{v}</dd></div>)}</dl>
      </div>
    </section>
  );
}

import { pageMeta } from "@/lib/page-meta";
import { Award, FileText, Gem, House } from "lucide-react";
import { getLang } from "@/lib/i18n-server";
import { tr, type Lang } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { catalogue } from "@/lib/catalog-context";
import { stagePieces, type HeroPiece } from "@/lib/hero-deck";
import type { Product } from "@/lib/types";
import { follow } from "@/lib/settings";
import { LoginForm } from "@/components/account/login-form";
import { SignInStage } from "@/components/account/sign-in-stage";
import { AboutLogoVideo } from "@/components/fx/about-logo-video";

export const generateMetadata = () => pageMeta("login");

/**
 * SIGN IN (build step 4; comp page-comps/account-signin "Sign-in", D4-4).
 * Two halves from `lg`: the form on the left (components/account/login-form,
 * which also carries the check-your-email state), and on the right the hero's
 * dark stage with real pieces and what an account holds. Phones stack them,
 * form first. The live copy is unchanged; "No password" is added, which is
 * true of email-link sign-in.
 *
 * Layaway is one of the listed things only where it is offered (EN).
 *
 * The logo film (owner decision 2026-10-01, "both pages"): the six-second
 * clip of the Cha Jewels sign turning to face the reader, once used on
 * About, now heads the form column here and the Finish-signing-in page, so
 * both ends of the email-link sign-in open the same way. Its own rules keep
 * it cheap: a still until it is near the viewport, no clip at all on Data
 * Saver or reduced motion (components/fx/about-logo-video.tsx).
 */
export default async function LoginPage() {
  const [lang, products, messenger] = await Promise.all([
    getLang(),
    catalogue(),
    follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null),
  ]);
  const t = tr(lang);
  const pieces = signInPieces(products, lang);
  const perks = [
    { icon: FileText, text: t("account", "perkOrders") },
    ...(layawayOffered(lang) ? [{ icon: Award, text: t("account", "perkLayaway") }] : []),
    { icon: Gem, text: t("account", "perkPoints") },
    { icon: House, text: t("account", "perkAddresses") },
  ];

  return (
    <section className="grid lg:min-h-[640px] lg:grid-cols-2">
      <div className="flex flex-col justify-center px-[clamp(18px,4vw,48px)] pb-7 pt-8 sm:py-12 lg:px-16 lg:py-[72px]">
        <div className="w-full max-w-[520px] lg:ml-auto lg:mr-0 xl:mr-8">
          <AboutLogoVideo alt={t("about", "logoAlt")} sizes="176px" className="mb-6 w-[144px] rounded-sm sm:w-[176px]" />
          <LoginForm lang={lang} messenger={messenger} />
        </div>
      </div>
      <aside aria-label={t("account", "holdsH")} className="band-dark relative flex flex-col justify-between gap-6 overflow-hidden bg-charcoal-deep px-[clamp(18px,4vw,48px)] py-7 text-chalk sm:py-10 lg:p-14">
        <div aria-hidden="true" className="cs-pool" />
        <div className="relative">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-pale before:h-px before:w-7 before:bg-gold [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{t("account", "holdsH")}</p>
          <div className="mt-4"><SignInStage pieces={pieces} /></div>
        </div>
        <div className="relative">
          <ul className="border-t border-chalk/20">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="grid grid-cols-[22px_minmax(0,1fr)] gap-3 border-b border-chalk/20 py-3 text-sm text-chalk/90">
                <Icon aria-hidden="true" className="h-5 w-5 text-gold-pale" strokeWidth={1.5} />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px] leading-relaxed text-chalk/75">{t("footer", "secondhandPermit")}</p>
        </div>
      </aside>
    </section>
  );
}

/**
 * Up to three pieces, one per category: each category's first stage piece,
 * chosen by `stagePieces` exactly as that category's hero slide chooses it.
 * (Across the whole catalogue at once, ticks mode keeps only the pieces with
 * a hero place, which left the stage with a single piece.)
 */
function signInPieces(products: Product[], lang: Lang): HeroPiece[] {
  const byCat = new Map<string, Product[]>();
  for (const p of products) {
    const c = p.category_slugs?.[0];
    if (!c) continue;
    byCat.set(c, [...(byCat.get(c) ?? []), p]);
  }
  const out: HeroPiece[] = [];
  for (const group of byCat.values()) {
    const first = stagePieces(group, lang)[0];
    if (first && !out.some((x) => x.slug === first.slug)) out.push(first);
    if (out.length === 3) break;
  }
  return out;
}

import Link from "next/link";
import { CalendarDays, MessageCircle } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import { tokusho } from "@/lib/content/legal";
import { Button } from "@/components/ui/button";

type Row = { k: Record<Lang, string>; v: Record<Lang, string> };
/** The registered address, read from the tokusho page's data — never typed here. */
function registeredAddress(lang: Lang): string | null {
  const rows = Object.values(tokusho).find(Array.isArray) as Row[] | undefined;
  return rows?.find((r) => r.k.en === "Address")?.v[lang] ?? null;
}

/** Inquiry banner + salon card (Stitch §11). Both actions go to /about. */
export function InquiryBanner({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const address = registeredAddress(lang);
  return (
    <section className="py-8 lg:py-16">
      <div className="wrap grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="flex flex-col gap-3 rounded-sm bg-charcoal p-6 text-chalk shadow-sm lg:p-8">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-chalk/70"><MessageCircle aria-hidden="true" className="h-4 w-4" />{t("home", "inquiryEyebrow")}</p>
          <h3 className="font-display text-2xl text-gold-pale lg:text-3xl">{t("home", "inquiryH")}</h3>
          <p className="text-sm leading-relaxed text-chalk/75">{t("home", "inquiryP")}</p>
          <div className="mt-1"><Button asChild className="w-full sm:w-auto"><Link href="/about">{t("home", "inquiryCta")}</Link></Button></div>
        </div>
        <div className="flex flex-col gap-2 rounded-sm border border-hairline bg-white p-6 shadow-sm lg:p-8">
          <h4 className="font-display text-xl text-charcoal lg:text-2xl">{t("home", "salonH")}</h4>
          {address && <p className="text-sm text-charcoal/80">{address}</p>}
          <p className="text-sm leading-relaxed text-charcoal/70">{t("home", "salonP")}</p>
          <Link href="/about" className="mt-auto inline-flex items-center gap-2 pt-2 text-xs font-semibold text-gold-dark underline-offset-4 hover:underline"><CalendarDays aria-hidden="true" className="h-4 w-4" />{t("home", "salonCta")} ›</Link>
        </div>
      </div>
    </section>
  );
}

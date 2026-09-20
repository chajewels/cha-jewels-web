import { BadgeCheck, Landmark, MapPin } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";

/** Three trust items under the hero (Stitch §4). Copy from home.trust*. */
export function TrustBar({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const items = [
    { Icon: BadgeCheck, h: t("home", "trust1H"), p: t("home", "trust1P") },
    { Icon: Landmark, h: t("home", "trust2H"), p: t("home", "trust2P") },
    { Icon: MapPin, h: t("home", "trust3H"), p: t("home", "trust3P") },
  ];
  return (
    <section className="bg-hairline/40 py-4 lg:py-6">
      <div className="wrap grid grid-cols-3 gap-2 lg:gap-6">
        {items.map(({ Icon, h, p }) => (
          <div key={h} className="flex flex-col items-center rounded-sm bg-white p-2 text-center shadow-sm lg:flex-row lg:items-center lg:gap-4 lg:p-5 lg:text-left">
            <span aria-hidden="true" className="mb-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-chalk text-charcoal lg:mb-0 lg:h-10 lg:w-10"><Icon className="h-4 w-4 lg:h-5 lg:w-5" /></span>
            <div>
              <p className="text-[11px] font-semibold text-charcoal lg:text-sm">{h}</p>
              <p className="text-[10px] text-charcoal/70 lg:text-xs">{p}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

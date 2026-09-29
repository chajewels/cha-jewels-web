import Link from "next/link";
import { FileText, Lock, RotateCcw, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import { PRODUCT_TRUST } from "@/lib/content/product-trust";

/**
 * THE TRUST BLOCK AT THE BUY BUTTON (audit Top 10 #6; comp page-comps/
 * product-collection). Five hairline rows under a charcoal rule, each with a
 * gold-dark line icon. Every sentence is existing approved wording:
 *
 *   authenticated   trust.authValue + home.valueQualityP
 *   permit          trust.permit + the permit number (footer, /legal/tokusho)
 *   secure payment  checkout.reserveExplain: reserve first, payment details
 *                   only after staff confirm — no bank details before that
 *   shipping        the FAQ answer, without its leading "Yes." (D2-4)
 *   reservation     the Returns summary's 1st and 3rd sentences (D2-4), and
 *                   the full policy one link away
 *
 * It says nothing about layaway, so it is the same on both sites.
 *
 * The cart shows all five; checkout shows the payment, shipping and returns
 * rows beside every step (build step 3, D3-17) — `only` picks them, in this
 * order, with the wording unchanged.
 */
export type TrustRow = "auth" | "permit" | "pay" | "ship" | "returns";

export function ProductTrust({ lang, only }: { lang: Lang; only?: TrustRow[] }) {
  const t = tr(lang);
  const all: [TrustRow, LucideIcon, string, React.ReactNode][] = [
    ["auth", ShieldCheck, t("trust", "authValue"), t("home", "valueQualityP")],
    ["permit", FileText, t("trust", "permit"), PRODUCT_TRUST.permit[lang]],
    ["pay", Lock, t("pdp", "securePay"), t("checkout", "reserveExplain")],
    ["ship", Truck, t("pdp", "shipping"), PRODUCT_TRUST.shipping[lang]],
    ["returns", RotateCcw, t("pdp", "reserveReturns"), <>
      {PRODUCT_TRUST.returns[lang]}{" "}
      <Link href="/legal/returns" className="whitespace-nowrap font-medium text-gold-dark underline-offset-4 hover:underline">{t("footer", "returns")} →</Link>
    </>],
  ];
  const rows = all.filter(([key]) => !only || only.includes(key)).map(([, ...rest]) => rest);
  return (
    <ul className="border-t border-charcoal-deep">
      {rows.map(([Icon, head, body]) => (
        <li key={head} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3.5 border-b border-hairline py-3.5">
          <span aria-hidden="true" className="grid h-9 w-9 place-items-center border border-gold-dark/45 text-gold-dark">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-sm font-semibold text-charcoal-deep">{head}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-charcoal/80">{body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

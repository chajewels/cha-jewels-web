import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { signOutAction } from "@/lib/session-actions";
import { CommerceStyle } from "@/components/commerce/commerce-ui";
import { cn } from "@/lib/utils";

/**
 * THE ACCOUNT FRAME (build step 4; comp page-comps/account-signin, "Account
 * shell"). Every signed-in account page sits in it:
 *
 *   desktop (lg)  a side list — the header's account menu, same entries, same
 *                 order, same words — with a gold marker on the current page,
 *                 and Sign out last
 *   phone/tablet  the same entries as a chip row above the heading; the tab
 *                 bar's Account tab is already lit by /account
 *
 * Layaway is listed only where `layawayOffered(lang)`: on the Japanese site
 * there is no Layaway entry, and the plan pages are not found (owner decision
 * 2026-09-25).
 *
 * The page's eyebrow and H1 are the shell's, so every account page opens the
 * same way. Nothing here reads the Hub.
 */
export type AccountNavKey = "home" | "orders" | "layaway" | "addresses" | "service";

export function AccountShell({ lang, current, eyebrow, title, headAside, back, children, className }: {
  lang: Lang;
  current: AccountNavKey | null;
  eyebrow: ReactNode;
  title: ReactNode;
  /** Beside the heading on wide screens (e.g. Print); under it on phones. */
  headAside?: ReactNode;
  /** A quiet link above the eyebrow (e.g. "All orders"). */
  back?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  const t = tr(lang);
  const items: { key: AccountNavKey | "points"; href: string; label: string }[] = [
    { key: "home", href: "/account", label: t("accountMenu", "myAccount") },
    { key: "orders", href: "/account/orders", label: t("accountMenu", "orders") },
    ...(layawayOffered(lang) ? [{ key: "layaway" as const, href: "/account/layaway", label: t("accountMenu", "layaway") }] : []),
    { key: "addresses", href: "/account/addresses", label: t("accountMenu", "addresses") },
    { key: "service", href: "/account/service-requests", label: t("accountMenu", "service") },
    { key: "points", href: "/account#loyalty", label: t("accountMenu", "points") },
  ];

  return (
    <section className={cn("pb-24 pt-[clamp(24px,5vw,48px)]", className)}>
      <CommerceStyle />
      <div className="wrap grid items-start gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label={t("accountMenu", "menu")} className="print-hide sticky top-24 hidden border-t border-hairline lg:block">
          <ul>
            {items.map((it) => {
              const on = it.key === current;
              return (
                <li key={it.key}>
                  <Link
                    href={it.href}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center justify-between border-b border-hairline px-1 text-sm font-medium",
                      on ? "pl-3.5 text-charcoal-deep shadow-[inset_2px_0_0_#8A6B12]" : "text-charcoal/80 hover:text-charcoal-deep",
                    )}
                  >
                    {it.label}
                    <ChevronRight aria-hidden="true" className="h-4 w-4 opacity-50" strokeWidth={1.5} />
                  </Link>
                </li>
              );
            })}
            <li>
              <form action={signOutAction}>
                <button type="submit" className="flex min-h-12 w-full items-center border-b border-hairline px-1 text-left text-sm text-charcoal/75 hover:text-charcoal-deep">
                  {t("accountMenu", "signOut")}
                </button>
              </form>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">
          <nav aria-label={t("accountMenu", "menu")} className="print-hide -mx-[clamp(18px,4vw,48px)] mb-5 flex gap-2 overflow-x-auto px-[clamp(18px,4vw,48px)] pb-1 lg:hidden">
            {items.map((it) => {
              const on = it.key === current;
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap border px-4 text-sm",
                    on ? "border-charcoal-deep bg-charcoal-deep text-chalk" : "border-charcoal/60 text-charcoal-deep",
                  )}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>

          {back && (
            <Link href={back.href} className="print-hide mb-3 inline-flex min-h-11 items-center text-sm font-medium text-charcoal/80 hover:text-charcoal-deep">← {back.label}</Link>
          )}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-8">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark before:h-px before:w-8 before:bg-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{eyebrow}</p>
              <h1 className="mt-2.5 text-[clamp(30px,4vw,48px)]">{title}</h1>
            </div>
            {headAside && <div className="flex flex-wrap items-center gap-3">{headAside}</div>}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

/** A white account tile (comp `.tile`): a gold-dark label, then its content. */
export function AccountTile({ label, children, className, id }: { label: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <article id={id} className={cn("flex scroll-mt-24 flex-col gap-2.5 border border-hairline bg-white p-5 sm:p-[22px]", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{label}</p>
      {children}
    </article>
  );
}

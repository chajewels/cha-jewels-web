import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { tr } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";
import { layawayOffered } from "@/lib/layaway-availability";
import { signOutAction } from "@/lib/session-actions";
import { CommerceStyle } from "@/components/commerce/commerce-ui";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/lumiere/common/reveal-text";

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
export type AccountNavKey = "home" | "orders" | "layaway" | "receipts" | "addresses" | "service";

export function AccountShell({ lang, current, eyebrow, title, headAside, back, children, className }: {
  lang: Lang;
  current: AccountNavKey | null;
  eyebrow: ReactNode;
  title: ReactNode;
  /** Beside the heading on wide screens (e.g. Print); under it on phones. */
  headAside?: ReactNode;
  /** A quiet link above the eyebrow (e.g. "All orders"). */
  /** native: a full page load (leaving the CSP-enforced pay-card page). */
  back?: { href: string; label: string; native?: boolean };
  children: ReactNode;
  className?: string;
}) {
  const t = tr(lang);
  const items: { key: AccountNavKey | "points"; href: string; label: string }[] = [
    { key: "home", href: "/account", label: t("accountMenu", "myAccount") },
    { key: "orders", href: "/account/orders", label: t("accountMenu", "orders") },
    ...(layawayOffered(lang) ? [{ key: "layaway" as const, href: "/account/layaway", label: t("accountMenu", "layaway") }] : []),
    { key: "receipts", href: "/account/receipts", label: t("accountMenu", "receipts") },
    { key: "addresses", href: "/account/addresses", label: t("accountMenu", "addresses") },
    { key: "service", href: "/account/service-requests", label: t("accountMenu", "service") },
    { key: "points", href: "/account#loyalty", label: t("accountMenu", "points") },
  ];

  return (
    <section className={cn("iac-shell", className)}>
      <CommerceStyle />
      {/* The head: bone ground, eyebrow with its rule, the h1 resolving word by word. */}
      <div className="lm-head lm-head--bone iac-head">
        <div className="wrap lm-head__in">
          <div className="lm-head__text">
            {back && (
              back.native
                ? <a href={back.href} className="iac-back print-hide">← {back.label}</a>
                : <Link href={back.href} className="iac-back print-hide">← {back.label}</Link>
            )}
            <p className="lm-eyebrow">{eyebrow}</p>
            <h1 className="lm-h1 iac-h1"><Reveal>{title}</Reveal></h1>
          </div>
          {headAside && <div className="lm-head__aside">{headAside}</div>}
        </div>
      </div>

      <div className="wrap iac-frame">
        <nav aria-label={t("accountMenu", "menu")} className="iac-side print-hide hidden lg:block">
          <ul>
            {items.map((it) => {
              const on = it.key === current;
              return (
                <li key={it.key}>
                  <Link
                    href={it.href}
                    aria-current={on ? "page" : undefined}
                    className="lm-side__link iac-side__link flex min-h-12 items-center justify-between px-3 text-sm font-medium"
                  >
                    {it.label}
                    <ChevronRight aria-hidden="true" className="h-4 w-4 opacity-50" strokeWidth={1.5} />
                  </Link>
                </li>
              );
            })}
            <li>
              <form action={signOutAction}>
                <button type="submit" className="lm-side__link iac-side__link flex min-h-12 w-full items-center px-3 text-left text-sm">
                  {t("accountMenu", "signOut")}
                </button>
              </form>
            </li>
          </ul>
        </nav>

        <div className="iac-main min-w-0">
          <nav aria-label={t("accountMenu", "menu")} data-lenis-prevent-horizontal className="iac-chips print-hide mb-5 flex flex-wrap gap-2 lg:hidden">
            {items.map((it) => {
              const on = it.key === current;
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  aria-current={on ? "page" : undefined}
                  className="lm-chip inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-pill border px-4 text-sm"
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
          {children}
        </div>
      </div>
    </section>
  );
}

/** A white account tile (comp `.tile`): a gold-dark label, then its content. */
export function AccountTile({ label, children, className, id }: { label: string; children: ReactNode; className?: string; id?: string }) {
  return (
    <article id={id} className={cn("iac-plate iac-tile flex scroll-mt-24 flex-col gap-2.5 p-5 sm:p-[26px]", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{label}</p>
      {children}
    </article>
  );
}

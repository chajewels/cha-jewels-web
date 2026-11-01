"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { type Lang } from "@/lib/i18n-core";
import { LANG_PARAM } from "@/lib/i18n-core";
import { trOf } from "@/lib/i18n-client";
import { nav as navDict } from "@/lib/i18n/sections/nav";
import type { SwitchTargets } from "@/lib/locale-nav";
import { useSwitchTargets } from "./use-switch-targets";

/**
 * The JA / EN toggle. Japanese first: it is the site's primary language.
 *
 * TWO MODES SINCE PHASE 2C (OD-7). With `targets` (lib/locale-nav.ts
 * switchTargets, computed by the layout from the request path), each option is
 * a REAL CRAWLABLE LINK: the matching sibling page when one exists, otherwise
 * the destination language's home — never a missing page, never layaway. The
 * middleware syncs the cookie on the locale route it lands on, so the choice
 * still sticks. Without a target (private routes such as /cart or /account,
 * which must re-render in place), the option keeps the pre-2C behaviour: POST
 * /api/lang, then refresh. After a client-side navigation the destinations are
 * re-asked for the page on screen (./use-switch-targets.ts).
 *
 * NOT ORANGE (DESIGN.md, the Orange Means Buy rule; audit header #1). On light
 * the active segment is charcoal-deep with a chalk label; on a dark surface
 * (`tone="dark"`: the footer, the drawer's foot) it inverts to chalk with a
 * charcoal-deep label. Links and buttons share one look per state, and both
 * are natively keyboard-operable.
 */
export function LangSwitcher({ lang, targets, tone = "light", compact = false }: { lang: Lang; targets?: SwitchTargets; tone?: "light" | "dark"; compact?: boolean }) {
  const router = useRouter();
  const t = trOf({ nav: navDict }, lang);
  const [pending, start] = useTransition();
  function set(l: Lang) {
    if (l === lang) return;
    start(async () => {
      await fetch("/api/lang", { method: "POST", body: JSON.stringify({ lang: l }) });
      // A URL carrying ?lang= (a shared English link) wins over the cookie in
      // the middleware on every request, so a plain refresh would undo the
      // choice just made and the control would look dead (found 2026-10-01).
      // Drop the parameter and land on the clean URL; otherwise refresh in place.
      const url = new URL(window.location.href);
      if (url.searchParams.has(LANG_PARAM)) {
        url.searchParams.delete(LANG_PARAM);
        router.replace(`${url.pathname}${url.search}${url.hash}`);
      }
      // Always refresh: a soft navigation alone does not re-render the root
      // layout, so <html lang> and the header would keep the old language.
      router.refresh();
    });
  }
  const dark = tone === "dark";
  const current = useSwitchTargets(targets);
  /**
   * One control, link or button, same look. The current language never links away.
   *
   * A PLAIN <a>, A FULL PAGE LOAD (found 2026-10-28), and deliberately not
   * next/link, for two reasons that both come from the root layout:
   *  - The root layout — <html lang>, header, footer, drawer, tab bar — is not
   *    re-rendered by a client-side navigation. A soft switch from /en/faq to
   *    /ja/faq rendered the Japanese page under the ENGLISH frame, Layaway
   *    link included. Changing language therefore loads a new document.
   *  - A <Link> is prefetched, and a prefetch of the other language's URL ran
   *    the middleware's cookie sync (Next strips the router's prefetch headers
   *    before middleware, so it cannot tell): merely viewing an English page
   *    set `cj-lang=ja`, after which the English /layaway link 404'd and /cart
   *    rendered Japanese. A plain anchor is never prefetched; a click is a real
   *    request, so the cookie follows the customer's actual choice.
   * Still a real crawlable link with the same href, keyboard-operable as ever.
   * tests/locale-nav.test.mjs guards both halves.
   */
  function Option({ l, className, children, label }: { l: Lang; className: string; children: React.ReactNode; label?: string }) {
    // `current === null`: the destinations for this page are still being asked
    // for — offer the destination language's home, which always exists.
    const href = l === lang ? null : current === null ? `/${l}` : current?.[l] ?? null;
    return href ? (
      <a href={href} lang={l} aria-label={label} className={className}>{children}</a>
    ) : (
      <button type="button" lang={l} disabled={pending} aria-label={label} aria-pressed={l === lang || undefined} onClick={() => set(l)} className={className}>{children}</button>
    );
  }
  if (compact) {
    // THE PHONE HEADER (owner 2026-10-01: the toggle was only at the foot of
    // the page and the drawer, "hard to click"). The two-segment control does
    // not fit beside the logo, search, bag and menu at 390px, so the header
    // shows ONE 44px control naming the OTHER language: "EN" on the Japanese
    // site, the Japanese label on the English one. One tap switches.
    // Not orange (Orange Means Buy).
    const other: Lang = lang === "ja" ? "en" : "ja";
    return (
      <Option l={other} label={t("nav", "language")}
        className={`inline-flex h-11 min-w-11 items-center justify-center whitespace-nowrap rounded-sm border px-1.5 text-xs font-medium ${dark ? "border-chalk/40 text-chalk" : "border-charcoal/60 text-charcoal-deep hover:text-gold-dark"}`}>
        {other === "ja" ? t("nav", "langJa") : t("nav", "langEn")}
      </Option>
    );
  }
  return (
    <div role="group" aria-label={t("nav", "language")} className={`flex min-h-10 rounded-sm border text-xs ${dark ? "border-chalk/40 text-chalk" : "border-charcoal/60 text-charcoal"}`}>
      {(["ja", "en"] as const).map((l) => {
        const on = lang === l;
        const look = on
          ? dark ? "bg-chalk text-charcoal-deep" : "bg-charcoal-deep text-chalk"
          : dark ? "text-chalk/80 hover:text-gold-pale" : "text-charcoal/80 hover:text-gold-dark";
        return (
          <Option key={l} l={l} className={`inline-flex min-h-10 min-w-11 items-center justify-center whitespace-nowrap px-3 font-medium ${look}`}>
            {l === "ja" ? t("nav", "langJa") : t("nav", "langEn")}
          </Option>
        );
      })}
    </div>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LANG_PARAM, tr, type Lang } from "@/lib/i18n";
import type { SwitchTargets } from "@/lib/locale-nav";

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
 * /api/lang, then refresh.
 *
 * NOT ORANGE (DESIGN.md, the Orange Means Buy rule; audit header #1). On light
 * the active segment is charcoal-deep with a chalk label; on a dark surface
 * (`tone="dark"`: the footer, the drawer's foot) it inverts to chalk with a
 * charcoal-deep label. Links and buttons share one look per state, and both
 * are natively keyboard-operable.
 */
export function LangSwitcher({ lang, targets, tone = "light", compact = false }: { lang: Lang; targets?: SwitchTargets; tone?: "light" | "dark"; compact?: boolean }) {
  const router = useRouter();
  const t = tr(lang);
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
  /**
   * One control, link or button, same look. The current language never links away.
   *
   * NEVER PREFETCHED (found 2026-10-28). The middleware syncs `cj-lang` to the
   * locale of every /en or /ja request, and Next removes the router's prefetch
   * headers before middleware runs, so it cannot tell a prefetch from a visit.
   * This link is the only one on a page that names the OTHER language: its
   * prefetch quietly switched the cookie — viewing an English page set
   * `cj-lang=ja`, after which the English /layaway link 404'd and /cart
   * rendered Japanese. A real click is still a navigation, so the cookie
   * follows the customer's actual choice. tests/locale-nav.test.mjs guards it.
   */
  function Option({ l, className, children, label }: { l: Lang; className: string; children: React.ReactNode; label?: string }) {
    const href = l === lang ? null : targets?.[l] ?? null;
    return href ? (
      <Link href={href} prefetch={false} lang={l} aria-label={label} className={className}>{children}</Link>
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

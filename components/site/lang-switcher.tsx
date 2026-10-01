"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LANG_PARAM, tr, type Lang } from "@/lib/i18n";

/**
 * The JA / EN toggle. Japanese first: it is the site's primary language.
 *
 * NOT ORANGE (DESIGN.md, the Orange Means Buy rule; audit header #1). On light
 * the active segment is charcoal-deep with a chalk label; on a dark surface
 * (`tone="dark"`: the footer, the drawer's foot) it inverts to chalk with a
 * charcoal-deep label. The page stays where it is: the cookie is set and the
 * same route re-renders in the other language.
 */
export function LangSwitcher({ lang, tone = "light", compact = false }: { lang: Lang; tone?: "light" | "dark"; compact?: boolean }) {
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
  if (compact) {
    // THE PHONE HEADER (owner 2026-10-01: the toggle was only at the foot of
    // the page and the drawer, "hard to click"). The two-segment control does
    // not fit beside the logo, search, bag and menu at 390px, so the header
    // shows ONE 44px button naming the OTHER language: "EN" on the Japanese
    // site, the Japanese label on the English one. One tap switches; same cookie, same
    // route, as the full control. Not orange (Orange Means Buy).
    const other: Lang = lang === "ja" ? "en" : "ja";
    return (
      <button type="button" lang={other} disabled={pending} onClick={() => set(other)} aria-label={t("nav", "language")}
        className={`inline-flex h-11 min-w-11 items-center justify-center whitespace-nowrap rounded-sm border px-1.5 text-xs font-medium ${dark ? "border-chalk/40 text-chalk" : "border-charcoal/60 text-charcoal-deep hover:text-gold-dark"}`}>
        {other === "ja" ? t("nav", "langJa") : t("nav", "langEn")}
      </button>
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
          <button key={l} type="button" lang={l} disabled={pending} aria-pressed={on} onClick={() => set(l)} className={`min-h-10 min-w-11 whitespace-nowrap px-3 font-medium ${look}`}>
            {l === "ja" ? t("nav", "langJa") : t("nav", "langEn")}
          </button>
        );
      })}
    </div>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { tr, type Lang } from "@/lib/i18n";

/**
 * The JA / EN toggle. Japanese first: it is the site's primary language.
 *
 * NOT ORANGE (DESIGN.md, the Orange Means Buy rule; audit header #1). On light
 * the active segment is charcoal-deep with a chalk label; on a dark surface
 * (`tone="dark"`: the footer, the drawer's foot) it inverts to chalk with a
 * charcoal-deep label. The page stays where it is: the cookie is set and the
 * same route re-renders in the other language.
 */
export function LangSwitcher({ lang, tone = "light" }: { lang: Lang; tone?: "light" | "dark" }) {
  const router = useRouter();
  const t = tr(lang);
  const [pending, start] = useTransition();
  function set(l: Lang) {
    if (l === lang) return;
    start(async () => { await fetch("/api/lang", { method: "POST", body: JSON.stringify({ lang: l }) }); router.refresh(); });
  }
  const dark = tone === "dark";
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

"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Lang } from "@/lib/i18n";
export function LangSwitcher({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function set(l: Lang) { start(async () => { await fetch("/api/lang", { method: "POST", body: JSON.stringify({ lang: l }) }); router.refresh(); }); }
  return (
    <div role="group" aria-label="Language / 言語" className="flex overflow-hidden rounded-sm border border-rule text-xs">
      {(["ja", "en"] as const).map((l) => (
        <button key={l} type="button" lang={l} disabled={pending} aria-pressed={lang === l} onClick={() => set(l)} className={`min-h-9 px-3 ${lang === l ? "bg-gold text-ink" : "text-champagne/75"}`}>{l === "ja" ? "日本語" : "EN"}</button>
      ))}
    </div>
  );
}

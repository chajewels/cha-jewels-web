"use client";
import { useState } from "react";
import { dict, type Lang } from "@/lib/i18n";
import type { Region } from "@/lib/utils";
import { Button } from "@/components/ui/button";
export function JoinForm({ lang, region }: { lang: Lang; region: Region }) {
  const c = dict.loyalty;
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    setState("sending");
    const body = Object.fromEntries(new FormData(f));
    const res = await fetch("/api/loyalty/join", { method: "POST", body: JSON.stringify({ ...body, lang }) });
    setState(res.ok ? "ok" : "err");
  }
  const field = "min-h-11 w-full rounded-sm border border-rule bg-velvet px-3 text-champagne";
  if (state === "ok") return <div className="border border-gold bg-velvet-deep p-6 text-gold-pale">{c.ok[lang]}</div>;
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 border border-gold bg-velvet-deep p-6 text-sm">
      <label className="grid gap-1.5 text-champagne/75">{c.name[lang]}<input name="name" required autoComplete="name" className={field} /></label>
      <label className="grid gap-1.5 text-champagne/75">{c.contact[lang]}<input name="contact" required autoComplete="email" className={field} placeholder="+81 / +63 / email" /></label>
      <label className="grid gap-1.5 text-champagne/75">{c.region[lang]}
        <select name="region" defaultValue={region} className={field}><option value="JP">{lang === "ja" ? "日本" : "Japan"}</option><option value="PH">{lang === "ja" ? "フィリピン" : "Philippines"}</option><option value="OTHER">{lang === "ja" ? "その他" : "Elsewhere"}</option></select>
      </label>
      <Button type="submit" disabled={state === "sending"}>{c.submit[lang]}</Button>
      {state === "err" && <p className="text-garnet">{lang === "ja" ? "送信できませんでした。もう一度お試しください。" : "Could not submit. Please try again."}</p>}
      <p className="text-xs text-champagne/55">{c.consent[lang]}</p>
    </form>
  );
}

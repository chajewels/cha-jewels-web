"use client";
import { useState } from "react";
import { dict, type Lang } from "@/lib/i18n";
import { MARKETS, VOLUMES, marketLabel, volumeLabel } from "@/lib/content/wholesale";
import { Button } from "@/components/ui/button";

export function InquiryForm({ lang }: { lang: Lang }) {
  const c = dict.wholesale;
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    setState("sending");
    const body = Object.fromEntries(new FormData(f));
    const res = await fetch("/api/wholesale", { method: "POST", body: JSON.stringify({ ...body, lang }) });
    setState(res.ok ? "ok" : "err");
  }
  const field = "min-h-11 w-full rounded-sm border border-rule bg-velvet px-3 text-champagne";
  if (state === "ok") return <div className="border border-gold bg-velvet-deep p-6 text-gold-pale">{c.ok[lang]}</div>;
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 border border-gold bg-velvet-deep p-6 text-sm">
      <label className="grid gap-1.5 text-champagne/75">{c.name[lang]}<input name="name" required autoComplete="name" className={field} /></label>
      <label className="grid gap-1.5 text-champagne/75">{c.business[lang]}<input name="business" required autoComplete="organization" className={field} /></label>
      <label className="grid gap-1.5 text-champagne/75">{c.email[lang]}<input name="email" type="email" required autoComplete="email" className={field} /></label>
      <label className="grid gap-1.5 text-champagne/75">{c.phone[lang]}<input name="phone" autoComplete="tel" className={field} placeholder="+81 / +63" /></label>
      <label className="grid gap-1.5 text-champagne/75">{c.market[lang]}
        <select name="market" defaultValue="JP" className={field}>
          {MARKETS.map((m) => <option key={m} value={m}>{marketLabel[m][lang]}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-champagne/75">{c.volume[lang]}
        <select name="volume" defaultValue="TEST" className={field}>
          {VOLUMES.map((v) => <option key={v} value={v}>{volumeLabel[v][lang]}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-champagne/75">{c.notes[lang]}<textarea name="notes" rows={4} className={`${field} py-2`} /></label>
      <Button type="submit" disabled={state === "sending"}>{c.submit[lang]}</Button>
      {state === "err" && <p className="text-garnet">{c.err[lang]}</p>}
    </form>
  );
}

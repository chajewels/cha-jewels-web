"use client";
import { useState } from "react";
import { dict, type Lang } from "@/lib/i18n";
import { MARKETS, VOLUMES, marketLabel, volumeLabel } from "@/lib/content/wholesale";
import { Button } from "@/components/ui/button";
import { errorLight, inputLight, labelLight } from "@/lib/form-classes";

/**
 * The wholesale price-list request. Build step 5 restyled it (comp
 * page-comps/brand-programmes "wholesale"): a white card with its heading,
 * 48px fields, and the two choices as 44px radio chips instead of selects.
 * BEHAVIOUR IS UNCHANGED: the same field names and values (the Hub's enums),
 * the same defaults (JP, TEST), the same POST to /api/wholesale.
 */
export function InquiryForm({ lang, heading }: { lang: Lang; heading?: string }) {
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
  // The shared light form rule, not a second opinion about what a field looks
  // like. lib/form-classes.ts carries the measured pairs; only the sizing is
  // this form's own.
  const field = `min-h-12 w-full rounded-sm px-3.5 text-[15px] ${inputLight}`;
  const label = `grid gap-1.5 text-xs font-semibold tracking-[0.06em] ${labelLight}`;
  // A radio chip: the input stays a real radio (keyboard arrows, form data),
  // visually hidden; the chip shows its state and its focus ring.
  const chip = "relative inline-flex min-h-11 cursor-pointer items-center rounded-sm border border-charcoal/60 bg-white px-3.5 text-sm font-normal tracking-normal text-charcoal-deep has-[:checked]:border-charcoal-deep has-[:checked]:bg-charcoal-deep has-[:checked]:text-chalk has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-dark";
  // The success box is NOT alertLight: that rule is garnet-bordered for things
  // that went wrong, and a confirmation in an error frame reads as a failure.
  if (state === "ok") return <div className="border border-hairline bg-white p-6 text-charcoal-deep sm:p-8">{c.ok[lang]}</div>;
  return (
    <form onSubmit={submit} noValidate className="grid gap-[18px] border border-hairline bg-white p-[22px] text-sm text-charcoal sm:p-8">
      {heading && <h2 className="font-display text-[clamp(22px,2.2vw,28px)] leading-tight text-charcoal-deep">{heading}</h2>}
      <label className={label}>{c.name[lang]}<input name="name" required autoComplete="name" className={field} /></label>
      <label className={label}>{c.business[lang]}<input name="business" required autoComplete="organization" className={field} /></label>
      <label className={label}>{c.email[lang]}<input name="email" type="email" required autoComplete="email" className={field} /></label>
      <label className={label}>{c.phone[lang]}<input name="phone" autoComplete="tel" className={field} placeholder="+81 / +63" /></label>
      <fieldset className="grid gap-1.5">
        <legend className={`mb-1.5 text-xs font-semibold tracking-[0.06em] ${labelLight}`}>{c.market[lang]}</legend>
        <div className="flex flex-wrap gap-2">
          {MARKETS.map((m) => (
            <label key={m} className={chip}>
              <input type="radio" name="market" value={m} defaultChecked={m === "JP"} className="sr-only" />
              {marketLabel[m][lang]}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-1.5">
        <legend className={`mb-1.5 text-xs font-semibold tracking-[0.06em] ${labelLight}`}>{c.volume[lang]}</legend>
        <div className="flex flex-wrap gap-2">
          {VOLUMES.map((v) => (
            <label key={v} className={chip}>
              <input type="radio" name="volume" value={v} defaultChecked={v === "TEST"} className="sr-only" />
              {volumeLabel[v][lang]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={label}>{c.notes[lang]}<textarea name="notes" rows={4} className={`${field} min-h-[120px] py-3`} /></label>
      <Button type="submit" disabled={state === "sending"} className="w-full">{c.submit[lang]}</Button>
      {state === "err" && <p className={errorLight}>{c.err[lang]}</p>}
    </form>
  );
}

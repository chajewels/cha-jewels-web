"use client";
import Link from "next/link";
import { useEffect, useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { layawayQuote } from "@/lib/layaway";
import { formatMoney, toPhp, cn, type Currency } from "@/lib/utils";
import { dict, type Lang } from "@/lib/i18n";
import { termLaunched } from "@/lib/layaway-availability";
import type { LayawayQuote as Quote } from "@/lib/types";

/**
 * The card's surface classes, in one place. There is only the light card now:
 * the dark tone was the pre-flip calculator, and after Phase 4 Group E every
 * caller passes a light surface — the product page directly, and the layaway
 * band as the white card that reads against its charcoal. charcoal/60 on
 * white is 3.69:1 and fails as text, so secondary text is /70 (4.95:1) — see
 * scripts/check-contrast.mjs.
 */
const TONES = {
  light: {
    form: "grid gap-4 rounded-sm border border-hairline bg-white p-5 text-sm text-charcoal shadow-sm",
    label: "grid gap-1.5 text-charcoal/70",
    field: "min-h-11 rounded-sm border border-hairline bg-chalk px-3 text-charcoal",
    toggle: "flex w-fit overflow-hidden rounded-sm border border-hairline text-xs",
    toggleOn: "bg-orange text-charcoal-deep",
    toggleOff: "text-charcoal/70",
    cellKey: "text-xs text-charcoal/70",
    cellValue: "mt-1 block font-display text-2xl font-normal text-charcoal-deep",
    cellMonthly: "mt-1 block font-display text-2xl font-normal text-gold-dark",
    note: "text-xs text-charcoal/70",
  },
} as const;

/**
 * Renders numbers returned by the shared RPC. Peso figures are display
 * conversions at the Hub's rate; no layaway math here.
 *
 * `tone` picks the surface only. `header` and `cta` are optional card
 * furniture (the homepage passes them); with neither, and tone "dark", the
 * markup is exactly what it was before the prop existed.
 */
export function LayawayCalculator({ lang, initialPrice = 150000, phpRate, className, header, cta }: {
  lang: Lang;
  initialPrice?: number;
  phpRate: number;
  className?: string;
  header?: { title: string; sub: string; chip: string };
  cta?: { label: string; href: string };
}) {
  const c = dict.calc;
  const s = TONES.light;
  const [display, setDisplay] = useState<Currency>("JPY");
  // THE RAW STRING, not a number. `Number("") || 0` turned an empty field into
  // a price of zero and asked the Hub to quote it, which answered ¥0 down and
  // ¥0 a month — a schedule for nothing, shown as though it were an offer.
  // A string is the only way "the field is blank" and "the price is 0" can be
  // told apart, and they are not the same mistake.
  const [raw, setRaw] = useState(String(initialPrice));
  const [term, setTerm] = useState(6);
  // The quote REMEMBERS WHAT IT IS A QUOTE FOR. Without that there is no way
  // to know whether the figures on screen belong to the number in the field or
  // to the one before it, and the CTA cannot tell either.
  const [quote, setQuote] = useState<{ q: Quote; price: number; term: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const parsed = Number(raw);
  const validPrice = raw.trim() !== "" && Number.isFinite(parsed) && parsed > 0;
  const price = validPrice ? parsed : 0;

  useEffect(() => {
    // Nothing is asked of the Hub for a price it cannot price. The displayed
    // quote goes at once rather than lingering under a field that no longer
    // agrees with it.
    if (!validPrice) {
      setQuote(null);
      setError(null);
      return;
    }
    const id = setTimeout(() => start(async () => {
      try { const q = await layawayQuote(price, term); setQuote(q ? { q, price, term } : null); setError(q ? null : c.err[lang]); }
      catch { setQuote(null); setError(c.err[lang]); }
    }), 250);
    return () => clearTimeout(id);
  }, [price, term, validPrice, lang, c.err]);

  /**
   * FRESH means: these figures were computed for the number in the field and
   * the term that is selected, and nothing is in flight. Everything a customer
   * could act on hangs off this — the cells, the button, the note — so a stale
   * quote can never be read as a current one, and the button can never send
   * someone off with a figure that has already been replaced.
   */
  const shown = quote && quote.price === price && quote.term === term && !pending && !error ? quote.q : null;
  // The term list is the Hub's, not a constant here: plan_configurations is
  // what create-layaway-account and the DB trigger enforce, so a term this
  // calculator offers is a term the business can actually sell. An older Hub
  // response without allowed_terms falls back to the eligible-by-max rule.
  const maxTerm = shown?.max_term_months ?? 6;
  const terms = shown?.allowed_terms ?? FALLBACK_TERMS.map((m) => ({
    months: m, label: `${m}`, min_amount: 0, dp_percentage: 0.3, eligible: m <= maxTerm,
  }));
  const fmt = (jpy: number) => (display === "PHP" ? formatMoney(toPhp(jpy, phpRate), "PHP") : formatMoney(jpy, "JPY"));
  // A term the Hub has but has not launched is listed and disabled rather
  // than dropped (owner decision 2026-09-16) — same rule as the reservation
  // flow, one source in lib/layaway-availability.
  const termOff = (tm: (typeof terms)[number]) => !termLaunched(tm.months) || !tm.eligible;
  const termSuffix = (tm: (typeof terms)[number]) =>
    !termLaunched(tm.months) ? ` · ${c.notLaunched[lang]}` : tm.min_amount > 0 ? ` · ${c.minFrom[lang].replace("{amount}", fmt(tm.min_amount))}` : "";
  const field = s.field;
  const priceErrorId = `${useId()}-price`;
  return (
    <form className={cn(s.form, className)} onSubmit={(e) => e.preventDefault()}>
      {header && (
        <div className="flex items-start justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <p className="font-display text-xl text-charcoal-deep">{header.title}</p>
            <p className="mt-0.5 text-xs text-charcoal/70">{header.sub}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-chalk px-2.5 py-1 text-[11px] font-semibold text-charcoal">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal" />{header.chip}
          </span>
        </div>
      )}
      <div className="grid gap-3">
        <label className={s.label}>{c.price[lang]} (¥)
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1000}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            aria-invalid={!validPrice}
            aria-describedby={!validPrice ? priceErrorId : undefined}
            className={field}
          />
        </label>
                  <fieldset className={s.label}>
            <legend className="mb-1.5">{c.term[lang]}</legend>
            <div className="flex flex-wrap gap-2">
              {terms.map((tm) => (
                <button
                  key={tm.months}
                  type="button"
                  disabled={termOff(tm)}
                  aria-pressed={term === tm.months}
                  onClick={() => setTerm(tm.months)}
                  className={`min-h-10 rounded-sm border px-3 text-sm ${term === tm.months ? "border-charcoal-deep bg-charcoal-deep text-white" : "border-hairline bg-chalk text-charcoal hover:border-charcoal/40"} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {tm.months}{termSuffix(tm)}
                </button>
              ))}
            </div>
          </fieldset>
      </div>
      <div role="group" aria-label={c.currency[lang]} className={s.toggle}>
        {(["JPY", "PHP"] as const).map((cur) => <button key={cur} type="button" aria-pressed={display === cur} onClick={() => setDisplay(cur)} className={`min-h-9 px-3 ${display === cur ? s.toggleOn : s.toggleOff}`}>{cur === "JPY" ? c.jpy[lang] : c.php[lang]}</button>)}
      </div>
      <output aria-live="polite" className="grid grid-cols-3 gap-3">
        <Cell k={c.dp[lang]} v={shown ? fmt(shown.down_payment) : "—"} keyClass={s.cellKey} valueClass={s.cellValue} />
        <Cell k={c.monthly[lang]} v={shown ? fmt(shown.monthly) : "—"} keyClass={s.cellKey} valueClass={s.cellMonthly} />
        <Cell k={c.total[lang]} v={shown ? fmt(shown.total) : "—"} keyClass={s.cellKey} valueClass={s.cellValue} />
      </output>
      {cta && (
        // A <button disabled>, not a styled-down link: a link with
        // pointer-events:none is still in the tab order and still announced as
        // a link, so a keyboard or screen-reader user is the only one who can
        // follow it while the figures are stale. The <Link> is rendered only
        // when there is something current to act on.
        shown ? (
          <Button asChild><Link href={cta.href}>{cta.label}</Link></Button>
        ) : (
          // opacity-50 rather than the shared button's 70, and the cursor with
          // it: this one is disabled for a reason the reader can fix, so it
          // has to read as off rather than merely quiet.
          <Button type="button" disabled className="disabled:cursor-not-allowed disabled:opacity-50">{cta.label}</Button>
        )
      )}
      <p id={priceErrorId} className={!validPrice ? "text-xs text-garnet" : s.note}>
        {!validPrice ? c.invalidPrice[lang]
          : pending ? c.updating[lang]
          : error ?? (shown?.term_downgraded ? c.unavailableTerm[lang] : display === "PHP" ? c.phpNote[lang] : c.note[lang])}
      </p>
    </form>
  );
}
/** Only reached against a Hub that predates allowed_terms. */
const FALLBACK_TERMS = [3, 6, 8, 10, 12];

function Cell({ k, v, keyClass, valueClass }: { k: string; v: string; keyClass: string; valueClass: string }) { return <div><span className={keyClass}>{k}</span><b className={valueClass}>{v}</b></div>; }

"use client";
import { useEffect, useState, useTransition } from "react";
import { layawayQuote } from "@/lib/layaway";
import { formatMoney, toPhp, cn, type Currency } from "@/lib/utils";
import { dict, type Lang } from "@/lib/i18n";
import type { LayawayQuote as Quote } from "@/lib/types";
/** Renders numbers returned by the shared RPC. Peso figures are display conversions at the Hub's rate; no layaway math here. */
export function LayawayCalculator({ lang, initialPrice = 150000, phpRate, phpRateAsOf, className }: { lang: Lang; initialPrice?: number; phpRate: number; phpRateAsOf?: string; className?: string }) {
  const c = dict.calc;
  const [display, setDisplay] = useState<Currency>("JPY");
  const [price, setPrice] = useState(initialPrice);
  const [term, setTerm] = useState(6);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    const id = setTimeout(() => start(async () => {
      try { setQuote(await layawayQuote(price, term)); setError(null); }
      catch { setError(c.err[lang]); }
    }), 250);
    return () => clearTimeout(id);
  }, [price, term, lang, c.err]);
  // The term list is the Hub's, not a constant here: plan_configurations is
  // what create-layaway-account and the DB trigger enforce, so a term this
  // calculator offers is a term the business can actually sell. An older Hub
  // response without allowed_terms falls back to the eligible-by-max rule.
  const maxTerm = quote?.max_term_months ?? 6;
  const terms = quote?.allowed_terms ?? FALLBACK_TERMS.map((m) => ({
    months: m, label: `${m}`, min_amount: 0, dp_percentage: 0.3, eligible: m <= maxTerm,
  }));
  const fmt = (jpy: number) => (display === "PHP" ? formatMoney(toPhp(jpy, phpRate), "PHP") : formatMoney(jpy, "JPY"));
  const field = "min-h-11 rounded-sm border border-rule bg-velvet px-3 text-champagne";
  return (
    <form className={cn("grid gap-4 border border-rule bg-velvet-deep p-5 text-sm", className)} onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-champagne/75">{c.price[lang]} (¥)
          <input type="number" inputMode="numeric" min={1000} step={1000} value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} className={field} />
        </label>
        <label className="grid gap-1.5 text-champagne/75">{c.term[lang]}
          <select value={term} onChange={(e) => setTerm(Number(e.target.value))} className={field}>
            {terms.map((tm) => (
              <option key={tm.months} value={tm.months} disabled={!tm.eligible}>
                {tm.months}
                {tm.min_amount > 0 ? ` · ${c.minFrom[lang].replace("{amount}", fmt(tm.min_amount))}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div role="group" aria-label={c.currency[lang]} className="flex w-fit overflow-hidden rounded-sm border border-rule text-xs">
        {(["JPY", "PHP"] as const).map((cur) => <button key={cur} type="button" aria-pressed={display === cur} onClick={() => setDisplay(cur)} className={`min-h-9 px-3 ${display === cur ? "bg-gold text-ink" : "text-champagne/75"}`}>{cur === "JPY" ? c.jpy[lang] : c.php[lang]}</button>)}
      </div>
      <output aria-live="polite" className="grid grid-cols-3 gap-3">
        <Cell k={c.dp[lang]} v={quote ? fmt(quote.down_payment) : "—"} />
        <Cell k={c.monthly[lang]} v={quote ? fmt(quote.monthly) : "—"} />
        <Cell k={c.total[lang]} v={quote ? fmt(quote.total) : "—"} />
      </output>
      <p className="text-xs text-champagne/55">
        {pending ? c.updating[lang]
          : error ?? (quote?.term_downgraded ? c.unavailableTerm[lang] : display === "PHP" ? c.phpNote[lang] : c.note[lang])}
      </p>
      {display === "PHP" && phpRateAsOf && <p className="text-xs text-champagne/45">{c.rateAsOf[lang].replace("{date}", phpRateAsOf.slice(0, 10))}</p>}
    </form>
  );
}
/** Only reached against a Hub that predates allowed_terms. */
const FALLBACK_TERMS = [3, 6, 8, 10, 12];

function Cell({ k, v }: { k: string; v: string }) { return <div><span className="text-xs text-champagne/55">{k}</span><b className="mt-1 block font-display text-2xl font-normal text-gold-pale">{v}</b></div>; }

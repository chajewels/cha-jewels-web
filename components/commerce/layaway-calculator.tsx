"use client";
import { useEffect, useState, useTransition } from "react";
import { layawayQuote } from "@/lib/layaway";
import { formatMoney, type Region, cn } from "@/lib/utils";
import { dict, type Lang } from "@/lib/i18n";
import type { LayawayQuote as Quote } from "@/lib/types";
/** Renders numbers returned by the shared RPC. Contains no layaway math of its own. */
export function LayawayCalculator({ region, lang, initialPrice = 150000, className }: { region: Region; lang: Lang; initialPrice?: number; className?: string }) {
  const c = dict.calc;
  const [currency, setCurrency] = useState<"JPY" | "PHP">(region === "PH" ? "PHP" : "JPY");
  const [price, setPrice] = useState(initialPrice);
  const [term, setTerm] = useState(6);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const r: Region = currency === "PHP" ? "PH" : "JP";
  useEffect(() => {
    const id = setTimeout(() => start(async () => {
      try { setQuote(await layawayQuote(price, term, currency)); setError(null); }
      catch { setError(c.err[lang]); }
    }), 250);
    return () => clearTimeout(id);
  }, [price, term, currency, lang, c.err]);
  const maxTerm = quote?.max_term_months ?? 6;
  const field = "min-h-11 rounded-sm border border-rule bg-velvet px-3 text-champagne";
  return (
    <form className={cn("grid gap-4 border border-rule bg-velvet-deep p-5 text-sm", className)} onSubmit={(e) => e.preventDefault()}>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-champagne/75">{c.currency[lang]}
          <select value={currency} onChange={(e) => setCurrency(e.target.value as "JPY" | "PHP")} className={field}><option value="JPY">¥ 日本円 / JPY</option><option value="PHP">₱ フィリピンペソ / PHP</option></select>
        </label>
        <label className="grid gap-1.5 text-champagne/75">{c.term[lang]}
          <select value={term} onChange={(e) => setTerm(Number(e.target.value))} className={field}>{[3, 4, 5, 6, 8].map((m) => <option key={m} value={m} disabled={m > maxTerm}>{m}{m === 8 ? ` ${c.eightNote[lang]}` : ""}</option>)}</select>
        </label>
      </div>
      <label className="grid gap-1.5 text-champagne/75">{c.price[lang]} ({currency})
        <input type="number" inputMode="numeric" min={1000} step={1000} value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} className={field} />
      </label>
      <output aria-live="polite" className="grid grid-cols-3 gap-3">
        <Cell k={c.dp[lang]} v={quote ? formatMoney(quote.down_payment, r) : "—"} />
        <Cell k={c.monthly[lang]} v={quote ? formatMoney(quote.monthly, r) : "—"} />
        <Cell k={c.total[lang]} v={quote ? formatMoney(quote.total, r) : "—"} />
      </output>
      <p className="text-xs text-champagne/55">{pending ? c.updating[lang] : error ?? c.note[lang]}</p>
    </form>
  );
}
function Cell({ k, v }: { k: string; v: string }) { return <div><span className="text-xs text-champagne/55">{k}</span><b className="mt-1 block font-display text-2xl font-normal text-gold-pale">{v}</b></div>; }

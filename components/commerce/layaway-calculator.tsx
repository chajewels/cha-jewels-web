"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { layawayQuote } from "@/lib/layaway";
import { formatMoney, cn, type Currency } from "@/lib/utils";
import { dict, type Lang } from "@/lib/i18n";
import { termLaunched } from "@/lib/layaway-availability";
import type { LayawayQuote as Quote } from "@/lib/types";
import { RollingValue } from "@/components/fx/rolling";
import { useReduced } from "@/components/fx/media";
import { DUR, EASE_LUX, RISE, STAGGER } from "@/lib/motion";

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
 * Renders numbers returned by the shared RPC, in the currency the customer
 * picked. ₱ is a PESO QUOTE from the Hub (`price_jpy` + currency "PHP"): the
 * Hub converts the yen price and computes the deposit, the monthly, the total
 * and the term minimums (min_amount_php) in pesos. Nothing here converts a
 * currency or applies a percentage (scripts/check-money.mjs); with no rate on
 * file the Hub answers fx_unavailable and the ₱ cells stay empty.
 *
 * `tone` picks the surface only. `header` and `cta` are optional card
 * furniture (the homepage passes them); with neither, and tone "dark", the
 * markup is exactly what it was before the prop existed.
 */
export function LayawayCalculator({ lang, initialPrice = 150000, className, header, cta }: {
  lang: Lang;
  initialPrice?: number;
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
  // to the one before it, and the CTA cannot tell either. The currency is part
  // of what it is for: a yen quote is never shown under ₱, nor the reverse.
  const [quote, setQuote] = useState<{ q: Quote; price: number; term: number; currency: Currency } | null>(null);
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
    // The currency is a Hub question like the term: switching ¥/₱ asks for a
    // quote in that currency, on the same debounce.
    const currency = display;
    const id = setTimeout(() => start(async () => {
      try {
        const r = await layawayQuote(price, term, currency);
        if (r.ok) { setQuote({ q: r.quote, price, term, currency }); setError(null); }
        else { setQuote(null); setError(r.code === "rate_unavailable" ? dict.checkout.rateUnavailable[lang] : c.err[lang]); }
      }
      catch { setQuote(null); setError(c.err[lang]); }
    }), 250);
    return () => clearTimeout(id);
  }, [price, term, display, validPrice, lang, c.err]);

  /**
   * FRESH means: these figures were computed for the number in the field and
   * the term that is selected, and nothing is in flight. Everything a customer
   * could act on hangs off this — the cells, the button, the note — so a stale
   * quote can never be read as a current one, and the button can never send
   * someone off with a figure that has already been replaced.
   */
  const shown = quote && quote.price === price && quote.term === term && quote.currency === display && quote.q.currency === display && !pending && !error ? quote.q : null;
  // The term list is the Hub's, not a constant here: plan_configurations is
  // what create-layaway-account and the DB trigger enforce, so a term this
  // calculator offers is a term the business can actually sell. An older Hub
  // response without allowed_terms falls back to the eligible-by-max rule.
  const maxTerm = shown?.max_term_months ?? 6;
  const terms = shown?.allowed_terms ?? FALLBACK_TERMS.map((m) => ({
    months: m, label: `${m}`, min_amount: 0, dp_percentage: 0.3, eligible: m <= maxTerm,
  }));
  // Formats the Hub's figure in the currency the Hub computed it in. No conversion.
  const fmt = (amount: number) => formatMoney(amount, shown?.currency ?? display);
  // The label's percentage is the Hub's too — the chosen term's dp_percentage —
  // and before the first quote the label carries none.
  const dpPct = shown?.allowed_terms?.find((tm) => tm.months === shown.term_months)?.dp_percentage;
  const dpLabel = dpPct != null
    ? c.dpPct[lang].replace("{pct}", new Intl.NumberFormat(lang === "ja" ? "ja-JP" : "en-US", { style: "percent", maximumFractionDigits: 1 }).format(dpPct))
    : c.dp[lang];
  // A term the Hub has but has not launched is listed and disabled rather
  // than dropped (owner decision 2026-09-16) — same rule as the reservation
  // flow, one source in lib/layaway-availability.
  const termOff = (tm: (typeof terms)[number]) => !termLaunched(tm.months) || !tm.eligible;
  const termSuffix = (tm: (typeof terms)[number]) =>
    !termLaunched(tm.months) ? ` · ${c.notLaunched[lang]}` : tm.min_amount > 0 ? ` · ${c.minFrom[lang].replace("{amount}", fmt(tm.min_amount))}` : "";
  const field = s.field;
  // THE FIGURES MOVE WHEN THE PLAN CHANGES — display only. Each cell rolls to
  // the Hub's new figure (components/fx/rolling.tsx: the last frame is the
  // exact string the cell showed before), and on every fresh quote the three
  // cells rise in one after another. Web Animations, no stylesheet; nothing
  // here touches an amount, a rounding or the request.
  const cells = useRef<HTMLOutputElement>(null);
  const reduced = useReduced();
  useEffect(() => {
    if (!shown || reduced !== false || !cells.current) return;
    Array.from(cells.current.children).forEach((el, k) => {
      if (typeof (el as HTMLElement).animate !== "function") return;
      (el as HTMLElement).animate(
        [{ opacity: 0.2, transform: `translateY(${RISE / 3}px)` }, { opacity: 1, transform: "none" }],
        { duration: DUR.reveal * 1000, delay: k * STAGGER.card * 1000, easing: `cubic-bezier(${EASE_LUX.join(",")})`, fill: "backwards" },
      );
    });
  }, [shown, reduced]);
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
      <output ref={cells} aria-live="polite" className="grid grid-cols-3 gap-3">
        <Cell k={dpLabel} v={<RollingValue value={shown ? shown.down_payment : null} format={fmt} />} keyClass={s.cellKey} valueClass={s.cellValue} />
        <Cell k={c.monthly[lang]} v={<RollingValue value={shown ? shown.monthly : null} format={fmt} />} keyClass={s.cellKey} valueClass={s.cellMonthly} />
        <Cell k={c.total[lang]} v={<RollingValue value={shown ? shown.total : null} format={fmt} />} keyClass={s.cellKey} valueClass={s.cellValue} />
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
          : error ?? (shown?.term_downgraded ? c.unavailableTerm[lang] : c.note[lang])}
      </p>
    </form>
  );
}
/** Only reached against a Hub that predates allowed_terms. */
const FALLBACK_TERMS = [3, 6, 8, 10, 12];

function Cell({ k, v, keyClass, valueClass }: { k: string; v: React.ReactNode; keyClass: string; valueClass: string }) { return <div><span className={keyClass}>{k}</span><b className={valueClass}>{v}</b></div>; }

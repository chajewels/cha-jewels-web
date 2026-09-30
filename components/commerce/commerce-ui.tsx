import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { ComponentStyle } from "@/components/fx/component-style";
import { HubImage } from "@/components/media/hub-image";
import { cn } from "@/lib/utils";
import type { PieceImage } from "@/lib/product-media";

/**
 * THE CART AND CHECKOUT PIECES (build step 3; comp page-comps/cart-checkout,
 * NOTES "What changed and why"). Presentational only: every figure passed in
 * is already the Hub's (or the cart's re-read Hub price), formatted by the
 * caller. Nothing here computes money.
 *
 *   OrderSlab     the dark summary slab — the PriceBlock grammar (charcoal-
 *                 deep, gold rule on top): the pieces with a small thumbnail,
 *                 hairline rows, the total in Pale Gilt, and the page's one
 *                 orange action when the caller passes it.
 *   StickyAct     the phone/tablet action bar (D3-5, the BuyBar grammar): the
 *                 figure and the page's orange action, always in reach. While
 *                 it is on the page the tab bar steps aside and the Messenger
 *                 button sits above it.
 *   Stepper       the four checkout steps with the gold progress rule.
 *   NextSteps     the confirmation's "what happens next" timeline.
 *   PieceWell     a piece's picture in a 1:1 chalk well, never cropped.
 *
 * No server-only or client-only imports, so the server pages and the client
 * checkout flow share them.
 */
const CSS = `
.cj-fig { font-variant-numeric: lining-nums tabular-nums; font-feature-settings: "lnum" 1, "tnum" 1; }
.cj-slab-rule { position: absolute; inset: 0 0 auto 0; height: 2px; background: linear-gradient(90deg, var(--c-gold-dark), var(--c-gold-pale), var(--c-gold-dark)); }
.cj-cut { position: absolute; inset: 10%; filter: drop-shadow(0 10px 10px rgb(35 29 18 / .18)); }
.cj-stage-cut { position: absolute; inset: 9%; filter: drop-shadow(0 6px 8px rgb(0 0 0 / .55)); }
.stickact { position: fixed; inset: auto 0 0 0; z-index: 40; }
.stickact::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 1px; background: linear-gradient(90deg, rgb(201 162 39 / 0), var(--c-gold) 25%, var(--c-gold-pale) 50%, var(--c-gold) 75%, rgb(201 162 39 / 0)); }
@media (min-width: 1024px) { .stickact { display: none; } }
@media (max-width: 1023.98px) {
  body:has([data-sticky-act]) [data-mobile-tab-bar] { display: none; }
  body:has([data-sticky-act]) .messenger-fab { bottom: calc(64px + 12px + env(safe-area-inset-bottom)); }
  body:has([data-sticky-act]) > footer { padding-bottom: calc(56px + 76px + env(safe-area-inset-bottom)); }
  body:has([data-sticky-act]):has(.messenger-fab) > footer { padding-bottom: calc(56px + 64px + 12px + 48px + 16px + env(safe-area-inset-bottom)); }
}
.cj-steps li::before { content: ""; position: absolute; top: -1px; left: 0; right: 0; height: 2px; background: transparent; }
.cj-steps li[data-at="done"]::before, .cj-steps li[data-at="cur"]::before { background: var(--c-gold-dark); }
.cj-next li { position: relative; }
.cj-next li:not(:last-child)::before { content: ""; position: absolute; left: 21px; top: 44px; bottom: 0; width: 1px; background: rgb(138 107 18 / .35); }`;

export function CommerceStyle() {
  return <ComponentStyle id="fx-commerce" css={CSS} />;
}

export type SlabLine = { key: string; name: string; image: PieceImage | null; price: string | null };

export function OrderSlab({ id, title, lines, rows, total, children, className }: {
  id?: string;
  title: string;
  lines: SlabLine[];
  rows: { k: string; v: ReactNode }[];
  total: { k: string; v: string; sub?: ReactNode };
  children?: ReactNode;
  className?: string;
}) {
  return (
    <aside id={id} aria-label={title} className={cn("band-dark relative scroll-mt-24 bg-charcoal-deep text-chalk", className)}>
      <CommerceStyle />
      <span aria-hidden="true" className="cj-slab-rule" />
      <div className="px-5 pb-6 pt-6 sm:px-[26px]">
        <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-pale">{title}</p>
        <ul className="grid gap-3 border-b border-rule pb-[18px]">
          {lines.map((l) => (
            <li key={l.key} className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3.5">
              <StageThumb image={l.image} alt={l.name} />
              <div className="min-w-0">
                <p className="text-[13px] leading-normal text-chalk/85 [font-variant-numeric:lining-nums]">{l.name}</p>
                {l.price && <p className="cj-fig mt-0.5 font-display text-[17px] text-gold-pale">{l.price}</p>}
              </div>
            </li>
          ))}
        </ul>
        <dl className="m-0">
          {rows.map((r) => (
            <div key={r.k} className="flex items-baseline justify-between gap-4 border-b border-rule py-3 text-sm">
              <dt className="text-chalk/80">{r.k}</dt>
              <dd className="cj-fig m-0 text-right text-chalk">{r.v}</dd>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-[18px]">
            <dt className="whitespace-nowrap text-sm font-medium text-chalk">{total.k}</dt>
            <dd className="m-0 text-right">
              <span className="cj-fig font-display text-[30px] leading-[1.1] text-gold-pale sm:text-[34px]">{total.v}</span>
            </dd>
            {total.sub && <dd className="cj-fig m-0 mt-1 w-full text-right text-[13px] leading-relaxed text-chalk/80">{total.sub}</dd>}
          </div>
        </dl>
        {children}
      </div>
    </aside>
  );
}

/** A piece on the dark slab: a cut-out stands on a charcoal stage; a whole photo sits on white, contained. */
function StageThumb({ image, alt }: { image: PieceImage | null; alt: string }) {
  const cut = image?.kind === "cut";
  return (
    <span className={cn("relative block h-16 w-16 overflow-hidden outline outline-1 -outline-offset-1 outline-gold/35", cut ? "bg-charcoal" : "bg-white")}>
      {image && (
        <span className={cut ? "cj-stage-cut" : "absolute inset-0"}>
          <HubImage src={image.src} alt={image.alt?.trim() || alt} fill sizes="64px" className="object-contain" />
        </span>
      )}
    </span>
  );
}

/** A piece's picture in a 1:1 chalk well (D3-12): the cut-out with air around it, or the whole photo contained. */
export function PieceWell({ image, alt, className }: { image: PieceImage | null; alt: string; className?: string }) {
  return (
    <span className={cn("relative block aspect-square overflow-hidden bg-chalk", className)}>
      {image && (
        <span className={image.kind === "cut" ? "cj-cut" : "absolute inset-0"}>
          <HubImage src={image.src} alt={image.alt?.trim() || alt} fill sizes="148px" className="object-contain" />
        </span>
      )}
    </span>
  );
}

/**
 * The phone/tablet action bar. `label` names the region for screen readers;
 * `children` is the page's orange action (a link or a button).
 */
export function StickyAct({ label, figure, note, children }: { label: string; figure: string; note?: string; children: ReactNode }) {
  return (
    <div
      data-sticky-act
      role="region"
      aria-label={label}
      className="stickact band-dark flex items-center gap-3 bg-charcoal-deep px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-2.5 lg:hidden"
    >
      <CommerceStyle />
      <p className="cj-fig shrink-0 font-display text-[20px] leading-[1.1] text-gold-pale">
        {figure}
        {note && <small className="block font-sans text-[11px] text-chalk/75">{note}</small>}
      </p>
      <div className="flex min-w-0 flex-1 [&>*]:w-full">{children}</div>
    </div>
  );
}

export type StepAt = "done" | "cur" | "todo";

export function Stepper({ steps, current, label, stepOf }: {
  steps: string[];
  /** 1-based; the signing gate keeps Payment lit. */
  current: number;
  label: string;
  stepOf: (n: number, label: string) => string;
}) {
  return (
    <ol aria-label={label} className="cj-steps mb-8 grid grid-cols-4 border-t border-hairline">
      <CommerceStyle />
      {steps.map((s, i) => {
        const n = i + 1;
        const at: StepAt = n < current ? "done" : n === current ? "cur" : "todo";
        return (
          <li
            key={s}
            data-at={at}
            aria-current={at === "cur" ? "step" : undefined}
            className={cn(
              "relative flex flex-col gap-1 pr-1 pt-3 text-[11px] font-medium sm:flex-row sm:items-baseline sm:gap-2.5 sm:pr-3 sm:pt-4 sm:text-[13px]",
              at === "cur" ? "text-charcoal-deep" : at === "done" ? "text-charcoal/80" : "text-charcoal/70",
            )}
          >
            <span className="sr-only">{stepOf(n, s)}</span>
            <span aria-hidden="true" className={cn("cj-fig font-display text-[17px] leading-none sm:text-[20px]", at === "todo" ? "text-charcoal/70" : "text-gold-dark")}>
              {at === "done" ? <Check className="inline h-4 w-4" strokeWidth={2} /> : n}
            </span>
            <span aria-hidden="true">{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function NextSteps({ heading, items }: { heading: string; items: { title: string; body?: string; now?: boolean }[] }) {
  return (
    <section className="mt-8">
      <CommerceStyle />
      <h2 className="mb-[18px] font-display text-[22px] text-charcoal-deep">{heading}</h2>
      <ol className="cj-next m-0 grid list-none p-0">
        {items.map((it, i) => (
          <li key={it.title} className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 pb-[26px]">
            <span
              aria-hidden="true"
              className={cn(
                "cj-fig grid h-11 w-11 place-items-center rounded-full border font-display text-[18px]",
                it.now ? "border-charcoal-deep bg-charcoal-deep text-gold-pale" : "border-gold-dark bg-chalk text-gold-dark",
              )}
            >
              {it.now ? <Check className="h-4 w-4" strokeWidth={2} /> : i + 1}
            </span>
            <div>
              <p className="mt-2.5 text-[15px] font-semibold text-charcoal-deep">{it.title}</p>
              {it.body && <p className="mt-1 text-sm leading-relaxed text-charcoal/80">{it.body}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The hairline note with a gold-dark icon (the comp's `.notice`). */
export function Notice({ icon, children, className }: { icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-[22px_minmax(0,1fr)] gap-3 border border-gold-dark/45 bg-gold-pale/15 px-[18px] py-4 text-sm leading-relaxed text-charcoal-deep", className)}>
      <span aria-hidden="true" className="text-gold-dark">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

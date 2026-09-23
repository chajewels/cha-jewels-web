/**
 * The collection card's entrance, in two beats, following the `data-reveal`
 * state of the <RevealGroup> around the row (components/fx/reveal.tsx):
 *
 *   1. a gold hairline draws across the top of the card, left to right;
 *   2. the photo wipes up from the bottom and settles from 1.06 to 1.
 *
 * Card by card along the row: each card carries its index as --i, and the
 * delays are --i × STAGGER.card (app/globals.css, `.card-line`/`.card-wipe`).
 *
 * PLAIN CSS TRANSITIONS, NOT motion. Both beats are fixed-time transitions
 * triggered by one state flag, which is what CSS does for free — and doing
 * them in motion cost the homepage bytes it did not have to spare
 * (docs/perf-baseline.md, motion budget). Same tokens, same curve, same look.
 * No "use client": these are server components.
 *
 * Nothing here can hide a card on first paint — the group renders "shown"
 * from the server and only drops to "hidden" if measured below the fold.
 * Reduced motion: the group never goes "hidden", so these never move.
 * The hairline stays when the entrance is over: the cards keep a gold top.
 */
export function CardEntrance({ index, className, children }: { index: number; className?: string; children: React.ReactNode }) {
  return <div className={className} style={{ ["--i" as string]: index }}>{children}</div>;
}

export function CardHairline() {
  return <span aria-hidden="true" className="card-line pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px] rounded-t-sm bg-gold" />;
}

export function CardWipe({ children }: { children: React.ReactNode }) {
  return <div className="card-wipe absolute inset-0">{children}</div>;
}

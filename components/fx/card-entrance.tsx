/**
 * The collection card's entrance, in two beats, following the `data-reveal`
 * state of the <RevealGroup> around the row (components/fx/reveal.tsx):
 *
 *   1. a gold hairline draws across the top of the card, left to right;
 *   2. the photo wipes up from the bottom and settles from 1.06 to 1.
 *
 * Card by card along the row: each card carries its index as --i, and the
 * delays are --i × --stagger (STAGGER.card, set by the group) (app/globals.css, `.card-line`/`.card-wipe`).
 *
 * Plain CSS transitions, like every entrance on the homepage: fixed-time
 * moves triggered by one state flag need no runtime (components/fx/reveal.tsx
 * says why that matters here). Timings are the lib/motion.ts tokens.
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
  return <span aria-hidden="true" className="card-line" />;
}

export function CardWipe({ children }: { children: React.ReactNode }) {
  return <div className="card-wipe">{children}</div>;
}

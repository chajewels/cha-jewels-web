# brewns — digit-roll mechanic only

Template `brewns` (dark-toned coffee house; mechanics only per docs/tasks/lumiere-redesign.md §7).
Fetched with `getlayers_source` (no template zip spent): `src/components/ui/digit-roll.tsx` (saved as digit-roll.tsx.txt so tsc skips it),
`src/components/common/robot-inview.tsx`, `src/components/animation/springs/in-view.tsx`.

Mechanic: a transparent copy of the string holds layout and the accessibility text; an
out-of-flow overlay stacks ten digit cells per column (`h-[1000%]`, each cell `h-[10%]`) clipped
by `clip-path: inset(0)` and springs `translateY(-d*10%)` with `{ tension: 90, friction: 26 }`,
staggered 70 ms per digit; non-digits are printed in place. Rendered in a monospace/tabular face so
the overlay needs no measuring.

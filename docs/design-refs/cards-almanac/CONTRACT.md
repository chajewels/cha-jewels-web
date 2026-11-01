# cards-almanac — contract

- mutable: skin
- preserve: motion, composition
- notes (verbatim): The pile is pure CSS position:sticky (each card sticks at top: base + i*peekPx) — that per-card sticky offset and DOM order ARE the mechanic; don't replace it with JS positioning. The rAF incline (risen/buried → perspective + rotateX) and the reveal-on-arrival stagger are tuned against scroll; leave the constants. Card covers, accent, copy, dates and the paper background are skin — retint and re-image freely.
- preview: https://www.getlayers.ai/?layer=cards-almanac
- sourceRef: sections/cards-almanac.html (materialized, target next)

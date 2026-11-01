# herbier-blanc — fetched sources (GetLayers MCP, 2026-11-01, `getlayers_source`, per file; the template zip was not spent)

Used for P4 (docs/tasks/lumiere-redesign.md §7): the product page's "paper sheets lifting between blocks" and the envelope reveal.

| file | what it is |
|---|---|
| `stack-block.tsx.txt` | the sheets: light blocks laid over the previous one, the block underneath in shade (max 0.45) and blur (10 px) and shifted 0.22 of a screen; header only — the constants and the contract; the full sticky arithmetic is in the template |
| the envelope (`product-envelope.tsx`) | an envelope whose flap opens as the block scrolls in to show a letter, drawn from SVG paper assets and a pen-written script |

Port: `.pdp-sheets` / `.pdp-sheet` in `app/lumiere/pages.css` — rounded-top sheets that lift into place on a CSS view timeline (the sticky stack of the reference is not used: the product page carries a sticky buy bar, a gallery viewer and a layaway calculator, and a pinned stack would trap them); `components/catalog/certificate-envelope.tsx` — a CSS envelope with the flap and the letter on a view timeline, **rendered only when the Hub's product data carries a certificate** (`lib/certificate.ts`; the contract names none today, so no product page shows it). Brewns' card lean: `components/catalog/lean-card.tsx` (mechanics only: a CSS tilt toward the pointer, fine pointers only; no 3D).

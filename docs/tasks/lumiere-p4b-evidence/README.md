# P4b evidence

**The screenshots are not in this branch.** Review images are not code history, so they live on the orphan branch **`evidence/lumiere-p4b`** (no parent, never merged): `https://github.com/chajewels/cha-jewels-web/tree/evidence/lumiere-p4b`. This folder keeps the text only (this index, the route table, the Lighthouse tables); `.gitignore` keeps `docs/tasks/lumiere-p*-evidence/**/*.{jpg,jpeg,png,webp,gif}` out of future commits. The folder names below (`after-en/`, `misc/`, `account-nav-widths/` …) are the folders on that branch.

- `route-table.md` — every route × 1440/375 × EN/JA, signed out and signed in (170 rows, all PASS): status, one h1, no horizontal overflow, header and footer, the menu opened (the account dropdown above the page content and opaque when signed in), console clean, JA display lines in the Mincho.
- `misc/A-*` — findings A1–A4: the account menu open over `/account` and `/account/orders` before and after, the account page at 375, the header after. (Before = the P4 build, #469.)
- `before-en/` — the pages as P4 left them (EN, 1440). The account-family "before" set was partly captured while that agent's class-replacement script was running, so a few detail pages are already partly restyled; the list pages are clean.
- `after-en/`, `after-ja/` — the final build, full page, reduced motion on (entrance animations rest). `d-` = 1440, `m-` = 375 (EN; legal pages omitted at 375 for size, JA phone omitted — covered by the route table).
- `lighthouse-*.md` — the perf tables (also in `docs/perf-baseline.md`).

## What was recomposed, and which reference
| Page(s) | Composition | Reference |
|---|---|---|
| Blog index / article | head + sheet; posts as bone plates (cover, date tag, display title, sliding black "Read" band); article = ink head, cover and body on an overlapping sheet; comments and share in plates | Halden, Herbier Blanc sheets |
| FAQ | head + sheet; each group a plate, each question a rounded row with a black pill +/-; sticky nav as pills with count chips | Herbier Blanc sheets |
| Jewelry guide, Shopping guide | ink head with numbered contents pills; chapters alternating bone/white with resolving numbers; steps as plates; sizers untouched | Herbier Blanc, Aerra, Colonnade |
| Legal (privacy, returns, terms, tokushō) | restrained: bone head, pill tabs, white sheet, pill contents, rounded rail; no announcement chrome | Herbier Blanc sheets |
| Contact, Wholesale, Affiliations | contact methods / terms / affiliations as plates; forms on a white sheet (markup only: validation, honeypot, rate limit, consent kept) | Herbier Blanc sheets |
| Layaway (EN) | ink head with the three plan steps as numbered plates; calculator on a sheet; reservable pieces; questions as rounded rows | Halden, Herbier Blanc |
| Loyalty, Join | ink head, base-rate facts as plates with resolving figures; tier ladder as four plates (medallions untouched); join card on a sheet | Aerra, Herbier Blanc |
| Sale, Search, Categories | Halden heads; empty states as plates; JSON-LD, breadcrumbs, noindex untouched | Halden |
| Cart, Checkout, completion pages | lines as plates; sticky ink summary plate with the black-pill CTA; checkout steps as plates (class-only edits — 0 non-class line differences in `checkout-flow.tsx`) | Herbier Blanc sheets |
| Account (overview, orders, order detail, layaway, receipts, addresses, service requests, complete-profile), pay-card (chrome only) | bone head, white plate side list / pill chip row, ink points plate with the ladder, tables kept as tables in rounded plates, timeline as numbered circles | none (own composition) |
| Login, auth/confirm, already-registered, review, receipts/verify, unsubscribe pages, 404, error | `PageHead` + plates; one centred plate for sign-in | none (own composition) |

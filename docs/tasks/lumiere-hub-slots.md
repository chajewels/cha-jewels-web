# Lumière home — image and model slots, and where the Hub fills them

**P5b (2026-11-02): no placeholder remains — every slot below with "no Hub source" now draws a Cha Jewels original (`lib/lumiere/home-media.ts`, table in `docs/tasks/lumiere-p5b-media.md`); the Hub fields stay a DRAFT for the owner and Lovable. Nothing in this file has been run, applied to the Hub, or added to `supabase/contracts/api.md`; no SQL is included (Cynthia runs all SQL; Lovable owns migrations and `supabase/functions/`).** The storefront reads only what the Hub already sends. Where the Hub has no source, the registered placeholder (`lib/lumiere/placeholders.ts`) stays and the slot is listed here. `npm run check:placeholders` prints the same split from the directory itself and fails on a file that is in neither list.

## 1. Slots the Hub fills today (wired in P5; the placeholder is only the fallback)
| Slot | Where it shows | Hub source (existing) | Behaviour |
|---|---|---|---|
| Collections cards (5) | home, collections block | `GET /catalog/categories` → `Category.hero_media` (the photograph the category pages and the menu already use), slug match | Hub photo, centred crop; the placeholder when `hero_media` is null. A photo the optimiser cannot fetch is drawn unoptimised, never refused. |
| Hero card ring, cards 1–7 | home, hero | the existing hero deck (`lib/hero-deck.ts`: active, in stock, never sold; first photo of each piece, one per category per turn) | Real pieces; a card with no available piece keeps its placeholder. Hero cut-outs are not used here (these are rectangular cover crops); the original-tool/Photoroom separation (`check:cutouts`) is untouched. |
| Featured left panel (5) | home, featured block | `GET /catalog/products?featured=1&limit=12` | Name (as the product page prints it), yen price as sent, metals as stamped, first photograph, **Add to cart enabled** through the product page's own action and analytics event (`addToCart`, `trackAddToCart`). A sold or photo-less piece is skipped; there are no stand-in pieces. The right stage draws the SAME piece (P5b): its approved Photoroom cut-out as the product pages show it, else its photograph on a clean plate. The block shows the Hub's 1–5 featured pieces and is not drawn when there are none. |

## 2. Slots with NO Hub source today (proposals; nothing invented)
| Slot | Current placeholder | Proposed Hub field / table | Admin UI | Image / model specs | Fallback until then |
|---|---|---|---|---|---|
| Hero frame-3 photograph (card 8, the full-screen "hand wearing a ring") | `hero/card-08.webp` | `site_media` row, key `home.hero.frame3` (`url`, `alt_en`, `alt_ja`, `focal_x`, `focal_y`) | Settings → Home media → one upload slot | 3:4 portrait, ≥ 1440 px long side, WebP/JPEG, ≤ 400 KB at q 90, alt in both languages | the placeholder (preview only; strict check blocks release) |
| Hero pendant model + posters | `models/pendant-emerald.glb`, `hero/pendant-emerald*.webp` | `site_media` key `home.hero.pendant` (`glb_url`, `poster_url`, `poster_compact_url`) | upload slot with GLB validator | GLB ≤ 1.5 MB (Draco), poster 842×1112 and compact 1024×1536 WebP | the placeholder |
| Featured 3D rings (5) + posters | `models/rings/ring-0N.glb`, `featured/ring-0N.webp` | `products.model_glb_url`, `products.model_poster_url` (nullable, per product) so a featured piece brings its own model; or `site_media` keys `home.featured.1…5` | product form: "3D model" upload + poster | GLB ≤ 1 MB each (Draco), poster 490×530 WebP, transparent | the placeholder rings; the left panel is already the real piece |
| Philosophy plates (backdrop wide / narrow) | `philosophy/backdrop-frame*.jpg` | `site_media` keys `home.philosophy.backdrop`, `home.philosophy.backdrop_narrow` | upload slots | wide 1440×1768, narrow 720×2529 JPEG, pre-stretched | the placeholder |
| Philosophy hand photograph | `philosophy/hand-with-ring.webp` | `site_media` key `home.philosophy.hand` | upload slot | 1164×1316 WebP, alt EN/JA | the placeholder |
| Why / values panel photographs (4) | the collections placeholders (`collections/*.webp`) | `site_media` keys `home.why.1…4` (or reuse the four `Category.gallery_media` photos) | upload slots | 4:3, ≥ 1200 px, WebP | the placeholder |
| A hero card the Hub cannot fill (fewer than 7 available pieces) | `hero/card-01…07.webp` | none needed — the deck fills as stock grows | — | — | placeholder per empty card |

## 3. Decisions for the owner
1. One generic `site_media` table (key, url, alt_en, alt_ja, focal point, updated_at) versus per-feature columns. Recommended: `site_media`, because the home has ~10 editorial slots and no product owns them.
2. Should the featured 3D model live on the product (a real ring brings its own model) or on the home slot? Recommended: on the product — the right stage then always shows the piece named on the left.
3. Who produces the 3D models and the editorial photographs (these are the Cha Jewels originals the release waits for)?

## 3b. Hero centrepiece (P5b)
The ring's centre is the best real piece of the hero deck — its approved hero cut-out (the original tool) standing free, else the first deck photograph in a rounded frame — with the old pendant's entrance and tilt; a Cha original still life when the deck is empty. The 3D pendant path remains in code behind `content.pendant3d` (null until a site media model `home.hero.pendant` exists).

## 3c. Hero selection (P5c, owner decision a)
The hero ring and centre take ONLY pieces with an approved hero cut-out (transparent background, the original tool), set on the cream plate: the first is the centre, the next eight the cards, one piece per category slide per turn (the deck's order). A place without a cut-out is left empty (fewer cards, never mixed backgrounds). **Later, in the Hub:** an owner-curated hero selection (which pieces, in which order) — a ticked/ordered list read through `lib/hero-deck.ts`, which already reads `hero_place` / `picked_at` — replaces the round-robin; nothing on the storefront changes shape.

## 4. What this means for release
`npm run check:placeholders --strict` passes (P5b). Managed uploads through the Hub fields in section 2 are an upgrade, not a blocker.

# P5b — which Cha Jewels file goes in which home slot

Owner decision 4 (2026-11-02): no stock or Lumière imagery on any page. Everything is a file the site already ships under `public/images/**`, except the two blurred backdrop plates, which are derived from one of them (`scripts/make-lumiere-plates.mjs`). Registry: `lib/lumiere/home-media.ts`. The Hub's photographs stay first wherever a Hub source exists (`lib/lumiere/home-hub.ts`); the files below are the slots with **no Hub source** and the fallbacks of Hub slots.

| Slot | File | Crop | Alt EN | Alt JA |
|---|---|---|---|---|
| Hero frame 3 (card 8, full-screen photograph) | `collections/rings.webp` (1200×900) | cover; the existing `--frame3-crop`, rings sit at 44–65 % across so the portrait window keeps all three | A hand wearing three Cha Jewels gold rings | Cha Jewelsのゴールドリングを3本着けた手 |
| Hero cards 1–7 when the deck has fewer pieces (in order) | `collections/necklaces`, `earrings`, `pendants`, `bracelets`, `pearls`, `handmade-gemstone-bracelets`, `anklets` `.webp` | cover, `50% 45%` | Pearl and gold necklaces worn together / Gold hoop earrings and pearl earrings / Three pendant necklaces: hammered gold, pearl and diamond / Gold and diamond bracelets on the wrist / Pearl necklaces, bracelet, earrings and pendant / Handmade gemstone bracelets with gold beads / A gold anklet | ネックレス・ピアス・ペンダント・ブレスレット・パール・天然石ブレスレット・アンクレットの各説明（`home-media.ts`） |
| Hero centrepiece when the deck is empty | `company/why-cha-jewels.webp` (1400×933) | rounded frame, cover | A Cha Jewels gold necklace, ring and pearl earrings arranged on cream fabric (the page's own `why.imageAlt`) | クリーム色の布の上に並べたCha Jewelsのゴールドネックレス、リング、パールピアス |
| Collections cards when the category has no `hero_media` | fine-jewelry → `collections/pendants`; preloved-jewelry → `necklaces`; preloved-branded-jewelry → `earrings`; preloved-watches → `bracelets`; preloved-designer-accessories → `pearls` (`.webp`) | centred cover | as the cards above | as the cards above |
| Philosophy backdrop (wide ≥ 1024 / narrow) | `home/philosophy-backdrop.webp` 480×590, `home/philosophy-backdrop-narrow.webp` 240×843 — blurred crops of `home/pomelli-hero.webp` | stretched to the frame (the plate is a blur) | "" (decorative) | "" |
| Philosophy hand photograph | `collections/rings.webp` | cover inside the card | A hand wearing three Cha Jewels gold rings | Cha Jewelsのゴールドリングを3本着けた手 |
| Why panel 1 — Timeless | `company/why-cha-jewels.webp` | cover | (why.imageAlt) | (why.imageAlt) |
| Why panel 2 — Value | `home/hero-poster.webp` | cover | Grains of gold in a crucible, ready to be cast | 鋳造を待つ、るつぼの中の金の粒 |
| Why panel 3 — Craftsmanship | `home/values-artisan.webp` | cover | An artisan stringing pearls by hand | パールを手で通す職人 |
| Why panel 4 — Quality | `home/pomelli-hero.webp` | cover | Gold chains resting on green velvet | 緑のベルベットに重ねたゴールドのチェーン |

No slot lacked a suitable Cha image, so none is listed for the owner. Two judgment calls to confirm: the frame-3 photograph is a 1200 × 900 landscape (it is sharp up to ~1200 px wide and softens slightly on a 1440+ desktop — a larger original would help), and `home/hero-poster.webp` / `values-artisan.webp` / `pomelli-hero.webp` are the current home's own art.

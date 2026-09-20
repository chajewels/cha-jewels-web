# Homepage integration — Step 1 findings (investigation only)

Captured 2026-09-19 from `origin/develop` = `origin/main` = `e8cde5114b3a6c30c5ee9796077e95cfff692cf0`
("Merge pull request #61 from chajewels/develop", 2026-09-19 09:00 +0900). `git diff --quiet origin/develop origin/main`
exits 0: the two trees are byte-identical. Every excerpt below is `git show origin/develop:<path>`, never the working tree.
No writes, commits, pushes or branches were made; this file is the only thing added, and it is uncommitted.

Environment note: this was run in an ephemeral Claude Code remote container. `~/Documents/Cha Jewels Web`, `~/web-prune`
and the claude-mem plugin do not exist there (no plugin is installed, so there was nothing to disable). The repo was
cloned read-only to `/home/user/chajewels/cha-jewels-web` with `origin/develop` and `origin/main` fetched explicitly.

---

## a. `app/page.tsx` — sections in order, and what each fetches

All data is fetched once, up front, at line 16 (`Promise.all`); `export const revalidate = 60` at line 13 (ISR, 60 s).

```
16  const [lang, collections, featured, fx] = await Promise.all([getLang(), getCollections().catch(() => []), getFeaturedProducts(8).catch(() => []), hub.fx().catch(() => ({ jpy_php: 0.39, as_of: "" }))]);
17  const t = tr(lang);
18  const layaway = layawayOffered(lang);
```

| Call | Resolves to | Source |
|---|---|---|
| `getLang()` | `cj-lang` cookie, else `Accept-Language` | `lib/i18n-server.ts:15-18` via `resolveLang` |
| `getCollections()` | `hub.collections()` → `GET /catalog/collections` (or fixtures when `NEXT_PUBLIC_PREVIEW_FIXTURES=1`) | `lib/queries/products.ts:6`, `lib/hub-api.ts:53` |
| `getFeaturedProducts(8)` | `hub.featured(8)` → `GET /catalog/products?featured=1&limit=8` | `lib/queries/products.ts:9`, `lib/hub-api.ts:59` |
| `hub.fx()` | `GET /fx` with `revalidate: 3600, tags: ["fx"]`; fixture `{ jpy_php: 0.39, as_of: "2026-09-08" }`; page-level fallback `{ jpy_php: 0.39, as_of: "" }` | `lib/hub-api.ts:64`, `app/page.tsx:16` |
| `layawayOffered(lang)` | `LAYAWAY_LANGS = ["en"]` — true only on `en` | `lib/layaway-availability.ts:34-38` |

Sections, in render order:

1. **`<JsonLd type="store" />`** — line 27. No fetch.
2. **Hero** — lines 28–52. `<section className="pomelli-hero border-b border-rule-soft">`. `<Image src="/images/home/pomelli-hero.webp" alt="" fill priority>` (line 30, decorative, empty alt). Headline `t("hero","h1a")` / `t("hero","h1b")` (lines 39–40), `pomelli-ornament` (42), lede `t("hero","lede")` + `t("hero","lede2")` (44–45). CTA row (47–50):
   ```
   48  <Button asChild className="border-[#FFA500] bg-[#FFA500] text-[#333333] hover:bg-[#ffb733]"><Link href="/collections">{t("hero", "cta1")}</Link></Button>
   49  {layaway && <Button asChild variant="ghost" className="border-white/70 text-white hover:border-white"><Link href="/layaway">{t("hero", "cta2")}</Link></Button>}
   ```
   Fetches nothing beyond `lang`. Hardcoded hex `#FFA500`, `#333333`, `#ffb733` at line 48.
3. **Values** — lines 54–82. `pomelli-values`. `<Image src="/images/home/pomelli-values.webp" alt={t("home","valuesImageAlt")}>` (58–59). Eyebrow `valuesEyebrow`, `<h2>` `valuesH`, intro `valuesP`, then the four `values` entries built at lines 19–24 (`valueTimeless*`, `valueWorth*`, `valueCraft*`, `valueQuality*`) rendered as `<article className="pomelli-value">` with a zero-padded number (72). No fetch.
4. **Collections** — lines 84–100. `pomelli-collections`. Heading `colsH`, ornament, `colsP` (87–89). Grid at 91: `grid-cols-2 lg:grid-cols-3`, mapping `collections` (from `getCollections()`) to `<Link href="/collections/${c.slug}" className="pomelli-collection-card min-h-[220px] p-6">` with `collectionName(c, lang)` and optional `collectionDescription(c, lang)` (93–96).
5. **New on the bench / featured** — lines 101–109. Unstyled-class section (`border-b border-rule-soft py-[clamp(64px,9vw,120px)]`). `<h2>` `newH` (104), `<Link className="text-gold-pale underline underline-offset-4" href="/collections">` `viewAll` (105). Grid at 107: `rule-grid grid grid-cols-2 lg:grid-cols-4` mapping `featured` (from `getFeaturedProducts(8)`) to `<ProductCard product lang />`.
6. **Layaway** — lines 110–120, rendered only when `layaway` is true (English). Comment at 110–112: "Layaway is English-only (owner decision 2026-09-15). The section and the calculator go together". `<section id="layaway">`, `<h2>` `layH`, `<p className="mt-4 max-w-[46ch] text-champagne/75">` `layP` (116), then:
   ```
   117  <LayawayCalculator lang={lang} phpRate={fx.jpy_php} phpRateAsOf={fx.as_of} />
   ```
   This is the only consumer of `hub.fx()`.

Copy strings (from `lib/i18n.ts`): `hero` at lines 103–110, `home` at 112–128. Note `home.layP.en` (line 129) reads "…the balance in equal monthly amounts at 0% interest…" — the phrase "0% interest" lives in i18n copy, not in `page.tsx`.

---

## b. `app/globals.css` — every `.pomelli-*` rule (verbatim, lines 17–270)

Preamble for context (lines 4–15): `body { @apply bg-velvet text-champagne font-sans antialiased; }` (7), `h1,h2,h3 { @apply font-display … }` (8), `:lang(ja) h1… { @apply font-jp … }` (9), focus ring `outline-gold-pale` (10), `.gilt` gradient (14), `.wrap` (15).

```
17    /* Pomelli-inspired home introduction. Deliberately scoped to the hero and
18       values sections so the storefront, checkout and account UI keep their
19       established colours and behaviour. */
20    .pomelli-hero {
21      position: relative;
22      isolation: isolate;
23      min-height: min(860px, calc(100svh - 68px));
24      display: grid;
25      place-items: center;
26      overflow: hidden;
27    }
28    .pomelli-hero__image {
29      z-index: -2;
30      object-position: 82% center;
31    }
32    .pomelli-hero::before {
33      content: "";
34      position: absolute;
35      inset: 0;
36      z-index: -1;
37      background: linear-gradient(135deg, rgba(51,51,51,.82) 0%, rgba(26,188,156,.54) 100%);
38    }
39    .pomelli-hero__content {
40      width: 100%;
41      padding-block: clamp(88px, 12vw, 160px);
42      text-align: center;
43      color: #fff;
44    }
45    .pomelli-hero__headline {
46      margin-inline: auto;
47      max-width: 17ch;
48      color: #FFA500;
49      font-family: var(--font-sans), "Helvetica Neue", Arial, sans-serif;
50      font-size: clamp(40px, 5vw, 64px);
51      font-weight: 600;
52      line-height: 1.16;
53      letter-spacing: .01em;
54      text-shadow: 0 4px 20px rgba(0,0,0,.5);
55    }
56    :lang(ja) .pomelli-hero__headline {
57      font-family: var(--font-jp), "Hiragino Kaku Gothic ProN", sans-serif;
58      font-weight: 500;
59    }
60    .pomelli-hero__lede {
61      margin-inline: auto;
62      max-width: 920px;
63      color: rgba(255,255,255,.95);
64      font-size: clamp(15px, 1.15vw, 18px);
65      line-height: 1.75;
66      text-shadow: 0 2px 10px rgba(0,0,0,.5);
67    }
68    .pomelli-hero__lede p + p { margin-top: 16px; }
69    .pomelli-ornament {
70      margin: 28px auto 30px;
71      display: flex;
72      width: min(164px, 42vw);
73      align-items: center;
74      gap: 13px;
75    }
76    .pomelli-ornament::before,
77    .pomelli-ornament::after {
78      content: "";
79      height: 1px;
80      flex: 1;
81      background: #FFA500;
82    }
83    .pomelli-ornament span {
84      width: 12px;
85      height: 12px;
86      transform: rotate(45deg);
87      background: #1ABC9C;
88    }
89
90    .pomelli-values {
91      background: #333333;
92      color: #fff;
93      padding-block: clamp(72px, 9vw, 120px);
94    }
95    .pomelli-values__grid {
96      display: grid;
97      align-items: center;
98      gap: clamp(48px, 6vw, 80px);
99    }
100   .pomelli-values__image {
101     position: relative;
102     min-height: clamp(440px, 72vw, 700px);
103     overflow: hidden;
104     box-shadow: 24px 24px 0 rgba(26,188,156,.17);
105   }
106   .pomelli-values__content h2 {
107     margin-top: 10px;
108     color: #fff;
109     font-family: var(--font-sans), "Helvetica Neue", Arial, sans-serif;
110     font-size: clamp(38px, 4.4vw, 58px);
111     font-weight: 600;
112     line-height: 1.08;
113     letter-spacing: .02em;
114   }
115   :lang(ja) .pomelli-values__content h2 {
116     font-family: var(--font-jp), "Hiragino Kaku Gothic ProN", sans-serif;
117     font-weight: 500;
118   }
119   .pomelli-values__eyebrow {
120     color: #FFA500;
121     font-size: 12px;
122     font-weight: 600;
123     letter-spacing: .2em;
124     text-transform: uppercase;
125   }
126   .pomelli-values__intro {
127     margin-top: 22px;
128     max-width: 56ch;
129     color: rgba(255,255,255,.72);
130     line-height: 1.75;
131   }
132   .pomelli-values__list {
133     margin-top: 36px;
134     border-top: 1px solid rgba(255,255,255,.16);
135   }
136   .pomelli-value {
137     display: grid;
138     grid-template-columns: 42px 1fr;
139     gap: 18px;
140     padding-block: 20px;
141     border-bottom: 1px solid rgba(255,255,255,.16);
142   }
143   .pomelli-value__number {
144     padding-top: 4px;
145     color: #1ABC9C;
146     font-size: 12px;
147     font-weight: 600;
148     letter-spacing: .14em;
149   }
150   .pomelli-value h3 {
151     color: #FFA500;
152     font-family: var(--font-sans), "Helvetica Neue", Arial, sans-serif;
153     font-size: clamp(21px, 2vw, 28px);
154     font-weight: 600;
155     line-height: 1.2;
156   }
157   :lang(ja) .pomelli-value h3 {
158     font-family: var(--font-jp), "Hiragino Kaku Gothic ProN", sans-serif;
159     font-weight: 500;
160   }
161   .pomelli-value p {
162     margin-top: 7px;
163     color: rgba(255,255,255,.7);
164     font-size: 14px;
165     line-height: 1.65;
166   }
167   @media (min-width: 768px) {
168     .pomelli-values__grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
169     .pomelli-values__image { min-height: 700px; }
170   }
171   @media (max-width: 767px) {
172     .pomelli-hero { min-height: 680px; }
173     .pomelli-hero__image { object-position: 68% center; }
174     .pomelli-hero__content { padding-block: 76px; }
175     .pomelli-values__image { box-shadow: 14px 14px 0 rgba(26,188,156,.17); }
176   }
177
178   .pomelli-collections {
179     position: relative;
180     isolation: isolate;
181     overflow: hidden;
182     padding-block: clamp(72px, 9vw, 120px);
183     background:
184       radial-gradient(circle at 38% 42%, rgba(255,165,0,.13), transparent 31%),
185       radial-gradient(circle at 78% 24%, rgba(26,188,156,.07), transparent 27%),
186       #F5F5F2;
187     color: #333333;
188   }
189   .pomelli-collections::before {
190     content: "";
191     position: absolute;
192     inset: -20%;
193     z-index: 0;
194     pointer-events: none;
195     opacity: .72;
196     background:
197       linear-gradient(118deg, transparent 0 21%, rgba(255,255,255,.9) 21.1% 21.25%, transparent 21.35%),
198       linear-gradient(62deg, transparent 0 35%, rgba(255,255,255,.8) 35.1% 35.25%, transparent 35.35%),
199       linear-gradient(142deg, transparent 0 58%, rgba(232,216,190,.48) 58.1% 58.25%, transparent 58.35%),
200       linear-gradient(28deg, transparent 0 73%, rgba(255,255,255,.8) 73.1% 73.25%, transparent 73.35%);
201     transform: rotate(-3deg) scale(1.08);
202   }
203   .pomelli-collections__heading {
204     margin-inline: auto;
205     max-width: 760px;
206     text-align: center;
207   }
208   .pomelli-collections__heading h2 {
209     color: #333333;
210     font-family: var(--font-sans), "Helvetica Neue", Arial, sans-serif;
211     font-size: clamp(38px, 4.4vw, 60px);
212     font-weight: 600;
213     line-height: 1.08;
214     letter-spacing: .035em;
215     text-transform: uppercase;
216   }
217   :lang(ja) .pomelli-collections__heading h2 {
218     font-family: var(--font-jp), "Hiragino Kaku Gothic ProN", sans-serif;
219     font-weight: 500;
220   }
221   .pomelli-collections__heading .pomelli-ornament {
222     margin-block: 26px 24px;
223   }
224   .pomelli-collections__heading p {
225     color: rgba(51,51,51,.72);
226     line-height: 1.75;
227   }
228   .pomelli-collections__grid {
229     gap: clamp(12px, 2vw, 24px);
230   }
231   .pomelli-collection-card {
232     position: relative;
233     display: flex;
234     flex-direction: column;
235     justify-content: flex-end;
236     overflow: hidden;
237     border: 1px solid rgba(51,51,51,.12);
238     background: #444444;
239     box-shadow: 0 16px 34px rgba(51,51,51,.12);
240     transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
241   }
242   .pomelli-collection-card::before {
243     content: "";
244     position: absolute;
245     inset: 0 auto 0 0;
246     width: 4px;
247     background: linear-gradient(#FFA500, #1ABC9C);
248   }
249   .pomelli-collection-card h3 {
250     color: #FFA500;
251     font-family: var(--font-sans), "Helvetica Neue", Arial, sans-serif;
252     font-size: clamp(23px, 2.2vw, 30px);
253     font-weight: 600;
254     line-height: 1.15;
255   }
256   :lang(ja) .pomelli-collection-card h3 {
257     font-family: var(--font-jp), "Hiragino Kaku Gothic ProN", sans-serif;
258     font-weight: 500;
259   }
260   .pomelli-collection-card p {
261     margin-top: 10px;
262     color: rgba(255,255,255,.72);
263     font-size: 14px;
264     line-height: 1.6;
265   }
266   .pomelli-collection-card:hover {
267     transform: translateY(-4px);
268     border-color: rgba(26,188,156,.55);
269     box-shadow: 0 22px 42px rgba(51,51,51,.18);
270   }
```

Observations: all three pomelli sections override the global `font-display` (Bodoni Moda) with `var(--font-sans)` (Archivo) and use hardcoded `#FFA500` / `#1ABC9C` / `#333333` / `#F5F5F2` / `#444444` rather than the Tailwind palette. Rules 272–279 (`.rule-grid`) are not pomelli but are used by the featured grid on the home page.

---

## c. `tailwind.config.ts` — `colors` and `fontFamily` (verbatim, lines 6–17)

```
6        colors: {
7          velvet: { DEFAULT: "#0F2A22", deep: "#0A1D17", soft: "#143A2F" },
8          gold: { DEFAULT: "#C9A227", pale: "#E8D28A", dark: "#8A6B12" },
9          champagne: "#F3EBDB",
10         ink: "#17130E",
11         garnet: "#7A1E2B",
12       },
13       fontFamily: {
14         display: ["var(--font-display)", "Didot", "serif"],
15         jp: ["var(--font-jp)", "Hiragino Mincho ProN", "serif"],
16         sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "sans-serif"],
17       },
```

Adjacent (line 18): `borderColor: { rule: "rgba(201,162,39,.32)", "rule-soft": "rgba(201,162,39,.16)" }` — both derived from gold `#C9A227`. Line 19: `maxWidth: { site: "1240px" }`. `content` (line 3) scans `./app/**/*.{ts,tsx}` and `./components/**/*.{ts,tsx}` only.

---

## d. `app/layout.tsx` — the three `next/font/google` declarations (verbatim, lines 3, 14–16)

```
3   import { Bodoni_Moda, Archivo, Noto_Serif_JP } from "next/font/google";
14  const display = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
15  const sans = Archivo({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
16  const jp = Noto_Serif_JP({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jp", display: "swap" });
```

| Font | Weights | CSS variable | Consumed by |
|---|---|---|---|
| Bodoni Moda (400, 500; normal + italic) | `--font-display` | `fontFamily.display` → `font-display`; global `h1,h2,h3` |
| Archivo (400, 500, 600) | `--font-sans` | `fontFamily.sans` → `font-sans` on `body`; every `.pomelli-*` heading |
| Noto Serif JP (400, 500) | `--font-jp` | `fontFamily.jp` → `font-jp`; `:lang(ja)` headings and `.pomelli-*` `:lang(ja)` overrides |

Applied at line 36: `<html lang={lang} className={`${display.variable} ${sans.variable} ${jp.variable}`}>`. Line 53 skip-link uses `bg-gold … text-ink`.

---

## e. `components/commerce/layaway-calculator.tsx` — props, FX rate, rate date

Props (line 9, verbatim):
```
9   export function LayawayCalculator({ lang, initialPrice = 150000, phpRate, phpRateAsOf, className }: { lang: Lang; initialPrice?: number; phpRate: number; phpRateAsOf?: string; className?: string }) {
```
- `lang: Lang` (required)
- `initialPrice?: number` (default 150000)
- `phpRate: number` (required)
- `phpRateAsOf?: string` (optional)
- `className?: string` (optional)

**Yes, it renders both an FX rate conversion and a rate date.**

- Rate is USED for every peso figure (line 32): `const fmt = (jpy: number) => (display === "PHP" ? formatMoney(toPhp(jpy, phpRate), "PHP") : formatMoney(jpy, "JPY"));` with `toPhp = (jpy, rate) => Math.round(jpy * rate)` (`lib/utils.ts:11`). The numeric rate itself is never printed.
- Rate DATE is rendered (line 68):
  ```
  68  {display === "PHP" && phpRateAsOf && <p className="text-xs text-champagne/45">{c.rateAsOf[lang].replace("{date}", phpRateAsOf.slice(0, 10))}</p>}
  ```
  with `calc.rateAsOf = { ja: "レート基準日 {date}", en: "Rate as of {date}" }` (`lib/i18n.ts:132`). Only shown when the PHP toggle is active AND `phpRateAsOf` is non-empty (the page-level fallback passes `""`, which suppresses it).
- The JPY/PHP toggle (line 57) and `calc.phpNote` (line 66: "Peso figures are indicative at today's rate. Payments are settled in yen.") are the other rate-adjacent UI.
- Line 8 doc comment: "Renders numbers returned by the shared RPC. Peso figures are display conversions at the Hub's rate; no layaway math here." Quote comes from `layawayQuote(price, term)` (`lib/layaway`), debounced 250 ms (lines 17–23).
- Palette use inside: `bg-velvet`, `bg-velvet-deep`, `text-champagne` (×7), `bg-gold text-ink`, `text-gold-pale`, `border-rule`.

---

## f. Palette blast radius — references on `origin/develop`

Method: `git grep -w` (word-boundary) over the whole tree, excluding `package-lock.json`. Two numbers per token: **occurrences** (`grep -o`) and **matching lines / files** (`grep -c`). Caveat: `-w gold` also matches `gold` inside hyphenated classes (`text-gold-pale`, `bg-gold`) and in prose/copy (`lib/i18n.ts`, `CLAUDE.md`, `README.md`, SQL comments), so the `gold` row is a superset of `gold-pale`. `champagne` is likewise a superset of `text-champagne`, and `velvet` of `bg-velvet`.

| Token | Occurrences | Lines | Files |
|---|---|---|---|
| `bg-velvet` | 72 | 71 | 29 |
| `text-champagne` | 233 | 229 | 46 |
| `gold` | 260 | 207 | 66 |
| `gold-pale` | 132 | 124 | 46 |
| `gold-dark` | 0 | 0 | 0 (defined only as `dark:` inside the `gold` object at `tailwind.config.ts:8`; never used as a class) |
| `champagne` | 235 | 231 | 47 |
| `ink` | 6 | 6 | 6 |
| `garnet` | 12 | 12 | 10 |
| `velvet` | 74 | 73 | 31 |

Union of source files touched by any of the nine tokens (66 distinct files; the `gold` list is the superset):

```
.github/workflows/ci.yml                      lib/blog.ts
CLAUDE.md                                     lib/content/about.ts
README.md                                     lib/content/faq.ts
app/about/page.tsx                            lib/content/gold-guide.ts
app/account/addresses/page.tsx                lib/content/legal.ts
app/account/layaway/[id]/page.tsx             lib/content/wholesale.ts
app/account/layaway/page.tsx                  lib/fixtures.ts
app/account/orders/[id]/page.tsx              lib/i18n.ts
app/account/orders/page.tsx                   lib/order-status.ts
app/account/page.tsx                          lib/plan-status.ts
app/auth/confirm/page.tsx                     scripts/check-terminology.mjs
app/blog/[slug]/page.tsx                      supabase/contracts/LOVABLE_PROMPT_2.md
app/blog/page.tsx                             supabase/migrations/0001_website_catalog.sql
app/cart/page.tsx                             tailwind.config.ts
app/checkout/complete/[order_id]/page.tsx     docs/tasks/phase1-pages.md
app/checkout/page.tsx                         components/account/login-form.tsx
app/collections/[slug]/page.tsx               components/catalog/condition-badge.tsx
app/collections/page.tsx                      components/catalog/karat-badge.tsx
app/faq/page.tsx                              components/catalog/origin-badge.tsx
app/globals.css                               components/catalog/product-card.tsx
app/gold-guide/page.tsx                       components/catalog/product-gallery.tsx
app/layaway/page.tsx                          components/commerce/add-to-cart.tsx
app/layout.tsx                                components/commerce/cart-lines.tsx
app/legal/tokusho/page.tsx                    components/commerce/checkout-flow.tsx
app/login/page.tsx                            components/commerce/layaway-calculator.tsx
app/loyalty/join/page.tsx                     components/commerce/layaway-pay-form.tsx
app/loyalty/page.tsx                          components/commerce/price-block.tsx
app/not-found.tsx                             components/commerce/reserve-with-layaway.tsx
app/page.tsx                                  components/commerce/transfer-details.tsx
app/products/[slug]/page.tsx                  components/loyalty/join-button.tsx
app/sitemap.ts                                components/site/account-menu.tsx
app/wholesale/page.tsx                        components/site/cart-button.tsx
                                              components/site/flash-notice.tsx
                                              components/site/footer.tsx
                                              components/site/header.tsx
                                              components/site/lang-switcher.tsx
                                              components/site/legal-articles.tsx
                                              components/site/mobile-nav.tsx
                                              components/ui/button.tsx
                                              components/wholesale/inquiry-form.tsx
```

Heaviest single files: `components/commerce/checkout-flow.tsx` (39 `text-champagne`, 27 `gold`, 21 `gold-pale`, 11 `bg-velvet`), `app/account/layaway/[id]/page.tsx` (19 / 12 / 9 / 4), `app/account/page.tsx` (13 / 12 / 11 / 7), `app/account/orders/[id]/page.tsx` (15 / 6 / 5 / 1), `app/loyalty/page.tsx` (13 `text-champagne`).

Per-file line counts for every token are in the session transcript; the per-token file lists above are exact.

---

## g. `package.json` — `check:terms`

```
11      "check:terms": "node scripts/check-terminology.mjs",
```
(sibling scripts: `check:i18n` line 12, `check:analytics` line 13; `typecheck` is bare `tsc --noEmit`, line 10.) CI runs it at `.github/workflows/ci.yml:29` (`- run: npm run check:terms`), preceded by the comment "Terminology is a hard rule (CLAUDE.md): gold is described by purity and…".

What `scripts/check-terminology.mjs` scans (verbatim, key lines):

```
7   const forbidden = [/\bjapan(?:ese)? gold\b/i, /\bsaudi gold\b/i, /\bitalian gold\b/i, /\bdubai gold\b/i, /\bhk gold\b/i, /\bchinese gold\b/i];
12  const originClaims = [ …two regexes: the English "made in J—" phrase and its Japanese equivalent (literals omitted here — this file is itself scanned by the checker)… ];
15  const originAllowed = new Set(["components/catalog/origin-badge.tsx", "lib/i18n.ts"]);
31  const originExempt = [
32    "Are all Cha Jewels products made in Japan?",
33    "Cha Jewelsの商品はすべて日本製ですか？",
34    "We offer Japan-made and Japan-sourced jewelry",
35    "日本製および日本で調達したジュエリーをお取り扱いしています",
36  ];
38  const skip = new Set(["node_modules", ".next", ".git"]);
45      if (!/\.(tsx?|mdx?|json|sql|css)$/.test(name) || name === "check-terminology.mjs" || name === "CLAUDE.md") continue;
```

- Walks the entire repo from `process.cwd()`, skipping `node_modules`, `.next`, `.git`.
- Scans files ending `.ts .tsx .md .mdx .json .sql .css`, excluding itself and `CLAUDE.md`. **Not scanned:** `.mjs`, `.js`, `.yml`, `.webp`/binary assets, `.html`, `.txt`. Any doc under `docs/` IS scanned (`.md`).
- Two line-based checks: (1) the six country-gold regexes, banned everywhere; (2) the "made in J—" origin claim in English and Japanese, allowed only in `origin-badge.tsx` and `lib/i18n.ts`, or on a line containing one of the four exempt FAQ sentences.
- Exit 1 with a hit list on any match; message: `Describe purity as "K18 gold"; origin comes only from product data via OriginBadge.`
- Does NOT check: "0% interest", "Manila", "atelier", "GIA", "Assay", "insured", "vault", "price lock", "Stripe/PayMongo/Square", or ₱. Those are outside this script's scope today.

---

## h. `public/videos/` and `public/images/home/`

- **`public/videos/` does not exist** on `origin/develop`. `git ls-tree -d origin/develop public/videos` returns nothing. No `.mp4`, `.webm`, `.mov` or `.m4v` exists anywhere in the tree.
- `public/` contains exactly two directories: `public/fixtures` and `public/images`.
- **`public/images/home/`** (the whole of `public/images`) is:
  ```
  100644 blob 3492598d…   91946  public/images/home/pomelli-hero.webp
  100644 blob e3b24ec4…  191324  public/images/home/pomelli-values.webp
  ```
  Both are referenced from `app/page.tsx` (lines 30 and 58). Nothing else under `public/images`.

---

## Existing docs/tasks files (for placement)
`phase1-pages.md`, `phase2-plan.md`, `phase2-step2-checkout.md`, `phone-normalization.md`, `website-condition.md`. This file is new and uncommitted.

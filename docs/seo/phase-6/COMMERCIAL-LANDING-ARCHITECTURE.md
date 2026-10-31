# Phase 6 — Commercial landing architecture (AUDITED / READY FOR OWNER REVIEW)

**Status:** AUDITED / READY FOR OWNER REVIEW. Nothing in this document is implemented. No file under `app/`, `components/`, `lib/` or `tests/` was created or changed for Phase 6. Every new route named below needs the written route-change approval (CLAUDE.md "SEO Implementation Governance" §7; `SEO-MIGRATION-MAP.md` OD-14: the `/shop/*` and `/guides/*` tree is future architecture, not approved).

**Prepared:** 2026-10-29, branch `seo/phase-6-8-commercial-authority-prep`, from the master plan PHASE 6 list, §14 (collection and category SEO), §21–22 (linking, target IA), §25 (content quality rule), status findings X9 and D1 (wording), and the live production sitemap.

**Wording rule applied throughout (X9 / D1):** purity is "K18 gold"; the approved forms are "K18 jewelry in Japan", "K18 hallmarks used in Japan", "K18 jewelry authentication in Japan", "buy K18 jewelry in Japan"; no country-branded gold wording and no generic made-in or from-Japan product claims; origin only from the Hub's `origin` field via `OriginBadge`. `npm run check:terms` passes on this document.

---

## 1. Inventory evidence (what the site can actually land a searcher on)

Fetched `https://www.chajewelsjp.com/sitemap.xml` on 2026-10-29: 973 URLs, of which 70 are curated/collection/category/blog pages (35 EN + 35 JA) and 903 are product URLs (one per language per product; 452 products rounded, matching the brief's 452).

| Family | Live slugs (EN and JA each) |
|---|---|
| Collections (`/en/collections/…`) | anklets, bracelets, earrings, handmade-gemstone-bracelets, luxury-bags, luxury-wallet, luxury-watches, necklaces, other-accessories, pearls, pendants, rings |
| Categories (`/en/categories/…`) | fine-jewelry, preloved-jewelry, preloved-branded-jewelry, preloved-watches, preloved-designer-accessories |
| Curated | `/en`, sale, loyalty, wholesale, faq, jewelry-guide, shopping-guide, about, why-cha-jewels, contact, affiliations, legal/{privacy,terms,returns,tokusho}, blog, blog/why-cha-jewels-care-behind-every-piece |

Product-slug matches (EN URLs only): `kihei` 3, `k18` 156, `pearl` 65, `akoya` 43, `diamond` 156, `pt900` 87, `chain` 17.

**Not in the sitemap / not live:** `/en/layaway` (HTTP 404 + `noindex` on 2026-10-29; the legacy `/layaway` page exists in `app/layaway/page.tsx` but is cookie-gated and answered 404 to an anonymous fetch; status finding X3, Phase 3 owns `/en/layaway`), `/en/guides/*` (404), `/en/collections/kihei` (404 — there is **no Kihei collection or category in the Hub**; the `kihei` slug in `lib/fixtures.ts` is preview-only, see status note of 2026-10-28).

The three live Kihei product pages (fetched 2026-10-29; names quoted exactly as the page's `<h1>`):

| Slug | Page name (H1) | What the page states |
|---|---|---|
| `n1616-necklace-k18-16-65g-m-cut-16-sided-triple-kihei-0-7mm-40cm` | N1616 Necklace K18 16.65g M-Cut 16 Sided Triple Kihei 0.7mm 40cm | K18, approx. 16.65 g, M-Cut triple Kihei, approx. 40 cm, fold-over clasp; the description says a Mint Bureau assay mark is engraved |
| `8c100-necklace-k18-100g-8-cut-kihei-50cm` | 8C100 Necklace K18 100g 8 Cut Kihei 50cm | K18, 100 g, 8-cut Kihei, 50 cm, triple-lock clasp |
| `r7813-ring-k18-pt900-7-80g-diamond-0-172ct-soft-kihei-bee-sz-13-preloved` | R7813 Ring K18/PT900 7.80g Diamond 0.172ct Soft Kihei Bee Sz# 13 [Preloved] | K18/PT900, 7.80 g, diamond 0.172 ct, "soft Kihei" bee motif, size 13, preloved; JSON-LD `availability: SoldOut` on 2026-10-29 |

Everything else about these pieces (price, origin, condition) is Hub data and is cited only as the live page renders it.

---

## 2. Search-intent validation per theme

Method: `WebSearch` (US-index, English and Japanese queries) on 2026-10-29. What is recorded is **what ranked and what kind of page it was**, which tells us the intent Google is satisfying. **No search-volume, CPC or difficulty figures are recorded — all such metrics are UNVERIFIED** (Search Console is not available to this session; the owner holds it, status X8). Validation before final URLs/titles (master plan PHASE 6) therefore means: the owner confirms these intent readings against Search Console queries and the Phase 6 route approvals below.

| # | Theme (master plan) | Query tested | Observed SERP (2026-10-29) | Intent reading |
|---|---|---|---|---|
| T1 | K18 gold jewelry (Japan) | `K18 gold jewelry Japan online shop` | Retail product listings (BEAMS K18 pieces with price/material; Fukuoka jeweler on Pinkoi; Japanese resellers on eBay) | **Commercial / transactional.** Buyers want a shop page with material, weight, price and shipping, not an article. |
| T2 | Kihei (Japan) | `K18 kihei necklace buy Japan`; `kihei chain`; `kihei chain what is it japanese curb chain cuts explained` | Buy-query: retailer product pages (Yukizaki Select, Recycle King, Takashimaya, Komehyo, eBay sellers) listing cut/weave/weight/length per piece. Bare `kihei chain`: ambiguous — the Maui town dominates; jewelry results are retailer "trivia"/guide pages (Yukizaki) and HKTDC supplier listings. Explanatory query: retailer guides and a Japanese dictionary entry | **Mixed.** "K18 kihei …" is commercial (needs a listing page with per-piece weight/cut). "What is kihei / cuts explained" is informational (a guide). Both are present and should land on different pages (Phase 7 pillar for the informational half). |
| T3 | Gold necklaces & bracelets (Japan) | `gold necklace Japan buy online K18 necklace` | eBay listings from Japanese sellers (used K18 chains, Kihei triple chain), Komehyo product pages; several "Japan" listings actually shipped from the UAE or US | **Commercial.** Collection-type page with gram weight, length and clasp visible per item wins; buyers compare price per gram. |
| T4 | Akoya pearls (Japan) | `akoya pearl necklace Japan buy` | Tokyo wholesaler pearls.jp (graded by mm and luster), a Ueno/Okachimachi maker with yen prices, 1stDibs dealer listings, US retailers (Pearls of Joy, Pure Pearls) selling "Japanese Akoya" strands | **Commercial.** Buyers compare mm size, luster grade, length and certificate. Our `pearls` collection already names Akoya in its description. |
| T5 | Diamond jewelry (Japan) | `diamond jewelry Japan buy preloved diamond ring Japan` | Almost entirely eBay listings from Japanese resale shops (Komehyo, Purpose) with carat, metal (PT900/K18) and price; no guides | **Commercial (preloved-led).** Our inventory matches (156 diamond slugs, mostly preloved rings in PT900/K18). |
| T6 | Preloved fine jewelry (Japan) | `preloved jewelry Japan online used jewelry shop` | Forum threads (PriceScope, PurseForum) recommending Komehyo, Selby, Valuence/ALLU; proxy-shopping blogs about Mercari JP; eBay seller stores | **Commercial-investigational.** Searchers are choosing a trustworthy shop; the trust signals that rank are authentication process, refinishing, returns. Our `preloved-jewelry` and `preloved-branded-jewelry` categories serve this if their copy carries the authentication story. |
| T7 | Preloved luxury (bags, watches, accessories) | `preloved luxury bags watches Japan online shop authenticated` | Guides to Ginza resale stores (LIVE JAPAN), eBay stores (Midoriya, Rakuichi), Retro, Brand Off, Brandear; forum due-diligence advice | **Commercial-investigational.** Same as T6: authentication and return policy are the ranking content. Our `luxury-bags`, `luxury-watches`, `luxury-wallet`, `preloved-watches`, `preloved-designer-accessories` pages serve it. |
| T8 | Jewelry layaway (Japan) | `jewelry layaway Japan Filipino` | **No Japan- or Philippines-specific result.** Generic US/Canadian jeweler layaway policy pages (25% deposit, six months), a US military-exchange layaway notice at Misawa, a PriceScope thread | **Informational, low competition, demand UNVERIFIED.** Nobody ranks for this in English. A page explaining how Cha Jewels layaway works (English only, `layawayOffered`) would have little competition, but the Search Console check for Filipino/Taglish and "layaway" queries (master plan §13 step 1) is the real validation. |
| T9 | Wholesale K18 jewelry (Japan) | `wholesale K18 gold jewelry Japan supplier` | B2B marketplace listings (SuperDelivery — many are K18GP plated brass, not solid K18), HKTDC Sourcing supplier page for a Kihei maker, Freshdi | **Commercial B2B.** The SERP is marketplaces; a branded wholesale page with minimums, lead time, currencies and a clear "solid K18, hallmark-checked" statement is differentiated. `/en/wholesale` already exists with exactly that structure. |

Observations that shape the architecture:

1. Seven of nine themes are satisfied by **listing pages**, not articles. The master plan §14 call to improve collection/category SEO fields is therefore the highest-leverage Phase 6 action, and it is Hub work (Lovable), not storefront routes.
2. The only theme with no serving page at all is **Kihei** (T2) — and its commercial half cannot be served by a storefront route because collections are Hub data. The fix is a Hub collection, not a hand-rolled page.
3. "Japan" in these queries is a **location/sourcing qualifier** ("buy … in Japan", "seller located in Japan"), which is exactly the approved phrasing family ("buy K18 jewelry in Japan"). No title below uses a country as a purity word.

---

## 3. Theme-by-theme architecture

Legend — **Existing page**: the live URL that already serves the intent (verified in the sitemap and by fetch on 2026-10-29). **Proposed new route**: only where no page serves the intent; marked NEEDS APPROVAL. Titles are ≤ 60 characters, descriptions ≤ 155 characters where possible, and every one of them is a **proposal** for Hub SEO fields (§4), not storefront copy.

### T1 — K18 gold jewelry (Japan)

- **Existing page:** `/en/categories/fine-jewelry` (live title "Fine Jewelry | Cha Jewels"; description "Discover new gold, pearl, diamond, and gemstone jewelry to celebrate life's milestones…"). The category holds the new K18, pearl, diamond and gemstone pieces, so it already is the K18 landing page; its title simply does not say K18.
- **Proposed new route:** none. `/en/shop/k18-gold` (master plan §22) is **NOT proposed** for Phase 6: it would duplicate the category grid with a different URL. Revisit only if Search Console later shows the category page cannot rank for "K18" queries after its SEO fields are improved.
- **Proposed title:** `K18 Gold Jewelry in Japan | New Fine Jewelry | Cha Jewels`
- **Proposed H1:** `K18 Gold Fine Jewelry`
- **Proposed description:** `New K18 gold, platinum, Akoya pearl and certified diamond jewelry, hallmark checked in Japan. Gram weight and stamp shown on every listing.`
- **Canonical:** self (`/en/categories/fine-jewelry`); `hreflang` en/ja as today.
- **Duplicate / cannibalisation risk:** LOW with the current set; MEDIUM if a `/shop/k18-gold` page were added (same products, same intent). The `necklaces`, `bracelets`, `rings` collections also carry K18 in their descriptions — keep their titles item-type-led ("K18 Gold Necklaces…") so the category owns the generic "K18 gold jewelry" phrase and the collections own the item type.
- **Hub data requirement:** category SEO fields (§4): `seo_title`, `seo_description`, `h1`, `intro`, `seo_copy`, `faq`. No new taxonomy.

### T2 — Kihei (Japan)

- **Existing page:** none for the commercial intent. Kihei pieces sit inside `/en/collections/necklaces` (2 of 3) and `/en/collections/rings` (1 of 3) with no filter that isolates them. For the informational intent: the Jewelry Guide's "Metals and stamps" section explains K18 and the stamp, but not Kihei.
- **Proposed new route(s):**
  - **Commercial:** `/en/collections/kihei` — **a Hub collection, not a storefront route.** The storefront renders any collection the Hub publishes; the repo cannot create one (CLAUDE.md "Products are added in the Hub only"). Owner decision OD-P6-1 (table in §6). With only 3 Kihei pieces today (one sold), a collection page would be thin; recommendation below.
  - **Informational:** `/en/guides/kihei` — the Phase 7 pillar (draft: `docs/seo/phase-7/KIHEI-PILLAR-DRAFT.md`). NEEDS APPROVAL (new route family `/en/guides/*`, OD-14).
- **Proposed title (collection):** `K18 Kihei Chains | Necklaces and Bracelets | Cha Jewels`
- **Proposed H1 (collection):** `K18 Kihei Chains`
- **Proposed description (collection):** `K18 Kihei necklaces and bracelets by cut, weave and gram weight — 6-cut, 8-cut, 12-cut, double and triple — hallmark checked in Japan.`
- **Canonical:** self (`/en/collections/kihei`) once it exists; the pillar canonicalises to itself at `/en/guides/kihei`.
- **Duplicate / cannibalisation risk:** MEDIUM between the pillar and the collection if both target "K18 kihei necklace". Mitigation: the collection targets buy-modifiers (buy, price, K18 kihei necklace), the pillar targets question/explain modifiers (what is, cuts, 6-cut vs 8-cut, how weighed); each links to the other once near the top.
- **Hub data requirement:** (a) a `kihei` collection with the three (and future) Kihei SKUs linked in `website_collection_products`; (b) SEO fields per §4; (c) ideally structured attributes per Kihei product — `cut` (2/6/8/12/M/16…), `weave` (single/double/triple), `width_mm`, `length_cm`, `weight_g` — so the collection grid can filter and the storefront never parses the SKU name (contract note in `api.md` §718: the storefront never infers from the name). **Recommendation:** approve the collection now so the Hub team can populate it as Kihei stock arrives; do not publish the collection page in the sitemap until it holds ≥ 6 available pieces (thin-page guard; sitemap listing is Hub-driven and this is a policy ask, not code).

### T3 — Gold necklaces and bracelets (Japan)

- **Existing pages:** `/en/collections/necklaces` ("Chains and necklaces in K18 and platinum, sized for everyday wear."), `/en/collections/bracelets` ("Bangles and chain bracelets, adjustable where the design allows."). Both live, canonical, bilingual.
- **Proposed new route:** none. `/en/shop/*` not proposed.
- **Proposed titles:** `K18 Gold Necklaces and Chains in Japan | Cha Jewels` · `K18 Gold Bracelets and Bangles in Japan | Cha Jewels`
- **Proposed H1s:** `K18 Gold Necklaces and Chains` · `K18 Gold Bracelets and Bangles`
- **Proposed descriptions:** `K18 and platinum necklaces and chains — Kihei, snake, rope, ball and Venetian — with gram weight, length and clasp on every listing.` · `K18 gold and platinum bracelets and bangles with gram weight and length shown. New and preloved, hallmark checked in Japan.`
- **Canonical:** self, as today.
- **Duplicate / cannibalisation risk:** LOW. The risk to watch is with a future `kihei` collection (T2) for "K18 necklace" queries; keep "Kihei" out of the necklaces title and let the description mention it as one chain style.
- **Hub data requirement:** collection SEO fields (§4). The `description` field today is the only copy slot and is bilingual (`description_en/ja`), which is good; §4 adds the rest.

### T4 — Akoya pearls (Japan)

- **Existing page:** `/en/collections/pearls` ("Akoya and South Sea pearl jewelry selected for its beautiful luster…"). 43 `akoya` slugs, many SV925 preloved strands with mm sizes in the name.
- **Proposed new route:** none. An Akoya guide (`/en/guides/akoya-pearl-guide`, master plan §9) is a later content-phase candidate, not Phase 6.
- **Proposed title:** `Akoya Pearl Necklaces and Earrings in Japan | Cha Jewels`
- **Proposed H1:** `Akoya and South Sea Pearls`
- **Proposed description:** `Akoya pearl strands and earrings with pearl size in mm, length and clasp metal on every listing. New and preloved, checked in Japan before listing.`
- **Canonical:** self.
- **Duplicate / cannibalisation risk:** LOW. Keep "Akoya" as the lead term here only; no other page should target it in its title.
- **Hub data requirement:** collection SEO fields (§4); per-product `pearl_mm` already appears in names — a structured attribute would let the grid filter by size (Hub ask, optional).

### T5 — Diamond jewelry (Japan)

- **Existing pages:** no single page. Diamond pieces are split across `/en/categories/fine-jewelry` (new) and `/en/categories/preloved-jewelry` (preloved, the majority by slug count) and the item collections (rings, pendants, earrings, necklaces).
- **Proposed new route:** **none for Phase 6.** A `diamonds` collection would, like `kihei`, be Hub taxonomy (OD-P6-2, optional). Given 156 diamond slugs, a Hub collection is viable and would not be thin. Recommendation: owner decides; if approved it is a Hub collection, not a storefront route.
- **Proposed title (if the collection is created):** `Diamond Rings, Pendants and Earrings in Japan | Cha Jewels`
- **Proposed H1:** `Diamond Jewelry`
- **Proposed description:** `Diamond rings, pendants and earrings in PT900 and K18 with carat weight and metal on every listing. Certified where stated. New and preloved.`
- **Canonical:** self once created.
- **Duplicate / cannibalisation risk:** MEDIUM against `preloved-jewelry` for "preloved diamond ring" queries. Mitigation: `preloved-jewelry` title stays condition-led ("Preloved Gold and Platinum Jewelry…"), the diamond collection is stone-led.
- **Hub data requirement:** optional `diamonds` collection; SEO fields; `carat` attribute if filtering is wanted.

### T6 — Preloved fine jewelry (Japan)

- **Existing pages:** `/en/categories/preloved-jewelry` ("…unbranded gold, platinum, and gemstone pieces with individual character."), `/en/categories/preloved-branded-jewelry`.
- **Proposed new route:** none.
- **Proposed titles:** `Preloved K18 Gold and Platinum Jewelry in Japan | Cha Jewels` · `Preloved Branded Jewelry, Authenticated in Japan | Cha Jewels`
- **Proposed H1s:** `Preloved Gold and Platinum Jewelry` · `Preloved Branded Jewelry`
- **Proposed descriptions:** `Preloved K18 gold and platinum rings, necklaces and pendants, hallmark checked in Japan. Stamp, gram weight and condition shown on every listing.` · `Preloved pieces from celebrated jewelry houses, authenticated in Japan before listing. Condition and stamp shown on every piece.`
- **Canonical:** self.
- **Duplicate / cannibalisation risk:** LOW between the two (branded vs unbranded is a clean split). Watch the FAQ page ("Are Cha Jewels products authentic?", "What does preloved mean?") — link to it from the category intro rather than restating it in full.
- **Hub data requirement:** category SEO fields (§4) including `faq` (2–3 Q&As on authentication and condition, sourced from the live Hub FAQ rows, not new claims).

### T7 — Preloved luxury (bags, watches, accessories)

- **Existing pages:** `/en/collections/luxury-bags`, `/en/collections/luxury-watches`, `/en/collections/luxury-wallet`, `/en/categories/preloved-watches` ("Preloved Branded Watches"), `/en/categories/preloved-designer-accessories`.
- **Proposed new route:** none. Master plan §22's `watches` and `designer-accessories` already exist under other slugs.
- **Proposed titles:** `Preloved Luxury Bags, Authenticated in Japan | Cha Jewels` · `Preloved Luxury Watches, Authenticated in Japan | Cha Jewels` · `Preloved Designer Wallets and Accessories | Cha Jewels`
- **Proposed H1s:** as the current names (`Luxury Bags`, `Luxury Watches`, `Preloved Designer Accessories`) — the H1 can stay short when the title carries the qualifier.
- **Proposed descriptions:** add the authentication sentence and the condition promise; keep brand names out of titles (a branded piece shows its brand on the product, never as a site-level claim).
- **Canonical:** self.
- **Duplicate / cannibalisation risk:** **MEDIUM — existing overlap** between `collections/luxury-watches` and `categories/preloved-watches` (same pieces, two URLs, two titles). Phase 6 should pick one as the SEO target (recommend the collection, because collections carry the Type filter) and give the other a secondary, non-competing title (e.g. the category stays "Preloved Branded Watches" with a description pointing at brands/condition). Flag for owner: OD-P6-3.
- **Hub data requirement:** SEO fields; a decision on which of the two URLs is primary (no redirect is proposed — redirects are a high-risk phase of their own).

### T8 — Jewelry layaway (Japan)

- **Existing page:** `/layaway` (legacy, English-only, `layawayOffered` gate; 404 to an anonymous fetch on 2026-10-29, not in the sitemap, X3). `/en/layaway` does not exist yet — **Phase 3 owns it** (status table row 3: BLOCKED pending 2B/2C; "Phase 3 creates and validates `/en/layaway`").
- **Proposed new route:** **none in Phase 6.** `/en/layaway` is Phase 3's deliverable and must not be created or duplicated here. The supporting guides in master plan §12 (`/en/guides/jewelry-layaway-japan`, `/en/guides/how-jewelry-layaway-works`, `/en/guides/kihei-installment-japan`) are deferred until (a) `/en/layaway` is live and indexable and (b) Search Console shows layaway queries (master plan §12: "Do not scale layaway content until the URL architecture is fixed").
- **Proposed title (for Phase 3's page, offered as input only):** `Jewelry Layaway in Japan — Reserve K18 Gold, Pay Monthly | Cha Jewels`
- **Proposed H1:** `Reserve now, pay monthly`
- **Proposed description:** `Interest-free layaway on K18 gold, pearl and diamond jewelry for customers in Japan and the Philippines. Down payment, terms and monthly amounts quoted by our system.` (Every figure stays the Hub's; the page shows the Hub quote — CLAUDE.md money rule.)
- **Canonical:** self at `/en/layaway`; **no `ja` alternate ever** (`check:layaway-ja`).
- **Duplicate / cannibalisation risk:** LOW; the FAQ's "Payments and layaway" section is the only overlap — link, don't duplicate.
- **Hub data requirement:** none new (terms and quotes already come from `hub.layawayQuote`).

### T9 — Wholesale K18 jewelry (Japan)

- **Existing page:** `/en/wholesale` (title "Wholesale | Cha Jewels"; description "K18 gold at trade prices for live sellers, boutiques and family jewelry businesses in Japan and the Philippines."; H1 "Stock your shop from Tokyo"; facts shown: 10 pieces minimum, 5 business days, JPY or PHP).
- **Proposed new route:** none.
- **Proposed title:** `Wholesale K18 Gold Jewelry in Japan | Trade Prices | Cha Jewels`
- **Proposed H1:** keep `Stock your shop from Tokyo` (owner copy) — the title carries the keyword.
- **Proposed description:** keep the current one (it already follows the wording rule); optionally append `Minimum 10 pieces, 5 business days, JPY or PHP.`
- **Canonical:** self.
- **Duplicate / cannibalisation risk:** LOW. The FAQ wholesale Q&As ("What are your wholesale minimums?", "How do I apply…") should link here.
- **Hub data requirement:** none — this page's copy lives in `lib/content/wholesale.ts` (storefront-owned); the title change is a one-line `pageMeta` edit in a later implementation PR.

---

## 4. DRAFT — Hub contract extension: SEO fields for collections and categories

**Ownership:** the Hub (Lovable) owns the schema and `supabase/functions/`; this is a **draft field list** for the Website API contract (`supabase/contracts/api.md`), written so the Hub team can implement it and the storefront can read it. Nothing here is applied. Current contract: `Collection = { id, slug, name, hero_media, description }` plus `name_en/ja`, `description_en/ja` (lib/types.ts:121); `Category` adds `cta_label*` and `sort_order` (lib/types.ts:113–120).

Proposed additive, nullable fields on **both** `Collection` and `Category` (bilingual where customer-facing; the storefront falls back to today's `name`/`description` when null, so the change is backward-compatible):

| Field | Type | Purpose | Render target |
|---|---|---|---|
| `seo_title_en`, `seo_title_ja` | text ≤ 70 | `<title>`; falls back to `name` + " \| Cha Jewels" | `generateMetadata` |
| `seo_description_en`, `_ja` | text ≤ 160 | meta description; falls back to `description` | `generateMetadata` |
| `h1_en`, `h1_ja` | text ≤ 80 | page H1 when it should differ from `name` | header |
| `intro_en`, `intro_ja` | text ≤ 400 | short customer-facing intro under the H1 (replaces `description` in the header when present) | header |
| `seo_copy_en`, `seo_copy_ja` | markdown ≤ 4000 | long-form copy rendered **below the grid** (master plan §14 "bottom SEO content"); plain paragraphs and H2s only; no money figures | below grid |
| `primary_keyword`, `secondary_keywords[]` | text | editorial reference only; **never rendered** | — |
| `hero_alt_en`, `hero_alt_ja` | text ≤ 125 | alt text for `hero_media` | header image |
| `faq` | `{ q_en, q_ja, a_en, a_ja }[]` ≤ 6 | rendered as an FAQ block below the copy; feeds FAQ JSON-LD only when at least one entry is present and visible | below grid |
| `noindex` | boolean, default false | lets the Hub hide a thin or empty collection from the sitemap and set `noindex` (thin-page guard for new taxonomy such as `kihei`) | metadata + `app/sitemap.ts` |

Rules the draft carries into the Hub:
- All copy obeys the terminology rule; the storefront's `check:terms` scans code and fixtures, not Hub data, so the Hub editor should refuse `<country> gold` and generic origin phrasing at save time (or the owner keeps it by hand, as with `footer.tagline`).
- No cost, margin or commission fields; no computed money.
- Structured data must reflect visible content (governance §11): FAQ JSON-LD only from a rendered `faq`.
- Revalidation: the existing `notify_website` trigger on collection changes should also fire on these fields (contract `api.md` §601).

Storefront follow-up (a later implementation PR, not this one): read the new fields in `lib/types.ts`, `app/collections/[slug]/page.tsx` and `app/categories/[slug]/page.tsx` `generateMetadata`, add the below-grid copy and FAQ blocks, extend the sitemap filter for `noindex`, and add unit tests for the fallbacks. Fixture rows in `lib/fixtures.ts` for preview.

---

## 5. Regression and QA expectations for any Phase 6 implementation

- `npm run typecheck`, `test:unit`, `check:terms`, `check:money`, `check:i18n` green.
- Legacy metadata snapshot: product and curated pages unchanged; only collection/category titles and descriptions differ, and only where the Hub supplies a field.
- No new route in `app/` without the written approval; no redirect; no sitemap architecture change beyond the `noindex` filter.
- Live checks after deploy: `check:seo-live` plus a per-URL fetch of each theme's page for `<title>`, canonical, hreflang, JSON-LD validity.
- Status vocabulary: this document moves a theme to IMPLEMENTING only after the Hub fields exist; VERIFIED only after the live check; nothing is claimed as indexed or ranking.

---

## 6. Owner decisions required (route and taxonomy approvals)

| # | Decision | Options | Recommendation | Blocks |
|---|---|---|---|---|
| OD-P6-1 | Create a **`kihei` collection in the Hub** (3 pieces today, 1 sold) | (a) create now, keep `noindex` until ≥ 6 available pieces; (b) create and index immediately; (c) do not create | **(a)** | T2 commercial landing; Phase 7 "Shop Kihei" links (they fall back to `/en/collections/necklaces` until then) |
| OD-P6-2 | Create a **`diamonds` collection** in the Hub (156 diamond slugs) | create / do not create | create, if Hub effort allows; otherwise `fine-jewelry` + `preloved-jewelry` continue to serve T5 | T5 |
| OD-P6-3 | **Primary URL for preloved watches**: `collections/luxury-watches` vs `categories/preloved-watches` (same pieces, two indexable URLs) | pick one as SEO target; give the other a secondary title; **no redirect** | collection primary | T7 |
| OD-P6-4 | Approve **Hub SEO fields** for collections and categories (§4) as a Hub work item for Lovable | approve draft for Hub implementation / amend / reject | approve | T1, T3, T4, T6, T7 (all title/description changes) |
| OD-P6-5 | Approve the **`/en/guides/*` route family** (first page: `/en/guides/kihei`, Phase 7; second: `/en/guides/k18-gold-japan`, Phase 8) — OD-14 says this needs its own route-change approval | approve family / approve per page / reject | approve family, English-only, no `ja` siblings until written | Phase 7, Phase 8 |
| OD-P6-6 | Confirm **no `/en/shop/*` pages** in Phase 6 (collections/categories serve every commercial theme) | confirm / request specific shop pages | confirm | — |
| OD-P6-7 | **Layaway content stays with Phase 3** (`/en/layaway`); layaway guides deferred until Search Console shows demand | confirm | confirm | T8 |
| OD-P6-8 | Search Console validation of the intent readings in §2 (the owner holds access, X8) | export queries for the nine themes, 16 months | before titles are final | all |
| OD-P6-9 | Wholesale title change (`pageMeta("wholesale")` text) — storefront-owned, low risk | approve wording in T9 | approve | T9 |

---

## 6b. Added scope — `llms.txt` (owner decision, 2026-10-31)

`llms.txt` is now part of the Phase 6 batch. Status: NOT STARTED. Full scope, limits and tests: master plan PHASE 6 add-on.

- Built after the Phase 6 URLs and titles are final, so its links match the theme pages in §3.
- Unofficial; Google Search does not use it; no ranking effect. Low priority inside the batch.
- Same regression checks as §5, plus: 200 `text/plain`, every link 200 and indexable.

---

## 7. Sources used

- Production sitemap and page fetches, 2026-10-29: `https://www.chajewelsjp.com/sitemap.xml`; `/en/products/n1616-…`, `/en/products/8c100-…`, `/en/products/r7813-…`; each collection/category/wholesale URL listed in §3; `/en/layaway`, `/layaway`, `/en/guides`, `/en/collections/kihei` (all 404).
- WebSearch result pages (2026-10-29) per theme, as described in §2: BEAMS, Pinkoi, eBay seller listings, Yukizaki Select (`gc-yukizaki.com`), Recycle King, Takashimaya, Komehyo, pearls.jp, 1stDibs, Pearls of Joy, Pure Pearls, PriceScope and PurseForum threads, LIVE JAPAN Ginza resale article, Midoriya/Retro/Brand Off/Brandear mentions, SuperDelivery, HKTDC Sourcing, Freshdi, shopgarlands.com and estatediamondjewelry.com layaway policy pages, Stripes Japan Misawa exchange notice.
- Repository: `CLAUDE.md`, `docs/CLAUDE-DETAILS.md` "Terminology", `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` §9–14, §20–22, §25, PHASE 6–8; `docs/seo/SEO-IMPLEMENTATION-STATUS.md` D1, X3, X8, X9, X10; `docs/seo/SEO-MIGRATION-MAP.md` OD-14; `lib/types.ts`, `supabase/contracts/api.md`, `app/collections/[slug]/page.tsx`, `app/categories/[slug]/page.tsx`, `app/layaway/page.tsx`, `lib/content/*.ts`.
- **UNVERIFIED:** all search-volume/difficulty metrics; the Search Console query mix; whether the three Kihei pieces are still in stock at read time (JSON-LD showed R7813 as SoldOut).

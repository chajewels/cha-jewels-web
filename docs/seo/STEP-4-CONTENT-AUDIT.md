# SEO Step 4 — Hub-managed content audit and owner approval package

**Status: AUDITED — OWNER APPROVAL PENDING. Not implemented.** Audit date 2026-10-30. Read-only: no Hub write, no migration, no website application-code change, no Search Console action, no content edited or published. BUG-03 stays OPEN (needs the owner's A/B decision **and** live verification).

**Baselines.** Website `develop` `8c7819a` (PR #444); production `main` `9518974` (PR #442, last verified release). Hub `chajewels/la-tracking` `origin/main` `5092a880` (read through `git show`/`git grep`; the local Hub checkout has uncommitted changes that were not touched). Master Plan §33.3 Step 4.

**Evidence method.** Public pages of `https://www.chajewelsjp.com` fetched anonymously on 2026-10-30 (sitemap, 12 collections × 2 languages, 5 categories × 2 languages, all 453 English product pages, 14 sampled product pages in both languages, the article in both languages); JSON-LD, `<title>`, meta description and H1 were parsed from the rendered HTML. Hub source read from the migrations and `supabase/functions/website/index.ts` on `origin/main`. No customer, order, payment or inventory record was read; no Hub API key was used. Counts below are "as fetched at that time"; the catalogue changes daily.

**Vocabulary used for every claim.** *Evidenced* (seen in the rendered page/Hub code), *Inferred* (derived by counting names), *UNVERIFIED* (cannot be established from public evidence; the owner must supply the fact).

---

## 1. Executive summary

1. **No page is harmful at scale, but one product-data defect is material (P0):** two watches (C0853, W0531) are named `[Preloved]` and have a `-used` slug, yet the Hub condition is New, so the page shows no Preloved badge and Product JSON-LD says `NewCondition`. Owner must confirm the true condition and correct it in the Hub.
2. **Collection and category copy is unique and well-formed, but five descriptions disagree with the pieces actually listed** (Necklaces omits that 48% are sterling silver; Rings "resizable on request" is stronger than the Jewelry Guide; Pendants "paired with a chain" has no evidence; Other Accessories says "beyond our jewelry" yet 37 of its 51 pieces are necklaces; Fine Jewelry says "new" yet lists 3 preloved pieces).
3. **Product descriptions are mostly raw specification strings.** Of 437 non-empty English descriptions, 340 are short spec lines with no sentence, 78 are supplier data sheets (brand/model/serial/rank), 15 are prose; 16 products have none and fall back to a generic code-generated sentence. 395 of 437 meta descriptions are the Hub text verbatim.
4. **The Hub already has every field this plan needs** (collection/category/product descriptions in EN and JA, article bodies). It has **no** separate SEO title/description fields, and none is needed: the website derives metadata from the descriptions. **No schema change is proposed.**
5. **BUG-03:** the four sentences are still live in EN and JA. An exact bilingual A/B sheet is in §7. The owner decides; nothing was edited.
6. **Evidence limits:** Search Console performance data does not exist yet (§11), so nothing here ranks pages by performance, and no change is claimed to improve rankings.

---

## 2. Scope, governance and what comes from where

| Layer | Examples | Owner of the change |
|---|---|---|
| Website code | `lib/meta-text.ts` (`productTitle`, `listingTitle`, `productMetaDescription` fallback), `lib/listing-seo.ts`, `lib/catalog-i18n.ts` (`pick` JA→EN fallback), `generateMetadata` in `app/collections`, `app/categories`, `app/products`, `app/blog` | Claude Code, PR, owner approval for behaviour change |
| Hub-managed content | collection `description`/`description_ja`, category `description`/`description_ja`, product `description_en`/`description_ja`, post `body_en`/`body_ja` | Owner edits in the Hub (Website → Content / catalogue) |
| Product facts | name, SKU, `karat`/`metals`, `weight_g`, `condition`, `origin`, `brand`, stone text, certificate mentions | Owner / Hub only. Never edited or inferred here |
| Marketing copy | descriptions, article text | Owner approval of exact text |
| SEO metadata | `<title>`, meta description, OG, JSON-LD | **Derived by website code from the above**; there is no stored SEO field |

Preserved unchanged: `/en` + `/ja` routing, canonical and hreflang, sitemap (976 URLs), indexing policy, `/ja/layaway` absence, sold products in the sitemap (D3), the Hub-only origin rule (`origin-badge.tsx`, approved clarifier only).

---

## 3. Collection audit (12 collections × EN + JA)

**Evidenced:** all 24 collection pages return 200, one canonical; the 34 listing pages (24 collections + 10 categories) have 34 distinct titles and 34 distinct descriptions (max 127 characters, inside the 160-character result limit). The description shown in the page header and the meta description are the **same Hub text** (`collectionDescription`); only the English `<title>` is generated in code (`listingTitle`: "Rings: Jewelry Collection from Tokyo" for the seven jewelry-type collections; every other collection and every Japanese page shows the Hub name unchanged). No collection-level claim of Japan-made or K18 purity appears in code-generated text. Collections have no `published` flag in the Hub, so every row is public and in the sitemap (§9).

Piece counts and mix are from the grid on each page ("available" = in stock; the grid also lists sold pieces).

| Collection (Hub slug) | URLs | Listed / available | Current EN description | Evidence vs description | Finding |
|---|---|---|---|---|---|
| Anklets `anklets` | `/en/collections/anklets`, `/ja/collections/anklets` | 1 / 1 | "Fine chains for the ankle, in lengths that suit both ankles." | One piece (K18, 8.80 g, 23 cm). Wording is awkward and plural for one piece | C-08, P3 |
| Bracelets `bracelets` | `/en|ja/collections/bracelets` | 25 / 14 (14 new, 11 preloved) | "Bangles and chain bracelets, adjustable where the design allows." | 0 of 25 names mention adjustability | C-07, P2 |
| Earrings `earrings` | `/en|ja/collections/earrings` | 51 / 27 (39 new, 12 preloved) | "Studs, hoops and drops, finished with secure posts and backs." | Names: 11 stud, 6 drop, 2 hoop, 5 hook-type; 28 name no style. "Secure posts and backs" is not a recorded fact; JA name says ピアス・イヤリング but no clip-on piece is evidenced | C-05, P2 |
| Handmade Gemstone Bracelets `handmade-gemstone-bracelets` | `/en|ja/collections/handmade-gemstone-bracelets` | 0 / 0 | "Thoughtfully handmade, beautifully personal." | Empty: the page renders "0 pieces" and a way-on to other collections; it is in the sitemap in both languages | C-09, P1 (owner decision) |
| Luxury Bags `luxury-bags` | `/en|ja/collections/luxury-bags` | 6 / 5 | "…selected for their exceptional craftsmanship, iconic design, and lasting appeal." | 6 of 6 preloved branded; text never says preloved. Superlatives are not factual claims | C-10 (P2), C-11 (P3) |
| Luxury Wallet `luxury-wallet` | `/en|ja/collections/luxury-wallet` | 27 / 27 | "…refined design, quality craftsmanship, and everyday functionality." | 27 of 27 preloved; includes key cases and a coin purse | C-10 (P2) |
| Luxury Watches `luxury-watches` | `/en|ja/collections/luxury-watches` | 31 / 31 | "A curated selection of luxury timepieces…" | 29 preloved + 2 with Hub condition New that are named `[Preloved]` (see P-01) | P-01 (P0), C-10 |
| Necklaces `necklaces` | `/en|ja/collections/necklaces` | 138 / 116 (44 new, 94 preloved) | "Chains and necklaces in K18 and platinum, sized for everyday wear." | Metal in names: sterling silver SV925 **66**, K18 37, 750 14, PT850 10, K10 2, other 9. Silver is the largest group and is not named | C-01, P1 |
| Other Accessories `other-accessories` | `/en|ja/collections/other-accessories` | 51 / 50 | "…luxury accessories and distinctive pieces beyond our jewelry, watches, wallets, belts, and bags." | **37 of 51 are necklaces** (13 SV925 spinel, 8 K18 white-gold style, 6 Tiffany & Co., others), plus earrings, bracelets, bangles, 3 steel watches, 3 wallets | C-04, P1 |
| Pearls `pearls` | `/en|ja/collections/pearls` | 63 / 58 (15 new, 48 preloved) | "Akoya and South Sea pearl jewelry selected for its beautiful luster, graceful character, and timeless elegance." | Akoya 43, South Sea 11 (these two cover 54 of 63); also Tahitian 2, freshwater 3, mabe 1 and pearl-accent rings. Largely accurate | C-03, P2 |
| Pendants `pendants` | `/en|ja/collections/pendants` | 34 / 28 | "Pendant tops and charms, sold on their own or paired with a chain." | No product name contains "charm"; nothing evidences a chain pairing | C-06, P1 (UNVERIFIED) |
| Rings `rings` | `/en|ja/collections/rings` | 135 / 79 (12 new, 123 preloved) | "Bands, solitaires and stacking rings, resizable on request." | Names show 2 solitaire, 2 band; most are diamond/gemstone cluster, halo, eternity or fashion rings. Resizing is conditional per the Jewelry Guide and FAQ (design-dependent, may carry fees) | C-02, P1 |

The Japanese descriptions are faithful translations of the English ones, so every finding applies to both languages and both must change together.

### Collection findings

| ID | Pri | Source | Current | Evidence | Proposed replacement (EN / JA) | Why |
|---|---|---|---|---|---|---|
| C-01 | P1 | Hub `website_collections.description` / `description_ja`, slug `necklaces` | "Chains and necklaces in K18 and platinum, sized for everyday wear." / 「K18とプラチナのチェーン・ネックレス。毎日身につけやすい長さでご用意しています。」 | 66 of 138 pieces are SV925 silver, 37 K18 | "Gold, platinum and sterling silver chains and necklaces, including pearl and gemstone styles. Each piece lists its metal and length." / 「ゴールド、プラチナ、シルバー925のチェーンやネックレス。パールや宝石のデザインもあります。金属と長さは各商品に記載しています。」 | States the real metal mix; the listing itself already shows metal and length |
| C-02 | P1 | `rings` description | "Bands, solitaires and stacking rings, resizable on request." / 「バンドリング、ソリティア、重ね付けリング。ご希望によりサイズ直しを承ります。」 | Jewelry Guide (`lib/content/jewelry-guide.ts`): many rings can be resized but "whether and how far depends on the design — ask before you reserve" | "Diamond, gemstone and pearl rings in gold and platinum, new and preloved. Many can be resized depending on the design; please ask before you reserve." / 「ダイヤモンド・宝石・パールのリング（新品・中古）。多くはデザインによりサイズ直しが可能です。ご予約前にご相談ください。」 | Removes an over-promise and matches the published guide and FAQ |
| C-04 | P1 | `other-accessories` description | "…beyond our jewelry, watches, wallets, belts, and bags." | 37 of 51 are necklaces | Owner decision first: (a) move the jewelry out of this collection in the Hub (membership change), or (b) rewrite: "Necklaces, earrings, bracelets and small accessories, new and preloved, including branded pieces." / 「ネックレス、ピアス、ブレスレットなどのアクセサリー（新品・中古、ブランド品を含む）。」 | Description contradicts contents; membership is a product-facts decision |
| C-06 | P1 | `pendants` description | "…and charms, sold on their own or paired with a chain." | UNVERIFIED chain pairing; no "charm" in any name | "Pendant tops in gold, platinum and silver, set with diamonds, pearls and gemstones." / 「ゴールド・プラチナ・シルバーのペンダントトップ。ダイヤモンド、パール、宝石をあしらったデザインです。」 Owner to state the chain policy if it should be mentioned | Drops an unevidenced service claim |
| C-09 | P1 | `handmade-gemstone-bracelets` | Empty collection, 2 sitemap URLs | 0 pieces; the article lists the category among what the shop offers | **Decision, no text proposed.** Options: leave as is until stock exists; or add a Hub description saying new pieces are being prepared. Changing indexing or sitemap membership is a separate high-risk phase and is **not** proposed here | A thin indexable page for an empty collection |
| C-03 | P2 | `pearls` | "Akoya and South Sea pearl jewelry…" | 54/63 Akoya or South Sea | "Akoya, South Sea and other pearl jewelry in gold, platinum and silver, selected for luster and elegance." / 「あこや真珠・南洋真珠ほか、ゴールド・プラチナ・シルバーのパールジュエリー。」 | Accurate for the whole collection |
| C-05 | P2 | `earrings` | "…secure posts and backs." | Not a recorded fact | "Studs, drops and hoops in gold, platinum and pearl, new and preloved." / 「ゴールド・プラチナ・パールのスタッド、ドロップ、フープ（新品・中古）。」 | Drops an unevidenced build claim |
| C-07 | P2 | `bracelets` | "…adjustable where the design allows." | 0/25 mention adjustability | "Bangles and chain bracelets in gold, platinum and silver, new and preloved. Length is given on each piece where recorded." / 「ゴールド・プラチナ・シルバーのバングルとチェーンブレスレット（新品・中古）。長さは記載のある商品に表示しています。」 | Evidence-backed |
| C-10 | P2 | bags / wallet / watches / other descriptions | no mention of condition | bags 6/6, wallet 27/27, watches 29/31 preloved | Add "preloved branded" plus the approved site-wide wording "authenticated in Japan" (never an origin) | Search intent is "preloved"; today's text hides it |
| C-11 | P3 | bags / wallet / watches descriptions | "exceptional craftsmanship, iconic design" | Puffery, not verifiable | Optional editorial tightening | Low value |
| C-08 | P3 | `anklets` | "lengths that suit both ankles" | one piece | Optional: "A K18 chain anklet." only if stock stays at one piece | Wording quality |
| C-12 | P2 (**website code**) | `listingTitle` in `lib/meta-text.ts` | JA collection titles are the bare Hub name ("リング \| Cha Jewels") | EN titles were extended in Step 2; JA were not | Code change with unit tests; JA wording needs owner approval | Parity of search intent |

---

## 4. Category audit (5 categories × EN + JA)

All 10 pages return 200. Titles and descriptions are unique; the description is again the Hub text; EN title for Fine Jewelry is code-extended ("Fine Jewelry: Gold, Pearl, Diamond and Gemstone"). Categories have a `published` flag in the Hub and an optional `cta_label`.

| Category (slug) | Listed / available | Current EN description | Evidence vs description | Finding |
|---|---|---|---|---|
| Fine Jewelry `fine-jewelry` | 99 / 61 (96 new, 3 preloved) | "Discover new gold, pearl, diamond, and gemstone jewelry…" / 「新作の…」 | 3 preloved pieces listed: R3438 (PT900 ring), N6430 and N7040 (SV925 Akoya strands). Silver and platinum not named | K-01, P1 |
| Preloved Jewelry `preloved-jewelry` | 194 / 128 | "…Explore unbranded gold, platinum, and gemstone pieces…" | 38 are SV925 silver; R3435 is a Tiffany & Co. ring (branded) inside an "unbranded" category | K-02, P1 |
| Preloved Branded Jewelry `preloved-branded-jewelry` | 51 / 39 | "…signature designs from celebrated jewelry houses…" | Brand names are misspelled in 4+ product names ("Tiifany"); a few pieces show no brand in the name (N7514, E5750, R1280) — the Hub `brand` field was not readable here | K-03, P2 |
| Preloved Branded Watches `preloved-watches` | 30 / 30 | "…preloved watches from renowned brands." | 28 preloved + the 2 mis-conditioned watches (P-01). Overlaps 30 of the 31 pieces in the Luxury Watches collection | P-01, K-04 (P3 note) |
| Preloved Designer Accessories `preloved-designer-accessories` | 48 / 44 | "…designer wallets, cardholders, belts, and small leather treasures." | 24 wallets, 5 bags, 1 belt and also necklaces, earrings, bracelets, bangles | K-05, P3 |

| ID | Pri | Source | Proposed replacement (EN / JA) |
|---|---|---|---|
| K-01 | P1 | category `fine-jewelry` description, or Hub membership of the 3 pieces | Owner decision: remove the 3 preloved pieces from this category in the Hub, **or** change to "Gold, platinum, pearl, diamond and gemstone jewelry to celebrate life's milestones and make everyday moments shine." / 「人生の節目を祝い、日常のひとときを輝かせる、ゴールド・プラチナ・パール・ダイヤモンド・宝石のジュエリー。」 (drops "new") |
| K-02 | P1 | category `preloved-jewelry` description, or membership of R3435 | Owner decision: move R3435 to the branded category, **or** "Beauty with a story, ready to become yours. Explore gold, platinum, silver and gemstone preloved jewelry with individual character." / 「物語のある美しさを、あなたのものに。個性豊かなゴールド・プラチナ・シルバー・宝石のプレラブドジュエリー。」 |
| K-03 | P2 | Hub product names (see P-09) | Correct the misspelled brand in the product names; the brand `brand` field itself needs checking by the owner |
| K-04 | P3 | none | Observation only: two watch URLs list nearly the same pieces; canonical consolidation is out of scope |
| K-05 | P3 | category description | Optional: add "jewelry and accessories" because necklaces, earrings and bangles are included |

**Internal-linking opportunities (website code, P2, not implemented).** The Rings collection page already links to the Jewelry Guide (13 links), Shopping Guide (13), categories (25) and FAQ (25), so no large gap exists there. Opportunities are narrower: a visible link from the Preloved Jewelry category to Preloved Branded Jewelry (and back), and a link from Pearls to the pearl section of the Jewelry Guide. Only where a destination exists; no new routes.

---

## 5. Product audit

### 5.1 Population (English product pages, 2026-10-30)

453 products (matches the 453 EN + 453 JA product URLs in the sitemap): 130 new, 323 preloved; 333 in stock, 120 sold; 310 show the Hub origin badge for Japan (128 of the 130 new; 182 preloved); 128 show a brand. Type by name: necklace 138, ring 133, earrings 50, pendant 33, watch 30, wallet 24, bracelet 23, bag 5, anklet 1, other 16. **Men's chains:** no product, collection or category is labelled "men's"; the nearest are unisex Kihei chains (N1616, 8C100) whose own text says "for men and women". No men's collection is proposed (do not invent).

### 5.2 Reproducible sample

Rule: for each class, the in-stock product with the alphabetically first SKU (and the stated filter on the English product name/condition); plus the evidence-driven extras. 14 distinct SKUs, all fetched in EN and JA.

| Class (filter) | SKU | URL path under `/en|ja/products/` |
|---|---|---|
| Necklace, new, non-pearl | N1616 | `n1616-necklace-k18-16-65g-m-cut-16-sided-triple-kihei-0-7mm-40cm` |
| Pendant, new | AL112 | `al112-pendant-k18-1-45g-heart-n-key-top` |
| Ring, new | AL510 | `al510-ring-k18-2-50g-cross-motif-sz-12` |
| Bracelet, new | B4618 | `b4618-bracelet-k18-4-60g-oval-snake-chain-18cm` |
| Earrings, new, non-pearl | E1J33 | `e1j33-earrings-k18-0-60g-star-10mm-stud` |
| Pearl earrings, new | E10GS | `e10gs-earrings-pt900-golden-south-sea-pearl-10-0mm` |
| Pearl necklace, preloved | N1105 | `n1105-necklace-sv925-akoya-pearl-6-4-6-7mm-43cm-preloved` |
| Chain necklace, new | ND45S | `nd45s-necklace-k18-2-10g-dragon-top-venetian-chain-45cm-adjustable` |
| Anklet | A8523 | `a8523-anklet-k18-8-80g-oval-snake-chain-23cm` |
| Preloved ring, unbranded | R0047 | `r0047-ring-pt900-k18-12-80g-diamond-0-97ct-emerald-1-16ct-sz-10-5-preloved` |
| Preloved branded necklace | N0957 | `n0957-necklace-tiffany-co-750-34-85g-anchor-chain-vintage-40cm-preloved` |
| Preloved branded bracelet | B1318 | `b1318-bracelet-tiffany-co-750pg-1-35g-diamond-by-the-yard-18cm-preloved` |
| Preloved earrings | E1010 | `e1010-earrings-pt900-1-0g-diamond-0-10ct-5-0mm-stud-preloved` |
| Extras by evidence | 8C100, E8330, R2715 (sold), R3883, C0853, W0531 | slugs begin with the SKU, lower-case |

Full-catalogue statistics in 5.1 and the findings below come from all 453 pages, not only the sample. Not sampled: bags, wallets, and the 14 products not shown under any collection breadcrumb.

### 5.3 What the sample shows

Of the 13 class samples, 12 (all but N1616) have a Hub description that is just the specification string already contained in the name: e.g. AL510 "K18 2.50g Cross Motif Sz# 12". The page's own spec ledger shows metal and weight, so the description adds no new information; the Japanese description is the same string translated. Metal and weight match the name in every sampled product; no discrepancy between name, JSON-LD `material` and displayed metal was found. Karat label in JSON-LD (`material`) is the Hub's text ("K18", "PT900", "750", "Silver 925"); nothing was normalised or inferred.

### 5.4 Product findings

| ID | Pri | URL / source | Current | Evidence | Proposed | Notes |
|---|---|---|---|---|---|---|
| P-01 | **P0** | `/en|ja/products/c0853-watch-bvlgari-b-zero1-diamond-bezel-quartz-ss-leather-silver-16-5cm-used`, `/en|ja/products/w0531-watch-gucci-g-timeless-chronograph-quartz-ss-black-20cm-used`; Hub `website_products.condition` | Name carries `[Preloved]`, slug ends `-used`, description says "Product rank: B"; Hub condition is New | Page shows no Preloved badge; Product JSON-LD `itemCondition` = `NewCondition`; listed under "New" in the filter; both appear in Preloved Branded Watches | **Owner confirms the real condition**, then sets `condition` in the Hub. No website change | A used item presented as new is the one finding that is materially inaccurate; ten other pieces named `[Used]` already carry the Used condition |
| P-02 | P1 | all products, Hub `description_en` / `description_ja` | 340 of 437 descriptions are one-line spec strings | e.g. AL112 "K18 1.45g Heart N' Key Top" | See 5.5 pattern; pilot 10 pieces first | Descriptions add nothing beyond name and ledger |
| P-03 | P1 | 16 products with an empty description (e.g. N70xx 70 cm layered spinel necklaces, B5575, ESG13, ESH12, R2595) | Fallback "N70LL3 Necklace SV925 Spinel Lapiz Lazuli 70cm 3 Layers at Cha Jewels, Tokyo. Shipping worldwide." | Website `productMetaDescription` fallback begins with the SKU | Add a Hub description; optionally improve the fallback in code (Batch W1) | Fallback is code-generated, not Hub content |
| P-04 | P1 | N1616, 8C100 | The Hub text itself states a manufacturing origin ("crafted in …", "Made in …") and N1616 lists seven gift occasions | `check:terms` scans code and repo docs, **not Hub data**; both pieces have the Japan origin badge, so data and text agree | **Owner decision:** keep (origin flag and text agree) or move to badge + approved clarifier only. No replacement text is proposed because a new origin sentence needs an owner decision | Policy gray area; not an inaccuracy proven here |
| P-05 | P1 | 8C100 | Description starts with `**K18 8-Cut Kihei Gold Necklace — 50cm \| 100g …**` | Literal `**` in the HTML (28 occurrences), meta description and JSON-LD; no `<strong>` rendered | Remove the Markdown asterisks in the Hub text, or have the website strip Markdown for meta (code, P2) | A visible formatting defect |
| P-06 | P1 | 78 supplier-sheet descriptions (watches, bags, wallets) | "Brand: Gucci Model number: 573116 Product rank: B Accessories: Box" | 77 carry "Product rank" (A/B/S); the site never explains the scale; 54 publish a serial number | **Owner decisions:** (a) add an explanation of the rank scale or replace with plain condition wording from the data present ("Product condition: Thread, Scratches" is already useful), (b) keep or remove serial numbers from public text | Serial numbers are the owner's call; not removed here |
| P-07 | P1 | 5 pearl pieces (EHS10, ESH9, PPS12, PPS13, EGS10) | "Natural South Sea Pearl" | "Natural" may mean natural colour or natural (non-cultured) pearl; not stated | **UNVERIFIED — owner states the meaning**; if it means natural colour, say "natural colour" | Avoids implying a natural (non-cultured) pearl |
| P-08 | P2 | Hub names of N2004, N0484, N1999 and others ("Tiifany"), N1767 ("Neckalce"), SB094 ("Prelvoed") | Misspelled brand/type/condition | Seen in H1, title, alt, JSON-LD `name` | Owner corrects the names. **UNVERIFIED:** whether a name edit regenerates the URL slug or changes order-line titles; slugs must not change, so check on one test product first | Slug rule: no slug migration |
| P-09 | P2 | 16 names with no type word (e.g. "K18 Golden South Sea Pearl…", "18KWG…", "Stainless Steel Quartz…") | Title lacks "Necklace/Ring/Watch" | Seen in `<title>` | Add the type word in the Hub name (same slug caution as P-08) | Search intent |
| P-10 | P2 | `<title>` of 285 of 453 products | Longer than 60 characters before the suffix | Seen in `<title>` | No keyword padding; consider a shorter title only with the name unchanged (code, owner approval) | Observation |
| P-11 | P2 | 24 meta descriptions end in "…" | A long description is cut at 160 characters, e.g. N1616 stops at "Chain Length…" | `clampText` | Write the first 150 characters of each rewritten description so the cut falls at a sentence | Content tip, no code |
| P-12 | P2 | JA descriptions/titles | Some English left inside Japanese text: "Diamond By The Yard" (B1318) | Seen | Translate or accept the brand term | Language quality |
| P-13 | P2 | `origin` flag | 310 of 453 show the Japan badge, including 182 preloved pieces | The website cannot see evidence; Hub `origin` is the only source | **UNVERIFIED by this audit.** Owner confirms the basis for the preloved Japan flags; no change proposed | Rule already enforced in code |
| P-14 | P3 | 7 groups of identical descriptions (e.g. three SV925 Akoya strands "6.4-6.7mm 43cm") | Identical text on distinct SKUs | Seen | Acceptable while the specs are identical; leave | Not duplication of copy |
| P-15 | P3 | E8330 (Cartier Love Hoop) | 1,082-character descriptive text; includes "this is real gold" | The model of a good description; "real gold" is puffery and "authentic" is covered by the site-wide "authenticated in Japan" | Use as a structural template (what it is, how it wears, condition, what is checked) | Editorial |

**Missing useful details.** The Hub contract has no certificate, condition-grade, gemstone-origin or dimensions field, so the site cannot show them. Only free text can carry them; R3883 mentions an "NGL Certificate" in text with no certificate number or link. **Do not fabricate** purity, origin, gemstone origin, certificate, condition or rarity; every proposal below uses only facts already in the Hub record. No resale-value or investment wording is proposed anywhere (the only investment-adjacent phrase found, "appealing to jewelry collectors" in 8C100, is not an investment claim).

### 5.5 Safe description pattern (for the owner's pilot, not applied)

One to three plain sentences, using only recorded facts, first sentence ≤ 150 characters, same facts in both languages:

- EN: "[Type] in [metal] set with [stones as recorded], [weight] g, [length/size as recorded]. [New / Preloved: condition wording already in the record.]"
- JA: 「[素材]の[種類]。[石の情報]、重量[重さ]g、[長さ/サイズ]。[新品/プレラブド]。」

Illustration built only from the record (not published): B4618 — EN "K18 oval snake chain bracelet, 4.60 g, 18 cm." / JA 「K18のオーバルスネークチェーンブレスレット。重さ4.60g、長さ18cm。」 Preloved pieces keep the existing `[Preloved]` marker and add nothing about grade unless the Hub text already states it. Branded pieces name the brand as recorded and make no origin claim.

---

## 6. Hub data flow and content safety

### 6.1 Source-field mapping

| Surface | Hub table → field (read by `supabase/functions/website`) | Website use |
|---|---|---|
| Collection name / description | `website_collections.name`, `name_ja`, `description` (EN), `description_ja`, `hero_media` | H1, visible header text, `<title>` (`listingTitle`, EN extended in code), meta description (verbatim), OG image (`hero_media` if absolute https) |
| Category name / description | `website_categories.name`, `name_ja`, `description`, `description_ja`, `hero_media`, `cta_label(_ja)`, `sort_order`, `published` | same as collections |
| Product | `website_products.name`, `name_ja`, `slug`, `sku`, `karat`, `metals`, `weight_g`, `description_en`, `description_ja`, `condition`, `origin`, `brand`, `status`, `updated_at`; variants (`size`, `stone`, price, stock); `website_product_media` (alt) | H1, `<title>` (SKU moved last, long titles absolute), meta description (description clamped to 160; fallback line from the name), JSON-LD Product (`name`, `sku`, `material`, `description`, `offers`, `itemCondition`), image alt (= name), OG |
| Article | `website_posts.title_en/ja`, `excerpt_en/ja`, `body_en/ja`, `cover_media`, `published`, `published_at`, `layaway_only` | page, meta from excerpt, BlogPosting JSON-LD |
| Collection/category membership | `website_collection_products`, `website_category_products` | grid, ItemList JSON-LD, counts |

### 6.2 Published versus draft
- Products: public only when `status = 'active'`; others return 404 and leave the product list. Sold items stay `active` and stay in the sitemap (D3). **Do not change status to "fix" content.**
- Categories: public only when `published = true`.
- Posts: public only when `published = true` **and** `published_at` is not after today (Asia/Manila). A draft or future post is a 404.
- **Collections have no published flag**: any new row is public immediately and enters the sitemap on the next render. Create nothing without approval.

### 6.3 Bilingual handling and fallback
`lib/catalog-i18n.ts` `pick()`: JA page uses the `_ja` field, else English; EN page uses English, else Japanese; never blank. A missing translation therefore silently shows the other language and, for metadata, the other language's text. Product `description_ja` empty = English text on a Japanese page. (No such case was measured in this audit; only the 14 sampled products were compared across languages.)

### 6.4 Refresh and cache
The Hub calls `/api/revalidate` with an allow-listed tag (`catalog`, `content`, …) through `notify_website_revalidate()` triggers on products, variants, media, collections, collection-product links and posts. The website also revalidates Hub reads every 60 seconds as a backstop (`lib/hub-api.ts`). **No revalidate trigger on `website_categories` was found in the migrations on Hub `origin/main`**, so a category edit should appear within about 60 seconds rather than instantly (UNVERIFIED in production). Sitemap `lastmod` was deliberately removed from products in Step 1; no content edit changes `lastmod`.

### 6.5 What an edit can touch

| Edit | Also changes |
|---|---|
| Collection/category description | visible header, meta description, OG description (all one field); sitemap unaffected |
| Product description | visible text, meta description, JSON-LD `description`, OG |
| Product name | H1, `<title>`, JSON-LD `name`, every image alt, OG, and possibly cart/order display names. **Slug is separate**; whether the Hub regenerates it on rename is UNVERIFIED — test first |
| Product condition | badge, JSON-LD `itemCondition`, filters |
| Collection/category membership | grid, counts, ItemList; sitemap membership of the *collection* is unchanged |
| Product `status` | removes the URL (404) and the sitemap entry — never use for content fixes |
| Article body | article page and, through `excerpt`, its meta |

### 6.6 Does the Hub already support the proposal?
Yes for everything in §3–§5 and §7: all text fields exist in both languages. There is no `seo_title` or `meta_description` column anywhere in the Hub (searched `supabase/` on `origin/main`). **A genuine need for new fields was not demonstrated**: metadata is derived from the visible description, which keeps the page and its snippet from disagreeing. The only real constraint is the 160-character snippet, solved by writing the first sentence short (P-11). No schema, UI or migration work is proposed. If the owner later wants snippet text that differs from page text, that is a separate decision.

---

## 7. BUG-03 — exact A/B decision sheet (`why-cha-jewels-care-behind-every-piece`)

**Live check 2026-10-30:** the four sentences recorded in `SEO-DEFECTS-2026-10-29.md` §BUG-03 are still present in both languages. Hub field to edit: `website_posts.body_en` and `website_posts.body_ja` for this slug (Website → Content). `check:terms` does not scan Hub text, so each edit must be followed by a live re-fetch. The Japanese made-in-country phrase is redacted below as 〔origin word〕 (the four-character phrase before の), because this repository's `check:terms` forbids it in docs; the owner reads it on the live page.

**Decision rule:** Option A removes the generalised origin wording. Option B replaces it only with the already-approved clarifier (`brand.originNote`, `lib/i18n.ts`, verbatim) — no new origin wording is invented. The owner may choose A or B per paragraph.

### 7.1 English ¶ with "Our collections include…"
- **Current:** "Our collections include Japan-made K18 gold jewelry, pearls, diamonds, handmade gemstone bracelets, and preloved pieces."
- **A and B (identical):** "Our collections include K18 gold jewelry, pearls, diamonds, handmade gemstone bracelets, and preloved pieces."
- **Japanese counterpart, current:** 「チャジュエルズでは、〔origin word〕K18ゴールドジュエリー、パール、ダイヤモンド、ハンドメイドの天然石ブレスレット、そして中古ジュエリーなどを取り扱っています。」
- **A and B (identical):** 「チャジュエルズでは、K18ゴールドジュエリー、パール、ダイヤモンド、ハンドメイドの天然石ブレスレット、そして中古ジュエリーなどを取り扱っています。」
- **Corrects:** a sentence that gives the whole range an origin although the range includes preloved branded pieces made by other brands and pieces whose Hub origin is not Japan.

### 7.2 English ¶ beginning "New Japan-made jewelry…"
- **Current:** "New Japan-made jewelry reflects its makers’ work. Preloved branded jewelry carries the history and craftsmanship of its original brand. Handmade gemstone bracelets offer another way to enjoy color and personal style."
- **A:** "New jewelry reflects its makers’ work. Preloved branded jewelry carries the history and craftsmanship of its original brand. Handmade gemstone bracelets offer another way to enjoy color and personal style."
- **B:** "Our new jewelry is made in Japan, and so are many of our preloved pieces. Preloved branded pieces are made by their original brands and authenticated in Japan. Handmade gemstone bracelets offer another way to enjoy color and personal style."
- **Japanese counterpart, current:** 「〔origin word〕新品ジュエリーには、作り手の技術が込められています。中古のブランドジュエリーには、そのブランドが生み出したデザインや技術があります。ハンドメイドの天然石ブレスレットでは、色や組み合わせを楽しむことができます。」
- **A:** 「新品ジュエリーには、作り手の技術が込められています。中古のブランドジュエリーには、そのブランドが生み出したデザインや技術があります。ハンドメイドの天然石ブレスレットでは、色や組み合わせを楽しむことができます。」
- **B:** 「新品ジュエリーはすべて日本製で、中古品にも日本製が多くあります。中古ブランド品は各ブランドの製品で、日本で真贋鑑定済みです。ハンドメイドの天然石ブレスレットでは、色や組み合わせを楽しむことができます。」
- **Corrects:** the generalised origin claim attached to "new jewelry"; B restores origin only through the approved wording.

### 7.3 Unchanged
EN "Their materials, origins, condition, and available documentation may differ" and the JA 「素材、製造元、状態、付属する書類などが異なります」 state that origins differ and claim none: no change. The approved clarifier already appears elsewhere on the site as footer/About text (Hub `footer.tagline`, `brand.originNote`).

### 7.4 Two related observations (not part of the A/B decision)
- **A-02 (P2, evidence):** the Japanese article says 天然石 ("natural stone") for the bracelets while the Hub collection says 宝石 / "gemstone". Whether the stones are natural is **UNVERIFIED**; if not confirmed, 宝石 is the evidenced term.
- **A-03 (P2):** the article presents "handmade gemstone bracelets" as part of the range while the collection currently holds 0 pieces (C-09). Owner decision with C-09.

**Definition of done (unchanged):** owner approval of A or B → owner edits `body_en`/`body_ja` → live EN and JA re-fetched and free of the four sentences → recorded dated in the defects file. BUG-03 is not closed by this document.

---

## 8. Prioritised owner approval matrix

Easy content edits (Hub only, owner-typed): P-01, P-04, P-05, P-06, P-07, P-08, P-09, P-02/P-03 pilot, C-01…C-10, K-01, K-02, article A/B. Changes needing website code: C-12, P-03 fallback wording, P-05 Markdown stripping for meta, internal links, P-10.

| ID | Pri | Hub field / source | Approval needed | Risk | QA | Rollback |
|---|---|---|---|---|---|---|
| P-01 | P0 | `website_products.condition` (C0853, W0531) | Owner confirms true condition | Low; changes badge and JSON-LD only | Re-fetch both URLs: badge present, `itemCondition` UsedCondition, filter | Set the field back |
| C-01, C-02, C-04, C-06 | P1 | collection `description`, `description_ja` | Exact EN+JA text per row | Low; text and meta only | Re-fetch EN+JA, check length ≤ 160, uniqueness across 34 listing pages | Restore previous text (kept in this table) |
| C-09 | P1 | collection `handmade-gemstone-bracelets` | Decision: leave / add description | None if left | — | — |
| K-01, K-02 | P1 | category description or membership | Choose text or membership move | Membership moves change grids and ItemList | Check counts and ItemList positions | Re-add to old membership |
| P-02/P-03 | P1 | product `description_en/ja` | Pilot of ≤10 pieces, text approved | Low | Meta ≤ 160, JA present, no origin/purity/condition added | Restore old string (recorded) |
| P-04, P-05, P-06, P-07 | P1 | product description text | Owner decisions listed in §10 | Low–policy | Re-fetch; run check on Hub text by eye | Restore |
| A-01 (BUG-03) | P1 | `website_posts.body_en/ja` | A or B per paragraph | Low | Live EN+JA re-fetch | Restore previous body |
| C-03, C-05, C-07, C-10, P-08…P-13, A-02, A-03 | P2 | Hub text, names | Per item | Name edits: slug/order-line check first | as above | as above |
| C-12, internal links, P-10, fallback improvement | P2 | website code | Behaviour approval; separate PR; unit tests, `check:terms`, build, live check | Low–medium | `check-seo-live`, unit tests | Revert PR |
| C-08, C-11, K-04, K-05, P-14, P-15 | P3 | optional | none | None | — | — |

---

## 9. SEO opportunities and risks

**Opportunities (no ranking promise).** Accurate "preloved" and metal wording where today's text hides it; non-duplicated first sentences so the snippet is useful; correcting wording that disagrees with listed pieces reduces mismatch between snippet and page; a corrected condition keeps Product JSON-LD honest.

**Risks.** (1) Hub edits go live within about a minute and are not previewed; (2) product-name edits could affect slugs or order display (unverified); (3) membership moves change ItemList and counts; (4) the empty collection is a thin indexable pair; changing that touches indexing and sitemap, which are separate high-risk phases; (5) any new origin sentence would violate the approved-wording rule; (6) serial numbers in text are a business decision. **Not done on purpose:** no keyword stuffing, no length padding, no new collections, no investment or resale language.

---

## 10. Owner decisions required

1. **OD-S4-1** P-01: true condition of C0853 and W0531.
2. **OD-S4-2** BUG-03: Option A or B, per paragraph (EN and JA together).
3. **OD-S4-3** Collection texts C-01, C-02, C-04 (move the jewelry out, or rewrite), C-06 (chain policy), then C-03/C-05/C-07/C-10: approve, edit or reject the exact EN/JA strings in §3.
4. **OD-S4-4** K-01 and K-02: change the description or the membership.
5. **OD-S4-5** C-09: leave the empty collection as is, or add a Hub description (no indexing change in this step).
6. **OD-S4-6** P-04: may product text restate an origin when `origin = JAPAN`, or only the badge and approved clarifier?
7. **OD-S4-7** P-06: explain the rank scale or replace it; keep or remove serial numbers.
8. **OD-S4-8** P-07: meaning of "Natural" in the five pearl names.
9. **OD-S4-9** P-08/P-09: approve name corrections after a one-product slug test.
10. **OD-S4-10** Whether to authorise the website-code batch (W1) at all.

---

## 11. Search Console boundary

From `SEARCH-CONSOLE-BASELINE-2026-10-30.md` (owner's Domain property, UI-read, no export): property verified; `sitemap.xml` status Success with 976 discovered URLs; `/en`, `/ja`, `/en/layaway` observed indexed; Page indexing and Performance reports were still "Processing data"; of 8 sampled deeper URLs, 6 were "Discovered – currently not indexed" and 2 "URL is unknown to Google". **No performance data exists**, so this audit does not claim which products or collections perform well, requests no indexing and changes nothing in Search Console. No content change here is claimed to improve rankings.

---

## 12. Future implementation batches

| Batch | Content | Where | Gate |
|---|---|---|---|
| H1 | P-01, BUG-03 edit, C-01/C-02/C-04/C-06, K-01/K-02 decision | Hub (owner) | Decisions OD-S4-1…5, then live re-fetch |
| H2 | 10-piece description pilot, P-03 empty descriptions, P-05, P-07, P-08/P-09 | Hub (owner) | Pilot reviewed; slug test passed |
| H3 | C-03/C-05/C-07/C-10 refinements | Hub (owner) | After 4 weeks of Search Console data if available |
| W1 | JA listing titles (C-12), safer description fallback, strip Markdown in meta, cross-links | Website code, own branch and PR | Owner approval; tests below |
| Out of scope | Indexing of the empty collection, redirects, hreflang, sitemap, Merchant Center, OD-6, Step 3b/3c | — | Separate phases |

## 13. Testing requirements (for later batches)

Hub edits: re-fetch EN and JA URL; confirm title, meta (≤ 160 chars), H1, no stray Markdown; JSON-LD `itemCondition`; ItemList count after membership moves; `check-seo-live`; read the live text for forbidden origin/purity wording (Hub text is not scanned by `check:terms`). Website code (W1): unit tests for each helper in `lib/meta-text.ts` and `lib/listing-seo.ts` (JA title cases, fallback, Markdown strip), `npm run typecheck`, `npm run test:unit`, `npm run check:terms`, `check:money`, `check:i18n`, `check:lastmod`, desktop and 375 px visual check, console clean. Regression: canonical, hreflang, sitemap count (976 unless products change), `/ja/layaway` 404.

## 14. Explicit exclusions

No edit of Hub content, product facts, descriptions or the article; no article option implemented; no new collection or category; no slug change; no routing, canonical, hreflang or sitemap change; no Hub schema or migration; no `fb:app_id` or non-product `og:url`; no `/gold-guide` redirect change (BUG-06 stays open); no payment, checkout, cart, customer, order or inventory access; no Step 3b/3c; no Merchant Center; no OD-6; no merge or deploy; no Search Console change.

## 15. Evidence gaps and limitations

- English pages were crawled in full; Japanese only for the 34 listing pages, the article and 14 sampled products. JA description gaps outside that sample are unmeasured.
- Product `brand`, `origin`, `item_kind` and collection membership beyond what the pages render were not read from the Hub (no API key used). "Branded" status in K-02/K-03 is inferred from names.
- The sitemap/collection counts are a snapshot; stock changes daily.
- Revalidation on categories, and whether a name edit regenerates a slug, are UNVERIFIED.
- Material of the pieces (K18, PT900, SV925, 750) is the Hub's text; no assay or hallmark was checked.
- No Lighthouse or performance work was done (Step 3 is separate).

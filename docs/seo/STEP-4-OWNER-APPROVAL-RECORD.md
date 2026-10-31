# SEO Step 4 — Owner approval record and implementation-readiness plan

**Owner decisions recorded. No Hub implementation authorized or performed.**

Status: **Step 4 remains AUDITED — OWNER APPROVAL PENDING** (approved items are recorded below; none is implemented, verified or deployed). **BUG-03 was moved out of SEO scope by the owner on 2026-10-31 (PR #450); its Option A decision below stands as a separate content task.** Recorded 2026-10-30. Documentation only: no Hub write, no product or article edit, no website-code change, no migration, no Search Console action.

**Source of the decisions.** The owner's explicit choices, relayed in a message in this session after the owner reviewed [`STEP-4-OWNER-DECISIONS.md`](STEP-4-OWNER-DECISIONS.md) (PR #446, merge `c345878`). Where this record disagrees with a proposal there, this record controls. The audit ([`STEP-4-CONTENT-AUDIT.md`](STEP-4-CONTENT-AUDIT.md), PR #445) and the original decision package are unchanged historical evidence.

**Baselines read 2026-10-30.** Website `develop` `c345878`; production `main` `9518974`. Hub read through `origin/main` (code and migrations only; no Hub data access, no API key).

Evidence tags: **[V]** verified read-only on 2026-10-30 (live public page or repository); **[A]** audit-day observation; **[O]** owner-provided; **[U]** unverified.

---

## 1. Decision status matrix

| ID | Decision (owner) | Classification | Boundary (what is NOT approved) |
|---|---|---|---|
| OD-S4-2 | BUG-03: **Option A** for both paragraphs, EN and JA | APPROVED — PENDING IMPLEMENTATION | Option B not used. The optional Japanese 天然石 → 宝石 change is **not approved**; 天然石 stays. BUG-03 stays OPEN |
| OD-S4-3 | Four collection texts (Necklaces, Rings, Other Accessories, Pendants). **Rings: owner's later Choice 2 supersedes the first approved Rings text (§2.2, §7)** | APPROVED — PENDING IMPLEMENTATION | No resizing promise (neither Rings text contains one); no chain-inclusion promise; no membership change. All other collection refinements (C-03, C-05, C-07, C-08, C-10, C-11) NOT APPROVED |
| OD-S4-4 | Two category texts, as written (Fine Jewelry, Preloved Jewelry) | APPROVED — PENDING IMPLEMENTATION | No category membership change |
| OD-S4-5 | Handmade Gemstone Bracelets: leave unchanged | DECIDED — LEAVE UNCHANGED | No change to content, membership, sitemap inclusion or indexing |
| OD-S4-6 | N1616, 8C100: remove repeated origin wording from EN and JA descriptions | APPROVED — PENDING IMPLEMENTATION for N1616; **CONDITIONAL for 8C100** (see §5, H2: one sentence needs exact replacement wording from the owner) | Origin badges unchanged; Hub `origin` field not modified. Origin-documentation gaps flagged, not filled |
| OD-S4-7 | Remove supplier-rank lines and serial numbers from public EN and JA descriptions | APPROVED — CONDITIONAL / EVIDENCE REQUIRED. **Implementation BLOCKED** until preservation is verified | Other specifications and condition details stay. No identifier appears in this repo |
| OD-S4-8 | Keep "Natural" in EHS10, ESH9, PPS12, PPS13, EGS10 | DECIDED — LEAVE UNCHANGED; classification verification **outstanding** | "Natural" is not read as proof of non-cultured formation; no claim is validated or changed here |
| OD-S4-9 | Spelling corrections only | APPROVED — CONDITIONAL / EVIDENCE REQUIRED | Missing type words **NOT APPROVED**. No live test now. Slugs unchanged |
| OD-S4-10 | Optional website code | DEFERRED | Japanese titles, fallback change, Markdown handling, internal links: none approved |
| Pilot | Ten description pairs of decisions §6 | APPROVED IN PRINCIPLE — CONDITIONAL / EVIDENCE REQUIRED | No publication authorised; no sentence altered |

Nothing above is implemented or verified. No ranking or indexing result is claimed.

---

## 2. Approved content (exact, for future implementation)

### 2.1 OD-S4-2 — Article `why-cha-jewels-care-behind-every-piece` (Option A)

**Hub field:** `website_posts.body_en` and `website_posts.body_ja`, row with this slug (Website → Content). **Current text confirmed live [V]** on `/en/blog/…` and `/ja/blog/…`. The Japanese made-in-country phrase is shown as 〔origin word〕 because `check:terms` forbids it in repo docs.

| | Paragraph 1 (EN) | Paragraph 1 (JA) |
|---|---|---|
| Current (rollback copy) | "Our collections include Japan-made K18 gold jewelry, pearls, diamonds, handmade gemstone bracelets, and preloved pieces." | 「チャジュエルズでは、〔origin word〕K18ゴールドジュエリー、パール、ダイヤモンド、ハンドメイドの天然石ブレスレット、そして中古ジュエリーなどを取り扱っています。」 |
| **Approved** | "Our collections include K18 gold jewelry, pearls, diamonds, handmade gemstone bracelets, and preloved pieces." | 「チャジュエルズでは、K18ゴールドジュエリー、パール、ダイヤモンド、ハンドメイドの天然石ブレスレット、そして中古ジュエリーなどを取り扱っています。」 |

| | Paragraph 2 (EN) | Paragraph 2 (JA) |
|---|---|---|
| Current (rollback copy) | "New Japan-made jewelry reflects its makers’ work. Preloved branded jewelry carries the history and craftsmanship of its original brand. Handmade gemstone bracelets offer another way to enjoy color and personal style." | 「〔origin word〕新品ジュエリーには、作り手の技術が込められています。中古のブランドジュエリーには、そのブランドが生み出したデザインや技術があります。ハンドメイドの天然石ブレスレットでは、色や組み合わせを楽しむことができます。」 |
| **Approved** | "New jewelry reflects its makers’ work. Preloved branded jewelry carries the history and craftsmanship of its original brand. Handmade gemstone bracelets offer another way to enjoy color and personal style." | 「新品ジュエリーには、作り手の技術が込められています。中古のブランドジュエリーには、そのブランドが生み出したデザインや技術があります。ハンドメイドの天然石ブレスレットでは、色や組み合わせを楽しむことができます。」 |

Only the origin wording is removed; 天然石 is kept as written. The two sentences are the only changes; the rest of the article body stays.

### 2.2 OD-S4-3 and OD-S4-4 — Collection and category descriptions

Hub fields: collections `website_collections.description` / `description_ja` (rows by slug); categories `website_categories.description` / `description_ja` (rows by slug). The "Current" values below are the **live text read on 2026-10-30 [V]** and are the rollback copies; they are identical to the audit-day text (no drift found).

| Slug | Field | Current (rollback) | **Approved** |
|---|---|---|---|
| `necklaces` (collection) | EN | Chains and necklaces in K18 and platinum, sized for everyday wear. | Gold, platinum and sterling silver chains and necklaces, including pearl and gemstone styles. Each piece lists its metal and length. |
| | JA | K18とプラチナのチェーン・ネックレス。毎日身につけやすい長さでご用意しています。 | ゴールド、プラチナ、シルバー925のチェーンやネックレス。パールや宝石のデザインもあります。金属と長さは各商品に記載しています。 |
| `rings` (collection) | EN | Bands, solitaires and stacking rings, resizable on request. | ~~Diamond, gemstone and pearl rings in gold and platinum, new and preloved.~~ **SUPERSEDED, not implemented.** **Final approved:** Explore new and preloved rings, from gold and platinum pieces with diamonds, pearls and gemstones to selected designer jewelry. |
| | JA | バンドリング、ソリティア、重ね付けリング。ご希望によりサイズ直しを承ります。 | ~~ダイヤモンド・宝石・パールのリング（新品・中古）。~~ **SUPERSEDED, not implemented.** **Final approved:** ダイヤモンド、パール、宝石をあしらったゴールドやプラチナのリングから、ブランドジュエリーまで。新品・中古のリングをご紹介します。 |
| `other-accessories` (collection) | EN | A curated collection of luxury accessories and distinctive pieces beyond our jewelry, watches, wallets, belts, and bags. | Necklaces, earrings, bracelets and small accessories, new and preloved, including branded pieces. |
| | JA | ジュエリー、時計、財布、ベルト、バッグ以外の、個性と魅力を備えたラグジュアリーアクセサリーを厳選してご紹介します。 | ネックレス、ピアス、ブレスレットなどのアクセサリー（新品・中古、ブランド品を含む）。 |
| `pendants` (collection) | EN | Pendant tops and charms, sold on their own or paired with a chain. | Pendant tops in gold and platinum, new and preloved, set with diamonds, pearls and gemstones. |
| | JA | ペンダントトップとチャーム。単品でも、チェーンとの組み合わせでもお求めいただけます。 | ゴールド・プラチナのペンダントトップ（新品・中古）。ダイヤモンド、パール、宝石をあしらったデザインもあります。 |
| `fine-jewelry` (category) | EN | Discover new gold, pearl, diamond, and gemstone jewelry to celebrate life's milestones and make everyday moments shine. | Gold, platinum, pearl, diamond and gemstone jewelry to celebrate life's milestones and make everyday moments shine. |
| | JA | 人生の節目を祝い、日常のひとときを輝かせる、新作のゴールド・パール・ダイヤモンド・宝石ジュエリー。 | 人生の節目を祝い、日常のひとときを輝かせる、ゴールド・プラチナ・パール・ダイヤモンド・宝石のジュエリー。 |
| `preloved-jewelry` (category) | EN | Beauty with a story, ready to become yours. Explore unbranded gold, platinum, and gemstone pieces with individual character. | Beauty with a story, ready to become yours. Explore gold, platinum, silver and gemstone preloved jewelry with individual character. |
| | JA | 物語のある美しさを、あなたのものに。個性豊かなノンブランドのゴールド・プラチナ・宝石ジュエリー。 | 物語のある美しさを、あなたのものに。個性豊かなゴールド・プラチナ・シルバー・宝石のプレラブドジュエリー。 |

Notes **[V]**: all approved strings are under 160 characters (the meta-description limit). The category field names `description` / `description_ja` are from the Hub function source (`CATEGORY_FIELDS` in `supabase/functions/website/index.ts`) **[V, source-read]**; the live Hub rows were not read. Membership of every collection and category stays as is. The Handmade Gemstone Bracelets page was re-read and is unchanged: EN "Thoughtfully handmade, beautifully personal." [V]. Categories have no revalidation trigger in the Hub migrations I read, so a category edit may take up to the 60-second backstop to appear **[U]**.

---

## 3. Read-only readiness findings

### 3.1 N1616 and 8C100 (OD-S4-6)
Origin phrases located in the live description text **[V]**. The phrases themselves are redacted here (`check:terms`).

| SKU | Language | Exact location of the repeated origin wording | Unrelated text that must stay |
|---|---|---|---|
| N1616 | EN | Final item of the "Remarks:" line, after "Mint Bureau Assay Mark Engraved," — a five-word origin phrase | All other specification lines, the product description paragraph and the gift-occasion text |
| N1616 | JA | Final item of the 備考 line, after 「造幣局検定マーク刻印入り、」 — the origin word | Same |
| 8C100 | EN | (1) end of the bold heading line: "… 50cm \| 100g \| 〔origin phrase〕"; (2) one sentence, "〔origin sentence opening〕 from K18 gold, this substantial 100g necklace features …" | The rest of the paragraph, the clasp description, and the asterisks (P-05 is not approved) |
| 8C100 | JA | (1) end of the heading line, the origin word after "100g \|"; (2) one clause of the sentence about the 100g necklace, the 日本で… clause before 「この重厚な100gのネックレス」 | Same |

- **N1616:** a pure deletion (the phrase and its separator). No replacement text needed.
- **8C100:** deleting the heading item is a pure deletion. The sentence cannot simply be deleted without breaking grammar, so a replacement must be reviewed by the owner. **Proposal for owner review only (not approved):** EN: "This substantial 100g K18 gold necklace features a triple-lock clasp …" (keep the rest as the live text continues) / JA: 「K18ゴールドを使用したこの重厚な100gのネックレスには、…」 (keep the rest). These remove the origin wording and add no claim.
- Full pre-edit copies of both descriptions (EN and JA) are the rollback copies; they cannot be quoted in this repository because they contain the origin phrases. **Take a copy from the Hub (or Website → Products edit form) before editing and store it outside the repository.**
- **Origin-documentation gaps [U]:** the basis for Hub `origin = JAPAN` on these two pieces is not documented in any repository file I read; the Hub field was not read. N1616's "Mint Bureau Assay Mark Engraved" is a hallmark statement copied from the supplier text; no document supports it in the repository. Both remain unchanged by this decision and are flagged, not resolved.

### 3.2 Supplier rank and serial lines (OD-S4-7) — BLOCKED
- **Affected products [V, read-only crawl of the 453 English pages, counts only]:** 77 products carry a "Product rank" or "Serial" line (76 with a rank line, 43 with a "Serial" line): watches 30, wallets 22, necklaces 6, bags 5, earrings 4, others 10. 14 of the 77 also carry a "Product condition" line, which must stay. **This differs from the audit's 78 / 77 / 54.** The cause is unresolved (a different match rule is the likely reason); the exact figures need a Hub query. **Japanese descriptions were not counted [U].**
- **Preservation check — cannot be verified: BLOCKED.** I searched the Hub repository (`migrations`, `src`, `supabase/functions` on `origin/main`) for dedicated serial-number or rank columns and found **none**. That means no structure I can see stores these values apart from the public description text, so deleting them from the description could destroy the only copy. Inventory and supplier records are outside this task's access, and no export was made or is proposed here.
- **Unblock conditions:** (1) the owner confirms in writing where the original rank and serial values are kept (named internal record) **or** a secured export of the affected rows' `description_en` / `description_ja` is made to an access-controlled location outside the repository and the PR; (2) the export is spot-checked by the owner; (3) the exact row list is approved. No serial or rank value may appear in the repository, a PR, a screenshot or a log.

### 3.3 Natural pearls (OD-S4-8)
Current names **[V]**: EHS10 "…PT900 Natural South Sea Pearl 10.0mm"; ESH9 "…PT900 Natural White South Sea Pearl 9.0mm Hook Type"; PPS12 and PPS13 "…K18 Natural Golden South Sea Pearl 12.0/13.0mm Stud"; EGS10 "…PT900 Natural Golden South Sea Pearl 10.0mm". All five are condition New. **No name or description of the five mentions any colour treatment, and no certificate or supplier document is available in the repository.** Owner statement **[O]**: the pieces are "Natural" and any colouring treatment must be disclosed in the name and description. The record therefore contains no treatment disclosure, either way. This does not show whether a treatment exists **[U]**.
Evidence required before any change or validation: supplier or gemmological confirmation of what "Natural" is intended to mean (natural colour versus natural, non-cultured formation) and of treatment status, for each of the five. **Natural colour is not natural, non-cultured formation; this record does not infer either.** Until then: names unchanged, classification unverified, and no site copy elsewhere asserts "natural pearl".

### 3.4 Spelling corrections (OD-S4-9)
Affected products found in the 453-page English snapshot **[V]** (the complete list needs a Hub query, including sold items and Japanese names, which were not scanned **[U]**):

| SKU | Current name (as live) | Misspelling | Intended spelling-only edit | Slug contains the typo |
|---|---|---|---|---|
| SB094 | "SB094 Bag Gucci Soho Shoulder Bag [Prelvoed]" | Prelvoed | [Preloved] | yes |
| N1767 | "N1767 Neckalce SV925 Akoya Pearl 7.1-7.4mm 43cm [Preloved]" | Neckalce | Necklace | yes |
| N2004 | "N2004 Necklace Tiifany& Co SV925 Loving Heart 42cm [Preloved]" | Tiifany | Tiffany | yes |
| N0484 | "N0484 Necklace Tiifany& Co SV925 Double Loving Heart 42cm [Preloved]" | Tiifany | Tiffany | yes |
| N1999 | "N1999 Necklace Tiifany& Co SV925 Return to Tiifany Oval 53cm [Preloved]" | Tiifany (twice) | Tiffany (twice) | yes |

Points for the owner: the "&" has no space before it in the three Tiffany names ("Tiifany& Co"). Whether to also add the space is a **separate** choice; spelling only is approved, so the space stays unless the owner says otherwise. The intended brand spelling must be confirmed per product **[U]**. Because all five slugs contain the typo and slugs must not change, the URLs will keep the typo after the name is corrected; this is expected and accepted by the owner's "slugs unchanged" condition.
**Slug evidence:** in the Hub source, the product dialog keeps the existing slug when the name of an existing product is edited (`slug: f.id ? f.slug : slugify(...)`, `src/components/website/ProductDialog.tsx`), and the slug has its own editable field **[V, source-read; not tested]**. The bulk-import path was not examined **[U]**.
**Order records:** `cash_order_items` stores its own `title text NOT NULL`, `sku`, and `website_product_id` columns, and rows are created by `INSERT` in the checkout functions (`supabase/migrations`). I found no migration that updates `title` afterwards, which suggests the title is a snapshot at order time and a later name edit would not rewrite it **[V, code-read; not confirmed against live data]**. Invoices, customer account views, emails and the Hub's other order tables were **not** examined **[U]**.
**Needed before implementation:** the full Hub list; per-product intended name; confirmation of slugs and URLs after an edit; an owner-authorised controlled test design (§4 H5). **No live test is performed or authorised now.**

### 3.5 Ten-product pilot (decisions §6)
The ten pairs are unchanged. Each was compared with the current live product page, which is generated from the Hub record (JSON-LD, spec ledger, name) **[V]**; the Hub record itself was not read, so "authoritative product record" is **not yet** satisfied **[U]**.

| SKU | Name, material, weight, stone, size, condition vs the approved pair | Result |
|---|---|---|
| AL112 | K18, 1.45 g, no stone, New; "heart and key top" matches the name | Match |
| AL510 | K18, 2.50 g, size #12 recorded as "Sz# 12"; New | Match |
| B4618 | K18, 4.60 g, 18 cm; New | Match |
| E1J33 | K18, 0.60 g, star, 10 mm, stud; New | Match. Not stated whether 0.60 g is per piece or per pair **[U]** |
| A8523 | K18, 8.80 g, 23 cm; New | Match |
| ND45S | K18, 2.10 g, 45 cm, "Adjustable", dragon top, Venetian chain; New | Match |
| N1105 | SV925 (JSON-LD "Silver 925"), Akoya pearl 6.4-6.7 mm, 43 cm, Preloved | Match; weight is not recorded, and the pair does not state one |
| R0047 | PT900 / K18, 12.80 g, diamond 0.97 ct, emerald 1.16 ct, Sz# 10.5, Preloved | Match |
| E1010 | PT900, 1.0 g, diamond 0.10 ct, 5.0 mm, stud, Preloved | Match (ledger shows "1 g") |
| B1318 | Tiffany & Co, Hub metal text "750" with "750PG" in the name, 1.35 g, diamond, 18 cm, Preloved | Match, with one cosmetic inconsistency: the English pair writes "750 PG" and the Japanese pair "750PG" (the current EN description writes "750 PG", the JA "750PG") |

No mismatch of fact was found. **Flags, not changes:** the B1318 spacing (the EN and JA pairs follow their current descriptions); the size system behind "Sz#" is not stated; the per-piece versus per-pair weight of the earring pairs is not recorded. Dimensions other than those in the names are not recorded in the Hub contract. No approved sentence was altered. Remaining condition: confirm against the Hub record itself at the time of the edit.

---

## 4. Implementation batch plan (none authorised to run)

Common rules for every batch: the owner personally authorises each batch at the time; every Hub edit is preceded by a copy of the current text outside the repository; each edit is followed by a live EN and JA re-fetch (title, meta ≤ 160 characters, H1, no stray text, JSON-LD) and a read of the live text for forbidden origin, purity, authentication or condition wording (Hub text is not scanned by `check:terms`); the status vocabulary moves only after that evidence (READY FOR QA → VERIFIED); no ranking or indexing claim is made.

### H1 — BUG-03 plus the six approved listing texts
- **Scope / fields:** `website_posts.body_en`, `body_ja` (the two sentences in §2.1); `website_collections.description` / `description_ja` for `necklaces`, `rings`, `other-accessories`, `pendants`; `website_categories.description` / `description_ja` for `fine-jewelry`, `preloved-jewelry`.
- **Preconditions:** the owner supplies the final go; current texts re-read immediately before editing (drift check against §2); copies taken.
- **Risks:** Hub edits are live within about a minute and have no preview; a category edit may take up to the 60-second backstop; the article body is the longest field.
- **Source of truth:** the approved strings in §2.1 and §2.2, character for character.
- **Rollback:** paste the "Current" strings from §2 (article, collections, categories).
- **QA:** EN and JA pages of the article (the two sentences changed, nothing else), the 4 collections and 2 categories (description in the header and `<meta name="description">`; unique across the 34 listing pages; counts unchanged; ItemList unchanged); check that the approved Japanese text for the article keeps 天然石.
- **Stop conditions:** any text differs from the recorded current text (drift) — stop and re-review; any edit alters product counts; any extra change appears in the article body.
- **Closure (content task, since PR #450):** the article edit is complete only after the live EN and JA re-fetch shows the old origin wording gone, recorded dated in `SEO-DEFECTS-2026-10-29.md`. It is no longer an SEO blocker or status item.

### H2 — N1616 and 8C100 repeated-origin text
- **Scope / fields:** `website_products.description_en` / `description_ja` for N1616 and 8C100. Badges and `origin` untouched.
- **Preconditions:** the owner approves the exact 8C100 replacement sentence (§3.1; the proposal is not approved); pre-edit copies stored outside the repository.
- **Risks:** an accidental removal of unrelated specs; the heading separator; 8C100's asterisks (P-05) must not be touched here.
- **Rollback:** restore the stored pre-edit description.
- **QA:** EN and JA pages; the origin badge still shows (it comes from `origin`); the description contains no origin phrase; meta description checked.
- **Stop conditions:** the badge disappears; any spec line changes; the owner's sentence is not available.

### H3 — Supplier rank and serial removal — BLOCKED
- **Scope / fields:** `description_en` / `description_ja` of the affected products (77 in the English snapshot; exact list from a Hub query, with Japanese counted).
- **Preconditions (all mandatory):** the preservation verification in §3.2; owner approval of the exact row list; secured export outside the repository.
- **Edit rule:** remove the rank line and the serial line only; keep every other specification and any "Product condition" line.
- **Risks:** losing the only copy; exposing identifiers in a PR, log or screenshot; accidentally removing the condition line.
- **Rollback:** restore from the secured export.
- **QA:** no "Product rank" or serial on any live EN or JA page of the affected products (verify by counts, not by printing identifiers); condition lines intact.
- **Stop conditions:** preservation is not verified; the row list is not approved; a count of removals does not match the approved list.

### H4 — Ten-product description pilot
- **Scope / fields:** `description_en` / `description_ja` for AL112, AL510, B4618, E1J33, A8523, ND45S, N1105, R0047, E1010, B1318, using the ten pairs in `STEP-4-OWNER-DECISIONS.md` §6 exactly.
- **Preconditions:** each pair re-checked against the Hub record itself (SKU, name, material and karat, weight, size, stones, condition, terminology); any mismatch goes to the owner as a corrected proposal.
- **Risks:** the descriptions repeat what the name already says (a readability change, not new information); the cosmetic "750 PG" versus "750PG" difference.
- **Rollback:** restore the previous spec string (the current strings are in the audit samples; also store a copy).
- **QA:** EN and JA pages; meta ≤ 160 characters; no new claim; the preloved marker unchanged.
- **Stop conditions:** a mismatch with the Hub record; any pair needs altering without owner review.

### H5 — Spelling corrections
- **Scope / fields:** the product `name` (and `name_ja` only if it carries the same typo) of the products in §3.4 once the complete list is approved. Spelling only. No type words. No slug edit.
- **Preconditions:** the complete Hub list; the intended spelling per product; the controlled-test design approved by the owner (below); answers on invoices, customer views and historical records.
- **Controlled-test design for owner approval (not executed):** choose one low-traffic product; record its slug, URL, name and the order-line fields; edit the name only; re-fetch the page (URL, H1, title, JSON-LD `name` and `sku`) and re-read the order references that exist for that product (read-only); stop if the slug, any URL or any order or invoice title changes.
- **Risks:** a slug or order-title side effect; the bulk-import path regenerating slugs **[U]**; Japanese names not scanned.
- **Rollback:** restore the old name (copy first); if a slug changed, stop and restore the slug the same day.
- **Stop conditions:** the slug changes; an order or invoice title changes; the list is incomplete.

### Kept apart
- **Natural pearl verification** is its own evidence task (§3.3): supplier or gemmological confirmation per piece. It is not an implementation batch and it blocks any pearl name change.
- **OD-S4-5** (Handmade Gemstone Bracelets): unchanged. **OD-S4-10** (website code): deferred until the approved Hub corrections are implemented and verified.

---

## 5. Risks and unresolved facts

- Items affecting **published product names:** H5 (and any later pearl decision). **Product slugs:** H5 only, and slugs must not change. **Existing order records:** H5 (not fully examined). **Origin claims:** H1 article, H2, and the unverified basis of the Japan flags. **Product condition:** none pending (P-01 closed). **Category membership:** none approved. **Customer-facing service promises:** none added; the resizing and chain statements are deliberately absent.
- Unresolved: affected counts differ from the audit; Japanese rank/serial coverage; the live Hub rows for listings; the Hub record for pilot facts; category revalidation timing; pearl classification and treatment status; `origin` basis for N1616 and 8C100; invoice and customer-view effects of a name edit.
- No decision here was inferred. Anything not listed in §1 as approved is not approved.

## 6. Confirmations

No Hub write, no live product edit, no article edit, no name or slug change, no customer or order record change, no payment or checkout change, no migration, no website application-code change, no route, canonical, hreflang, sitemap or robots change, no deployment, no Search Console action, no OD-6, Step 3b or Step 3c. No serial number or supplier-rank value appears in this file, the PR diff or its checks.

---

## 7. Update 2026-10-30 (second pass): final Rings decision and product clarifications

**Decision recorded.** The owner explicitly approved **Choice 2** for the Rings collection description, which supersedes the first approved Rings text. Nothing else in §1–§6 changes.

- Final approved English: "Explore new and preloved rings, from gold and platinum pieces with diamonds, pearls and gemstones to selected designer jewelry."
- Final approved Japanese: 「ダイヤモンド、パール、宝石をあしらったゴールドやプラチナのリングから、ブランドジュエリーまで。新品・中古のリングをご紹介します。」
- The earlier Rings text is marked SUPERSEDED in §2.2 and was never implemented. Both texts avoid any resizing promise. Fit check [V, names of the 135 listed rings, read-only]: 12 new and 123 preloved; 15 carry a designer or jeweller brand in the name (Tiffany & Co., Cartier, Bvlgari, Louis Vuitton, Celine), so the collection holds both fine jewelry and designer rings; K18/750 about 70 and platinum about 72 by name; no silver. Length: 127 characters in English, under the 160 limit.

**Read-only QA facts recorded (no product edited or authorised):**

| SKU | Fact | Source tag |
|---|---|---|
| N5140 | The owner updated the product name to include "40cm". Length is visible in the English and Japanese page title and in the JSON-LD name; the separate specification table has no size row. Slug and canonical URL unchanged. No further H1 product edit is required. The approved Necklaces text ("Each piece lists its metal and length") remains accurate by product name for all 138 listed pieces | **[V]** live pages 2026-10-30; the edit itself **[O]** |
| R1866 | "PM" is in the name and, per the owner, the Hub maps PM to platinum | **[O]** — not an independent Hub field read |
| R2595 | Louis Vuitton Mosaic designer ring; in Preloved Designer Accessories; in stock at review; **material unverified and not inferred** from any other ring | **[V]** category and stock, **[U]** material |
| R2598 | Louis Vuitton Mosaic designer ring; in Preloved Designer Accessories; sold at the time of review; no material may be assigned without verified evidence | **[V]** category and stock |

No product correction is authorised for any of these four. A sold product does not require a change merely because its name omits a material. Their collection and category memberships are untouched.

**Owner publishing checklist:** [`STEP-4-H1-OWNER-PUBLISHING-CHECKLIST.md`](STEP-4-H1-OWNER-PUBLISHING-CHECKLIST.md). Status stays: Step 4 AUDITED — OWNER APPROVAL PENDING; BUG-03 moved out of SEO scope (owner, 2026-10-31); H1 not implemented. Owner decisions recorded. No Hub implementation authorized or performed.

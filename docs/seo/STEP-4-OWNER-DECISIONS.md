# SEO Step 4 — Owner decision package (OD-S4-2 … OD-S4-10)

**Status: AUDITED — OWNER APPROVAL PENDING. Nothing in this document is approved, implemented or scheduled.** Prepared 2026-10-30. Decision-preparation only: no Hub edit, no website-code change, no article edit, no Search Console action. BUG-03 stays **OPEN** until the owner approves exact text, the authorised owner edits the Hub, and the live English and Japanese pages are re-fetched and verified.

Source of every finding: [`STEP-4-CONTENT-AUDIT.md`](STEP-4-CONTENT-AUDIT.md) (merged in PR #445, merge `cedae2d`). That file is not changed by this package; where this package disagrees with a proposed text there (§1.3), the audit remains the historical record and this file supersedes it for the owner's decision.

**Baselines (fetched 2026-10-30).** Website `develop` `cedae2d` (PR #445 merged); production `main` `9518974`. P-01 (watch condition) remains RESOLVED BY OWNER; VERIFIED LIVE (audit §5.3a); not reopened. Hub repository was read through `origin/main` only.

## 0. How to read this document

Evidence tags used on every claim:

| Tag | Meaning |
|---|---|
| **[V]** | Verified for this package (live page or repository read on 2026-10-30) |
| **[A]** | Audit-day observation (2026-10-30 crawl, quoted from the audit; may drift as stock changes) |
| **[O]** | Provided by the owner |
| **[U]** | Unverified assumption — the owner or a document must confirm it |
| **[P]** | Proposed customer-facing wording. It is a draft, never a fact |

How to approve: tick one box per decision and say "approved as written" or give edited text. A decision stays open until you tick it. Hub edits go live within about a minute and have no preview, so exact text matters.

Rules applied to every proposed text: only facts already in the Hub record or already approved site copy; no manufacturing-origin claim except the exact approved clarifier (`brand.originNote`, `lib/i18n.ts`); no authentication, certificate, condition-grade, gemstone-origin or natural-versus-cultured claim; no investment, resale or appreciation language; the same facts in English and Japanese.

---

## 1. Summary

### 1.1 Decision table

| ID | Pri | Subject | Audit IDs | Type | Recommended | Needs evidence first? |
|---|---|---|---|---|---|---|
| OD-S4-2 | P1 | BUG-03 article wording | A-01 (+A-02, A-03) | Hub text | **Option A** | No (A-02 optional) |
| OD-S4-3 | P1 | Collection descriptions | C-01, C-02, C-04, C-06 (+C-03, C-05, C-07, C-10) | Hub text | Rewrite as in §4; **do not move products** | C-02 and C-06 need a policy statement |
| OD-S4-4 | P1 | Fine Jewelry and Preloved Jewelry categories | K-01, K-02 | Hub text (alt: membership) | **Change text, not membership** | No |
| OD-S4-5 | P1 | Empty Handmade Gemstone Bracelets collection | C-09 | Decision | **Leave as is; no text** | No |
| OD-S4-6 | P1 | Origin sentences inside N1616 and 8C100 text | P-04 | Hub text | **Remove the in-text origin phrase; keep the badge** | Hub `origin` basis |
| OD-S4-7 | P1 | Supplier "Product rank" and serial numbers | P-06 | Hub text | **Remove rank and serials from public text** | Supplier scale definition (only if keeping the rank) |
| OD-S4-8 | P1 | "Natural South Sea Pearl" (5 pieces) | P-07 | Hub name | **Drop "Natural" until its meaning is confirmed** | Yes: owner/supplier meaning |
| OD-S4-9 | P2 | Name typos and missing type words | P-08, P-09 | Hub name | Approve typos; one-product slug test first | Hub name list |
| OD-S4-10 | P2 | Optional website-code batch W1 | C-12, P-03, P-05, P-10, links | Website code | **Defer** until Hub edits are done | n/a |
| Pilot | P1 | 10-piece description pilot | P-02, P-03, P-11 | Hub text | Approve the 10 drafts in §6 | No |

The pilot has no OD number in audit §10 (it sits in batch H2); it is listed here because it is a distinct approval.

### 1.2 Approval groups and order

- **Group A — accuracy and customer protection:** OD-S4-2, 3 (C-01, C-02, C-04, C-06), 4, 6, 7, 8.
- **Group B — bilingual description improvements:** OD-S4-3 refinements (C-03, C-05, C-07, C-10), OD-S4-5, OD-S4-9.
- **Group C — description pilot:** the 10 drafts in §6.
- **Group D — optional website code:** OD-S4-10 only. Never combined with a Hub edit, and a separate branch and PR.

**Ready for a yes/no now (no extra evidence):** OD-S4-2, OD-S4-3 C-01 and C-04, OD-S4-4, OD-S4-5, the pilot.
**Needs a fact from the owner or supplier first:** C-02 (resizing policy), C-06 (only if a chain policy is to be mentioned), OD-S4-6 (basis of the Japan flag), OD-S4-7 (rank scale, only if kept), OD-S4-8 (what "Natural" means), OD-S4-9 (list of names; slug test).

**Suggested order:** 1 OD-S4-2 → 2 OD-S4-8 → 3 OD-S4-3 → 4 OD-S4-4 → 5 OD-S4-7 → 6 OD-S4-6 → 7 pilot → 8 OD-S4-9 → 9 OD-S4-5 → 10 OD-S4-10.

### 1.3 Corrections to texts proposed in the audit

Re-checking the audit's replacement texts against the names of the listed pieces **[V]** (metal and stone words in English product names; counts as of 2026-10-30) found two proposed metal lists that overstate the range. They are corrected below and the corrected text is the one to approve:

| Item | Audit text said | Evidence | Corrected here |
|---|---|---|---|
| C-06 Pendants | "gold, platinum and silver" | 34 pendants: K18 30, platinum 4, silver 0 | "gold and platinum" |
| C-07 Bracelets | "gold, platinum and silver" | 25 bracelets: K18 19, silver 2, platinum 0 | "gold and silver" |

Metal words come from product names only; no hallmark or assay was checked **[U]**.

---

## 2. OD-S4-2 — BUG-03 article (decide first)

**Article:** `why-cha-jewels-care-behind-every-piece`. **Hub field:** `website_posts.body_en` / `body_ja`. **Audit:** §7, original defect `SEO-DEFECTS-2026-10-29.md` §BUG-03. **Priority:** P1.

**Problem in plain words.** Two sentences describe the whole range as "Japan-made". The range also includes preloved pieces by other brands, so the sentence can be read as a promise about every item. Both sentences are still live in both languages **[V, re-checked 2026-10-30 in the audit; not re-fetched again here]**.

The Japanese made-in-country phrase is shown as 〔origin word〕 (the phrase before の) because this repository's `check:terms` forbids it in docs. You read it on the live page.

### 2.1 Paragraph 1 ("Our collections include…") — identical under A and B

| | English | 日本語 |
|---|---|---|
| Current | "Our collections include Japan-made K18 gold jewelry, pearls, diamonds, handmade gemstone bracelets, and preloved pieces." | 「チャジュエルズでは、〔origin word〕K18ゴールドジュエリー、パール、ダイヤモンド、ハンドメイドの天然石ブレスレット、そして中古ジュエリーなどを取り扱っています。」 |
| **Proposed (A and B)** | "Our collections include K18 gold jewelry, pearls, diamonds, handmade gemstone bracelets, and preloved pieces." | 「チャジュエルズでは、K18ゴールドジュエリー、パール、ダイヤモンド、ハンドメイドの天然石ブレスレット、そして中古ジュエリーなどを取り扱っています。」 |

### 2.2 Paragraph 2 ("New Japan-made jewelry…")

| | English | 日本語 |
|---|---|---|
| Current | "New Japan-made jewelry reflects its makers’ work. Preloved branded jewelry carries the history and craftsmanship of its original brand. Handmade gemstone bracelets offer another way to enjoy color and personal style." | 「〔origin word〕新品ジュエリーには、作り手の技術が込められています。中古のブランドジュエリーには、そのブランドが生み出したデザインや技術があります。ハンドメイドの天然石ブレスレットでは、色や組み合わせを楽しむことができます。」 |
| **Option A** | "New jewelry reflects its makers’ work. Preloved branded jewelry carries the history and craftsmanship of its original brand. Handmade gemstone bracelets offer another way to enjoy color and personal style." | 「新品ジュエリーには、作り手の技術が込められています。中古のブランドジュエリーには、そのブランドが生み出したデザインや技術があります。ハンドメイドの天然石ブレスレットでは、色や組み合わせを楽しむことができます。」 |
| **Option B** | "Our new jewelry is made in Japan, and so are many of our preloved pieces. Preloved branded pieces are made by their original brands and authenticated in Japan. Handmade gemstone bracelets offer another way to enjoy color and personal style." | 「新品ジュエリーはすべて日本製で、中古品にも日本製が多くあります。中古ブランド品は各ブランドの製品で、日本で真贋鑑定済みです。ハンドメイドの天然石ブレスレットでは、色や組み合わせを楽しむことができます。」 |

Option B's first two sentences are the exact approved clarifier already used site-wide; nothing new is invented.

### 2.3 Difference between A and B

- **A** removes the generalised origin wording and says nothing new about origin or authentication. Origin stays where the website already shows it: the per-product badge (only when the Hub says `origin = JAPAN`) and the footer/About clarifier.
- **B** puts the approved clarifier into the article. It restores an origin statement in running text.

### 2.4 Recommendation: Option A (lower risk; your decision)

1. The Japanese clarifier applies its origin statement to all new jewelry ("すべて"). At audit time 128 of 130 new products carried the Japan badge **[A]**; the two without it were not identified, and it is not known whether they are jewelry **[U]**. An article sentence about *all* new jewelry would be only as true as that flag.
2. B repeats an authentication statement ("authenticated in Japan") that this package has no evidence to re-confirm **[U]**; it is existing approved site copy, but the article does not need it.
3. A removes risk without removing information a shopper can already see on each product page.
4. No SEO difference between A and B is evidenced; no ranking claim is made either way.

Choose B only if you confirm that the clarifier is true for every new piece, and you want it in the article.

**Optional A-02 (Japanese only).** The Japanese article says 天然石 ("natural stone") for the bracelets; the Hub collection and the English text say gemstone. Whether the stones are natural is **[U]**. Proposed unless you confirm natural stones: replace 天然石 with 宝石 in both Japanese paragraphs (「ハンドメイドの宝石ブレスレット」). English needs no change.

**A-03 (related):** the article presents handmade gemstone bracelets as part of the range while the collection holds 0 pieces; decide with OD-S4-5.

**Evidence still required:** none for A. For B: confirmation that the Japan flag covers every new piece, and the basis for the authentication statement.
**Risks:** a Hub body edit goes live within about a minute and `check:terms` does not scan Hub text, so each edit must be followed by a live EN + JA re-fetch.
**Rollback:** restore the current text (kept above).

- [ ] Option A for paragraph 2 — [ ] Option B for paragraph 2 — [ ] Paragraph 1 as proposed — [ ] A-02 (宝石) approved — [ ] Edited text: ______

---

## 3. How copy fixes differ from structure changes (applies to §4–5)

- **Copy correction:** edits one Hub text field. Reversible by pasting the old text back. Changes the page text and meta description, not which products are listed.
- **Membership change:** adds or removes a product from a collection or category. Changes the grid, the product counts and the `ItemList`; it is a product-facts decision. **Not proposed anywhere in this package.** Where a mismatch can be fixed by describing the collection accurately, that is recommended.

---

## 4. OD-S4-3 — Collection descriptions (Hub `website_collections.description` and `description_ja`)

All proposed texts are ≤ 160 characters [P]. Edit English and Japanese together. Counts are audit-day **[A]** unless marked.

### C-01 Necklaces — P1 — copy correction
- **Problem:** the text says "K18 and platinum" but 66 of 138 pieces are silver (SV925) **[A]**.
- **Current:** "Chains and necklaces in K18 and platinum, sized for everyday wear." / 「K18とプラチナのチェーン・ネックレス。毎日身につけやすい長さでご用意しています。」
- **Proposed:** "Gold, platinum and sterling silver chains and necklaces, including pearl and gemstone styles. Each piece lists its metal and length." / 「ゴールド、プラチナ、シルバー925のチェーンやネックレス。パールや宝石のデザインもあります。金属と長さは各商品に記載しています。」
- **Check:** necklaces hold pearl (42) and gemstone (35) pieces by name **[V]**. "Each piece lists its metal and length" matches the page spec ledger **[A]**.
- **Alternative:** leave unchanged (the text stays inaccurate for the largest group).
- **SEO/business:** the snippet matches the grid; no ranking claim.
- [ ] Approve — [ ] Edit — [ ] Reject

### C-02 Rings — P1 — copy correction; needs your resizing policy
- **Problem:** "resizable on request" is stronger than the Jewelry Guide, which says resizing depends on the design and to ask before reserving.
- **Current:** "Bands, solitaires and stacking rings, resizable on request." / 「バンドリング、ソリティア、重ね付けリング。ご希望によりサイズ直しを承ります。」
- **Proposed:** "Diamond, gemstone and pearl rings in gold and platinum, new and preloved. Many can be resized depending on the design; please ask before you reserve." / 「ダイヤモンド・宝石・パールのリング（新品・中古）。多くはデザインによりサイズ直しが可能です。ご予約前にご相談ください。」
- **Check:** rings are K18 70, platinum 72, silver 0; 135 pieces, 123 preloved **[V]**. "Many can be resized" is the Guide's own conditional wording; the real service limits (which rings, fees) are **[U]**.
- **Simpler alternative if you will not state a resizing policy:** drop the last sentence: "Diamond, gemstone and pearl rings in gold and platinum, new and preloved." / 「ダイヤモンド・宝石・パールのリング（新品・中古）。」
- **Evidence still required:** your confirmation that the proposed resizing sentence matches current practice.
- [ ] Approve full text — [ ] Approve shorter alternative — [ ] Edit — [ ] Reject

### C-04 Other Accessories — P1 — copy correction (recommended) or membership change
- **Problem:** the text says "beyond our jewelry…" but 37 of 51 pieces are necklaces; the collection is 32 new and 19 preloved **[V]**.
- **Current:** "…luxury accessories and distinctive pieces beyond our jewelry, watches, wallets, belts, and bags." (full Hub text is on the live page)
- **Proposed (a, recommended):** "Necklaces, earrings, bracelets and small accessories, new and preloved, including branded pieces." / 「ネックレス、ピアス、ブレスレットなどのアクセサリー（新品・中古、ブランド品を含む）。」
- **Alternative (b):** move the necklaces to the Necklaces collection in the Hub — a membership change, not proposed here, and it would need its own review of counts and `ItemList`.
- **Check:** branded pieces present (6 Tiffany & Co. by name) **[A]**.
- [ ] Approve (a) — [ ] Choose (b), separate review — [ ] Edit — [ ] Reject

### C-06 Pendants — P1 — copy correction (text corrected, see §1.3)
- **Problem:** "charms… paired with a chain" has no evidence; no product name contains "charm" and nothing records a chain pairing **[A, U]**.
- **Current:** "Pendant tops and charms, sold on their own or paired with a chain."
- **Proposed:** "Pendant tops in gold and platinum, new and preloved, set with diamonds, pearls and gemstones." / 「ゴールド・プラチナのペンダントトップ（新品・中古）。ダイヤモンド、パール、宝石をあしらったデザインもあります。」
- **Check:** K18 30, platinum 4; 15 new and 19 preloved; diamond 14, pearl 2, gemstone 7 by name **[V]**.
- **If a chain is in fact included or sold with pendants:** you state the policy and it can be added; this package does not assume it.
- [ ] Approve — [ ] Add chain policy: ______ — [ ] Edit — [ ] Reject

### Lower-priority refinements (H3; suggested after Search Console data exists)

| ID | Pri | Current issue | Proposed EN / JA |
|---|---|---|---|
| C-03 Pearls | P2 | Names Akoya and South Sea only; 54 of 63 are those two, silver 41 | "Akoya, South Sea and other pearl jewelry in gold, platinum and silver, selected for luster and elegance." / 「あこや真珠・南洋真珠ほか、ゴールド・プラチナ・シルバーのパールジュエリー。」 |
| C-05 Earrings | P2 | "secure posts and backs" is not a recorded fact | "Studs, drops and hoops in gold, platinum and pearl, new and preloved." / 「ゴールド・プラチナ・パールのスタッド、ドロップ、フープ（新品・中古）。」 |
| C-07 Bracelets | P2 | "adjustable where the design allows"; 0 of 25 names say adjustable | "Bangles and chain bracelets in gold and silver, new and preloved. Length is given on each piece where recorded." / 「ゴールド・シルバーのバングルとチェーンブレスレット（新品・中古）。長さは記載のある商品に表示しています。」 |
| C-10 Bags, Wallet, Watches | P2 | Text does not say preloved (bags 6/6, wallet 27/27, watches 31/31 preloved) | Add "preloved" and, only if you want it, the existing site phrase "authenticated in Japan" / 「日本で真贋確認済み」. No origin wording. Exact text per collection to be drafted after you choose to proceed |
| C-08, C-11 | P3 | Anklet wording; puffery in bags/wallet/watches text | Optional, no proposal |

For each: [ ] Approve — [ ] Edit — [ ] Reject — [ ] Defer

---

## 5. OD-S4-4, OD-S4-5 — Categories and the empty collection

### OD-S4-4 · K-01 Fine Jewelry — P1 — copy correction (recommended) or membership change
- **Problem:** the description says "new" but 3 preloved pieces are listed (R3438 platinum ring; N6430, N7040 silver Akoya strands) **[A]**.
- **Current:** "Discover new gold, pearl, diamond, and gemstone jewelry…" / 「新作の…」
- **Proposed (a, recommended):** "Gold, platinum, pearl, diamond and gemstone jewelry to celebrate life's milestones and make everyday moments shine." / 「人生の節目を祝い、日常のひとときを輝かせる、ゴールド・プラチナ・パール・ダイヤモンド・宝石のジュエリー。」
- **Check:** 99 listed: K18 74, platinum 20, silver 3; diamond 21, pearl 18, gemstone 10 **[V]**.
- **Alternative (b):** remove the 3 preloved pieces from this category (membership change; not proposed).
- **Business note:** dropping "new" also removes a sales cue; it is the accurate wording while any preloved piece is listed.
- [ ] Approve (a) — [ ] Choose (b), separate review — [ ] Edit — [ ] Reject

### OD-S4-4 · K-02 Preloved Jewelry — P1 — copy correction (recommended) or membership change
- **Problem:** the description says "unbranded" but the category includes a Tiffany & Co. ring (R3435) and 39 silver pieces **[A, V]**; branded status elsewhere is inferred from names and the Hub `brand` field was not read **[U]**.
- **Proposed (a, recommended):** "Beauty with a story, ready to become yours. Explore gold, platinum, silver and gemstone preloved jewelry with individual character." / 「物語のある美しさを、あなたのものに。個性豊かなゴールド・プラチナ・シルバー・宝石のプレラブドジュエリー。」
- **Check:** 194 listed: K18 74, platinum 83, silver 39 **[V]**.
- **Alternative (b):** move R3435 to the branded category (membership change; not proposed).
- [ ] Approve (a) — [ ] Choose (b), separate review — [ ] Edit — [ ] Reject

### OD-S4-5 · C-09 Handmade Gemstone Bracelets — P1 — decision only
- **Problem:** the collection shows "0 pieces" **[A]** (the page still lists four featured cards, which are suggestions, not members **[V]**) and its two URLs are in the sitemap.
- **Recommended: leave as is, no new text.** Any text such as "being prepared" would assert plans about future stock **[U]**. Changing indexing or the sitemap is a separate high-risk phase and is not proposed.
- **Alternatives:** (1) add a Hub description once stock exists; (2) if you confirm new pieces are coming, approve a sentence you write — a draft is offered only as a starting point: "New handmade gemstone bracelets are coming. Please browse our other bracelets in the meantime." / 「ハンドメイドの宝石ブレスレットは準備中です。それまでは、ほかのブレスレットをご覧ください。」 **[P, requires your confirmation of the plan]**
- **Related:** the article (OD-S4-2) still names this range.
- [ ] Leave as is — [ ] Add description once stock exists — [ ] Use the draft sentence (I confirm it is true) — [ ] Other: ______

---

## 6. Product content and data decisions

### OD-S4-6 · P-04 — Origin sentences in N1616 and 8C100 text — P1
- **Problem:** the Hub description of N1616 includes an origin phrase in its Remarks line, and 8C100's text contains an origin statement. Both pieces already have the Japan badge **[A]**, so the text and the flag currently agree. `check:terms` does not scan Hub text.
- **Risk:** two places state the same fact, and they can drift apart if one is edited. Preloved pieces elsewhere carry the Japan badge for reasons this audit could not see (P-13) **[U]**.
- **Recommended:** remove the origin phrase from the descriptions and let the badge carry it (badge shows only when `origin = JAPAN`). Exact edit: delete the origin phrase in the N1616 Remarks line (EN and JA) and the origin statement in 8C100 (EN and JA). No replacement sentence is written, because a new origin sentence needs your approval of the wording.
- **Alternative:** keep as is, since the text agrees with the flag.
- **Evidence still required:** the basis for the Hub `origin = JAPAN` value of these two pieces; the "Mint Bureau Assay Mark Engraved" remark (N1616) is a hallmark statement taken from the supplier text and also needs your or the supplier's confirmation **[U]**.
- [ ] Remove in-text origin phrase — [ ] Keep — [ ] Other: ______

### OD-S4-7 · P-06 — "Product rank" and serial numbers — P1
- **Problem:** 78 supplier-sheet descriptions (watches, bags, wallets) show "Product rank: A/B/S" (77) and a serial number (54) **[A]**. The site never explains the rank scale; a shopper cannot tell what "B" means, and it can read as a condition grade you have not defined. Where the sheet carries "Product condition: …" text, that free text is already more useful.
- **Recommended:** (1) delete the "Product rank: X" / 「商品ランク: X」 line until you have the supplier's definition; (2) delete serial numbers from public text; keep them in your own records — **copy them before editing** and check that the Hub holds them elsewhere **[U]**; (3) keep the "Product condition" line unchanged.
- **Alternatives:** keep the rank and add a one-line scale explanation written only from the supplier's own document; keep serials if you want them public.
- **Risks:** serial numbers are your business call (they can aid buyer confidence but also expose item identifiers); removing the rank loses information some buyers read; do not replace it with a grade you have not recorded. Never invent a condition grade.
- **Evidence still required:** supplier document defining A/B/S (only if the rank stays).
- [ ] Remove rank and serials — [ ] Remove serials only — [ ] Keep rank, add explanation (source: ______) — [ ] Keep all

### OD-S4-8 · P-07 — "Natural South Sea Pearl" (EHS10, ESH9, PPS12, PPS13, EGS10) — P1
- **Problem:** "Natural" can mean natural colour or a natural (non-cultured) pearl. The record does not say which **[A, U]**.
- **Recommended (default until you confirm):** remove the word, leaving "South Sea Pearl" / 「南洋真珠」. This asserts nothing new.
- **If you confirm it means natural colour:** "South Sea Pearl, natural colour" / 「南洋真珠（ナチュラルカラー）」.
- **If you intend a non-cultured natural pearl:** that is a material claim; do not publish without a laboratory or supplier document.
- **Where the text is:** product names, so apply the slug precaution in OD-S4-9 first.
- [ ] Remove "Natural" — [ ] Natural colour — [ ] Other, with supporting document: ______

### OD-S4-9 · P-08, P-09 — Name spelling and missing type words — P2
- **Typos:** "Tiifany" (N2004, N0484, N1999 and others), "Neckalce" (N1767), "Prelvoed" (SB094). The complete list needs a Hub query **[U]**.
- **Missing type word (P-09):** 16 names start with a material or size and have no word like Necklace, Ring or Watch; the list needs a Hub query **[U]**.
- **Proposed:** correct the spelling; add the type word only where the type is certain from the record.
- **Slug and order lines:** in the Hub source on `origin/main`, the product dialog keeps the slug when an existing product's name is edited (`slug: f.id ? f.slug : slugify(...)`, `ProductDialog.tsx`) **[V, source-read, not tested live]**. The slug field is separately editable, so do not touch it. Effect on order-line titles is **[U]**.
- **Safe procedure:** note the slug of one low-traffic product, edit its name only, re-fetch the page, confirm the URL is unchanged, then continue. This test edits live Hub data, so it needs your explicit go-ahead at the time.
- [ ] Approve typo fixes after slug test — [ ] Also approve type-word additions — [ ] Reject

### Pilot · P-02, P-03, P-11 — Ten description drafts (Hub `description_en` / `description_ja`)
- **Problem:** 340 of 437 descriptions repeat the product name's spec string **[A]**. The drafts below use only words already in each product's name; they add readability, not new facts. First sentence ≤ 150 characters so the meta description is not cut mid-word.
- **Current descriptions** are the spec strings shown in the audit (e.g. AL112 "K18 1.45g Heart N' Key Top").
- **Not touched:** N1616, 8C100 (own decisions), the two watches, the 16 empty descriptions (P-03; add after the pilot).

| SKU | Proposed EN [P] | Proposed JA [P] |
|---|---|---|
| AL112 | "K18 pendant, heart and key top, 1.45 g." | 「K18のペンダント。ハートとキーのトップ、重さ1.45g。」 |
| AL510 | "K18 ring with a cross motif, 2.50 g, Sz# 12." | 「K18のクロスモチーフのリング。重さ2.50g、Sz# 12。」 |
| B4618 | "K18 oval snake chain bracelet, 4.60 g, 18 cm." | 「K18のオーバルスネークチェーンブレスレット。重さ4.60g、長さ18cm。」 |
| E1J33 | "K18 star stud earrings, 10 mm, 0.60 g." | 「K18のスターのスタッドピアス。10mm、重さ0.60g。」 |
| A8523 | "K18 oval snake chain anklet, 8.80 g, 23 cm." | 「K18のオーバルスネークチェーンのアンクレット。重さ8.80g、長さ23cm。」 |
| ND45S | "K18 Venetian chain necklace with a dragon top, 2.10 g, 45 cm, adjustable." | 「K18のドラゴントップ付きベネチアンチェーンネックレス。重さ2.10g、長さ45cm、アジャスタブル。」 |
| N1105 | "Preloved SV925 Akoya pearl necklace, pearls 6.4-6.7 mm, 43 cm." | 「プレラブドのSV925あこやパールネックレス。パールは6.4-6.7mm、長さ43cm。」 |
| R0047 | "Preloved PT900 and K18 ring with diamond 0.97 ct and emerald 1.16 ct, 12.80 g, Sz# 10.5." | 「プレラブドのPT900・K18リング。ダイヤモンド0.97ct、エメラルド1.16ct、重さ12.80g、Sz# 10.5。」 |
| E1010 | "Preloved PT900 stud earrings with diamond 0.10 ct, 5.0 mm, 1.0 g." | 「プレラブドのPT900スタッドピアス。ダイヤモンド0.10ct、5.0mm、重さ1.0g。」 |
| B1318 | "Preloved Tiffany & Co bracelet, 750 PG, Diamond By The Yard, 1.35 g, 18 cm." | 「プレラブドのTiffany & Co ブレスレット。750PG、Diamond By The Yard、重さ1.35g、長さ18cm。」 |

Notes: "Sz#" is kept as recorded because the size system is not stated **[U]**. "750 PG" and "SV925" are kept exactly as the record writes them; no purity, hallmark, origin, grade or authentication is added. B1318's English phrase stays untranslated in Japanese as the brand's product name (P-12).
**Quality bar for the pilot:** re-fetch EN and JA, meta ≤ 160 characters, no new claim; then decide whether to extend.
**Rollback:** paste the old spec string back (recorded in the audit samples and in the Hub history you keep).

- [ ] Approve all ten — [ ] Approve these SKUs only: ______ — [ ] Edit — [ ] Reject

---

## 7. OD-S4-10 — Optional website-code batch W1 (Group D; separate branch, PR and tests)

Scope, benefit and risk, evaluated separately. **None is implemented, and none shares a PR with a Hub text edit.**

| Item | Scope | Expected benefit | Technical risk |
|---|---|---|---|
| Japanese listing titles (C-12) | `listingTitle` in `lib/meta-text.ts`; Japanese collection titles are the bare Hub name today | Parity with the English titles extended in Step 2. Draft pattern [P]: 「{名称}：東京発のジュエリーコレクション」, wording needs your approval. No ranking claim | Low–medium: unit tests, 34-title uniqueness, `check:terms` |
| Safer fallback description (P-03) | `productMetaDescription` fallback starts with the SKU and ends "Shipping worldwide." | Readable snippet for the 16 empty descriptions. The Hub fix (add a description) removes the need | Low. The "Shipping worldwide" phrase is existing code and not assessed here **[U]** |
| Strip Markdown in meta (P-05) | Same file | Affects 8C100 only today; the Hub text fix (delete the asterisks) solves it without code | Low |
| Internal links | Preloved Jewelry ↔ Preloved Branded Jewelry; Pearls → Jewelry Guide pearl section, only if a destination exists **[U]** | Navigation; modest | Low; no new routes |
| Title length (P-10) | 285 of 453 titles exceed 60 characters | No evidence of benefit; truncation is cosmetic | Medium: risk of drift from product names |

**Recommended: defer W1 entirely.** The Hub text fixes solve the same visible defects (P-03, P-05) without code, and there is no Search Console performance data **[A]** to show titles matter. Reconsider after the Hub batches and when data exists. If you do approve a code batch, authorise only the Japanese titles and, if still needed, the Markdown strip, and keep the title-length item out.

- [ ] Defer W1 — [ ] Approve Japanese listing titles only — [ ] Approve Japanese titles + Markdown strip — [ ] Approve other: ______

---

## 8. Traceability

| Owner decision | Audit finding | Audit section |
|---|---|---|
| OD-S4-2 | A-01 (+A-02, A-03) | §7 |
| OD-S4-3 | C-01, C-02, C-04, C-06; C-03, C-05, C-07, C-08, C-10, C-11 | §3 |
| OD-S4-4 | K-01, K-02 | §4 |
| OD-S4-5 | C-09 (+A-03) | §3, §7.4 |
| OD-S4-6 | P-04 (+P-13 context) | §5.4 |
| OD-S4-7 | P-06 | §5.4 |
| OD-S4-8 | P-07 | §5.4 |
| OD-S4-9 | P-08, P-09 | §5.4 |
| OD-S4-10 | C-12, P-03, P-05, P-10, internal links | §3, §4, §5.4 |
| Pilot | P-02, P-03, P-11 | §5.4, §5.5 |
| Not covered here | K-03, K-04, K-05, P-12, P-13, P-14, P-15 (optional or observation-only) | — |

## 9. What this package does not do

No Hub edit, no product condition or membership change, no article edit or publication, no website-code change, no migration, no routing/canonical/hreflang/sitemap change, no Search Console action, no payment/cart/checkout change, no Step 3b/3c, no OD-6, no new SEO growth phase, no merge or release. Status words: Step 4 stays AUDITED — OWNER APPROVAL PENDING; none of IMPLEMENTING, READY FOR QA, VERIFIED or DEPLOYED applies. No ranking or indexing result is claimed or implied.

## 10. Evidence gaps carried forward

Metal and stone words come from product names only; `brand` and `origin` Hub fields were not read; resizing policy, chain policy, the meaning of "Natural", the rank scale and the basis for the Japan flag are owner or supplier facts; the full lists for P-08 and P-09 need a Hub query; order-line effects of a name edit are unverified; counts are a 2026-10-30 snapshot and stock changes daily.

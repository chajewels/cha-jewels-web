# Step 4 — H1 owner publishing checklist (seven Hub records)

**Owner decisions recorded. No Hub implementation authorized or performed.** This file is a checklist for the owner. Claude does not edit, save or publish Hub content. Step 4 stays AUDITED — OWNER APPROVAL PENDING. The article (§1) was moved out of SEO scope by the owner on 2026-10-31 (PR #450: a brand-rule content task, no material SEO impact); the owner's Option A decision and the exact edit below are unchanged, and its live check stays in §8 as a content task. Prepared 2026-10-30.

The wording below is copied character for character from [`STEP-4-OWNER-APPROVAL-RECORD.md`](STEP-4-OWNER-APPROVAL-RECORD.md) §2 and §7 (Rings: the owner's Choice 2). The owner retains final control of editing, saving and publishing. If you change any word, tell me before publishing so the record matches.

## 0. Read first

**Where each record lives (Hub source on `la-tracking` `origin/main`, read without any private record):**

| Record | Hub navigation | Fields |
|---|---|---|
| Article | Website → **Content** tab → **Posts** card → open the post | **Body (markdown)** English and Japanese (`website_posts.body_en`, `body_ja`) |
| 4 collections | Website → **Catalog** tab → **Product types** card (`website_collections`) | per-row description boxes, English and Japanese |
| 2 categories | Website → **Catalog** tab → **Categories** card → pencil "Edit …" → dialog | **Description (English)** and **Description (Japanese)** |

**Save behaviour.**
- Verified in the Hub source: the post editor's **Save post** writes the whole row at once and keeps the Published switch as it is; the collection row's **Save** writes the English and Japanese description (and the Japanese name) from the boxes and is enabled only after a change; the category dialog's **Save** writes the whole category form. Collections have no Published flag.
- **Treat every Save on an already-published record as live.** The Hub's own message after saving a post says the website refreshes within a minute. Categories have no refresh trigger in the Hub migrations I read, so allow up to about a minute for them too.
- **Unverified:** that the deployed Hub interface matches this source, and the exact permission names. I have not seen the live Hub screens.

**Do NOT click "Regenerate Japanese"** (collection rows, the category dialog and the post editor) or any translate button. It overwrites the Japanese text from the English and would replace the approved Japanese wording.

**Do not change** names, slugs, hero or cover images, CTA labels, sort order, Date, Type, Published switches or product membership.

**Backups (nothing has been backed up by Claude).** Before editing each field, copy its current English and Japanese text into a note or file kept **outside GitHub**, labelled with the record, field and time. For the article, copy the **whole** English body and the **whole** Japanese body (select all in each textarea). Do not paste the Japanese article backup into this repository: it contains wording that the repository's terminology check forbids.

**Rollback (every record).** Paste the backed-up original text back into the same field and Save again; for the article restore the whole body. Re-check the live page after a minute. The original wording of the six listing texts is also written below.

---

## 1. Article — "Why Cha Jewels? The Care Behind Every Piece"

- **Navigate:** Website → Content → Posts → open the post with slug `why-cha-jewels-care-behind-every-piece`.
- **Fields:** Body (markdown), English, and Body (markdown), Japanese.
- **Live URLs:** `https://www.chajewelsjp.com/en/blog/why-cha-jewels-care-behind-every-piece` and `https://www.chajewelsjp.com/ja/blog/why-cha-jewels-care-behind-every-piece`.
- **Approved change (Option A):** remove only the generalised origin wording from two paragraphs per language. Keep **天然石** unchanged. Leave every other paragraph, image, link and Markdown mark as it is. Edit by deleting the words below inside the paragraph, not by retyping the paragraph, so formatting is preserved.

| Language / paragraph | Existing text | Delete only | Result = approved text |
|---|---|---|---|
| EN, first paragraph | "Our collections include Japan-made K18 gold jewelry, pearls, diamonds, handmade gemstone bracelets, and preloved pieces." | the words "Japan-made " | "Our collections include K18 gold jewelry, pearls, diamonds, handmade gemstone bracelets, and preloved pieces." |
| EN, second paragraph | "New Japan-made jewelry reflects its makers’ work. Preloved branded jewelry carries the history and craftsmanship of its original brand. Handmade gemstone bracelets offer another way to enjoy color and personal style." | the words "Japan-made " | "New jewelry reflects its makers’ work. Preloved branded jewelry carries the history and craftsmanship of its original brand. Handmade gemstone bracelets offer another way to enjoy color and personal style." |
| JA, first paragraph | 「チャジュエルズでは、〔origin word〕K18ゴールドジュエリー、パール、ダイヤモンド、ハンドメイドの天然石ブレスレット、そして中古ジュエリーなどを取り扱っています。」 | 〔origin word〕 (the made-in-country word plus の, directly before K18) | 「チャジュエルズでは、K18ゴールドジュエリー、パール、ダイヤモンド、ハンドメイドの天然石ブレスレット、そして中古ジュエリーなどを取り扱っています。」 |
| JA, second paragraph | 「〔origin word〕新品ジュエリーには、作り手の技術が込められています。中古のブランドジュエリーには、そのブランドが生み出したデザインや技術があります。ハンドメイドの天然石ブレスレットでは、色や組み合わせを楽しむことができます。」 | 〔origin word〕 (the made-in-country word plus の, at the start of the paragraph) | 「新品ジュエリーには、作り手の技術が込められています。中古のブランドジュエリーには、そのブランドが生み出したデザインや技術があります。ハンドメイドの天然石ブレスレットでは、色や組み合わせを楽しむことができます。」 |

〔origin word〕 stands for the made-in-country word shown on the live Japanese page, written as the phrase before の in the paragraphs above; it is redacted here only because the repository's terminology check forbids it.

Steps: (1) back up both full bodies; (2) make the four deletions; (3) check that each paragraph now equals the "approved text" and nothing else moved; (4) leave Published on and Date unchanged; (5) click **Save post** once (Cancel if anything looks wrong).

## 2. Necklaces collection

- **Navigate:** Website → Catalog → Product types → the **Necklaces** row; edit both description boxes; click that row's **Save**.
- **Live URLs:** `https://www.chajewelsjp.com/en/collections/necklaces`, `https://www.chajewelsjp.com/ja/collections/necklaces`.
- **Existing EN:** Chains and necklaces in K18 and platinum, sized for everyday wear.
- **Existing JA:** K18とプラチナのチェーン・ネックレス。毎日身につけやすい長さでご用意しています。
- **Approved EN:** Gold, platinum and sterling silver chains and necklaces, including pearl and gemstone styles. Each piece lists its metal and length.
- **Approved JA:** ゴールド、プラチナ、シルバー925のチェーンやネックレス。パールや宝石のデザインもあります。金属と長さは各商品に記載しています。

## 3. Rings collection — owner's Choice 2 (supersedes the first Rings text)

- **Navigate:** Website → Catalog → Product types → the **Rings** row; edit both description boxes; click that row's **Save**.
- **Live URLs:** `https://www.chajewelsjp.com/en/collections/rings`, `https://www.chajewelsjp.com/ja/collections/rings`.
- **Existing EN:** Bands, solitaires and stacking rings, resizable on request.
- **Existing JA:** バンドリング、ソリティア、重ね付けリング。ご希望によりサイズ直しを承ります。
- **Approved EN:** Explore new and preloved rings, from gold and platinum pieces with diamonds, pearls and gemstones to selected designer jewelry.
- **Approved JA:** ダイヤモンド、パール、宝石をあしらったゴールドやプラチナのリングから、ブランドジュエリーまで。新品・中古のリングをご紹介します。
- The earlier text "Diamond, gemstone and pearl rings in gold and platinum, new and preloved." is SUPERSEDED. Do not use it.

## 4. Other Accessories collection

- **Navigate:** Website → Catalog → Product types → the **Other Accessories** row; edit both boxes; **Save**.
- **Live URLs:** `https://www.chajewelsjp.com/en/collections/other-accessories`, `https://www.chajewelsjp.com/ja/collections/other-accessories`.
- **Existing EN:** A curated collection of luxury accessories and distinctive pieces beyond our jewelry, watches, wallets, belts, and bags.
- **Existing JA:** ジュエリー、時計、財布、ベルト、バッグ以外の、個性と魅力を備えたラグジュアリーアクセサリーを厳選してご紹介します。
- **Approved EN:** Necklaces, earrings, bracelets and small accessories, new and preloved, including branded pieces.
- **Approved JA:** ネックレス、ピアス、ブレスレットなどのアクセサリー（新品・中古、ブランド品を含む）。

## 5. Pendants collection

- **Navigate:** Website → Catalog → Product types → the **Pendants** row; edit both boxes; **Save**.
- **Live URLs:** `https://www.chajewelsjp.com/en/collections/pendants`, `https://www.chajewelsjp.com/ja/collections/pendants`.
- **Existing EN:** Pendant tops and charms, sold on their own or paired with a chain.
- **Existing JA:** ペンダントトップとチャーム。単品でも、チェーンとの組み合わせでもお求めいただけます。
- **Approved EN:** Pendant tops in gold and platinum, new and preloved, set with diamonds, pearls and gemstones.
- **Approved JA:** ゴールド・プラチナのペンダントトップ（新品・中古）。ダイヤモンド、パール、宝石をあしらったデザインもあります。

## 6. Fine Jewelry category

- **Navigate:** Website → Catalog → Categories → pencil "Edit Fine Jewelry" → "Edit category" dialog → Description (English) and Description (Japanese) → **Save**. Leave the Published switch on.
- **Live URLs:** `https://www.chajewelsjp.com/en/categories/fine-jewelry`, `https://www.chajewelsjp.com/ja/categories/fine-jewelry`.
- **Existing EN:** Discover new gold, pearl, diamond, and gemstone jewelry to celebrate life's milestones and make everyday moments shine.
- **Existing JA:** 人生の節目を祝い、日常のひとときを輝かせる、新作のゴールド・パール・ダイヤモンド・宝石ジュエリー。
- **Approved EN:** Gold, platinum, pearl, diamond and gemstone jewelry to celebrate life's milestones and make everyday moments shine.
- **Approved JA:** 人生の節目を祝い、日常のひとときを輝かせる、ゴールド・プラチナ・パール・ダイヤモンド・宝石のジュエリー。

## 7. Preloved Jewelry category

- **Navigate:** Website → Catalog → Categories → pencil "Edit Preloved Jewelry" → dialog → Description (English) and Description (Japanese) → **Save**. Leave Published on.
- **Live URLs:** `https://www.chajewelsjp.com/en/categories/preloved-jewelry`, `https://www.chajewelsjp.com/ja/categories/preloved-jewelry`.
- **Existing EN:** Beauty with a story, ready to become yours. Explore unbranded gold, platinum, and gemstone pieces with individual character.
- **Existing JA:** 物語のある美しさを、あなたのものに。個性豊かなノンブランドのゴールド・プラチナ・宝石ジュエリー。
- **Approved EN:** Beauty with a story, ready to become yours. Explore gold, platinum, silver and gemstone preloved jewelry with individual character.
- **Approved JA:** 物語のある美しさを、あなたのものに。個性豊かなゴールド・プラチナ・シルバー・宝石のプレラブドジュエリー。

---

## 8. After you publish (what I will check, 14 pages)

*Tooling (2026-11-01): these checks are automated in `scripts/check-step4-live.mjs` (read-only), with the product-link counts of each listing page recorded before publication in `step4-baseline-2026-11-01.json`. First run 2026-11-01T06:56Z: all twelve listing pages still OLD, article NOT APPLIED in both languages.*

Tell me which records you saved and when. For the article (EN, JA), the four collections (EN, JA) and the two categories (EN, JA) I will check: HTTP 200 and no redirect; the approved text on each page; article paragraphs, the image and links intact and the two old origin phrases gone in both languages; meta descriptions equal the approved text; canonical and hreflang unchanged; product counts and membership unchanged; no new origin or metal claim; no product data change. The article check is reported as a CONTENT task (not an SEO status item, per PR #450): it passes only when both language bodies are verified live. The approved footer clarifier appears on every page and is not part of the article body.

## 9. Facts recorded alongside (no product change authorised)

N5140: length "40cm" is now in the product name (live, EN and JA); no size row in its specification table; slug and canonical unchanged. R1866: "PM" is platinum (owner-provided, not independently read from the Hub). R2595 (in stock) and R2598 (sold): Louis Vuitton Mosaic rings in Preloved Designer Accessories; no metal is assigned without verified evidence. Details and sources: approval record §7.

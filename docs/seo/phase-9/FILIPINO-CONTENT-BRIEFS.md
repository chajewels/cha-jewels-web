# Phase 9 — Filipino / Taglish search content: briefs and one reviewable draft

**Status:** AUDITED (documentation only). No route, page, component or Hub content was created or changed.
**Date:** 2026-10-29 · **Plan:** `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` §13 and PHASE 9 · **Rule carried in:** X9 (wording), X8 (no Search Console data available to this document)

---

## 1. Where this content can live (route and language note)

- The site has **two languages, `en` and `ja`**, served at `/en/…` and `/ja/…` (Phase 2). There is **no `/fil/` or `/tl/` route**, no Filipino dictionary in `lib/i18n.ts`, and the Phase 2 migration map explicitly scopes `/fil/` out (`SEO-MIGRATION-MAP.md:16,56`).
- **Adding a Filipino locale or any new route needs owner approval under the route-change rule and is a Phase 2-class, high-risk change** (CLAUDE.md SEO governance 7). It is not proposed here.
- **Option recommended for Phase 9:** publish each brief as a **blog post in the Hub** (`GET /content/posts`, rendered at `/en/blog/<slug>`), written in Taglish in the `*_en` columns, with `title_ja` / `body_ja` left empty so the post is English-site-only (the site drops a post from a language it has no title and body in — `api.md` posts; F2 in the migration map). Consequences to accept: the page's `<html lang>` is `en` while the text is Taglish; BlogPosting `inLanguage` would say `en` (**owner/Phase 4 question**: whether to add a per-post language field to the Hub; not needed to start). A layaway post must be `layaway_only: true` so it never renders on `/ja/`.
- `description_tl` exists on the Product type (`lib/types.ts:82`) but is **null in every fixture and not rendered anywhere**; whether the Hub holds Tagalog descriptions for live products is **UNVERIFIED**. If it does, product pages could later surface them — a separate owner decision, not Phase 9.
- Measurement baseline: **UNKNOWN.** No Search Console export exists in this repository (Phase 0 "Search Console Day-0 export: NOT STARTED"). Plan §13 step 1 ("check Search Console for Filipino/Tagalog queries") is therefore an owner action before or alongside publishing; §5 below gives the query regex to use.

## 2. Wording rules for every brief and draft (enforced by `npm run check:terms` on this file)

- Purity: **K18 gold** (Taglish: "K18 gold", "K18 na alahas", "K18 jewelry"). Never a country word before "gold", in English or Taglish.
- Origin: never "made in" / "from" a country as a product claim, including Taglish equivalents ("gawa sa …", "galing …" about the piece). Approved forms: "K18 jewelry in Japan", "K18 hallmarks used in Japan", "buy K18 jewelry in Japan", "K18 jewelry authentication in Japan" — and their Taglish renderings "K18 jewelry sa Japan", "K18 hallmarks na ginagamit sa Japan", "bumili ng K18 jewelry sa Japan". An origin claim for a specific piece is data from the Hub (`origin === "JAPAN"`, the badge), never prose.
- What the site already says and may be repeated: "Every preloved piece is authenticated and its hallmark checked in Japan" (`/shopping-guide`); "We ship from Tokyo to customers worldwide" (FAQ) — shipping origin, not product origin.
- Money: no new numbers. Layaway terms only as published (30% deposit, 0% interest, 3 / 6 / 8 months, 8 months for orders of ¥300,000 and above, each instalment by bank transfer, ships after the final payment). No worked examples with yen amounts: point to the calculator. Shipping only as published (Japan: ¥800 under ¥8,000, free from ¥8,000). Points: "1 point = ¥1" as published. Nothing else.
- Layaway content is **English-site only**; a Taglish layaway post must be `layaway_only`.

## 3. Internal link targets that exist today

| Purpose | Route (English site) | Note |
|---|---|---|
| Layaway page | `/layaway` (bare, English only, 404 on JA) | `/en/layaway` is **Phase 3, BLOCKED/not yet created** (status doc). Until Phase 3 repoints links, the working English link is the bare `/layaway` (Option ii exception, `SEO-MIGRATION-MAP.md:158`). Briefs below write `/en/layaway` as the **target** route and the editor uses `/layaway` until Phase 3 ships. |
| Collections | `/en/collections`, `/en/collections/<slug>` | Slugs are Hub data; fixtures show `necklaces`, `rings`, `bracelets`, `earrings`, `pendants`. Confirm live slugs in `GET /catalog/collections` before linking. |
| Jewelry Guide (metals, K18 meaning, sizes) | `/en/jewelry-guide` (`#metals` anchor exists: `/gold-guide` redirects there) | |
| FAQ | `/en/faq` | Hub FAQ when present |
| Shopping guide | `/en/shopping-guide` | ordering, payment, shipping, returns |
| Wholesale | `/en/wholesale` | live sellers, boutiques |
| Why Cha Jewels / About / Affiliations | `/en/why-cha-jewels`, `/en/about`, `/en/affiliations` | permit, invoice number, memberships |
| Loyalty | `/en/loyalty` | |
| Contact | `/en/contact` | |
| Legal | `/en/legal/returns`, `/en/legal/tokusho` | |
| Sale | `/en/sale` | |

## 4. Content briefs (8)

Format per brief: intent · proposed title (≤60 chars where possible) · H1 · outline · internal links · measurement. Titles are Taglish; the meta description is written at editing time.

### B1 — Saan makakabili ng K18 gold sa Japan?
- **Intent:** commercial-informational; Filipino residents in Japan (and buyers in the PH) looking for a trustworthy place to buy K18 jewelry in Japan online.
- **Title:** Saan makakabili ng K18 gold sa Japan? Gabay para sa Pinoy
- **H1:** Saan makakabili ng K18 gold sa Japan?
- **Outline:** (1) Ano ang hinahanap mo: K18 hallmark, timbang (grams), presyo na tax-included; (2) Mga paraan ng pagbili sa Japan: physical shops, live selling, online shops — ano ang dapat i-check sa bawat isa (hallmark, receipt/領収書, permit ng seller); (3) Paano bumili sa Cha Jewels: order online, kumpirmasyon ng staff, bayad, shipping mula Tokyo; (4) Mga tanong na madalas (FAQ links); (5) CTA: collections.
- **Internal links:** `/en/collections`, `/en/shopping-guide`, `/en/why-cha-jewels` (permit, invoice registration), `/en/faq`, `/en/jewelry-guide#metals`.
- **Measurement:** Search Console page filter on the post URL; query regex `saan|makakabili|bili|k18` (see §5); impressions and clicks weekly; first review 8 weeks after publication. Success criterion is "query exists and the page receives impressions", not a position.

### B2 — Ano ang Kihei?
- **Intent:** informational; the Kihei chain is the single strongest Japan-specific jewelry term (plan §10).
- **Title:** Ano ang Kihei chain? Paliwanag para sa Filipino buyers
- **H1:** Ano ang Kihei?
- **Outline:** (1) Kihei (喜平) sa isang pangungusap: chain style na kilala sa Japan; (2) Mga cut/face (2面, 6面, 8面, 12面 — explain as "cut" count), paano binabasa ang label; (3) Timbang at presyo: bakit by weight ang pagpepresyo; (4) K18 vs. PT (platinum) Kihei; (5) Paano i-check ang hallmark (link B3); (6) Saan ito makikita sa Cha Jewels (necklaces collection); (7) FAQ-style Q&A (3–5 questions) for FAQ schema later.
- **Internal links:** `/en/collections/necklaces` (confirm slug), `/en/jewelry-guide`, `/en/faq`, B3, B5.
- **Measurement:** query regex `kihei|喜平|kehei`; track also the English "what is kihei" cluster the plan names (§20) to see if the Taglish page cannibalises or complements the English Kihei hub (Phase 7).

### B3 — Paano malaman kung tunay ang K18 jewelry sa Japan?
- **Intent:** informational/trust; authentication worry is the main objection in Filipino buyer conversations.
- **Title:** Paano malaman kung tunay ang K18 jewelry sa Japan? Hallmarks at tips
- **H1:** Paano malaman kung tunay ang K18 jewelry sa Japan?
- **Outline:** (1) Ano ang hallmark: K18 / 750 stamp, at ang 造幣局 (Japan Mint) hallmark na ginagamit sa Japan — describe as "K18 hallmarks used in Japan"; (2) Saan hanapin ang stamp sa chain, ring, earring; (3) Mga red flags (walang stamp, presyo na masyadong mababa sa timbang, walang receipt); (4) Paano namin ini-check sa Cha Jewels: "every preloved piece is authenticated and its hallmark checked in Japan" (published), secondhand dealer permit (published number); (5) Ano ang dapat hingin sa seller (receipt, weight, stamp photo); (6) CTA.
- **Internal links:** `/en/why-cha-jewels`, `/en/affiliations` (permit, invoice registration), `/en/jewelry-guide#metals`, `/en/faq`, B5.
- **Measurement:** query regex `tunay|fake|peke|authentic|hallmark|k18`.
- **Editorial caution:** no claim that any piece is made anywhere; the badge does that per product.

### B4 — Paano gumagana ang jewelry layaway sa Japan? (FULL DRAFT in §6)
- **Intent:** commercial; the plan's layaway SEO goal (§12) for the Filipino audience.
- **Title:** Paano gumagana ang jewelry layaway sa Japan? (Cha Jewels)
- **H1:** Paano gumagana ang jewelry layaway sa Japan?
- **Outline:** see §6. **`layaway_only: true` in the Hub** — English site only.
- **Internal links:** `/en/layaway` (target; `/layaway` until Phase 3), `/en/collections`, `/en/shopping-guide`, `/en/faq`, `/en/legal/tokusho`.
- **Measurement:** query regex `layaway|hulugan|installment|instalment|hulog`; conversion signal: layaway checkout starts from organic (plan §29 "layaway starts from organic") — requires the analytics owner to confirm the event exists (**UNVERIFIED**).

### B5 — Ano ang ibig sabihin ng K18 at 750 sa alahas?
- **Intent:** informational, high volume, low competition in Taglish; pairs with the English "k18 meaning" cluster (plan §20).
- **Title:** Ano ang ibig sabihin ng K18 at 750 sa alahas?
- **H1:** Ano ang K18? Ano ang 750?
- **Outline:** (1) K18 = 75% gold, 25% alloy (the site's Jewelry Guide plates say exactly this: "Gold 75%", "Alloy 25% (silver, copper)"); (2) K18 vs K14 vs K10 vs K24 sa kulay at tibay; (3) K18 at 750 ay parehong 18-karat; (4) PT900 / PT950 sa platinum (the Hub's `metals` values); (5) Bakit madalas K18 ang alahas na mabibili sa Japan (market practice, no origin claim); (6) CTA to the Jewelry Guide.
- **Internal links:** `/en/jewelry-guide#metals`, `/en/collections`, B2, B3.
- **Measurement:** query regex `k18|750|karat|ibig sabihin|meaning`.

### B6 — Preloved branded jewelry sa Japan: paano nasisiguro na authentic?
- **Intent:** commercial-informational; preloved branded is a distinct category (`preloved-branded-jewelry`) and a Filipino-market favourite.
- **Title:** Preloved branded jewelry sa Japan: paano siguradong authentic?
- **H1:** Preloved branded jewelry sa Japan
- **Outline:** (1) Ano ang "preloved" sa Cha Jewels (condition "Preloved" badge; "authenticated in Japan"); (2) Paano gumagana ang secondhand dealer permit system sa Japan (古物商許可) — the published permit number; (3) Ano ang kasama sa listing: condition, timbang, hallmark, brand name (name only, never a logo — site rule); (4) Returns policy na published (defect/wrong item within 5 days; no change-of-mind) — copy exactly; (5) CTA to the preloved category.
- **Internal links:** `/en/categories/preloved-branded-jewelry` (confirm slug), `/en/legal/returns`, `/en/affiliations`, `/en/faq`.
- **Measurement:** query regex `preloved|second ?hand|branded|authentic|legit`.

### B7 — Paano umorder online at magpa-ship sa Pilipinas?
- **Intent:** transactional support; buyers in the PH asking about ordering, payment and customs.
- **Title:** Paano umorder sa Cha Jewels at magpa-ship sa Pilipinas?
- **H1:** Paano umorder at magpa-ship sa Pilipinas
- **Outline:** (1) Sign in, add to cart, checkout — "the piece is set aside from that moment" (published); (2) Kumpirmasyon ng staff, saka bayad; deadline 24 h (new) / 72 h (returning) as published; (3) Payment methods as named on the tokusho/shopping guide (bank transfer always; others follow the Hub switches — do not list card/Paidy unless the live page names them); (4) Shipping: "shown at checkout" for outside Japan; customs duties paid by the customer (published); tracking number; (5) Receipts (領収書 PDF) in English; (6) Layaway reference only via link (English site).
- **Internal links:** `/en/shopping-guide`, `/en/faq`, `/en/legal/tokusho`, `/en/contact`, B4.
- **Measurement:** query regex `order|umorder|ship|padala|pilipinas|philippines|customs`.
- **Editorial caution:** the payment-method list changes with Hub switches (`paymentMethodsText`); the post must say "see the shopping guide for the current list" rather than restate it.

### B8 — Wholesale K18 para sa live sellers at online sellers
- **Intent:** B2B; Filipino live sellers in Japan and the PH (the wholesale page's own audience: "live sellers, boutiques and family jewelry businesses in Japan and the Philippines").
- **Title:** Wholesale K18 jewelry para sa live sellers: paano mag-request ng price list
- **H1:** Wholesale para sa live sellers at online sellers
- **Outline:** (1) Para kanino (published wholesale lede); (2) Ano ang kasama: hallmark story, weights, trade prices (no numbers); (3) Paano mag-request: the wholesale form fields (name, business, email, mobile/WhatsApp, where you sell, monthly volume); (4) Invoice registration number (published) para sa negosyo; (5) CTA to `/en/wholesale`.
- **Internal links:** `/en/wholesale`, `/en/affiliations`, `/en/about`.
- **Measurement:** query regex `wholesale|supplier|live sell|reseller|bulk`; form submissions tagged by referrer (owner/analytics, **UNVERIFIED** availability).

## 5. Measurement plan (shared)

- **Instrument:** Search Console → Performance → Search results; filters: Page = post URL; Query = regex. Export CSV weekly into the Phase 12 workflow (`docs/seo/phase-12/SEARCH-CONSOLE-OPERATIONS.md`). No metric is written anywhere without an export.
- **Filipino-query regex (RE2, Search Console "Custom (regex)" filter; prefix `(?i)` for case-insensitivity — verify in the UI):**
  `(?i)\b(saan|paano|ano|magkano|bakit|pwede|puwede|tunay|peke|legit|hulugan|hulog|alahas|bili|bumili|makakabili|padala|pilipinas|pinoy|pinay|kabayan|para sa)\b`
- **Decision rule (plan §13 step 5):** expand beyond these 8 only if, after 8–12 weeks, Filipino-language queries show impressions in the export. Zero impressions → do not assume demand (plan §19).
- **Statuses:** each post moves NOT STARTED → AUDITED (brief approved) → IMPLEMENTING (writing) → READY FOR QA (Hub draft) → DEPLOYED (published) → SEARCH ENGINE RECRAWL PENDING → OBSERVED IN SEARCH CONSOLE (only with an export). Record in `SEO-IMPLEMENTATION-STATUS.md` (orchestrator).

## 6. Full draft — B4 (DRAFT — EDITORIAL APPROVAL REQUIRED)

> **DRAFT — EDITORIAL APPROVAL REQUIRED.** Taglish, English-site only (`layaway_only: true`). Every layaway term below is copied from the published site copy (`lib/i18n.ts` `home.layP`, `home.layStep1H/P`–`layStep3H/P`, `home.layPill`; tokusho 支払時期 and 引渡時期 rows; `/shopping-guide`). No new figures, no worked examples. Links: `/layaway` is the working link until Phase 3 creates `/en/layaway`. Word count ≈ 850.

**Title:** Paano gumagana ang jewelry layaway sa Japan? (Cha Jewels)
**Meta description (draft):** Layaway sa Cha Jewels: 30% deposit, 0% interest, 3, 6 o 8 buwan. Alamin kung paano i-reserve ang K18 jewelry sa Japan at bayaran buwan-buwan.

# Paano gumagana ang jewelry layaway sa Japan?

Marami sa aming mga customer ay Pinoy na nakatira sa Japan o nasa Pilipinas, at madalas naming matanggap ang tanong na ito: *"Pwede bang hulugan?"* Ang sagot ay oo — tinatawag namin itong **layaway**, at ganito ito gumagana sa Cha Jewels.

Sa madaling salita: **magbayad ng 30% para i-reserve ang piyesa, tapos bayaran ang balanse sa pantay na buwanang hulog, 0% interest.** Pumili ng tatlong buwan, anim na buwan, o walong buwan para sa mga order na ¥300,000 pataas. Walang bank loan, walang credit check sa bangko — bank transfer lang sa bawat hulog.

## Hakbang 1: I-reserve gamit ang 30% deposit

Kapag may nagustuhan kang piyesa — halimbawa, isang K18 Kihei chain o isang preloved branded ring — idagdag mo ito sa cart at piliin ang **layaway** sa checkout. Bago namin i-hold ang piyesa, babasahin at pipirmahan mo ang layaway agreement. Isa lang itong dokumento, nakasulat sa Tagalog na may English, para malinaw sa lahat ang usapan.

Pagkatapos mong pumirma, ipapadala namin ang bank details at ang deadline ng deposit. **Sa sandaling pumasok ang iyong 30% deposit, naka-reserve na sa iyo ang piyesa** — hindi na ito mabibili ng iba. Kung hindi dumating ang deposit sa loob ng deadline, ire-release namin ang hold at babalik sa tindahan ang piyesa; wala kang babayaran.

Gusto mong malaman kung magkano ang deposit para sa isang partikular na piyesa? Makikita mo ito mismo sa product page at sa [layaway calculator](/layaway) — ang mga numero doon ay galing sa aming system, kaya iyon ang eksaktong figure na gagamitin sa iyong plan.

## Hakbang 2: Hatiin ang balanse sa 3 hanggang 8 buwan

Ang natitirang balanse ay hinahati sa pantay na buwanang hulog. **0% interest, walang fees.** Ang mga pagpipilian:

- **3 buwan**
- **6 na buwan**
- **8 buwan** — para sa mga order na **¥300,000 pataas**

Ang bawat hulog ay binabayaran sa pamamagitan ng **bank transfer**, sa mga petsang nakalista sa iyong account. Pagka-sign in mo sa *My Account*, makikita mo ang iyong schedule: ang deposit, ang monthly, at ang final payment. Walang sorpresa — ang nakalista doon ang babayaran mo, wala nang dagdag.

## Hakbang 3: Ipapadala ang piyesa pagkatapos ng final payment

Ito ang pagkakaiba ng layaway sa installment na "kuha na, bayad mamaya": sa layaway, **ipapadala ang piyesa pagkatapos ng iyong huling hulog.** Hawak namin ito ng ligtas sa Tokyo habang nagbabayad ka. Kapag kumpleto na ang plan, ipapadala namin ito at bibigyan ka ng tracking number.

Kung nasa Japan ka, ang shipping fee ay ayon sa aming published rate (libre mula ¥8,000 ng mga piyesa; ¥800 kung mas mababa). Kung nasa Pilipinas ka o sa ibang bansa, makikita ang shipping fee sa checkout; ang customs duties sa destinasyon ay karaniwang sagot ng customer. Lahat ng detalye ay nasa aming [Shopping Guide](/en/shopping-guide).

## Mga madalas itanong

**Pwede ba ang layaway kahit nasa Pilipinas ako?**
Oo. Ang layaway ay para sa mga customer na gumagamit ng English site at sa mga customer overseas. Ang bank transfer ang paraan ng bayad sa bawat hulog.

**Bakit wala akong makitang layaway sa Japanese version ng site?**
Dahil ang layaway ay inaalok lang sa English site. Lumipat sa EN sa language toggle at makikita mo ito.

**Pwede ko bang gamitin ang coupon sa layaway?**
Hindi — ang coupon code ay hindi magagamit sa isang layaway order.

**May interest o hidden charges ba?**
Wala. 0% interest at walang fees sa plan mismo. Ang tanging gastos sa labas ng presyo ay ang shipping at ang bank transfer fee ng iyong bangko, gaya ng nakasaad sa aming [legal notice](/en/legal/tokusho).

**Paano kung hindi ko matuloy?**
Ang mga tuntunin sa pagkansela ay nakasulat sa layaway agreement na pipirmahan mo bago magsimula, at sa aming [Return, Cancellation and Refund Policy](/en/legal/returns). Basahin mo muna ito bago mag-deposit; kami rin ay handang sumagot sa [Contact](/en/contact) o sa Messenger.

**Anong mga piyesa ang pwede sa layaway?**
Lahat ng available (hindi "Sold") na piyesa sa English site. Tingnan ang [collections](/en/collections) o ang listahan ng "Pieces you can reserve today" sa [layaway page](/layaway).

## Bakit ganito ang ginagawa namin

Nagsimula ang Cha Jewels sa live selling para sa Filipino community sa Japan, at ang layaway ang paraan para maging abot-kaya ang isang K18 na alahas nang hindi umuutang sa bangko. Bawat preloved na piyesa ay authenticated at na-check ang hallmark sa Japan, may published secondhand dealer permit kami, at bawat figure na makikita mo — deposit, monthly, total — ay galing sa isang system, hindi sa tantya.

Handa ka na? [Buksan ang layaway calculator](/layaway), pumili ng piyesa, at i-reserve ito ngayon.

---

**Editorial checklist before this draft moves to READY FOR QA**

- [ ] Owner confirms the Taglish register (neutral, "ka/mo" second person) and that "layaway" stays untranslated (the agreement and the site use the word).
- [ ] Every figure above matches the live `/layaway` and `/shopping-guide` on the day of publication (30%, 0%, 3/6/8, ¥300,000, ¥8,000/¥800). If any changes in the Hub, the post changes with it.
- [ ] Coupon statement matches `checkout.couponLayawayNotAllowed` ("This code can't be used on a layaway") — it does today.
- [ ] Cancellation paragraph names no number (the agreement governs).
- [ ] `layaway_only: true`; `title_ja` / `body_ja` empty.
- [ ] Links: swap `/layaway` → `/en/layaway` when Phase 3 is DEPLOYED.
- [ ] `npm run check:terms` passes on the final text (if copied into the repo for review) and the text contains no origin claim.
- [ ] FAQ Q&A pairs may be reused for FAQ JSON-LD on the post only if Phase 4 adds a per-post FAQ mechanism (not today).

## 7. Documentation used

- `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` §12, §13, §20, PHASE 9
- `docs/seo/SEO-MIGRATION-MAP.md` (no `/fil/`; layaway link exception; F2 per-language posts)
- `docs/seo/SEO-IMPLEMENTATION-STATUS.md` (X8, X9; Phase 3 BLOCKED)
- `lib/i18n.ts` (`home.layP`, `home.layStep1–3`, `home.layPill`, `checkout.couponLayawayNotAllowed`, `layawayPage.*`, `wholesale.*`, `gold.*`), `lib/content/legal.ts` (tokusho rows), `lib/content/shopping-guide.ts`, `lib/content/faq.ts`, `lib/content/about.ts`, `supabase/contracts/api.md` (posts, FAQ, products `description_tl`), `app/` route listing

**UNVERIFIED:** live collection/category slugs; whether `description_tl` is populated in the Hub; Search Console demand for any Filipino query (no export exists); analytics event for layaway starts; Search Console regex case-sensitivity behaviour.

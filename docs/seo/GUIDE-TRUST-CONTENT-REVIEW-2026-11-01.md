# Guide and trust content review (R-30, R-31) — 2026-11-01

**Status:** AUDITED (review performed; no copy changed). **Scope:** the recorded-but-unperformed reviews in `SEO-REQUIREMENTS-REGISTER.md`: R-30 "guide copy follows the terminology rules" (plan §9) and R-31 "trust claims match evidence; no fabricated reviews or ratings" (plan §24). **Method:** read-only review of the source copy (EN and JA) against `docs/CLAUDE-DETAILS.md` (Terminology, Non-negotiable business rules), `scripts/check-terminology.mjs`, `scripts/check-money.mjs`, the plan sections, `phase-10/LOCAL-SEO-GBP-READINESS.md` (company facts) and the Hub contract `supabase/contracts/api.md`. Evidence tags: [V] verified in the repository; [O] owner-reported fact; [U] unverified. Nothing here changes copy: every change to a business claim is the owner's (decisions OD-CT-1..6 in §5).

**Files reviewed:** `lib/content/jewelry-guide.ts`, `lib/content/shopping-guide.ts`, `lib/content/about.ts`, `lib/content/product-trust.ts`, `lib/content/wholesale.ts`, `app/about/page.tsx`, `app/why-cha-jewels/page.tsx`, `app/affiliations/page.tsx`, `app/jewelry-guide/page.tsx`, `app/shopping-guide/page.tsx`; `lib/i18n.ts` (trust, why, contact, brand, home, loyalty strings); `lib/content/legal.ts` and `lib/content/faq.ts` by search; `components/home/testimonials.tsx`; `lib/json-ld.ts`.

## 1. Terminology (R-30) — PASS with four near-misses recorded

| # | Finding | Where | Verdict |
|---|---|---|---|
| T-1 | No country-branded gold phrasing, no origin statement (the badge wording or its Japanese form) outside `origin-badge.tsx` or the approved clarifier, no layaway in Japanese copy, purity written as K18/K14/K10/K24 everywhere (alt text "K18 yellow gold") | all guide files; `jewelry-guide.ts:341-395, 156-157, 412-413` | PASS [V]; `check:terms` covers these patterns |
| T-2 | "preloved pieces **sourced in Japan**" / 「日本国内で仕入れた…プレラブド」 — a sourcing claim outside the two permitted service phrasings ("authenticated in Japan", "hallmark checked in Japan"); not a purity or origin claim; the guard does not catch it | `lib/content/about.ts:139` (EN), `:73` (JA) | near-miss; approved wording [U] → OD-CT-1 |
| T-3 | "Certified diamond jewelry" / 「鑑定書付きダイヤモンドジュエリー」 and "certification assistance" are categorical, while the FAQ says a certificate is included only when the listing states it (`lib/content/faq.ts:86`); the same contradiction the owner removed from the wholesale page (`lib/content/wholesale.ts:10-16`) | `lib/content/about.ts:149, 153` (EN), `:83` (JA) | contradiction → OD-CT-2 |
| T-4 | Layaway gating on the Japanese site holds: `about.ts` JA list omits it (`:79-98`); the shopping-guide layaway block has an empty `ja` and is dropped by `guideBlocksFor` (`:121, :161-163`); the tokusho row is filtered by `tokushoRowsFor` (`app/shopping-guide/page.tsx:25`); the Why page section is gated (`app/why-cha-jewels/page.tsx:105`) | as cited | PASS [V]; `check:layaway-ja` covers the dictionary |
| T-5 | "The most common platinum for jewelry in Japan" / 「いちばん多い純度」 — an unsourced market claim in a file that cites sources for ring sizes, lengths and the 4C but not for this | `lib/content/jewelry-guide.ts:390` | [U] → OD-CT-3 |

**Customer-facing figures in the guides (money rule).** `check:money` catches arithmetic, not literals (`scripts/check-money.mjs:30-45`), so each literal was traced to its source:

| Figure | Where | Source | State |
|---|---|---|---|
| ¥8,000 free-shipping threshold / ¥800 fee (Japan) | `shopping-guide.ts:115` | owner-published policy text (file header `:17-19`); quoted by the Merchant proposal MC-G13 | existing policy text [O]; **wording mismatch:** `faq.ts:271` says free shipping "may apply to eligible orders", the guide states it unconditionally → OD-CT-4 |
| 24 h / 72 h reply and hold windows | `shopping-guide.ts:65` | `faq.ts:113` | consistent [V] |
| ships within five business days | `shopping-guide.ts:66, :117`; `wholesale.ts:36, 41` | `legal.ts:591` | consistent [V] |
| 1 point = ¥1 | `shopping-guide.ts:90` | `lib/i18n.ts:542, 678` | consistent [V] |
| "10% consumption tax", "no revenue stamp" | `shopping-guide.ts:105` | no source found in `app/account`, `components/account` or the legal text | [U] → OD-CT-4 |
| "coupon comes off first" (ordering of coupon vs points) | `shopping-guide.ts:90` | no ordering rule in `supabase/contracts/api.md` | [U] → OD-CT-4 |
| 30 % / 70 % cancellation split; 5-day defect window | `shopping-guide.ts:130, :142` | `legal.ts:266, :611` | consistent [V] |

## 2. Trust claims vs evidence (R-31)

| # | Claim | Where | Evidence | State |
|---|---|---|---|---|
| C-1 | Founded 2021; incorporated 2024; Tateishi, Katsushika | `about.ts:68, 134, 174-175`; `why-cha-jewels/page.tsx:62-64`; `i18n.ts:198-199, 390` | consistent with `phase-10/LOCAL-SEO-GBP-READINESS.md:13, 108`; no registration document in the repository (G4 at `:49` says the registered-name form is still to be confirmed) | [O] owner-published fact |
| C-2 | Secondhand dealer permit 307762418064; invoice registration T7011801044120 | `affiliations/page.tsx:59-63`; `product-trust.ts:41-44`; constants `legal.ts:120, 123` | "owner-provided from the permit itself" (`legal.ts:116-117`); the documents are not in the repository | [O] |
| C-3 | Tokyo Chamber of Commerce and Industry (2026.03) and Rotary (2026.09) memberships | `about.ts:109-110, 176-177`; `i18n.ts:296-304`; `affiliations/page.tsx:40-57` | recorded as real memberships in `phase-11/AUTHORITY-OPPORTUNITIES.md:24-25`; no certificate or directory listing in the repository | [O]; externally [U] |
| C-4 | "Every preloved piece is authenticated and its hallmark checked in Japan" / "every piece is checked individually in Japan before it is offered" | `shopping-guide.ts:51`; `jewelry-guide.ts:398`; `i18n.ts:202, 352` (rendered in the product trust block, `product-trust.ts:18-19`) | permitted wording; no process document or Hub field evidences the universal "every"; `api.md:54-59` governs origin only | universal claim [U] → OD-CT-5 |
| C-5 | "What every listing states: metal purity, hallmark, gram weight, gemstone, condition, certification" | `about.ts:179-180`; label `app/about/page.tsx:121` | the body says "whenever applicable" (`about.ts:140`); `karat` and `weight_g` are nullable in the contract (`api.md:15-17`) | the label overstates → OD-CT-5 |
| C-6 | "interest-free layaway" (EN only) | `about.ts:154, 160`; `i18n.ts:232` | `legal.ts:1194` | consistent [V] |
| C-7 | "preloved watches" offered | `i18n.ts:227` | not in the About product list (`about.ts:145-156`); whether watches are stocked is not visible here | [U] → OD-CT-6 |
| C-8 | "Serving our community since 2021", "clients worldwide", "retail and wholesale" | `i18n.ts:225`; `about.ts:141` | unquantified; no number claimed | acceptable as written |
| C-9 | Founder named as "Cynthia, founder and CEO" | `about.ts:184` | `REPRESENTATIVE_NAME` (`legal.ts:105-108`) | consistent [V] |
| C-10 | No "100 %", award, press mention, rating, review count or customer count anywhere in the reviewed files | — | — | PASS [V] |

**Reviews, ratings, testimonials (fabrication check):** none from static copy. Home testimonials come from the Hub (`GET /testimonials` and approved `GET /reviews`, `components/home/testimonials.tsx:10-13`); the three mock quotes were removed on 2026-09-22 (`:31-36`) and the section returns null when empty (`:46`). `aggregateRating` is emitted only from page-shown Hub reviews with a count above zero (`lib/json-ld.ts:55-62, 164`). PASS [V].

## 3. Plan-criteria gaps (recorded, not defects of this batch)

- **Plan §9 (guides, `CHA-JEWELS-SEO-MASTER-PLAN.md:433-468`):** the pillar topics at `:437-445` all exist in `jewelry-guide.ts:36-44`. The supporting pages at `:452-458` (hallmarks, K18 vs K24, kihei, the 4Cs, Akoya) do not exist as pages; the plan itself says "do not replace" (`:435`) and these belong to the Phase 6 `/en/guides/*` family (OD-P6-5). Akoya pearls are offered (`about.ts:139`) but have no guide section — a Phase 6/8 brief item.
- **Plan §24 (trust content, `:1037-1059`):** none of the six named trust pages (`:1041-1048`: how we check, hallmarks, certificates, preloved condition, gram weight, photography) exists as a page. Partial coverage: hallmarks in `jewelry-guide.ts:352-400`, certificates in `faq.ts:59-60, 86`; preloved condition grading and the photography standard are described nowhere reviewed. "Real examples and real photographs" (`:1058`) is met on About and Why (`app/about/page.tsx:29-34, 130-138`; `why-cha-jewels/page.tsx:58-99`).
- **Sources on page:** `jewelry-guide.ts` cites Seaforce/JCS (`:50-59`), Blue Nile (`:171-177`) and GIA (`:428-430`) in code comments only; nothing on the page attributes them. Optional for E-E-A-T; recorded.

## 4. Verdict for the register

- **R-30:** AUDITED — terminology PASS; four near-misses (T-2, T-3, T-5, figures T-4) are owner wording decisions, none a guard violation. Acceptance "guide copy follows the terminology rules" is met for the guarded rules; the un-guarded near-misses stay open until OD-CT-1..4.
- **R-31:** AUDITED — no fabricated review, rating or count; every trust claim is traceable to an owner-published fact or marked [U]; two universal claims (C-4, C-5) and one offer claim (C-7) exceed the evidence in the repository and are the owner's to confirm or soften (OD-CT-5, OD-CT-6). The §24 trust pages are a Phase 6 content item, not part of this batch.

## 5. Owner decisions (content; nothing changes until decided)

| ID | Decision | Default if undecided |
|---|---|---|
| OD-CT-1 | Keep "sourced in Japan" / 「日本国内で仕入れた」 on About as approved wording, or replace with one of the two permitted service phrasings | unchanged |
| OD-CT-2 | Resolve "Certified diamond jewelry" / "certification assistance" vs the FAQ's "only when the listing states it" (About `:149, :153`, JA `:83`) | unchanged; the FAQ wording is the narrower, evidenced one |
| OD-CT-3 | Source or soften "the most common platinum for jewelry in Japan" (`jewelry-guide.ts:390`) | unchanged |
| OD-CT-4 | Confirm the un-sourced figures and wording in the shopping guide: 10 % consumption tax and "no revenue stamp" (`:105`), "coupon comes off first" (`:90`), unconditional free shipping from ¥8,000 vs the FAQ's "may apply to eligible orders" | unchanged; flagged in the Merchant package (MC-G13 quotes the guide) |
| OD-CT-5 | Confirm the universal claims: "every preloved piece is authenticated and hallmark checked" (process evidence) and the About label "what every listing states" (the contract allows null purity and weight) | unchanged; the label could read "what a listing states, where applicable" — owner's call |
| OD-CT-6 | Confirm that preloved watches are an offered category (`i18n.ts:227`) or remove the mention | unchanged |

## 6. Documentation used
`docs/CLAUDE-DETAILS.md` (Terminology; Non-negotiable business rules), `scripts/check-terminology.mjs`, `scripts/check-money.mjs`, `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` (§7, §9, §24, §25 by content), `docs/seo/phase-10/LOCAL-SEO-GBP-READINESS.md`, `docs/seo/phase-11/AUTHORITY-OPPORTUNITIES.md`, `supabase/contracts/api.md` (product fields), `docs/seo/SEO-REQUIREMENTS-REGISTER.md` (R-30, R-31). **UNVERIFIED:** every item tagged [U] above; the external existence of the memberships and permits (owner-held documents).

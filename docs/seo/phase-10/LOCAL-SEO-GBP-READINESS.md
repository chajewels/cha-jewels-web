# Phase 10 — Local SEO and Google Business Profile readiness

**Status:** AUDITED (documentation only). No Google Business Profile was created, claimed, edited or looked up; no page was changed. **Update 2026-10-31: OD-GBP-1 answered No — not eligible, do not create a profile (see §4).**
**Date:** 2026-10-29 · **Plan:** `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` §16, §17, PHASE 10 · **Findings carried in:** X8 (GBP status UNKNOWN), X9 (wording)

---

## 1. What is known

| Question | Answer | Source |
|---|---|---|
| Does a Google Business Profile exist for Cha Jewels? Verified? Category? | **UNKNOWN (X8).** Only the owner can check (business.google.com, or searching the business name in Maps while signed in). | X8 |
| Is Cha Jewels a shop customers walk into? | The published copy describes an **online business with a registered office**: "Cha Jewels began in 2021 … through live selling … incorporated … in 2024, with its base in Tateishi, Katsushika-ku, Tokyo" (`/about`). The address is a room ("Time Mansion 301"). The About page photos mention a "showroom"/"display table" (alt text) but **no page invites visits, states visiting hours or says "by appointment"**. Support hours are published as message-answering hours, not opening hours. | `lib/content/about.ts:134,184-185`; `lib/content/legal.ts` tokusho 受付時間; `lib/content/shopping-guide.ts` notes |
| Does the business travel to customers? | Nothing published says so. | — |
| Local structured data | `JewelryStore` JSON-LD on the home page carries name, legalName, url, `address` with **locality, region, country only** (no street, no postal code), `areaServed: ["JP","PH"]`, `priceRange`. **No** `telephone`, `email`, `openingHoursSpecification`, `sameAs`, `logo`, `geo`, `hasMap`. | `lib/json-ld.ts:39`; baseline §8 (CONFIRMED) |

## 2. Audit of local-business information published on the website

All strings are interpolated from one module, `lib/content/legal.ts`, so they cannot drift between pages by construction; the exceptions are noted.

| Field | Published value | Where it renders (source) | Consistency |
|---|---|---|---|
| Registered name (JA, statutory) | `Ｃｈａ　Ｊｅｗｅｌｓ株式会社` (full-width Latin letters + 株式会社) | tokusho "Seller" (both columns), privacy/terms/returns headers, footer © line (JA), receipts/print header (`components/account/print-header.tsx`) | One constant `COMPANY_NAME`. Legal.ts comment: "STILL TO BE CONFIRMED against the registration certificate" — **owner to confirm the exact registered form (full-width letters) before entering it anywhere external**. |
| Display name (EN) | `Cha Jewels Co., Ltd. (Ｃｈａ　Ｊｅｗｅｌｓ株式会社)` | footer © (EN), `/contact` "Company", `/about`, terms art. 1 | `COMPANY_NAME_DISPLAY.en` |
| Brand name | `Cha Jewels` | JSON-LD `name`, titles, BlogPosting author/publisher | fixed string in `lib/json-ld.ts` |
| Representative | `Cynthia Nera Largo` / `ラルゴ　シンティア　ネラ` | tokusho, privacy, terms | `REPRESENTATIVE_NAME` (owner-uniform 2026-10-28) |
| Address (EN) | `Time Mansion 301, 6-5-1 Tateishi, Katsushika-ku, Tokyo 124-0012, Japan` | tokusho "Address", `/contact`, receipt header | `COMPANY_ADDRESS.en` |
| Address (JA) | `〒124-0012 東京都葛飾区立石6-5-1 タイムマンション301` | same, JA | `COMPANY_ADDRESS.ja` |
| Map query | `〒124-0012 東京都葛飾区立石6-5-1` (bare street address; the building name mis-resolved to a hotel, checked 2026-09-30) | `/contact` "View on Google Maps" | `COMPANY_MAP_QUERY` — relevant: the pin a GBP would carry must be the same point. |
| JSON-LD address | locality `Katsushika-ku`, region `Tokyo`, country `JP` — **no street, no postal code** | home page | Deliberately partial. Gap G1 below. |
| Phone (office) | `03-6657-6129` | tokusho, `/contact`, `/faq` footer band, `/why-cha-jewels` proof row | `COMPANY_PHONE.office`; owner-confirmed digits 2026-09-21. International form: `+81 3-6657-6129`. |
| Phone (mobile) | `070-8307-3318` | tokusho, `/contact` | `COMPANY_PHONE.mobile`. International form: `+81 70-8307-3318`. |
| Email | `sales@chajewelsjp.com` | tokusho, privacy, terms, returns (hardcoded literal in `legal.ts`) | **`/contact` reads the email from the Hub setting `contact.email` (`lib/settings.ts contactEmail`)** with a site fallback. Whether the Hub value equals `sales@chajewelsjp.com` is **UNVERIFIED** (gap G2). |
| Messenger | `m.me/chajewelsjapan` | legal pages (literal); `/contact` and footer from Hub `social.follow` | Note the handle keeps the **old domain name** `chajewelsjapan` (D2: old-domain redirect BLOCKED externally). Not an inconsistency, but the GBP "website" field must be the new domain. |
| Website | `https://www.chajewelsjp.com` → locale homes `/en`, `/ja` | canonical, sitemap | The root `/` behaviour is OD-3 (pending). For GBP, use `https://www.chajewelsjp.com/` unless the owner prefers `/ja` for a Japan listing. |
| Support hours | EN: `Weekdays 10:00–18:00 (JST), closed weekends and Japanese public holidays` · JA: `平日 10:00–18:00（土日祝日を除く）` | tokusho 受付時間; `/shopping-guide` "Good to know" ("We answer messages on weekdays, 10:00–18:00 JST …") | Same figures in both places (owner decision 2026-10-09). These are **message/support hours, not opening hours of a visitable location**. |
| Secondhand dealer permit | `Tokyo Metropolitan Public Safety Commission, Permit No. 307762418064` | tokusho, `/affiliations`, `/wholesale`, product trust block | `SECONDHAND_PERMIT_NO` |
| Invoice registration | `T7011801044120` | tokusho, `/affiliations`, `/wholesale` | `INVOICE_REG_NO` |
| Memberships (published) | Tokyo Chamber of Commerce and Industry (joined 2026.03); Tokyo Katsushika Central Rotary Club (2026.09) | `/about` timeline | `lib/content/about.ts:176-177` — real, published; useful for Phase 11 citations. |
| Social links | from Hub `social.follow` (`email|facebook|messenger|whatsapp|line`) | footer, `/contact` | Values are Hub data — **UNVERIFIED** here; the owner lists them for the GBP/`sameAs` set. |

### Gaps found (no change made; recorded for later phases)

| ID | Gap | Phase that owns it |
|---|---|---|
| G1 | `JewelryStore` JSON-LD has no street address, postal code, telephone, email, opening hours, `sameAs`, logo (baseline §8). Adding them is a Phase 4 structured-data change and must reflect **real, visible** data: the address and phones are on `/contact` and tokusho, so they qualify; `openingHoursSpecification` must **not** be added unless the location is actually open to visitors at those hours (support hours ≠ opening hours). | Phase 4 |
| G2 | Possible email drift: legal pages hardcode `sales@chajewelsjp.com`; `/contact` shows the Hub's `contact.email`. Owner confirms both are the same address. | Owner check; if different, a Hub setting edit (no code) |
| G3 | The site never says whether customers may visit the office. For GBP eligibility this is the deciding fact (§4). | Owner decision OD-GBP-1 |
| G4 | Registered-name form "to be confirmed against the registration certificate" (comment in `legal.ts`). | Owner (compliance review) |
| G5 | Old-domain Messenger handle vs new domain: fine, but every external listing must use `www.chajewelsjp.com`. | Phase 10 action list |

## 3. The one NAP set (use these exact strings everywhere external)

```text
Name (EN):        Cha Jewels Co., Ltd.
Name (JA):        Ｃｈａ　Ｊｅｗｅｌｓ株式会社   ← confirm form (G4)
Brand:            Cha Jewels
Address (EN):     Time Mansion 301, 6-5-1 Tateishi, Katsushika-ku, Tokyo 124-0012, Japan
Address (JA):     〒124-0012 東京都葛飾区立石6-5-1 タイムマンション301
Map pin:          6-chōme-5-1 Tateishi, Katsushika-ku (the point COMPANY_MAP_QUERY resolves to)
Phone (office):   03-6657-6129   / international +81 3-6657-6129
Phone (mobile):   070-8307-3318  / international +81 70-8307-3318
Email:            sales@chajewelsjp.com   ← confirm equals Hub contact.email (G2)
Website:          https://www.chajewelsjp.com/
Support hours:    Weekdays 10:00–18:00 JST; closed weekends and Japanese public holidays
Permit:           古物商許可 東京都公安委員会 第307762418064号
Invoice reg.:     T7011801044120
```

## 4. Google Business Profile eligibility: storefront vs service-area vs online-only

Source: Google Business Profile Help, "Guidelines for representing your business on Google" (https://support.google.com/business/answer/3038177, fetched 2026-10-29). Key statements, as read on that date:

- A business is eligible if it "make[s] in-person contact with customers during its stated hours": it has a physical location customers can visit, or it travels to customers. The page says to "create your Business Profile for your actual, real-world location."
- A **virtual office** is not eligible. "Service-area businesses can't list a 'virtual' office unless that office is staffed during business hours."
- **Service-area businesses** (that travel to customers) may have one profile without a storefront, must **hide the address**, and the area "shouldn't extend farther than about 2 hours of driving time."
- **Hybrid** businesses (storefront + travel) can show the storefront address, but the location "should be staffed by your team and able to receive customers during its stated hours."
- The page does not address pure online-only sellers with no visitable location; by the above, such a business has no eligible location to list.

Applied to Cha Jewels (published facts only):

| Model | Fits? | Consequence |
|---|---|---|
| **Storefront** (address shown, hours shown) | Only if the Tateishi office is **staffed and receives customers during the stated hours** (by appointment counts only if a visitor can actually be received in those hours). The website does not currently say this (G3). | If yes: category "Jewelry store" (expected to exist in the category picker; **UNVERIFIED** exact label), hours = the hours customers can really be received (may differ from the 10:00–18:00 support hours), address as in §3, pin as in §3. Google may ask for video verification showing signage/stock. |
| **Service-area** (address hidden) | No: nothing published says Cha Jewels travels to customers; the service area rule (~2 h drive) does not fit a nationwide online shop. | Not applicable. |
| **Online-only** | If customers never visit: **no eligible Business Profile**. | Local visibility then comes from the website's own entity signals (Phase 4: complete `JewelryStore`/`Organization` JSON-LD with address, phones, `sameAs`), Merchant Center business information (Phase 5), and consistent citations (Phase 11). The master plan's local targets ("jewelry store Tokyo", "gold shop Katsushika", "jewelry store near me") depend on a Maps listing and would mostly be **out of reach**; "Kihei Tokyo" / "K18 jewelry Tokyo" remain organic-search targets. |

**Decision required (OD-GBP-1):** "Can a customer visit Time Mansion 301 during stated hours, by appointment, and be received by staff?" Yes → storefront profile (if not already existing). No → do not create a profile; a profile that misrepresents a non-visitable office risks suspension under the guideline above.

**Answer (owner, 2026-10-31): No.** Customers are not received at this office address, and no Business Profile exists. Result: the online-only row above applies. Cha Jewels is **not eligible**; **do not create a profile**. §5 does not apply. Revisit only if customers start being received in person.

Follow-up for review (no change made here): the site's `JewelryStore` JSON-LD describes a physical store type. Check in the next structured-data batch whether it should stay, or whether `OnlineStore`/`Organization` fits the online-only model better. `JewelryStore` JSON-LD is a protected asset (CLAUDE.md SEO governance §4), so any change needs its own audit.

If a profile **already exists** (X8), the owner's first job is to read what it says (address shown? category? hours? who manages it?) and bring it to §3 — or hide/remove it if the business is not eligible.

## 5. What the Business Profile should contain (if OD-GBP-1 = yes, or a profile already exists)

| Field | Value / rule | Source for the value |
|---|---|---|
| Business name | `Cha Jewels` (Google: the real-world name, no keywords, no "Tokyo", no "K18") | brand name; legal name goes in Merchant Center, not here |
| Primary category | Jewelry store (**verify label in the picker**) | plan §17 |
| Additional categories | e.g. Jewelry buyer (only if the business buys from the public under its permit — **owner confirms**; do not add otherwise), Jewelry appraiser (only if offered: `/account/service-requests` lists `appraisal` as a kind — **owner confirms it is a public service**) | `api.md` service-requests kinds |
| Address / pin | §3 | `legal.ts` |
| Hours | the hours visitors are received (OD-GBP-1 answer). Mark Japanese public holidays as special hours (closed). | tokusho (support hours) is the floor, not the proof |
| Phone | `+81 3-6657-6129` primary; mobile as additional | `COMPANY_PHONE` |
| Website | `https://www.chajewelsjp.com/` (or `/ja` — owner choice; UTM allowed, e.g. `?utm_source=google&utm_medium=organic&utm_campaign=gbp`, which the site tolerates: canonical strips queries) | |
| Description (≤750 chars) | Written from published copy only: K18 gold jewelry, pearls, diamonds, preloved branded pieces; "every preloved piece is authenticated and its hallmark checked in Japan"; secondhand dealer permit number; ships from Tokyo worldwide; English and Japanese service. **No** country-branded gold wording, **no** made-in claims (X9). | `/shopping-guide`, `/about`, `/faq` |
| Opening date | 2024 incorporation (or 2021 start — owner picks the real-world date Google asks for) | `/about` timeline |
| Products | Only if GBP Products is used: mirror a few live pieces with the Hub's price; otherwise leave empty rather than stale. Merchant Center (Phase 5) is the right product channel. | |
| Services | Resize, cleaning, repair, appraisal, certificate — **only those actually offered to the public** (`/account/service-requests` is for existing customers) — owner confirms | `api.md` |
| Photos | Real office/showroom/display photos (the About page already has founder/showroom/display imagery); product photos from the Hub media; no stock photos | `lib/content/about.ts` photos |
| Attributes | Payment types as published (bank transfer; card/Paidy/COD only while the tokusho names them) | tokusho `paymentMethodsText` |
| Posts | Optional; link to blog posts | |
| Reviews | Authentic only; never incentivised in a way Google prohibits; the site's own review system (`/review/[token]`) is separate | plan §17 |
| Messaging | Messenger is the published channel; GBP chat only if staffed | |

## 6. NAP consistency checklist (external surfaces)

For each surface: record the exact Name, Address, Phone, Website, hours shown; mark MATCH / DIFFERS / ABSENT against §3; fix at the source (the Hub or the external account), never by editing the site to match a wrong external value.

| Surface | Owner check |
|---|---|
| Google Business Profile (if any) | |
| Google Merchant Center business information | |
| Facebook page "About" (name, address, phone, website, hours) | |
| Messenger handle page | |
| Instagram / TikTok / LINE / WhatsApp profiles (as the Hub `social.follow` lists) | |
| Tokyo Chamber of Commerce and Industry member listing (if public) | |
| Tokyo Katsushika Central Rotary Club listing (if public) | |
| Payment providers' merchant pages (Square, Paidy): legal name and URL | |
| 国税庁 invoice registration lookup (T7011801044120): name must match the registered name | |
| Old domain `chajewelsjapan.com` (D2: kept as the live Page365 shop, no redirect, owner 2026-10-31): business listings should point to `www.chajewelsjp.com` | |
| Apple Maps / Yahoo! Japan / Bing Places entries (search the phone number) | |
| Website: `/contact`, `/legal/tokusho`, receipts header, JSON-LD | MATCH by construction, except G1/G2 |

## 7. Owner action list (no code; nothing here is done by Claude)

1. Answer X8 for GBP: does a profile exist? Who manages it? Screenshot its Info tab.
2. Decide OD-GBP-1 (visitable during stated hours: yes/no). Record the answer in `SEO-IMPLEMENTATION-STATUS.md` (orchestrator).
3. Confirm G2 (Hub `contact.email` = `sales@chajewelsjp.com`) and G4 (registered-name form).
4. If eligible and no profile: create it with §3/§5 values; complete verification; then run §6.
5. If a profile exists but the business is not eligible as a storefront: follow Google's process to correct it (hide address is not available for a non-travelling business; removal may be required). Do not leave a misleading listing.
6. Run the §6 checklist once; then quarterly.
7. Hand the Phase 4 team G1 (JSON-LD fields that may be added from visible data; no opening hours unless OD-GBP-1 = yes).
8. Report any local result only as **OBSERVED** with a screenshot; nothing is claimed from this document.

## 8. Documentation used

- Google Business Profile Help — Guidelines for representing your business on Google: https://support.google.com/business/answer/3038177 (fetched 2026-10-29)
- `lib/content/legal.ts` (COMPANY_*, REPRESENTATIVE_NAME, SECONDHAND_PERMIT_NO, INVOICE_REG_NO, tokusho rows), `lib/content/shopping-guide.ts`, `lib/content/about.ts`, `lib/content/faq.ts`, `lib/json-ld.ts`, `lib/settings.ts`, `app/contact/page.tsx`, `app/faq/page.tsx`, `app/why-cha-jewels/page.tsx`, `app/affiliations/page.tsx`, `app/wholesale/page.tsx`, `components/account/print-header.tsx`, `docs/seo/SEO-BASELINE.md` §8, `docs/seo/SEO-IMPLEMENTATION-STATUS.md` (X8, D2, OD-3)

**UNVERIFIED:** GBP existence and state; whether the office receives visitors; Hub `contact.email` value; Hub `social.follow` values; exact GBP category labels; registered-name form on the certificate.

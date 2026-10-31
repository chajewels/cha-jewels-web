# Phase 11 — Backlinks and authority: documented opportunities

**Status:** AUDITED (documentation only). No outreach was sent, no listing was created, no partner was contacted. Nothing in this file is a commitment by or to any third party.
**Date:** 2026-10-29 · **Plan:** `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` PHASE 11, §29 "Authority" · **Related:** D2 (old domain: owner decided KEEP, no redirect, 2026-10-31), Phase 10 §2 (published memberships)

---

## 1. Rules (non-negotiable)

1. **No purchased links.** No paid placements presented as editorial, no link networks, no "guest post packages", no directory-for-a-fee schemes whose only value is the link. Sponsorships that are real (a community event the company actually sponsors) are fine when the link is marked `rel="sponsored"` by the publisher, as Google requires.
2. **No automated outreach.** No scraped email lists, no bulk templates, no tooling that sends on the owner's behalf. Every contact is a person the owner (or a named staff member) writes to, about something real.
3. **No fabricated relationships.** This document lists *categories* and *candidates to evaluate*; it names no partner as agreed, interested or contacted.
4. **Wording:** anything Cha Jewels publishes elsewhere follows X9: "K18 gold", "K18 jewelry in Japan", "authenticated in Japan"; no country-branded gold, no made-in claims.
5. **Truth in bios:** permit number, invoice registration, memberships and founding dates exactly as published on `/about`, `/affiliations`, `/legal/tokusho`.
6. **Measurement before claims:** "referring domains" and "industry mentions" (plan §29) are reported only from a Search Console Links export or a named backlink tool's export; no number is written down without one.

## 2. What already exists and should be secured first (zero-outreach wins)

| Asset | State | Action (owner) |
|---|---|---|
| Old domain `chajewelsjapan.com` | D2 decided 2026-10-31: the owner keeps it as the live Page365 shop; **no redirect** (the Hub's Page365 inventory fetch and invoice import depend on it). | Optional: a link to `https://www.chajewelsjp.com/` in the Page365 shop's own about text (owner, in Page365). |
| `agreement.chajewelsjp.com` (layaway and card agreements) | Own subdomain. | Ensure it links back to `www.chajewelsjp.com` in its footer (if it has one) and is not indexable for customer-specific pages. Verify; UNVERIFIED here. |
| Facebook page / Messenger `m.me/chajewelsjapan` | Published channel. | Website field = `https://www.chajewelsjp.com/`; About text uses the §3 NAP set from Phase 10. |
| Tokyo Chamber of Commerce and Industry membership (joined 2026.03, published on `/about`) | Real membership. | Check whether members get a public directory entry with a website field; if so, complete it. |
| Tokyo Katsushika Central Rotary Club membership (2026.09, published) | Real membership. | Same check; club websites often list member businesses. |
| Payment providers' merchant directories (Paidy, Square) | Some providers list merchants publicly. | Check whether a public merchant page exists; if so, confirm the URL. |
| Supplier / brand relationships | Hub data; not public here. | Only where a supplier publicly lists stockists. |

## 3. Opportunity categories (plan PHASE 11) with evaluation

| Category (plan) | What it looks like for Cha Jewels | Candidate examples found (one web search, 2026-10-29; **not contacted, fit not verified**) | Realistic approach |
|---|---|---|---|
| Jewelry industry websites | Trade associations, hallmark/assay education sites, jewelry-business blogs in Japan | none searched | Contribute a factual explainer on K18 hallmarks used in Japan or on the secondhand-dealer permit system, authored by the founder; accept only editorial links. |
| Japan–Philippines publications | Filipino-community media in Japan and PH outlets covering the diaspora | Filipino-Japanese Journal (filipinojapanesejournal.com); Jeepney Press (community magazine); Manila Shimbun English/"Jaglish" section (manila-shimbun.com); Manila Bulletin diaspora coverage | A founder story (live selling → incorporated company in Tokyo, 2024) is a genuine human-interest piece; pitch a story, not a link. Expect `nofollow`/`ugc` on some; still valuable for brand searches. |
| Tokyo business organizations | Chamber of Commerce (member), Rotary (member), Katsushika ward business associations, 商店街 associations | TCCI and Rotary are already memberships (published) | Directory listings; event write-ups; member spotlights. |
| Jewelry exhibitions | IJT (International Jewellery Tokyo) and similar trade fairs, if the company exhibits or attends | none searched | Exhibitor listings link to the exhibitor site; only if the company actually exhibits. |
| Suppliers / partners | Brands or wholesalers that list stockists; the wholesale customers (live sellers, boutiques) the `/wholesale` page serves | Hub data; not public | Ask wholesale customers who have websites to credit the supplier where they already do so for others; never require it as a condition of trade. |
| Interviews | Podcasts/YouTube/blogs for Filipinos in Japan; small-business media in Japan | not searched | Founder interviews about running a Filipino-founded company in Tokyo, authentication practice, the layaway model for overseas customers (English-site content only). |
| Community organizations | Philippine Embassy Tokyo community pages, Filipino community umbrella groups (search surfaced the Philippine Assistance Group and GFGC names), church/community festivals (Philippine Festival in Tokyo) | tokyo.philembassy.net news pages; PAG; GFGC | Real sponsorship or participation first; a link only if the organisation lists sponsors/participants anyway. |
| Trade publications | Japanese jewelry trade press; Filipino business press | not searched | Only with a real announcement (new service, milestone). |

Search results used for the examples above (titles as returned; relevance and current status unverified): filipinojapanesejournal.com (two 2024–2025 articles about its print return), issuu.com/sunny12sunny12 (Jeepney Press issues), manila-shimbun.com English category, tokyo.philembassy.net Independence Day community posts, mb.com.ph diaspora articles, en.wikipedia.org "Filipinos in Japan".

## 4. Evaluation criteria (score before any contact)

| Criterion | Question | Pass |
|---|---|---|
| Relevance | Would a reader of that site plausibly buy K18 jewelry in Japan or care about the company? | Yes required |
| Realness | Does the site have real readers (recent posts, named authors, actual community)? | Yes required |
| Editorial control | Is the link placed by their editor in their words? | Yes required; "we insert your paragraph" = reject |
| Payment | Is money changing hands for the link? | No required (sponsorship of a real thing is fine, marked `sponsored`) |
| Fit with rules | Can the bio/article follow X9 wording and the money rule (no invented layaway figures, no "guaranteed" claims)? | Yes required |
| Reciprocity pressure | Are they asking for a link back as a condition? | Reject link exchanges |
| Audience language | EN / JA / Taglish — does the destination page exist in that language (`/en/…`, `/ja/…`)? Taglish content → English-site posts (Phase 9). | Choose the matching locale URL |
| Destination | Which page earns it: home, `/en/about`, a guide, a Phase 9 post, `/en/wholesale`? | Pick one; never a `?lang=` or bare legacy URL |

## 5. Tracking (no numbers written without an export)

- Search Console → Links → "Top linking sites" export, monthly, filed with the Phase 12 monthly review.
- Optional third-party backlink tool export if the owner subscribes to one (**none is known to this repository**).
- Branded-search growth: Search Console query regex `(?i)cha ?jewels|チャジュエルズ` (Phase 12).
- Each earned mention: date, site, URL, link type (follow/nofollow/sponsored/ugc), destination, how it happened. Keep that log in `docs/seo/SEO-QA-REPORT.md` or a Phase 11 log file only when something real exists.

## 6. Owner decisions

| ID | Decision |
|---|---|
| OD-AUTH-1 | Who speaks for the company in interviews and community pitches (founder; staff). |
| OD-AUTH-2 | Whether the company wants Filipino-community-press coverage (it names the founder and the business publicly). |
| OD-AUTH-3 | Budget for real sponsorships (events), if any — with the `sponsored` rule above. |
| OD-AUTH-4 | WITHDRAWN 2026-10-31: owner decided to keep `chajewelsjapan.com` as the live Page365 shop (no redirect). |

## 7. Documentation used

- `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` PHASE 11, §29
- `docs/seo/SEO-IMPLEMENTATION-STATUS.md` (D2)
- `lib/content/about.ts` (memberships, timeline), `lib/content/legal.ts` (permit, invoice registration), `lib/i18n.ts` (wholesale lede)
- One WebSearch (2026-10-29) for Filipino-community publications and organisations in Japan; results listed in §3 as unverified candidates.

**UNVERIFIED:** every candidate's current status, editorial policy and fit; whether TCCI/Rotary publish member directories; `agreement.chajewelsjp.com` footer/indexing; any existing backlink profile (no export exists).

## 8. Execution materials (added 2026-11-01; nothing sent, nobody contacted)

Drafts the owner can use verbatim or edit. Every claim below is already published on the site (`/en/about`, `/en/affiliations`, `/en/legal/tokusho`, `/en/shopping-guide`); nothing new is asserted. Wording follows X9.

### 8.1 Short company boilerplate (EN) — for directories, member listings, interview bios
> Cha Jewels Co., Ltd. is a Tokyo-based jewelry company founded by Cynthia Nera Largo. It began in 2021 as live selling for the Filipino community in Japan and was incorporated in 2024 in Tateishi, Katsushika-ku. Cha Jewels sells K18 gold, platinum, Akoya pearl and diamond jewelry and authenticated preloved branded pieces, in English and Japanese, and ships from Tokyo worldwide. It holds a secondhand dealer permit from the Tokyo Metropolitan Public Safety Commission (No. 307762418064) and is a member of the Tokyo Chamber of Commerce and Industry. Website: https://www.chajewelsjp.com/

### 8.2 Short company boilerplate (JA)
> Ｃｈａ　Ｊｅｗｅｌｓ株式会社は東京都葛飾区立石を拠点とするジュエリー会社です。2021年に在日フィリピン人コミュニティ向けのライブ販売として始まり、2024年に法人化しました。K18ゴールド、プラチナ、あこや真珠、ダイヤモンドのジュエリーと、日本で真贋鑑定済みの中古ブランド品を日本語と英語で販売し、東京から世界中へ発送しています。古物商許可（東京都公安委員会 第307762418064号）。東京商工会議所会員。ウェブサイト: https://www.chajewelsjp.com/

### 8.3 Pitch draft — Filipino-community publication (founder story; OD-AUTH-1/2 required before sending)
Subject: A Filipino-founded jewelry company in Tokyo — story idea

> Hello [editor name],
> I am Cynthia Largo, founder of Cha Jewels, a jewelry company in Katsushika, Tokyo. We started in 2021 selling live to kababayan here in Japan and became a Japanese company in 2024. I would be glad to tell your readers how a small Filipino-founded business is run in Tokyo: the secondhand dealer permit, how every preloved piece is authenticated and its hallmark checked in Japan, and how we sell in both languages. Happy to send photographs and to answer questions in English or Tagalog.
> Cha Jewels Co., Ltd. · https://www.chajewelsjp.com/en/about

Rules: no request for a link; an editorial mention or link is theirs to decide; no payment; follow-up once after two weeks, then stop.

### 8.4 Membership-directory check script (TCCI, Rotary) — owner, 10 minutes each
1. Sign in to the member portal; find "member directory" / "会員検索".
2. If the entry is public and has a website field: set `https://www.chajewelsjp.com/`, the §8.2 boilerplate, the §3 NAP strings from the Phase 10 document.
3. Record: date, URL of the entry, whether the link is followed (view source: `rel="nofollow"`?), in the log below.

### 8.5 Tracking log (template; fill only with real events)

| Date | Site / organisation | URL of the mention | Link type (follow / nofollow / sponsored / ugc / none) | Destination page | How it happened | Status |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

Monthly: Search Console → Links → "Top linking sites" export filed with the Phase 12 report; branded-query impressions from `scripts/gsc-report.mjs` (§4.3). No referring-domain number is written anywhere without one of those exports.

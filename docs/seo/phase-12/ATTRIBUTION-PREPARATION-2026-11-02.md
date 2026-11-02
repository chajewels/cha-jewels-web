# Organic attribution — design and contract PREPARATION (DP-09, owner-approved 2026-11-02)

**Scope of the approval:** design and Hub-contract preparation only. **Tracking is NOT enabled**: no cookie is set, no checkout call carries a source, no page is changed. It stays off until (1) the consent decision (OD-ATTR-3) is made on counsel's or the owner's classification, (2) the Hub contract below is implemented by the Hub owner (OD-ATTR-4), and (3) the privacy-policy text below is published. The design and its privacy assessment are in `ORGANIC-ATTRIBUTION-DESIGN.md` (Option A, consent-gated by default; GA4 stays an option, not chosen).

## 1. What is built (inert)
`lib/acquisition.ts`: a pure classifier from landing referrer and query string to one of six words (`organic_search`, `paid`, `social`, `email`, `referral`, `direct`) plus the search engine's hostname for organic search only. `tests/acquisition.test.mjs` (6 tests): paid wins over a search referrer; lookalike hosts are never organic search; the output carries no URL, query or click id; and a source-scan test **fails if any other file uses the classifier or the `cj-src` cookie** — so tracking cannot be switched on by accident.

## 2. Hub contract draft (PROPOSED; for the Hub owner; not yet in `supabase/contracts/api.md`)
- **New nullable fields** on checkout drafts, orders and layaway plans: `acquisition_source` (enum: the six words) and `acquisition_host` (text, only when `acquisition_source = organic_search`, a bare hostname, ≤ 100 chars, validated server-side; anything else stored as null).
- **Request:** the existing quote/draft creation call accepts optional `acquisition: { source, host? }` from the storefront (server key + customer JWT as today). Absent or invalid = null; an invalid value never fails the checkout.
- **Copy on confirmation:** the draft's values are copied to the order/plan when it is confirmed; never overwritten.
- **Report (read-only):** orders by `acquisition_source` × payment state × month, paid orders only, per currency, refunds as the Hub records them, layaway counted as starts — the definitions in `ORGANIC-ATTRIBUTION-DESIGN.md` §2. No customer identifier in the report.
- **Not requested:** any identifier, URL, search query or click id.

## 3. Privacy-policy text DRAFT (for counsel's review before publication; not published)
**English (cookie section):** "Where you came from. If you accept analytics cookies, we store one small first-party cookie (`cj-src`, 30 days) containing only a category such as 'search engine', 'social' or 'direct' and, for search, the search engine's name. It contains no search words, page address or identifier. If you place an order, that category is saved with your order so we can understand which channels bring customers. You can decline, and your order is unaffected."
**日本語:** 「ご来店経路について。分析用Cookieに同意いただいた場合に限り、「検索エンジン」「SNS」「直接」などの区分（検索の場合は検索エンジン名）のみを保存する自社Cookie（cj-src、30日間）を1つ設定します。検索語、ページのアドレス、個人を識別する情報は含まれません。ご注文の際は、この区分を注文情報とともに保存し、どの経路からご来店いただいたかの把握に利用します。同意しない場合でもご注文に影響はありません。」(Japanese wording is a draft for the owner's review; I cannot attest legal accuracy.)

## 4. Enable gate (all must hold before any tracking code is wired)
1. Consent classification decided and recorded (gate on Accept by default).
2. Hub fields live and a mocked-Hub contract test passes in this repository.
3. Privacy policy published in EN and JA.
4. `check:analytics` and `check:money` unchanged; the source-scan test updated in the same change that wires the classifier.
5. The monthly report states the consent gate and its under-count every time.

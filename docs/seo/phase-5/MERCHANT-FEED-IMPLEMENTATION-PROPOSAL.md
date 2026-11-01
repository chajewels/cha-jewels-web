# Phase 5 — Merchant Center feed: implementation proposal and owner package (2026-11-01)

**Status:** builder IMPLEMENTED → READY FOR QA (`lib/merchant-feed.ts`, `tests/merchant-feed.test.mjs`, 12 tests); route **NOT CREATED — PROPOSED ONLY** (§3 is code for approval, not behaviour that exists) (route-change approval OD-MC-7 not given); account side **OWNER DECISION PENDING** (X8, OD-MC-1..11). Nothing was submitted, claimed, fetched or changed in any Google account. **Corrected 2026-11-01 (review of `d0b3b5f`):** identifiers are evidence from an explicit rule (no default), unknown states are exclusions, nothing is skipped silently, reconciliation is exact membership, and the completeness limit of the Website API is stated (OD-MC-12). Readiness background: `MERCHANT-CENTER-READINESS.md`; gaps: `../SEO-REQUIREMENTS-REGISTER.md` §4 (MC-G1 to MC-G13).

## 1. What exists after this batch

| Piece | State | Proof |
|---|---|---|
| `lib/merchant-feed.ts` — `feedItem`, `buildFeed`, `feedPrice`, `googleCategory`, `identifierFields`, `reconcile`, `renderRss`, `IDENTIFIERS_UNDECIDED` | implemented, pure, no route | 12 unit tests: displayed-variant agreement, money rules (no peso/deposit/percentage), EN/JA language rule with exclusion, identifiers as evidence (no rule → every product `identifier_unknown`, feed empty; conflicts excluded), unknown status/condition/slug/duplicate as recorded exclusions, availability (sold → `out_of_stock`, never dropped), images, category/material, exact-membership reconciliation (missing, extra, repeated, blank, no-slug, duplicate rows, authoritative total), XML escaping, a source guard that **no route exists** and no identifier or condition default is shipped |
| Route `app/api/merchant-feed/route.ts` | not created | §3 carries the exact code; the guard test fails the suite if the file appears without this proposal being approved and the test updated |
| Account-side setup | not started | §5 |

## 2. Disposition of the register gaps (MC-G1 … MC-G13)

| Gap | Disposition in this batch | Open part (owner) |
|---|---|---|
| MC-G1 URL naming | One form: route folder `app/api/merchant-feed/route.ts` serves `https://www.chajewelsjp.com/api/merchant-feed?lang=ja` and `?lang=en`. The `.xml` suffix is dropped (a Next route folder cannot carry it cleanly; Merchant Center does not require it). | confirm with OD-MC-7 |
| MC-G2 stale X5 sentence | corrected in `MERCHANT-CENTER-READINESS.md` §3 | — |
| MC-G3 prerequisites | image host identified from live JSON-LD (`pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/…`); its crawl policy [U]; the 12 live collection slugs mapped (jewelry ones) or deliberately unmapped (bags, wallets, other accessories, handmade bracelets → 191 as bracelets); `free_shipping_threshold` not used (account-level shipping instead) | X8; image-host check on the first fetch |
| MC-G4 counts | 453 products live (sitemap, 2026-11-01); sold count [U] without the Hub API | re-read at route time |
| MC-G5 sold rule | `out_of_stock` while D3 stands (builder) | restate if D3/X10 changes |
| MC-G6 `item_type` | [U] here; the builder maps `item_type === "Watch"` and the `preloved-watches` category and the `luxury-watches` collection to 201, so a missing `item_type` still categorises watches | read-only API check with a key |
| MC-G7 identifiers | **the builder has no identifier opinion**: every call supplies an `IdentifierRule` (the owner's OD-MC-11 rule as code); the only built-in rule, `IDENTIFIERS_UNDECIDED`, answers UNKNOWN for every piece, so every piece is excluded (`identifier_unknown`) and the feed is empty until the rule exists. A rule's answer is cross-checked: "no identifier" for a piece the Hub marks branded, an MPN without a brand, or "ids" without an id → `identifier_conflict`, never sent | **OD-MC-11:** the owner's written rule per piece class (unique / hallmarked / branded): which identifiers exist and where they come from; then branded pieces are either sent with real MPN/GTIN fields from the Hub (a Hub contract change) or with `identifier_exists=no` where the rule says none exist |
| MC-G8 variants | closed by design: one item per product = the displayed variant (`product_variants[0]`), the same rule as the corrected Product JSON-LD Offer (`phase-4/STRUCTURED-DATA-REVIEW-2026-11-01.md` §2); test proves price and availability equal the page's | a per-variant feed only with a variant-selectable page |
| MC-G9 freshness | daily fetch 03:00 JST proposed; the route reads the 60 s catalog cache (Hub-busted); worst case = one fetch interval | OD-MC-8: acceptable maximum age |
| MC-G10 full catalog | **PARTIAL by the API's limits:** `reconcile()` demands exact membership (items + recorded exclusions = the catalog slug list; nothing missing, extra, repeated or blank; no row without a slug; at least one item) between two reads of the Website API. Neither read is authoritative: `/catalog/products?limit=5000` and the `?fields=slug` projection are the same table under the same limit, so a truncated read of both would agree. "Complete" therefore means "two reads agree and the list is under the limit" until the Hub exposes a total | **OD-MC-12 (Hub work item, Lovable):** a total count on the catalog read (e.g. `{ total }` or an `X-Total-Count` header) that `reconcile(build, slugs, { authoritativeTotal })` already accepts |
| MC-G11 failures | route answers **503** on any Hub failure or reconciliation problem, never an empty or partial 200; `Cache-Control: no-store` on errors; a complete feed cached 300 s | — |
| MC-G12 robots `/api` | Google's Merchant Center crawl-guidance page could not be read in this session (help id returned 404; recorded [U]). Plan: keep `/api/merchant-feed`, run the first manual fetch, read Diagnostics; if the fetch is refused for robots reasons, the approved fallback is one `Allow: /api/merchant-feed` line in `app/robots.ts` with a test | first fetch |
| MC-G13 shipping/returns | published text re-read 2026-11-01 and quoted in §5 verbatim; outside-Japan rates are not published, so no non-JP target is configured | owner enters exactly §5 |

## 3. The route (exact code for OD-MC-7; not written to `app/`)

```ts
// app/api/merchant-feed/route.ts  (PROPOSED — needs OD-MC-7; see MERCHANT-FEED-IMPLEMENTATION-PROPOSAL.md)
import { hub } from "@/lib/hub-api";
import { siteUrl } from "@/lib/site";
import { isLocale } from "@/lib/locale";
import { buildFeed, reconcile, renderRss, type IdentifierRule } from "@/lib/merchant-feed";

// PROPOSED: the owner's OD-MC-11 identifier rule as code. Until it exists this stays IDENTIFIERS_UNDECIDED and the
// route answers 503 "feed incomplete: the feed has no items" — the truthful state, never an empty 200.
const IDENTIFIER_RULE: IdentifierRule = () => null; // ← replaced by the owner's rule in the approval batch

export const revalidate = 300;

export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get("lang") ?? "ja";
  if (!isLocale(lang)) return new Response("lang must be ja or en", { status: 400, headers: { "cache-control": "no-store" } });
  let products, slugs;
  try {
    [products, slugs] = await Promise.all([hub.allProducts(5000), hub.productSlugs()]);
  } catch {
    return new Response("catalog unavailable", { status: 503, headers: { "cache-control": "no-store" } });
  }
  const build = buildFeed(products, lang, siteUrl(), IDENTIFIER_RULE);
  // authoritativeTotal: null until OD-MC-12 gives the Hub read a total; the header below says which kind of completeness this is
  const problems = reconcile(build, slugs.map((s) => s.slug), { authoritativeTotal: null });
  if (problems.length) return new Response(`feed incomplete: ${problems.join("; ")}`, { status: 503, headers: { "cache-control": "no-store" } });
  const xml = renderRss(build, { title: "Cha Jewels", link: `${siteUrl()}/${lang}`, description: lang === "ja" ? "Cha Jewels の商品フィード" : "Cha Jewels product feed" });
  return new Response(xml, { status: 200, headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=300", "x-feed-items": String(build.items.length), "x-feed-excluded": String(build.excluded.length), "x-feed-completeness": "two-read-agreement (no authoritative total; OD-MC-12)" } });
}
```

Tests to add with the route (mocked Hub, no live call): 503 on a rejected read; 503 on a reconciliation problem; 400 on a bad `lang`; 200 with `application/xml` and the item count header; `no-store` on every error; the raw checker gains a `merchant-feed` row (200, XML balanced, item count = catalog count − recorded exclusions, every `g:link` in the sitemap). Guards: `check:money`, `check:terms` pass (the builder already passes). Remove the "no route exists" assertion in `tests/merchant-feed.test.mjs` in the same commit.

**Risk and rollback:** a new read-only GET under `/api`; no Hub write, no payment path, no page change. Rollback = delete the route file (the builder stays, unused) and remove the data source in Merchant Center.

## 4. Validation plan after the route is live
1. `curl -s https://www.chajewelsjp.com/api/merchant-feed?lang=ja | xmllint --noout -` (well-formed) and the raw checker row.
2. Owner: Merchant Center → Products → Data sources → add a scheduled fetch (daily 03:00 JST), fetch now, read Diagnostics; record item count vs `x-feed-items`.
3. First-week Diagnostics triage per `MERCHANT-CENTER-READINESS.md` §7 into the Phase 12 report.
4. Status words: IMPLEMENTING (route merged) → DEPLOYED (released) → OBSERVED IN MERCHANT CENTER (Diagnostics read).

## 5. Owner package — account-side setup (nothing here is done by Claude)

Order of operations, each with its evidence and rollback:

1. **Account (X8).** Sign in at merchants.google.com with the business Google account. Record: account exists (Y/N) and id; business name shown; verified website; whether "Show products on Google" / free listings is on. Rollback: none (read-only).
2. **Business information.** Enter the one NAP set from `phase-10/LOCAL-SEO-GBP-READINESS.md` §3 (name, address, phone, website `https://www.chajewelsjp.com/`). Rollback: edit back.
3. **Website claim/verification.** Reuse the verified Search Console Domain property (`chajewelsjp.com`). Rollback: unclaim.
4. **Shipping (OD-MC-5, MC-G13) — enter exactly the published rule, nothing more:** Japan: `¥800` when the pieces total is under `¥8,000`; free from `¥8,000` (source: `/en/shopping-guide`, "Japan: free shipping on pieces totalling ¥8,000 or more; otherwise ¥800."). **No other country**: outside-Japan rates are "shown at checkout" and are not published, so no non-JP shipping service is configured and no non-JP target country is enabled. Rollback: delete the service.
5. **Returns (OD-MC-10).** Enter the policy as published at `/en/legal/returns`: no change-of-mind returns or cash refunds; approved voluntary cancellations normally as store credit; an incorrect, damaged or materially misdescribed item reported promptly, preferably within five calendar days of delivery; Cha Jewels covers reasonable return cost when it confirms such a case. Link the policy URL. Do not invent a return window. Rollback: delete the policy.
6. **Tax.** Prices are tax-inclusive (tokusho "Shown on each product page, tax included"); select the tax-included setting Japan uses. Rollback: edit.
7. **Data source (after OD-MC-7 and the route release).** Scheduled fetch, URL `https://www.chajewelsjp.com/api/merchant-feed?lang=ja` (JA-first per OD-MC-1 recommendation), daily 03:00 JST, language Japanese, country Japan, currency JPY. English feed (`?lang=en`) only after OD-MC-2 (target country; English for Japan is [U] until the UI shows the allowed languages). Rollback: delete the data source (items expire; nothing on the site changes).
8. **Verification:** fetch now → Diagnostics; items ≈ `x-feed-items`; no "price mismatch" on single-variant pieces; image crawl OK (MC-G3). Record all of it in the Phase 12 weekly report, status OBSERVED IN MERCHANT CENTER only from the Diagnostics read.
9. **Decision log to fill:** X8, OD-MC-1, OD-MC-2, OD-MC-3, OD-MC-4 (omit brand: recommended), OD-MC-5, OD-MC-6 (no `shipping_weight`), OD-MC-7, OD-MC-8, OD-MC-9, OD-MC-10, OD-MC-11 (identifier rule per piece class — without it the feed has NO items), OD-MC-12 (Hub total count for authoritative completeness).
10. **Exclusions the owner will see in `x-feed-excluded` and must expect:** `identifier_unknown` (every piece until OD-MC-11), `identifier_conflict`, `condition_unknown` (pieces without a Hub condition), `status_unknown`, `not_active`, `no_slug`, `duplicate_slug`, `no_variant`, `no_price`, `no_description` (per language), `no_image`. None of them is a guess; each is a data fact to fix in the Hub or a rule to write.

## 6. Documentation used
- Repository: `lib/merchant-feed.ts`, `lib/availability.ts`, `lib/json-ld.ts` (`displayedVariant`), `lib/catalog-i18n.ts`, `lib/metals.ts`, `lib/content/shopping-guide.ts`, `lib/content/legal.ts`, `app/robots.ts`, `MERCHANT-CENTER-READINESS.md` (its §11 Google sources, read 2026-10-29).
- Google Merchant listing structured data (https://developers.google.com/search/docs/appearance/structured-data/merchant-listing, read 2026-11-01): "Product rich results only support pages that focus on a single product (or multiple variants of the same product)."
- **UNVERIFIED:** Merchant Center's treatment of a robots-disallowed feed path (MC-G12); English-feed acceptance for Japan (OD-MC-2); the image host's crawl policy; the live sold count and `item_type` presence (Hub API not available in this session).

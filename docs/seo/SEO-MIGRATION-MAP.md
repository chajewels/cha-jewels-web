# Cha Jewels SEO Migration Map: Phase 2 (EN/JA locale URLs)

**Status:** AUDITED / PLANNING. Nothing in this document is implemented.
**Date:** 2026-10-28 · **Code audited:** `develop` at `b431fc8` (Phase 1 merged, PR #393)
**Source of truth:** `docs/seo/CHA-JEWELS-SEO-MASTER-PLAN.md` (§3, §4, §26 Phase 2, §22)
**Related:** `SEO-BASELINE.md`, `SEO-IMPLEMENTATION-STATUS.md`, skill `.claude/skills/cha-i18n-seo/SKILL.md`

> **No route, redirect, canonical target, hreflang target, sitemap route, internal-link destination, Hub contract or application file has been changed by this work.** Per the project rule, every route change below needs explicit approval before implementation, and every item marked **OWNER DECISION REQUIRED** (OD-n, §14) needs an answer first. Where this document proposes something, it says "proposed". Nothing here is a decision.

Evidence labels: **CONFIRMED** (read in code or seen in a live response on 2026-10-28), **UNVERIFIED** (not checked from this session).

---

## 1. Scope

In scope: the core EN/JA migration from the same-path cookie/query model to dedicated `/en` and `/ja` URLs. Out of scope: `/fil/`, new content hubs (Phases 8-10), commercial landing pages (Phase 7), the plan's `/shop/*` and `/guides/*` information architecture (§22), Merchant Center, structured-data additions, Hub SEO fields.

Rules carried into every section below: `check:terms` applies to this repo's docs as well (no country-branded gold wording, no generic origin phrasing); private and customer routes never become indexable; layaway stays English-only unless business policy changes.

---

## 2. Current state (evidence)

| # | Fact | Evidence |
|---|---|---|
| E1 | One URL per page. English and Japanese share the path; language comes from the `cj-lang` cookie, then `?lang=`, then `Accept-Language` on a first visit, then default `ja`. | `lib/i18n.ts` (`resolveLang`, `detectLang`), `middleware.ts:76-85`, `lib/i18n-server.ts` |
| E2 | A crawler (no cookie, usually no `Accept-Language`) is always served Japanese. `?lang=en` is its only way to English, and that URL canonicalizes to the bare path. | `lib/page-meta.tsx` `SeoLinks`; baseline §2-3 |
| E3 | The language toggle POSTs `/api/lang` (sets the cookie) then `router.refresh()`. It does not navigate: the same URL re-renders in the other language. | `components/site/lang-switcher.tsx`, `app/api/lang/route.ts` |
| E4 | `<SeoLinks />` in the root layout emits canonical, `og:url` and three alternates from the `x-cj-path` header the middleware sets. It exists because Next strips the query from a `/` URL. | `lib/page-meta.tsx:10-58` |
| E5 | **Every public page is served uncached**: `cache-control: private, no-cache, no-store`, `x-vercel-cache: MISS` on `/`, `/faq`, `/about`, a product, a collection, `/blog`, `/legal/privacy`. The root layout reads cookies and headers, so the `revalidate = 60` exports and `generateStaticParams` do not produce cached HTML. | live probe 2026-10-28; `app/layout.tsx` |
| E6 | Layaway is English-only. `layawayOffered(lang)` is the one gate; `/layaway`, `/account/layaway*`, layaway-only blog posts and some checkout paths return 404 in Japanese. | `lib/layaway-availability.ts`, `app/layaway/page.tsx:74`, `lib/posts.ts` |
| E7 | **Server actions gate layaway on the cookie language** (`layawayOfferedNow()`), not on the page the customer is viewing. | `lib/checkout-actions.ts:122,233,332` |
| E8 | Blog posts are per-language Hub rows (`title_ja/en`, `body_ja/en`). A post with no words in a language is not served in it. The article list route sends no body, so a post's existence in a language cannot be fully known from the list. | `lib/posts.ts:43-66`, `app/blog/[slug]/page.tsx:67-73` |
| E9 | Products, collections and categories carry `name_en/name_ja` (and descriptions). Both language pages exist; a missing Japanese field falls back to the English one (content completeness UNVERIFIED). | `lib/types.ts:62-121` |
| E10 | The sitemap lists one URL per resource, no alternates, no `/layaway`, layaway-only posts excluded, but **not** posts that lack a body in Japanese or English. | `app/sitemap.ts` |
| E11 | Hub-authored text can contain relative internal links: markdown `[text](/path)` (`lib/markdown.ts:71`), the announcement bar `href` (`lib/settings.ts:42,131`). | files cited |
| E12 | Two existing checks gate **statutory-page compliance** behaviour on the literal path `/legal` and `/legal/*`: the consent banner never asks by itself there (one of the ten client components that read `usePathname()`), and the **announcement bar is suppressed** by `bannerAllowed` in the root layout, which reads the `x-cj-path` header and fails safe (no header means no bar) because the Specified Commercial Transactions Act notice must not have a marketing strip over it. | `components/site/consent-banner.tsx:46`, `app/layout.tsx:70-84` (`bannerAllowed`). **Phase 2A correction:** the advertising-tag path check (`adsLoadsOn`, `lib/ads.ts`) excludes only `/account/*` and has **no `/legal` rule**; earlier text here said ad tags do not load on `/legal`, which was inaccurate (`tests/consent-ads.test.mjs` already asserts they do) |
| E13 | Existing permanent redirect: `/gold-guide` to `/jewelry-guide#metals` (308, `next.config.ts`). | `next.config.ts:37-39` |
| E14 | Share links add `?lang=en` for English (`lib/share.ts:24-29`), so English `?lang=en` URLs already exist in the wild. | `lib/share.ts` |
| E15 | Next.js 15 docs (Context7, v15.1.8) support: an `app/[lang]` segment with `generateStaticParams`; `alternates.canonical`/`languages` in `generateMetadata`; `alternates.languages` per entry in `sitemap.ts`; redirects in `next.config.ts` (308 when `permanent: true`, run before middleware); middleware locale redirects. The installed version is 15.5.25; behaviour at that exact version is UNVERIFIED and must be re-checked at implementation. | Context7 |

### 2.1 Verified findings the design must honour

| ID | Finding | Requirement for Phase 2 |
|---|---|---|
| **F1** | **Locale/cookie mismatch affects layaway** (E6, E7). Layaway server actions decide from the cookie language, not from the page. | A request on `/en/…` must never be denied layaway merely because a stale `ja` cookie remains (for example a second tab that switched to Japanese). The URL language is authoritative; the fix mechanism is OD-15. |
| **F2** | **Blog posts may exist in only one language** (E8). The sitemap does not check this today (E10). | Locale sitemap, canonical and hreflang logic must not invent a sibling page that does not exist: no `ja` alternate for an EN-only post and no `en` alternate for a JA-only post; layaway-only posts are English-only. Per-language existence needs a title and a body, and the Hub list route returns no body. |
| **F3** | **Consent-banner and announcement-bar checks depend on `/legal/*`** (E12): the consent-banner path check and **`bannerAllowed` announcement-bar suppression**. The advertising-tag check keys on `/account/*`, not `/legal` (Phase 2A correction). | Locale prefixes must not break statutory-page compliance behaviour. **Localized statutory pages must retain the existing suppression behaviour exactly**: on `/en/legal/*` and `/ja/legal/*` the cookie banner stays quiet **and no announcement bar renders**, as on `/legal/*` today, and the advertising tags behave exactly as on the unprefixed twin (unchanged; no new suppression is introduced). The two statutory checks share one rule (`lib/statutory-path.ts`), the advertising parity is tested, and all of it was done in Phase 2A, before any prefixed page exists, and the `bannerAllowed` fail-safe (no path header means no bar) is preserved. |
| **F4** | **Hub-managed content can contain relative links** (E11): blog markdown, the announcement bar `href`, and similar Hub text. | These need migration handling (OD-11) so they do not keep pointing at bare URLs. The Hub keeps storing bare paths; no Hub contract change is assumed. |
| **F5** | **Public responses are currently no-store** (E5). | Recorded as a separate technical observation **only**. Phase 2 does not change caching, rendering mode or performance, and does not expand into that work. Any future static/ISR work needs its own proposal and approval. |

---

## 3. Target model and mechanism

**Target (plan §3-4):** `https://www.chajewelsjp.com/en/…` and `/ja/…`, each page a unique crawlable URL with a self canonical, reciprocal hreflang (`en`, `ja`) and an x-default strategy. `/layaway` becomes `/en/layaway` only. No `/fil/`.

**Canonical form (resolved as a technical convention, formerly OD-13).** The application uses Next's default `trailingSlash: false`, and Phase 2 does not change that setting. The canonical locale homes are therefore **`/en`** and **`/ja`** (no trailing slash). A slash variant such as `/en/` is normalized by Next's own behaviour (a 308 to the slash-less form). The master plan's `/en/` and `/ja/` notation describes the locale architecture; it does not require forcing trailing slashes. The same convention applies to every locale URL (`/en/products/foo`, not `/en/products/foo/`).

**Path structure (resolved, formerly OD-14).** Phase 2 migrates the **existing** public route families under locale prefixes and renames nothing:

```text
/products/foo     →  /en/products/foo     /ja/products/foo
/collections/foo  →  /en/collections/foo  /ja/collections/foo
/blog/foo         →  /en/blog/foo         /ja/blog/foo
```

The `/shop/*` and expanded `/guides/*` tree in master-plan §22 is the future target information architecture for the later commercial and content phases (7-9). It is **not** used in Phase 2 to rename or restructure existing route families. Phase 2 introduces no `/en/shop/*`, `/ja/shop/*` or new guide clusters; a later approved phase would create those, with its own route-change approval.

### Mechanism options (OWNER APPROVED 2026-10-28: OD-10 = A)

| | **A. `app/[lang]/…` segment** | **B. Middleware rewrite** (`/en/x` served by the existing `/x` page, language from a header) |
|---|---|---|
| File churn | Move about 38 page files under `app/[lang]/`; private routes stay at the root | None for pages; middleware and link helpers only |
| Idiomatic to Next docs | Yes (E15) | No |
| Canonical/hreflang | Per-page `generateMetadata` with `alternates` works natively (`/en` is not `/`, so the original reason for `SeoLinks` disappears) | Page must still compute its public path |
| **X1 (404 canonical) fix** | **Yes**: unknown pages have no `generateMetadata`, so emit nothing; layout no longer injects tags | No: unknown routes still render the root layout |
| `usePathname()` | Returns the real prefixed path | Likely the browser path (UNVERIFIED), so prefixed too |
| Rollback | Revert a large mechanical move | Remove one middleware block (smaller) |
| Static rendering later | Possible (layout can read `params` instead of cookies) | Not without more work |

**OWNER APPROVED (2026-10-28), OD-10 = A:** use real Next.js App Router locale routes (`app/[lang]/…`). Option B (middleware rewrite) is not used. This records the mechanism only; it does **not** authorize creating any route. Route creation still needs the written route-change approval and the rest of the 2B entry criteria (§15). Either way the root `app/layout.tsx` keeps the site chrome and takes the language from one place (the URL segment on locale routes, the cookie on private routes).

---

## 4. Route-family migration map (public / indexable)

"Both languages exist" is about whether a commercial page exists in each language, not whether every string is translated. Content completeness is OD-9. "Dynamic" is the current rendering (E5); proposed rendering is unchanged in the first sub-phases.

| ID | Family | Current route | Current language behaviour | Both languages exist? | Proposed EN route | Proposed JA route | Sitemap now → proposed |
|---|---|---|---|---|---|---|---|
| R1 | Home | `/` | cookie/param/AL; layaway band EN only | Yes | `/en` | `/ja` | 1 URL → 2 URLs with alternates. What `/` itself becomes: **OD-3** |
| R2 | Product | `/products/[slug]` | same URL, bilingual fields; layaway UI EN only | Yes (JA may fall back to English text: OD-9) | `/en/products/[slug]` | `/ja/products/[slug]` | 449 → 898 (sold products stay per D3) |
| R3 | Category | `/categories/[slug]` | same URL; names bilingual | Yes | `/en/categories/[slug]` | `/ja/categories/[slug]` | 5 → 10 |
| R4 | Collections index | `/collections` | same URL | Yes | `/en/collections` | `/ja/collections` | 0 listed today (UNVERIFIED: `/collections` is not in `sitemap.ts`) → proposed to list |
| R5 | Collection | `/collections/[slug]` | same URL | Yes | `/en/collections/[slug]` | `/ja/collections/[slug]` | 12 → 24 |
| R6 | Blog index | `/blog` (+ `?type=news`) | same URL | Yes | `/en/blog` | `/ja/blog` | 1 → 2. `?type=news` stays a query variant, canonical strips it |
| R7 | Blog post | `/blog/[slug]` | same URL; **per-slug, per-language** existence (E8) | **Per post**: EN-only, JA-only or both; layaway-only posts EN only | `/en/blog/[slug]` | `/ja/blog/[slug]` | one URL per post → one per language the post actually has |
| R8 | Jewelry guide | `/jewelry-guide` | same URL | Yes | `/en/jewelry-guide` | `/ja/jewelry-guide` | 1 → 2 |
| R9 | Shopping guide | `/shopping-guide` | same URL; layaway parts EN only | Yes (content differs) | `/en/shopping-guide` | `/ja/shopping-guide` | 1 → 2 |
| R10 | FAQ | `/faq` | same URL; layaway items dropped in JA | Yes (content differs) | `/en/faq` | `/ja/faq` | 1 → 2 |
| R11 | About | `/about` | same URL | Yes | `/en/about` | `/ja/about` | 1 → 2 |
| R12 | Why Cha Jewels | `/why-cha-jewels` | same URL; layaway section EN only | Yes | `/en/why-cha-jewels` | `/ja/why-cha-jewels` | 1 → 2 |
| R13 | Contact | `/contact` | same URL | Yes | `/en/contact` | `/ja/contact` | 1 → 2 |
| R14 | Affiliations | `/affiliations` | same URL | Yes | `/en/affiliations` | `/ja/affiliations` | 1 → 2 |
| R15 | Loyalty | `/loyalty` | same URL | Yes | `/en/loyalty` | `/ja/loyalty` | 1 → 2 |
| R16 | Sale | `/sale` | same URL; 200 even when empty | Yes | `/en/sale` | `/ja/sale` | 1 → 2 |
| R17 | Wholesale | `/wholesale` | same URL | Yes | `/en/wholesale` | `/ja/wholesale` | 1 → 2 |
| R18 | Legal (4) | `/legal/{privacy,terms,returns,tokusho}` | same URL; JA drops layaway articles | Yes (content differs; the Japanese notice is statutory) | `/en/legal/…` | `/ja/legal/…` | 4 → 8 |
| R19 | **Layaway** | `/layaway` | 404 in JA (and for a crawler); 200 only for English | **EN only** | `/en/layaway` | **none, by policy** | 0 → 1 (EN only) |
| R20 | Existing redirect | `/gold-guide` to `/jewelry-guide#metals` (308) | n/a | n/a | proposed: retarget in one hop (see §7) | | n/a |
| R21 | Non-localized files | `/sitemap.xml`, `/robots.txt`, `/opengraph-image.png`, `/icon.png`, `/apple-icon.png` | none | n/a | unchanged | unchanged | unchanged |

### 4.1 Per-family detail

Canonical, hreflang and x-default follow the rules in §8 for every localized family; only the exceptions are listed.

| ID | Canonical / hreflang exception | Switcher behaviour | Static vs dynamic | Main files affected | Risk | Rollback |
|---|---|---|---|---|---|---|
| R1 | x-default target is **OD-2/OD-3** | Home of the other language | Dynamic | `app/page.tsx`, `components/home/*`, `lib/page-meta.tsx` | **High** (highest-traffic page; `/` handling) | Revert the sub-phase PR; `/` unchanged until the redirect sub-phase |
| R2 | none | Sibling product URL (always exists) | Dynamic | `app/products/[slug]/page.tsx`, `components/catalog/*`, `components/commerce/*`, `components/site/json-ld.tsx` | **High** (449 URLs, revenue pages, JSON-LD `url`) | Same |
| R3, R5 | none | Sibling URL | Dynamic | `app/categories/[slug]`, `app/collections/[slug]`, `components/catalog/category-stage.tsx` | Medium | Same |
| R4 | none | Sibling | Dynamic | `app/collections/page.tsx` | Low | Same |
| R6 | `?type=news` not canonical | Sibling | Dynamic | `app/blog/page.tsx`, `lib/posts.ts` | Low-Medium | Same |
| R7 | **hreflang only for languages the post has.** EN-only post: self canonical, `en` + x-default (OD-2), no `ja`. Never an alternate to a URL that 404s | Sibling if it exists; otherwise OD-7 | Dynamic | `app/blog/[slug]/page.tsx`, `lib/posts.ts`, `app/sitemap.ts` | **High** (404 risk, E8) | Same |
| R8-R18 | none | Sibling | Dynamic | each `app/<route>/page.tsx`, `lib/content/*` | Low-Medium | Same |
| R18 (tokusho) | none | Sibling | Dynamic | `app/legal/tokusho/page.tsx`, `components/site/legal-frame.tsx`, `lib/content/legal.ts` | Medium (statutory page; keeps the consent-banner quiet rule, E12) | Same |
| R19 | Self canonical, `en` only, **no `ja` alternate, no `/ja/layaway`**; x-default OD-2 | No sibling (OD-7) | Dynamic | `app/layaway/page.tsx`, `components/commerce/layaway-band.tsx`, `app/sitemap.ts` | Medium | Remove the route; bare `/layaway` unchanged until its redirect sub-phase |

---

## 5. Private and utility routes (not part of the locale migration)

Proposed: these stay at their current unprefixed paths. They are noindex or gated (Phase 1), they carry customer sessions, tokens or payment returns, and prefixing them adds risk without SEO value. Their language comes from the cookie, kept in sync with the last locale URL visited (§11).

| Route | Why it stays unprefixed |
|---|---|
| `/account/*`, `/checkout/*` | Customer data; gated; payment return URLs (Paidy, card) and the pay-card CSP policy are path-specific (`lib/csp.ts`) |
| `/cart`, `/cart/restore` | Session cart; emailed restore link |
| `/login`, `/auth/callback`, `/auth/confirm`, `/already-registered`, `/loyalty/join` | Sign-in, one-use codes; **Supabase redirect allow-list rules in CLAUDE.md**: prefixing would change allowed redirect URLs |
| `/search` | noindex utility; result links become locale-aware |
| `/review/[token]`, `/newsletter/unsubscribe`, `/cart-reminders/unsubscribe` | One-use email links already in inboxes |
| `/receipts/verify` | Reached from QR codes on issued receipts; must keep working |
| `/api/*` | Not pages |

Needed for application behaviour even though unprefixed: links they generate to public pages must become locale-aware (§9); `?next=` values may carry a prefixed path, so `safeNext` (`lib/profile.ts:35`) must accept it (UNVERIFIED: not read in full).

---

## 6. Layaway rule (documented, not implemented)

- Target English route: **`/en/layaway`** (HTTP 200, self canonical, `en` only, unique title/description/H1, calculator, terms, FAQ; plan §12).
- **No `/ja/layaway`** unless business policy changes. No fake Japanese landing page for SEO.
- The bare `/layaway` is a known legacy and indexability problem until the Phase 3 implementation. It stays exactly as is in Phase 2 sub-phases that precede Phase 3. Its eventual legacy behaviour is **OD-6**.
- Hreflang: `/en/layaway` has no `ja` sibling. x-default is **OD-2**.
- Everything in `layawayOffered(lang)` keeps working: the language it receives will come from the URL segment, with the cookie as fallback on private routes (§11, risk K3).
- The sitemap lists `/en/layaway` only after it returns 200 for a crawler (Phase 3), never before.
- **Temporary layaway link exception (owner direction 2026-10-28, "Option ii").** Phase 2C **preserves the existing working English layaway links to the legacy `/layaway` route**. **No internal navigation link or customer-facing link points to `/en/layaway` until Phase 3 has created and validated that route** (200 for a crawler, self canonical, tested). The exception covers only the links inventoried in §9 F and ends when Phase 3 repoints them, under its own route-change approval.
- **The exception does not permit any Japanese layaway offering.** The exception links render only when `layawayOffered(lang)` is true, as today. `layawayOffered`, `LAYAWAY_LANGS` and the Hub's layaway/money behaviour are not changed. No layaway link, tab or page appears on any `/ja/*` page, and `/ja/layaway` is not created.
- **Phase 3 dependency.** Phase 3 follows 2B and 2C. Creating `/en/layaway` and switching the exception links to it are Phase 3 deliverables; they are not part of Phase 2C.

---

## 7. Legacy redirect design (design only)

Principles: one hop; deterministic for crawlers; no redirect to a URL that itself redirects or 404s; keep query only where it matters.

| Legacy request | Proposed behaviour | Status |
|---|---|---|
| `/x?lang=en` (explicit English) | 308 to `/en/x` (drop `lang`, keep other query) | **OD-4** to confirm, including how long to keep it |
| `/x?lang=ja` (explicit Japanese) | 308 to `/ja/x` | OD-4 |
| `/x` bare, no language signal (typical crawler) | Permanent redirect to a fixed locale | **OD-1 OWNER DECISION REQUIRED**: not chosen here |
| `/x` bare, visitor has `cj-lang` cookie or `Accept-Language` | Redirect to the visitor's locale | **OD-1**. If the redirect varies by request signals it must be temporary (307) for those visitors, and the permanent one reserved for no-signal requests; this is a locale-adaptive design Google may handle imperfectly |
| `/layaway` | `/en/layaway` (308) once Phase 3 exists; until then unchanged | **OD-6** |
| `/` | **OD-3**: redirect by signal, stay Japanese, or language selector | OWNER DECISION REQUIRED |
| `/gold-guide` | Retarget the existing 308 straight to the locale URL of the jewelry guide (not a chain through `/jewelry-guide`) | follows OD-1 |
| Missing or unknown slug | 404 on the locale URL (no redirect to home) | proposed |
| Private/utility paths | unchanged | n/a |

Where the three options for bare legacy URLs differ (for OD-1):

- **L1, permanent redirect to `/ja/…` for everyone.** Simple and cache-safe; carries the equity of today's crawl (which is Japanese); an English visitor with a cookie lands on Japanese and must switch.
- **L2, permanent to `/ja/…` for no-signal requests, temporary to the visitor's language otherwise.** Best human experience; two behaviours per URL.
- **L3, temporary (307) to the visitor's language for everyone.** Honest to the visitor; Google may keep indexing the bare URLs because the redirect is not permanent.

Implementation split (proposed): redirects that are static (`?lang=` rewrites, `/gold-guide`) in `next.config.ts` (run before middleware); redirects that depend on cookie or `Accept-Language` in `middleware.ts`.

Rollout order (proposed, matches the skill): locale routes first, links and sitemap next, **legacy redirects last**, after the locale URLs are verified live. Until then legacy URLs keep serving 200. **What canonical they declare during that period is not approved** (see the PROPOSED block below). Whatever is approved, a canonical must never point at a redirecting URL or a 404.

**Interim canonical AND hreflang behaviour of bare legacy URLs: C0 + H0 OWNER APPROVED 2026-10-28 — FOR THE PHASE 2B DARK LAUNCH ONLY. The approval expires at the Phase 2C gate; everything beyond 2B remains unapproved.**

While the locale URLs and the bare legacy URLs both return 200 (Phases 2B-2D, before the redirects of 2E), a bare URL such as `/products/x` still has to declare *some* canonical **and still emits the old hreflang tags**. Today `SeoLinks` gives every bare URL `hreflang="ja"` pointing at itself, `hreflang="en"` pointing at its `?lang=en` form, and `hreflang="x-default"` pointing at itself (`lib/page-meta.tsx:80-82`). **No canonical behaviour, no hreflang behaviour and no x-default destination for legacy bare URLs is approved**, and this document does not choose `/en` or `/ja` for them. The final behaviour depends on the answers to:

- **OD-1** where bare legacy URLs ultimately go;
- **OD-2** the x-default destination;
- **OD-3** what `/` becomes;
- **OD-4** how `?lang=` URLs are treated.

Options for the owner (none selected):

| Option | Canonical a bare legacy URL declares | Note |
|---|---|---|
| **C0** unchanged | Itself, as today | No change to legacy pages in 2B; the locale URL and the bare URL then both claim to be canonical for the same content until 2E, and the search engine chooses |
| **C1** locale of the rendered language (the current proposal) | `/ja/…` for a request that resolves to Japanese (a crawler with no signals), `/en/…` for one that resolves to English; never a locale whose language differs from the rendered content | Follows today's resolution order (cookie, then `Accept-Language`, then Japanese); consistent with OD-1 option L2 but not implied by it |
| **C2** one fixed locale | The locale chosen by OD-1, regardless of what the request rendered | Can declare a canonical in a different language from the rendered text for English-cookie visitors |

Options for the legacy **hreflang** tags (none selected):

| Option | Hreflang a bare legacy URL emits during 2B-2D | Note |
|---|---|---|
| **H0** unchanged | The three tags above, as today | Pairs with C0. The bare URLs then form one language cluster and the new locale URLs a second cluster for the same content |
| **H1** removed | None; self canonical only (or the canonical from C1/C2) | Removes the conflicting cluster; the locale URLs carry the only hreflang. Changes live pages |
| **H2** pointed at the locale cluster | `en` and `ja` name the locale URLs; x-default per OD-2 | Needs the locale pages to exist, return 200 and name the legacy URL nowhere; changes live pages |

**Risks the decision must weigh:**

- **Conflicting language clusters.** With H0, the bare URL says `ja` = itself and `en` = its `?lang=en` form, while `/ja/x` and `/en/x` say they are the `ja` and `en` pages. Return tags do not match across the two clusters, so a search engine may ignore the hreflang of both.
- **Canonical / hreflang disagreement.** A page whose canonical points at another URL (C1, C2) must not also claim to be the `ja` or `en` alternate of itself, because hreflang is read from canonical pages. Any approved combination has to be internally consistent: C0 pairs only with H0 or H1; C1 and C2 pair only with H1 or H2.
- **`?lang=en` is already a non-canonical hreflang target** (finding X2): today's `en` alternate names a URL whose canonical is the bare path. H0 carries that defect forward through 2D.
- **x-default.** Today's x-default is the bare Japanese URL. **OD-2 is OWNER APPROVED for the locale pages** (x-default = the corresponding English URL; a single-language page names its own eligible URL). It does not cover the legacy bare URLs: their x-default stays as it is (H0) unless H1 or H2 is approved, and the locale pages must not name a bare legacy URL as x-default.
- **No claim of consolidation.** Neither option moves ranking signals until the 2E redirects exist and are recrawled.

Until one canonical option **and** one hreflang option are approved in writing, **Phase 2B must not change any legacy page's canonical or hreflang** (that is C0 + H0). Changing either is a change to live pages and needs the route-change approval described in §15. OD-1 and OD-4 remain unresolved. OD-2 (x-default for the locale pages: English) and OD-3 (the root `/` stays unchanged through 2B-2D) are now OWNER APPROVED, and they do not decide the legacy options.

**Transition risk assessment: C0 + H0 (reviewed 2026-10-28; since OWNER APPROVED for the Phase 2B dark launch only — the risks below are the record, and the 2C-window risks are why the approval expires at the 2C gate).**

C0 keeps the self canonical on legacy bare URLs; H0 keeps their current hreflang (`ja` = itself, `en` = the `?lang=en` form, x-default = itself).

| Stage | State | Risk | Verdict |
|---|---|---|---|
| **2B dark launch** | Locale routes answer 200 but nothing links to them, they are not in the sitemap, and the legacy pages do not name them | Negligible: no crawl path to the locale URLs | **Safe** |
| **2C links + 2D sitemap live, before 2E** | Internal links and the sitemap point to locale URLs; the bare URLs still answer 200 with a self canonical and the old hreflang | (1) Two indexable URLs for the same content (`/products/x` and `/ja/products/x`; for the home, `/`, `/ja` and `/en`, with `/` and `/ja` identical Japanese content to a crawler); the engine picks one per cluster and may keep the legacy URL for its history and inbound links. (2) Conflicting hreflang clusters: legacy says x-default = itself and `en` = a non-canonical `?lang=en` URL (finding X2), the locale pages say x-default = English and name each other, so return tags do not match across clusters and a search engine may ignore both. (3) Search Console noise ("duplicate without user-selected canonical", hreflang return-tag errors). (4) Link and ranking signals split between bare and locale URLs until the 2E redirects | **Acceptable only for a short, bounded window** |

Conclusion: C0 + H0 safely supports the **dark launch**. It is acceptable but not ideal once links and the sitemap are live. Mitigations, none applied: (a) keep the gap between 2D and 2E short, with the `?lang=` rules and the bare-to-locale 307 stage prepared to ship in the same window; (b) approve C1 + H1/H2 for the legacy pages at the 2C gate instead; (c) settle which of `/`, `/en` and `/ja` the 2D sitemap lists while `/` stays unchanged (recommended: list `/en` and `/ja` and keep `/` until 2E, accepting the temporary duplication). Approved scope — **C0 + H0 is OWNER APPROVED for the Phase 2B dark launch ONLY** (2026-10-28):
- legacy URLs remain completely unchanged in 2B (canonical, hreflang, status, content);
- the new locale URLs stay unlinked and unlisted throughout 2B;
- the policy **must be reconsidered at the 2C gate**, before any internal link or sitemap entry points at a locale URL;
- the conflicting hreflang clusters described above are a real SEO risk once both URL sets are crawlable, and are accepted only inside the dark-launch window;
- no canonical or hreflang change of any kind is approved by this scoping, and no redirect is introduced.

---

## 8. Canonical and hreflang design (design only)

For every localized indexable page:

| Signal | Rule |
|---|---|
| Canonical | Self: the page's own locale URL, absolute, no query, no trailing slash |
| `hreflang="en"` | The `/en/…` sibling, only if it exists, returns 200 and is indexable |
| `hreflang="ja"` | The `/ja/…` sibling, same conditions |
| `hreflang="x-default"` | **OD-2** |
| Reciprocity | If A names B, B names A. Both pages must emit the pair |
| One language only | Self canonical + self hreflang (+ x-default per OD-2); no alternate to a missing page |
| Source | Per-page `generateMetadata({ alternates })` through one helper that is given the sibling-existence answer; the root layout sets no `alternates` (inheritance trap documented in `app/layout.tsx`) |
| `og:url`, `og:locale`, `<html lang>` | Locale URL; `ja_JP` / `en_US`; `ja` / `en` |
| JSON-LD | `url`, `@id`, `inLanguage` use the locale URL (`components/site/json-ld.tsx`) |

**Query-language URLs.** The `?lang=en` pattern is not the long-term target. Proposed: it stays only as a temporary, explicit-choice input that redirects (308) to the locale URL (OD-4); it never appears as a canonical or an hreflang target; `lib/share.ts` stops producing it once locale URLs exist.

**Replaces `SeoLinks`.** With locale paths the "/" query-stripping problem no longer applies to the home page (`/en` is not `/`), so the Next metadata API can carry canonical and alternates. That removes the layout-level injection and resolves **X1** (unknown routes stop emitting canonical/hreflang) for the localized tree. The bare `/` is the one remaining special case (OD-3).

---

## 9. Internal-link migration map

Today **no link carries a language in its URL**; labels follow the `lang` prop only. So nothing is "already locale-aware" in the URL sense. Classification below is from reading the link-producing files (135 files contain `href`, `Link`, `redirect` or `router`; 84 contain a literal public path, counted by search; only the files named below were read for context). Files not read in full are marked uncertain.

**A. Must become locale-aware (public content links)**

| Group | Files |
|---|---|
| Site chrome (the layaway links in `header.tsx` and `app/layout.tsx` are excepted, §9 F) | `components/site/header.tsx` (17 literals), `footer.tsx` (17), `mobile-nav.tsx`, `mobile-tab-bar.tsx`, `nav-menu.tsx`, `nav-underline.tsx` (active-state matching), `app/layout.tsx` (tab hrefs), `components/site/search-box.tsx` (10; `router.push` to products and collections), `components/site/support-ui.tsx`, `app/not-found.tsx` |
| Home | `components/home/hero-slide-views.tsx`, `collection-cards.tsx`, `arrival-card.tsx`, `sections.tsx` |
| Catalogue | `components/catalog/product-card.tsx`, `sold-card.tsx`, `catalog-section.tsx`, `category-stage.tsx`, `product-trust.tsx`, `app/products/[slug]/page.tsx` (breadcrumbs, related) |
| Content pages | `app/{about,why-cha-jewels,shopping-guide,jewelry-guide,loyalty,sale,wholesale,faq,blog,contact}/page.tsx`, `app/blog/[slug]/page.tsx` |
| Content libraries | `lib/content/legal.ts` (16), `lib/content/faq.ts` (8), `lib/content/shopping-guide.ts` (5), `components/site/legal-frame.tsx` |
| Reviews / comments | `components/reviews/review-list.tsx`, `components/blog/comments-section.tsx` |
| Search/SEO plumbing | `lib/page-meta.tsx` (`SeoLinks`, replaced), `app/sitemap.ts`, `components/site/json-ld.tsx`, `lib/share.ts` (share URL builder), `app/api/revalidate/route.ts` (`revalidatePath` of `/`, `/products/…`, `/collections/…`, `/blog…`, and an arbitrary `path` from the request body) |
| Hub-authored text | `lib/markdown.ts:71` (relative `[text](/…)`), `lib/settings.ts:42,131` and `components/site/announcement-bar.tsx` (relative `href`) |

**B. Private/utility and out of scope for URL change, but they generate links to public pages, so they need the language passed in**

`components/commerce/{layaway-band,cart-lines,layaway-piece-picker,points-line,confirmation,checkout-flow,card-pay}.tsx`, `app/cart/page.tsx`, `app/account/page.tsx`, `components/account/login-form.tsx`, `components/loyalty/join-button.tsx`, `lib/auth-actions.ts`, `lib/session-actions.ts:22` (`redirect("/?notice=signed_out")` lands on the public home: needs a locale-aware target), `app/review/[token]/page.tsx`, `app/receipts/verify/page.tsx`, `app/newsletter/unsubscribe/page.tsx`.

**C. Compliance-sensitive path checks (must be re-based on the unprefixed path before any prefix ships)**

`components/site/consent-banner.tsx:46` (`/legal` quiet rule), **`app/layout.tsx:70-84` (`bannerAllowed`, announcement-bar suppression on `/legal` and `/legal/*`)**, `components/analytics/metricool-tracker.tsx`, `lib/analytics.ts`, `tests/consent-ads.test.mjs`. A prefixed `/en/legal/tokusho` that no longer matches `/legal/` would show the cookie banner **and the announcement bar** on the statutory notice. **High.** The advertising-tag check (`adsLoadsOn`) is not a `/legal` rule and is unchanged; its parity for a prefixed legal path is tested. The other literal-path checks found (`lib/metricool.ts`, `lib/ads.ts`, `isPayCardPath`) key on `/account/*` or the pay-card path, which stay unprefixed, so they are unaffected.

**D. Uncertain, needs review before implementation**

`components/site/{messenger-button,flash-notice,contact-form}.tsx`, `components/fx/{page-enter,card-entrance}.tsx` (all use `usePathname` or a path literal), `lib/{profile,motion,cart,comment-actions,cancellation-policy,fixtures}.ts` (one literal each), `components/site/review-form.tsx`.

**E. Not links to the site's pages (no change)**: `lib/hub-api.ts` (Hub API paths), `lib/image-hosts.ts`, external `href`s.

**F. Temporary layaway link exception (Option ii): these stay on the bare `/layaway` through Phase 2C**

| Site | Kind | Phase 2C treatment |
|---|---|---|
| `components/site/header.tsx:156` | Navigation link, desktop and (through `links`) the mobile drawer; rendered when `layawayOffered` | Stays `/layaway` |
| `app/layout.tsx:102` | Mobile tab-bar tab; rendered when `layawayOffered` | Stays `/layaway` |
| `app/why-cha-jewels/page.tsx:88` | In-page link inside the English-only layaway section | Stays `/layaway` |
| `app/account/layaway/page.tsx:79` | Link on a private account page (English only) | Stays `/layaway` |
| `components/site/mobile-tab-bar.tsx:13` (`OWNS.layaway`) | Active-state path constant, not a link | Keeps matching the bare `/layaway` |
| `components/site/messenger-button.tsx:36` (`SHOWN_ON`) | Path allow-list for the Messenger button, not a link | Keeps `/layaway` |

Not part of the exception: the layaway band deliberately never links to `/layaway` (its call to action goes to `/collections`, `components/commerce/layaway-band.tsx`), and the footer's `/faq#payments-and-layaway` is a FAQ link that becomes locale-aware like any other FAQ link.

These links resolve through the language cookie (the bare `/layaway` answers 200 only to an English request), so the stale-cookie / two-tab case (F1) can still 404 them. The complete language-authoritative layaway correction required by 2C (§15) must cover them, or they must be proven to resolve for every visitor who is on an English page; the mechanism is part of the 2C design and is not decided here.

**External places that link to current URLs (not in this repo, UNVERIFIED):** Hub-sent emails (order, receipt, cart reminder, unsubscribe), issued receipts and QR codes, social posts and Messenger shares, Search Console, Google Business Profile. These are covered by the legacy redirects, not by code changes.

---

## 10. Sitemap migration design (design only; `app/sitemap.ts` untouched)

| Topic | Proposal |
|---|---|
| Entries | One entry per **locale URL that exists, returns 200 and is indexable**. Both `/en/x` and `/ja/x` for families that exist in both; one entry for single-language pages |
| Alternates | Next supports `alternates.languages` per sitemap entry (E15). **OD-12:** HTML hreflang is required (plan §4). Adding sitemap alternates as well doubles the places that can drift; if added, one helper must feed both |
| Layaway | `/en/layaway` only, and only after Phase 3 makes it return 200 to a crawler. Never `/ja/layaway`. Layaway-only posts: English entry only |
| Blog | **Rule:** a localized article URL, its sitemap entry and any hreflang naming it exist only if that language's title **and** body are both present on the post's detail row **and** the layaway rule allows that language; a Japanese sibling that would 404 is never generated. The list route may lack the body (E8), so the website-only way is one detail read per post (`hub.post`, cached on the `content` tag); the alternative `has_en_content` / `has_ja_content` list fields are a Hub contract proposal, not assumed (§16) |
| Private/utility | Still never listed (Phase 1 policy test stays) |
| Sold products | Stay listed in both locales (decision D3); policy later (X10) |
| Preserve | Hub fetches individually caught; layaway-only post exclusion; no private route; absolute origin-matching URLs; `lastModified` for products and posts; no query strings |
| Transition (proposed) | During the dual period the sitemap lists **only** locale URLs. Legacy URLs are not listed. Not approved; it depends on the same decisions as the interim canonical and hreflang question in §7 |
| New in the list | `/collections` (R4) is not listed today; propose adding (UNVERIFIED reason) |

---

## 11. Language switcher and cookie design (design only)

- Switcher becomes a crawlable link to the sibling URL (`<a href="/ja/…">`) where a sibling exists, instead of POST + refresh. Where none exists (R19, EN-only posts): **OD-7** (go to the other language's home, or hide the control).
- The URL is authoritative on locale routes. The `cj-lang` cookie becomes a preference mirror: updated when a locale URL is visited and when the switcher is used; it drives language only on unprefixed private routes and on bare-URL redirects (OD-1).
- **Why syncing matters (E7):** a customer on `/en/products/x` whose cookie still says `ja` would see the layaway UI but hit `LAYAWAY_UNAVAILABLE` when a server action checks `layawayOfferedNow()`. **A refreshed cookie alone is insufficient**: it does not help the two-tab case (a tab on `/en/…` while another tab switched the cookie to `ja`), so the complete fix is the layaway-gating actions receiving the page language explicitly (OD-15), with the cookie refresh as a supplement for private routes. This is a checkout-path risk. The requirement (finding F1 below) is that a request on `/en/…` is never refused layaway merely because a stale `ja` cookie remains; the mechanism is OD-15 and must be settled before Phase 2B ships any English page with the layaway UI.
- `Accept-Language` stops deciding language on locale routes. It only matters for bare-URL redirects and, if OD-3 chooses it, the root.

---

## 12. Test matrix (expected behaviour defined before implementation)

Expected values marked (OD-n) cannot be fixed until the decision is made. All locale URLs are `https://www.chajewelsjp.com/…`.

| Area | Case | Expected |
|---|---|---|
| Locale route | `/en/products/<slug>` and `/ja/products/<slug>` | 200; `<html lang>` matches; no `noindex` |
| | Same for R3-R18 | 200 both languages |
| | `/en/layaway` | 200 (Phase 3) |
| | `/ja/layaway` | 404 + `noindex`, no canonical or hreflang elements |
| | `/xx/products/<slug>` (unknown locale) | 404 |
| | `/en/nonexistent`, `/ja/nonexistent` | 404 + `noindex`, **no canonical, no hreflang** (closes X1) |
| | `/en/products/<missing-slug>` | 404 |
| Canonical | Each indexable locale page | exactly one canonical equal to its own URL; no query; no trailing slash |
| | Page with `?utm_source=…` or `?type=news` | canonical strips the query |
| Hreflang | Page in both languages | `en`, `ja`, x-default (OD-2); reciprocal; targets return 200 and are not redirects |
| | EN-only blog post / `/en/layaway` | no `ja` alternate; self-referential only |
| | Any hreflang target | never a URL that 404s, redirects or is noindex |
| x-default | per OD-2 | single, absolute, returns 200 |
| Legacy | `/products/<slug>` bare, no signals | per OD-1 (one hop, correct status, correct target) |
| | with `cj-lang=en` / `Accept-Language: en` | per OD-1 |
| | `/products/<slug>?lang=en` | 308 to `/en/products/<slug>` (OD-4) |
| | Legacy bare page, before any 2E redirect | canonical and hreflang unchanged (C0 + H0) until an interim option is approved; if one is approved, they match it and are mutually consistent (§7) |
| | `/layaway` | per OD-6 |
| | `/` | per OD-3 |
| | `/gold-guide` | one hop to the final locale URL |
| | every redirect | no loop; no chain longer than 1 hop; final URL returns 200; query handled per rule |
| Sitemap | Contents | only locale URLs that return 200 and are indexable; none for `/ja/layaway`; none private; none for a post language without a body; absolute, unique, no query |
| | Alternates (if OD-12 yes) | match the HTML hreflang exactly |
| Switcher | On a page with a sibling | link to the sibling URL, same resource |
| | On `/en/layaway`, EN-only post | per OD-7; never a link to a 404 |
| | Private route | cookie-based, unchanged behaviour |
| Deep links | Direct request of any locale URL with no cookie and no `Accept-Language` | renders in the URL's language |
| Cookies | Cookie says `ja`, URL is `/en/…` | page is English (URL wins); cookie updated to `en` |
| | Locale visit then `/cart`, `/login` | those follow the synced cookie |
| Accept-Language | `en`, `ja`, `tl`, none, `*` on locale URLs | no effect on the locale served |
| Content | Product/collection/category/blog/guides/legal/FAQ in both languages | key text present in the initial HTML in the right language |
| Private | `/account/*`, `/checkout/*`, `/login`, `/cart`, `/search`, `/auth/*`, `/loyalty/join` | unchanged: gate redirect or `noindex`; no canonical/hreflang (Phase 1 route check still passes) |
| Checkout/account | Add to cart from `/en/products/x`; sign in; checkout; layaway quote | works; language preserved; `LAYAWAY_UNAVAILABLE` not hit while on an English page |
| | Paidy/card return URLs, receipts QR | unchanged paths still work |
| Layaway links (2C, Option ii) | Every layaway link on `/en/*` pages and the English chrome (§9 F) | `href` is the bare `/layaway`; resolves 200 for an English request; **none points to `/en/layaway` before Phase 3** |
| | `/ja/*` pages and Japanese chrome | no layaway link, tab or page; `/ja/layaway` is 404; `npm run check:layaway-ja` passes |
| | Page `/en/…` open while the cookie says `ja` (two tabs), click a layaway link, run a layaway quote | not 404 and not `LAYAWAY_UNAVAILABLE` (F1 correction) |
| Internal links | Crawl of every locale page and the site chrome | **no internal navigation link resolves to HTTP 404**; the only links to a legacy bare public URL are the documented layaway exception |
| After Phase 3 | The exception links | repointed to `/en/layaway` only after it returns 200 for a crawler with a self canonical, under its own approval |
| Compliance | `/en/legal/{privacy,terms,returns,tokusho}`, `/ja/legal/{privacy,terms,returns,tokusho}` | consent banner stays quiet; **no announcement bar renders even when the Hub has an active announcement**; advertising-tag behaviour identical to the unprefixed twin (E12, F3) |
| | `bannerAllowed` unit cases | `/legal`, `/legal/x`, `/en/legal/x`, `/ja/legal/x` suppressed; `null`/absent path header suppressed (fail-safe); `/en`, `/ja`, `/en/products/x`, `/en/legalx` not suppressed |
| | Same checks on the unprefixed `/legal/*` | unchanged |
| JSON-LD | Product, BlogPosting, store | `url`/`@id` are locale URLs; `inLanguage` correct; parses |
| Revalidation | `POST /api/revalidate` for a product/post/collection | both locale URLs are refreshed |
| Regression | `scripts/check-seo-live.mjs` | updated for the locale matrix (its current expectation of canonical + three alternates on bare URLs changes by design, see X2) |
| Unit | `lib/seo-policy.ts`, a new locale helper | policy paths with and without a locale prefix; sibling-path mapping |

---

## 13. Risk report

**Highest-risk files:** `middleware.ts` (language, path header, auth gate, CSP all in one function), `app/layout.tsx`, `lib/page-meta.tsx`, `lib/i18n.ts`, `components/site/header.tsx` / `footer.tsx` / `mobile-nav.tsx` / `search-box.tsx`, `app/sitemap.ts`, `next.config.ts`, `app/api/revalidate/route.ts`, `lib/share.ts`, `components/site/json-ld.tsx`, `components/site/consent-banner.tsx`, and `bannerAllowed` in `app/layout.tsx`.

**Highest-risk routes:** `/` (R1), `/products/[slug]` (R2, 449 URLs), `/blog/[slug]` (R7), `/layaway` (R19), `/legal/tokusho` (R18), and the redirect behaviour of every bare URL.

| ID | Risk | Mitigation (proposed) |
|---|---|---|
| K1 | **Redirect loops**: locale redirect plus Vercel apex/www/HTTPS hops plus `next.config` redirects (run before middleware) plus a cookie-driven redirect | Single place per redirect type; one hop; test every legacy shape and every www/apex/HTTP shape; never redirect a URL that is already locale-prefixed |
| K2 | **Canonical pointing at a redirect or 404**: legacy 200 pages canonicalizing to a locale URL that is not live yet, or `/ja/layaway` | Locale routes live and verified before any canonical or sitemap change; canonical never targets a redirect |
| K3 | **Cookie/language state**: URL says `en`, cookie says `ja`; server actions read the cookie (E7) | URL authoritative; explicit language passed to the layaway-gating actions (a cookie refresh alone does not cover the two-tab case); test the layaway quote path from `/en` with a stale `ja` cookie; required before localized customer-facing links go live (2C) |
| K4 | **404 exposure**: `[lang]` matching any first segment; sitemap or hreflang naming a post with no body in a language (E8); `/ja/layaway` | Validate the locale segment; per-language existence before listing; tests above |
| K5 | **Duplicate content**: dual period (legacy 200 + locale 200); `?lang=` variants; Japanese pages that are English text via fallback | Interim canonical behaviour per the approved option in §7 (none approved yet); redirects last; OD-9 for fallback pages |
| K6 | **Customer sessions**: auth cookies, `?next=` with prefixed paths, Supabase redirect allow-list | Keep `/auth/*`, `/login`, `/account` unprefixed; confirm `safeNext` accepts a prefixed path |
| K7 | **Checkout/payment**: return URLs, pay-card CSP path rules, cart-to-product links, `LAYAWAY_UNAVAILABLE` | Private routes unchanged; checkout run-through on a preview before every sub-phase merge |
| K8 | **Compliance gates keyed on `/legal/*`** (consent banner and **announcement-bar suppression `bannerAllowed`**) break under a prefix (E12, F3) | Done in Phase 2A: both ask `lib/statutory-path.ts`, which looks past a locale prefix; the `bannerAllowed` fail-safe is kept; tests added |
| K9 | **Stale content after Hub edits**: `revalidatePath` targets bare paths (E11) | Revalidate both locale paths; test |
| K10 | **Analytics continuity**: page paths change in Vercel Analytics, Metricool, Ads | Decide path normalization; document the break in series |
| K11 | **Ranking disruption** during recrawl: expected, temporary, cannot be removed | Keep legacy URLs answering during the transition, redirect permanently only after verification, monitor Search Console, no claims of indexing until observed |
| K12 | **Hub-authored and external links** to bare URLs (E11, emails, QR codes) | Legacy redirects stay indefinitely; render-time localization of first-party and Hub text (OD-11) |
| K13 | **Rendering mode**: all pages are uncached today (E5); a layout change could make this better or worse | Do not change rendering mode in the migration; treat static/ISR as a separate, later approval |
| K14 | **Layaway links 404 for English visitors** if links are made locale-aware before `/en/layaway` exists (the sequencing defect corrected in this plan) or if a stale `ja` cookie meets a bare `/layaway` link | Option (ii): layaway links stay on `/layaway` until Phase 3 validates `/en/layaway`; 2C exit requires "No internal navigation link may resolve to HTTP 404" and the F1 correction before link activation |

**Rollback strategy (proposed).** Each sub-phase (§15) ships as its own PR and is reversible on its own. Phases 2A-2D are additive (the legacy URLs keep working), so rollback is a revert with little SEO cost. Phase 2E (permanent redirects) is the one that cannot be fully undone: browsers and crawlers cache 308s, so it ships last, after a full preview and production verification, and a rollback means replacing 308s with 307s (not removing them). Before 2E, record the full legacy-to-locale URL map in this file.

---

## 14. OWNER DECISIONS REQUIRED BEFORE IMPLEMENTATION

Nothing that depends on these is implemented. Every "Recommended" entry below is a recommendation for the owner, **not a decision**; none has been applied.

**Resolved, or OWNER APPROVED (no longer open):**

| Was | Resolution |
|---|---|
| OD-13 locale-home trailing slash | Technical convention: `/en` and `/ja`, existing `trailingSlash: false` kept (§3) |
| OD-14 Phase 2 path structure | Existing route families move under locale prefixes; master-plan §22 `/shop/*` and `/guides/*` stay future-phase architecture (§3) |
| OD-5 old shared/bookmarked bare URLs | Merged into OD-1 (same URLs, same answer) |
| **OD-10 mechanism: OWNER APPROVED 2026-10-28** | **A: real Next.js App Router locale routes (`app/[lang]`).** Mechanism only; no route is authorized by it |
| **OD-2 x-default: OWNER APPROVED 2026-10-28** | **English.** The x-default of a localized page is the corresponding English URL. For a genuinely single-language page it is that page's eligible existing language URL, subject to valid hreflang rules. Applies to the new locale pages; the x-default emitted by legacy bare URLs is not covered (that stays under the unapproved C0/H0 question, §7) |
| **OD-3 behaviour of `/`: OWNER APPROVED 2026-10-28** | **Redirect later.** The root `/` is unchanged through Phases 2B-2D. A language-aware root redirect belongs to Phase 2E; its signals, status codes and 307-to-308 staging are settled at the 2E gate together with OD-1 |
| **OD-9 fallback-language content: OWNER APPROVED 2026-10-28** | A localized page is eligible when its primary content is genuinely in the URL's language. Product names, brand names, model numbers, technical specifications and neutral catalogue text never disqualify a page; a missing optional description is not foreign fallback; valid short native-language descriptions stay eligible. Foreign-language **running text** in place of required local content makes a page ineligible: `noindex, follow`, no sitemap entry, no hreflang alternate pointing to it, still reachable until localized. Word counts are never the primary language detector. The reviewed proper-name case (the Louis Vuitton wallet) is eligible neutral catalogue content. Evidence: §16.1 |
| **OD-15 URL/cookie/layaway authority: OWNER APPROVED 2026-10-28, WITH SECURITY REQUIREMENTS** | The locale URL is the authoritative display language; the middleware-owned `x-cj-lang` context must not be spoofable by client headers; cookies sync on locale responses; layaway gates take a validated explicit language, and a missing or invalid argument keeps today's safe fallback. **Not relaxed:** authentication, agreement requirements, layaway term restrictions, authorization checks, payment validation, Hub calculations. Japanese layaway stays unavailable; no Hub payment-contract change is approved. Design and security review: §17 |
| **C0/H0 legacy canonical + hreflang: OWNER APPROVED 2026-10-28 — FOR PHASE 2B ONLY** | During the 2B dark launch, legacy bare URLs keep their existing canonical and hreflang byte-identically, and the new locale URLs stay unlinked and unlisted. **This approval expires at the Phase 2C gate**: before any localized public link or sitemap entry activates, the legacy strategy must be reconsidered and separately approved. Risk record: §7 |
| **OD-8 single-language pages: OWNER APPROVED 2026-10-28** | **Yes.** Publish and index only language versions that actually exist and meet content-eligibility requirements. No invented or machine-generated Japanese (or any) translations. The eligibility details for fallback-language content depend on OD-9, which is still open |

**Remaining decisions at a glance** (OD-2, OD-3, OD-8, OD-9, OD-10, OD-15 and C0/H0-for-2B are now approved, above; still open: OD-1, OD-4, OD-6, OD-7, OD-11, OD-12):

| # | Decision | Recommended | Must be decided before |
|---|---|---|---|
| OD-1 | Destination of bare legacy URLs (includes old shared/bookmarked links) | L2, introduced as temporary first | **2E**; also feeds the interim canonical and hreflang question (§7) that gates 2B changes to legacy pages |
| OD-4 | `?lang=` URLs | 308 to the locale URL, indefinitely | **2E** (share links in 2C); also feeds the interim canonical and hreflang question (§7) |
| OD-6 | Legacy `/layaway` | 308 to `/en/layaway` once Phase 3 is live | **Phase 3 / 2E** |
| OD-7 | Switcher where no sibling exists | Link to the other language's home | **2C** |
| OD-11 | Hub-authored relative links | Localize at render time | **2C** |
| OD-12 | Hreflang in the sitemap too | HTML only | **2D** |

### OD-1: Destination of bare legacy URLs (`/products/x`, `/collections/kihei`, …)

| | |
|---|---|
| **Options** | **L1** permanent redirect to `/ja/…` for everyone. **L2** permanent to `/ja/…` for requests with no language signal (a crawler), temporary to the visitor's language when a cookie or `Accept-Language` exists. **L3** temporary to the visitor's language for everyone |
| **Recommended** | **L2**, shipped first as temporary (307) for both branches, then promoted to permanent (308) for the no-signal branch only after Phase 2D validation and an owner-set observation period |
| **Reason** | A crawler sends no cookie or `Accept-Language`, so it consolidates onto `/ja`, where today's indexed equity lives. Filipino and other English visitors (the layaway audience) are not forced into Japanese. L1 is simpler but sends English bookmarks and shares to Japanese pages |
| **SEO impact** | Consolidates signals onto locale URLs. L2 varies by request, so it must send `Vary` and not be shared-cached; Google handles locale-adaptive behaviour imperfectly, so verify in Search Console. L3 may leave bare URLs indexed because the redirect is not permanent |
| **Customer / business impact** | L1: English visitors with old links land in Japanese. L2 and L3: none |
| **Reversibility** | 307: fully reversible. 308: sticky in browsers and crawler memory; effectively one-way for already-cached visitors |
| **Needed before** | Phase 2E for the redirects themselves. **Also**, together with OD-2, OD-3 and OD-4, it determines the interim canonical and hreflang behaviour of bare legacy URLs (§7), which must be approved before Phase 2B changes any legacy page; without that approval 2B leaves legacy canonicals and hreflang unchanged (options C0 + H0) |

### OD-2: x-default — OWNER APPROVED 2026-10-28 (English)

**Approved:** the x-default of a localized page is the corresponding English URL; for a genuinely single-language page, its eligible existing language URL, subject to valid hreflang rules (so an English-only page names itself and a Japanese-only page names itself). This is the decision text; the analysis below is kept as the record. Legacy bare URLs keep their current x-default unless a separate legacy option (H1/H2, §7) is approved.


| | |
|---|---|
| **Options** | `/ja/<same page>`; `/en/<same page>`; a language-selector page; the bare `/` |
| **Recommended** | `/en/<same page>` where an English sibling exists; for a single-language page, the page itself |
| **Reason** | x-default serves users whose language matches neither `en` nor `ja`. The application's own rule (`detectLang`) already sends unmatched languages (Tagalog, Chinese, German…) to English, so this agrees with documented behaviour. Today's x-default is the Japanese bare URL, so this is a deliberate shift; the alternative is defensible. A selector page needs a new route and content and is not recommended now |
| **SEO impact** | Low to medium: decides which version Google offers to unmatched-language searchers |
| **Customer / business impact** | Japanese and English readers are matched by `ja` / `en` and are unaffected |
| **Reversibility** | Metadata only; fully reversible |
| **Needed before** | Phase 2B (hreflang is first emitted there) |

### OD-3: Behaviour of `/` — OWNER APPROVED 2026-10-28 (redirect later)

**Approved:** `/` is unchanged during Phases 2B-2D; a language-aware root redirect belongs to Phase 2E. Consequence to manage: until 2E the home content is served at `/`, `/en` and `/ja` (see the transition risk assessment in §7). The recommendation and options below are kept as the record.


| | |
|---|---|
| **Options** | (a) `/` keeps serving Japanese content as the default. (b) `/` redirects by language signal, following OD-1. (c) `/` becomes a language-selector page |
| **Recommended** | (b) |
| **Reason** | (a) leaves two Japanese home pages (`/` and `/ja`) competing and needs a canonical rule between them. (c) puts a thin page in front of the most valuable URL and needs new content. (b) consolidates the home page's signals onto `/ja` and keeps each visitor in their language |
| **SEO impact** | (b) consolidates; (a) duplicates; (c) risks the home page's visibility |
| **Customer / business impact** | The home page carries the most traffic; (b) keeps people in their language with no extra step |
| **Reversibility** | 307: reversible. 308: sticky |
| **Needed before** | Phase 2B only if OD-2 chooses `/` as x-default or something references `/`; otherwise before 2E, where it is built |

### OD-4: `?lang=` URLs

| | |
|---|---|
| **Options** | 308 to the locale URL indefinitely; 308 for a limited period then ignore the parameter; keep honouring it in place |
| **Recommended** | 308 to the locale URL indefinitely (`?lang=en` to `/en/<page>`, `?lang=ja` to `/ja/<page>`), dropping only `lang` and keeping other query |
| **Reason** | The parameter is an explicit, unambiguous choice, so the target does not depend on a cookie. English links already circulate with it (`lib/share.ts`). One hop |
| **SEO impact** | Consolidates the parameter variants onto the locale URL |
| **Customer / business impact** | Shared English links keep working |
| **Reversibility** | 308 is sticky but harmless: the target is correct |
| **Needed before** | Phase 2E. `lib/share.ts` switches to locale URLs in 2C once they are live |

### OD-6: Legacy `/layaway`

| | |
|---|---|
| **Options** | (a) 308 to `/en/layaway` for all requests. (b) 308 only for English signals or `?lang=en`; keep 404 otherwise. (c) Leave the 404 permanently |
| **Recommended** | (a), after Phase 3 makes `/en/layaway` return 200 |
| **Reason** | Layaway has exactly one destination, so the redirect is unambiguous whatever the language. (b) leaves crawlers on a 404 and loses old English links. (c) abandons them. **Policy check needed:** the owner rule (2026-09-25) says nothing layaway-related is visible on the Japanese site, no exceptions. A redirect from a typed or old URL adds layaway to no Japanese page, menu or sitemap, but this is the owner's call to confirm |
| **SEO impact** | Positive: consolidates every old layaway link |
| **Customer / business impact** | A Japanese visitor who types `/layaway` would see the English layaway page |
| **Reversibility** | 308 sticky |
| **Needed before** | Phase 3 / 2E. Not needed for 2A-2D |

### OD-7: Language switcher where no sibling exists (`/en/layaway`, EN-only posts)

| | |
|---|---|
| **Options** | Link to the other language's home; hide the control; show it disabled |
| **Recommended** | Link to the other language's home. Never a link to a 404, never to the layaway page |
| **Reason** | Keeps a language escape (a Japanese reader on an English-only page can leave) and fits the policy that the Japanese site has no layaway. Hiding it removes the escape; disabled looks broken |
| **SEO impact** | None (UI) |
| **Customer / business impact** | Small |
| **Reversibility** | UI only; trivial |
| **Needed before** | Phase 2C |

### OD-8: Single-language pages — OWNER APPROVED 2026-10-28 (yes)

**Approved:** publish and index only language versions that actually exist and meet content-eligibility requirements; no invented or machine-generated translations. What counts as eligible content for a page that exists but shows another language's text is OD-9 (open).


| | |
|---|---|
| **Decision** | Confirm that `/en/layaway`, layaway-only posts, and any post with words in one language only are indexed in that language only: self canonical, self hreflang, x-default per OD-2 (the page itself), no alternate to a missing page, nothing machine-translated for SEO |
| **Options** | Confirm; or specify another treatment |
| **Recommended** | Confirm |
| **Reason** | The skill and plan both forbid creating a language page that does not exist commercially |
| **SEO impact** | Prevents hreflang to a 404 (finding F2) |
| **Customer / business impact** | None |
| **Reversibility** | Metadata only |
| **Needed before** | Phase 2B |

### OD-9: Fallback-language content — OWNER APPROVED 2026-10-28 (see §14 for the approved text; §16.1 is the evidence; the material below is the record)

| | |
|---|---|
| **Options** | Index anyway; `noindex` until the text exists; keep indexable but out of the sitemap |
| **Recommended** | **Audit first.** A read-only content-completeness audit (how many products, collections, categories, posts and FAQ rows lack text in a page language; scale UNVERIFIED) should precede the rule. Interim recommendation: a locale page whose primary visible text is not in the page's language gets `noindex, follow`, stays out of the sitemap and has no hreflang pair, and returns to normal when the Hub gains the text |
| **Reason** | Thin wrong-language pages dilute hreflang clusters and invite duplicate treatment; but over-applying `noindex` across hundreds of products would hide real pages, which is why the audit comes first |
| **SEO impact** | Protects quality; the risk is over-noindexing |
| **Customer / business impact** | None: the pages stay reachable |
| **Reversibility** | Metadata only |
| **Needed before** | The audit before Phase 2B entry; the rule before 2B (metadata); enforcement in 2D (sitemap) |

### OD-10: Mechanism — OWNER APPROVED 2026-10-28 (A, `app/[lang]`)

**Approved:** real Next.js App Router locale routes. Mechanism only; no route is authorized by this. The comparison below is kept as the record.


| | |
|---|---|
| **Options** | **A** `app/[lang]/…` segment. **B** middleware rewrite |
| **Recommended** | A |
| **Reason** | Documented Next.js pattern; per-page metadata closes X1 for the locale tree; allows static generation later. B is a smaller diff but leaves X1 open |
| **SEO impact** | A gives cleaner canonical and hreflang |
| **Customer / business impact** | None directly. Engineering risk: A moves about 38 page files |
| **Reversibility** | Moderate: a mechanical move, reverted as one PR |
| **Needed before** | Phase 2B. Phase 2A is kept mechanism-neutral on purpose |

### OD-11: Hub-authored and first-party relative links

| | |
|---|---|
| **Options** | Localize at render time (prefix a relative public path with the current language); or rely only on the legacy redirects |
| **Recommended** | Localize at render time, with the redirects as a safety net |
| **Reason** | Avoids an extra redirect hop for each Hub link and keeps internal linking clean for crawling. The Hub keeps storing bare paths, so no Hub contract changes (finding F4) |
| **SEO impact** | Positive: no internal links to redirecting URLs |
| **Customer / business impact** | None |
| **Reversibility** | Code only |
| **Needed before** | Phase 2C |

### OD-12: Hreflang in the sitemap as well as in the HTML

| | |
|---|---|
| **Options** | HTML only; HTML plus sitemap `alternates.languages` generated from the same helper |
| **Recommended** | HTML only for 2B-2D; revisit later only if the sitemap version is generated from the same helper and tested for equality |
| **Reason** | One source of truth, less to drift. Search engines accept either |
| **SEO impact** | Neutral |
| **Customer / business impact** | None |
| **Reversibility** | Trivial |
| **Needed before** | Phase 2D |

### OD-15: Cookie role and sync (finding F1) — OWNER APPROVED 2026-10-28 WITH SECURITY REQUIREMENTS (see §14; §17 is the binding design; the material below is the record)

| | |
|---|---|
| **Options** | Middleware refreshes `cj-lang` on every locale response; the layaway-gating server actions receive the page language explicitly; both |
| **Recommended** | Both |
| **Reason** | Cookie refresh keeps private routes (cart, login, account) in the visitor's language. The explicit argument defends the two-tab case (a tab on `/en` while another tab switched to Japanese) that a cookie alone cannot. The action change is in `lib/checkout-actions.ts`, adjacent to payments, so under the project decision rules it should be done and reviewed on Opus, with money logic untouched |
| **SEO impact** | None |
| **Customer / business impact** | Prevents refused layaway on English pages |
| **Reversibility** | Code only |
| **Needed before** | Phase 2B for the design and the cookie sync; the explicit argument lands in 2C and **must be merged and verified before any localized customer-facing link is activated**. A refreshed cookie alone is not sufficient (F1, N4) |

---

## 15. Implementation gates (each needs explicit approval; none started)

Each sub-phase is its own branch and PR. A later sub-phase does not start until the earlier one has passed its exit criteria **and** been verified on a deployed environment. **Permanent redirects stay last (Phase 2E).** Phase 1's PR had no Vercel preview (the project's Ignored Build Step cancelled it), so **a deployed preview for the branch is required before Phase 2B and every later behaviour-changing gate** (an entry criterion from 2B onward). Phase 2A is mechanism-neutral and changes no behaviour, so a local build plus the regression tests adequately cover it and a preview is not required for its exit.

### Phase 2A: locale infrastructure only

| | |
|---|---|
| **Behaviour introduced** | None visible. No route, redirect, canonical, hreflang or sitemap change. Helpers only, and compliance path checks re-based so they read the same under a future prefix |
| **Files likely affected** | New `lib/locale.ts` (`LOCALES`, `localePath`, `stripLocale`, `siblingPath`); `lib/seo-policy.ts` (match with or without a locale prefix, unprefixed behaviour unchanged); `components/site/consent-banner.tsx` (uses the shared rule); `components/analytics/ads-tags.tsx`, `components/analytics/metricool-tracker.tsx`, `lib/analytics.ts` need no change (they key on `/account/*`) and keep parity tests; **`app/layout.tsx` (`bannerAllowed` re-based on the stripped path, `x-cj-path` fail-safe preserved)**; `scripts/check-seo-live.mjs` (matrix scaffolding, expectations unchanged); the OD-9 content-completeness audit (read-only). The re-based logic should live in one shared helper that all three compliance checks call, so the three cannot drift |
| **Tests required** | Unit tests for the helpers (including "no sibling" cases); policy tests with and without prefix; compliance tests so `/legal/*`, `/en/legal/*` and `/ja/legal/*` all keep **the banner quiet and the announcement bar suppressed**, with advertising-tag parity (F3), including the `bannerAllowed` cases in the §12 matrix and the null-header fail-safe; the full existing suite |
| **Entry criteria** | Owner approval of 2A. No owner decision is required; 2A is mechanism-neutral |
| **Exit criteria** | All checks green; verification may be a **local build plus the regression tests** (a deployed preview is not required for 2A): `scripts/check-seo-live.mjs` output identical before and after against the local build, head metadata of a sample of public routes byte-identical, and the three statutory-page suppressions proven unchanged on unprefixed `/legal/*`; audit results written up |
| **Rollback** | Revert the PR. No behaviour to unwind |

### Phase 2B: locale public routes and metadata

| | |
|---|---|
| **Behaviour introduced** | `/en/…` and `/ja/…` serve R1-R18 (not layaway). Per-page canonical and hreflang through one helper. Language read from the URL; cookie synced on locale responses. Unknown locale and `/ja/layaway` return 404. **Structured data on each locale page (Product, BlogPosting, FAQPage, store) carries locale-correct `url`, `@id`, `offers.url` and `inLanguage`, equal to that page's own canonical URL and language** (N2): a localized page must not publish structured-data URLs that disagree with its canonical. Legacy bare URLs keep serving 200; their canonical **and hreflang** stay unchanged (C0 / H0, §7) unless an interim option has been approved in writing. **Nothing links to the new URLs and the sitemap does not list them yet** (unlinked dark launch; these are the safeguards under which 2B may proceed with the stale-cookie risk still open, see N4 below) |
| **Files likely affected** | Option A: `app/[lang]/…` (moved pages), `app/layout.tsx`, `lib/i18n.ts`, `lib/i18n-server.ts`, `middleware.ts`, `lib/page-meta.tsx` (`SeoLinks` retired for the locale tree), `components/site/json-ld.tsx`. Option B: `middleware.ts` and the metadata helper |
| **Tests required** | §12 locale-route, canonical, hreflang, x-default, 404, content-language, JSON-LD and private-route rows; unit tests for the metadata helper and sibling mapping; an updated route-check script |
| **Entry criteria** | 2A merged and verified; Release 0 deployed and production-verified (done 2026-10-28); **OD-2, OD-3, OD-8, OD-9, OD-10, OD-15 and C0/H0-for-2B all OWNER APPROVED (2026-10-28)**; **the one remaining gate: Gate A of §18 — owner approval of the exact R1-R18 route inventory and written authorization to implement**; a deployed preview path per §18 (the `develop` alias) |
| **Exit criteria** | Every R1-R18 locale URL returns 200 on the preview and then production; hreflang reciprocal for a sample of every family, never to a 404, redirect or noindex page; X1 closed in the locale tree (404s there emit no canonical or hreflang); legacy pages unchanged (including their canonical and hreflang, unless an interim option was approved); **parsed JSON-LD on a sample of every family has `url`, `@id`, `offers.url` and `inLanguage` equal to the page's canonical locale URL and language, and no structured-data URL points at a bare legacy URL** (N2); statutory-page compliance verified on locale legal pages (consent banner quiet, **announcement bar suppressed**, advertising parity); checkout and layaway journey from `/en` passes with a refreshed cookie. **N4:** a refreshed cookie alone does **not** close the two-tab / stale-cookie case (F1); 2B is acceptable only because it is unlinked and unlisted, and the 2B exit does not claim F1 is resolved |
| **Rollback** | Revert the PR. The locale URLs then return 404, which is low impact because nothing links to or lists them yet. Legacy canonicals return to self |

### Phase 2C: internal links, switcher and locale-aware application behaviour

| | |
|---|---|
| **Behaviour introduced** | Every public link is locale-aware **except the temporary layaway exception (Option ii, §6 and §9 F)**: the existing working English layaway links stay on the legacy `/layaway`, and nothing points to `/en/layaway` until Phase 3 has created and validated it. Switcher links to the sibling URL (OD-7). Share links use locale URLs. Hub text and the announcement bar are localized at render time (OD-11). Revalidation refreshes both locale paths. Sign-out lands on a locale-aware page. The **language-authoritative layaway gating correction** (OD-15) makes the layaway-gating actions use the page language explicitly, so a stale cookie cannot refuse an English page's layaway (F1); Hub-controlled money and layaway behaviour is preserved and only the language the gate receives changes. Structured-data URLs were already made locale-correct in 2B (N2); 2C changes link-generating components only. **No Japanese layaway offering is introduced** (exception links render only when `layawayOffered(lang)` is true; none on `/ja/*`) |
| **Files likely affected** | The link groups in §9 A-D (the §9 F layaway links excepted): header, footer, mobile-nav, mobile-tab-bar, search-box, nav components, home and catalogue components, content pages, `lib/content/*`, `lib/markdown.ts`, `lib/settings.ts`, `components/site/lang-switcher.tsx`, `lib/share.ts`, `app/api/revalidate/route.ts`, `lib/session-actions.ts`, `lib/checkout-actions.ts` (language argument only; money logic untouched, Opus review) |
| **Tests required** | A link-crawl test with two assertions: **no internal navigation link resolves to HTTP 404**, and no internal link to a bare legacy public URL except the documented layaway exception (§9 F); layaway-exception tests (links are bare `/layaway` on English pages, resolve 200 for English, absent on every `/ja/*` page, `check:layaway-ja` passes); switcher tests including the no-sibling case; the two-tab layaway test; markdown and announcement localization unit tests; revalidation test; compliance rows (including the announcement bar); the checkout journey |
| **Entry criteria** | 2B deployed to production and verified; OD-7 and OD-11 answered; a deployed preview for the branch; written approval for the link-destination change, including the layaway exception as inventoried in §9 F. **Ordering inside 2C (N4):** the language-authoritative layaway gating correction (OD-15 argument) is merged and verified **before** any localized customer-facing link is activated; a refreshed cookie alone is not sufficient |
| **Exit criteria** | **No internal navigation link may resolve to HTTP 404.** A crawl finds no internal link to a bare legacy public URL other than the documented layaway exception. The language-authoritative layaway gating correction is proven by the two-tab test (an `/en/…` page with a stale `ja` cookie is never refused layaway and its layaway link never 404s). The switcher never links to a 404. No layaway link, tab or page on any `/ja/*` page. Compliance gates verified (consent banner, announcement bar, advertising parity). Route check green; checkout verified on the preview |
| **Rollback** | Revert the PR. Links return to bare URLs; the locale routes from 2B remain |

### Phase 2D: sitemap and complete SEO validation

| | |
|---|---|
| **Behaviour introduced** | The sitemap lists locale URLs that exist, return 200 and are indexable (post languages checked per F2, fallback-language pages per OD-9, `/en/layaway` only after Phase 3, never `/ja/layaway`, never a private route); legacy URLs are no longer listed. Alternates only if OD-12 says so |
| **Files likely affected** | `app/sitemap.ts`, `lib/posts.ts`, `tests/seo-sitemap.test.mjs`, `scripts/check-seo-live.mjs`; a Hub list-field request **only if** per-language post existence cannot be known otherwise (raised as a question, not assumed) |
| **Tests required** | Locale sitemap eligibility tests; a crawl of every sitemap URL (about 900) asserting 200, a self canonical and reciprocal hreflang; a 404 sweep; the full §12 matrix except the redirect rows; results recorded in `docs/seo/SEO-QA-REPORT.md` |
| **Entry criteria** | 2C deployed and verified; OD-9 audit complete and applied; OD-12 answered; written approval for the sitemap URL-set change |
| **Exit criteria** | The crawl reports zero non-200 sitemap URLs and zero hreflang inconsistencies; X2 verified closed; Search Console readiness checklist handed to the owner, who submits it |
| **Rollback** | Revert the sitemap PR. The old sitemap lists bare URLs, which still return 200 |

### Phase 2E: legacy redirects (last, after validation and owner approval)

| | |
|---|---|
| **Behaviour introduced** | Bare legacy URLs redirect per OD-1; `/` per OD-3; `?lang=` per OD-4; `/gold-guide` retargeted in one hop; `/layaway` per OD-6 once Phase 3 is live. Staged: temporary (307) first, permanent (308) only after an owner-set observation period and a separate approval |
| **Files likely affected** | `next.config.ts` (static redirects, run before middleware), `middleware.ts` (signal-dependent redirects), tests, this file's legacy-to-locale URL map |
| **Tests required** | A redirect matrix: every legacy shape with no signal, cookie `en`/`ja`, `Accept-Language` `en`/`ja`/`tl`/`*`, `?lang=`, query preservation, and the HTTP/www/apex chains; no loops; at most one hop; final status 200; no canonical pointing at a redirect; `Vary` and cache headers; private routes untouched; sitemap unaffected |
| **Entry criteria** | 2D verified in production for the observation period the owner sets; **OD-1, OD-3, OD-4 and OD-6 answered in writing**; the full legacy-to-locale URL map recorded here; written approval for the redirects |
| **Exit criteria** | The matrix is green on a preview and then on production; a Search Console monitoring plan is in place (owner); the 307-to-308 promotion is scheduled as its own approval |
| **Rollback** | Replace the 308s with 307s, or remove the rule. **Already-cached 308s in browsers and crawlers cannot be recalled**, which is why this phase is last and staged |

Phase 3 (`/en/layaway`) follows 2B and 2C and is not part of this list. **Transition note (Option ii):** until Phase 3 has created and validated `/en/layaway`, the English layaway links remain on the legacy `/layaway` (§6, §9 F). Phase 3 is the phase that creates `/en/layaway` (HTTP 200 for a crawler, self canonical, tested), repoints those links, and only then lists the page in the sitemap, each under its own route-change approval. Japanese layaway stays unavailable throughout.

---

## 16. Phase 2A content-completeness audit (read-only, 2026-10-28)

**Question:** can the website know, for each public content type, whether a language-specific URL would be backed by real content in that language? **Method:** requests to the public site only (no Hub credential used, no Hub endpoint changed), plus reading `supabase/contracts/api.md`, `lib/hub-api.ts`, `lib/posts.ts`, `lib/catalog-i18n.ts`, `lib/faq.ts`. The Hub itself was not queried, so anything that needs an authenticated Hub read is marked UNVERIFIED.

| Content | Result on the live site | Can the site determine language availability today? |
|---|---|---|
| **Products** | 447 sitemap URLs. Japanese page: every one that answered 200 has Japanese in its name (H1). Japanese meta description: 446 of 447 contain Japanese; the one that does not is a Louis Vuitton piece whose description is its Latin product name. (A first pass saw one transient non-200; a second pass saw none.) | **Yes, from data the site already reads.** The product payload carries `name_ja`, `name_en`, `description_ja`, `description_en`, and `productName` / `productDescription` apply the fallback (`lib/catalog-i18n.ts`). The slug list (`/catalog/products?fields=slug,updated_at`) is a projection that carries no language field, so a language check needs the full product read the catalogue already makes (cached on the `catalog` tag), not the slug list |
| **Collections** | 12 of 12: both languages answer 200, Japanese H1 contains Japanese | Yes: `name_ja` and `description_ja` are on the collection payload |
| **Categories** | 5 of 5: same | Yes: `name_ja` and `description_ja` are on the category payload |
| **Blog posts** | The sitemap lists 1 post. The blog list shows 1 post in Japanese and 2 in English. `how-cha-jewels-began` is **English-only**: 200 in English, 404 in Japanese, absent from the Japanese list and from the sitemap (VERIFIED). Because the sitemap omits only blank-slug, `layaway_only` and unpublished posts (`app/sitemap.ts:33`, identical to the deployed release) and this post is published, it is excluded by the **layaway rule, not by missing Japanese content** (INFERRED, high confidence; whether it also lacks Japanese text is UNVERIFIED and moot) | **Partly.** A list row carries `title_ja` / `title_en`, so a title per language is known. The article page also requires a body in that language (`lib/posts.ts` `fromHub`, `needBody`) and, per the 2026-10-02 launch-pass comment in that file, the list route sends **no body**. The contract (`api.md:110`) lists `body_*` on `Post` without saying whether the list includes it: **contract and code comment disagree, UNVERIFIED which is current**. Where a title exists but no body, the language's blog list would show a post whose article page refuses it |
| **FAQ** | Japanese FAQPage JSON-LD has 31 items, English 45 (VERIFIED). The 14 English-only items by section: `payments-and-layaway` 8, `orders-and-live-selling-claims` 2, `shipping` 2, `loyalty-points-and-store-credit` 1, `trade-program-and-wholesale` 1. The 8 in the layaway section are layaway-only (INFERRED). For the other 6 the public page cannot separate "layaway-only" from "untranslated general question" (UNVERIFIED). The Japanese FAQ mentions no layaway term (VERIFIED) | **Yes at item level.** `GET /content/faq` nests every item with `question_*`, `answer_*` and `layaway_only`, in one request. The FAQ page itself exists in both languages |
| **Guides and static pages** | 16 pages (home, `/jewelry-guide`, `/shopping-guide`, `/about`, `/why-cha-jewels`, `/contact`, `/affiliations`, `/loyalty`, `/sale`, `/wholesale`, the four legal pages, `/blog`, `/collections`) all answer 200 in both languages with the right `<html lang>` and a Japanese H1 in Japanese | **Yes, statically.** Their text is first-party in `lib/content/*` and `lib/i18n.ts`, in both languages, so availability is knowledge in the code, not data |

**Consequences for the plan**

- F2 is real but small today: **one** post is single-language. The rule stands (a language URL exists only if the post has a title **and** a body in it, no `ja` alternate for an English-only post).
- OD-9 (fallback-language content) has **no measurable problem to solve yet**: products, collections and categories are complete in Japanese on the live data. The decision can wait for the 2B rule, with this audit as its evidence; it should be repeated whenever a batch of products is imported.
- The page-level audit is only a sample in time. Product count moved from 449 to 447 between the Phase 1 baseline and this audit.

**Is a Hub enhancement needed?** **No, not for Phase 2A or 2B.** For Phase 2D the blog needs per-language body existence. Options, none implemented:

| Option | What it takes | Cost |
|---|---|---|
| **Website-only (recommended first; smallest reliable)** | For each post in the list, read the detail route (`hub.post(slug)`, already cached on the `content` tag) when building the sitemap and the hreflang sibling answer | One extra Hub read per post. Negligible at 2 posts; linear in posts, so it would slow the sitemap if posts reach the hundreds |
| **Optional Hub enhancement (proposal only; justified once posts grow or sitemap build time suffers)** | Add `has_en_content` and `has_ja_content` booleans to each `GET /content/posts` row, true only when the title **and** body for that language are non-empty after trimming. Must reflect real content, not a flag someone sets | A Hub change on Lovable's side (the website repo drafts, it does not implement); removes the N+1; also fixes the list-versus-article mismatch. Justified once posts grow or the list is confirmed to omit bodies |

Before choosing, confirm the contract question above with one authenticated read of `GET /content/posts` (not made in Phase 2A).

**Sitemap note (Phase 2D review item, recorded only).** `/collections` (the index) is not in today's sitemap. Whether to list `/collections`, `/en/collections` and `/ja/collections` is for the Phase 2D review. Phase 2A does not touch `app/sitemap.ts`, and the existing collection detail URLs are unchanged.

### 16.1 OD-9 content audit: fallback-language and incomplete content (2026-10-28; the policy built on it is OWNER APPROVED, §14)

This is the evidence the OD-9 approval rests on. Read-only: GET requests to the public site (a few thousand page fetches over four passes, at low concurrency with retries) plus the repository. **No Hub credential was used and no Hub endpoint was called directly**; the Hub was observed only through what the site renders.

**Method.** The measured text is the **rendered body**, not metadata: the product "About this piece" (作品について) section, the collection and category intro paragraph, the blog article body, every FAQ question and full answer (from the FAQPage JSON-LD), and the whole `<main>` text of each guide and static page. Japanese text means CJK characters; an English body on a Japanese page is a fallback. **Latin brand names, model codes and specification strings are not counted as untranslated:** a page is judged by its surrounding text, and a body made only of a Latin brand or model echo is classed neutral. Confidence: VERIFIED = measured on the rendered page; INFERRED = follows from verified facts; UNVERIFIED = needs an authenticated Hub read.

| Group | Examined | Complete English | Complete Japanese | Incomplete English | Incomplete Japanese | Single-language only | Unknown / unverified |
|---|---|---|---|---|---|---|---|
| Products (pages) | 447 | 447 | 447 | 0 | 0 | 0 | 0 (see the 500 note below) |
| Categories (pages) | 5 | 5 | 5 | 0 | 0 | 0 | 0 |
| Collections (pages) | 12 | 12 | 12 | 0 | 0 | 0 | 0 |
| Blog posts | 2 | 2 | 1 | 0 | 0 | 1 | 0 |
| FAQ items (the FAQ page itself exists in both) | 45 English, 31 Japanese | 45 | 31 | 0 | 0 | 14 English-only | 0 |
| Guides (pages) | 2 | 2 | 2 | 0 | 0 | 0 | 0 |
| Static, company and legal (pages) | 14 | 14 | 14 | 0 | 0 | 0 | 0 |

**Detail behind the counts**
- **Products (VERIFIED; final instrumented pass 2026-10-28, every fetch attempt logged).** All 447 reached in both languages. Five evidence categories, so a missing body is never silently counted as either complete or incomplete:
  | Category | Count | Meaning |
  |---|---|---|
  | Verified localized | 355 | Japanese body of 30+ characters, Japanese name; English body present |
  | Correctly localized, short description | 75 | A genuine Japanese body under 30 characters (e.g. 「PT900の一粒パールピアスです。」). Short is not incomplete: these are real Japanese sentences. An early draft misread 23 of them as fallback because it used a character threshold as language detection; corrected, and the policy below deliberately avoids authoritative word counts |
  | No description body in either language | 16 | Names complete in both languages; nothing to fall back to. Kept as its own evidence category: eligibility rests on the name alone |
  | Proper-name echo | 1 | `p2722-wallet-louis-vuitton…`: both bodies are exactly the Latin brand and model name beside a Japanese product name. Reviewed: this is catalogue data (the description equals the product name), not an English sentence shown to a Japanese reader. Classed eligible under the policy's neutral-text rule; whether such a page should stay indexable is explicitly an owner call in the policy |
  | Genuinely fallback-language body | **0** | No Japanese page shows an English sentence as its body |
- **The intermittent HTTP 500 (UNVERIFIED, not reproduced).** One product returned 500 in 2 of 4 early passes. Two later instrumented passes (every attempt logged, 894 fetches each) and a single-attempt status sweep saw **zero** non-200 responses, so the page is classed reachable, and the 500 stays recorded as an unreproduced transient with an unknown cause until server logs are checked (owner/Vercel dashboard).
- **Collections and categories (VERIFIED).** All have a Japanese name and an intro in both languages.
- **Blog (VERIFIED, with INFERRED cause).** `why-cha-jewels-care-behind-every-piece` is complete in both. `how-cha-jewels-began` is English-only (200 English, 404 Japanese, 7,137 characters of English body). Its absence from the sitemap, which omits only blank-slug, `layaway_only` and unpublished posts, indicates it is excluded by the layaway rule rather than by missing Japanese text (INFERRED, high confidence).
- **FAQ (counts VERIFIED).** One English item carries a Japanese service name in its question ("Can I pay with Paidy (あと払い)?") and is counted complete: a proper name. Of the 14 English-only items, the per-section counts (payments-and-layaway 8, orders-and-live-selling-claims 2, shipping 2, loyalty-points-and-store-credit 1, trade-program-and-wholesale 1) never exceed the number of English items that use layaway wording in that section (8, 3, 2, 1 and 1), and the Japanese FAQ contains none. So all 14 are consistent with being layaway-related (INFERRED). Items carry no id, so they cannot be paired one to one across languages: per-item proof is UNVERIFIED.
- **Guides and static pages (VERIFIED).** Both languages render with the right `<html lang>` and a Japanese share of letters of 0.75 to 1.00 on the Japanese side and at most 0.01 on the English side.

**Limitations (precise).** (1) This sees only what the site renders. It cannot enumerate inactive or unpublished products, posts with no title in a language (they are not listed), or FAQ rows the site drops, so it is **not an inventory of the Hub**. (2) It cannot read the Hub fields, so it cannot tell a null `description_ja` from a Japanese description; it detects the rendered fallback, which is the thing that matters for indexing. (3) Per-post body existence cannot be established from the list route alone (the contract and a code comment disagree). An authenticated, read-only pass over `GET /catalog/products`, `/catalog/collections`, `/catalog/categories`, `/content/posts` and `/content/faq` would close all three; it was not made here. (4) A single point in time: the product count was 449 at the Phase 1 baseline and 447 now.

**OD-9 policy (OWNER APPROVED 2026-10-28; the §14 text is authoritative).** Today the rule would change nothing: **0 of 447 product pages and 0 of the other audited pages are genuine fallback pages**, so this is insurance against future imports, not a content project.
- A localized page is **eligible** when its name is in that language, or is a proper name or model code with the rest of the page in that language, **and** any body it shows is in that language. A body that is a Latin brand or model echo, a specification string or a code is neutral. A page with no body at all is eligible on its name alone.
- A page whose body is **another language's running text** is **ineligible**: `noindex, follow`, left out of the sitemap, no hreflang pair, still reachable by link; it returns to normal when the Hub gains the text. "Running text" is decided by what the text is, not by a count: on a Japanese page, a body that contains no Japanese characters **and** is not neutral (not the product's own name, brand, model code or a specification string) is running foreign text. Word or character counts may serve as a tie-breaker inside the implementation but are never the detector — the 75 short-Japanese-description products are exactly the pages a count-based rule would misclassify.
- Implemented as one pure, tested function; the audit script is re-run after each catalogue import and before every release.
- Decided with the approval: the neutral-text rule stands, and the proper-name echo case (the Louis Vuitton wallet) is eligible neutral catalogue content.

## 17. OD-15 design: URL authority, cookie, and layaway gating (OWNER APPROVED 2026-10-28, with the §14 security requirements)

This is the approved implementation design; the §14 security requirements bind it. Nothing here changes payment or checkout code, and the Hub's calculations are untouched.

**What exists today.** Four server-side layaway gates ask `layawayOfferedNow()`, which reads the **language cookie**, not the page the customer is on: `quoteAction` (`lib/checkout-actions.ts:122`), `payLayawayAction` (`:233`), `pesoEstimateAction` (`:332`) and `layawayQuote` (`lib/layaway.ts:31`). `payAction` and `payLayawayAction` also pass `getLang()` to the Hub for the language of the result. Every layaway page and component takes `lang` from the same cookie-or-Accept-Language resolution (`lib/i18n-server.ts`). The Japanese restriction is therefore enforced by cookie, and the language is self-selected: the code already states this is **not a security boundary**, only a guard against an inconsistent state.

**The failure to prevent.** With locale URLs, a customer on `/en/…` can hold a stale `ja` cookie (a second tab switched the language, or a first visit was detected as Japanese). They see the layaway UI, and the action then refuses with `LAYAWAY_UNAVAILABLE`.

**Design**
1. **The locale URL is the authoritative display language on `/en/*` and `/ja/*`.** The middleware already sees the path (`x-cj-path`). It additionally sets a request header `x-cj-lang` to the URL's locale (`localeOf`, Phase 2A). `getLang()` resolves in the order: URL locale header, then cookie, then `Accept-Language`, then the default. One function, one rule, with a pure unit-tested core in `lib/i18n.ts`. Private routes have no URL locale, so they keep the existing cookie resolution.
2. **Cookie synchronization.** On a response for a locale route the middleware sets `cj-lang` to the URL locale (same name, path, max-age and `sameSite` as today), and also sets it on the request so the render in progress sees it. It never writes the cookie on private or unprefixed routes and never changes the `?lang=` handling. The decision is a pure function (`cookieSyncFor(pathname, cookieLang)`) so it can be unit-tested, since the middleware itself cannot be imported by the test harness.
3. **Explicit language to the four gates.** Add an optional `lang` to each gate's input (`quoteAction` input object, a third parameter on `payLayawayAction`, `pesoEstimateAction` input, a fourth parameter on `layawayQuote`). A pure `gateLang(explicit, cookieLang)` returns the explicit value when it is a valid locale and the cookie language otherwise, and the gate becomes `layawayOffered(gateLang(...))`. Every client caller passes the **`lang` prop it rendered with**, so the action judges what the customer was actually shown. A missing or invalid value behaves exactly as today, so the change is backward compatible and can ship before any caller uses it.
4. **The Japanese restriction is preserved.** An explicit `ja` is refused for layaway even if the cookie says `en`. A request that omits `lang` on a Japanese cookie is refused as today. An explicit `en` with a `ja` cookie is allowed, which is the intended two-tab fix; it grants nothing a customer could not already do by choosing English, because the language is self-selected. `layawayOffered`, `LAYAWAY_LANGS`, the agreement gates, the unlaunched-term refusal and the `LAYAWAY_UNAVAILABLE` code are unchanged.
5. **Hub-controlled behaviour is untouched.** Money comes only from the Hub: `hub.layawayQuote` takes no language at all. `hub.pay` and `hub.payLayaway` already receive a language today; how the Hub uses it is not visible from the website (UNVERIFIED), so the design changes only *which* value is passed (the page's language, the same one the customer saw) and nothing else about those calls. No figure is computed or converted on the website.
6. **Downstream private pages.** After a successful layaway payment the action sets the cookie to the explicit language when it differs, so `/checkout/complete/d/[draft_id]` and `/account/layaway*`, which gate on the cookie, do not 404 a customer who has just paid in English from a stale-cookie tab (this exposure exists today; the sync closes it).
7. **The temporary bare `/layaway` links** (Option ii) are navigations, not actions. A two-tab customer with a `ja` cookie who clicks one still gets the 404; this is rare and is accepted and tested, not engineered around. An optional `?lang=en` on those links would make them immune but changes the preserved link text, so it is a separate owner question and is not proposed.

**Compatibility.** Account and checkout flows keep cookie language for rendering; locale visits keep the cookie in step. The agreement flow, Paidy, card and COD paths are not edited. Only the four gates and `payLayawayAction`'s cookie write touch `lib/checkout-actions.ts`: **run that change on Opus**, with a reviewer reading the diff for money logic (there should be none).

**Security review (2026-10-28), against the actual actions and routes.**

- **Which controls are what.** Server-enforced **business rules**, unchanged by this design: the signed-agreement gates (fail closed, `agreement_required` / `agreement_unverified`), the unlaunched-term refusal (`TERM_NOT_LAUNCHED`), the signed-out refusals, and every money figure (Hub only). **Language-based presentation restrictions**: the four `layawayOfferedNow()` gates — the code already documents them as "NOT A SECURITY BOUNDARY", because the language is self-selected (any visitor can choose English and get layaway). The design keeps that classification: it changes which self-selected signal the gate reads, never what the gate protects.
- **No new authorization or payment bypass.** The explicit `lang` can only ever be `"en"` or `"ja"` after `isLocale` validation; anything else falls back to the cookie path, which is today's behaviour. An explicit `en` grants exactly what setting the cookie to `en` already grants. The agreement, term, auth and Hub-side gates run after the language gate and are untouched, so no payment path is reachable that was not reachable before. The one direction that changes is **stricter**: an explicit `ja` is refused even when the cookie says `en`.
- **Trusted locale context.** `x-cj-lang` is trustworthy only if the middleware **sets it on locale routes and deletes it on every other matched request**, exactly as the middleware already snapshots headers for `x-cj-path`; a client-sent `x-cj-lang` must never survive. Paths the middleware does not match get no header and keep cookie resolution (the same fail-safe shape as `x-cj-path`). This is a hard requirement of the design, with a test.
- **Private checkout and account routes** stay unprefixed and cookie-resolved; the cookie sync happens only on locale-route responses, so no private route's language resolution changes. **Payment-return and confirmation routes** (`/checkout/complete/*`, `/account/orders/[id]/pay-card`, `/account/layaway/*`) are full page loads on unprefixed paths: the pay-card CSP path rule (`isPayCardPath`) and the Paidy/card return URLs see identical paths. The only change that touches them is the post-payment cookie write in point 6, which prevents a 404 and reveals nothing.
- **Cookie synchronization timing.** The middleware writes the cookie on the request as well as the response (the codebase's established pattern for the language cookie), so the render in progress and the next request agree; the post-payment write in the action covers the one case the middleware cannot see (an action succeeding under a different explicit language than the cookie).
- **Backward compatibility.** Every gate treats an absent or invalid `lang` exactly as today; the change can ship with no caller updated and nothing moves.
- **Japanese prohibition.** `/ja/layaway` cannot be produced (Phase 2A family table), layaway UI renders only where `layawayOffered(lang)` with the URL-authoritative `lang`, and an explicit `ja` is refused at all four gates. `check:layaway-ja` continues to guard the strings.

**Tests.** Pure tests for `gateLang`, for `resolveLang` with a URL locale, and for `cookieSyncFor`. A table test of the two-tab matrix: explicit `en` with cookie `ja` allowed; explicit `ja` with cookie `en` refused; no explicit with cookie `ja` refused; invalid explicit falls back to the cookie. A source guard that no `layawayOfferedNow()` call remains without an explicit argument at the four gates, and a middleware test (pure helper) that a client-sent `x-cj-lang` is always overwritten or deleted. A fixtures-mode flow on the local build that requests a layaway quote on `/en` with a `ja` cookie and stops before any order. **No order, draft or payment is created by any test.**

**Rollout inside 2C.** The explicit-argument change lands first and is backward compatible; the cookie sync arrives with the 2B locale routes; locale-aware links are activated only after the two-tab test passes.

---

## 18. Phase 2B execution specification (2026-10-28)

**Status: READY FOR GATE A. Not authorized to implement.** Approving OD-9, OD-15 and C0/H0 did not authorize creating, merging, publishing or deploying any route; that is Gate A below.

### 18.1 Exact route inventory (for the Gate A approval)

Locale homes `/en` and `/ja`, plus `/en/<path>` and `/ja/<path>` for the existing public families, **unrenamed**, and only where the language version exists and is eligible (OD-8, OD-9):

| Family (map §4) | Localized routes | Languages |
|---|---|---|
| R1 home | `/en`, `/ja` | both |
| R2 `/products/[slug]` | `/{en,ja}/products/[slug]` | both (eligibility per product, OD-9) |
| R3 `/categories/[slug]` | `/{en,ja}/categories/[slug]` | both |
| R4 `/collections` | `/{en,ja}/collections` | both |
| R5 `/collections/[slug]` | `/{en,ja}/collections/[slug]` | both |
| R6 `/blog` | `/{en,ja}/blog` | both |
| R7 `/blog/[slug]` | `/{en,ja}/blog/[slug]` | **per post**: only a language with title + body, and the layaway rule (F2) |
| R8-R17 `/jewelry-guide`, `/shopping-guide`, `/faq`, `/about`, `/why-cha-jewels`, `/contact`, `/affiliations`, `/loyalty`, `/sale`, `/wholesale` | `/{en,ja}/<same>` | both |
| R18 `/legal/{privacy,terms,returns,tokusho}` | `/{en,ja}/legal/<same>` | both (statutory suppressions preserved, F3) |

**Excluded, by decision:** `/` unchanged (OD-3); bare legacy URLs byte-identical (C0/H0); `/en/layaway` and `/ja/layaway` (Phase 3 / never); `/en/shop/*`, `/ja/shop/*`, new guide clusters (later phases); localized private, account or checkout routes (map §5); legacy redirects (2E); internal navigation link changes and locale sitemap entries (2C/2D — in 2B nothing links to or lists the new URLs).

### 18.2 Implementation design (review only; no source edited)

| # | Element | Design |
|---|---|---|
| A | Route organization | OD-10 = A: the R1-R18 pages move under `app/[lang]/…` with `generateStaticParams` limited to `en`/`ja` and an invalid `[lang]` answering 404; private routes stay at the root; the root `/` page stays where it is (OD-3) |
| B | URL-authoritative locale | `getLang()` resolution order becomes URL locale (from the request context), then cookie, then `Accept-Language`, then default — one rule in `lib/i18n.ts`, pure and unit-tested |
| C | `x-cj-lang` | Middleware-owned: set from `localeOf(pathname)` on locale routes, **deleted on every other request** so a client-sent value never survives (the `x-cj-path` pattern; OD-15 security requirement) |
| D | Cookie sync | Middleware writes `cj-lang` on locale-route requests and responses (existing cookie attributes); never on private routes; the OD-15 explicit-language argument (landing in 2C) is what closes the two-tab case — 2B is safe meanwhile because nothing links to the locale URLs |
| E | Canonical + hreflang | Per-page `generateMetadata` through one helper fed by `siblingPath` (structure) and the data eligibility answer (OD-9, F2): self canonical, reciprocal `en`/`ja` only when the sibling exists, is 200 and indexable |
| F | x-default | OD-2: the corresponding English URL; a single-language page names its own eligible URL |
| G | 404s | Locale-tree not-found pages emit **no canonical and no hreflang** (closing X1 there): unknown `[lang]`, unknown family, missing slug, ineligible language |
| H | JSON-LD | A pure builder extracted to `lib/json-ld.ts` (unit-testable, closing the JSX gap), rendered by the existing component; `url`, `@id`, `offers.url` locale-correct and equal to the page canonical; `inLanguage` from the page language |
| I | Blog eligibility | Existing Hub post-detail reads (`hub.post(slug)`, cached on the `content` tag): a language page exists only with that language's title + body and the layaway rule; no Hub contract change |
| J | Statutory pages | Already handled by Phase 2A (`lib/statutory-path.ts` looks past the prefix); re-verified on real `/en/legal/*`, `/ja/legal/*` renders: consent banner quiet, announcement bar absent, advertising parity |
| K | Private routes | Unchanged paths, unchanged behaviour; Phase 1 noindex policy tests keep passing; `classifyPath` becomes the live classifier for the locale tree only |
| L | Legacy pages | Byte-identical metadata (C0/H0): the 35-route snapshot must show zero differences; `SeoLinks` keeps serving the unprefixed tree unchanged |
| M | Layaway | No `/en/layaway` or `/ja/layaway` (the 2A family table already cannot produce them); English layaway links stay on bare `/layaway` (Option ii); layaway UI renders only where `layawayOffered(lang)` with the URL-authoritative language; `check:layaway-ja` green |

### 18.3 Preview and build safety

- Feature branches get no Vercel build (Ignored Build Step); the only deployed preview is the **`develop` alias** (`cha-jewels-web-git-develop-cha-jewels.vercel.app`), verified again 2026-10-28: Vercel SSO (302) + `x-robots-tag: noindex`. **Merge-to-preview risk:** 2B code must merge to `develop` before any deployed preview exists, so the pre-merge gates below are the protection; `develop` is not production (release to `main` is a separate owner-gated PR), and the rollback is reverting the merge on `develop`.
- **Mandatory pre-merge protections:** full local checks (unit, typecheck, lint, `check:terms`, `check:money`, `check:i18n`) **and a local production build** (`next build`) whose route table is inspected; the 35-route legacy snapshot and the locale route matrix run against the local production server. CI runs no build (recommendation to add one stands, needs approval).
- UNVERIFIED (owner/dashboard): Preview environment-variable targets (live Hub vs fixtures); a safe test customer account. Supabase redirect allow-list covers the `develop` alias per `docs/CLAUDE-DETAILS.md:48`; sign-in tests only from the alias. No automation-bypass credentials exist or will be created without authorization; no test orders, drafts, payments or refunds, ever.

### 18.4 Release gates (none skipped or combined)

| Gate | Content |
|---|---|
| A | Owner approves the §18.1 inventory and gives **written authorization to implement Phase 2B** |
| B | Implementation on a dedicated branch (proposed: `seo/phase-2b-locale-routes`) |
| C | Unit, typecheck, lint, terminology, money and language guards all pass |
| D | Local production build passes; route table inspected |
| E | 35-route legacy snapshot byte-identical |
| F | Localized routes pass the SEO route matrix (§12 rows for 2B) |
| G | PR reviewed and approved (not self-merged) |
| H | `develop` preview deployed and validated (manual smoke via SSO, or approved automation bypass) |
| I | Owner separately authorizes the production release (`develop` → `main` PR) |
| J | Production deployment verified by actual route checks (recorded output, never the expected numbers) |
| K | No customer-facing locale links or locale sitemap entries activate until Phases 2C/2D, each under its own approval; C0/H0 reconsidered at the 2C gate |

**Rollback:** revert the 2B merge on `develop` (locale URLs return to 404; nothing links to them, so no customer path breaks); after a production release, revert the release merge on `main` — legacy URLs are untouched throughout, so working URLs are preserved at every stage.


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
| E12 | Three existing checks gate **statutory-page compliance** behaviour on the literal path `/legal` and `/legal/*`: the consent banner stays quiet and ad tags do not load (two of the ten client components that read `usePathname()`), and the **announcement bar is suppressed** by `bannerAllowed` in the root layout, which reads the `x-cj-path` header and fails safe (no header means no bar) because the Specified Commercial Transactions Act notice must not have a marketing strip over it. | `components/site/consent-banner.tsx:46`, `components/analytics/ads-tags.tsx:99,140`, `app/layout.tsx:70-84` (`bannerAllowed`) |
| E13 | Existing permanent redirect: `/gold-guide` to `/jewelry-guide#metals` (308, `next.config.ts`). | `next.config.ts:37-39` |
| E14 | Share links add `?lang=en` for English (`lib/share.ts:24-29`), so English `?lang=en` URLs already exist in the wild. | `lib/share.ts` |
| E15 | Next.js 15 docs (Context7, v15.1.8) support: an `app/[lang]` segment with `generateStaticParams`; `alternates.canonical`/`languages` in `generateMetadata`; `alternates.languages` per entry in `sitemap.ts`; redirects in `next.config.ts` (308 when `permanent: true`, run before middleware); middleware locale redirects. The installed version is 15.5.25; behaviour at that exact version is UNVERIFIED and must be re-checked at implementation. | Context7 |

### 2.1 Verified findings the design must honour

| ID | Finding | Requirement for Phase 2 |
|---|---|---|
| **F1** | **Locale/cookie mismatch affects layaway** (E6, E7). Layaway server actions decide from the cookie language, not from the page. | A request on `/en/…` must never be denied layaway merely because a stale `ja` cookie remains (for example a second tab that switched to Japanese). The URL language is authoritative; the fix mechanism is OD-15. |
| **F2** | **Blog posts may exist in only one language** (E8). The sitemap does not check this today (E10). | Locale sitemap, canonical and hreflang logic must not invent a sibling page that does not exist: no `ja` alternate for an EN-only post and no `en` alternate for a JA-only post; layaway-only posts are English-only. Per-language existence needs a title and a body, and the Hub list route returns no body. |
| **F3** | **Consent, advertising and announcement-bar checks depend on `/legal/*`** (E12): the consent-banner path check, the advertising-tag path check, **and `bannerAllowed` announcement-bar suppression**. | Locale prefixes must not break statutory-page compliance behaviour. **Localized statutory pages must retain the existing suppression behaviour exactly**: on `/en/legal/*` and `/ja/legal/*` the cookie banner stays quiet, ad tags stay off **and no announcement bar renders**, as on `/legal/*` today. All three checks are re-based on the unprefixed path and tested in Phase 2A, before any prefixed page exists, and the `bannerAllowed` fail-safe (no path header means no bar) is preserved. |
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

### Mechanism options (ARCHITECTURE DECISION REQUIRED, OD-10)

| | **A. `app/[lang]/…` segment** | **B. Middleware rewrite** (`/en/x` served by the existing `/x` page, language from a header) |
|---|---|---|
| File churn | Move about 38 page files under `app/[lang]/`; private routes stay at the root | None for pages; middleware and link helpers only |
| Idiomatic to Next docs | Yes (E15) | No |
| Canonical/hreflang | Per-page `generateMetadata` with `alternates` works natively (`/en` is not `/`, so the original reason for `SeoLinks` disappears) | Page must still compute its public path |
| **X1 (404 canonical) fix** | **Yes**: unknown pages have no `generateMetadata`, so emit nothing; layout no longer injects tags | No: unknown routes still render the root layout |
| `usePathname()` | Returns the real prefixed path | Likely the browser path (UNVERIFIED), so prefixed too |
| Rollback | Revert a large mechanical move | Remove one middleware block (smaller) |
| Static rendering later | Possible (layout can read `params` instead of cookies) | Not without more work |

**Proposed recommendation (not a decision):** A, delivered in sub-phases (§15), because it resolves X1 with the standard metadata API and is the documented pattern. B is the lower-churn fallback. Either way the root `app/layout.tsx` keeps the site chrome and takes the language from one place (the URL segment on locale routes, the cookie on private routes).

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

**Interim canonical AND hreflang behaviour of bare legacy URLs: PROPOSED — OWNER APPROVAL REQUIRED. Not approved architecture.**

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
- **x-default.** Today's x-default is the bare Japanese URL. OD-2 may move it to `/en/<page>` (the recommendation, not a decision). Until it is approved the legacy x-default stays as it is, and the locale pages must not name a bare legacy URL as x-default.
- **No claim of consolidation.** Neither option moves ranking signals until the 2E redirects exist and are recrawled.

Until one canonical option **and** one hreflang option are approved in writing, **Phase 2B must not change any legacy page's canonical or hreflang** (that is C0 + H0). Changing either is a change to live pages and needs the route-change approval described in §15. OD-1, OD-2, OD-3 and OD-4 all remain unresolved.

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

`components/site/consent-banner.tsx:46` (`/legal` quiet rule), `components/analytics/ads-tags.tsx` (`adsLoadsOn(pathname)`), **`app/layout.tsx:70-84` (`bannerAllowed`, announcement-bar suppression on `/legal` and `/legal/*`)**, `components/analytics/metricool-tracker.tsx`, `lib/analytics.ts`, `tests/consent-ads.test.mjs`. A prefixed `/en/legal/tokusho` that no longer matches `/legal/` would show the cookie banner **and the announcement bar** on the statutory notice and could load ad tags there. **High.** The other literal-path checks found (`lib/metricool.ts`, `lib/ads.ts`, `isPayCardPath`) key on `/account/*` or the pay-card path, which stay unprefixed, so they are unaffected.

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
| Blog | List an entry for a language only if the post has a title **and** body in it. The list route lacks the body (E8), so this needs a Hub read per post or a Hub list field (a Hub contract question: raise it, do not assume) |
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
| Compliance | `/en/legal/{privacy,terms,returns,tokusho}`, `/ja/legal/{privacy,terms,returns,tokusho}` | consent banner stays quiet; ad tags not loaded; **no announcement bar renders even when the Hub has an active announcement** (E12, F3) |
| | `bannerAllowed` unit cases | `/legal`, `/legal/x`, `/en/legal/x`, `/ja/legal/x` suppressed; `null`/absent path header suppressed (fail-safe); `/en`, `/ja`, `/en/products/x`, `/en/legalx` not suppressed |
| | Same checks on the unprefixed `/legal/*` | unchanged |
| JSON-LD | Product, BlogPosting, store | `url`/`@id` are locale URLs; `inLanguage` correct; parses |
| Revalidation | `POST /api/revalidate` for a product/post/collection | both locale URLs are refreshed |
| Regression | `scripts/check-seo-live.mjs` | updated for the locale matrix (its current expectation of canonical + three alternates on bare URLs changes by design, see X2) |
| Unit | `lib/seo-policy.ts`, a new locale helper | policy paths with and without a locale prefix; sibling-path mapping |

---

## 13. Risk report

**Highest-risk files:** `middleware.ts` (language, path header, auth gate, CSP all in one function), `app/layout.tsx`, `lib/page-meta.tsx`, `lib/i18n.ts`, `components/site/header.tsx` / `footer.tsx` / `mobile-nav.tsx` / `search-box.tsx`, `app/sitemap.ts`, `next.config.ts`, `app/api/revalidate/route.ts`, `lib/share.ts`, `components/site/json-ld.tsx`, `components/site/consent-banner.tsx` / `components/analytics/ads-tags.tsx`, and `bannerAllowed` in `app/layout.tsx`.

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
| K8 | **Compliance gates keyed on `/legal/*`** (consent banner, ad tags, **announcement-bar suppression `bannerAllowed`**) break under a prefix (E12, F3) | Re-base all three checks on the unprefixed path first, keep the `bannerAllowed` fail-safe, with tests (Phase 2A) |
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

**Resolved, no longer owner decisions:**

| Was | Resolution |
|---|---|
| OD-13 locale-home trailing slash | Technical convention: `/en` and `/ja`, existing `trailingSlash: false` kept (§3) |
| OD-14 Phase 2 path structure | Existing route families move under locale prefixes; master-plan §22 `/shop/*` and `/guides/*` stay future-phase architecture (§3) |
| OD-5 old shared/bookmarked bare URLs | Merged into OD-1 (same URLs, same answer) |

**Remaining decisions at a glance:**

| # | Decision | Recommended | Must be decided before |
|---|---|---|---|
| OD-1 | Destination of bare legacy URLs (includes old shared/bookmarked links) | L2, introduced as temporary first | **2E**; also feeds the interim canonical and hreflang question (§7) that gates 2B changes to legacy pages |
| OD-2 | x-default | `/en/<same page>` | **2B** |
| OD-3 | Behaviour of `/` | Redirect by language signal (same pattern as OD-1) | **2B** (x-default dependency; also feeds the interim canonical and hreflang question, §7); built in 2E |
| OD-4 | `?lang=` URLs | 308 to the locale URL, indefinitely | **2E** (share links in 2C); also feeds the interim canonical and hreflang question (§7) |
| OD-6 | Legacy `/layaway` | 308 to `/en/layaway` once Phase 3 is live | **Phase 3 / 2E** |
| OD-7 | Switcher where no sibling exists | Link to the other language's home | **2C** |
| OD-8 | Single-language pages | Confirm: index only the language that exists | **2B** |
| OD-9 | Fallback-language content | Audit first; interim `noindex, follow` + no sitemap + no hreflang pair | **2B** (rule), **2D** (enforcement) |
| OD-10 | Mechanism: `app/[lang]` or rewrite | `app/[lang]` | **2B** (2A stays neutral) |
| OD-11 | Hub-authored relative links | Localize at render time | **2C** |
| OD-12 | Hreflang in the sitemap too | HTML only | **2D** |
| OD-15 | Cookie role and sync | Both: middleware sync and an explicit language argument | **2B** (design); argument in 2C |

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

### OD-2: x-default

| | |
|---|---|
| **Options** | `/ja/<same page>`; `/en/<same page>`; a language-selector page; the bare `/` |
| **Recommended** | `/en/<same page>` where an English sibling exists; for a single-language page, the page itself |
| **Reason** | x-default serves users whose language matches neither `en` nor `ja`. The application's own rule (`detectLang`) already sends unmatched languages (Tagalog, Chinese, German…) to English, so this agrees with documented behaviour. Today's x-default is the Japanese bare URL, so this is a deliberate shift; the alternative is defensible. A selector page needs a new route and content and is not recommended now |
| **SEO impact** | Low to medium: decides which version Google offers to unmatched-language searchers |
| **Customer / business impact** | Japanese and English readers are matched by `ja` / `en` and are unaffected |
| **Reversibility** | Metadata only; fully reversible |
| **Needed before** | Phase 2B (hreflang is first emitted there) |

### OD-3: Behaviour of `/`

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

### OD-8: Single-language pages

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

### OD-9: Fallback-language content

| | |
|---|---|
| **Options** | Index anyway; `noindex` until the text exists; keep indexable but out of the sitemap |
| **Recommended** | **Audit first.** A read-only content-completeness audit (how many products, collections, categories, posts and FAQ rows lack text in a page language; scale UNVERIFIED) should precede the rule. Interim recommendation: a locale page whose primary visible text is not in the page's language gets `noindex, follow`, stays out of the sitemap and has no hreflang pair, and returns to normal when the Hub gains the text |
| **Reason** | Thin wrong-language pages dilute hreflang clusters and invite duplicate treatment; but over-applying `noindex` across hundreds of products would hide real pages, which is why the audit comes first |
| **SEO impact** | Protects quality; the risk is over-noindexing |
| **Customer / business impact** | None: the pages stay reachable |
| **Reversibility** | Metadata only |
| **Needed before** | The audit before Phase 2B entry; the rule before 2B (metadata); enforcement in 2D (sitemap) |

### OD-10: Mechanism

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

### OD-15: Cookie role and sync (finding F1)

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
| **Files likely affected** | New `lib/locale.ts` (`LOCALES`, `localePath`, `stripLocale`, `siblingPath`); `lib/seo-policy.ts` (match with or without a locale prefix, unprefixed behaviour unchanged); `components/site/consent-banner.tsx`, `components/analytics/ads-tags.tsx`, `components/analytics/metricool-tracker.tsx`, `lib/analytics.ts` (use the stripped path); **`app/layout.tsx` (`bannerAllowed` re-based on the stripped path, `x-cj-path` fail-safe preserved)**; `scripts/check-seo-live.mjs` (matrix scaffolding, expectations unchanged); the OD-9 content-completeness audit (read-only). The re-based logic should live in one shared helper that all three compliance checks call, so the three cannot drift |
| **Tests required** | Unit tests for the helpers (including "no sibling" cases); policy tests with and without prefix; compliance tests so `/legal/*`, `/en/legal/*` and `/ja/legal/*` all keep **the banner quiet, ad tags off and the announcement bar suppressed** (F3), including the `bannerAllowed` cases in the §12 matrix and the null-header fail-safe; the full existing suite |
| **Entry criteria** | Owner approval of 2A. No owner decision is required; 2A is mechanism-neutral |
| **Exit criteria** | All checks green; verification may be a **local build plus the regression tests** (a deployed preview is not required for 2A): `scripts/check-seo-live.mjs` output identical before and after against the local build, head metadata of a sample of public routes byte-identical, and the three statutory-page suppressions proven unchanged on unprefixed `/legal/*`; audit results written up |
| **Rollback** | Revert the PR. No behaviour to unwind |

### Phase 2B: locale public routes and metadata

| | |
|---|---|
| **Behaviour introduced** | `/en/…` and `/ja/…` serve R1-R18 (not layaway). Per-page canonical and hreflang through one helper. Language read from the URL; cookie synced on locale responses. Unknown locale and `/ja/layaway` return 404. **Structured data on each locale page (Product, BlogPosting, FAQPage, store) carries locale-correct `url`, `@id`, `offers.url` and `inLanguage`, equal to that page's own canonical URL and language** (N2): a localized page must not publish structured-data URLs that disagree with its canonical. Legacy bare URLs keep serving 200; their canonical **and hreflang** stay unchanged (C0 / H0, §7) unless an interim option has been approved in writing. **Nothing links to the new URLs and the sitemap does not list them yet** (unlinked dark launch; these are the safeguards under which 2B may proceed with the stale-cookie risk still open, see N4 below) |
| **Files likely affected** | Option A: `app/[lang]/…` (moved pages), `app/layout.tsx`, `lib/i18n.ts`, `lib/i18n-server.ts`, `middleware.ts`, `lib/page-meta.tsx` (`SeoLinks` retired for the locale tree), `components/site/json-ld.tsx`. Option B: `middleware.ts` and the metadata helper |
| **Tests required** | §12 locale-route, canonical, hreflang, x-default, 404, content-language, JSON-LD and private-route rows; unit tests for the metadata helper and sibling mapping; an updated route-check script |
| **Entry criteria** | 2A merged and verified; **OD-2, OD-8, OD-9 (audit and rule), OD-10, OD-15 (design), and OD-3 if x-default uses `/`** answered; written route-change approval for the new routes; **an approved interim canonical option **and** hreflang option for legacy bare URLs (§7, which depend on OD-1 to OD-4), or explicit agreement that legacy canonicals and hreflang stay unchanged (C0 + H0)**; a working preview for the branch |
| **Exit criteria** | Every R1-R18 locale URL returns 200 on the preview and then production; hreflang reciprocal for a sample of every family, never to a 404, redirect or noindex page; X1 closed in the locale tree (404s there emit no canonical or hreflang); legacy pages unchanged (including their canonical and hreflang, unless an interim option was approved); **parsed JSON-LD on a sample of every family has `url`, `@id`, `offers.url` and `inLanguage` equal to the page's canonical locale URL and language, and no structured-data URL points at a bare legacy URL** (N2); statutory-page compliance verified on locale legal pages (consent banner quiet, ad tags off, **announcement bar suppressed**); checkout and layaway journey from `/en` passes with a refreshed cookie. **N4:** a refreshed cookie alone does **not** close the two-tab / stale-cookie case (F1); 2B is acceptable only because it is unlinked and unlisted, and the 2B exit does not claim F1 is resolved |
| **Rollback** | Revert the PR. The locale URLs then return 404, which is low impact because nothing links to or lists them yet. Legacy canonicals return to self |

### Phase 2C: internal links, switcher and locale-aware application behaviour

| | |
|---|---|
| **Behaviour introduced** | Every public link is locale-aware **except the temporary layaway exception (Option ii, §6 and §9 F)**: the existing working English layaway links stay on the legacy `/layaway`, and nothing points to `/en/layaway` until Phase 3 has created and validated it. Switcher links to the sibling URL (OD-7). Share links use locale URLs. Hub text and the announcement bar are localized at render time (OD-11). Revalidation refreshes both locale paths. Sign-out lands on a locale-aware page. The **language-authoritative layaway gating correction** (OD-15) makes the layaway-gating actions use the page language explicitly, so a stale cookie cannot refuse an English page's layaway (F1); Hub-controlled money and layaway behaviour is preserved and only the language the gate receives changes. Structured-data URLs were already made locale-correct in 2B (N2); 2C changes link-generating components only. **No Japanese layaway offering is introduced** (exception links render only when `layawayOffered(lang)` is true; none on `/ja/*`) |
| **Files likely affected** | The link groups in §9 A-D (the §9 F layaway links excepted): header, footer, mobile-nav, mobile-tab-bar, search-box, nav components, home and catalogue components, content pages, `lib/content/*`, `lib/markdown.ts`, `lib/settings.ts`, `components/site/lang-switcher.tsx`, `lib/share.ts`, `app/api/revalidate/route.ts`, `lib/session-actions.ts`, `lib/checkout-actions.ts` (language argument only; money logic untouched, Opus review) |
| **Tests required** | A link-crawl test with two assertions: **no internal navigation link resolves to HTTP 404**, and no internal link to a bare legacy public URL except the documented layaway exception (§9 F); layaway-exception tests (links are bare `/layaway` on English pages, resolve 200 for English, absent on every `/ja/*` page, `check:layaway-ja` passes); switcher tests including the no-sibling case; the two-tab layaway test; markdown and announcement localization unit tests; revalidation test; compliance rows (including the announcement bar); the checkout journey |
| **Entry criteria** | 2B deployed to production and verified; OD-7 and OD-11 answered; a deployed preview for the branch; written approval for the link-destination change, including the layaway exception as inventoried in §9 F. **Ordering inside 2C (N4):** the language-authoritative layaway gating correction (OD-15 argument) is merged and verified **before** any localized customer-facing link is activated; a refreshed cookie alone is not sufficient |
| **Exit criteria** | **No internal navigation link may resolve to HTTP 404.** A crawl finds no internal link to a bare legacy public URL other than the documented layaway exception. The language-authoritative layaway gating correction is proven by the two-tab test (an `/en/…` page with a stale `ja` cookie is never refused layaway and its layaway link never 404s). The switcher never links to a 404. No layaway link, tab or page on any `/ja/*` page. Compliance gates verified (consent banner, ad tags, announcement bar). Route check green; checkout verified on the preview |
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

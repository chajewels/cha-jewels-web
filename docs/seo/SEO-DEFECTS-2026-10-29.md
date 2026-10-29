# SEO defect review — 2026-10-29 monitoring findings (website side)

Scope: the independently confirmed defects and open findings from the October 29 monitoring report that concern this repository, plus the website-side evidence for the Hub items. Hub items (BUG-01, BUG-04) are tracked in `chajewels/la-tracking`. Status vocabulary: CONFIRMED · FIXED LOCALLY · READY FOR QA · BLOCKED · NOT A BUG.

| ID | Finding | Status | Where |
|---|---|---|---|
| BUG-02 | Messenger chat link (`m.me/chajewelsjapan`) emitted as JewelryStore `sameAs` | **FIXED LOCALLY → READY FOR QA** | PR #423 `fix/bug-02-sameas-chat-links` |
| BUG-05 | `/already-registered` both disallowed in robots.txt and `noindex` in the page | **FIXED LOCALLY → READY FOR QA** | PR #424 `fix/bug-05-robots-already-registered` |
| BUG-08 | `SEO-IMPLEMENTATION-STATUS.md` opening still read "nothing merged or deployed" | **FIXED LOCALLY → READY FOR QA** | PR #425 `docs/bug-08-seo-status` (this file is in the same PR) |
| BUG-03 | Blog article carries origin wording outside the approved surfaces | **CONFIRMED — owner approval required (Hub content edit)** | §3 below |
| BUG-06 | `/gold-guide` takes two hops | **CONFIRMED — proposal only (route-change rule)** | §6 below |
| BUG-07 | `#payments-and-layaway` fragment on the Japanese FAQ | **NOT A BUG** | §7 below |
| BUG-09 | Google indexing of `/en/layaway`; product rich-result eligibility | **BLOCKED (Search Console) / PARTIAL evidence (Rich Results Test)** | §9 below |

## BUG-02 — chat link in `sameAs`
- **Root cause:** `lib/json-ld.ts` accepted every `http(s)` href of the Hub social row (`follow()`); the row holds the Messenger entry point, which is a conversation URL, not an identity page.
- **Fix:** `isProfileUrl()` keeps http(s) social profiles and drops chat hosts (`m.me`, `messenger.com`, `wa.me`, `api/chat.whatsapp.com`, `line.me`, `lin.ee`, `t.me`, `telegram.me`, `viber.com`); `mailto:` stays excluded. Visible footer links and the Messenger button are untouched.
- **Files:** `lib/json-ld.ts`, `tests/json-ld.test.mjs`, `docs/seo/SEO-QA-REPORT.md`, `docs/seo/phase-4/PHASE-4-REPORT.md`.
- **Tests:** unit 508/508 (9 positive / 15 negative `isProfileUrl` cases, real-row case → facebook only, only-chat row → no `sameAs`, source guard); typecheck 0; lint 0 errors; terms/money/i18n pass; build; `check-seo-live` 288/0 on the local build; home JSON-LD `sameAs` = facebook only.
- **Evidence note:** Google's Rich Results Test by URL on production `/en` (2026-10-29 15:41 JST) reports the JewelryStore as a valid Local business with only an optional `image` notice; it does not itself flag `m.me`. The exclusion stands on schema.org semantics and the independent finding.
- **Risk / approval / deployment:** none to money or checkout; normal `develop` → `main` release.

## BUG-05 — robots.txt vs noindex on `/already-registered`
- **Verified response (production, anonymous):** 200, `cache-control: private, no-store`, `<meta name="robots" content="noindex, nofollow">`, static owner wording and a contact button, signs the session out on mount; no query echo, no customer data.
- **Fix:** removed only that Disallow; `/account`, `/checkout`, `/api`, `/review/` stay blocked (test pins the exact set); `/already-registered` added to the "noindex pages must stay crawlable" test and to the live checker.
- **Tests:** unit 506/506, typecheck 0, lint 0, build, `check-seo-live` 289/0 on the local build.
- **Risk / deployment:** none; Search Console will later classify the URL as "Excluded by noindex" instead of "Blocked by robots.txt".

## BUG-03 — origin wording in `why-cha-jewels-care-behind-every-piece` (Hub content; NOT edited)
Rule (`docs/CLAUDE-DETAILS.md` Terminology): "Made in Japan" / 日本製 and generic origin phrasing appear only through `origin-badge.tsx` for a piece whose Hub `origin === "JAPAN"`, or in the exact approved clarifier sentence. The live article (fetched 2026-10-29) carries four sentences outside those surfaces. Exact before → after, two options for the owner:

| Lang | ¶ | Before (live) | Option A: remove the origin word | Option B: replace with the approved clarifier |
|---|---|---|---|---|
| EN | 10 | "Our collections include Japan-made K18 gold jewelry, pearls, diamonds, handmade gemstone bracelets, and preloved pieces." | "Our collections include K18 gold jewelry, pearls, diamonds, handmade gemstone bracelets, and preloved pieces." | same as A |
| EN | 13 | "New Japan-made jewelry reflects its makers’ work. Preloved branded jewelry carries the history and craftsmanship of its original brand. …" | "New jewelry reflects its makers’ work. Preloved branded jewelry carries …" | "Our new jewelry is made in Japan, and so are many of our preloved pieces. Preloved branded pieces are made by their original brands and authenticated in Japan. Handmade gemstone bracelets offer another way to enjoy color and personal style." (exact clarifier, EN) |
| JA | 11 | 「チャジュエルズでは、日本製のK18ゴールドジュエリー、パール、ダイヤモンド、ハンドメイドの天然石ブレスレット、そして中古ジュエリーなどを取り扱っています。」 | 「チャジュエルズでは、K18ゴールドジュエリー、パール、ダイヤモンド、ハンドメイドの天然石ブレスレット、そして中古ジュエリーなどを取り扱っています。」 | same as A |
| JA | 14 | 「日本製の新品ジュエリーには、作り手の技術が込められています。中古のブランドジュエリーには、…」 | 「新品ジュエリーには、作り手の技術が込められています。中古のブランドジュエリーには、…」 | 「新品ジュエリーはすべて日本製で、中古品にも日本製が多くあります。中古ブランド品は各ブランドの製品で、日本で真贋鑑定済みです。ハンドメイドの天然石ブレスレットでは、色や組み合わせを楽しむことができます。」 (exact clarifier, JA) |

EN ¶12 / JA ¶13 ("Their materials, origins, condition, and available documentation may differ" / 「素材、製造元、状態、付属する書類などが異なります」) state that origins differ and claim none; no change proposed. **Required:** owner approval of A or B, then the owner edits `body_en` / `body_ja` in the Hub (Website → Content); `check:terms` does not scan Hub bodies, so verify the live article afterwards.

## BUG-06 — `/gold-guide` redirect chain
- **Reproduced (production, 2026-10-29):** `/gold-guide` → 308 `/jewelry-guide#metals` (`next.config.ts`, permanent) → 307 `/ja/jewelry-guide` (no signal) or `/en/jewelry-guide` (`cj-lang=en`), the fragment carried by the browser. Two hops; the one-hop destination is the language-aware locale page `/{lang}/jewelry-guide#metals`.
- **Why it is two hops:** the 308 was written before Phase 2E; the bare `/jewelry-guide` is now itself a temporary 307 by language.
- **Proposal (needs owner approval under the route-change rule; not implemented):** fold `/gold-guide` into the middleware's legacy-redirect table (`lib/legacy-redirect.ts`) as a 307 to `/{lang}/jewelry-guide#metals`, decided by the same `langDecision` as every bare URL, and remove the `next.config.ts` 308. This follows the approved Phase 2E-stage-1 policy (temporary 307 now, promoted to 308 together with the rest after Search Console observation). Caveat: the current 308 is permanent and already cached by browsers and crawlers; replacing it with a 307 is a deliberate step back that the 308-promotion stage later makes permanent again. Alternative if the owner prefers to keep a permanent redirect now: two `next.config.ts` 308 rules keyed on the `cj-lang` cookie (`has: [{ type: "cookie", key: "cj-lang", value: "en" }]` → `/en/jewelry-guide#metals`; default → `/ja/jewelry-guide#metals`), which ignores `Accept-Language` for first-time visitors and is therefore less consistent with Phase 2E.

## BUG-07 — `#payments-and-layaway` on the Japanese FAQ
- **Verified:** `/ja/faq` renders the Hub section whose slug is `payments-and-layaway` under the heading 「お支払い」 (the layaway heading is renamed by `lib/faq.ts`; layaway items are dropped). The slug is the section's DOM `id` and the in-page category link `href="#payments-and-layaway"` — visible only in the URL bar after a click. No Japanese page links to it with layaway wording (the footer "Layaway terms" link is English-only; `/ja` has 0 such links), no layaway text renders, and `check:layaway-ja` is green.
- **Verdict: NOT A BUG.** It is a stable internal anchor from the Hub slug with no customer-facing text; renaming the Hub slug would break the English footer link and the Phase 3 layaway page's link to the same section. Closed.

## BUG-09 — Google indexing and rich-result eligibility
- **Search Console: BLOCKED.** The Google account signed in on this machine opens Search Console at its "Welcome / Add a website" screen, i.e. it owns no verified property for `chajewelsjp.com`. No index-coverage or URL-inspection evidence is available to this session (finding X8 stands). The owner must verify the property (or grant access) before any indexing claim can be made.
- **Rich Results Test by URL on production (2026-10-29 15:40-15:41 JST, pages fetched live by Google):**
  - `/en/products/n1616-…` — crawled successfully; **3 valid items**: Product snippets, Merchant listings, Breadcrumbs (non-critical notices only: optional `aggregateRating`/`review`, `shippingDetails`, `hasMerchantReturnPolicy`). → product rich results are **eligible** by Google's tool.
  - `/en/layaway` — crawled successfully; **no items detected** (FAQPage is not a shop-eligible rich result since 2023; expected).
  - `/en` — crawled successfully; **2 valid items**: Local businesses (optional `image` notice), Organisation.
- **Indexing of `/en/layaway`: UNVERIFIED.** A public web search for the page is not Search Console evidence and is not relied on. Status stays SEARCH ENGINE RECRAWL PENDING.

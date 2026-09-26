# Product

<!-- impeccable:product-schema 1 -->

<!--
  Sources: the owner's brand brief (2026-09-25, "Step 2: brand setup"), the
  project CLAUDE.md, the code on develop at ac2c408, and the read-only design
  audit in ~/Code/reference/cha-jewels-audit (audit.md, notes/A-brand,
  C-taste, D-design-md). Anything not confirmed by one of those is listed
  under "Open decisions" rather than filled in.

  This file is scanned by `npm run check:terms`. The forbidden phrases are
  therefore described here, never written out.
-->

## Platform

web

## Users

- **Japanese customers in Japan (the primary audience).** They read the site in Japanese, which is the default language. They buy fine and preloved jewelry for themselves or as gifts. They judge a piece by its purity, its weight, its authenticity and a clear yen price.
- **Filipinos in Japan, in the Philippines and worldwide.** They mostly read the English toggle. Many first met Cha Jewels through live selling on Facebook, and they are used to buying through chat. They compare K18 value by the gram. The 0% layaway plan is often what lets them buy a piece now. They can pay in yen or in pesos, whichever they choose.
- **Returning customers and loyalty members.** They sign in by email link to see orders, layaway plans and points (`/account`).

Every visitor is doing one job: decide whether *this specific one-of-a-kind piece* is genuine, worth its price, and safe to reserve. Then reserve it, or contact staff.

## Product Purpose

The storefront for Cha Jewels, a Tokyo luxury jewelry business. Its job is **leads and sales, with a luxury feel and trust**. It shows the Hub's live stock, reserves pieces, runs layaway checkout (English site) and loyalty, and sends every buying question to a person.

Success means a visitor reaches a real piece, its facts and its price quickly, trusts what they read, and reserves it or contacts staff.

The storefront is a window onto the Cha Jewels Hub (the ERP). Products, prices, stock, customers, orders and points all live in the Hub. The site reads them only through the Website API (`lib/hub-api.ts`, contract in `supabase/contracts/api.md`).

## Positioning

What only Cha Jewels has. It must be **surfaced, not buried**:

1. **Purity and gram weight up front.** Every gold piece is described by purity (K18), stamped and hallmark checked. Every listing shows weight, purity and stones. The price is set against real metal facts, not a vague "luxury" story.
2. **0% interest layaway, English site only.** A 30% deposit takes the piece off the shelf. The balance is paid in equal monthly amounts over 3, 6, or 8 months (8 months for orders of ¥300,000 and above), with no bank loan and no fees. All figures come from the Hub (`POST /layaway/quote`).
3. **Live-selling heritage.** Cha Jewels has served customers since 2021 through live selling. Faces on camera, pieces held up to the light, prices said out loud. The site should carry that directness.
4. **Authentication in Japan.** Preloved and branded pieces are authenticated and hallmark checked in Japan. This is a claim about Cha Jewels' intake process, not about where a piece was made.
5. **Loyalty tiers: Glimmer 1×, Radiant 2×, Elite 2×, Crown VIP 3×.** Points earn 1% at Glimmer, and each higher tier multiplies that base rate. 1 point = ¥1 on the next piece. Points are always calculated in yen.

Tone: **direct and pragmatic.** Say the fact, the number and the condition, then stop. The brand direction is **"gilded maximalism, value-driven luxe."** The audit found the site currently reads "quiet and minimal with gold trim". The job ahead is to make the gilding visible while it stays premium and readable.

## Operating Context

- **Company.** Cha Jewels: serving customers since 2021, incorporated in 2024, based in Tokyo. The legal name is the owner-confirmed full-width form in `lib/content/legal.ts` (see Brand Commitments). The qualified-invoice issuer number and the Specified Commercial Transactions Act notice are in the footer as trust anchors.
- **Product lines (Hub categories).**
  - New jewelry: necklaces, pendants, earrings, bracelets, rings, anklets, pearls.
  - Preloved: Preloved Watches, Preloved Branded Jewelry, Preloved Designer Accessories.
  - Most pieces are one of a kind (quantity 1).
- **Languages.** Japanese is primary. English is a toggle, handled by `lib/i18n.ts` and `lib/content/`. Layaway exists only when the language is English (`lib/layaway-availability.ts`).
- **Currencies.** Yen is the price of record. A customer may pay in yen or in pesos, whichever they choose; the Hub converts at the checkout FX rate. Loyalty points are always calculated in yen.
- **Buying flow: reserve first.** Every order is a reservation first. Staff confirm the piece, and only then does the customer receive payment details and a deadline. A transfer order holds stock for 72 hours after confirmation. A quote never reserves stock.
- **Live orders.** Live claims are handled in the Hub (from a Page365 order link), not on this site. A live order reaches the customer through `/account`. There is no `/live` route.
- **Chat-first customers.** Messenger, Facebook, email, WhatsApp and LINE are supported by `components/site/social-icons.tsx`. Which ones show is a Hub setting (`social.follow`).
- **Deployment.** Next.js 15 App Router on Vercel. `develop` → PR → `main`, and the owner merges. Reviews happen on the branch alias preview URL.
- **Ownership.** Claude Code owns `app/`, `components/`, `lib/`. Lovable owns the Hub's edge functions and migrations. The owner runs all SQL.

## Capabilities and Constraints

**Built today:** home (hero film and category slides, values, layaway band on EN, collections, testimonials, new arrivals), collections and product pages (ISR 60 s), cart (a cookie holding only variant, slug and quantity), reserve-first checkout, layaway checkout gated on a signed Tagalog agreement, email-link sign-in, account (orders, layaway plans, addresses, profile), loyalty, about, why, contact, FAQ, gold guide, blog/news, wholesale inquiry, legal pages.

**Hard constraints:**

- **No money math in the browser or in Next.js.** Layaway, points and deposits come from the Hub. *Known open violation:* the 30% "reserve from" figure is still computed locally in `components/commerce/price-block.tsx` and `components/catalog/product-card.tsx` (audit L4). It is to be replaced by a Hub figure; do not copy the pattern.
- Products are created in the Hub only. The site has no product editor.
- Cost basis, margin and CSR commission never cross the API. If they appear, that is a Hub bug to report.
- Card payment (`method: 'square'`) answers 501 by owner decision. Do not stub it.

**Content architecture:**

- **Buttons, menus and UI chrome stay in code** (`lib/i18n.ts`).
- **Site content will later move to the Hub.** That work is parked. Until then it lives in `lib/content/` and `lib/i18n.ts`.
- New components must take their text from props or content modules, never hardcoded, so the move is a data change, not a rewrite.

**3D:**

- Allowed only in the hero and in banners, as a decorative centerpiece.
- Banners use pre-rendered stills or loops.
- Every 3D moment has a still-image fallback for slow phones and for reduced motion.
- **Never on product pages.** Products use real photographs, and later real MP4 video.

**Photography:** real product photography matters more than any effect. See Evidence on Hand for what depends on it.

## Brand Commitments

### Locked rules (non-negotiable)

1. **Gold is described by purity: "K18 gold".** Cha Jewels' own text never uses a `<country> gold` phrase as a purity claim, in any language. The forbidden patterns are defined in `scripts/check-terminology.mjs` and CLAUDE.md. Customer testimonials are shown exactly as the customer wrote them; this rule covers our text, not theirs.
2. **Origin is per-product data.** A Japanese-origin claim appears only in two places:
   - `components/catalog/origin-badge.tsx`, only when the Hub says `origin === "JAPAN"`. A branded piece shows its brand name and claims no origin.
   - The approved clarifier sentence, `brand.originNote` in `lib/i18n.ts`, reproduced exactly.

   No other site-wide origin claims, and that includes the Hub footer tagline, which no longer names an origin (owner decision 2026-09-25). Site-wide copy may say "authenticated in Japan" / "hallmark checked in Japan", which is a claim about our checks, not about origin.
3. **Layaway content appears on the English site only.** This covers copy, testimonials, tabs, calculators and CTAs. Japanese pages carry none of it (`layawayOffered(lang)`).
4. **An out-of-stock piece shows "Sold" / 売約済み, never "Reserved".**
5. **Every order is a reservation first.** Bank details are never shown before staff confirm the piece.
6. **No Japanese literals in `.tsx`** outside `lib/i18n*` and `lib/content/` (`npm run check:i18n`).
7. **Buttons and menus stay in code. Site content comes from props and content modules**, ready for the parked move to the Hub.

### Identity

- **Name:** Cha Jewels. The logo badge is in `public/images/brand/`.
- **Legal name:** the owner-confirmed full-width form, `Ｃｈａ　Ｊｅｗｅｌｓ株式会社`. It uses full-width Latin letters and a full-width space, as confirmed 2026-09-16 in `lib/content/legal.ts`. Reproduce it exactly; never normalize it to half-width.
- **Company name by page (owner decision 2026-09-25):**
  - English pages: `Cha Jewels Co., Ltd. (Ｃｈａ　Ｊｅｗｅｌｓ株式会社)`.
  - Japanese pages and legal pages: the legal form only.
  - The footer, /contact and /about render it this way through `COMPANY_NAME_DISPLAY` (`lib/content/legal.ts`).
- **Direction:** "gilded maximalism, value-driven luxe." **Gold** is the brand accent.
- **Orange** marks buy and contact actions, per the brand kit and the audit. It is never used for navigation, the language toggle or decorative headings.
- **Voice:** direct and pragmatic. Short sentences, real numbers, honest conditions ("Estimate. Your signed agreement shows exact dates and amounts."). No exclamation marks, no Title-Case slogans, no unfalsifiable claims.

## Evidence on Hand

**Real assets in the repo:**

- The logo badge (`public/images/brand/`).
- Category and collection photography (`public/images/categories/`, `public/images/collections/`). The audit rates it the most upscale imagery on the site.
- The molten-gold hero film (`public/videos/hero-artisan*`).
- The K18/Pt900 clasp illustrations (`public/images/gold-guide/`).
- The page emblems (`public/images/emblems/`).

**Real data, from the Hub:**

- live stock with purity, weight, stones, condition, origin and brand
- customer testimonials
- loyalty tiers and perks
- FAQ
- site settings (footer tagline, social links)

**Real trust facts:**

- founded 2021, incorporated 2024, Tokyo
- qualified-invoice issuer number
- secondhand dealer permit (古物商許可), Tokyo Metropolitan Public Safety Commission No. 307762418064 (tokusho and footer)
- Specified Commercial Transactions Act notice
- hallmark and authentication checks at intake

**Missing. Do not fabricate:**

- **Consistent product photography:** one backdrop, the whole piece in frame, a hallmark macro, an on-hand shot for scale. Today's backdrops vary from about #444 to #999 grey.
- **People and place:** the founder, team, office or showroom, hands at work, a live-selling still. The About page's 3D logo coin and the stock-looking artisan image are placeholders for these.
- **Product video (MP4).** It is planned; none exists yet.
- **Hero and banner 3D renders.** None are produced yet.
- **Press and awards:** none on hand. Invent none.

**Components whose quality depends on better photography:** product card, product gallery and viewer, the homepage "New on the bench" arrivals, the hero's first viewport (a real piece and a price above the fold), collection headers, category slides, About/Why, and the mobile art-directed hero crops.

## Product Principles

1. **Facts are the luxury.** Purity, grams, stones, condition and a yen price, set with care, are the persuasive content. Gilding frames the facts; it never replaces them.
2. **The piece before the effect.** A real photograph of a real piece outranks any motion, 3D or ornament. Effects live in the hero and banners; product pages stay photographic.
3. **Reserve, then pay; ask a person anytime.** Every path ends in a reservation or a conversation with staff. Buy and contact actions are always easy to find, and money details arrive only after confirmation.
4. **One rule, enforced in code.** Terminology, origin, layaway-by-language and the "Sold" wording are guarded by scripts and single owning modules, not by memory. New work plugs into those guards.
5. **Japanese first, bilingual always.** Japanese is the default reading. Every string has both languages, and neither is an afterthought.

## Accessibility & Inclusion

- WCAG 2.1 AA as the floor. `npm run check:contrast` measures every token pairing and every scrim. New pairings are added to it, and it must pass.
- Honor `prefers-reduced-motion` from first paint, with no swap after mount. Every 3D or video moment has a still fallback.
- Touch targets of at least 44 px. Open audit items: cart "Remove", footer links, 10 px JA tab labels.
- Keep a visible focus ring on every surface. *Open audit P1:* the global gold-pale ring is 1.37:1 on light pages.
- Japanese typography:
  - headings must not break mid-word
  - Japanese needs a real Japanese face, never a faked italic
  - never uppercase-track Japanese

## Open decisions

These were raised by the audit or this setup and are not answered yet. Do not settle them in code.

- **Which chat channels to show.** LINE is supported in code, but whether it is configured is a Hub setting.
- **Whether the "Our Values" section is replaced by a proof strip** (audit H4).

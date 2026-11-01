# Cha Jewels SEO Master Plan

**Website:** https://www.chajewelsjp.com  
**Repository reviewed:** `chajewels/cha-jewels-web`  
**Prepared:** October 28, 2026  
**Primary objective:** Build Cha Jewels into the most discoverable Japan-based jewelry brand for high-intent searches around K18 gold, Japanese Kihei, diamonds, Akoya pearls, preloved luxury, jewelry layaway, and Filipino-friendly jewelry shopping in Japan.

---

## 1. Executive Summary

Cha Jewels is **not starting from zero on SEO**.

The existing website already has a strong technical SEO foundation, including:

- Next.js server-rendered architecture
- Dynamic sitemap
- Robots rules
- Page-level metadata
- Canonical handling
- Hreflang handling
- Product structured data
- BlogPosting structured data
- FAQ structured data
- JewelryStore structured data
- Product and blog OpenGraph metadata
- Internal product and collection linking
- Product reviews
- Jewelry education content
- Image optimization
- Search Console verification and data exports (**not yet established; see audit addendum**)
- Analytics and conversion tracking

The next stage should **not rebuild these systems**.

The next stage should focus on:

1. Fixing multilingual URL architecture
2. Making layaway fully indexable
3. Expanding structured data
4. Building Google Merchant Center integration
5. Building high-intent commercial landing pages
6. Creating Kihei and K18 topical authority hubs
7. Building selected Filipino/Taglish SEO content
8. Improving local SEO and Google Business Profile
9. Building external authority and backlinks
10. Running SEO from real Search Console data

---

# 2. Current SEO Audit

## 2.1 Already Built

| SEO Component | Status | Action |
|---|---|---|
| Next.js server-rendered architecture | ✅ Built | Keep |
| `/robots.txt` | ✅ Built | Keep and verify live output |
| `/sitemap.xml` | ✅ Dynamic | Keep and verify production coverage |
| Products in sitemap | ✅ Yes | Keep |
| Collections in sitemap | ✅ Yes | Keep |
| Categories in sitemap | ✅ Yes | Keep |
| Blog posts in sitemap | ✅ Yes | Keep |
| Canonical URLs | ✅ Implemented | Keep |
| Hreflang | ⚠️ Implemented | Improve URL architecture |
| English + Japanese | ✅ Present | Move to dedicated locale paths |
| Product metadata | ✅ Dynamic | Improve keyword targeting |
| Product descriptions | ✅ Dynamic | Improve commercial intent |
| Product JSON-LD | ✅ Present | Expand |
| JewelryStore schema | ✅ Present | Expand |
| BlogPosting schema | ✅ Present | Keep |
| FAQ schema | ✅ Present | Keep |
| Product OG images | ✅ Present | Keep |
| Blog OG images | ✅ Present | Keep |
| Blog | ✅ Present | Improve content strategy |
| Jewelry Guide | ✅ Strong | Turn into topic-cluster pillar |
| Layaway page/calculator | ✅ Present | Fix indexability |
| Collections | ✅ Present | Improve SEO fields |
| Categories | ✅ Present | Improve SEO fields |
| Product breadcrumbs UI | ✅ Present | Add BreadcrumbList schema |
| Reviews | ✅ Present | Add eligible rating/review schema |
| Vercel analytics | ✅ Present | Keep |
| Meta/Google Ads tracking | ✅ Present | Keep |
| AVIF/WebP image optimization | ✅ Present | Keep |
| Redirect support | ✅ Present | Verify old-domain redirects |
| Search Console | ⚠️ No verified property observed in 2026-10-29 audit | Owner must verify Domain property and establish Day-0 export |

---

## 2.2 Missing or Needs Improvement

| Area | Status | Priority |
|---|---|---|
| `/en/` and `/ja/` crawlable URLs | ❌ Missing | P0 |
| Filipino/Tagalog SEO locale | ❌ Missing | P2 |
| Layaway crawlable English URL | ❌ Structural issue | P0 |
| BreadcrumbList schema | ❌ Missing | P1 |
| AggregateRating / Review Product schema | ❌ Missing | P1 |
| Merchant shipping/returns structured data | ❌ Missing | P1 |
| Google Merchant Center integration | ⚠️ Not found in repo | P1 |
| Dedicated Kihei SEO hub | ❌ Missing | P1 |
| Dedicated K18 SEO hub | ❌ Missing | P1 |
| Dedicated Filipino-Japan search content | ❌ Missing | P2 |
| SEO fields in Hub for category/collection pages | ⚠️ Limited | P1 |
| Google Business Profile optimization | ⚠️ External verification needed | P2 |
| Old-domain redirect verification | ⚠️ Needs verification | P0 |
| Strong backlink program | ❌ Not systemized | P2 |
| Image SEO metadata in Hub | ⚠️ Improve | P3 |
| Video structured data | ❌ Missing | P3 |

---

# 3. Critical Finding: Multilingual URL Architecture

The current site serves English and Japanese through the same base URLs, with language controlled by cookies/query parameters.

Example:

```text
/products/example
/products/example?lang=en
```

The clean URL remains canonical.

This creates a limitation for search engines because English and Japanese do not have fully separate permanent URLs.

The codebase already acknowledges this issue, especially for `/layaway`.

## Current problem

`/layaway` is unavailable on the Japanese site by design.

A crawler without the English language cookie can encounter a Japanese 404.

This makes one of Cha Jewels' strongest commercial pages difficult to index correctly.

## Target architecture

```text
/en/
/ja/
```

Examples:

```text
/en/products/k18-8-cut-triple-kihei-necklace-100g
/ja/products/k18-8-cut-triple-kihei-necklace-100g

/en/collections/kihei
/ja/collections/kihei

/en/blog/what-is-kihei
/ja/blog/kihei-guide

/en/layaway
```

If layaway is not offered in Japanese:

```text
/en/layaway     ✅
/ja/layaway     ❌ not created
```

---

# 4. Safe Multilingual Migration Procedure

Do not change all URLs in one deployment.

## Phase A — Prepare

Keep all current URLs working.

Build locale-routing support first.

## Phase B — Introduce locale paths

Create:

```text
/en/products/foo
/ja/products/foo
```

Each page must have its own canonical:

```text
/en/products/foo → /en/products/foo
/ja/products/foo → /ja/products/foo
```

Add:

```text
hreflang="en"
hreflang="ja"
hreflang="x-default"
```

## Phase C — Update internal links

All:

- navigation links
- breadcrumbs
- collection links
- category links
- blog links
- product links
- footer links
- language switcher links

must point to the correct locale URL.

## Phase D — Update sitemap

Sitemap should include all valid locale URLs.

## Phase E — Redirect legacy URLs

After production validation:

```text
/products/foo
→ permanent redirect
/ja/products/foo
```

or the chosen default locale route.

## Phase F — Validate

Test:

- canonical
- hreflang
- redirects
- direct navigation
- sitemap
- Search Console
- unknown routes
- EN and JA product pages
- blog pages
- collections
- categories
- legal pages
- account exclusions
- layaway behavior

---

# 5. Homepage SEO Improvement

## Current title

```text
Cha Jewels | K18 gold, pearls and diamonds
```

## Current description

```text
K18 gold, Akoya pearls and diamonds, authenticated in Japan.
0% layaway, wholesale from Tokyo, shipping worldwide.
```

This is already solid.

## Recommended testing direction

Possible title:

```text
K18 Gold Jewelry Japan, Kihei, Diamonds & Akoya Pearls | Cha Jewels
```

Possible description:

```text
Shop authentic K18 gold jewelry, Japanese Kihei chains, Akoya pearls,
diamonds and curated preloved luxury pieces from Cha Jewels in Tokyo.
Worldwide shipping and 0% layaway available.
```

### Procedure

1. Review Search Console branded/non-branded impressions.
2. Identify highest-impression product categories.
3. Finalize title using proven demand.
4. Keep title readable and brand-led.
5. Measure CTR for 4–8 weeks.
6. Keep or revise based on actual data.

---

# 6. Product SEO

Cha Jewels already has strong product pages.

Existing product SEO includes:

- Unique H1
- Unique metadata
- Product descriptions
- Product photography
- Specifications
- Metal
- Weight
- Stone
- Size
- Condition
- Category
- SKU
- Reviews
- Related products
- Breadcrumbs
- Availability
- Price
- Layaway calculator
- Product JSON-LD

## Structured data currently includes

```text
Product
name
sku
image
material
description
brand
price
priceCurrency
itemCondition
availability
url
```

## Next improvements

Add only when real data exists:

```text
aggregateRating
review
gtin
mpn
shippingDetails
hasMerchantReturnPolicy
```

### Rules

Never invent:

- reviews
- ratings
- GTIN
- MPN
- shipping promises
- return conditions
- brand
- origin

Structured data must match visible customer-facing information.

---

# 7. Product Review Schema

Cha Jewels already displays real product reviews.

The Product schema should be extended when legitimate review data is available.

Example:

```json
{
  "@type": "Product",
  "name": "Example Product",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "23"
  }
}
```

## Procedure

1. Use only approved visible reviews.
2. Calculate rating from the same dataset shown on the page.
3. Output only if review count > 0.
4. Keep structured count synchronized with the Hub.
5. Test using Google Rich Results Test.
6. Re-test after deployment.

---

# 8. Breadcrumb Structured Data

The visual product breadcrumbs already exist.

Add `BreadcrumbList` JSON-LD.

Example structure:

```text
Home
→ Collections
→ Kihei
→ Product
```

## Procedure

1. Build reusable `BreadcrumbList` component.
2. Generate items server-side.
3. Use canonical absolute URLs.
4. Apply to:
   - products
   - categories
   - collections
   - blog articles
   - guides
5. Validate with Rich Results Test.

---

# 9. Jewelry Guide Strategy

Do not replace the existing Jewelry Guide.

It already covers:

- Ring sizing
- Necklace length
- Clasps
- Metals
- Hallmarks/stamps
- Diamond 4Cs
- Jewelry care

Use it as a **pillar page**.

Then build dedicated supporting pages.

Suggested pages:

```text
/en/guides/japanese-gold-hallmarks
/en/guides/k18-vs-k24-gold
/en/guides/kihei-chain
/en/guides/diamond-4cs
/en/guides/akoya-pearl-guide
```

Each supporting page should link to:

- Jewelry Guide
- relevant category
- relevant products
- related guides

---

# 10. Kihei Authority Hub

This is one of the highest-value opportunities.

## Parent page

```text
/en/guides/kihei/
```

Suggested H1:

```text
Japanese Kihei Gold Chain Guide
```

## Supporting content

1. What is a Kihei chain?
2. 2-cut vs 6-cut vs 8-cut Kihei
3. Double vs triple Kihei
4. 30g vs 50g vs 100g Kihei
5. How Kihei gold is weighed
6. Japanese Kihei hallmarks
7. K18 vs K24 Kihei
8. Best Kihei necklace lengths
9. Kihei for men
10. Kihei for women
11. How to authenticate K18 jewelry in Japan
12. How to care for Kihei chains

## Commercial linking

Every guide should naturally link to:

```text
Shop Kihei
```

and relevant products.

---

# 11. K18 Japan Authority Hub

## Parent

```text
/en/guides/k18-gold-japan/
```

## Supporting topics

- What is K18 gold?
- What does K18 mean in Japan?
- K18 vs 18K
- K18 vs K24
- K18 hallmarks used in Japan
- How gold jewelry is weighed
- Why gram weight matters
- How to check real K18
- Buying K18 gold in Japan
- How to care for K18 jewelry

Use real Cha Jewels product examples whenever possible.

---

# 12. Layaway SEO

Do not scale layaway content until the URL architecture is fixed.

## First goal

Create:

```text
/en/layaway
```

with:

- crawlable permanent URL
- self canonical
- correct hreflang
- SEO title
- description
- H1
- working calculator
- current terms
- FAQ
- internal links
- product examples

## Supporting pages

```text
/en/guides/jewelry-layaway-japan
/en/guides/how-jewelry-layaway-works
/en/guides/kihei-installment-japan
```

## Conversion path

```text
Google search
↓
Layaway guide
↓
Calculator
↓
Product
↓
Reserve
```

---

# 13. Filipino / Taglish SEO Strategy

Do not translate the entire website immediately.

Start with high-intent search content.

Suggested pages:

```text
Saan makakabili ng K18 gold sa Japan?
Ano ang Kihei gold?
Paano malaman kung tunay ang K18 jewelry sa Japan?
Paano gumagana ang jewelry layaway sa Japan?
K18 gold Japan para sa Filipino buyers
```

## Procedure

1. Check Search Console for Filipino/Tagalog queries.
2. Research Google autocomplete and related searches.
3. Build 5–10 high-quality pages.
4. Measure impressions and clicks.
5. Expand only if search demand appears.

---

# 14. Collection and Category SEO

Collections and categories already exist.

Do not rebuild them.

Improve the Hub so every category/collection can store:

```text
SEO title
SEO description
H1
intro copy
long SEO copy
primary keyword
secondary keywords
hero image
image alt
FAQ
```

## Example

### Collection name

```text
Kihei
```

### SEO title

```text
Japanese K18 Kihei Chains | Gold Necklaces & Bracelets | Cha Jewels
```

### H1

```text
Japanese K18 Kihei Gold Chains
```

### Intro

Short customer-focused explanation.

### Bottom SEO content

Useful information about:

- Kihei
- gold purity
- cut types
- weights
- Japanese hallmarks
- choosing a chain

Avoid keyword stuffing.

---

# 15. Google Merchant Center

Merchant Center implementation was not found in the website repository.

This must be verified externally.

## If not already active

Create and verify Merchant Center.

## Target architecture

```text
Cha Jewels Hub
↓
Product Feed
↓
Google Merchant Center
↓
Free Listings / Shopping surfaces
```

## Product feed fields

```text
id
title
description
link
image_link
availability
price
condition
brand
gtin
mpn
shipping
```

Use GTIN/MPN only when real and applicable.

## Inventory synchronization

When inventory changes in Hub:

```text
available → in_stock
sold → out_of_stock
```

Do not manually maintain duplicate product data if automation is possible.

---

# 16. JewelryStore / Organization Entity Improvement

Existing JewelryStore schema already contains:

```text
name
legalName
url
Katsushika-ku
Tokyo
Japan
areaServed
priceRange
```

Investigate adding:

```text
logo
telephone
email
sameAs
openingHours
full address
```

where accurate.

Align entity information across:

- website
- Google Business Profile
- Facebook
- Instagram
- company records
- Tokyo business affiliations
- industry listings

---

# 17. Google Business Profile

Verify whether Cha Jewels already has an active verified Google Business Profile.

## If yes

Improve:

- correct category
- company description
- website
- phone
- address
- business hours
- product photos
- store photos
- product/service listings
- posts
- authentic reviews

## Search targets

```text
jewelry store Tokyo
K18 jewelry Tokyo
gold shop Katsushika
jewelry store near me
Kihei Tokyo
```

---

# 18. Old Domain Migration

> **SUPERSEDED — owner decision 2026-10-31: KEEP `chajewelsjapan.com`, NO REDIRECT.** It is the live Page365 storefront and the Hub's Page365 inventory fetch and invoice import depend on it. The migration below is not to be implemented. See `SEO-IMPLEMENTATION-STATUS.md` D2.

Verify:

```text
chajewelsjapan.com
```

to:

```text
chajewelsjp.com
```

## Correct migration behavior

Use page-to-page permanent redirects.

Example:

```text
old/about
→
new/about
```

```text
old/product-a
→
new/product-a
```

Do not redirect every old URL to the homepage unless no relevant replacement exists.

## Procedure

1. Export old indexed URLs.
2. Export old backlinks if available.
3. Map each old URL.
4. Add 301/308 redirects.
5. Test all mappings.
6. Monitor Search Console.
7. Keep redirects long-term.

---

# 19. Search Console Operating System

Search Console should determine what Cha Jewels builds next.

## Weekly export

Collect:

```text
Query
Page
Clicks
Impressions
CTR
Average position
Country
Device
```

## Opportunity rules

| Signal | Action |
|---|---|
| High impressions + low CTR | Improve title/meta |
| Position 5–20 | Improve page + internal links |
| Query exists but no dedicated page | Build landing page |
| Strong page with falling clicks | Refresh |
| Zero impressions | Do not assume demand |

---

# 20. Question Query Strategy

Continue using the question regex.

Monitor queries beginning with:

```text
what
where
why
which
how
can
does
is
```

## Example

Query:

```text
what is kihei gold
```

Create:

```text
What Is a Kihei Gold Chain? Japanese Kihei Explained
```

Query:

```text
k18 meaning japan
```

Create:

```text
What Does K18 Mean on Japanese Jewelry?
```

Build content from real customer search behavior.

---

# 21. Internal Linking System

Create deliberate topic paths.

## Kihei example

```text
What Is Kihei?
↓
Kihei Guide
↓
8-Cut Kihei Guide
↓
Shop Kihei
↓
Product
```

## Product reverse-linking

Product pages can link to:

```text
Learn about Kihei cuts
Learn about K18 hallmarks used in Japan
Learn how gram weight works
```

This creates a clear semantic relationship between education and commerce.

---

# 22. Target SEO Information Architecture

```text
CHA JEWELS

/en/
├── shop
│   ├── k18-gold
│   ├── kihei
│   ├── diamonds
│   ├── akoya-pearls
│   ├── preloved-jewelry
│   ├── watches
│   └── designer-accessories
│
├── guides
│   ├── kihei
│   ├── k18-gold
│   ├── diamonds
│   ├── pearls
│   ├── hallmarks
│   ├── jewelry-care
│   └── buying-guides
│
├── layaway
├── wholesale
├── blog
├── about
├── why-cha-jewels
└── contact

/ja/
└── corresponding Japanese content

/fil/
└── selected Filipino/Taglish high-value content
```

---

# 23. Product Image SEO

Existing strengths:

- Next image optimization
- AVIF
- WebP
- responsive sizing

## Improve Hub image metadata

Store:

```text
alt text
image type
primary image
angle
detail image
hallmark image
certificate image
```

## Good alt text

```text
K18 8-cut triple Kihei necklace 100g 50cm
```

## Avoid

```text
beautiful luxury amazing investment gold necklace best Japan
```

Alt text must describe the image, not act as a keyword dump.

---

# 24. Authenticity and Trust Content

Build high-value trust pages:

```text
How Cha Jewels Checks Jewelry
Understanding Japanese Hallmarks
Jewelry Certificates Explained
How We Describe Preloved Condition
Why Gram Weight Matters
Our Product Photography Standard
```

These support:

- SEO
- trust
- conversion
- brand authority

Use real examples and real photographs whenever possible.

---

# 25. Content Quality Rule

Do not mass-produce:

```text
500 AI articles
100 city pages
near-duplicate buying guides
keyword-stuffed posts
```

Cha Jewels should use its real operating knowledge.

Preferred evidence:

- real jewelry
- hallmarks
- gram weights
- clasps
- certificates
- polishing
- sourcing
- product examples
- customer questions
- actual photography

This is difficult for generic competitors to copy.

---

# 26. Implementation Roadmap

## PHASE 0 — Baseline Measurement

Capture before any major SEO changes:

```text
indexed pages
excluded pages
crawl issues
top 100 queries
top 100 pages
CTR
average position
countries
devices
rich result reports
organic users
organic revenue
organic conversion rate
organic add-to-cart
organic checkout
```

This becomes the SEO Day 0 baseline.

---

## PHASE 1 — Production Technical Audit

Verify live:

```text
robots.txt
sitemap.xml
canonical tags
hreflang
404 behavior
redirect behavior
www/non-www
http/https
old domain
staging noindex
product indexing
blog indexing
collection indexing
category indexing
```

Do not begin the migration until the baseline is documented.

---

## PHASE 2 — Multilingual URL Architecture

Build:

```text
/en/
/ja/
```

Migrate:

- products
- categories
- collections
- blog
- guides
- company pages
- legal/indexable public pages

Update:

- canonical
- hreflang
- sitemap
- redirects
- internal links
- language switcher

---

## PHASE 3 — Fix Layaway Indexing

Create:

```text
/en/layaway
```

Add:

- permanent crawlable URL
- canonical
- metadata
- H1
- explanation
- calculator
- FAQ
- product links
- internal links

Submit for indexing after production validation.

---

## PHASE 4 — Structured Data Upgrade

Add where supported:

```text
BreadcrumbList
AggregateRating
Review
shippingDetails
hasMerchantReturnPolicy
Organization fields
sameAs
logo
```

Validate every template.

---

## PHASE 5 — Merchant Center

Verify or create Merchant Center.

Build:

```text
Hub
→ product feed/API
→ Merchant Center
```

Enable eligible free listings.

Monitor:

- rejected products
- missing identifiers
- price mismatches
- availability mismatches
- image issues

---

## PHASE 6 — Commercial SEO Landing Pages

Prioritize high-intent search themes:

```text
K18 gold Japan
Kihei Japan
gold necklace Japan
gold bracelet Japan
Akoya pearl Japan
diamond jewelry Japan
preloved jewelry Japan
preloved luxury Japan
jewelry layaway Japan
wholesale gold jewelry Japan
```

Perform keyword validation before final URLs and titles are chosen.

### Phase 6 add-on — `llms.txt` (site summary for AI assistants)

Added to Phase 6 by owner decision, 2026-10-31. Status: **IMPLEMENTED 2026-11-01 — READY FOR QA** (`app/llms.txt/route.ts` + `lib/llms-txt.ts`, branch `seo/master-plan-completion`; built on the existing public URLs, follows the sitemap source if Phase 6 adds pages; not released).

What it is: one plain-text file at `https://www.chajewelsjp.com/llms.txt` with a short description of Cha Jewels and links to the main public pages (collections, categories, wholesale, layaway on the English site, guides once approved, contact, policies). AI assistants that look for this file can find the main pages quickly.

Limits, stated plainly:
- It is an unofficial proposal (llmstxt.org), not a web standard.
- Google Search does not use it. It has no effect on Google ranking or indexing.
- Few AI crawlers request it today. Expect a small benefit at most.

Rules:
- Build it inside the Phase 6 batch, after the Phase 6 URLs and titles are final, so its links match the commercial landing pages.
- Static file. No product list, prices, stock, points or any figure (those change and come from the Hub).
- Only public pages that are in the sitemap. No account, cart, checkout, API or Hub URLs. No private or customer data.
- Wording follows "Terminology" (`check:terms` passes). Japanese pages, if listed, never link to layaway.
- Does not change robots.txt, the sitemap, canonicals or hreflang.
- Test: the URL returns 200 with `text/plain`; every link in it returns 200 and is indexable; `check:terms`, `check:money` and `check:i18n` pass. *(Implemented as the `llms-txt` and `llms-links` rows of both SEO checkers: each advertised link is fetched and must answer 200, `text/html`, no noindex and one self canonical; sitemap membership alone is not acceptance. Verified on the local fixtures build 2026-11-01; real-data and deployment runs pending.)*

---

## PHASE 7 — Kihei Topical Authority

Build the Kihei pillar and supporting cluster.

Use real Cha Jewels pieces as examples.

Link to products and collections.

---

## PHASE 8 — K18 Topical Authority

Build Japanese K18 gold cluster.

Include:

- hallmarks
- purity
- weight
- authentication
- buying
- care

---

## PHASE 9 — Filipino Search Moat

Publish 5–10 high-intent Filipino/Taglish pages.

Measure.

Expand only when evidence supports expansion.

---

## PHASE 10 — Local SEO

Verify and optimize Google Business Profile.

Align business identity across the web.

**Owner decision OD-GBP-1, 2026-10-31: No.** Customers are not received at the office address (Time Mansion 301), and no Business Profile exists. Cha Jewels is **not eligible** for a Business Profile; do not create one. The Business Profile part of this phase is **CLOSED — NOT ELIGIBLE**. Local and brand signals come from the site's own entity JSON-LD (Phase 4), Merchant Center business information (Phase 5) and consistent citations (Phase 11). Revisit only if customers start being received in person.

---

## PHASE 11 — Backlinks and Authority

Earn links from:

- jewelry industry websites
- Japan–Philippines publications
- Tokyo business organizations
- jewelry exhibitions
- suppliers/partners
- interviews
- community organizations
- trade publications

Avoid purchased spam backlinks.

---

## PHASE 12 — Weekly SEO Operations

### Weekly

```text
Search Console
↓
identify opportunity
↓
update or build page
↓
add internal links
↓
request indexing when appropriate
↓
monitor
```

### Monthly

Review:

```text
technical health
index coverage
content winners
content losers
product indexing
Merchant Center health
rich results
organic revenue
organic conversion
backlink growth
```

---

# 27. Priority Matrix

| Priority | Project | Impact | Difficulty |
|---|---|---:|---:|
| P0 | Search Console baseline | Very High | Low |
| P0 | Production canonical/indexing audit | Very High | Medium |
| P0 | EN/JA URL architecture | Critical | High |
| P0 | Fix Layaway indexability | Critical | Medium/High |
| P0 | Verify old-domain redirects | High | Medium |
| P1 | Merchant Center | Very High | Medium |
| P1 | Breadcrumb schema | Medium | Low |
| P1 | Product rating/review schema | High | Medium |
| P1 | Collection/category SEO fields | High | Medium |
| P1 | Kihei hub | Very High | Medium |
| P1 | K18 hub | Very High | Medium |
| P2 | Filipino SEO pages | High Potential | Medium |
| P2 | Google Business Profile | High | Low/Medium |
| P2 | Authority/backlinks | High | Ongoing |
| P3 | Image SEO metadata | Medium | Low |
| P3 | Video schema/content | Medium | Medium |

---

# 28. Systems That Should Not Be Rebuilt

Do not rebuild these unless a specific verified defect is found:

- sitemap system
- robots system
- Product JSON-LD foundation
- BlogPosting schema
- FAQ schema
- OpenGraph framework
- product metadata engine
- related-products architecture
- image optimization system
- Jewelry Guide
- Search Console tracking

These are existing assets.

Improve them instead.

---

# 29. SEO Success Metrics

Cha Jewels should not measure success only by “ranking #1”.

Track:

## Visibility

```text
non-branded impressions
Top 3 keywords
Top 10 keywords
Top 20 keywords
share of search
indexed products
rich result coverage
Merchant Center visibility
```

## Traffic

```text
organic users
organic sessions
new organic customers
country
device
landing pages
```

## Commercial

```text
organic add-to-cart
organic checkout start
organic purchase
organic revenue
average order value
layaway starts from organic
repeat customers from organic
```

## Authority

```text
referring domains
industry mentions
branded searches
Search Console branded query growth
Google Business Profile discovery
```

---

# 30. Core Search Territory Cha Jewels Should Own

## Brand

```text
Cha Jewels
Cha Jewels Japan
```

## Products

```text
K18 gold Japan
Kihei necklace Japan
100g Kihei
Akoya pearl Japan
diamond jewelry Japan
```

## Education

```text
what does K18 mean
K18 hallmarks used in Japan
what is Kihei
8 cut Kihei meaning
K18 vs 18K
```

## Buying

```text
where to buy K18 gold Japan
K18 jewelry online in Japan
Kihei shop Japan
jewelry shop Tokyo
```

## Payments

```text
jewelry layaway Japan
gold installment Japan
Kihei installment Japan
```

## Filipino Audience

```text
Filipino jewelry seller Japan
K18 Japan Filipino
saan bumili ng gold sa Japan
ano ang Kihei gold
```

---

# 31. Strategic Goal

The objective is not simply:

> Rank Cha Jewels #1.

The stronger objective is:

> Make Cha Jewels repeatedly appear whenever a high-intent customer searches for Japanese K18 gold, Kihei, jewelry layaway, Akoya pearls, diamonds, preloved luxury, or Filipino-friendly jewelry shopping in Japan.

Over time, Google should increasingly associate:

```text
K18
→ Japan
→ Kihei
→ jewelry
→ authenticity
→ layaway
→ Cha Jewels
```

---

# 32. Immediate Next Actions

## First

1. Export Search Console baseline.
2. Verify production robots/sitemap/canonical/hreflang.
3. Verify old-domain redirect behavior.
4. Confirm current indexed-page count.
5. Review top non-branded search queries.

## Then

6. Design `/en/` + `/ja/` migration.
7. Build staging/preview implementation.
8. Validate products, collections, categories, blogs, guides, and legal pages.
9. Fix `/en/layaway`.
10. Deploy migration only after regression testing.

## After the technical foundation

11. Add BreadcrumbList schema.
12. Add review/rating schema where valid.
13. Verify Merchant Center.
14. Build Hub-to-Merchant product feed.
15. Build Kihei pillar.
16. Build K18 pillar.
17. Improve collection/category SEO fields.
18. Begin selected Filipino/Taglish SEO content.
19. Strengthen Google Business Profile.
20. Begin authority/backlink program.

---

# Final Recommendation

Cha Jewels already has a strong SEO engineering base.

The highest-value next step is **not producing more random blog posts**.

The correct sequence is:

```text
Technical verification
→ multilingual URL architecture
→ layaway indexing
→ structured data enhancement
→ Merchant Center
→ commercial landing pages
→ Kihei/K18 authority
→ Filipino search moat
→ external authority
→ continuous Search Console optimization
```

This sequence protects the SEO work already completed while building the next layer required for Cha Jewels to become substantially more discoverable across Google Search, Shopping, Images, Lens, local search, and high-intent product queries.

---

# 33. October 29, 2026 — 19-Point Audit Integration and Revised Execution Gates

**Source:** owner's attached `seo-19-point-audit-2026-10-29.md` (read-only; 20 SEO and mobile-responsiveness checks (the owner's 20-item list)). Audit methods reported: production checker 288 pass / 0 fail; 130 sampled pages (all 70 non-product sitemap URLs and 60 product URLs); 1,007 unique links followed; 8 Lighthouse runs (4 URLs × mobile and desktop; Lighthouse v12); 17 responsive templates at 360/390 px. Results are **auditor-reported**, not independently reproduced by this plan update. Audit baseline: production `main` `82effab`. Its references to website PRs #423–#425 as open are a time-of-audit snapshot; **they subsequently merged into `develop`** as #423 `77ea02c`, #424 `1a22af5`, #425 `9e1d564`, and shipped to production in release PR #426 (merge `97a6e76`, 16:35 JST, owner-reported live verification of robots.txt and Facebook-only `sameAs`). These later events postdate the audit baseline and must not be mistaken for audit-time results.

## 33.1 Corrected baseline and phase status

| Phase / component | As of this addendum | Evidence or gate |
|---|---|---|
| 0, Measurement baseline | Production code/live baseline verified; Search Console **IMPLEMENTING** (updated 2026-10-31): Domain property verified, sitemap Success (976), `/en`, `/ja`, `/en/layaway` OBSERVED IN SEARCH CONSOLE (2026-10-30); coverage report still processing; first Performance export 2026-10-31 (one day: initial observation, not a baseline). Organic sales measurement NOT STARTED | `SEARCH-CONSOLE-BASELINE-2026-10-30.md`, `-2026-10-31.md`; re-read about 5 and 12 Nov |
| 1, Technical audit | VERIFIED at audit level; mobile speed and crawlable navigation are outstanding work | 19-point audit and measurements below |
| 2, Locale URL architecture | 2A–2E stage 1 DEPLOYED; 308 promotion NOT STARTED | Existing 307s remain until explicitly approved; do not implement OD-6 as part of this audit |
| 3, English layaway | DEPLOYED on production in #421 | `/en/layaway` 200; `/ja/layaway` absent; Search Console recrawl pending |
| 4, Structured data | DEPLOYED on production in #421 | Breadcrumbs + JewelryStore; no merchant shipping/returns by owner decision; rating only when genuine approved review exists |
| BUG-02 / BUG-05 / BUG-08 | DEPLOYED (release #426) | #423–#425 merged to develop, then released to main via #426; owner reports live robots.txt and Facebook-only `sameAs` verified |
| 5–12 | AUDITED / documents and drafts; **2026-11-01:** Phase 5 feed builder implemented (route gated), Phase 6 `llms.txt` READY FOR QA, Phase 12 report helper and attribution design written — see `SEO-REQUIREMENTS-MATRIX-2026-11-01.md` | No Merchant Center/account integration, content rollout, GBP action or backlink campaign implied |

**Important corrections to earlier master-plan language:** §2.1 previously claimed Search Console was “in use” as a verified fact. The audit found no website verification token, no DNS TXT token, and no verified property in the signed-in Google account; the owner must verify a Domain property, so Google indexing and rankings remain unverified. The old-domain redirect recommendation in §18 is **not authorized**: `chajewelsjapan.com` currently serves a functioning Page365 shop, and redirecting it would disrupt that storefront. Secure an explicit owner decision to keep, replace or migrate it before editing DNS or redirects. **Decided 2026-10-31: KEEP, no redirect.** The historical recommendations above are superseded by these current gates.

## 33.2 Audit evidence and remaining opportunities

| SEO area | Audit observation | Action / disposition |
|---|---|---|
| Noindex / robots | Private/utility noindex; `/already-registered` robots conflict | BUG-05 deployed in #426; owner reports live robots.txt check passed |
| Titles | One title per sampled page; root `/` and `/ja` duplicate; English generic titles and SKU-first product titles | Defer root duplicate to approved Phase 2 redirect stage; refine metadata-only product title ordering and English titles without modifying Hub product names |
| Descriptions | All sampled pages have meta descriptions; `/en/legal/tokusho` and `/ja/legal/tokusho` reuse home description, short English collection summaries, raw product specification lists | Give legal pages distinct accurate descriptions; prepare Hub collection/product content edits with owner approval |
| Image alt | 3,864 sampled images, no missing alt; some decorative empty alts justified | Improve blog cover alt using article title; inspect two guide illustrations for contextual alt before editing |
| Performance | Desktop Lighthouse 91–100; mobile `/ja` 36 (LCP 5.2 s, TBT 1.85 s), `/en` 61 (LCP 3.7 s, TBT 1.2 s); Rings 80, product 86; CLS near zero | Dedicated performance phase; audit indicates per-request headers/cookies and `private, no-store` defeat `revalidate=60`; verify root cause before caching edits |
| Sitemap | 976 URLs, 908 `lastmod` entries, 68 page entries without `lastmod`, no image sitemap entries | Add truthful modification dates where known; include supported product image entries, avoiding invented dates |
| OpenGraph | Product and blog use their own photos; collection/category commonly use generic image | Prefer actual Hub collection/category hero image when available; preserve fallback |
| Links / crawlability | 1,007 unique sampled links, zero persistently broken; hidden-until-open desktop/phone menus omit category/company links from initial HTML; 5 category pages have weak inbound links | Keep meaningful menu links in initial crawlable HTML **without** exposing closed panels visually or breaking keyboard/focus behavior; improve category linking separately |
| Crawling under load | One transient product 500 and four timeouts at 10 parallel requests; individual retries passed | Treat as load/performance signal, not proven broken links; investigate safely during performance phase |
| Headers / canonical / HTTPS / slugs | One H1 per sampled page; canonical present; HTTPS 308 and HSTS; slugs generally valid | No slug migrations or HSTS `includeSubDomains` rollout from this audit |
| Schema | JewelryStore, Product, BreadcrumbList, FAQPage, BlogPosting present | BUG-02 `sameAs` chat-filter deployed in #426; evaluate ItemList for visible collection/category listings and genuine entity fields only |
| Search Console | Verification and Day-0 export missing | Owner DNS TXT verification and sitemap submission required; do not claim coverage/rankings |
| Mobile UX | No horizontal scrolling at 360/390 px on 17 templates; breadcrumb tap areas ~15 px tall; home labels ~11.5 px | Improve tap target and label readability without disturbing layout |
| Existing policy | Sold products remain in sitemap by owner decision D3; `/ja/layaway` must remain absent | Preserve both behaviors |

The audit records no skipped heading levels, no broken links in the sampled set, properly optimized image delivery, and no evidence that existing slugs require renaming. These are **sample results**, not a guarantee about every URL or real-user Core Web Vitals. Do not treat Lighthouse lab results as Search Console field metrics.

## 33.3 Revised prioritized delivery roadmap (approval per step)

**Gate 0 — Owners and releases.** Website stabilization fixes #423–#425 are **DONE in production** via release #426 (owner-reported live checks of robots.txt and `sameAs`). Do not re-release them. Independently, owner verifies Google Search Console **Domain** property via DNS TXT, submits `https://www.chajewelsjp.com/sitemap.xml`, records initial coverage/query/page reports when available, and makes a written decision about the live Page365 old-domain shop. No DNS modifications or Google-account actions are assumed authorized by this document. Treat Search Console as an operational prerequisite, not as an automatic blocker for harmless metadata fixes.

**Step 1 — Crawlability and metadata (low-risk, distinct reviewable PR).** (a) Include meaningful desktop-menu/phone-drawer category and company links in initial server HTML, visually hidden when closed but preserving accessibility and interaction; (b) unique accurate EN/JA Tokusho descriptions; (c) title-tag-only SKU placement and keyword-aware concise EN titles; (d) blog cover alt text drawn from article title; (e) sitemap accurate page `lastmod` only when backed by a real page-content modification timestamp (e.g., the Hub content record's last substantive update or, for repository-owned static content, the relevant Git content-change commit date); do not use deploy time or today's date as a blanket proxy, and omit `lastmod` where a trustworthy source is unavailable; add supported product image metadata; (f) increase breadcrumb tap area without changing semantics. Test mobile nav focus order, keyboard controls, locale links, canonical/hreflang and performance. Do not create fictional image/dates or alter Hub names.

**Step 2 — Collection SEO enhancements (separate PR).** Add valid ItemList only for items visibly listed on collection/category pages, reflecting exact page contents; use live Hub hero image as collection/category OG image when one exists. Test empty/paginated lists, localized URLs, metadata fallback and structured-data eligibility; avoid ratings, offers and unsupported business claims.

**Step 3 — Performance workstream (dedicated phase; medium-to-high risk).** 3a investigate and optimize phone home animations/layout work; 3b reduce large collection/category HTML payloads (audit examples: Rings 1.24 MB, Fine Jewelry 959 KB); 3c separately evaluate caching and dynamic root-layout header/cookie dependencies. Protect correct locale routing, cookies, cart/account personalized flows, Hub data freshness and order/payment boundaries. Collect comparable mobile Lighthouse measurements before/after and, once Search Console access is established, real-user Core Web Vitals. Do not apply root caching simply to satisfy a synthetic score.

**Step 4 — Hub-managed content (owner edit gate).** Establish accurate SEO text fields for collections/categories in a separate Hub-approved scope; improve overly short English descriptions and raw-spec product descriptions using verified product facts. Preserve actual karat, weight, SKU, condition and origin evidence. Correct the separately tracked unsupported generalized “Japan-made” claims in both article languages **only after exact replacement text is owner approved**.

**Step 5 — Resume existing master-plan roadmap.** After data and decisions, handle the explicitly approved Phase 2 permanent-redirect stage (not automatic OD-6); Phase 5 Merchant Center; Phase 6 commercial landing pages; Phase 7 Kihei; Phase 8 K18; Phase 9 Filipino/Taglish; Phase 10 Google Business Profile; Phase 11 legitimate authority/backlinks; Phase 12 weekly Search Console operations with monthly sampled link checks. No Kihei collection should be invented when Hub has none.

## 33.4 Explicit exclusions / decisions

- Do not redirect `chajewelsjapan.com`: **owner decided 2026-10-31 to KEEP it as the live Page365 shop, no redirect** (the Hub's Page365 inventory fetch and invoice import depend on it). §18 is superseded.
- Do not create an unapproved Japanese layaway URL, permanent legacy redirect, unsupported shipping/returns markup, review rating, GTIN, manufacturing origin, or made-in-Japan claim.
- Do not rename existing product slugs merely for cosmetic SEO, enable HSTS `includeSubDomains` without subdomain audit, or schedule a redundant standalone link checker; include periodic link health in Phase 12.
- **Separate operational context, not a finding of the 20-item SEO audit:** Hub PRs #670, #671 and #672 (Page365 follow and catalog delete, in `chajewels/la-tracking`) are merged in Git and contained in the Hub's `main` as of 2026-10-29 (read-only GitHub state). The owner confirms the Catalog Delete database function and its index were applied on 2026-10-29 at about 14:38 JST; no deletion has been performed (zero recorded; B2200 and 8C100 still present). Status: LIVE — FIRST REAL DELETE PENDING; the first owner-authorised deletion must still be observed and verified, and the apply status of the #672 migration was not stated. Do not conflate this with website SEO releases. See `docs/seo/OUTSTANDING-ISSUES-REGISTER.md` §2.
- This addendum is **planning/documentation only**. None of Steps 1–5 is implemented by writing this section.

## 33.5 Outstanding issues register (references, 2026-10-29)
Five workstreams are recorded (three open for SEO; OG-PRODUCT closed on 2026-10-30; BUG-03 moved out of SEO scope on 2026-10-31) with status, evidence, owner-approval requirement and definition of done in `docs/seo/OUTSTANDING-ISSUES-REGISTER.md`: BUG-03 article wording (§1, MOVED OUT OF SEO SCOPE by the owner on 2026-10-31: no material SEO impact; separate content task, Option A decided), HUB-CATALOG catalog delete (§2, LIVE — FIRST REAL DELETE PENDING), BUG-09 Search Console (§3, OPEN — property verified and 3 priority URLs observed indexed 2026-10-30; coverage report and performance baseline pending; see `docs/seo/SEARCH-CONSOLE-BASELINE-2026-10-30.md`), BUG-06 `/gold-guide` redirect chain (§4, OPEN — deferred until owner-approved redirect work), OG-PRODUCT product sharing metadata (§5, CLOSED — DEPLOYED AND VERIFIED LIVE 2026-10-30; PR #441 released via PR #442). Related to Step 2 (listing sharing metadata, done) and to Step 3a (font scope, deployed); none of the five is part of Step 3b or 3c. Step 4: AUDITED — OWNER APPROVAL PENDING (updated 2026-10-31): owner decisions recorded 2026-10-30 (`STEP-4-OWNER-APPROVAL-RECORD.md`); the article item (BUG-03, OD-S4-2) is no longer part of SEO Step 4 (owner, 2026-10-31); the collection/category texts in the H1 checklist owner-operated and not yet applied in the Hub (live re-check 2026-10-31). BUG-09 update 2026-10-31: first one-day Performance export taken, coverage still processing (`SEARCH-CONSOLE-BASELINE-2026-10-31.md`).


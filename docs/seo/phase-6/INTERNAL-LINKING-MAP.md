# Phase 6–8 — Internal linking map (master plan §21), real routes only

**Status:** AUDITED / READY FOR OWNER REVIEW. Documentation only; no link in the storefront was changed. Routes marked **LIVE** were verified in the production sitemap or by fetch on 2026-10-29. Routes marked **PROPOSED** do not exist and need the route-change approval (OD-P6-5 in `COMMERCIAL-LANDING-ARCHITECTURE.md`); until they exist, the fallback shown in the table is the link to use.

Conventions: locale routes only (`/en/…`; the `/ja/…` sibling exists for every LIVE page except layaway, which is English-only by owner decision, `layawayOffered`). Links are built with `localePath` in code, never hardcoded. Anchor text follows the wording rule (X9): "K18 gold", "K18 hallmarks used in Japan", "K18 jewelry authentication in Japan", "buy K18 jewelry in Japan"; never a country as a purity word, never a generic origin claim.

---

## 1. Route inventory used by the paths

| Node | Route | State | Fallback while PROPOSED |
|---|---|---|---|
| Home | `/en` | LIVE | — |
| Necklaces | `/en/collections/necklaces` | LIVE | — |
| Bracelets | `/en/collections/bracelets` | LIVE | — |
| Rings | `/en/collections/rings` | LIVE | — |
| Pendants | `/en/collections/pendants` | LIVE | — |
| Pearls | `/en/collections/pearls` | LIVE | — |
| Fine Jewelry (new K18) | `/en/categories/fine-jewelry` | LIVE | — |
| Preloved Jewelry | `/en/categories/preloved-jewelry` | LIVE | — |
| Preloved Branded Jewelry | `/en/categories/preloved-branded-jewelry` | LIVE | — |
| Kihei collection | `/en/collections/kihei` | PROPOSED (Hub taxonomy, OD-P6-1) | `/en/collections/necklaces` |
| Jewelry Guide | `/en/jewelry-guide` | LIVE | — |
| Jewelry Guide — Metals and stamps | `/en/jewelry-guide#metals` | LIVE (anchor) | — |
| Jewelry Guide — Necklace length | `/en/jewelry-guide#necklace-length` | LIVE (anchor) | — |
| Jewelry Guide — Clasps | `/en/jewelry-guide#clasps` | LIVE (anchor) | — |
| Jewelry Guide — Care | `/en/jewelry-guide#care` | LIVE (anchor) | — |
| Jewelry Guide — Diamond 4C | `/en/jewelry-guide#diamond-4c` | LIVE (anchor) | — |
| Shopping Guide | `/en/shopping-guide` | LIVE | — |
| FAQ | `/en/faq` (`#payments-and-layaway` anchor is linked from the live home page) | LIVE | — |
| Layaway | `/en/layaway` | PROPOSED (Phase 3, X3) | legacy `/layaway` via `localePath` (Option ii) |
| Wholesale | `/en/wholesale` | LIVE | — |
| About | `/en/about` | LIVE | — |
| Why Cha Jewels | `/en/why-cha-jewels` | LIVE | — |
| Contact | `/en/contact` | LIVE | — |
| Blog | `/en/blog` | LIVE | — |
| Kihei pillar | `/en/guides/kihei` | PROPOSED (Phase 7) | `/en/jewelry-guide#metals` |
| K18 pillar | `/en/guides/k18-gold-japan` | PROPOSED (Phase 8) | `/en/jewelry-guide#metals` |
| Kihei cluster pages | `/en/guides/kihei-*` (see `phase-7/KIHEI-CLUSTER-PLAN.md`) | PROPOSED | the pillar, else `#metals` |
| K18 cluster pages | `/en/guides/k18-*` (see `phase-8/K18-CLUSTER-PLAN.md`) | PROPOSED | the pillar, else `#metals` |
| Kihei products | `/en/products/n1616-necklace-k18-16-65g-m-cut-16-sided-triple-kihei-0-7mm-40cm`, `/en/products/8c100-necklace-k18-100g-8-cut-kihei-50cm`, `/en/products/r7813-ring-k18-pt900-7-80g-diamond-0-172ct-soft-kihei-bee-sz-13-preloved` | LIVE (R7813 shown SoldOut 2026-10-29) | — |

---

## 2. Topic paths (master plan §21 "deliberate topic paths")

### Path A — Kihei (education → commerce)

```text
What is a Kihei chain?            /en/guides/what-is-kihei-chain   (cluster, PROPOSED)
  ↓
Kihei guide (pillar)              /en/guides/kihei                 (PROPOSED)
  ↓
6-cut vs 8-cut vs 12-cut          /en/guides/kihei-cuts-explained  (cluster, PROPOSED)
  ↓
Shop Kihei                        /en/collections/kihei            (PROPOSED → fallback /en/collections/necklaces)
  ↓
Product                           /en/products/8c100-necklace-k18-100g-8-cut-kihei-50cm
```

Rules: each cluster page links up to the pillar in its first screen and across to one sibling; the pillar links down to every cluster page once, and to the collection (or fallback) in the first screen and again at the end; every page in the path links to `/en/jewelry-guide#metals` for the stamp table instead of repeating it.

### Path B — K18 purity and hallmarks

```text
What does K18 mean?               /en/guides/what-is-k18-gold      (cluster, PROPOSED)
  ↓
K18 guide (pillar)                /en/guides/k18-gold-japan        (PROPOSED)
  ↓
K18 hallmarks used in Japan       /en/guides/k18-hallmarks-japan   (cluster, PROPOSED)
  ↓
Jewelry Guide — Metals and stamps /en/jewelry-guide#metals         (LIVE; the stamp table lives here, once)
  ↓
Shop new K18                      /en/categories/fine-jewelry      (LIVE)
  ↓
Product                           /en/products/n1616-necklace-k18-16-65g-m-cut-16-sided-triple-kihei-0-7mm-40cm
```

### Path C — Weight (shared by both pillars)

```text
How gold jewelry is weighed       /en/guides/how-gold-jewelry-is-weighed   (K18 cluster, PROPOSED)
  ↓
30g vs 50g vs 100g Kihei          /en/guides/kihei-weight-classes          (Kihei cluster, PROPOSED)
  ↓
Shop by piece                     /en/collections/necklaces · /en/collections/bracelets
```

One weight explainer, two entry points: the Kihei weight-class page links to the K18 "how weighed" page rather than restating the method (no near-duplicate buying guides, §25).

### Path D — Authentication and preloved

```text
K18 jewelry authentication in Japan   /en/guides/k18-authentication-japan  (cluster, PROPOSED; also Kihei topic 11)
  ↓
FAQ: Are Cha Jewels products authentic? / What does preloved mean?   /en/faq   (LIVE)
  ↓
Preloved Jewelry                      /en/categories/preloved-jewelry       (LIVE)
  ↓
Product                               /en/products/r7813-ring-k18-pt900-7-80g-diamond-0-172ct-soft-kihei-bee-sz-13-preloved
```

### Path E — Layaway (English only; activate after Phase 3)

```text
Kihei pillar / K18 pillar  →  "Reserve with layaway"  →  /en/layaway (PROPOSED; legacy /layaway via localePath until then)  →  calculator  →  product
```

Never rendered on `ja`; the link is wrapped in `layawayOffered(lang)` like every other layaway link.

### Path F — Trade

```text
K18 pillar "Buying K18 jewelry in Japan" → /en/wholesale (LIVE) ; FAQ wholesale Q&As → /en/wholesale
```

---

## 3. Product reverse-linking (master plan §21 "Product reverse-linking")

Proposed as a small "Learn more" block on the product page, **conditional on data the Hub already sends** (never inferred from the SKU or name — contract note `api.md` §718):

| Condition (Hub data) | Link text | Target | Fallback |
|---|---|---|---|
| `material` contains `K18` | "What K18 means and how to read the stamp" | `/en/guides/k18-gold-japan` | `/en/jewelry-guide#metals` |
| product is in the `kihei` collection (`collection_slugs`) | "Learn about Kihei cuts and weaves" | `/en/guides/kihei` | `/en/collections/necklaces` |
| `weight_g` present (field name UNVERIFIED — confirm in `api.md` before implementing) | "How gram weight works" | `/en/guides/how-gold-jewelry-is-weighed` | `/en/jewelry-guide#metals` |
| category is preloved | "How we check preloved pieces" | `/en/faq` (authenticity Q&As) | — |
| `layawayOffered(lang)` and reservable | "Reserve with layaway" (already exists) | `/layaway` → `/en/layaway` after Phase 3 | — |

Implementation note for later: this block is storefront-owned (`components/catalog/…`), needs a unit test per condition, and is out of scope for this documentation PR.

---

## 4. Collection and category → guide links

Once the Hub SEO fields exist (§4 of the architecture doc), each collection/category's `seo_copy` ends with one "Learn more" sentence:

| Page | Links to |
|---|---|
| `/en/collections/necklaces` | Kihei pillar (fallback `#metals`), `#necklace-length`, `#clasps` |
| `/en/collections/bracelets` | Kihei pillar (fallback `#metals`), `#clasps` |
| `/en/collections/pearls` | `#care` (pearl care lives in the Jewelry Guide), FAQ certificate Q&A |
| `/en/categories/fine-jewelry` | K18 pillar (fallback `#metals`), `#diamond-4c` |
| `/en/categories/preloved-jewelry`, `preloved-branded-jewelry` | FAQ authenticity Q&As, K18 authentication cluster page (fallback FAQ) |
| `/en/wholesale` | K18 pillar "Buying K18 jewelry in Japan" section (fallback `#metals`) |

---

## 5. Guardrails

- No link may resolve to HTTP 404 (Phase 2C exit criterion). Every PROPOSED target is rendered through its fallback until the route is live and verified; the fallback table above is the contract.
- No orphan: every new guide is linked from the pillar, from at least one collection/category copy block (via the Hub field) and from one sibling.
- Anchor text never says "<country> gold" or makes an origin claim; "authenticated in Japan" / "hallmark checked in Japan" are the approved service phrases.
- Japanese pages never link to anything layaway-related.
- Nothing in this map is implemented by this PR.

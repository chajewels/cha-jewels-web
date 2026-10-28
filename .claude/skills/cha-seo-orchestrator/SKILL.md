---
name: cha-seo-orchestrator
description: Coordinate implementation of the Cha Jewels SEO Master Plan across the Next.js ecommerce repository. Use for SEO roadmap execution, deciding implementation order, auditing current completion, preventing duplicate work, coordinating technical SEO, multilingual routing, structured data, Merchant Center, product SEO, content architecture and final QA.
---

# Cha Jewels SEO Orchestrator

Read the SEO master plan and current implementation status before making SEO changes.

## Rules

1. Audit before modifying.
2. Never assume an item is missing because it appears in the master plan.
3. Search the repository for an existing implementation first.
4. Preserve working SEO infrastructure.
5. Never implement multiple high-risk phases in one uncontrolled change.
6. Maintain `docs/seo/SEO-IMPLEMENTATION-STATUS.md`.
7. Distinguish:
   - implemented
   - verified
   - deployed
   - recrawl pending
   - observed in Search Console
8. Do not claim rankings or indexing without evidence.

## Phase Order

Prioritize:

1. baseline
2. technical SEO
3. locale architecture
4. layaway indexability
5. structured data
6. Merchant Center
7. commercial landing pages
8. Kihei authority
9. K18 authority
10. Filipino content
11. local/external authority

Before starting a phase, confirm dependencies from previous phases are satisfied.

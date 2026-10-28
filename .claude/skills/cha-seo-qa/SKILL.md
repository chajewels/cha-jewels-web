---
name: cha-seo-qa
description: Verify Cha Jewels SEO changes after implementation using automated and manual regression checks for routing, HTTP status, metadata, canonical, hreflang, sitemap, robots, JSON-LD, initial HTML, language behavior and ecommerce route safety.
---

# SEO QA

No SEO implementation is complete without verification.

## Route Matrix

Test representative:

- /
- product
- sold product
- collection
- category
- blog
- guide
- FAQ
- about
- layaway
- legal
- login
- account
- checkout
- unknown route

Test EN and JA where applicable.

## Verify

- HTTP status
- redirects
- title
- description
- canonical
- hreflang
- robots
- sitemap inclusion/exclusion
- JSON-LD validity
- OG metadata
- initial HTML
- direct deep-link navigation

## Status Vocabulary

Use:

- implemented
- locally verified
- deployed
- recrawl pending
- observed in Search Console

Never convert “deployed” into “indexed”.

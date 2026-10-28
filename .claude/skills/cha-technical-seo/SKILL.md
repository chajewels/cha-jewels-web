---
name: cha-technical-seo
description: Audit and implement technical SEO for the Cha Jewels Next.js website, including robots, sitemap, metadata, canonical URLs, HTTP status behavior, redirects, indexing controls, preview protection, crawlability and server-rendered search signals.
---

# Technical SEO

Inspect existing implementation first.

Key files commonly include:

- app/robots.ts
- app/sitemap.ts
- app/layout.tsx
- lib/page-meta.tsx
- middleware.ts
- next.config.ts

## Never

- canonicalize every page to the homepage
- advertise 404 pages in sitemap
- index account/checkout/API/customer routes
- assume HTTP 200 means indexed
- use sitemap presence as proof of indexing

## Verify

For representative routes inspect:

- HTTP status
- redirects
- robots
- title
- description
- canonical
- hreflang
- initial HTML
- sitemap inclusion

Check one neighboring route after every template-level change.

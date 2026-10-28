---
name: cha-i18n-seo
description: Design, migrate and validate Cha Jewels multilingual SEO architecture, especially dedicated /en/ and /ja/ routes, language switching, hreflang, canonicals, redirects, sitemap localization and preservation of intentionally unavailable language-specific services such as Japanese layaway.
---

# Multilingual SEO

Current same-path cookie/query language behavior is legacy architecture.

Target:

- /en/
- /ja/

Do not introduce /fil/ during the core EN/JA migration.

## Requirements

Every indexable localized page needs:

- unique crawlable locale URL
- self canonical
- correct hreflang siblings
- x-default strategy
- locale-correct internal links
- valid sitemap entry
- HTTP 200

Never create a language page that does not actually exist commercially.

In particular, do not create Japanese layaway merely for SEO if Cha Jewels does not offer it.

## Migration

1. inventory legacy URLs
2. add locale architecture
3. test new routes
4. update internal links
5. update sitemap
6. verify canonicals/hreflang
7. add permanent legacy redirects
8. regression test

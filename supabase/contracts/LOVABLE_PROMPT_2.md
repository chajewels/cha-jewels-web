Paste into the Hub project in Lovable as one message:

---
Changes to the Website Catalog and Website API (spec `api.md` updated):

1. Metal field: replace the current options with exactly: K18, K14, K10, PT1000, PT950, PT900, SILVER925. Store these values. Label K18 in the admin as "K18 (Au750 / 18K)". Do not add 750, Au750 or 18K as separate options; they are K18.
2. Product edit form: remove the Tagalog description field and the peso price field. Keep one English description field and one yen price.
3. Auto-translate: when a product is saved with an English description, generate a Japanese translation into `description_ja` using Lovable AI (formal retail Japanese, keep numbers, metal names and "K18" unchanged, never translate "Made in Japan" into a country-branded gold term). Show the Japanese text read-only under the English field with a "Regenerate" button. Only regenerate when the English text changes.
4. Exchange rate: add table `fx_rates(date, jpy_php numeric)` and a daily cron edge function that fetches JPY→PHP from a free rate API and inserts today's row. Add `GET /fx` to the `website` function returning `{jpy_php, as_of}` for the latest row. Keep `price_php` in the API response as `price_jpy * jpy_php` rounded, computed at read time; do not store it.
5. Collections: replace the four current collections with jewelry types: Necklaces (slug `necklaces`), Pendants (`pendants`), Earrings (`earrings`), Bracelets (`bracelets`), Rings (`rings`), Anklets (`anklets`), Sets (`sets`). Keep a short English description on each; I will edit them. Allow adding more types from the admin. Re-attach the existing product to the correct type.
6. Trigger `notify_website` on collection changes too.
7. Confirm `GET /catalog/collections` now returns the new types and `GET /fx` returns a rate.
---

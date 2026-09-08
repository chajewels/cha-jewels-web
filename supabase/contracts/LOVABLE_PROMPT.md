Paste this into the Cha Jewels Hub project in Lovable, one message:

---
Build the Website API described in the attached `api.md` as a single Supabase edge function named `website` that routes on the request path.

Requirements:
1. First apply the two migrations in `supabase/migrations/0001_website_catalog.sql` and `0002_loyalty_signups.sql`. Review them against our existing tables first; do NOT recreate customers, orders, layaway_plans, layaway_payments, or loyalty_ledger. Products, variants, media and collections are new. Keep the terminology trigger.
2. Add secrets WEBSITE_API_KEY (generate a random 40-character value), WEBSITE_URL (I will provide), REVALIDATE_SECRET (random 40 characters). Tell me where to copy WEBSITE_API_KEY and REVALIDATE_SECRET from; do not print them in chat.
3. Every request must carry header `x-api-key` equal to WEBSITE_API_KEY; otherwise 401.
4. Implement exactly the endpoints and response shapes in the spec's Endpoints table. Responses must never include cost_basis, margin, or commission fields; strip them explicitly.
5. `POST /layaway/quote` must be implemented as a Postgres function `layaway_quote(p_price int, p_term_months int, p_currency text)` and the edge function calls it, so the Hub's own layaway screens can use the same function. Rules: 30% down payment; balance in equal monthly payments over the term; allowed terms 3 to 6 months, up to 8 when price is ¥300,000 or more (for PHP use the same threshold converted at the day's rate); clamp the term to the maximum instead of returning an error; 0% interest; integers only.
6. Add a database trigger on products, product_variants, product_media and collection_products that calls an edge function `notify_website`, which POSTs `{productSlug, collectionSlug}` to `${WEBSITE_URL}/api/revalidate` with header `x-revalidate-secret`.
7. Add a Products section to the Hub admin: create/edit products and variants, upload media to storage, attach to collections, set status. Cost basis is visible only to the admin role.
8. Run the five acceptance tests at the bottom of the spec and show me the results.
---

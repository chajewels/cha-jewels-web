# RPC and edge-function contracts (for Lovable)

These are the server functions the website calls. Claude Code writes the callers; Lovable implements the functions in the shared Hub project. Signatures are binding; internals are Lovable's.

## `layaway_quote(p_price int, p_term_months int, p_currency text) → json`
Single source of layaway math for the website AND the Hub.
Rules (from the pricing framework): down payment 30%; balance split equally over `p_term_months`; allowed terms 3–6, or up to 8 when price ≥ ¥300,000 (PHP threshold = ¥300,000 at the day's rate); 0% interest.
Returns: `{ down_payment, monthly, term_months, total, max_term_months, currency }`. Must clamp `term_months` to `max_term_months` rather than error.
Security: `security definer`, callable by anon. Pure function, no writes.

## `create_live_claim(variant_id uuid, price int, hold_minutes int) → live_claims`
CSR-only (check role). Generates a code `CJ-####`, decrements stock atomically, sets `expires_at`.

## `claim_checkout(code text, mode 'full'|'layaway', term_months int) → order or layaway_plan`
Customer must be authenticated. Idempotent on `code`. Creates the order/plan using the Hub's existing tables and the same `layaway_quote`.

## `expire_claims()`  — cron every 15 min
Sets `held` claims past `expires_at` to `expired`, restores stock, notifies the CSR (Slack/Messenger).

## `award_points(order_id)` / `redeem_points(customer_id, points)`
Use the existing `loyalty_ledger`. ¥10,000 = 100 pts; 1 pt = ¥1; inactive after 6 months without a purchase; non-transferable.

## `notify_website(product_slug text, collection_slug text)`
Called by a Hub database trigger on products / product_variants / product_media changes. POSTs to `${SITE_URL}/api/revalidate` with header `x-revalidate-secret`.

## Payment webhooks (Phase 2)
`stripe_webhook`, `paymongo_webhook` → verify signature → `record_payment(order_id | plan_id, amount, provider_ref)` → update status, award points. Must be idempotent on `provider_ref`.

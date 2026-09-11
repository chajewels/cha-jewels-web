# Phase 2 — Step 2: cart, checkout quote, transfer orders (first real order, no Square)

Read `docs/tasks/phase2-plan.md` (storefront) / `docs/PHASE2-WEBSITE.md` (Hub) first. Work on `feature/phase2-checkout` in both repos. Lovable receives one apply-and-deploy message at the end, shown to Cynthia first. Check the live schema before writing any migration (step 1 lesson); estimate with the exact expression the write uses.

## Hub (la-tracking)

### Schema — check what exists first
`orders`, `order_items`, `layaway_plans`, `layaway_payments` already exist for Live/DM sales. Extend, never fork. Expected additions (only if missing, verify each):
- `orders.channel text check in ('web','live','dm')` default `'dm'` for existing rows
- `orders.order_type text check in ('SELF','GIFT','PROXY')` default `'SELF'`
- `orders.payment_method text check in ('square','transfer',null)`, `orders.payment_status text check in ('pending_transfer','paid','failed','refunded','cancelled')`
- `orders.ship_to_address_id uuid references customer_addresses`, `orders.recipient_name text`, `orders.recipient_phone text`, `orders.gift_note text`
- `orders.quote_id uuid`, `orders.web_reference text unique` (human code shown to the customer, e.g. `CJ-W-000123`)
- `order_items`: `variant_id`, `sku`, `name`, `unit_price_jpy`, `qty`, `line_total_jpy` (if a different shape exists, map to it)
- New `checkout_quotes` (id, customer_id, items jsonb, mode, term_months, order_type, ship_to_address_id, subtotal_jpy, shipping_jpy, total_jpy, deposit_jpy, schedule jsonb, expires_at default now()+30min, consumed_at)
- Stock: quote does not reserve; `POST /checkout/pay` decrements `website_product_variants.stock_qty` atomically (`update … set stock_qty = stock_qty - qty where stock_qty >= qty`) and fails with 409 `out_of_stock` otherwise. A transfer order holds stock for **72 hours**; a cron `expire_transfer_orders` (hourly) cancels unpaid transfer orders past `transfer_due_at` and restores stock.

### Shipping
Table `shipping_rates(country, min_subtotal_jpy, fee_jpy)`. Seed: JP 0→¥800, JP ≥¥50,000→¥0; PH 0→¥3,500, PH ≥¥100,000→¥0; OTHER → quote returns `shipping: null` and `requires_manual_quote: true`. Cynthia can change these in the Hub later; a tiny admin editor is optional in this step.

### Routes in `website` (customer JWT via `requireCustomerUser`)
- `POST /checkout/quote` body `{items:[{variant_id, qty}], mode:'full', order_type, ship_to_address_id}` → validates items active and in stock, computes subtotal, shipping, total; stores a `checkout_quotes` row; returns `{quote_id, items, subtotal_jpy, shipping_jpy, total_jpy, expires_at}`. `mode:'layaway'` returns 501 `not_yet` in this step.
- `POST /checkout/pay` body `{quote_id, method:'transfer'}` → quote must belong to the user, be unexpired and unconsumed; creates order (`pending_transfer`, `transfer_due_at = now()+72h`), order_items, decrements stock, marks quote consumed, returns `{order_id, web_reference, transfer_instructions}`. `method:'square'` → 501 in this step.
- `GET /orders` (own, newest first, 50), `GET /orders/:id` (own) → order, items, status, transfer instructions if pending.
- Transfer instructions come from `settings` (or a new `payment_instructions` table) with JP bank and PH GCash/bank details, both languages. Placeholder text until Cynthia supplies real details; never invent account numbers.

### Staff side (Hub UI, frontend only)
- Orders list gains a **Web** channel filter and a "Confirm transfer received" action that sets `payment_status='paid'`, `paid_at`, and triggers `award_points` (reuse the existing points path) and the receipt email (step 6; stub now).
- New orders notify staff the way live claims do today (reuse the existing Slack/Messenger notifier if present).

### Deploy message (draft, show first)
Apply migration, deploy `website` and `expire_transfer_orders`, schedule the hourly cron. Assertions on real grep counts — count them before writing the message.

## Storefront (cha-jewels-web)

- Cart: `lib/cart.ts` (cookie-backed, server-readable), `CartButton` in header with count, `/cart` page. One-of-a-kind pieces: qty fixed at 1, disable add when `stock_qty` is 0.
- Product page: replace the passive CTA with **カートに入れる / Add to cart** (full price) — layaway button waits for step 4.
- `/checkout` (protected): step 1 address (pick from `/me` addresses or add one via `PUT /me/addresses`), order type SELF/GIFT/PROXY with recipient fields for GIFT/PROXY; step 2 review → `POST /checkout/quote`; step 3 payment: only **銀行振込 / Bank transfer (JP) · GCash / bank transfer (PH)** in this step → `POST /checkout/pay` → `/checkout/complete/[order_id]` showing the web reference, amount, instructions, and 72-hour deadline. Copy in JA and EN.
- `/account/orders`, `/account/orders/[id]` using the new routes; status labels JA/EN.
- Fixture mode: canned quote and order so previews work without the Hub.
- `hub-api.ts`: add `quote`, `pay`, `orders`, `order` with the customer JWT forwarded (`Authorization: Bearer`), not the API key.

## Acceptance
Sandbox-free, real Hub: Cynthia signs in on the develop preview, adds the test product, checks out with transfer, sees the web reference; the order appears in the Hub under channel Web with status pending_transfer and stock decremented; a CSR clicks "Confirm transfer received" → status paid, points ledger entry created; `/account/orders/[id]` shows paid. Let a second test order pass its (temporarily shortened) 72-hour deadline → cancelled, stock restored.

# Measurement log

Dated entries only, newest last. Every change that could move a number gets a
line here on the day it happens — instrumentation, a release, a pricing change,
a campaign. The point of the log is that months later we can tell which change
a movement belongs to, instead of guessing.

**The rule this log exists to enforce: step 4's effect must never be attributed
to the remodel, and the remodel's effect must never be attributed to step 4.**
They are separate releases with separate dates, recorded separately below.

---

## Two sources of truth, deliberately not joined

| | Browser (Vercel Web Analytics) | Hub (Postgres) |
|---|---|---|
| Answers | was the piece looked at; did a cart addition land | was an order created; was a payment confirmed |
| Events | `product_view`, `add_to_cart` | `cash_orders`, `cash_payments` rows |
| Granularity | aggregate counts per SKU | per order, per payment |

**There is no per-visitor join between them, and none is implied.** The browser
events carry no order reference, because a visitor browsing products does not
have one yet. The two sides are read as aggregates, side by side, by eye.

Why the browser cannot report orders or payments: a click on "pay" is not
`create_web_order_atomic` succeeding, and it is certainly not a CSR confirming a
bank transfer days later. Only the Hub knows those happened.

---

## Timeline

| Date | Event |
|---|---|
| 2026-09-14 | Instrumentation written (PR 1). **Not live** — merge and deploy are the owner's. |
| 2026-09-15 | **Instrumentation live in production** (first storefront production release). |
| 2026-09-15 | First production check: `add_to_cart` seen, **`product_view` absent**. Page views recorded for both product pages in the same session, so the pages rendered and the provider worked. Root cause: `<AnalyticsProvider/>` was mounted after `{children}`, so `product_view`'s mount effect called `track()` before `inject()` had created `window.va` — and `track()` silently no-ops when it is undefined. Fixed; awaiting production confirmation. **The baseline did NOT start here.** |
| **2026-09-15** | **`product_view` CONFIRMED FIRING in production**, after the #29 fix and the #31 release. Vercel Events panel: `product_view` **1 visitor / 1 total**, where it was **zero** for the whole life of the instrumentation before #29. **THE BASELINE WINDOW STARTS ON THIS DATE.** What this row does and does not prove is set out below — the per-SKU de-duplication is NOT yet proven, and this row must not be read as though it were. |
| _pending_ | **Step 4 release (web layaway).** Separate line, separate date. Anything after it is step 4 plus whatever else; do not attribute it to the remodel. |
| _pending_ | Remodel release, if it happens. |

### What the 2026-09-15 confirmation proves, and what it does not

**Proven.** `product_view` reaches Vercel. The count moved from zero — where it
had sat since the instrumentation went live — to 1 visitor / 1 total. That is
the whole of what #29 was about: the event was being dropped silently by
`track()` before `window.va` existed, and it is not being dropped now.

**NOT proven: the per-SKU de-duplication.** The obvious check would be to read
`product_view` against `add_to_cart`, which stands at 3. That comparison does
not work, and it is worth writing down why so nobody tries it later:

> **The two counters cover different windows.** `add_to_cart` has been recording
> all day, including attempts made BEFORE the #29 fix, when `product_view` was
> still being dropped. So its 3 is cumulative across a period in which the other
> number was structurally incapable of moving. Comparing a post-fix count with a
> whole-day count says nothing about either.

**What would settle it:** one session, two different product pages, and
`product_view` reaching 3 — two distinct SKUs counted once each, and neither
counted twice. A reload of the same piece is a fresh document and legitimately
counts again; a language toggle on the same page must not.

That check is worth doing once deliberately, but it does not block the baseline.
Real traffic answers it on its own: if the de-duplication were broken, views
would run far ahead of visitors within days, and the ratio is visible in the same
panel. The baseline starts today either way, because the denominator is now
being recorded at all — which it was not yesterday.

### Baseline window

Two weeks is a **starting** window, not proof. When the verification date is
filled in above, also record here:

- total `product_view` events in the window,
- total `add_to_cart` events in the window,
- orders placed and payments confirmed over the same dates (queries below).

If the volume is low — a handful of views a day — two weeks decides nothing and
the window has to grow. Record the numbers so that judgement can be made from
data rather than from the calendar.

---

## What records the moment a payment was confirmed

Established 2026-09-14 by inspecting the live schema and rows.

**`cash_payments.created_at` is the authoritative confirmation timestamp.**

- `review-payment-submission` is the only writer of payment rows (CLAUDE.md,
  "PAYMENT SUBMISSION FLOW"), and it inserts the row at the moment a reviewer
  confirms. The column is `NOT NULL DEFAULT now()`, so the value is set
  server-side at insert and cannot be supplied by a caller.
- Verified against live rows: every payment row's `created_at` matches its
  submission's `updated_at` to within ~100 ms, which is the same transaction
  inserting the payment and flipping the submission. Example — invoice 19646:
  payment row `2026-09-10 09:29:30.392+00`, submission `2026-09-10 09:29:30.484+00`.

What is **not** the confirmation time, and why:

| Candidate | Why not |
|---|---|
| `cash_orders.created_at` | When the order was placed. Says nothing about payment. |
| `cash_orders.payment_status` | A current state with no timestamp. Cannot date anything. |
| `cash_payments.date_paid` | A `date`, not a timestamp, and it is the **customer's transfer date** as entered by staff — the day the money left their bank. Diverges from confirmation: invoice 19644 was transferred 2026-09-09 and confirmed 2026-09-10 00:37 UTC. |
| `payment_submissions.updated_at` | Correct at the moment of confirmation, but the column is mutable — attaching proof or restoring a rejected submission rewrites it later. There is no `reviewed_at` column. |
| `cash_orders.completed_at` | The confirmation moment of the **final** payment, i.e. when the order became fully paid. Right for "orders completed", wrong for "payments received" on a part-paid order. |

---

## The two queries

Read-only. Run them unchanged so the same numbers are produced the same way each
time; if one needs to change, change it here and add a dated line saying so.

Both exclude test accounts with the canonical rule from CLAUDE.md —
`invoice_number ~ '^[0-9]+$'` keeps only real, purely numeric invoices. Both are
scoped to `source_channel = 'web'`; drop that predicate to include Hub-created
orders.

**They answer different questions and will diverge. That is the point.** A
September order confirmed in October is in query A's September cohort and in
query B's October receipts. Neither is wrong; they are different clocks.

### A — order-date cohorts: orders PLACED in a period, however they later resolved

Use for "of the web orders placed in September, what became of them". The
resolution columns keep moving as pending orders settle, so a cohort's row today
is not the row it will show next month — note the run date when you record it.

```sql
SELECT date_trunc('month', co.order_date)::date AS order_month,
       co.currency::text                                                  AS currency,
       count(*)                                                           AS orders_placed,
       count(*) FILTER (WHERE co.status::text = 'completed')              AS now_completed,
       count(*) FILTER (WHERE co.status::text = 'pending')                AS still_pending,
       count(*) FILTER (WHERE co.status::text IN ('cancelled','expired')) AS cancelled_or_expired,
       sum(co.total_amount)                                               AS placed_value,
       sum(co.total_amount) FILTER (WHERE co.status::text = 'completed')  AS completed_value
FROM public.cash_orders co
WHERE co.source_channel = 'web'
  AND co.invoice_number ~ '^[0-9]+$'
  AND co.order_date >= (date_trunc('month', (now() AT TIME ZONE 'Asia/Manila')) - interval '5 months')::date
GROUP BY 1, 2
ORDER BY 1, 2;
```

### B — payments RECEIVED in a period, whenever the order was placed

Use for "how much did we actually confirm in September". Bucketed on
`cash_payments.created_at` in PHT, the Hub's canonical timezone.

```sql
SELECT date_trunc('month', (cp.created_at AT TIME ZONE 'Asia/Manila'))::date AS confirmed_month,
       co.currency::text     AS currency,
       count(DISTINCT co.id) AS orders_with_a_confirmed_payment,
       count(*)              AS payments_confirmed,
       sum(cp.amount_paid)   AS confirmed_value
FROM public.cash_payments cp
JOIN public.cash_orders co ON co.id = cp.cash_order_id
WHERE cp.voided_at IS NULL
  AND co.source_channel = 'web'
  AND co.invoice_number ~ '^[0-9]+$'
GROUP BY 1, 2
ORDER BY 1, 2;
```

Do **not** join `payment_submissions` into either query. An order can have
several payments and several confirmed submissions, and joining them fans the
rows out — invoice 19646 returns four rows for two payments. `cash_payments`
alone is the grain.

### Both return zero rows today — correctly

Run 2026-09-14: every web order so far belongs to Test Customer
(`TEST-9000xx`), and the numeric filter excludes all of them. Dropping the
filter shows the queries work and shows the divergence they are built to expose:

| | orders placed (A) | payments confirmed (B) |
|---|---|---|
| September 2026, web, test rows included | 4 orders, ¥2,010,920 | 3 payments, ¥1,330,940 |

Four placed, three confirmed, different money — one order was cancelled before
it ever paid and another was cancelled after paying. The first real row appears
when a real customer orders through the storefront.

---

## Browser events

Two, and no more without a paid decision.

| Event | Properties | Fires |
|---|---|---|
| `product_view` | `sku`, `lang` | Product page, once per SKU per page-load session |
| `add_to_cart` | `sku`, `lang` | After a cart addition resolves successfully — both the plain cart button and "reserve with layaway", which also adds to the cart |
| `service_request` | `kind`, `lang` | After a service request (resize, cleaning, repair, appraisal, other) is stored by the Hub — from the order or plan page, never from the click |

Vercel Pro allows **two** custom properties per event and both are spent. A
third (for example, telling a layaway reservation apart from a plain addition)
requires the Web Analytics Plus add-on and is an owner decision, not a code
change.

Not emitted from: preview deployments, fixture mode
(`NEXT_PUBLIC_PREVIEW_FIXTURES=1`), or localhost. See `lib/analytics.ts`.

**A preview can never confirm either event**, because `analyticsEnabled()`
requires `NEXT_PUBLIC_VERCEL_ENV === "production"` and no preview sets it. Any
confirmation has to happen on the production domain, which is why the 2026-09-15
hole existed for a release rather than being caught before it.

### Why `product_view` is harder to keep working than `add_to_cart`

`add_to_cart` is reported from a click, long after the page has mounted.
`product_view` is reported from a mount effect, which is the one moment when
`window.va` may not exist yet — and `track()` drops an event silently in that
case. Two invariants keep it working, both enforced by `npm run check:analytics`
in CI:

1. `<AnalyticsProvider/>` mounts **before** `{children}` in `app/layout.tsx`, so
   its effect creates the queue first.
2. `trackProductView` records the SKU in `emit()`'s `onSent` callback, never
   before the call — otherwise a dropped event consumes that SKU's one slot and
   every later view of the same piece is suppressed too.

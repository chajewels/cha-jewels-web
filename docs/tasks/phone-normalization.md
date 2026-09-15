# Task — normalise `customers.mobile_number` to E.164, then enable phone OTP

Repo: **`chajewels/la-tracking`** (Hub). This is Hub-side work; the file lives here
with the other task specs so both sessions read one source.

**Blocks:** phone OTP sign-in on the storefront. Until this is done, `/login`
offers the email magic link only, and `POST /auth/customer` answers
`422 email_required_for_account` for any JWT without an email. That is
deliberate — see below.

---

## Why this blocks phone sign-in

The Phase 2 plan (`docs/tasks/phase2-plan.md`) names phone OTP as the primary
sign-in. It cannot ship yet.

The Hub links a signed-in auth user to their customer record by **verified
email**, protected by an existing partial unique index on
`lower(email) WHERE auth_user_id IS NOT NULL`. A phone-OTP session carries no
email at all, so that rule cannot fire — and there is nothing equivalent for
phone.

Measured on live data, 2026-09-10:

| | |
|---|---|
| Customers total | 882 |
| With a `mobile_number` | 863 |
| Already clean E.164 (`^\+[1-9][0-9]{7,14}$`) | **77** |
| With an email | 739 |
| Groups colliding on normalised digits | **10** |

So 786 of 863 phone numbers are in some other shape, and 10 groups of customers
share a number once punctuation and country prefixes are stripped.

**The risk is not a failed login — it is the wrong login succeeding.** Matching a
new signup to a customer by a non-unique phone number can attach that session to
someone else's record, handing over their order history, addresses and loyalty
balance. That is why the guard is a hard `422` today rather than a best-effort
match.

---

## Step 1 — add `mobile_e164` and normalise into it

Add a nullable column; do **not** rewrite `mobile_number`. Staff typed those
values and the Hub UI displays them; the normalised form is a derived, canonical
copy for matching only.

```sql
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS mobile_e164 text;

COMMENT ON COLUMN public.customers.mobile_e164 IS
  'Canonical E.164 form of mobile_number, for auth matching only. Derived — mobile_number stays as staff entered it. NULL when the source could not be normalised confidently.';
```

Normalisation rules, applied in this order. **Leave `mobile_e164` NULL rather
than guessing** — a NULL simply means that customer cannot use phone sign-in
yet, which is recoverable; a wrong value is not.

1. Strip everything except digits and a leading `+`.
2. Already `+<digits>` and 8–15 digits → keep.
3. Starts `0` and 10–11 digits total → **Japan**: `+81` + the number without its
   leading `0`. (JP mobiles are `090`/`080`/`070` + 8 digits.)
4. Starts `09` and 11 digits → ambiguous between JP and **PH** (`09xx` is a PH
   mobile too). Resolve with `country`/`location`: `PH` → `+63` + drop the `0`;
   `JP` → `+81` + drop the `0`. **If neither says, leave NULL** — this is the
   main source of ambiguity and must not be guessed.
5. Starts `81`/`63` with no `+` and the right length → add `+`.
6. Anything else → NULL.

Report counts after the pass: normalised, left NULL, and NULL-because-ambiguous.

## Step 2 — hand Cynthia the collisions

Do not merge or delete anything. Produce the list and stop:

```sql
SELECT c.mobile_e164,
       count(*) AS customers,
       array_agg(c.customer_code ORDER BY c.created_at) AS codes,
       array_agg(c.full_name    ORDER BY c.created_at) AS names,
       array_agg(c.email        ORDER BY c.created_at) AS emails
FROM public.customers c
WHERE c.mobile_e164 IS NOT NULL
GROUP BY c.mobile_e164
HAVING count(*) > 1
ORDER BY count(*) DESC, c.mobile_e164;
```

Expect roughly 10 groups. Each is one of:

- **the same person twice** — a genuine duplicate customer to merge in the Hub;
- **a shared household or business line** — different people, legitimately one
  number. These need the number kept on one record and cleared (`mobile_e164`
  set NULL) on the others, or phone sign-in will be ambiguous for all of them.

**Only Cynthia can tell these apart**, which is why this step is manual. Merging
customers also moves orders, layaway plans and loyalty balances — never
automate it from a phone match.

## Step 3 — make it unique

Only after step 2 leaves zero collisions:

```sql
CREATE UNIQUE INDEX customers_mobile_e164_unique
  ON public.customers (mobile_e164)
  WHERE mobile_e164 IS NOT NULL;
```

If this fails, step 2 is not finished. Do not drop rows to force it through.

## Step 4 — enable phone linking

In `supabase/functions/website/index.ts`, `requireCustomerUser` currently
refuses a JWT with no email. Extend it to accept `phone` from the JWT, normalise
it with the **same rules as step 1** (extract them into a shared helper so the
two can never drift), and match on `mobile_e164`.

Keep every existing guard:

- unverified contact → `403` (a phone must be OTP-confirmed, as an email must
  be);
- no match → create a new customer, never claim an existing row on a weaker
  signal;
- the link `UPDATE` keeps `.is("auth_user_id", null)` so a concurrent request
  loses the race as a no-op rather than a takeover;
- `mobile_e164 IS NULL` → treat exactly like a missing email: refuse, do not
  fall back to fuzzy matching.

Then on the storefront, add the phone tab to `/login` and delete the "signing in
by SMS is not available yet" line from `dict.account.note`.

---

## Done when

- Every `mobile_e164` is either valid E.164 or NULL, with the counts reported.
- The collision query returns zero rows.
- `customers_mobile_e164_unique` exists.
- A phone-OTP signup on a known number links to that exact customer; on an
  unknown number creates a new one; on a NULL-normalised number is refused
  rather than matched loosely.
- `/login` offers both methods and the SMS caveat is gone.

## Do not

- Rewrite or drop `mobile_number`.
- Auto-merge customers found by a phone match.
- Ship step 4 before step 3's index exists.
- Relax the unverified-contact `403` or the null-guard to make more numbers
  match.

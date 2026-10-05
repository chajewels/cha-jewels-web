# Card Purchase Agreement — Apps Script + signing page (v3, 2026-10-04)

These two files are **copies** of what runs outside this repo, kept here so the
next change starts from the real source. They are deployed by the owner, never
from this repo.

| File | Where it runs | What changed in v3 |
|---|---|---|
| `Card.gs` | Apps Script project "LAY AWAY Agreement" (file `card.gs`, beside `Code.gs`) | Verifies the signed `ctx` on the signing link (HMAC-SHA256 with the `CJ_CARD_CTX_KEY` Script Property — WEB-5; until it is set, the `CJ_LOOKUP_TOKEN` one), saves `Customer ID`, `Amount JPY`, `Context Verified` with the signature, and the lookup answers `bound`, `customer_id`, `amount_jpy`. A changed amount is a new signature, not a duplicate. |
| `card.html` | `agreement.chajewelsjp.com/card.html` (Firebase Hosting, `layawayt&c/public`) | Forwards `?ctx=` in the POST body (2 lines). |

The `ctx` format is defined once in `lib/card-agreement-link.ts` (storefront) and
mirrored in `cjVerifyCardContext_` (Card.gs):
`base64url(JSON{o,c,a,v:1,e}) + "." + base64url(HMAC-SHA256(key, payload))`,
URL-safe alphabet, no padding. The key is `CARD_AGREEMENT_CTX_KEY` (Vercel) =
`CJ_CARD_CTX_KEY` (Apps Script Script Property), the same value; while either is
unset both sides use `AGREEMENT_LOOKUP_TOKEN` = `CJ_LOOKUP_TOKEN`.

**Why a separate key (WEB-5, 2026-10-05):** the lookup token is sent to Apps
Script as `?token=`, so it is in the script's execution log. Anyone who can read
that log could otherwise sign a context for any order, customer and amount.

**Switching to it (owner):** 1) paste the new Card.gs and deploy a new version
(behaviour unchanged until the property exists); 2) make one long random value;
3) set it as Script Property `CJ_CARD_CTX_KEY` AND as Vercel env
`CARD_AGREEMENT_CTX_KEY` (Production + Preview), then redeploy the storefront.
While only one of the two is set, a new signing link does not verify (the customer is asked to sign again); set both together.

Code.gs needs no change (CARD HOOK 1 and 2 stay as they are).

Deploy order: card.html first (it only adds a field), then Card.gs + a new
version of the existing deployment (Deploy → Manage deployments → ✎ → New
version — the same /exec URL). Older signatures (before v3) answer
`bound: false`; the card page asks those customers to sign again.

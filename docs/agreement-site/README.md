# Card Purchase Agreement — Apps Script + signing page (v3, 2026-10-04)

These two files are **copies** of what runs outside this repo, kept here so the
next change starts from the real source. They are deployed by the owner, never
from this repo.

| File | Where it runs | What changed in v3 |
|---|---|---|
| `Card.gs` | Apps Script project "LAY AWAY Agreement" (file `card.gs`, beside `Code.gs`) | Verifies the signed `ctx` on the signing link (HMAC-SHA256 with the existing `CJ_LOOKUP_TOKEN` Script Property), saves `Customer ID`, `Amount JPY`, `Context Verified` with the signature, and the lookup answers `bound`, `customer_id`, `amount_jpy`. A changed amount is a new signature, not a duplicate. |
| `card.html` | `agreement.chajewelsjp.com/card.html` (Firebase Hosting, `layawayt&c/public`) | Forwards `?ctx=` in the POST body (2 lines). |

The `ctx` format is defined once in `lib/card-agreement-link.ts` (storefront) and
mirrored in `cjVerifyCardContext_` (Card.gs):
`base64url(JSON{o,c,a,v:1,e}) + "." + base64url(HMAC-SHA256(CJ_LOOKUP_TOKEN, payload))`,
URL-safe alphabet, no padding. `AGREEMENT_LOOKUP_TOKEN` (Vercel) and
`CJ_LOOKUP_TOKEN` (Apps Script) are the same value.

Code.gs needs no change (CARD HOOK 1 and 2 stay as they are).

Deploy order: card.html first (it only adds a field), then Card.gs + a new
version of the existing deployment (Deploy → Manage deployments → ✎ → New
version — the same /exec URL). Older signatures (before v3) answer
`bound: false`; the card page asks those customers to sign again.

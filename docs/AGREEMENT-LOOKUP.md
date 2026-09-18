# Layaway agreement signature lookup

How the storefront proves a customer signed the layaway agreement, and the one
hand-deployed change the Apps Script still needs.

The signing surface is a Firebase static site at `agreement.chajewelsjp.com`
backed by a Google Apps Script web app. **Neither is in this repo or the Hub
repo**; the owner deploys both by hand. The Hub holds no signature record and
none is to be created — the Google Sheet and the Apps Script PDF are the record.

## The contract, as deployed

```
GET <AGREEMENT_LOOKUP_URL>?sig=1&session=<quote-uuid>&token=<secret>
```

Every response is **HTTP 200** — Apps Script's `ContentService` cannot set a
status code, so the outcome is in the body and never in the status.

| Case | Body |
|---|---|
| signed | `{"ok":true,"signed":true,"agreement_version":"2026-v3","signed_at":"<ISO>"}` |
| not signed | `{"ok":true,"signed":false}` |
| bad or absent token | `{"ok":false,"error":"unauthorized"}` |
| token property unset | `{"ok":false,"error":"not_configured"}` |
| session not a uuid | `{"ok":false,"error":"bad_request"}` |
| sheet / tab / header problem | `{"ok":false,"error":"lookup_failed"}` |

`session` is `checkout_quotes.id`. It is the only key that can exist at signing
time: a web layaway's invoice number is drawn by `nextval` inside
`create_web_layaway_atomic`, one statement before the row is inserted.

**Only `ok:true` + `signed:false` means "this customer has not signed."** Every
`ok:false`, every non-200, every malformed body and every timeout means *we do
not know*, and the gate fails **closed** with a different refusal reason,
because the two need different words on screen. See `lib/layaway-agreement.ts`.

## REQUIRED CHANGE — give the lookup its own token property

In the deployed script `CJ_SIGN_TOKEN` gates **both** `?sig=1` **and**
`doPost`. The public signing page sends no token, so **setting `CJ_SIGN_TOKEN`
today would reject every real customer signature** — no sheet row, no PDF, no
email. Signing would stop dead.

So the lookup gets its **own** property and `CJ_SIGN_TOKEN` is left untouched
and unset.

### 1. Edit one line in `Code.gs`

Find the lookup's config block and change the token property name:

```javascript
  TOKEN_PROPERTY: 'CJ_LOOKUP_TOKEN'   // was CJ_SIGN_TOKEN — lookup only
```

If the lookup branch instead reads the property inline, change that read to
`'CJ_LOOKUP_TOKEN'`. **Change it only inside the `?sig=1` branch.** `doPost`
must keep reading `CJ_SIGN_TOKEN`, which stays unset so the public page's POST
continues to pass.

### 2. Add the Script Property

Extensions → Apps Script → ⚙ Project Settings → Script Properties → Add:

- Property: **`CJ_LOOKUP_TOKEN`**
- Value: a fresh random secret

To generate one, run this once in the editor, copy the value out of Executions,
then delete the function:

```javascript
function cjMakeToken_() {
  console.log(Utilities.base64EncodeWebSafe(Utilities.getUuid() + Utilities.getUuid()).replace(/=+$/, ''));
}
```

**Do not set `CJ_SIGN_TOKEN`.** Leave it absent.

### 3. Redeploy

Deploy → Manage deployments → pencil (Edit) → Version: **New version** →
Deploy. Same `/exec` URL, so the signing page's POST is untouched. Do not create
a new deployment.

### 4. Verify, from a browser

```
…/exec?sig=1&session=00000000-0000-0000-0000-000000000000&token=<CJ_LOOKUP_TOKEN>
  → {"ok":true,"signed":false}

…/exec?sig=1&session=00000000-0000-0000-0000-000000000000&token=wrong
  → {"ok":false,"error":"unauthorized"}

…/exec?meta=1
  → the live agreement version, exactly as before
```

Then sign one test quote and re-run the first URL with its real uuid: it must
come back `signed:true` with `agreement_version` and `signed_at`. That is the
acceptance check for the whole gate.

## The token is in the query string, and that is a known cost

Apps Script's `doGet(e)` receives only `e.parameter`, `e.parameters`,
`e.pathInfo`, `e.queryString` and `e.contextPath`. **It cannot read custom
request headers**, so the secret has to be a query parameter and **will appear
in the Apps Script execution log**. Consequences:

- Anyone who can open the script's Executions view can read it.
- It is rotatable with no redeploy: edit the Script Property and the Vercel env
  var. Rotate it if the log is ever shared.
- It unlocks a read-only answer — one boolean, a version string and a
  timestamp — and nothing that writes. Do not reuse it for anything that does.

## Environment variables

Server-only. No `NEXT_PUBLIC_` prefix, so neither can reach the browser.

| Variable | Value |
|---|---|
| `AGREEMENT_LOOKUP_URL` | the `/exec` URL, no query string |
| `AGREEMENT_LOOKUP_TOKEN` | the value of `CJ_LOOKUP_TOKEN` |

Set both on **Production, Preview and Development**. With either missing the
lookup returns `not_configured` and the gate refuses every layaway — correct
(fail closed), but it means a preview without the secrets cannot complete a
layaway checkout.

## Timeout and retry

**5 s per attempt, at most two attempts, ~10 s worst case.** Retried only on a
network error or timeout, never on an `ok:false` body — an answer we got is an
answer, and re-asking it would only spend the customer's patience.

Apps Script cold-starts, so the first call after a quiet spell can take seconds
through no fault of the customer's; the second attempt is for exactly that. The
house precedent is `AbortSignal.timeout(6000)` in `lib/hub-api.ts`, tightened
here per attempt because this one can retry and that one cannot.

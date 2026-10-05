import "server-only";
import { createHmac } from "node:crypto";

/**
 * THE SIGNED CONTEXT ON THE CARD AGREEMENT LINK (owner 5A, review SQ20,
 * 2026-10-04).
 *
 * The Card Purchase Agreement is signed on agreement.chajewelsjp.com, and the
 * signature must bind THIS customer and THIS amount — not just "an order id
 * someone typed into a URL". So the signing link carries a context the
 * storefront signed: which order, which customer, which amount, until when.
 * Card.gs verifies the HMAC with its own shared key (CARD_AGREEMENT_CTX_KEY =
 * Card.gs's CJ_CARD_CTX_KEY; until both are set, the lookup token — WEB-5,
 * cardAgreementContextKey below), stores the
 * customer and amount with the signature, and the lookup answers them back
 * with `bound: true`. The pay-card gate then passes only when the lookup's
 * customer and amount are exactly the Hub's.
 *
 * FORMAT (keep in step with Card.gs):
 *   payload = JSON { o: orderId, c: customerId, a: amountJpy, v: 1, e: <unix seconds> }
 *   token   = base64url(payload) + "." + base64url(HMAC-SHA256(key = cardAgreementContextKey(), message = base64url(payload)))
 * `e` is now + 7 days: a link opened next week still works, an old one does not.
 *
 * Server-only: the key never leaves this module. No key → no token → the
 * caller shows the existing "could not check" state (fail closed), never an
 * unsigned link.
 */

/** Context format version, `v` in the payload. */
export const CARD_AGREEMENT_CTX_VERSION = 1;
/** How long a signing link stays valid. */
export const CARD_AGREEMENT_CTX_TTL_S = 7 * 24 * 60 * 60;

export type CardAgreementContext = { o: string; c: string; a: number; v: number; e: number };

const b64url = (buf: Buffer) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Sign a context with `key`. Pure given its inputs — exported for the unit test. */
export function signCardAgreementContext(ctx: CardAgreementContext, key: string): string {
  const payload = b64url(Buffer.from(JSON.stringify(ctx), "utf8"));
  const mac = b64url(createHmac("sha256", key).update(payload).digest());
  return `${payload}.${mac}`;
}

/**
 * The `ctx` token for this order, customer and amount, or null when it cannot
 * be made (no key, or an input that is not whole). `amountJpy` is the Hub's
 * figure, passed through untouched.
 */
export function cardAgreementContextToken(input: { orderId: string; customerId: string; amountJpy: number }, now: Date = new Date()): string | null {
  const key = cardAgreementContextKey();
  if (!key) return null;
  const { orderId, customerId, amountJpy } = input;
  if (typeof orderId !== "string" || !orderId.trim()) return null;
  if (typeof customerId !== "string" || !customerId.trim()) return null;
  if (!Number.isInteger(amountJpy) || amountJpy <= 0) return null;
  const e = Math.floor(now.getTime() / 1000) + CARD_AGREEMENT_CTX_TTL_S;
  return signCardAgreementContext({ o: orderId, c: customerId, a: amountJpy, v: CARD_AGREEMENT_CTX_VERSION, e }, key);
}

/**
 * WEB-5 (2026-10-05): the context is signed with its OWN key,
 * CARD_AGREEMENT_CTX_KEY — never with AGREEMENT_LOOKUP_TOKEN, which travels as
 * a query parameter to Apps Script and so appears in its execution log (anyone
 * reading that log could otherwise mint a context for any order, customer and
 * amount). Card.gs verifies with its matching Script Property
 * CJ_CARD_CTX_KEY. Until both are set, both sides fall back to the lookup
 * token, so nothing breaks in between (docs/agreement-site/README.md).
 */
export function cardAgreementContextKey(): string {
  const own = (process.env.CARD_AGREEMENT_CTX_KEY ?? "").trim();
  return own || (process.env.AGREEMENT_LOOKUP_TOKEN ?? "").trim();
}

import { z } from "zod";
import { billingCountryCode } from "@/lib/billing-countries";
import type { HubAddress } from "@/lib/types";
import { ADDRESS_CAPS, PROFILE_CAPS, QUOTE_CAPS } from "@/lib/action-caps";

export { ADDRESS_CAPS, PROFILE_CAPS, QUOTE_CAPS, MAX_ADDRESSES } from "@/lib/action-caps";

/**
 * SERVER ACTION INPUT SCHEMAS (W-05, security batch 2, 2026-11-01).
 *
 * A Server Action is a public POST endpoint: its arguments are whatever the
 * caller sends, not what the React component would have sent. These schemas
 * are the shape each action accepts — strings trimmed and length-capped,
 * enums closed — and anything else is refused BEFORE a Hub call.
 *
 * WHERE THE CAPS COME FROM. The Hub's own rules (website edge function and
 * upsert_customer_addresses, read 2026-11-01 at la-tracking 982b2b5):
 *   - PUT /me/addresses: at most 20 addresses, line1 required; every field is
 *     a Postgres `text` column with NO length limit, trimmed, '' → null,
 *     country defaults to 'JP'.
 *   - POST /checkout/quote: mode full|layaway, settlement_currency JPY|PHP,
 *     order_type SELF|GIFT|PROXY (upper-cased), term_months integer ≥ 1;
 *     recipient_name / recipient_phone / gift_note trimmed, no length limit.
 *   - POST /auth/customer: full_name and location required, other fields
 *     trimmed, no length limit; messenger_link ≤ 200 (H-07).
 * Because the Hub sets no maximum, the caps below are generous ceilings for
 * what the forms produce, not tighter than anything a customer already has:
 * the address book a customer ALREADY has is never re-validated here — it is
 * read back from the Hub (`hub.me`) and passed through untouched — so only a
 * NEW address is held to these caps.
 *
 * No money here: nothing in these schemas is a price, a deposit or a rate.
 */

/** A string trimmed, then capped; absent / null / "" → null. A non-string is refused. */
const optText = (max: number) =>
  z.preprocess(
    (v) => (v === undefined || v === null ? null : typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : v),
    z.string().max(max).nullable(),
  );

/** A NEW delivery address from the checkout form. */
export const NewAddressSchema = z.object({
  label: optText(ADDRESS_CAPS.label),
  recipient_name: optText(ADDRESS_CAPS.recipient_name),
  line1: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().min(1).max(ADDRESS_CAPS.line1)),
  line2: optText(ADDRESS_CAPS.line2),
  city: optText(ADDRESS_CAPS.city),
  region: optText(ADDRESS_CAPS.region),
  postal_code: optText(ADDRESS_CAPS.postal_code),
  // The checkout field is typed and upper-cased ("JP", "JAPAN"). Only a
  // country on the Hub's list (lib/countries.ts, as a name or its ISO code —
  // the same reading the card form uses, lib/billing-countries.ts) is kept;
  // absent → "JP", the Hub's own default.
  country: z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "string" && v.trim() === "") ? "JP" : typeof v === "string" ? v.trim().toUpperCase() : v),
    z.string().max(ADDRESS_CAPS.country).refine((c) => billingCountryCode(c) !== null, { message: "country_not_listed" }),
  ),
  phone: optText(ADDRESS_CAPS.phone),
});

export type NewAddressResult = { ok: true; address: HubAddress } | { ok: false; code: "address_required" | "address_invalid" };

/** Parses a new address: line1 missing → "address_required" (as before), anything else wrong → "address_invalid". */
export function parseNewAddress(raw: unknown): NewAddressResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, code: "address_required" };
  const line1 = (raw as { line1?: unknown }).line1;
  if (typeof line1 !== "string" || !line1.trim()) return { ok: false, code: "address_required" };
  const r = NewAddressSchema.safeParse(raw);
  if (!r.success) return { ok: false, code: "address_invalid" };
  const a = r.data;
  return {
    ok: true,
    address: {
      label: a.label, recipient_name: a.recipient_name, line1: a.line1, line2: a.line2,
      city: a.city, region: a.region, postal_code: a.postal_code, country: a.country, phone: a.phone,
    },
  };
}

/**
 * The list PUT /me/addresses receives: the customer's OWN saved addresses as
 * the Hub returned them (each keeps its id, so the Hub updates it in place),
 * none of them default, then the new one as the default. Nothing from the
 * browser except the new address goes into it.
 */
export function addressListWithNew(saved: readonly HubAddress[], added: HubAddress): HubAddress[] {
  const keep = saved.map((a) => ({
    ...(a.id ? { id: a.id } : {}),
    label: a.label ?? null, recipient_name: a.recipient_name ?? null, line1: a.line1,
    line2: a.line2 ?? null, city: a.city ?? null, region: a.region ?? null,
    postal_code: a.postal_code ?? null, country: a.country ?? null, phone: a.phone ?? null,
    is_default: false,
  }));
  return [...keep, { ...added, is_default: true }];
}

/** What quoteAction accepts. Unknown keys are dropped (zod's default). */
export const QuoteInputSchema = z.object({
  ship_to_address_id: z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string().max(QUOTE_CAPS.ship_to_address_id)),
  order_type: z.enum(["SELF", "GIFT", "PROXY"]),
  recipient_name: z.string().max(QUOTE_CAPS.recipient_name).optional(),
  recipient_phone: z.string().max(QUOTE_CAPS.recipient_phone).optional(),
  gift_note: z.string().max(QUOTE_CAPS.gift_note).optional(),
  mode: z.enum(["full", "layaway"]).optional(),
  term_months: z.number().int().min(1).max(60).optional(),
  settlement_currency: z.enum(["JPY", "PHP"]).optional(),
  lang: z.string().max(QUOTE_CAPS.lang).optional(),
});
export type QuoteInput = z.infer<typeof QuoteInputSchema>;

export type QuoteParse = { ok: true; input: QuoteInput } | { ok: false; code: "address_required" | "invalid_input" };

/** A missing address keeps its own code ("address_required"); any other bad field → "invalid_input". */
export function parseQuoteInput(raw: unknown): QuoteParse {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, code: "invalid_input" };
  const r = QuoteInputSchema.safeParse(raw);
  if (!r.success) return { ok: false, code: "invalid_input" };
  if (!r.data.ship_to_address_id) return { ok: false, code: "address_required" };
  return { ok: true, input: r.data };
}

/** Profile text fields, after the action's own trim: over a cap → refused. */
export const ProfileFieldsSchema = z.object({
  full_name: z.string().max(PROFILE_CAPS.full_name),
  facebook_name: z.string().max(PROFILE_CAPS.facebook_name),
  mobile_number: z.string().max(PROFILE_CAPS.mobile_number),
  next: z.string().max(PROFILE_CAPS.next),
});

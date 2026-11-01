/**
 * Length ceilings for Server Action input (W-05). Plain constants, no zod, so
 * the checkout form can put the same numbers on its inputs as maxLength
 * without shipping the schema library to the browser. The schemas and the
 * reasoning behind each value live in lib/action-schemas.ts.
 */
/** Ceilings (characters). The form inputs carry the same values as maxLength. */
export const ADDRESS_CAPS = {
  label: 60,
  recipient_name: 200,
  line1: 300,
  line2: 300,
  city: 120,
  region: 120,
  postal_code: 32,
  country: 60,
  phone: 60,
} as const;

export const QUOTE_CAPS = {
  ship_to_address_id: 64,
  recipient_name: 200,
  recipient_phone: 60,
  gift_note: 1000,
  lang: 16,
} as const;

export const PROFILE_CAPS = {
  full_name: 200,
  facebook_name: 200,
  mobile_number: 40,
  /** The sign-in `next` path (safe-next's own limit). */
  next: 2048,
} as const;

/** The Hub refuses more than this many addresses (upsert_customer_addresses). */
export const MAX_ADDRESSES = 20;


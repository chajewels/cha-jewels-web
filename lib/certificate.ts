import type { Product } from "@/lib/types";

/**
 * A PIECE'S CERTIFICATE OF AUTHENTICITY — only ever what the Hub's product
 * data carries (P4: "the envelope reveal shows a certificate ONLY when the
 * product's Hub data carries one (certificate kind) — never claim a
 * certificate otherwise").
 *
 * UNVERIFIED AGAINST THE CONTRACT: `GET /products` (supabase/contracts/api.md)
 * names no certificate field today, and the fixtures carry none, so this
 * returns `null` for every product the site can read and the product page
 * shows no envelope. The shape below is the one the Hub is expected to add
 * (`certificate: { kind, issuer?, number? }`); it is read defensively, as an
 * unknown key, so nothing is typed into `Product` that the Hub has not
 * promised, and a payload without it — or with a malformed one — is "no
 * certificate". Nothing here invents an issuer, a number or a laboratory.
 */
export type PieceCertificate = { kind: string; issuer: string | null; number: string | null };

export const certificateOf = (product: Product): PieceCertificate | null => {
  const raw = (product as unknown as { certificate?: unknown }).certificate;
  if (!raw || typeof raw !== "object") return null;
  const { kind, issuer, number } = raw as Record<string, unknown>;
  if (typeof kind !== "string" || kind.trim() === "") return null;
  return {
    kind: kind.trim(),
    issuer: typeof issuer === "string" && issuer.trim() ? issuer.trim() : null,
    number: typeof number === "string" && number.trim() ? number.trim() : null,
  };
};

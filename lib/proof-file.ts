/**
 * PAYMENT PROOF FILE TYPES (H11 follow-up, 2026-10-05). A proof is a photo of
 * the slip or a PDF — the same list the Hub's upload accepts. The input offers
 * only these, and the server action refuses anything else BEFORE uploading, so
 * a wrong file never reaches storage. Pure; unit-tested.
 */
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"] as const;
export const PROOF_ACCEPT = TYPES.join(",");
/** Some browsers send no type for a HEIC photo: then the extension decides. */
const EXT = /\.(jpe?g|png|webp|heic|heif|pdf)$/i;

export function proofTypeOk(file: { type: string; name: string }): boolean {
  const type = (file.type ?? "").toLowerCase();
  if (type) return (TYPES as readonly string[]).includes(type);
  return EXT.test(file.name ?? "");
}

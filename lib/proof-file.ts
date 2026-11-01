/**
 * PAYMENT PROOF FILE TYPES (H11 follow-up, 2026-10-05). A proof is a photo of
 * the slip or a PDF — the same list the Hub's upload accepts. The input offers
 * only these, and the server action refuses anything else BEFORE uploading, so
 * a wrong file never reaches storage. Pure; unit-tested.
 */
import { fileKind, PROOF_KINDS } from "@/lib/file-magic";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"] as const;
export const PROOF_ACCEPT = TYPES.join(",");
/** Some browsers send no type for a HEIC photo: then the extension decides. */
const EXT = /\.(jpe?g|png|webp|heic|heif|pdf)$/i;

export function proofTypeOk(file: { type: string; name: string }): boolean {
  const type = (file.type ?? "").toLowerCase();
  if (type) return (TYPES as readonly string[]).includes(type);
  return EXT.test(file.name ?? "");
}

/**
 * W-10 (security batch 2): the label above is what the sender SAYS. This reads
 * the file's first bytes (lib/file-magic.ts) and accepts only a real JPEG,
 * PNG, WebP, HEIC/HEIF or PDF — so an HTML page renamed `slip.png` is refused
 * before upload with the same "proof_bad_type" the form already shows.
 */
export async function proofBytesOk(file: Blob): Promise<boolean> {
  const kind = await fileKind(file);
  return kind !== null && PROOF_KINDS.includes(kind);
}

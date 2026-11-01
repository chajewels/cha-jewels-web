/**
 * WHAT A FILE REALLY IS, FROM ITS FIRST BYTES (W-10, security batch 2,
 * 2026-11-01).
 *
 * The browser's `type` and the file name are whatever the sender says: an
 * HTML page renamed `slip.png` arrives as `image/png`. Payment proofs and
 * review photos are opened later by staff (and review photos are shown on the
 * site), so the bytes decide, not the label.
 *
 * Recognised signatures:
 *   jpeg  FF D8 FF
 *   png   89 50 4E 47 0D 0A 1A 0A
 *   webp  "RIFF" <4-byte size> "WEBP"
 *   heic  an ISO-BMFF `ftyp` box (bytes 4–7) whose MAJOR brand is a HEIF/HEIC
 *         brand — iPhone photos are major `heic` (compatible `mif1`, `MiHE`,
 *         `miaf`, `heic`…); `heix`, `hevc`, `hevx`, `heim`, `heis`, `hevm`,
 *         `hevs`, `mif1`, `msf1` are the other HEIF brands (ISO/IEC 23008-12).
 *         A file whose brands mark it AVIF (`avif`, `avis`) is NOT HEIC — AVIF
 *         also lists `mif1` and is not on the allowed lists.
 *   pdf   "%PDF-"
 *
 * Pure: takes the bytes (the first 32 are enough). Unit-tested.
 */
export type FileKind = "jpeg" | "png" | "webp" | "heic" | "pdf";

const HEIF_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs", "mif1", "msf1"]);
const AVIF_BRANDS = new Set(["avif", "avis"]);

/** How many leading bytes sniffFileKind needs. */
export const MAGIC_BYTES = 32;

function ascii(b: Uint8Array, from: number, len: number): string {
  if (b.length < from + len) return "";
  let s = "";
  for (let i = from; i < from + len; i++) s += String.fromCharCode(b[i]);
  return s;
}

export function sniffFileKind(bytes: Uint8Array): FileKind | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 8 && b[0] === 0x89 && ascii(b, 1, 3) === "PNG" && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "png";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return "webp";
  if (ascii(b, 0, 5) === "%PDF-") return "pdf";
  if (ascii(b, 4, 4) === "ftyp") {
    const boxSize = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
    const major = ascii(b, 8, 4);
    // Compatible brands follow the 4-byte minor version, up to the box end
    // (or as far as the bytes we were given reach).
    const end = Math.min(b.length, boxSize >= 16 ? boxSize : b.length);
    const brands = [major];
    for (let i = 16; i + 4 <= end; i += 4) brands.push(ascii(b, i, 4));
    if (brands.some((x) => AVIF_BRANDS.has(x))) return null;
    if (HEIF_BRANDS.has(major)) return "heic";
    return null;
  }
  return null;
}

/** Reads the first bytes of an uploaded File and sniffs them. Never throws: unreadable → null. */
export async function fileKind(file: Blob): Promise<FileKind | null> {
  try {
    const head = new Uint8Array(await file.slice(0, MAGIC_BYTES).arrayBuffer());
    return sniffFileKind(head);
  } catch {
    return null;
  }
}

/** Payment proofs: a photo of the slip or a PDF (the Hub upload's list). */
export const PROOF_KINDS: readonly FileKind[] = ["jpeg", "png", "webp", "heic", "pdf"];
/** Review photos: shown on the site, so images only and only the three the Hub takes (REVIEW_PHOTO_TYPES). */
export const REVIEW_PHOTO_KINDS: readonly FileKind[] = ["jpeg", "png", "webp"];

import type { CutoutStatus, ProductCutout } from "@/lib/types";

/**
 * BUNDLED CUT-OUTS — INTERIM, ON PRODUCTION (owner decision 2026-09-26: release
 * the approved hero now, before the Hub's background-removal pipeline exists).
 *
 * The cut-outs made for the approved comps and the demo (BiRefNet-general,
 * with the comps' automatic checks; ~/Code/reference/hero-comps/slider-v3 and
 * build-check/v3-slideshow/demo-cutouts-qa.json), shipped in this repo under
 * public/fixtures/cutouts/, for the live pieces they were made from.
 *
 * MATCHED BY THE EXACT HUB PHOTO, not by SKU and position: each entry is keyed
 * by the source photo's public-storage path. If staff reorder a piece's
 * gallery the cut-outs follow their photos; if a photo is replaced, or the Hub
 * moves storage, the key no longer matches and that photo shows whole in its
 * frame — a cut-out can never stand beside the wrong photo.
 *
 * THE HUB WINS. lib/hero-deck.ts asks here only when the Hub sent no cut-out
 * record for the photo at all; any Hub cut-out — shown, held or rejected — is
 * the Hub's decision and stands. Status is each cut-out's own QA result, so a
 * held one would be skipped exactly as a held Hub cut-out is.
 *
 * Remove this file and the files it names once the Hub sends `cutout`.
 */
const BUNDLED: Record<string, [file: string, width: number, height: number, status: CutoutStatus]> = {
  "promotions/website/page365/81333344/462264810-1773219921.jpeg": ["al112", 900, 693, "approved"], // AL112 photo 1
  "promotions/website/page365/79213257/437392479-1742360877.jpeg": ["al123", 623, 773, "approved"], // AL123 photo 1
  "promotions/website/page365/79213257/462155844-1773026675.jpeg": ["al123-1", 759, 900, "ok"], // AL123 photo 2
  "promotions/website/page365/81580781/472533236-1777358458.jpeg": ["al3", 427, 900, "approved"], // AL3 photo 1
  "promotions/website/page365/81580781/472533237-1777358458.jpeg": ["al3-1", 422, 900, "ok"], // AL3 photo 2
  "promotions/website/0be8abc2-12d9-4c0e-b978-bf1a36fa2daf.jpeg": ["r3341", 867, 900, "approved"], // R3341 photo 1
  "promotions/website/ce6d38a7-ec0a-441b-a157-d9edabf3bbb6.png": ["r3341-1", 900, 813, "ok"], // R3341 photo 2
  "promotions/website/aa84e60f-801f-4ba4-afc6-56bbecc3e007.png": ["r3341-2", 869, 900, "ok"], // R3341 photo 3
  "promotions/website/7c441373-41e2-43ed-9fe6-1c0fc02a1d38.png": ["r3341-3", 900, 779, "ok"], // R3341 photo 4
  "promotions/website/5137940f-f947-487d-b71b-50bcd057243a.jpeg": ["r7828", 811, 900, "approved"], // R7828 photo 1
  "promotions/website/236a9362-1ea6-43e4-8c28-0e3ab5cb3d02.jpeg": ["r7828-1", 900, 715, "ok"], // R7828 photo 2
  "promotions/website/43ac5526-c038-4a65-9a88-ba128140921e.jpeg": ["r7828-2", 900, 729, "ok"], // R7828 photo 3
  "promotions/website/page365/82448659/505636969-1788915865.jpeg": ["r7828-3", 811, 900, "ok"], // R7828 photo 4
  "promotions/website/page365/78321785/428829493-1732601113.jpeg": ["r3110", 339, 204, "approved"], // R3110 photo 1
  "promotions/website/page365/80288104/450588971-1758211904.jpeg": ["c0983", 690, 900, "approved"], // C0983 photo 1
  "promotions/website/page365/80288104/450588975-1758211904.jpeg": ["c0983-1", 900, 676, "auto_fixed"], // C0983 photo 2
  "promotions/website/page365/80288104/450588968-1758211904.jpeg": ["c0983-2", 900, 739, "auto_fixed"], // C0983 photo 3
  "promotions/website/page365/80288104/450588969-1758211904.jpeg": ["c0983-3", 641, 900, "ok"], // C0983 photo 4
  "promotions/website/page365/80288116/450589077-1758212309.jpeg": ["c1395", 900, 832, "approved"], // C1395 photo 1
  "promotions/website/page365/80288116/450589078-1758212309.jpeg": ["c1395-1", 900, 804, "auto_fixed"], // C1395 photo 2
  "promotions/website/page365/80288116/450589079-1758212309.jpeg": ["c1395-2", 754, 900, "auto_fixed"], // C1395 photo 3
  "promotions/website/page365/80288116/450589080-1758212309.jpeg": ["c1395-3", 678, 900, "ok"], // C1395 photo 4
};

const PUBLIC = "/storage/v1/object/public/";

/** The bundled cut-out made from this Hub photo, if there is one. */
export function bundledCutout(photoUrl: string): ProductCutout | null {
  const at = photoUrl.indexOf(PUBLIC);
  if (at < 0) return null;
  const d = BUNDLED[photoUrl.slice(at + PUBLIC.length).split(/[?#]/)[0]];
  return d ? { url: `/fixtures/cutouts/${d[0]}.webp`, width: d[1], height: d[2], status: d[3] } : null;
}

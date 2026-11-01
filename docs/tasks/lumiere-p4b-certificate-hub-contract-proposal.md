# PROPOSAL (not built, not run): a product-level certificate field in the Hub

Status: **DRAFT for the owner to decide with Lovable.** Nothing in this file has been applied to the Hub, the database or `supabase/contracts/api.md`. No SQL is included on purpose (Cynthia runs all SQL; Lovable owns `supabase/functions/` and migrations).

## Why
The Lumière product page has an envelope that opens on scroll to reveal a certificate of authenticity (Herbier Blanc). P4 built it and it renders **only when a product carries certificate data**. Today no product does: `GET /products` names no certificate field and the fixtures carry none, so no product page shows an envelope, no empty shell and no claim (`lib/certificate.ts` returns `null`; a unit test pins it). Showing a certificate the Hub did not send would be a claim about a real piece, so the storefront will not invent one.

## Proposed shape (additive; every field optional; absent = no certificate)
On every endpoint that returns a product (`GET /products`, `GET /products/:slug`, `GET /search`, collection and category reads), one nullable object:

```jsonc
"certificate": null | {
  "type":    "GIA" | "GIA_REPORT" | "IGI" | "CGL" | "SSEF" | "JGA" | "SHOP" | "OTHER", // what kind of document
  "type_label": "Diamond grading report" ,            // short human label, EN
  "type_label_ja": "ダイヤモンドグレーディングレポート",   // JA label (the site never translates it)
  "lab":     "GIA" ,                                  // issuing laboratory or body (display name)
  "number":  "2141438171" ,                           // certificate / report number, text (never numeric: leading zeros)
  "issued_on": "2025-03-14" ,                         // ISO date, optional
  "image_url": "https://…/cert-2141438171.webp" ,     // public scan or photo of the document, optional; the storefront draws the envelope and shows this as the letter
  "verify_url": "https://…" ,                         // lab's public verification page, optional (opens in a new tab, rel=noopener)
  "applies_to": "stone" | "piece" ,                   // does it certify the gemstone or the whole piece
  "stone_ref": "Center diamond 0.30 ct"               // when applies_to = "stone": which stone, optional
}
```

Rules the storefront will rely on:
1. `certificate` is **null unless a staff member attached one** in the Hub; the Hub never defaults it.
2. `lab` and `number` are shown exactly as sent; the storefront never infers, formats or "completes" them.
3. `type_label_ja` falls back to `type_label` only when absent (no machine translation).
4. `image_url` follows the existing media rules (HTTPS, public, `next/image` host allow-list); a missing image shows the typed letter without a scan.
5. A change is a product change and fires the existing `notify_website` revalidation.

## What the storefront does with it (already built, hidden until the field exists)
- `lib/certificate.ts` reads `certificate` defensively as an unknown key (today `kind`/`issuer`/`number`); on acceptance it is re-pointed at this shape (`type_label`, `lab`, `number`, `issued_on`, `image_url`, `verify_url`).
- `components/catalog/certificate-envelope.tsx` renders the envelope on a view timeline; the letter carries the label, laboratory, number, date and, when present, the scan and the verification link.
- Terminology: the certificate states what the document says and nothing about the metal or the origin; the "K18 gold" and origin-badge rules are unaffected.

## Decisions needed from the owner
1. Is a per-product certificate something Cha Jewels wants to show (which products have one)? Preloved and branded pieces often carry brand cards, not lab reports — should `type` include `BRAND_CARD`?
2. One certificate per product, or one per variant? (Proposed: per product; a per-variant need can be added later as an array.)
3. Who attaches it in the Hub admin, and is the scan public? (A scan can contain a customer name or private data — the Hub should only publish a scan staff approved.)
4. Wording for the label in JA.

## Out of scope
The Hub admin form, the migration, the API change and the SQL. After the owner's decision, Lovable implements the Hub side; the storefront change is a one-file re-point plus tests.

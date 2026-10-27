// Website receipts (領収書) on the storefront — lib/receipts.ts.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { readFileSync } from "node:fs";

const R = await import(pathToFileURL(join(process.cwd(), "lib/receipts.ts")).href);

const rec = (over) => ({
  id: "r1", receipt_number: "CJR-2026-000001", kind: "cash", order_id: "o1", order_number: "CJ-W-1",
  status: "issued", currency: "JPY", total: 8640, issued_at: "2026-10-27T15:00:00Z", cancelled_at: null,
  addressee: null, purpose: "お品代として", downloads: 0, ...over,
});

test("plan receipts are hidden on the Japanese site, shown on the English one", () => {
  const list = [rec({ id: "a" }), rec({ id: "b", kind: "layaway" })];
  assert.deepEqual(R.visibleReceipts(list, "ja").map((r) => r.id), ["a"]);
  assert.deepEqual(R.visibleReceipts(list, "en").map((r) => r.id), ["a", "b"]);
});

test("an order shows its issued receipt before any cancelled one; another order's never", () => {
  const list = [
    rec({ id: "old", status: "cancelled", cancelled_at: "2026-10-20T00:00:00Z" }),
    rec({ id: "new", status: "issued" }),
    rec({ id: "other", order_id: "o2" }),
    rec({ id: "plan", kind: "layaway" }),
  ];
  assert.equal(R.receiptForOrder(list, "cash", "o1").id, "new");
  assert.equal(R.receiptForOrder(list, "layaway", "o1").id, "plan");
  assert.equal(R.receiptForOrder(list, "cash", "o3"), null);
});

test("only cancelled receipts: the most recently cancelled is shown", () => {
  const list = [
    rec({ id: "c1", status: "cancelled", cancelled_at: "2026-10-01T00:00:00Z" }),
    rec({ id: "c2", status: "cancelled", cancelled_at: "2026-10-05T00:00:00Z" }),
  ];
  assert.equal(R.receiptForOrder(list, "cash", "o1").id, "c2");
});

test("details are checked like the Hub: trimmed, 60 / 40 characters, no control characters", () => {
  assert.deepEqual(R.cleanReceiptDetails("  株式会社テスト  ", " "), { ok: true, addressee: "株式会社テスト", purpose: "" });
  assert.deepEqual(R.cleanReceiptDetails("あ".repeat(60), "い".repeat(40)).ok, true);
  assert.equal(R.cleanReceiptDetails("あ".repeat(61), "").code, "addressee_too_long");
  assert.equal(R.cleanReceiptDetails("", "い".repeat(41)).code, "purpose_too_long");
  assert.equal(R.cleanReceiptDetails("a\nb", "").code, "invalid_characters");
});

test("verify codes: 40 hex characters, case and spaces forgiven", () => {
  const code = "0123456789abcdef0123456789abcdef01234567";
  assert.equal(R.normaliseVerifyCode(code.toUpperCase()), code);
  assert.equal(R.normaliseVerifyCode(` ${code.slice(0, 20)} ${code.slice(20)} `), code);
  assert.equal(R.normaliseVerifyCode(code.slice(1)), null);
  assert.equal(R.normaliseVerifyCode("z".repeat(40)), null);
});

test("the PDF link is this site's route and Japanese is the default", () => {
  assert.equal(R.receiptPdfHref("abc", "en"), "/account/receipts/abc/pdf?lang=en");
  assert.equal(R.receiptLang("EN"), "en");
  assert.equal(R.receiptLang(null), "ja");
  assert.equal(R.receiptLang("fr"), "ja");
});

test("every Hub error code has words, and an unknown code falls back", () => {
  for (const c of ["addressee_too_long", "purpose_too_long", "invalid_characters", "receipt_cancelled", "receipt_unavailable", "not_found", "signed_out"]) {
    assert.notEqual(R.receiptErrorKey(c), "errFailed", c);
  }
  assert.equal(R.receiptErrorKey("http_500"), "errFailed");
  const dict = readFileSync(join(process.cwd(), "lib/i18n.ts"), "utf8");
  for (const k of ["errTooLongAddressee", "errTooLongPurpose", "errCharacters", "errCancelled", "errUnavailable", "errNotFound", "errSignedOut", "errFailed"]) {
    assert.ok(dict.includes(`${k}: {`), k);
  }
});

test("the receipt pages never show plan receipts on ja and never compute money", () => {
  const list = readFileSync(join(process.cwd(), "app/account/receipts/page.tsx"), "utf8");
  assert.match(list, /visibleReceipts\(/);
  const panel = readFileSync(join(process.cwd(), "components/account/receipt-panel.tsx"), "utf8");
  assert.doesNotMatch(panel, /\*\s*1\.1|\/\s*1\.1|0\.1\b/);
});

test("shopping guide: no layaway on the Japanese site, receipts section present", async () => {
  const G = await import(pathToFileURL(join(process.cwd(), "lib/content/shopping-guide.ts")).href);
  const ja = JSON.stringify(G.shoppingGuide.map((s) => ({ t: s.title.ja, b: G.guideBlocksFor(s.blocks, false) })));
  assert.doesNotMatch(ja.replace(/"en":"[^"]*"/g, ""), /分割予約|レイアウェイ/);
  assert.ok(G.shoppingGuide.some((s) => s.id === "receipts"));
  const hasLayawayBlock = G.shoppingGuide.some((s) => G.guideBlocksFor(s.blocks, true).length > G.guideBlocksFor(s.blocks, false).length);
  assert.ok(hasLayawayBlock);
});

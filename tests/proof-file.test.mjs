// H11 follow-up (task S5): a payment proof is a photo or a PDF — exactly the
// types the Hub's upload accepts — and anything else is refused BEFORE upload.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { PROOF_ACCEPT, proofTypeOk } = await import("@/lib/proof-file");

test("the accept list is exactly the six types", () => {
  assert.equal(PROOF_ACCEPT, "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf");
});

test("allowed types pass, others are refused", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"]) {
    assert.equal(proofTypeOk({ type, name: "x" }), true, type);
  }
  for (const type of ["image/gif", "image/svg+xml", "text/html", "application/zip", "image/tiff"]) {
    assert.equal(proofTypeOk({ type, name: "x.jpg" }), false, type);
  }
});

test("a browser that sends no type: judged by the extension", () => {
  assert.equal(proofTypeOk({ type: "", name: "IMG_0001.HEIC" }), true);
  assert.equal(proofTypeOk({ type: "", name: "slip.pdf" }), true);
  assert.equal(proofTypeOk({ type: "", name: "evil.svg" }), false);
  assert.equal(proofTypeOk({ type: "", name: "noext" }), false);
});

test("every proof input uses the list (no image/*)", () => {
  const src = readFileSync("components/commerce/layaway-pay-form.tsx", "utf8");
  assert.ok(src.includes("accept={PROOF_ACCEPT}"));
  assert.ok(!src.includes('accept="image/*'));
});

test("the action refuses a wrong type before uploading", () => {
  const src = readFileSync("lib/layaway-actions.ts", "utf8");
  const check = src.indexOf("proofTypeOk(");
  const upload = src.indexOf("uploadProof(jwt");
  assert.ok(check > 0 && check < upload);
  assert.ok(src.includes('"proof_bad_type"'));
});

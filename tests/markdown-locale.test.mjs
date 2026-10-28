// Hub-authored relative links are localized at render time (OD-11; lib/markdown.ts).
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { renderMarkdown } = await import("@/lib/markdown");
const link = (href) => renderMarkdown(`[t](${href})`, "ja");
const hrefOf = (html) => (html.match(/href="([^"]*)"/) ?? [])[1] ?? null;

test("an eligible internal public link gains the page's locale", () => {
  assert.equal(hrefOf(link("/faq")), "/ja/faq");
  assert.equal(hrefOf(link("/products/k18-ring")), "/ja/products/k18-ring");
  assert.equal(hrefOf(renderMarkdown("[t](/faq)", "en")), "/en/faq");
});

test("anchors and query strings ride along", () => {
  assert.equal(hrefOf(link("/faq#payments-and-layaway")), "/ja/faq#payments-and-layaway");
  assert.equal(hrefOf(link("/collections/kihei?sort=new#top")), "/ja/collections/kihei?sort=new#top");
});

// Corrected 2026-10-28 (owner): an author's explicit /en/ or /ja/ is kept as
// written. It used to be re-based onto the page's language, which turned an
// English-only article linked as /en/blog/… from a Japanese page into a 404.
test("an already-localized link keeps the author's language, never double-prefixed", () => {
  assert.equal(hrefOf(link("/en/faq")), "/en/faq");
  assert.equal(hrefOf(link("/ja/faq")), "/ja/faq");
  assert.equal(hrefOf(renderMarkdown("[t](/ja/faq)", "en")), "/ja/faq");
});

test("external, mailto, private, unknown, layaway and unsupported-locale paths are untouched", () => {
  assert.equal(hrefOf(link("https://example.com/x")), "https://example.com/x");
  assert.equal(hrefOf(link("mailto:a@b.c")), "mailto:a@b.c");
  assert.equal(hrefOf(link("/account/orders")), "/account/orders");
  assert.equal(hrefOf(link("/unknown-page")), "/unknown-page");
  assert.equal(hrefOf(link("/layaway")), "/layaway", "the English /layaway exception");
  assert.equal(hrefOf(link("/fr/faq")), "/fr/faq");
});

test("malicious or malformed values never become a protocol-relative URL or a script", () => {
  assert.equal(link("//evil.com").includes("<a"), false, "protocol-relative refused outright");
  assert.equal(link("javascript:alert(1)").includes("<a"), false);
  const out = link("/en//evil.com");
  assert.ok(!/href="\/\//.test(out), out);
});

test("without a language the output is byte-identical to before (legacy callers unchanged)", () => {
  const md = "[a](/faq) and [b](/en/faq) and [c](https://x.example/)";
  assert.equal(renderMarkdown(md), renderMarkdown(md, undefined));
  assert.equal(hrefOf(renderMarkdown("[t](/faq)")), "/faq");
});

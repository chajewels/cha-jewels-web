// W-13 (security 2026-10-31): a Hub-authored relative link or image path must
// be a real site path. "/\host" is read by browsers as another site
// (WHATWG URL treats "\" like "/" in http(s) URLs), the same trap the sign-in
// `next` check (lib/safe-next.ts) closes. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { renderMarkdown } = await import("@/lib/markdown");
const { isOptimizableImage } = await import("@/lib/image-hosts");
const href = (md) => (renderMarkdown(md, "en").match(/href="([^"]*)"/) ?? [])[1] ?? null;
const src = (p) => readFileSync(join(process.cwd(), p), "utf8");

test("markdown: a backslash relative link renders no link; ordinary links are unchanged", () => {
  for (const bad of ["/\\evil.com", "/\\/evil.com", "/%09/x\\y"]) assert.equal(href(`[t](${bad})`), null, bad);
  assert.equal(href("[t](/faq)"), "/en/faq");
  assert.equal(href("[t](/products/x?ref=1&b=2)"), "/en/products/x?ref=1&amp;b=2");
  assert.equal(href("[t](https://m.me/chajewels)"), "https://m.me/chajewels");
  assert.equal(href("[t](//evil.com)"), null);
});

test("images: a backslash path is not treated as a local image", () => {
  assert.equal(isOptimizableImage("/\\evil.com/x.png"), false);
  assert.equal(isOptimizableImage("/images/hero.jpg"), true);
  assert.equal(isOptimizableImage("/images/logo.svg"), false);
});

test("site settings links use the same site-path check", () => {
  const s = src("lib/settings.ts");
  assert.match(s, /if \(href\.startsWith\("\/"\)\) return allowRelative && isSitePath\(href\) \? href : null;/);
  assert.doesNotMatch(s, /startsWith\("\/"\) && !href\.startsWith\("\/\/"\)/);
});

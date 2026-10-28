// OD-11 corrected (2026-10-28): Hub-authored links keep an explicit /en/ or /ja/
// as written; only unprefixed eligible paths take the page's language
// (lib/locale.ts localizeAuthoredHref; lib/markdown.ts; app/layout.tsx).
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { renderMarkdown } = await import("@/lib/markdown");
const { localizeAuthoredHref, localePath } = await import("@/lib/locale");
const { switchTargets } = await import("@/lib/locale-nav");
const href = (md, lang) => (renderMarkdown(md, lang).match(/href="([^"]*)"/) ?? [])[1] ?? null;
const src = (p) => readFileSync(join(process.cwd(), p), "utf8");

// ------------------------------------------------ the seven previously reported cases
test("1. unprefixed eligible internal links localize to the page language", () => {
  assert.equal(href("[f](/faq)", "ja"), "/ja/faq");
  assert.equal(href("[f](/faq)", "en"), "/en/faq");
  assert.equal(href("[p](/products/x?ref=1)", "ja"), "/ja/products/x?ref=1");
});
test("2. blog markdown: an explicit /en/ article link keeps its English destination on a Japanese page", () => {
  assert.equal(href("[創業ストーリー（英語版）](/en/blog/how-cha-jewels-began)", "ja"), "/en/blog/how-cha-jewels-began");
});
test("3. an explicit /en/ public page keeps its English destination on a Japanese page", () => {
  assert.equal(href("[FAQ](/en/faq)", "ja"), "/en/faq");
});
test("4. an explicit /ja/ link keeps its Japanese destination on an English page", () => {
  assert.equal(href("[よくある質問](/ja/faq)", "en"), "/ja/faq");
});
test("5. announcement: an explicit /en/ link keeps its destination on a Japanese page", () => {
  assert.equal(localizeAuthoredHref("/en/sale", "ja"), "/en/sale");
  assert.equal(localizeAuthoredHref("/sale", "ja"), "/ja/sale", "unprefixed still localizes");
});
test("6. missing destination: an UNPREFIXED link is localized structurally, as approved (no data lookup, nothing deleted) — editorial report instead", () => {
  // Owner rule: do not invent a sibling, do not delete content, do not replace a
  // link with plain text. The unprefixed link keeps OD-11's structural behaviour;
  // a destination that does not exist in that language is reported for editing.
  assert.equal(href("[story](/blog/how-cha-jewels-began)", "ja"), "/ja/blog/how-cha-jewels-began");
  assert.match(renderMarkdown("私たちの始まりについては、[story](/blog/how-cha-jewels-began)もぜひご覧ください。", "ja"), /私たちの始まりについては、<a [^>]*>story<\/a>もぜひご覧ください。/, "the sentence and its link survive intact");
});
test("7. unchanged: externals, layaway, private paths", () => {
  assert.equal(href("[x](https://www.chajewelsjp.com/en/blog/how-cha-jewels-began)", "ja"), "https://www.chajewelsjp.com/en/blog/how-cha-jewels-began");
  assert.equal(href("[l](/layaway)", "en"), "/layaway");
  assert.equal(href("[c](/cart)", "ja"), "/cart");
});

// ------------------------------------------------ the full matrix the owner asked for
test("explicit /en/ and /ja/ are kept in both page languages, for every public family", () => {
  for (const p of ["/faq", "/about", "/sale", "/blog", "/blog/a-post", "/products/k18-ring", "/categories/rings", "/collections/kihei", "/legal/tokusho", "/jewelry-guide"]) {
    for (const page of ["en", "ja"]) {
      assert.equal(href(`[t](/en${p})`, page), `/en${p}`, `/en${p} on ${page}`);
      assert.equal(href(`[t](/ja${p})`, page), `/ja${p}`, `/ja${p} on ${page}`);
      assert.equal(href(`[t](${p})`, page), `/${page}${p}`, `${p} on ${page}`);
    }
  }
  assert.equal(href("[t](/en)", "ja"), "/en", "an explicit language home");
  assert.equal(href("[t](/)", "ja"), "/ja", "the unprefixed home localizes");
});
test("query strings, fragments and URL encoding are preserved, and nothing is double-prefixed", () => {
  assert.equal(href("[t](/en/faq?x=1&y=2#payments-and-layaway)", "ja"), "/en/faq?x=1&amp;y=2#payments-and-layaway", "escaped & kept as it was");
  assert.equal(href("[t](/faq?q=a%20b#top)", "en"), "/en/faq?q=a%20b#top");
  assert.equal(href("[t](/en/products/%E3%83%AA%E3%83%B3%E3%82%B0)", "ja"), "/en/products/%E3%83%AA%E3%83%B3%E3%82%B0");
  for (const page of ["en", "ja"]) for (const h of ["/en/faq", "/ja/faq", "/faq"]) assert.doesNotMatch(href(`[t](${h})`, page), /^\/(en|ja)\/(en|ja)(\/|$)/);
});
test("locale prefixes are matched on whole path segments only", () => {
  for (const p of ["/english/faq", "/enx/faq", "/en-us/faq", "/EN/faq", "/jap/about", "/ja-jp/faq", "/entry"]) {
    for (const page of ["en", "ja"]) assert.equal(href(`[t](${p})`, page), p, `${p} is not a locale prefix`);
  }
});
test("an explicit link keeps its language but is tidied like any other: no trailing-slash redirect hop", () => {
  assert.equal(href("[t](/en/faq/)", "ja"), "/en/faq");
  assert.equal(href("[t](/en/)", "ja"), "/en");
  assert.equal(href("[t](/ja/about/#top)", "en"), "/ja/about#top");
  assert.equal(href("[t](/en?x=1)", "ja"), "/en?x=1");
});
test("unknown slugs and unknown paths: no data lookup, no invention", () => {
  assert.equal(href("[t](/en/blog/no-such-post)", "ja"), "/en/blog/no-such-post", "explicit kept as written");
  assert.equal(href("[t](/products/no-such-piece)", "ja"), "/ja/products/no-such-piece", "unprefixed: structural, as before");
  assert.equal(href("[t](/no-such-page)", "ja"), "/no-such-page", "not a public family: untouched");
  assert.equal(href("[t](/en/no-such-page)", "ja"), "/en/no-such-page", "explicit unknown: untouched");
  assert.equal(href("[t](/fr/faq)", "ja"), "/fr/faq", "unsupported locale: untouched");
});
test("external, mailto and unsafe protocols: unchanged and still refused where unsafe", () => {
  assert.equal(href("[t](https://example.com/en/faq)", "ja"), "https://example.com/en/faq");
  assert.equal(href("[t](mailto:a@b.c)", "ja"), "mailto:a@b.c");
  for (const bad of ["javascript:alert(1)", "//evil.com", "data:text/html,x", "vbscript:x"]) assert.equal(renderMarkdown(`[t](${bad})`, "ja").includes("<a"), false, bad);
  assert.equal(renderMarkdown("[t](tel:+81300000000)", "ja").includes("<a"), false, "tel: was refused before this change and still is");
  assert.ok(!/href="\/\//.test(renderMarkdown("[t](/en//evil.com)", "ja")), "never protocol-relative");
});
test("private, checkout and account routes are never localized, prefixed or not", () => {
  for (const p of ["/cart", "/checkout", "/account/orders", "/account/layaway", "/login", "/search?q=x"]) {
    for (const page of ["en", "ja"]) assert.equal(href(`[t](${p})`, page), p, `${p} on ${page}`);
  }
});
test("layaway: bare /layaway stays bare; explicit locale layaway URLs are kept as written and never created", () => {
  for (const page of ["en", "ja"]) assert.equal(href("[t](/layaway)", page), "/layaway");
  assert.equal(href("[t](/en/layaway)", "en"), "/en/layaway", "as written (a Phase 3 URL the author typed; not created by code)");
  assert.equal(href("[t](/ja/layaway)", "ja"), "/ja/layaway", "as written");
  assert.equal(localizeAuthoredHref("/layaway", "en"), "/layaway");
  assert.equal(localizeAuthoredHref("/layaway", "ja"), "/layaway");
});

// ------------------------------------------------ what must NOT change
test("the language switcher still swaps prefixes (localePath and switchTargets are unchanged)", async () => {
  assert.equal(localePath("/en/faq", "ja"), "/ja/faq", "localePath keeps its swap semantics");
  assert.deepEqual(await switchTargets("/en/faq"), { en: "/en/faq", ja: "/ja/faq" });
  assert.deepEqual(await switchTargets("/ja/about"), { en: "/en/about", ja: "/ja/about" });
});
test("the three Hub-controlled call sites use the authored-link rule; the switcher does not", () => {
  assert.match(src("lib/markdown.ts"), /localizeAuthoredHref\(rawSafe, lang\)/, "post bodies and FAQ answers");
  assert.match(src("lib/posts.ts"), /renderMarkdown\(body, lang\)/);
  assert.match(src("lib/faq.ts"), /renderMarkdown\(markdown, lang\)/);
  assert.match(src("app/layout.tsx"), /notice\.href && localizeAuthoredHref\(notice\.href, lang\)/, "announcement");
  assert.doesNotMatch(src("lib/locale-nav.ts"), /localizeAuthoredHref/, "the switcher keeps the swapping rule");
});
test("without a page language the renderer output is unchanged (legacy callers)", () => {
  assert.equal(href("[t](/en/faq)"), "/en/faq");
  assert.equal(href("[t](/faq)"), "/faq");
});

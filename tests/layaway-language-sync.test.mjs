// Gate H interim mitigation: an English Layaway link writes cj-lang=en only on
// an actual activation (lib/layaway-language-sync.ts,
// components/site/layaway-language-sync.tsx). Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const { isActivation, isLayawayLink, ENGLISH_LANGUAGE_COOKIE } = await import("@/lib/layaway-language-sync");
const src = (p) => readFileSync(join(process.cwd(), p), "utf8");
const O = "https://www.chajewelsjp.com";

test("only real activations count: left click (incl. Ctrl/Cmd/keyboard/tap) and middle click", () => {
  assert.equal(isActivation("click", 0), true, "left click, Enter on a link, a tap, Ctrl/Cmd-click");
  assert.equal(isActivation("auxclick", 1), true, "middle click");
  for (const [type, button] of [["auxclick", 2], ["click", 1], ["click", 2], ["mouseover", 0], ["mouseenter", 0], ["focus", 0], ["pointerdown", 0], ["mousedown", 0], ["contextmenu", 2], ["touchstart", 0]]) {
    assert.equal(isActivation(type, button), false, `${type}/${button}`);
  }
});

test("the target is exactly this site's /layaway (any query or fragment), nothing else", () => {
  for (const h of ["/layaway", "/layaway?piece=p1", "/layaway#calc", `${O}/layaway`]) assert.equal(isLayawayLink(h, O), true, h);
  for (const h of ["/account/layaway", "/account/layaway/abc", "/en/layaway", "/ja/layaway", "/layaway/x", "/faq#payments-and-layaway", "/blog/layaway-guide", "https://evil.example/layaway", "//evil.example/layaway", "", null, undefined, "javascript:alert(1)"]) {
    assert.equal(isLayawayLink(h, O), false, String(h));
  }
});

test("the cookie written is exactly the established one: cj-lang=en, path=/, one year, SameSite=Lax", () => {
  assert.equal(ENGLISH_LANGUAGE_COOKIE, "cj-lang=en; path=/; max-age=31536000; samesite=lax");
  // The same attributes the server writes (middleware.ts, lib/checkout-actions.ts).
  assert.match(src("middleware.ts"), /path: "\/",\s*maxAge: 60 \* 60 \* 24 \* 365,\s*sameSite: "lax"/);
});

test("the listener: capture phase, click + auxclick only, never prevents or rewrites navigation, writes only en", () => {
  const c = src("components/site/layaway-language-sync.tsx").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
  const events = [...c.matchAll(/addEventListener\("([a-z]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(events, ["auxclick", "click"]);
  assert.match(c, /addEventListener\("click", onActivate, true\)/);
  assert.doesNotMatch(c, /preventDefault|stopPropagation|location\.(assign|replace|href\s*=)|router\.|\.setAttribute\("href"/, "navigation is never changed");
  assert.doesNotMatch(c, /mouseover|mouseenter|pointerenter|focus|touchstart|contextmenu|prefetch/, "no speculative trigger");
  assert.equal((c.match(/document\.cookie = /g) ?? []).length, 1);
  assert.match(c, /document\.cookie = ENGLISH_LANGUAGE_COOKIE;/);
});

test("mounted only where layaway is offered (English documents); Japanese pages never get the listener", () => {
  assert.match(src("app/layout.tsx"), /\{layawayOffered\(lang\) && <LayawayLanguageSync \/>\}/);
});

test("public navigation is unchanged: the header link is still the bare /layaway, and no ?lang= link exists", () => {
  assert.match(src("components/site/header.tsx"), /href: L\("\/layaway"\)/);
  assert.match(src("app/layout.tsx"), /href: "\/layaway", label: t\("home", "tabLayaway"\)/);
  const files = [];
  (function walk(d) { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else if (/\.tsx?$/.test(n)) files.push(f); } })(join(process.cwd(), "components"));
  (function walk(d) { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else if (/\.tsx?$/.test(n)) files.push(f); } })(join(process.cwd(), "app"));
  // Code only: comments may name these URLs to explain why they cannot be produced.
  for (const f of files) assert.doesNotMatch(readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""), /["'`]\/layaway\?lang=|["'`]\/(en|ja)\/layaway/, `${f} links a language-specific layaway URL`);
});

// H-07 (security audit 2026-10-31): the customer's Messenger link is an
// http(s) web address or nothing. The Hub applies the same rule on every save
// path; this is the website's copy. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { normalizeMessengerLink, MESSENGER_LINK_MAX } = await import("@/lib/profile-messenger-link");

test("empty input means no link", () => {
  for (const v of ["", "   ", null, undefined]) assert.deepEqual(normalizeMessengerLink(v), { ok: true, value: null }, String(v));
});

test("ordinary links are kept; a link typed without a scheme gets https://", () => {
  const cases = [
    ["m.me/ana.cruz", "https://m.me/ana.cruz"],
    ["  m.me/ana.cruz  ", "https://m.me/ana.cruz"],
    ["www.facebook.com/ana.cruz", "https://www.facebook.com/ana.cruz"],
    ["facebook.com/profile.php?id=1000123", "https://facebook.com/profile.php?id=1000123"],
    ["https://m.me/ana.cruz", "https://m.me/ana.cruz"],
    ["HTTPS://m.me/AnaCruz", "https://m.me/AnaCruz"],
    ["https:m.me/ana", "https://m.me/ana"],
    ["http://m.me/ana", "http://m.me/ana"],
    ["https://www.messenger.com/t/ana", "https://www.messenger.com/t/ana"],
  ];
  for (const [input, value] of cases) assert.deepEqual(normalizeMessengerLink(input), { ok: true, value }, input);
});

test("anything that is not an http(s) web address is refused", () => {
  const BAD = [
    "javascript:alert(1)",
    "JavaScript:alert(document.cookie)",
    " javascript:alert(1)",
    "jav\tascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "fb-messenger://user-thread/1",
    "mailto:a@b.com",
    "https://user:pass@m.me/x",
    "Ana Cruz",
    "localhost",
    "https://localhost/x",
    "m.me\\evil",
    "https://m.me/a\nb",
    "https://" + "a".repeat(MESSENGER_LINK_MAX),
    7,
    {},
  ];
  for (const v of BAD) assert.deepEqual(normalizeMessengerLink(v), { ok: false }, JSON.stringify(v));
});

test("every accepted value is an http(s) URL", () => {
  for (const v of ["m.me/a", "x.co/y", "//m.me/a", "https://m.me/a"]) {
    const r = normalizeMessengerLink(v);
    assert.equal(r.ok, true, v);
    assert.match(new URL(r.value).protocol, /^https?:$/, v);
  }
});

test("the profile action sends only the checked value", () => {
  const src = readFileSync(new URL("../lib/profile-actions.ts", import.meta.url), "utf8");
  assert.match(src, /normalizeMessengerLink\(str\(form, "messenger_link"\)\)/);
  assert.match(src, /code: "messenger_link_invalid"/);
  assert.doesNotMatch(src, /const messengerLink = str\(form, "messenger_link"\)/);
});

// Owner "deep-link" (2026-10-02): on a phone the Messenger links try the app
// first; the m.me href stays the real link. Pure helpers only.
import test from "node:test";
import assert from "node:assert/strict";
import { messengerDeepLink, isPhone } from "../lib/messenger-link.ts";

test("a known m.me username maps to the Page's app scheme", () => {
  assert.equal(messengerDeepLink("https://m.me/chajewelsjapan"), "fb-messenger://user-thread/109307664336824");
  assert.equal(messengerDeepLink("https://m.me/ChaJewelsJapan/"), "fb-messenger://user-thread/109307664336824");
});

test("an unknown username or a non-m.me link gets no deep link (plain m.me behaviour)", () => {
  assert.equal(messengerDeepLink("https://m.me/someoneelse"), null);
  assert.equal(messengerDeepLink("https://m.me/ch/AbYF1EaEkypQc5Jk/?send_source=cm:copy_invite_link"), null);
  assert.equal(messengerDeepLink("https://www.facebook.com/chajewelsjapan"), null);
});

test("phones are iOS and Android user agents", () => {
  assert.equal(isPhone("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"), true);
  assert.equal(isPhone("Mozilla/5.0 (Linux; Android 14; Pixel 8)"), true);
  assert.equal(isPhone("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)"), false);
});

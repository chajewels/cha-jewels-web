// CANCELLATION POLICY (V10d, owner 2026-10-08): the approved rule lives once, in
// the Return, Cancellation and Refund Policy article "Paid-in-Full Order
// Cancellations"; checkout and the order page link to that article by its
// rendered heading id, which is positional and differs if an article is
// dropped. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { cancellationPolicyHref, RETURNS_CANCELLATION_ARTICLE } = await import("@/lib/cancellation-policy");
const { legalArticlesFor, returnsArticles } = await import("@/lib/content/legal");
const { layawayOffered } = await import("@/lib/layaway-availability");
const { dict } = await import("@/lib/i18n");

const text = (article, lang) =>
  article.blocks.map((b) => {
    if (b.kind === "list") return b.items[lang].join(" ");
    if (b.kind === "rich") return b.runs[lang].map((r) => r.t).join("");
    if (b.kind === "lines") return b.lines[lang].join(" ");
    return b.text?.[lang] ?? "";
  }).join(" ");

const article = (lang) => legalArticlesFor(returnsArticles, layawayOffered(lang)).find((a) => a.n === RETURNS_CANCELLATION_ARTICLE);

test("the link lands on the cancellation article in both languages", () => {
  for (const lang of ["en", "ja"]) {
    const href = cancellationPolicyHref(lang);
    const m = /^\/legal\/returns#s(\d+)$/.exec(href);
    assert.ok(m, `${lang}: ${href}`);
    const articles = legalArticlesFor(returnsArticles, layawayOffered(lang));
    assert.equal(articles[Number(m[1]) - 1].n, RETURNS_CANCELLATION_ARTICLE, `${lang}: the id points at the cancellation article`);
  }
});

test("the article states the approved rule (owner 2026-10-08) in both languages", () => {
  const en = text(article("en"), "en");
  assert.match(en, /on the day of your order \(Japan time\)/);
  assert.match(en, /full amount you paid is added to your account as store credit, valid for one year/);
  assert.match(en, /30% cancellation charge applies and the remaining 70% is added as store credit/);
  assert.match(en, /Store credit cannot be exchanged for cash/);
  assert.match(en, /refund is made to the card only and is never combined with store credit/);
  assert.doesNotMatch(en, /30% of the total order price/, "the old 'up to 30% of the total order price' is gone");

  const ja = text(article("ja"), "ja");
  assert.match(ja, /ご注文日（日本時間）の当日/);
  assert.match(ja, /1年間有効なストアクレジット/);
  assert.match(ja, /30%をキャンセル料として申し受け、残りの70%をストアクレジット/);
  assert.match(ja, /現金への払い戻しはできません/);
  assert.match(ja, /カードへの返金のみ/);
  assert.doesNotMatch(ja, /分割予約|レイアウェイ/, "no layaway word on the Japanese site");
});

test("checkout and order-page copy name the policy in both languages", () => {
  for (const lang of ["en", "ja"]) {
    for (const k of ["policyPrefix", "policyTerms", "policyJoin", "policyCancel", "policySuffix"]) {
      assert.equal(typeof dict.checkout[k][lang], "string", `checkout.${k}.${lang}`);
    }
    assert.equal(typeof dict.orders.cancellationPolicy[lang], "string");
  }
  assert.equal(dict.checkout.policyCancel.en, "Cancellation policy");
  assert.equal(dict.checkout.policyCancel.ja, "キャンセルポリシー");
});

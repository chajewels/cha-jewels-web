// 特定商取引法 PAYMENT ROWS FOLLOW THE SWITCHES (Stripe review 2026-10-09).
// The page names bank transfer always, card only while the Hub offers it,
// Paidy only while paidy_mode is on, and konbini never. The Japanese page
// (layaway off) names no layaway. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { tokushoRowsFor } = await import("@/lib/content/legal");

const COMBOS = [
  { card: true, paidy: true },
  { card: false, paidy: true },
  { card: true, paidy: false },
  { card: false, paidy: false },
];
const PAIDY_EN = "Paidy (あと払い（ペイディ）; for customers living in Japan only — Japanese mobile number, identity check and payment in Japan; orders in yen)";
const row = (rows, ja) => rows.find((r) => r.k.ja === ja);

test("支払方法 names exactly the offered methods, in order", () => {
  const want = {
    "true,true": ["クレジットカード、銀行振込、あと払い（ペイディ）", `Credit card, bank transfer, ${PAIDY_EN}, and layaway※`],
    "false,true": ["銀行振込、あと払い（ペイディ）", `Bank transfer, ${PAIDY_EN}, and layaway※`],
    "true,false": ["クレジットカード、銀行振込", "Credit card, bank transfer, and layaway※"],
    "false,false": ["銀行振込", "Bank transfer and layaway※"],
  };
  for (const o of COMBOS) {
    const [ja, en] = want[`${o.card},${o.paidy}`];
    assert.equal(row(tokushoRowsFor(false, o), "支払方法").v.ja, ja);
    assert.equal(row(tokushoRowsFor(true, o), "支払方法").v.en, en);
  }
});

test("支払時期: the card sentence follows the card switch; the Paidy sentence never changes", () => {
  const CARD_JA = "クレジットカードの場合は、お支払い手続き時に与信（仮売上）を行い、当社での確認時に売上が確定します。";
  const CARD_EN = " By card, the amount is authorised (held) when you pay and charged when we confirm the payment.";
  const PAIDY_JA = "あと払い（ペイディ）の場合は、ご利用の翌月にペイディからのご請求に沿ってお支払いください（コンビニ払い・銀行振込・口座振替）。";
  const PAIDY_EN_S = " With Paidy, you pay Paidy the following month as billed by Paidy (convenience store, bank transfer or direct debit).";
  for (const o of COMBOS) {
    const v = row(tokushoRowsFor(true, o), "支払時期").v;
    assert.equal(v.ja, "ご注文確認のご連絡後、表示の期限までにお支払いください。" + (o.card ? CARD_JA : "") + PAIDY_JA);
    assert.equal(v.en.includes(CARD_EN), o.card);
    assert.ok(v.en.startsWith("After we confirm your order, by the deadline shown." + (o.card ? CARD_EN : "") + PAIDY_EN_S));
    assert.ok(v.en.endsWith("For layaway※, on the dates shown in your account, over a three-, six- or eight-month plan (eight months for orders of ¥300,000 or more)"));
  }
});

test("with every switch on, the switched rows read exactly as before (minus konbini)", () => {
  const rows = tokushoRowsFor(true, COMBOS[0]);
  assert.equal(row(rows, "支払時期").v.ja, "ご注文確認のご連絡後、表示の期限までにお支払いください。クレジットカードの場合は、お支払い手続き時に与信（仮売上）を行い、当社での確認時に売上が確定します。あと払い（ペイディ）の場合は、ご利用の翌月にペイディからのご請求に沿ってお支払いください（コンビニ払い・銀行振込・口座振替）。");
  assert.equal(row(rows, "支払時期").v.en, "After we confirm your order, by the deadline shown. By card, the amount is authorised (held) when you pay and charged when we confirm the payment. With Paidy, you pay Paidy the following month as billed by Paidy (convenience store, bank transfer or direct debit). For layaway※, on the dates shown in your account, over a three-, six- or eight-month plan (eight months for orders of ¥300,000 or more)");
});

test("konbini is never offered as a way to pay us, and its fee is gone", () => {
  for (const o of COMBOS) for (const layaway of [true, false]) {
    const rows = tokushoRowsFor(layaway, o);
    assert.deepEqual(row(rows, "商品代金以外の必要料金").v, { ja: "送料、銀行振込手数料", en: "Shipping and bank transfer fees" });
    for (const r of rows) {
      assert.ok(!r.v.ja.includes("コンビニ決済"), r.k.ja);
      assert.ok(!/convenience-store payment/i.test(r.v.en), r.k.en);
    }
  }
});

test("support hours sit right after the email row", () => {
  const rows = tokushoRowsFor(false, COMBOS[3]);
  const i = rows.findIndex((r) => r.k.ja === "メールアドレス");
  assert.deepEqual(rows[i + 1].k, { ja: "受付時間", en: "Support hours" });
  assert.deepEqual(rows[i + 1].v, { ja: "平日 10:00–18:00（土日祝日を除く）", en: "Weekdays 10:00–18:00 (JST), closed weekends and Japanese public holidays" });
});

test("the Japanese page names no layaway in any combination", () => {
  for (const o of COMBOS) for (const r of tokushoRowsFor(false, o)) {
    assert.ok(!/分割予約|レイアウェイ/.test(r.k.ja + r.v.ja), r.k.ja);
    assert.ok(!("by" in r), "rows come out resolved");
  }
});

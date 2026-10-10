// 特定商取引法 PAYMENT ROWS FOLLOW THE SWITCHES (Stripe review 2026-10-09).
// The page names bank transfer always, card only while the Hub offers it,
// Paidy only while paidy_mode is on, and konbini ALWAYS (owner 2026-10-10:
// its application is in progress; the owner says when to remove it). The Japanese page
// (layaway off) names no layaway. Cash on delivery is ALWAYS named, with its
// timing sentence (owner approved 2026-10-10). Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { tokushoRowsFor } = await import("@/lib/content/legal");

const COMBOS = [
  { card: true, paidy: true },
  { card: false, paidy: true },
  { card: true, paidy: false },
  { card: false, paidy: false },
];
const PAIDY_JA = "あと払い（ペイディ）（日本国内にお住まいのお客様のみ。円でのご注文。ペイディへの支払方法は、コンビニ払い（コンビニ設置端末）、銀行振込及び口座振替となります。）";
const PAIDY_EN = "Paidy (あと払い（ペイディ）; for customers living in Japan only — Japanese mobile number, identity check and payment in Japan; orders in yen; you pay Paidy at a convenience store (in-store terminal), by bank transfer or by direct debit)";
const COD_JA = "代金引換（日本国内へのお届け・日本円・一括払いのご注文で、代金引換手数料を除くお受け取り時のお支払い額が30万円以下の場合に限ります）";
const COD_EN = "cash on delivery (代金引換; delivery in Japan, orders in yen paid in full, where the amount collected on delivery, excluding the cash on delivery fee, is ¥300,000 or less)";
const COD_TIME_JA = "代金引換の場合は、商品お受け取り時に配達員へお支払いください（お支払い期限はありません）。";
const COD_TIME_EN = " With cash on delivery, you pay the courier when you receive the piece (there is no deadline).";
const row = (rows, ja) => rows.find((r) => r.k.ja === ja);

test("支払方法 names exactly the offered methods, in order", () => {
  const want = {
    "true,true": [`クレジットカード、銀行振込、コンビニ決済、${PAIDY_JA}、${COD_JA}`, `Credit card, bank transfer, convenience-store payment, ${PAIDY_EN}, ${COD_EN}, and layaway※`],
    "false,true": [`銀行振込、コンビニ決済、${PAIDY_JA}、${COD_JA}`, `Bank transfer, convenience-store payment, ${PAIDY_EN}, ${COD_EN}, and layaway※`],
    "true,false": [`クレジットカード、銀行振込、コンビニ決済、${COD_JA}`, `Credit card, bank transfer, convenience-store payment, ${COD_EN}, and layaway※`],
    "false,false": [`銀行振込、コンビニ決済、${COD_JA}`, `Bank transfer, convenience-store payment, ${COD_EN}, and layaway※`],
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
  const PAIDY_JA_S = "あと払い（ペイディ）の場合は、ご利用の翌月にペイディからのご請求に沿ってお支払いください（コンビニ払い・銀行振込・口座振替）。支払期日は、コンビニ払い及び銀行振込の場合は翌月27日までとなります。口座振替の場合は27日に引き落しとなります。";
  const PAIDY_EN_S = " With Paidy, you pay Paidy the following month as billed by Paidy (convenience store, bank transfer or direct debit); by convenience store or bank transfer, by the 27th of that month; by direct debit, it is taken on the 27th.";
  for (const o of COMBOS) {
    const v = row(tokushoRowsFor(true, o), "支払時期").v;
    assert.equal(v.ja, "ご注文確認のご連絡後、表示の期限までにお支払いください。" + (o.card ? CARD_JA : "") + PAIDY_JA_S + COD_TIME_JA);
    assert.equal(v.en.includes(CARD_EN), o.card);
    assert.ok(v.en.startsWith("After we confirm your order, by the deadline shown." + (o.card ? CARD_EN : "") + PAIDY_EN_S + COD_TIME_EN));
    assert.ok(v.en.endsWith("For layaway※, on the dates shown in your account, over a three-, six- or eight-month plan (eight months for orders of ¥300,000 or more)"));
  }
});

test("with every switch on, the switched rows read exactly as approved (COD added 2026-10-10)", () => {
  const rows = tokushoRowsFor(true, COMBOS[0]);
  assert.equal(row(rows, "支払時期").v.ja, "ご注文確認のご連絡後、表示の期限までにお支払いください。クレジットカードの場合は、お支払い手続き時に与信（仮売上）を行い、当社での確認時に売上が確定します。あと払い（ペイディ）の場合は、ご利用の翌月にペイディからのご請求に沿ってお支払いください（コンビニ払い・銀行振込・口座振替）。支払期日は、コンビニ払い及び銀行振込の場合は翌月27日までとなります。口座振替の場合は27日に引き落しとなります。代金引換の場合は、商品お受け取り時に配達員へお支払いください（お支払い期限はありません）。");
  assert.equal(row(rows, "支払時期").v.en, "After we confirm your order, by the deadline shown. By card, the amount is authorised (held) when you pay and charged when we confirm the payment. With Paidy, you pay Paidy the following month as billed by Paidy (convenience store, bank transfer or direct debit); by convenience store or bank transfer, by the 27th of that month; by direct debit, it is taken on the 27th. With cash on delivery, you pay the courier when you receive the piece (there is no deadline). For layaway※, on the dates shown in your account, over a three-, six- or eight-month plan (eight months for orders of ¥300,000 or more)");
});

test("konbini stays listed in every combination, with its fee (owner 2026-10-10)", () => {
  for (const o of COMBOS) for (const layaway of [true, false]) {
    const rows = tokushoRowsFor(layaway, o);
    assert.ok(row(rows, "支払方法").v.ja.includes("コンビニ決済"));
    assert.ok(/convenience-store payment/.test(row(rows, "支払方法").v.en));
    assert.ok(row(rows, "商品代金以外の必要料金").v.ja.startsWith("送料、銀行振込手数料、コンビニ決済手数料。"));
    assert.ok(row(rows, "商品代金以外の必要料金").v.en.startsWith("Shipping, bank transfer fees, and convenience-store payment fees"));
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

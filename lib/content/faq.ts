import type { Lang } from "@/lib/i18n";

export type FaqItem = { q: Record<Lang, string>; a: Record<Lang, string> };

/**
 * Answers state policy, so they are written once here and reused by the page and
 * its FAQPage JSON-LD — the structured data can never drift from what a reader
 * sees. Two rules these answers must keep:
 *   - purity is described as K18 / 75%, never by a country name (CLAUDE.md);
 *   - a claimed piece is held 60 minutes for EVERY member, at every tier.
 */
export const faqItems: FaqItem[] = [
  {
    q: { ja: "ゴールドは本物ですか？どこで作られていますか？", en: "Is your gold real, and where is it made?" },
    a: {
      ja: "ゴールドはすべてK18（純度75%）で、K18の刻印が入り、一点ずつ日本で真贋を確認してから掲載しています。製作地は商品ごとに異なります。日本での製造を確認できた場合のみ商品ページに製造国を表示し、ブランド品はブランド名を表示します。どちらの表示もない商品については、製作地を断定していません。当店では純度で商品を説明しており、国名を純度の代わりに用いることはありません。",
      en: "Every gold piece is K18 — 75% pure — carries the K18 stamp, and is hallmark checked in Japan before it is listed. Where a piece was made varies. A listing carries an origin badge only when we have confirmed Japanese manufacture, and a branded piece shows its brand name instead. If a listing shows neither, we are not claiming an origin. We describe gold by its purity, never by a country name as a substitute for a purity claim.",
    },
  },
  {
    q: { ja: "分割予約のしくみは？", en: "How does layaway work?" },
    a: {
      ja: "商品代金の30%をお支払いいただくと商品を確保します。残額は3〜6か月の均等払い、金利は0%です。¥300,000以上のご注文は最長8か月まで延長できます。お支払い予定は書面でお渡しし、各お支払日の3日前にご連絡します。商品は最終回のお支払い後に発送します。",
      en: "Pay 30% and the piece comes off the shelf. The balance is split into equal monthly payments over three to six months at 0% interest, and orders of ¥300,000 and above can stretch to eight months. You get the schedule in writing, a reminder three days before each due date, and the piece ships after the final payment.",
    },
  },
  {
    q: { ja: "フィリピンへの配送とペソ払いはできますか？", en: "Do you ship to the Philippines and can I pay in pesos?" },
    a: {
      ja: "東京から保険付きで発送します。サイト上のペソ表示は当日のレートによる参考値で、お支払いは円建てで確定します。",
      en: "We ship insured from Tokyo. Peso figures on the site are indicative at the day's rate; payment is settled in yen.",
    },
  },
  {
    q: { ja: "家族へのプレゼントとして送れますか？", en: "Can I buy for family back home?" },
    a: {
      ja: "はい。「Para Sa Iba」でお支払いはお客様、お届けは日本またはフィリピンのご家族へ。メッセージも添えられます。分割予約の場合は最終回のお支払い後に発送します。ポイントはお支払いいただいた方に付与されます。",
      en: "Yes — Para Sa Iba. You pay here and we deliver to your family in Japan or the Philippines with your note. On layaway the piece ships after the final payment, and the points go to whoever paid.",
    },
  },
  {
    q: { ja: "ライブで予約した商品を支払わないとどうなりますか？", en: "What happens to my claimed piece from Live if I don't pay right away?" },
    a: {
      ja: "ご予約いただいた商品は60分間お取り置きします。これは会員レベルを問わず同じです。60分を過ぎると商品は販売中に戻ります。",
      en: "A claimed piece is held for 60 minutes. That is the same for every member, at every level. After that the piece returns to sale.",
    },
  },
  {
    q: { ja: "会員レベルはどのように決まりますか？", en: "How is my member level decided?" },
    a: {
      ja: "これまでのお買い上げ合計で決まり、上のレベルに達した日から特典が使えます。180日間お買い上げがない場合はレベルが1段階下がり、各レベルの復帰条件の金額をお買い上げいただくと元に戻ります。ポイントは有効期限内であれば残ります。",
      en: "By your lifetime purchases with Cha Jewels; the perks of a new level start the same day you reach it. If 180 days pass without a purchase your level steps down by one, and it comes back once you spend that level's regain amount. Your points stay as long as they are within their validity period.",
    },
  },
  {
    q: { ja: "買い取りはしていますか？", en: "Will you buy it back?" },
    a: {
      ja: "当店でお求めいただいたK18の商品は、その時点の金相場に基づき書面でお見積りをお出しします。有効期限は7日間です。プレラブド・ラグジュアリーは買い取りではなく、委託販売のお手伝いをしています。",
      en: "For K18 pieces bought from us, we quote in writing against the current gold price, valid for seven days. For preloved luxury we help you consign it rather than buying it back.",
    },
  },
  {
    q: { ja: "卸売の最低数量は？", en: "What are your wholesale minimums?" },
    a: {
      ja: "1回のご注文は10点からで、SKUの組み合わせは自由です。価格はグラム重量と当日の相場に連動します。3回目以降のご注文で30日払いをご相談いただけます。",
      en: "Ten pieces per order, mixed SKUs. Pricing follows gram weight and the day's rate, and 30-day terms are possible after the third order.",
    },
  },
];

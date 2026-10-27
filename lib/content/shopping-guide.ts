import type { Lang } from "@/lib/i18n";

/**
 * THE SHOPPING GUIDE (/shopping-guide; owner plan 2026-10-27, step 6).
 *
 * How buying from Cha Jewels works, start to finish. Every fact is one this
 * site already states elsewhere — the 特定商取引法 page, the FAQ, the Return,
 * Cancellation and Refund Policy — or one the Hub enforces (order confirmation
 * by staff, the 24 / 72-hour payment window, receipts). The payment rows are
 * NOT restated here: the page renders the tokusho rows themselves
 * (tokushoRowsFor, lib/content/legal.ts), so the two pages can never disagree.
 *
 * NO LAYAWAY ON THE JAPANESE SITE (owner decision 2026-09-25): a block marked
 * `layaway: true` is English-only and dropped by `guideBlocksFor`; its `ja` is
 * empty on purpose. Nothing else here mentions layaway.
 *
 * Money: no figure here is computed. The shipping threshold and fee are the
 * owner's published Japan rate (Hub shipping rate card, JP 0 → ¥800, ¥8,000 →
 * free); change them here only when the owner changes that rate.
 */
export type GuideText = Record<Lang, string>;
export type GuideRun = { t: GuideText; href?: string };
export type GuideBlock =
  | { kind: "p"; text: GuideText; layaway?: true }
  | { kind: "rich"; runs: GuideRun[]; layaway?: true }
  | { kind: "list"; items: GuideText[]; layaway?: true }
  | { kind: "steps"; items: { h: GuideText; p: GuideText }[]; layaway?: true }
  | { kind: "tokusho"; keys: string[] }
  | { kind: "note"; text: GuideText; layaway?: true };

export type ShoppingGuideSection = { id: string; title: GuideText; blocks: GuideBlock[] };

export const shoppingGuideIntro = {
  eyebrow: { ja: "ショッピングガイド", en: "Shopping guide" },
  h1: { ja: "ご注文から、お届けまで。", en: "From your order to your door." },
  lede: {
    ja: "Cha Jewelsでのお買い物の流れを、ご注文、お支払い、配送、領収書、キャンセルと返品の順にご案内します。ご不明な点は、いつでもお問い合わせください。",
    en: "How shopping with Cha Jewels works: ordering, paying, shipping, receipts, cancellations and returns. If anything is unclear, just ask us.",
  },
  contents: { ja: "目次", en: "Contents" },
  help: { ja: "ご不明な点はお気軽にお問い合わせください。", en: "Still have a question? We are happy to help." },
  contact: { ja: "お問い合わせ", en: "Contact us" },
  faq: { ja: "よくある質問", en: "FAQ" },
};

export const shoppingGuide: ShoppingGuideSection[] = [
  {
    id: "our-pieces",
    title: { ja: "取り扱い商品について", en: "About our pieces" },
    blocks: [
      { kind: "p", text: { ja: "新品のK18ゴールドジュエリー、パール、ダイヤモンド、そしてブランドのプレラブド（中古）品を取り扱っています。プレラブド品はすべて日本で真贋と刻印を確認しています。", en: "We sell new K18 gold jewelry, pearls and diamonds, and preloved branded pieces. Every preloved piece is authenticated and its hallmark checked in Japan." } },
      { kind: "p", text: { ja: "一点ものの商品も多くあります。素材の刻印、重量、サイズ、状態は各商品ページに記載しています。お使いの画面により、色味が実物と異なって見える場合があります。", en: "Many pieces are one of a kind. The metal stamp, weight, size and condition are on each product page. Colours can look slightly different depending on your screen." } },
      { kind: "rich", runs: [{ t: { ja: "リングサイズやネックレスの長さは、", en: "For ring sizes and necklace lengths, see the " } }, { t: { ja: "ジュエリーガイド", en: "Jewelry Guide" }, href: "/jewelry-guide" }, { t: { ja: "をご覧ください。", en: "." } }] },
    ],
  },
  {
    id: "how-to-order",
    title: { ja: "ご注文の流れ", en: "How to order" },
    blocks: [
      {
        kind: "steps",
        items: [
          { h: { ja: "カートに入れて、ご注文手続きへ", en: "Add to cart and check out" }, p: { ja: "サインインのうえ、お届け先とお支払い方法を選んでご注文ください。ご注文の時点で商品をお取り置きします。", en: "Sign in, choose the delivery address and how you will pay, and place your order. The piece is set aside for you from that moment." } },
          { h: { ja: "当社でご注文を確認", en: "We confirm your order" }, p: { ja: "スタッフが在庫と内容を確認し、ご注文確定のメールをお送りします。お支払いの詳細は、この確認のあとにご案内します。", en: "Our team checks the piece and your details, then emails you to confirm the order. Payment details are sent only after this confirmation." } },
          { h: { ja: "期限までにお支払い", en: "Pay by the deadline" }, p: { ja: "お支払い期限は、はじめてのお客様は24時間、2回目以降のお客様は72時間です。期限はマイアカウントのご注文ページとメールに記載します。期限までにお支払いがない場合、ご注文は自動的にキャンセルされ、商品のお取り置きは解除されます。", en: "You have 24 hours to pay if you are new to Cha Jewels, or 72 hours if you have ordered before. The deadline is on your order page in My Account and in the email. If payment does not arrive in time, the order is cancelled automatically and the piece is released." } },
          { h: { ja: "発送", en: "We ship" }, p: { ja: "ご入金を確認してから5営業日以内に発送し、追跡番号をお知らせします。", en: "Once your payment has cleared, we ship within five business days and send you the tracking number." } },
        ],
      },
      { kind: "p", text: { ja: "ご注文の状況は、いつでもマイアカウントの「注文履歴」でご確認いただけます。", en: "You can follow every order under Orders in My Account." } },
    ],
  },
  {
    id: "payment",
    title: { ja: "お支払い方法", en: "Payment" },
    blocks: [
      { kind: "p", text: { ja: "ご利用いただけるお支払い方法、お支払いの時期、商品代金以外にかかる費用は次のとおりです（特定商取引法に基づく表記と同じ内容です）。", en: "The payment methods, when payment is due and the charges besides the price are below — word for word what our legal notice states." } },
      { kind: "tokusho", keys: ["Payment methods", "When payment is due", "Charges besides the price", "※ About layaway"] },
      { kind: "list", items: [
        { ja: "お支払い方法はご注文時に選択いただき、確定後はその方法でお支払いいただきます。変更をご希望の場合は、ご注文ページをご確認いただくか、お問い合わせください。", en: "You choose how to pay when you order, and the confirmed order is paid that way. To change it, check your order page or contact us." },
        { ja: "銀行振込の振込先は、ご注文確定後にのみご案内します。", en: "Bank details are shown only after we confirm your order." },
        { ja: "あと払い（ペイディ）は、日本国内にお住まいで、日本の携帯電話番号をお持ちのお客様が対象です。", en: "Paidy is for customers who live in Japan and have a Japanese mobile number." },
      ] },
    ],
  },
  {
    id: "coupons-points",
    title: { ja: "クーポンとポイント", en: "Coupons and points" },
    blocks: [
      { kind: "p", text: { ja: "クーポンコードは、ご注文手続きの画面で入力してください。クーポンは商品代金に適用され、送料には適用されません。", en: "Enter a coupon code at checkout. A coupon applies to the pieces, not to shipping." } },
      { kind: "p", text: { ja: "会員プログラムのポイントは、1ポイント＝¥1として、ご注文手続きの画面で商品代金のお支払いにご利用いただけます。クーポンとポイントを同じご注文で使う場合は、クーポンが先に適用されます。", en: "Loyalty points are worth ¥1 each and can be used at checkout towards the pieces. If you use a coupon and points on the same order, the coupon comes off first." } },
      { kind: "p", text: { ja: "ポイントは、お支払いの確認後に付与されます。ご利用になったポイントは、ご注文が期限切れやキャンセルになった場合も戻りません。", en: "Points are added once your payment is confirmed. Points you use are not returned if the order lapses or is cancelled." } },
      { kind: "rich", runs: [{ t: { ja: "会員レベルと付与率は", en: "Levels and earning rates are on the " } }, { t: { ja: "会員プログラムのページ", en: "Loyalty page" }, href: "/loyalty" }, { t: { ja: "をご覧ください。", en: "." } }] },
    ],
  },
  {
    id: "receipts",
    title: { ja: "領収書", en: "Receipts" },
    blocks: [
      { kind: "p", text: { ja: "このウェブサイトでのご注文は、代金を全額お支払いいただくと領収書（PDF）を発行し、メールでお知らせします。", en: "When an order placed on this website is fully paid, we issue a receipt (PDF) and email you that it is ready." } },
      { kind: "list", items: [
        { ja: "マイアカウントの「領収書」、またはご注文ページからダウンロードできます。", en: "Download it from Receipts in My Account, or from the order page." },
        { ja: "宛名と但し書き（初期設定は「お品代として」）はダウンロードの前に変更できます。", en: "You can set the name (宛名) and the purpose line (但し書き, お品代として by default) before you download." },
        { ja: "日本語または英語でダウンロードできます。", en: "Download it in Japanese or English." },
        { ja: "2回目以降のダウンロードには「再発行」と記載されます。", en: "Every download after the first is marked Reissued (再発行)." },
        { ja: "金額はすべて税込で、消費税（10%）を記載します。電子発行のため、収入印紙は貼付しません。", en: "Every amount includes tax, and the 10% consumption tax is shown. Receipts are issued electronically, so no revenue stamp is affixed." },
      ] },
      { kind: "rich", runs: [{ t: { ja: "領収書のQRコードと確認コードで、", en: "Anyone can check a receipt with its QR code or verification code on " } }, { t: { ja: "領収書の確認ページ", en: "the verification page" }, href: "/receipts/verify" }, { t: { ja: "から有効かどうかを確認できます。ご注文内容が変わった場合、元の領収書は無効になり、新しい番号で発行し直します。", en: ". If an order changes, its receipt is cancelled and a new one is issued with a new number." } }] },
    ],
  },
  {
    id: "shipping",
    title: { ja: "配送", en: "Shipping" },
    blocks: [
      { kind: "list", items: [
        { ja: "日本国内：商品代金の合計が¥8,000以上で送料無料、¥8,000未満は送料¥800です。", en: "Japan: free shipping on pieces totalling ¥8,000 or more; otherwise ¥800." },
        { ja: "海外：送料はご注文手続きの画面に表示します。表示がない地域は、ご注文確定の際にお知らせします。", en: "Outside Japan: the shipping fee is shown at checkout. Where none is shown, we tell you when we confirm the order." },
        { ja: "ご入金の確認後5営業日以内に発送します。代金引換の場合は、ご注文確定後に発送します。", en: "We ship within five business days of your payment clearing. Cash on delivery orders ship after we confirm the order." },
        { ja: "発送後、追跡番号をメールとご注文ページでお知らせします。", en: "Once shipped, the tracking number is in your email and on your order page." },
      ] },
      { kind: "p", text: { ja: "海外へのお届けでは、お届け先の国で課される関税、輸入税、通関手数料などは、原則としてお客様のご負担となります。", en: "For deliveries outside Japan, customs duties, import taxes and brokerage charges collected in the destination country are generally paid by the customer." } },
      { kind: "p", layaway: true, text: { ja: "", en: "Layaway pieces ship after the final payment." } },
    ],
  },
  {
    id: "cancellation",
    title: { ja: "キャンセル", en: "Cancellation" },
    blocks: [
      { kind: "list", items: [
        { ja: "ご注文日（日本時間）の当日のキャンセル：お支払い金額の全額を、1年間有効なストアクレジットとしてお客様のアカウントに追加します。", en: "Cancelled on the day of your order (Japan time): the full amount you paid is added to your account as store credit, valid for one year." },
        { ja: "翌日以降のキャンセル：お支払い金額の30%をキャンセル料として申し受け、残りの70%をストアクレジットとして追加します。", en: "Cancelled on a later day: a 30% cancellation charge applies and the remaining 70% is added as store credit." },
        { ja: "クレジットカードでお支払いの場合、返金はカードへの返金のみとなり、ストアクレジットとの重複はありません。", en: "If you paid by card, the refund goes back to the card only and is never combined with store credit." },
        { ja: "ストアクレジットは現金に交換できません。", en: "Store credit cannot be exchanged for cash." },
      ] },
      { kind: "rich", runs: [{ t: { ja: "発送後や作業の開始後など、キャンセルをお受けできない場合があります。詳しくは", en: "Some orders cannot be cancelled, for example once shipped or once a service has started. See the " } }, { t: { ja: "返品・キャンセル・返金ポリシー", en: "Return, Cancellation and Refund Policy" }, href: "/legal/returns" }, { t: { ja: "をご確認ください。", en: "." } }] },
    ],
  },
  {
    id: "returns",
    title: { ja: "返品・交換", en: "Returns and exchanges" },
    blocks: [
      { kind: "p", text: { ja: "お客様のご都合による返品・交換はお受けしておりません。", en: "We do not accept change-of-mind returns or exchanges." } },
      { kind: "p", text: { ja: "お届けした商品の相違・破損、または商品説明との著しい相違があった場合は、商品到着後5日以内に、写真を添えてご連絡ください。状況に応じて、修理、交換、代金の減額、または該当する場合はご返金で対応します。", en: "If a piece arrives incorrect, damaged or materially different from its description, contact us within 5 days of delivery, with photos. Depending on the case, we repair or replace the piece, reduce the price or, where applicable, refund." } },
      { kind: "rich", runs: [{ t: { ja: "手続きの詳細は", en: "The full process is in the " } }, { t: { ja: "返品・キャンセル・返金ポリシー", en: "Return, Cancellation and Refund Policy" }, href: "/legal/returns" }, { t: { ja: "に記載しています。", en: "." } }] },
    ],
  },
  {
    id: "notes",
    title: { ja: "ご注意", en: "Good to know" },
    blocks: [
      { kind: "list", items: [
        { ja: "価格はすべて税込です。", en: "All prices include tax." },
        { ja: "ご注文の確認やお支払いのご案内は、日本時間でお送りします。", en: "Order confirmations and payment deadlines are in Japan time (JST)." },
        { ja: "お問い合わせの受付は平日10:00〜18:00（土日祝日を除く）です。", en: "We answer messages on weekdays, 10:00–18:00 JST (closed weekends and Japanese public holidays)." },
        { ja: "ご家族やご友人へのプレゼントとして、別のお届け先を指定することもできます。", en: "You can send a piece as a gift to a different address." },
      ] },
    ],
  },
];

/** Blocks for this language: layaway blocks only where layaway is offered. */
export function guideBlocksFor(blocks: GuideBlock[], layaway: boolean): GuideBlock[] {
  return blocks.filter((b) => layaway || !("layaway" in b && b.layaway));
}

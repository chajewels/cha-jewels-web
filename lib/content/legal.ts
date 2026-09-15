import type { Lang } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";

export type LegalSection = {
  h: Record<Lang, string>;
  body: Record<Lang, string[]>;
  /** Only shown where layaway is offered — English only (owner decision 2026-09-15). */
  layawayOnly?: true;
};

/**
 * DRAFT — not reviewed by a lawyer. Every page built from this renders the
 * `legal.draft` line visibly so nobody mistakes it for final. Substantive terms
 * (layaway, the 60-minute claim hold, returns) must match /layaway and
 * /legal/tokusho; change them in one place and the others become wrong.
 */
/** Titles for the two bilingual legal pages; the pages carry no literal. */
export const legalTitles: Record<"terms" | "privacy", Record<Lang, string>> = {
  terms: { ja: "利用規約", en: "Terms of sale" },
  privacy: { ja: "プライバシーポリシー", en: "Privacy policy" },
};

/**
 * 特定商取引法に基づく表記 — required by Japanese law for online sales and
 * rendered in Japanese in BOTH languages, because the Japanese is the version
 * the law governs. On EN the page now says so in English and points at
 * /legal/terms and /legal/privacy, rather than leaving an English subtitle over
 * a Japanese body (owner decision 2026-09-16 — see app/legal/tokusho/page.tsx
 * for the reasoning and for how to add a labelled translation if the compliance
 * reviewer wants one). Confirm every line with a JP compliance review before
 * launch.
 *
 * LAYAWAY IS QUALIFIED HERE, NOT REMOVED (owner decision 2026-09-15, option C).
 * Layaway is no longer offered to a visitor reading the site in Japanese, but
 * it remains a payment method the business genuinely offers — on the English
 * site and arranged directly. Deleting the three rows that describe it would
 * under-disclose a real term; leaving them unqualified would advertise in
 * Japanese something the Japanese site refuses. So each mention is marked ※
 * and the final row says who it is for. This is statutory wording: it needs a
 * JP compliance read before launch like every other line on this page.
 *
 * CONTACT ROWS ADDED 2026-09-15 (owner-supplied). 特商法 requires a telephone
 * number and an address for enquiries, and this page carried neither. The
 * numbers came from Cynthia as "03,6657 6129" and "070 8307 3318" and are
 * written here in the conventional Japanese form; the comma was read as a
 * hyphen. If either digit is wrong it is wrong on a statutory page, so check
 * them at the compliance read.
 */
export const tokusho = {
  title: { ja: "特定商取引法に基づく表記", en: "Legal notice (Specified Commercial Transactions Act)" },
  rows: [
    ["販売業者", "株式会社チャジュエルズ（Cha Jewels Co., Ltd.）"],
    ["代表者", "Cynthia Largo"],
    ["所在地", "〒124-0012 東京都葛飾区立石6-5-1 タイムマンション301"],
    ["電話番号", "03-6657-6129（代表）／070-8307-3318（携帯）"],
    ["メールアドレス", "sales@chajewelsjp.com"],
    ["登録番号", "T7011801044120"],
    ["販売価格", "各商品ページに表示（税込）"],
    ["商品代金以外の必要料金", "送料、銀行振込手数料、コンビニ決済手数料"],
    ["支払方法", "クレジットカード、銀行振込、コンビニ決済、分割予約（レイアウェイ）※"],
    ["支払時期", "注文時。分割予約※の場合は契約書記載の期日"],
    ["引渡時期", "入金確認後5営業日以内に発送。分割予約※は完済後"],
    ["返品・交換", "商品到着後7日以内、未使用に限り。オーダー品・サイズ直し品は不可"],
    [
      "※ 分割予約（レイアウェイ）について",
      "分割予約は英語版サイトをご利用のお客様および海外のお客様を対象としたお支払方法で、契約書は英語およびタガログ語でご用意しています。日本語版サイトではお取り扱いしておりません。ご希望の場合は sales@chajewelsjp.com までお問い合わせください。",
    ],
  ] as [string, string][],
};

export const privacySections: LegalSection[] = [
  {
    h: { ja: "事業者", en: "Who we are" },
    body: {
      ja: ["株式会社チャジュエルズ（東京都葛飾区立石）が本サイトを運営し、お客様の個人情報を管理します。お問い合わせ先：sales@chajewelsjp.com"],
      en: ["Cha Jewels Co., Ltd. (株式会社チャジュエルズ), Tateishi, Katsushika-ku, Tokyo, operates this site and controls the personal data described here. Contact: sales@chajewelsjp.com"],
    },
  },
  {
    h: { ja: "取得する情報", en: "What we collect" },
    body: {
      ja: ["お名前、ご連絡先（電話番号・メールアドレス・メッセージアプリのID）", "お届け先住所", "ご注文および分割予約の記録（お支払い状況を含む）", "会員プログラムのポイント残高と履歴", "サイトの利用状況（表示ページ、言語設定）"],
      en: ["Name and contact details (phone, email, messaging handle)", "Delivery address", "Order and layaway records, including payment status", "Loyalty point balance and history", "Site usage — pages viewed and language preference"],
    },
  },
  {
    h: { ja: "利用目的", en: "Why we use it" },
    body: {
      ja: ["ご注文の履行、配送、分割予約のお支払い管理", "お支払期日のご案内および商品に関するご連絡", "ポイントの付与と会員レベルの判定", "法令で求められる記録の保存"],
      en: ["Fulfilling orders, delivering them, and running layaway schedules", "Payment reminders and messages about your pieces", "Awarding points and working out your level", "Keeping the records the law requires us to keep"],
    },
  },
  {
    h: { ja: "第三者への提供", en: "Who else sees it" },
    body: {
      ja: ["配送業者、決済事業者、メッセージ配信事業者に対し、それぞれの業務に必要な範囲でのみ提供します。個人情報を販売することはありません。"],
      en: ["Only our delivery, payment and messaging providers, and only the data each one needs to do its job. We do not sell personal data."],
    },
  },
  {
    h: { ja: "保存期間", en: "How long we keep it" },
    body: {
      ja: ["取引記録は法令に基づき保存します。それ以外の情報は、上記の目的に必要な期間を経過した後に削除します。"],
      en: ["Transaction records are kept for the period the law requires. Everything else is deleted once it is no longer needed for the purposes above."],
    },
  },
  {
    // RESIDENCE, NOT NATIONALITY (reworded 2026-09-16, owner-requested).
    // Naming both laws stays: they are different laws with different
    // obligations, and a generic "we comply with applicable law" gives a
    // customer nothing they can act on. But the test the laws actually apply
    // is WHERE THE PERSON IS. The previous wording said "Japanese customers"
    // and "customers in the Philippines", which reads as nationality and gets
    // a Filipino customer living in Tokyo wrong — APPI covers them. The
    // nationality point is now stated explicitly rather than left to be
    // inferred, because that is the reading that was wrong before.
    // FLAGGED FOR LEGAL REVIEW: this changes what we tell customers about
    // their statutory rights, not a copy edit. Confirm both languages.
    h: { ja: "お客様の権利", en: "Your rights" },
    body: {
      ja: ["ご自身の情報の開示、訂正、削除をご請求いただけます。sales@chajewelsjp.com までご連絡ください。適用される法律は国籍ではなく、お客様の居住地によって決まります。日本にお住まいのお客様には日本の個人情報保護法（APPI）が、フィリピンにお住まいのお客様にはフィリピンのデータプライバシー法（Data Privacy Act of 2012）が適用されます。"],
      en: ["You can ask us for a copy of your data, ask us to correct it, or ask us to delete it — email sales@chajewelsjp.com. Which law applies depends on where you live, not on your nationality: if you live in Japan, Japan’s Act on the Protection of Personal Information (APPI) covers your data; if you live in the Philippines, the Data Privacy Act of 2012 covers it."],
    },
  },
  {
    h: { ja: "Cookie", en: "Cookies" },
    body: {
      ja: ["言語設定とセッションの維持にのみ使用します。広告目的の追跡は行いません。"],
      en: ["Used only to remember your language and keep your session. No advertising trackers."],
    },
  },
];

export const termsSections: LegalSection[] = [
  {
    h: { ja: "価格と通貨", en: "Prices and currency" },
    body: {
      ja: ["表示価格はすべて日本円です。ペソ表示はその日のレートによる参考値であり、お支払いは円建てで確定します。"],
      en: ["All prices are in Japanese yen. Peso figures are indicative at the day's rate; payment is settled in yen."],
    },
  },
  {
    layawayOnly: true,
    h: { ja: "分割予約", en: "Layaway" },
    body: {
      ja: ["商品代金の30%で商品を確保し、残額を3〜6か月（¥300,000以上は最長8か月）の均等払いでお支払いいただきます。金利は0%です。お支払い予定は書面でお渡しします。商品は最終回のお支払い後に発送します。詳細は分割予約のページをご覧ください。"],
      en: ["Pay 30% to reserve the piece, then the balance in equal monthly payments over three to six months — up to eight months for orders of ¥300,000 and above — at 0% interest. You receive the schedule in writing and the piece ships after the final payment. Full details are on the layaway page."],
    },
  },
  {
    h: { ja: "ライブ販売でのご予約", en: "Claims from Live" },
    body: {
      ja: ["ライブ販売でご予約いただいた商品は60分間お取り置きします。会員レベルによる違いはありません。60分を過ぎたご予約は解除され、商品は販売中に戻ります。"],
      en: ["A piece claimed during a live sale is held for 60 minutes. This does not vary by member level. After 60 minutes the claim lapses and the piece returns to sale."],
    },
  },
  {
    h: { ja: "配送と危険負担", en: "Shipping and risk" },
    body: {
      ja: ["商品は東京から保険付きで発送します。危険負担はお客様への引き渡し時に移転します。輸送中の破損・紛失は、配送業者への申し立てとあわせて当店が対応します。"],
      en: ["Pieces ship insured from Tokyo. Risk passes to you on delivery. If something is damaged or lost in transit we handle it with the carrier alongside you."],
    },
  },
  {
    h: { ja: "返品", en: "Returns" },
    body: {
      ja: ["未使用の商品に限り、お受け取りから7日以内に返品をお受けします。特定商取引法に基づく表記に記載の条件と同一です。"],
      en: ["Unused pieces may be returned within seven days of delivery. These are the same conditions as the tokusho notice."],
    },
  },
  {
    h: { ja: "修理と買い取り", en: "Repairs and buy-back" },
    body: {
      ja: ["修理および買い取りは、サイト上に記載の条件で承ります。当店でお求めいただいたK18の商品は、その時点の金相場に基づき書面でお見積りをお出しし、有効期限は7日間です。"],
      en: ["Repairs and buy-back are offered on the terms described elsewhere on this site. For K18 pieces bought from us we quote in writing against the current gold price, valid for seven days."],
    },
  },
  {
    h: { ja: "準拠法と管轄", en: "Governing law" },
    body: {
      ja: ["本規約は日本法に準拠し、紛争が生じた場合は東京地方裁判所を第一審の専属的合意管轄裁判所とします。"],
      en: ["These terms are governed by the law of Japan. The Tokyo District Court has exclusive jurisdiction as the court of first instance."],
    },
  },
];

/**
 * The terms-of-sale sections to show a visitor reading the site in this
 * language. The layaway section states binding terms — 30%, 0%, the schedule —
 * for something a Japanese visitor cannot buy, so it goes with the rest of the
 * offer rather than describing a product the site denies two clicks away.
 *
 * NOTE the deliberate asymmetry with /legal/tokusho, which is NOT filtered:
 * tokusho is a statutory disclosure about the SELLER, rendered in Japanese
 * whatever the toggle says, and still lists 分割予約 as a payment method. That
 * one is flagged for Cynthia rather than changed — see the PR.
 */
export function termsSectionsFor(lang: Lang): LegalSection[] {
  return termsSections.filter((s) => !s.layawayOnly || layawayOffered(lang));
}

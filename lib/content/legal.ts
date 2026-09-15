import type { Lang } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";

/**
 * A numbered legal article with mixed content — paragraphs, sub-lists and blocks
 * where the line breaks carry meaning (an address). The flat
 * `LegalSection` shape below cannot hold any of that, which is why the privacy
 * policy has its own: fourteen articles, several with a lead-in sentence, a
 * bulleted list and closing paragraphs. Rendered by components/site/legal-articles.tsx.
 */
export type LegalBlock =
  | { kind: "p"; text: Record<Lang, string> }
  | { kind: "list"; items: Record<Lang, string[]> }
  | { kind: "lines"; lines: Record<Lang, string[]> };

export type LegalArticle = { n: number; h: Record<Lang, string>; blocks: LegalBlock[] };

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
  privacy: { ja: "プライバシーポリシー", en: "Privacy Policy" },
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
  /**
   * BILINGUAL, AND IT FOLLOWS THE TOGGLE (owner decision 2026-09-16).
   *
   * Earlier this page was Japanese in both languages. First with a bare English
   * subtitle over a Japanese body, then — my call, now overruled — with an
   * English notice explaining why it was not translated. Neither was what the
   * toggle promises. EN means English, on this page like every other.
   *
   * Do NOT add a notice, banner or disclaimer of any kind back to this page.
   *
   * WHAT IS NEVER TRANSLATED: proper nouns and identifiers. The registered
   * company name, the representative, the invoice registration number, the
   * email address and both phone numbers are the same characters in both
   * columns, because they identify rather than describe. The address is written
   * naturally in English in the order Japan Post accepts from abroad — building
   * and room first, then block, ward, city, postal code, country.
   *
   * The Japanese column is untouched by this change; compare against git if you
   * need to be sure.
   *
   * Still pending a JP compliance review, as the page has always said. Two
   * things to put in front of it: the English wording below, which is a
   * statutory disclosure rendered in a second language and therefore carries
   * the risk that the two columns say different things; and the two phone
   * numbers, which came in as "03,6657 6129" and "070 8307 3318" and have not
   * been confirmed digit by digit.
   */
  rows: [
    {
      k: { ja: "販売業者", en: "Seller" },
      v: { ja: "株式会社チャジュエルズ（Cha Jewels Co., Ltd.）", en: "Cha Jewels Co., Ltd. (株式会社チャジュエルズ)" },
    },
    {
      k: { ja: "代表者", en: "Representative" },
      v: { ja: "Cynthia Largo", en: "Cynthia Largo" },
    },
    {
      k: { ja: "所在地", en: "Address" },
      v: {
        ja: "〒124-0012 東京都葛飾区立石6-5-1 タイムマンション301",
        en: "Time Mansion 301, 6-5-1 Tateishi, Katsushika-ku, Tokyo 124-0012, Japan",
      },
    },
    {
      k: { ja: "電話番号", en: "Telephone" },
      v: { ja: "03-6657-6129（代表）／070-8307-3318（携帯）", en: "03-6657-6129 (office) / 070-8307-3318 (mobile)" },
    },
    {
      k: { ja: "メールアドレス", en: "Email" },
      v: { ja: "sales@chajewelsjp.com", en: "sales@chajewelsjp.com" },
    },
    {
      k: { ja: "登録番号", en: "Invoice registration number" },
      v: { ja: "T7011801044120", en: "T7011801044120" },
    },
    {
      k: { ja: "販売価格", en: "Price" },
      v: { ja: "各商品ページに表示（税込）", en: "Shown on each product page, tax included" },
    },
    {
      k: { ja: "商品代金以外の必要料金", en: "Charges besides the price" },
      v: {
        ja: "送料、銀行振込手数料、コンビニ決済手数料",
        en: "Shipping, bank transfer fees, and convenience-store payment fees",
      },
    },
    {
      k: { ja: "支払方法", en: "Payment methods" },
      v: {
        ja: "クレジットカード、銀行振込、コンビニ決済、分割予約（レイアウェイ）※",
        en: "Credit card, bank transfer, convenience-store payment, and layaway※",
      },
    },
    {
      k: { ja: "支払時期", en: "When payment is due" },
      v: {
        ja: "注文時。分割予約※の場合は契約書記載の期日",
        en: "At the time of order. For layaway※, on the dates set out in your agreement",
      },
    },
    {
      k: { ja: "引渡時期", en: "When we deliver" },
      v: {
        ja: "入金確認後5営業日以内に発送。分割予約※は完済後",
        en: "Dispatched within five business days of payment clearing. Layaway※ ships after the final payment",
      },
    },
    {
      k: { ja: "返品・交換", en: "Returns and exchanges" },
      v: {
        ja: "商品到着後7日以内、未使用に限り。オーダー品・サイズ直し品は不可",
        en: "Within seven days of delivery and unused only. Made-to-order pieces and pieces resized for you cannot be returned",
      },
    },
    {
      k: { ja: "※ 分割予約（レイアウェイ）について", en: "※ About layaway" },
      v: {
        ja: "分割予約は英語版サイトをご利用のお客様および海外のお客様を対象としたお支払方法で、契約書は英語およびタガログ語でご用意しています。日本語版サイトではお取り扱いしておりません。ご希望の場合は sales@chajewelsjp.com までお問い合わせください。",
        en: "Layaway is a payment method for customers using the English site and customers overseas, and the agreement is provided in English and Tagalog. It is not offered on the Japanese site. To ask about it, email sales@chajewelsjp.com.",
      },
    },
  ] as { k: Record<Lang, string>; v: Record<Lang, string> }[],
};

export const privacyUpdated: Record<Lang, string> = {
  ja: "最終更新：2026年9月15日",
  en: "Last updated: September 15, 2026",
};

/**
 * The final privacy policy, verbatim from Cynthia (2026-09-16) with the
 * representative's name filled in. Fourteen numbered articles. It replaces a
 * much shorter draft; `privacySections` is gone with it.
 *
 * ONE EDIT to the supplied English, owner-instructed. Article 7 read "We may
 * also collect limited website-usage information to understand traffic and
 * improve the website", which understates what has run in production since
 * 2026-09-15. It now names Vercel Web Analytics and says what it records. The
 * surrounding sentences are as written.
 *
 * THE JAPANESE IS A TRANSLATION BY CLAUDE AND HAS NOT HAD A NATIVE READ. It
 * follows the register of the other Japanese legal pages (polite form, 当社 /
 * お客様), but this is a legal document: a native reader must check it before
 * this page is treated as final. Flagged in the PR.
 *
 * NOTE THE COMPANY NAME. Article 1 and article 14 say "Cha Jewels株式会社",
 * as confirmed by Cynthia. /legal/tokusho says 株式会社チャジュエルズ. Two legal
 * pages, two different names — left as they are, deliberately, for Cynthia to
 * resolve against the registration certificate. Do not silently align them.
 */
export const privacyArticles: LegalArticle[] = [
  {
    n: 1,
    h: { ja: "当社について", en: "Who We Are" },
    blocks: [
      { kind: "p", text: { ja: "Cha Jewels Co., Ltd.（Cha Jewels株式会社。以下「Cha Jewels」または「当社」といいます）は、本ウェブサイトを運営し、本プライバシーポリシーに記載する個人情報について責任を負います。", en: "Cha Jewels Co., Ltd. (Cha Jewels株式会社, “Cha Jewels,” “we,” “us,” or “our”) operates this website and is responsible for the personal information described in this Privacy Policy." } },
      {
        kind: "lines",
        lines: { ja: ["登記上の所在地：", "〒124-0012", "東京都葛飾区立石6-5-1", "タイムマンション301"], en: ["Registered address:", "Time Mansion 301", "6-5-1 Tateishi, Katsushika-ku", "Tokyo 124-0012, Japan"] },
      },
      {
        kind: "lines",
        lines: { ja: ["代表取締役：Cynthia Nera Largo", "メールアドレス：sales@chajewelsjp.com"], en: ["Representative Director: Cynthia Nera Largo", "Email: sales@chajewelsjp.com"] },
      },
      { kind: "p", text: { ja: "本プライバシーポリシーは、当社のウェブサイト、オンラインショップ、お客様アカウントおよびお客様ポータル、分割予約（レイアウェイ）サービス、会員プログラム、お問い合わせ対応、メッセージ機能、ならびにライブ販売によるご注文に適用されます。", en: "This Privacy Policy applies to our website, online shop, customer accounts and portal, layaway services, loyalty program, customer inquiries, messaging channels, and orders placed through our live-selling activities." } },
    ],
  },
  {
    n: 2,
    h: { ja: "当社が取得する個人情報", en: "Personal Information We Collect" },
    blocks: [
      { kind: "p", text: { ja: "お客様と当社との関わり方に応じて、当社は次の情報を取得することがあります。", en: "Depending on how you interact with Cha Jewels, we may collect:" } },
      {
        kind: "list",
        items: {
          ja: [
            "お名前、電話番号、メールアドレス、お届け先住所、請求に関する情報、国、メッセージアプリまたはソーシャルメディアのアカウント名。",
            "アカウント情報、ログイン情報、言語設定、および連絡方法に関するご希望。",
            "ご注文に関する情報（ご購入またはご予約いただいた商品、注文番号、配送および追跡に関する情報、返品、返金、ならびにサイズ直し、研磨、鑑定、修理などのご依頼内容を含みます）。",
            "分割予約に関する情報（お支払い予定、お支払済みの金額、残高、お支払期日のご案内、完済の状況を含みます）。",
            "お支払いに関する情報（お支払方法、金額、取引番号、入金の状況、入金証明など）。お支払いを第三者の決済事業者が取り扱う場合、当社は原則としてカード情報の全体を受領または保管いたしません。",
            "会員プログラムに関する情報（ポイント残高、ポイント履歴、会員レベル、ご利用いただいた特典を含みます）。",
            "当社とのやりとり（メール、メッセージ、お問い合わせ、苦情、レビュー、カスタマーサポートの記録を含みます）。",
            "お客様がご提供を選択された情報（指輪やブレスレットのサイズ、写真、お客様の声、その他ご注文に関する内容を含みます）。",
            "技術情報および利用状況に関する情報（IPアドレス、ブラウザおよび端末の種類、オペレーティングシステム、おおよその国または地域、参照元ページ、閲覧されたページ、アクセス日時、言語の選択、セッション情報、セキュリティログを含みます）。",
            "マーケティングに関するご意向（販促メッセージの受信に同意いただいているかどうかを含みます）。",
          ],
          en: [
            "Your name, telephone number, email address, delivery address, billing information, country, and messaging or social-media handle.",
            "Account details, login information, language preference, and communication preferences.",
            "Order information, including purchased or reserved items, order references, delivery and tracking details, returns, refunds, and requested services such as resizing, polishing, certification, or repair.",
            "Layaway information, including the payment schedule, amounts paid, outstanding balance, payment reminders, and completion status.",
            "Payment information, such as the payment method, amount, transaction reference, payment status, and proof of payment. When payments are handled by a third-party payment provider, we generally do not receive or store your complete card credentials.",
            "Loyalty-program information, including your points balance, points history, membership level, and rewards used.",
            "Communications with us, including emails, messages, inquiries, complaints, reviews, and customer-support records.",
            "Information you choose to submit, including ring or bracelet sizes, photographs, testimonials, or other order-related details.",
            "Technical and usage information, including your IP address, browser and device type, operating system, approximate country or region, referring page, pages viewed, access times, language selection, session information, and security logs.",
            "Marketing preferences, including whether you have agreed to receive promotional messages.",
          ],
        },
      },
      { kind: "p", text: { ja: "贈り先の方など第三者に関する情報をご提供いただく場合は、当該情報を当社に提供することについて、その方の許諾を得ている必要があります。", en: "If you provide information about another person, such as the recipient of a gift, you must have permission to provide that information to us." } },
      { kind: "p", text: { ja: "当社は、必要かつ法令上認められる場合を除き、要配慮個人情報を意図的に求めることはありません。健康に関する情報、公的な識別番号その他の機微な情報については、当社が正当な理由に基づき特に求めた場合を除き、お送りにならないでください。", en: "We do not intentionally request sensitive personal information unless it is necessary and permitted by law. Please do not send health information, government identification numbers, or other sensitive information unless we specifically request it for a lawful reason." } },
    ],
  },
  {
    n: 3,
    h: { ja: "情報の取得方法", en: "How We Collect Information" },
    blocks: [
      { kind: "p", text: { ja: "当社は、次の方法で情報を取得します。", en: "We collect information:" } },
      {
        kind: "list",
        items: {
          ja: [
            "お客様が、アカウントの作成、ご注文またはご予約、分割予約のご利用、お支払い、お問い合わせ、会員プログラムへのご入会をされる際に、お客様から直接。",
            "お客様が本ウェブサイトをご利用になる際に、自動的に。",
            "お客様のお取引の処理に必要な場合、またはお客様が情報の提供を許諾された場合に、決済事業者、配送会社、メッセージプラットフォーム、ソーシャルメディアサービスその他の委託先から。",
          ],
          en: [
            "Directly from you when you create an account, place or reserve an order, use layaway, make a payment, contact us, or join our loyalty program.",
            "Automatically when you use our website.",
            "From payment providers, delivery companies, messaging platforms, social-media services, or other service providers when necessary to process your transaction or when you authorize them to provide the information.",
          ],
        },
      },
    ],
  },
  {
    n: 4,
    h: { ja: "個人情報の利用目的", en: "How We Use Your Information" },
    blocks: [
      { kind: "p", text: { ja: "当社は、個人情報を次の目的で利用します。", en: "We use personal information to:" } },
      {
        kind: "list",
        items: {
          ja: [
            "ご注文の作成、管理および履行。",
            "ジュエリーのお取り置き、および分割予約のお支払い予定の管理。",
            "お支払いの確認、および正確なお支払い記録の保持。",
            "ご注文の配送、および追跡情報のご提供。",
            "サイズ直し、研磨、鑑定、修理などのご依頼への対応。",
            "お客様アカウント、ポイント、会員レベルおよび特典の管理。",
            "ご注文状況のお知らせ、お支払期日のご案内、サービスに関する通知その他のお取引に関するご連絡。",
            "ご質問、苦情、返品およびカスタマーサポートへのご依頼への対応。",
            "不正行為、無断の取引、不適切な利用およびセキュリティ上の事故の防止。",
            "本ウェブサイトおよびサービスの運営、保護、障害対応および改善。",
            "ウェブサイトの一般的な利用状況およびお客様のご嗜好の把握。",
            "法令上求められる会計、税務、取引および事業に関する記録の保持。",
            "法的な請求の主張、行使または防御。",
            "お客様の同意がある場合、またはその他法令上認められる場合における、販促メッセージやご案内の送信。販促メッセージの受信は、いつでも停止いただけます。",
          ],
          en: [
            "Create, manage, and fulfil orders.",
            "Reserve jewelry and administer layaway schedules.",
            "Validate payments and maintain accurate payment records.",
            "Deliver orders and provide tracking information.",
            "Provide requested services such as resizing, polishing, certification, or repairs.",
            "Manage customer accounts, loyalty points, membership levels, and rewards.",
            "Send order updates, payment reminders, service notices, and other transactional messages.",
            "Respond to questions, complaints, returns, and customer-support requests.",
            "Prevent fraud, unauthorized transactions, misuse, and security incidents.",
            "Operate, protect, troubleshoot, and improve our website and services.",
            "Understand general website usage and customer preferences.",
            "Maintain accounting, tax, transaction, and business records required by law.",
            "Establish, exercise, or defend legal claims.",
            "Send promotional messages or offers when you have consented or when otherwise permitted by law. You may opt out of promotional messages at any time.",
          ],
        },
      },
      { kind: "p", text: { ja: "適用される法令が取扱いの法的根拠を求める場合、当社は、お客様との契約の履行に必要な範囲、法令上の義務の遵守、正当な事業上および安全上の利益の追求、またはお客様の同意に基づいて情報を取り扱います。", en: "Where applicable law requires a legal basis, we process information as necessary to perform a contract with you, comply with legal obligations, pursue legitimate business and security interests, or based on your consent." } },
      { kind: "p", text: { ja: "当社は、必要な場合に通知を行うことなく、または同意を得ることなく、実質的に異なる目的で個人情報を利用することはありません。", en: "We do not use personal information for materially different purposes without providing notice or obtaining consent when required." } },
    ],
  },
  {
    n: 5,
    h: { ja: "情報の提供先", en: "When We Share Information" },
    blocks: [
      { kind: "p", text: { ja: "当社は、事業の運営を支援する委託先に対し、限定された範囲で個人情報を提供することがあります。提供先には次のものが含まれます。", en: "We may provide limited personal information to service providers that help us operate our business, including:" } },
      {
        kind: "list",
        items: {
          ja: [
            "決済代行事業者および金融サービス事業者。",
            "配送会社、郵便事業者、通関業者および物流事業者。",
            "ウェブサイトのホスティング、クラウドストレージ、データベースおよび技術支援の提供事業者。",
            "メール、メッセージ、カスタマーサポートおよび通知の提供事業者。",
            "アクセス解析、セキュリティおよび不正防止の提供事業者。",
            "会計士、弁護士、保険会社その他の専門家。",
          ],
          en: [
            "Payment processors and financial-service providers.",
            "Delivery companies, postal services, customs brokers, and fulfilment providers.",
            "Website hosting, cloud storage, database, and technical-support providers.",
            "Email, messaging, customer-support, and notification providers.",
            "Analytics, security, and fraud-prevention providers.",
            "Accountants, lawyers, insurers, and other professional advisers.",
          ],
        },
      },
      { kind: "p", text: { ja: "各委託先は、その業務の遂行に合理的に必要な情報のみを受領します。当社は、当社に代わって個人情報を取り扱う委託先に対し、適切な保護を求めています。", en: "Each provider receives only the information reasonably necessary to perform its services. We require providers handling personal information on our behalf to protect it appropriately." } },
      { kind: "p", text: { ja: "当社は、次の場合にも情報を開示することがあります。", en: "We may also disclose information:" } },
      {
        kind: "list",
        items: {
          ja: [
            "法令、裁判所の命令、税関、税務当局、規制当局その他の権限を有する公的機関から求められる場合。",
            "お客様、当社または第三者を不正行為、セキュリティ上の脅威または被害から保護するために合理的に必要な場合。",
            "合併、資金調達、組織再編、事業の全部または一部の譲渡に関連する場合（適切な秘密保持および個人情報の保護の措置を前提とします）。",
            "お客様の同意がある場合、またはお客様のご指示による場合。",
          ],
          en: [
            "When required by law, court order, customs authorities, tax authorities, regulators, or another authorized public authority.",
            "When reasonably necessary to protect our customers, our business, or another person from fraud, security threats, or harm.",
            "In connection with a merger, financing, restructuring, sale, or transfer of all or part of our business, subject to appropriate confidentiality and privacy protections.",
            "With your consent or at your direction.",
          ],
        },
      },
      { kind: "p", text: { ja: "当社は、個人情報を販売または貸与することはありません。また、サイトをまたぐ行動ターゲティング広告のために個人情報を開示することはありません。", en: "We do not sell or rent personal information. We do not disclose personal information for cross-site behavioral advertising." } },
    ],
  },
  {
    n: 6,
    h: { ja: "国外での取扱いおよび移転", en: "International Processing and Transfers" },
    blocks: [
      { kind: "p", text: { ja: "Cha Jewelsは日本に所在し、日本、フィリピンその他の国のお客様にサービスを提供しています。配送、決済、ホスティング、メッセージまたは技術に関する委託先の一部は、日本国外で情報を取り扱う場合があります。", en: "Cha Jewels is based in Japan and serves customers in Japan, the Philippines, and other countries. Some delivery, payment, hosting, messaging, or technology providers may process information outside Japan." } },
      { kind: "p", text: { ja: "個人情報を国外に移転する場合、当社は、適用される法令に従い、お客様の同意、契約による保護措置、適切な安全管理措置を講じている委託先の利用、その他法令上認められる移転の仕組みを用います。", en: "When personal information is transferred internationally, we use consent, contractual protections, providers maintaining appropriate safeguards, or another legally permitted transfer mechanism, as required by applicable law." } },
      { kind: "p", text: { ja: "移転先の国・地域および安全管理措置に関する詳細については、当社までお問い合わせください。", en: "You may contact us for additional information about relevant transfer destinations and safeguards." } },
    ],
  },
  {
    n: 7,
    h: { ja: "Cookie、ローカルストレージおよびアクセス解析", en: "Cookies, Local Storage, and Analytics" },
    blocks: [
      { kind: "p", text: { ja: "当社は、次の目的に必要な範囲で、Cookieまたは類似のブラウザ内保存の仕組みを使用します。", en: "We use cookies or similar browser storage when necessary to:" } },
      {
        kind: "list",
        items: {
          ja: [
            "セッションの安全性の確保。",
            "言語設定その他のご希望の保存。",
            "ショッピングセッションまたはお客様アカウントの維持。",
            "不正行為および不適切な利用からのウェブサイトの保護。",
          ],
          en: [
            "Keep your session secure.",
            "Remember your language and other preferences.",
            "Maintain your shopping session or customer account.",
            "Protect the website against fraud and misuse.",
          ],
        },
      },
      { kind: "p", text: { ja: "当社は、アクセス状況の把握およびウェブサイトの改善のため、Vercel Web Analyticsを使用しています。これはCookieを使用しない仕組みで、ページの閲覧に加え、商品の閲覧およびカートへの追加という2種類の商品に関する操作を、その商品のSKUおよびお客様がご覧になっている言語とともに記録します。本ポリシーの日付時点において、当社は広告目的のCookieおよびサイトをまたぐ行動ターゲティング広告のトラッカーを使用していません。", en: "We use Vercel Web Analytics to understand traffic and improve the website. It is cookieless, and it records page views together with two product events — viewing a product and adding one to the cart — each with the item’s SKU and the language you are reading in. As of the date of this policy, we do not use advertising cookies or cross-site behavioral advertising trackers." } },
      { kind: "p", text: { ja: "Cookieはブラウザの設定で管理いただけます。必要なCookieを無効にされた場合、ウェブサイト、お客様ポータルまたはお支払い手続きの一部が正しく動作しないことがあります。", en: "You can control cookies through your browser settings. Disabling necessary cookies may prevent parts of the website, customer portal, or checkout process from working correctly." } },
      { kind: "p", text: { ja: "将来、任意のアクセス解析技術または広告技術を導入する場合には、本ポリシーを更新し、必要な場合には同意を取得します。", en: "If we introduce optional analytics or advertising technologies in the future, we will update this policy and obtain consent where required." } },
    ],
  },
  {
    n: 8,
    h: { ja: "保存期間", en: "How Long We Keep Information" },
    blocks: [
      { kind: "p", text: { ja: "当社は、本ポリシーに記載する目的（お取引の完了、カスタマーサービスの提供、紛争の解決および法令上の義務の履行を含みます）のために合理的に必要な期間に限り、個人情報を保存します。", en: "We retain personal information only for as long as reasonably necessary for the purposes described in this policy, including completing transactions, providing customer service, resolving disputes, and meeting legal obligations." } },
      { kind: "p", text: { ja: "当社の一般的な保存期間は次のとおりです。", en: "Our general retention periods are:" } },
      {
        kind: "list",
        items: {
          ja: [
            "ご注文、お支払い、分割予約、税務および会計に関する記録：適用される税法、会計法および商法上求められる期間（一般に7年から10年）。",
            "お客様アカウントおよび会員に関する記録：アカウントまたはお取引関係が継続している期間、およびその後、ポイントへの対応、紛争の解決または法令上の義務の履行に必要な期間。",
            "お問い合わせおよびサポートに関する記録：通常、お問い合わせの解決後3年まで（より長い期間が合理的に必要な場合を除きます）。",
            "ウェブサイトおよびセキュリティのログ：通常12か月まで（不正行為、不適切な利用またはセキュリティ上の事故の調査に必要な場合を除きます）。",
            "マーケティングに関する同意および受信停止の記録：お客様の連絡に関するご希望を尊重し、記録するために必要な期間。",
          ],
          en: [
            "Order, payment, layaway, tax, and accounting records: For the period required under applicable tax, accounting, and commercial laws, generally between seven and ten years.",
            "Customer account and loyalty records: While the account or customer relationship remains active and afterward for as long as necessary to honour points, resolve disputes, or comply with legal obligations.",
            "Customer inquiries and support records: Normally up to three years after the inquiry has been resolved, unless a longer period is reasonably necessary.",
            "Website and security logs: Normally up to twelve months, unless needed to investigate fraud, misuse, or a security incident.",
            "Marketing consent and opt-out records: For as long as needed to respect and document your communication preferences.",
          ],
        },
      },
      { kind: "p", text: { ja: "情報が不要となった場合、当社は安全な方法でこれを削除または匿名化します。バックアップに含まれる情報は、通常の保存サイクルにおいてバックアップが上書きされるまで残存する場合があります。", en: "When information is no longer required, we delete or anonymize it securely. Information contained in backups may remain until the backup is overwritten through our normal retention cycle." } },
    ],
  },
  {
    n: 9,
    h: { ja: "安全管理措置", en: "How We Protect Information" },
    blocks: [
      { kind: "p", text: { ja: "当社は、個人情報への不正なアクセス、開示、改変、滅失、不適切な利用または破壊を防ぐことを目的として、合理的かつ適切な組織的および技術的な安全管理措置を講じています。", en: "We use reasonable and appropriate organizational and technical safeguards designed to prevent unauthorized access, disclosure, alteration, loss, misuse, or destruction of personal information." } },
      { kind: "p", text: { ja: "これらの措置には、アクセスの制限、安全な通信、アカウントの管理、従業者の監督、委託先の監督、バックアップ、およびデータに関する事故が疑われる場合の対応手順が含まれることがあります。", en: "These measures may include access restrictions, secure transmission, account controls, staff supervision, service-provider oversight, backups, and procedures for responding to suspected data incidents." } },
      { kind: "p", text: { ja: "オンラインのシステムに完全な安全性はありません。適用される法令に基づく通知が必要となるデータに関する事故が発生した場合、当社は、法令の定めに従い、所轄の当局および影響を受ける方々に通知します。", en: "No online system is completely secure. If a data incident occurs that requires notification under applicable law, we will notify the appropriate authority and affected individuals as required." } },
    ],
  },
  {
    n: 10,
    h: { ja: "お客様の権利", en: "Your Privacy Rights" },
    blocks: [
      { kind: "p", text: { ja: "適用される法令の範囲内で、お客様は当社に対し、次の事項を求めることができます。", en: "Subject to applicable law, you may ask us to:" } },
      {
        kind: "list",
        items: {
          ja: [
            "当社がお客様の個人情報を保有しているかどうかの確認。",
            "情報の利用方法の説明。",
            "情報へのアクセスまたはその写しの提供。",
            "第三者への個人データの提供に関する一定の記録の開示。",
            "不正確な情報の訂正、追加または更新。",
            "一定の情報の利用の停止、削除または制限。",
            "第三者への情報提供の停止。",
            "同意に基づく取扱いについての、同意の撤回。",
            "販促に関するご連絡の停止。",
            "該当する場合における、持ち運び可能な形式での情報の提供。",
          ],
          en: [
            "Confirm whether we hold personal information about you.",
            "Explain how your information is used.",
            "Provide access to or a copy of your information.",
            "Disclose certain records concerning the provision of your personal data to third parties.",
            "Correct, complete, or update inaccurate information.",
            "Stop using, delete, or restrict certain information.",
            "Stop providing your information to third parties.",
            "Withdraw consent where processing is based on consent.",
            "Stop receiving promotional communications.",
            "Provide your information in a portable format, where applicable.",
          ],
        },
      },
      { kind: "p", text: { ja: "当社は、お住まいの地域にかかわらず、すべてのお客様からの個人情報に関するご請求を受け付けます。ただし、個別の権利の内容および法令上の要件は、お住まいの地域によって異なる場合があります。", en: "We accept privacy requests from all customers regardless of location. However, particular rights and legal requirements may differ depending on where you live." } },
      { kind: "p", text: { ja: "一部のご請求には法令上の制限があります。たとえば、削除のご請求を受けた場合であっても、法令により保存が求められ、または認められている取引、お支払い、税務、不正防止もしくは紛争に関する記録については、これを保存することがあります。", en: "Some requests are subject to legal limitations. For example, we may retain transaction, payment, tax, fraud-prevention, or dispute records even after receiving a deletion request when retention is required or permitted by law." } },
      { kind: "p", text: { ja: "ご請求は sales@chajewelsjp.com までメールでお送りください。ご請求の内容と対象となる情報をお知らせください。当社は、お客様ご本人であることの確認、または代理人の権限の確認に必要な情報のご提供をお願いすることがあります。", en: "To submit a request, email sales@chajewelsjp.com. Please describe your request and the information concerned. We may request information necessary to verify your identity or the authority of a person acting on your behalf." } },
      { kind: "p", text: { ja: "当社は、適用される法令に定める期間内に回答します。ご請求の全部または一部にお応えできない場合、適切な場合にはその理由をご説明します。", en: "We will respond within the period required by applicable law. If we cannot fulfil all or part of a request, we will explain the reason when appropriate." } },
    ],
  },
  {
    n: 11,
    h: { ja: "お子様の個人情報", en: "Children’s Privacy" },
    blocks: [
      { kind: "p", text: { ja: "当社のウェブサイトおよびサービスは、18歳未満のお子様を対象としていません。当社は、親権者または法定代理人の同意なく、お子様から個人情報を故意に取得することはありません。", en: "Our website and services are not directed to children under 18. We do not knowingly collect personal information from children without authorization from a parent or legal guardian." } },
      { kind: "p", text: { ja: "適切な同意なくお子様が当社に情報をご提供されたと思われる場合は、当社までご連絡ください。内容を確認し、適切な場合には削除いたします。", en: "If you believe a child has provided information to us without appropriate authorization, please contact us so that we can review and, where appropriate, delete it." } },
    ],
  },
  {
    n: 12,
    h: { ja: "第三者のウェブサイトおよびプラットフォーム", en: "Third-Party Websites and Platforms" },
    blocks: [
      { kind: "p", text: { ja: "当社のウェブサイトまたはメッセージには、第三者のウェブサイト、ソーシャルメディア、決済サービスまたはメッセージアプリへのリンクが含まれることがあります。これらにおける個人情報の取扱いは、本ポリシーではなく、それぞれのプライバシーポリシーに従います。", en: "Our website or messages may contain links to third-party websites, social-media platforms, payment services, or messaging applications. Their handling of personal information is governed by their own privacy policies, not this policy." } },
      { kind: "p", text: { ja: "第三者のサービスを通じて個人情報をご提供される前に、当該ポリシーをご確認いただくことをお勧めします。", en: "We encourage you to review those policies before providing personal information through a third-party service." } },
    ],
  },
  {
    n: 13,
    h: { ja: "本ポリシーの変更", en: "Changes to This Policy" },
    blocks: [
      { kind: "p", text: { ja: "当社は、サービス、技術、委託先または法令上の義務の変更に応じて、本プライバシーポリシーを更新することがあります。", en: "We may update this Privacy Policy when our services, technology, providers, or legal obligations change." } },
      { kind: "p", text: { ja: "改定後のポリシーは、新しい「最終更新」の日付とともに本ページに掲載します。個人情報の利用方法に実質的な影響を与える変更を行う場合には、法令上求められるときは、追加の通知を行い、または同意を取得します。", en: "The revised policy will be posted on this page with a new “Last updated” date. If a change materially affects how we use personal information, we will provide additional notice or obtain consent when required by law." } },
    ],
  },
  {
    n: 14,
    h: { ja: "お問い合わせおよび苦情", en: "Contact and Complaints" },
    blocks: [
      { kind: "p", text: { ja: "個人情報に関するご質問、ご請求または苦情は、次の連絡先までお願いします。", en: "For privacy questions, requests, or complaints, contact:" } },
      {
        kind: "lines",
        lines: { ja: ["Cha Jewels株式会社", "〒124-0012", "東京都葛飾区立石6-5-1", "タイムマンション301"], en: ["Cha Jewels株式会社", "Time Mansion 301", "6-5-1 Tateishi, Katsushika-ku", "Tokyo 124-0012, Japan"] },
      },
      { kind: "p", text: { ja: "メールアドレス：sales@chajewelsjp.com", en: "Email: sales@chajewelsjp.com" } },
      { kind: "p", text: { ja: "当社は、個人情報に関する苦情を確認し、合理的に可能な限り速やかに回答します。また、個人情報保護委員会（日本）その他お住まいの地域の所轄の監督機関にご連絡いただくこともできます。", en: "We will review privacy complaints and respond as promptly as reasonably possible. You may also contact the Personal Information Protection Commission of Japan or another competent privacy regulator where you live." } },
    ],
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

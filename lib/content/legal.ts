import type { Lang } from "@/lib/i18n";

/**
 * A numbered legal article with mixed content — paragraphs, sub-lists and blocks
 * where the line breaks carry meaning (an address). The flat
 * `LegalSection` shape below cannot hold any of that, which is why the privacy
 * policy has its own: fourteen articles, several with a lead-in sentence, a
 * bulleted list and closing paragraphs. Rendered by components/site/legal-articles.tsx.
 */
export type LegalBlock =
  | { kind: "p"; text: Record<Lang, string> }
  | { kind: "h"; text: Record<Lang, string> }
  | { kind: "list"; items: Record<Lang, string[]> }
  | { kind: "lines"; lines: Record<Lang, string[]> }
  | { kind: "rich"; runs: Record<Lang, LegalRun[]> };

/**
 * A stretch of a paragraph, optionally a link. The runs are PER LANGUAGE rather
 * than one array of translated fragments, because Japanese and English do not
 * put the linked phrase in the same place in the sentence — "form part of these
 * Terms" ends the English clause and 本規約の一部を構成します ends the Japanese
 * one, with the two policy names before it in a different order.
 *
 * Only for a link inside prose. A paragraph with no link stays `kind: "p"`.
 */
export type LegalRun = { t: string; href?: string };

/**
 * `n` is optional: an article without one renders its heading unnumbered, which
 * is what a summary block ahead of section 1 needs. `h` is a sub-heading inside
 * an article ("Available resolutions", "Step 1: Prepare the information").
 */
export type LegalArticle = { n?: number; h: Record<Lang, string>; blocks: LegalBlock[] };

/**
 * THE REGISTERED COMPANY NAME, ONE STRING, ONE PLACE.
 *
 * Owner-confirmed 2026-09-16. Ｃｈａ and Ｊｅｗｅｌｓ are FULLWIDTH Latin
 * (U+FF23 …) separated by an IDEOGRAPHIC SPACE (U+3000), not ASCII — a normal
 * Japanese corporate-registration convention. Do NOT normalise it to
 * "Cha Jewels株式会社": that is a different string and it is the wrong one.
 *
 * It is a constant because the alternative already failed. Before this, tokusho
 * said 株式会社チャジュエルズ and the privacy policy said Cha Jewels株式会社 —
 * two legal pages, two names, discovered only when someone read both (PR #36).
 * Three documents now interpolate this, so they cannot drift again.
 *
 * STILL TO BE CONFIRMED against the registration certificate before the
 * compliance review signs these pages off.
 */
export const COMPANY_NAME = "\uFF23\uFF48\uFF41\u3000\uFF2A\uFF45\uFF57\uFF45\uFF4C\uFF53\u682A\u5F0F\u4F1A\u793E";

/**
 * RETURN, CANCELLATION AND REFUND POLICY — owner-supplied text, 2026-09-15.
 *
 * The English is Cynthia's, verbatim. The Japanese is MY TRANSLATION and is a
 * DRAFT: it needs a native read before merge. It is written in the same 敬体
 * register as the privacy policy and the terms of sale so the three read as one
 * set, and it borrows their settled renderings (ストアクレジット, プレラブド,
 * 分割予約) rather than inventing new ones.
 *
 * IT CONTRADICTS /legal/tokusho AND /legal/terms ON RETURNS, and deliberately
 * so — the contradictions are reported to Cynthia in the PR rather than
 * resolved here. In short: both of those pages grant an unconditional 7-day
 * unused-return right, and this policy says change-of-mind returns are not
 * normally accepted. A statutory disclosure disagreeing with the policy it
 * discloses is hers to decide, not mine to reconcile. Do not silently align any
 * of the three; whichever way she rules, all three change together.
 */
export const returnsTitle: Record<Lang, string> = {
  ja: "返品・キャンセル・返金ポリシー",
  en: "Return, Cancellation and Refund Policy",
};

export const returnsUpdated: Record<Lang, string> = {
  ja: "最終更新日：2026年9月15日",
  en: "Last updated: September 15, 2026",
};

/** Blocks before article 1 — the company line and the two scope paragraphs. */
export const returnsIntro: LegalBlock[] = [
  { kind: "lines", lines: { ja: [`Cha Jewels Co., Ltd.（${COMPANY_NAME}）`], en: [`Cha Jewels Co., Ltd. (${COMPANY_NAME})`] } },
  { kind: "p", text: { ja: "Cha Jewelsは、お客様からの信頼を大切にしており、ご注文の前にお取引の条件をご理解いただきたいと考えております。", en: "At Cha Jewels, we value our customers’ trust and want every customer to understand the conditions of purchase before placing an order." } },
  { kind: "p", text: { ja: "本ポリシーは、当社のウェブサイト、ライブ販売、および公式メッセージ窓口を通じた小売のご購入に適用されます。卸売および事業者間のお取引については、別途の書面による条件が適用される場合があります。", en: "This policy applies to retail purchases made through our website, live-selling activities, and official messaging channels. Wholesale and business-to-business transactions may be governed by separate written terms." } },
];

export const returnsArticles: LegalArticle[] = [
  {
    h: { ja: "重要事項の要約", en: "Important Summary" },
    blocks: [
      { kind: "list", items: { ja: ["お客様のご都合による返品および現金でのご返金は、原則としてお受けしておりません。", "お客様のお申し出によるキャンセルをお受けする場合、原則としてストアクレジットでの対応となります。", "商品に誤り、到着時の破損、または商品説明との重大な相違がある場合、お客様は法令に基づき、修理、交換、代金の減額または返金を求めることができる場合があります。", "法令により金銭でのご返金が必要となる場合は、ストアクレジットに限定せず、元のお支払方法にご返金します。", "本ポリシーは、法令上除外することができない権利を制限するものではありません。"], en: ["We generally do not accept returns or provide cash refunds for a change of mind.", "Approved voluntary cancellations are normally issued as store credit.", "If an item is incorrect, damaged on arrival, or materially different from its description, the customer may be entitled to repair, replacement, price reduction, or a refund under applicable law.", "When a monetary refund is required by law, it will be returned through the original payment method rather than being restricted to store credit.", "Nothing in this policy limits any rights that cannot legally be excluded."] } },
    ],
  },
  {
    n: 1,
    h: { ja: "商品の誤り、破損、説明との相違", en: "Incorrect, Damaged, or Misdescribed Items" },
    blocks: [
      { kind: "p", text: { ja: "次のいずれかに該当する場合は、お受け取り後5日以内（暦日）を目安に、速やかに当社までご連絡ください。", en: "Please contact us promptly, preferably within five calendar days after delivery, if:" } },
      { kind: "list", items: { ja: ["異なる商品が届いた場合。", "お届け時に商品が破損していた場合。", "商品が商品ページの記載または合意した仕様と重大に相違する場合。", "必要な部品または付属品が欠けている場合。"], en: ["You received the wrong item.", "The item was damaged when delivered.", "The item is materially different from its product listing or agreed specifications.", "A required component or accessory is missing."] } },
      { kind: "p", text: { ja: "この5日という期間は、当社が速やかに事実関係を確認するために設けているものです。ご連絡が遅れた場合であっても、法令上制限することができない権利が失われることはありません。", en: "The five-day period allows us to investigate the matter promptly. A delay in contacting us does not remove any rights that cannot legally be limited." } },
      { kind: "h", text: { ja: "ご対応の方法", en: "Available resolutions" } },
      { kind: "p", text: { ja: "お申し出の内容を確認のうえ、Cha Jewelsは次のいずれかを含む適切な対応を行う場合があります。", en: "After reviewing the request, Cha Jewels may provide an appropriate resolution, including:" } },
      { kind: "list", items: { ja: ["商品の修理。", "在庫がある場合における同一商品との交換。", "代金の合理的な減額。", "お客様がご了承された場合におけるストアクレジットの付与。", "法令上必要な場合、またはその他当社が承認した場合における、当該ご購入の取消しおよび元のお支払方法でのご返金。"], en: ["Repairing the item.", "Replacing it with the same item, when available.", "Providing a reasonable reduction in price.", "Issuing store credit, if accepted by the customer.", "Cancelling the affected purchase and providing a refund through the original payment method when required by law or otherwise approved."] } },
      { kind: "p", text: { ja: "当社のプレラブド商品は一点物が多く、同一商品との交換ができない場合には、別の適切な対応をご提案します。", en: "Many of our preloved pieces are unique. If an identical replacement is unavailable, we will offer another appropriate resolution." } },
      { kind: "p", text: { ja: "商品の誤り、破損、または説明との重大な相違が当社において確認された場合、返送に要する合理的な費用は当社が負担します。", en: "When Cha Jewels confirms that we supplied an incorrect, damaged, or materially misdescribed item, we will cover the reasonable cost of returning it." } },
    ],
  },
  {
    n: 2,
    h: { ja: "商品の状態とプレラブドジュエリー", en: "Product Condition and Preloved Jewelry" },
    blocks: [
      { kind: "p", text: { ja: "プレラブドジュエリーには、使用に伴う軽微な痕跡が見られる場合があります。商品説明または写真において明示している傷、汚れ、修理跡、色味の違い、寸法その他の特徴は、不具合とはみなしません。", en: "Preloved jewelry may show minor signs of previous wear. Scratches, marks, repairs, color variations, measurements, or other characteristics clearly disclosed in the product description or photographs are not considered defects." } },
      { kind: "p", text: { ja: "次の事項についても、原則として不具合とはみなしません。", en: "The following are also not normally considered defects:" } },
      { kind: "list", items: { ja: ["宝石、真珠、または手作りの宝石ブレスレットにおける自然な個体差。", "照明、撮影、または画面設定による軽微な見え方の違い。", "寸法またはサイズを正確に表示していた場合における、サイズが合わないというご事情。", "プレラブド商品として想定される通常の使用感または特徴。", "測定器具または測定方法による合理的な誤差。"], en: ["Natural variations in gemstones, pearls, or handmade gemstone bracelets.", "Minor differences caused by lighting, photography, or screen settings.", "Fit issues when the measurements or size were accurately disclosed.", "Normal wear or characteristics appropriate to a preloved item.", "Reasonable differences caused by measuring equipment or methods."] } },
      { kind: "p", text: { ja: "本項は、商品が商品説明と重大に相違する場合には適用されません。", en: "This section does not apply when an item is materially different from its description." } },
    ],
  },
  {
    n: 3,
    h: { ja: "破損または誤配送の証拠", en: "Evidence of Damage or Incorrect Delivery" },
    blocks: [
      { kind: "p", text: { ja: "次の内容が確認できる、開封の一連の様子を撮影した動画の記録を強くお勧めします。", en: "We strongly recommend recording a continuous unboxing video showing:" } },
      { kind: "list", items: { ja: ["未開封の荷物および配送ラベル。", "梱包を開封する様子。", "梱包材および商品の全体。", "確認できる破損、欠品、または商品の誤り。"], en: ["The unopened parcel and shipping label.", "The opening of the package.", "The packaging and entire item.", "Any visible damage, missing component, or incorrect product."] } },
      { kind: "p", text: { ja: "あわせて鮮明な写真を撮影いただき、元の梱包材、タグ、鑑定書および付属品を保管してください。", en: "Please also take clear photographs and keep the original packaging, tags, certificates, and accessories." } },
      { kind: "p", text: { ja: "開封動画は、特に配送中に生じた可能性のある破損について、当社が事実関係を確認するうえで役立ちます。もっとも、動画がないことによって、法令上認められる権利が当然に失われるものではありません。当社は、写真、配送記録、梱包材、検品結果その他の合理的な資料を考慮します。", en: "An unboxing video helps us investigate claims, especially damage that may have occurred during delivery. However, the absence of a video does not automatically remove any right provided by applicable law. We may consider photographs, delivery records, packaging, inspection results, and other reasonable evidence." } },
    ],
  },
  {
    n: 4,
    h: { ja: "お客様のご都合による返品", en: "Change-of-Mind Returns" },
    blocks: [
      { kind: "p", text: { ja: "日本における通信販売では、販売者が返品の条件を明示している場合、原則としてクーリング・オフの制度は適用されません。", en: "Online and mail-order purchases in Japan do not generally have an automatic cooling-off period when the seller has clearly disclosed its return conditions." } },
      { kind: "p", text: { ja: "したがって、Cha Jewelsは、次の事由による返品、交換または現金でのご返金のお申し出は、原則としてお受けしておりません。", en: "Accordingly, Cha Jewels does not normally accept returns, exchanges, or cash-refund requests for:" } },
      { kind: "list", items: { ja: ["お気持ちの変化。", "ご好みによるもの。", "他の商品または他の販売者をより低い価格で見つけられた場合。", "照明または画面設定による軽微な色の違い。", "寸法を正確に表示していた場合における、サイズが合わないというご事情。", "プレラブド商品について明示していた使用感。", "宝石、真珠、または手作り商品における自然な個体差。"], en: ["A change of mind.", "Personal preference.", "Finding another item or seller at a lower price.", "Minor color differences caused by lighting or screen settings.", "Fit issues when the measurements were correctly disclosed.", "Disclosed signs of wear on a preloved item.", "Natural variations in gemstones, pearls, or handmade products."] } },
      { kind: "p", text: { ja: "例外的な対応はCha Jewelsの裁量により判断し、以下の条件に従いストアクレジットでの対応となる場合があります。", en: "Any exception is at Cha Jewels’ discretion and may be issued as store credit subject to the conditions below." } },
    ],
  },
  {
    n: 5,
    h: { ja: "全額お支払い済みのご注文のキャンセル", en: "Paid-in-Full Order Cancellations" },
    blocks: [
      { kind: "h", text: { ja: "同日中のキャンセル", en: "Same-day cancellations" } },
      { kind: "p", text: { ja: "ご注文と全額のお支払いが同一の暦日に完了した場合、当日の日本標準時23時59分までにキャンセルをお申し出いただけます。", en: "If the order and full payment are completed on the same calendar day, a cancellation request may be made before 11:59 p.m. Japan Standard Time on that day." } },
      { kind: "p", text: { ja: "お受けした場合、お支払いいただいた全額をストアクレジットとして付与します。", en: "If approved, the full amount paid will be issued as store credit." } },
      { kind: "p", text: { ja: "次の場合、同日中のキャンセルをお受けできないことがあります。", en: "Same-day cancellation is not guaranteed if:" } },
      { kind: "list", items: { ja: ["商品を既に発送している場合。", "サイズ直し、刻印、研磨、鑑定、修理その他ご依頼いただいた作業を既に開始している場合。", "当社が既に仕入先に対して支払を確定している場合。", "仕入先のライブ販売、オークション、特別仕入れその他ご購入前に最終販売と明示した方法により調達した商品である場合。"], en: ["The order has already been shipped.", "Resizing, engraving, polishing, certification, repair, or another requested service has started.", "Cha Jewels has already committed funds to a supplier.", "The item was obtained through supplier live-selling, auction, special procurement, or another sale identified as final before purchase."] } },
      { kind: "h", text: { ja: "翌日以降のキャンセル", en: "Cancellations requested after the same day" } },
      { kind: "p", text: { ja: "ご注文日の翌日以降にお申し出いただくキャンセルは、お受けできることを保証しておりません。", en: "Cancellations requested after the order date are not guaranteed." } },
      { kind: "p", text: { ja: "Cha Jewelsがキャンセルをお受けする場合、ご注文金額の合計の30%を上限とするキャンセル料を差し引いたうえで、ストアクレジットを付与することがあります。この差引きは、仕入先に対する確定支払、決済手数料、事務費用、既に実施した作業、再入庫の費用または商品価値の減少など、合理的な費用に充てられます。", en: "If Cha Jewels accepts the cancellation, we may issue store credit after deducting a cancellation charge of up to 30% of the total order price. The deduction may cover reasonable costs such as supplier commitments, payment fees, administrative costs, services already performed, restocking, or reduction in the item’s value." } },
      { kind: "p", text: { ja: "キャンセル料は、法令上認められる合理的な範囲に限られます。法令上認められる金額が30%を下回る場合は、その低い金額を適用します。算定の根拠は、ご請求に応じてご説明します。", en: "Any cancellation charge will be limited to the reasonable amount permitted by applicable law. If the legally permitted amount is lower than 30%, the lower amount will apply. We will explain the basis of the charge upon request." } },
      { kind: "p", text: { ja: "全額をストアクレジットとして付与する同日キャンセルの取扱いは、ご注文と全額のお支払いが同一の暦日に完了した場合に限り適用されます。", en: "The full store-credit option for same-day cancellations applies only when the order and full payment were completed on the same calendar day." } },
    ],
  },
  {
    n: 6,
    h: { ja: "分割予約（レイアウェイ）のご注文", en: "Layaway Orders" },
    blocks: [
      { kind: "p", text: { ja: "分割予約のご注文は、特定の商品をお客様のためにお取り置きし、他のお客様への販売を行わないものです。", en: "A layaway order reserves a specific item for the customer and prevents it from being offered to other buyers." } },
      { kind: "h", text: { ja: "予約金", en: "Down payment" } },
      { kind: "p", text: { ja: "予約金は、お申込みの意思を示す預り金の性質を有します。お客様のご都合によりキャンセルされる場合、Cha Jewelsは、法令上認められる合理的な範囲において、予約金をキャンセル料として留保することがあります。", en: "The down payment serves as a commitment deposit. If the customer voluntarily cancels the order, Cha Jewels may retain the down payment as a cancellation charge, subject to the reasonable limits permitted by applicable law." } },
      { kind: "p", text: { ja: "留保した金額は、当社が別途合意した場合を除き、ストアクレジットには振り替えません。", en: "The retained amount will not be converted into store credit unless Cha Jewels agrees otherwise." } },
      { kind: "h", text: { ja: "お取り置き商品の変更", en: "Changing the reserved item" } },
      { kind: "p", text: { ja: "予約金のお支払い後にお取り置き商品の変更をお申し出いただく場合、元のご注文のキャンセルおよび新たなご注文として取り扱います。", en: "A request to change the reserved product after the down payment has been made will be treated as cancellation of the original order and creation of a new order." } },
      { kind: "p", text: { ja: "キャンセル料およびストアクレジットの残高は、本ポリシーおよび適用される分割予約規約に基づき算定します。", en: "Any cancellation charge or store-credit balance will be calculated under this policy and the applicable Layaway Terms." } },
      { kind: "h", text: { ja: "お支払いの遅延または未了", en: "Missed or incomplete payments" } },
      { kind: "p", text: { ja: "所定のお支払いが完了しない場合、Cha Jewelsは、ご通知のうえ、適用される場合には遅延分をお支払いいただく機会を設けたうえで、分割予約をキャンセルすることがあります。", en: "If required payments are not completed, Cha Jewels may cancel the layaway after providing notice and any applicable opportunity to correct the missed payment." } },
      { kind: "p", text: { ja: "Cha Jewelsは、既にお支払いいただいた金額から、法令上認められるキャンセル料および合理的な費用を差し引くことがあります。これらの費用には、サイズ直し、研磨、鑑定、修理その他のカスタマイズなど、お客様のご依頼により実施した作業が含まれる場合があります。", en: "Cha Jewels may deduct a lawful cancellation charge and reasonable costs from the amount already paid. These costs may include services performed at the customer’s request, such as resizing, polishing, certification, repair, or other customization." } },
      { kind: "p", text: { ja: "法令に基づく差引き後の残額は、法令により元のお支払方法でのご返金が必要な場合を除き、原則としてストアクレジットとして付与します。", en: "Any remaining balance after lawful deductions will normally be issued as store credit unless a refund through the original payment method is required by law." } },
      { kind: "p", text: { ja: "当社に生じた実際のまたは合理的な損害の額にかかわらず、お支払いいただいた全額を当然に没収する取扱いは行いません。", en: "Automatically forfeiting every payment, regardless of the amount of Cha Jewels’ actual or reasonable loss, does not apply." } },
      { kind: "h", text: { ja: "当社によるキャンセル", en: "Cancellation by Cha Jewels" } },
      { kind: "p", text: { ja: "Cha Jewelsがお取り置き商品をご提供できない場合、お客様の責めによらない事由によりお取引をキャンセルする場合、または契約の内容に適合しない商品をご提供した場合、予約金その他お支払いいただいた金額は没収しません。", en: "If Cha Jewels cannot supply the reserved item, cancels the transaction for reasons not caused by the customer, or supplies an item that does not conform to the agreement, the down payment and other amounts paid will not be forfeited." } },
      { kind: "p", text: { ja: "この場合、適切な代替品のご提供、修理、代金の減額、元のお支払方法でのご返金その他法令上必要な対応を行います。", en: "An appropriate replacement, repair, price reduction, original-payment refund, or other legally required resolution will be provided." } },
    ],
  },
  {
    n: 7,
    h: { ja: "お客様のご都合による返品の対象外となる商品", en: "Items Not Eligible for Change-of-Mind Return" },
    blocks: [
      { kind: "p", text: { ja: "次の商品は、お客様のご都合による返品または交換の対象外となります。", en: "The following items are not eligible for change-of-mind returns or exchanges:" } },
      { kind: "list", items: { ja: ["検品のために合理的に必要な範囲を超えて着用された商品。", "お客様により破損、毀損、改変または不適切に取り扱われた商品。", "サイズ直し、刻印、修理、研磨、鑑定、名入れその他の特別なご注文による商品。", "ピアスのうち、衛生シールまたは保護包装を開封されたもの。", "ギフト券およびストアクレジット。", "ご購入前に最終販売と明示した商品。"], en: ["Jewelry that has been worn beyond what is reasonably necessary for inspection.", "Items damaged, broken, altered, or improperly handled by the customer.", "Resized, engraved, repaired, polished, certified, personalized, or specially ordered items.", "Pierced earrings after hygiene seals or protective packaging have been opened.", "Gift certificates and store credits.", "Items clearly identified as final sale before purchase."] } },
      { kind: "p", text: { ja: "これらの除外は、商品に誤りがあった場合、到着時に破損していた場合、説明と重大に相違していた場合、またはその他法令上除外することができない権利が及ぶ場合には適用されません。", en: "These exclusions do not apply when an item was incorrect, damaged on arrival, materially misdescribed, or otherwise subject to a non-excludable legal right." } },
    ],
  },
  {
    n: 8,
    h: { ja: "返品のお申し出の手続", en: "Return Request Process" },
    blocks: [
      { kind: "h", text: { ja: "ステップ1：必要な情報のご準備", en: "Step 1: Prepare the information" } },
      { kind: "p", text: { ja: "次の情報をご用意ください。", en: "Please prepare:" } },
      { kind: "list", items: { ja: ["ご注文番号または請求書番号。", "問題の概要。", "商品および梱包材の鮮明な写真。", "開封動画（ある場合）。", "その他お申し出に関連する資料。"], en: ["Your order or invoice number.", "A brief explanation of the problem.", "Clear photographs of the item and packaging.", "An unboxing video, if available.", "Any other evidence relevant to the request."] } },
      { kind: "h", text: { ja: "ステップ2：当社へのご連絡", en: "Step 2: Contact us" } },
      { kind: "p", text: { ja: "お受け取り後5日以内（暦日）を目安に、速やかにCha Jewelsまでご連絡ください。", en: "Contact Cha Jewels promptly, preferably within five calendar days after delivery:" } },
      { kind: "lines", lines: { ja: ["Messenger：m.me/chajewelsjapan", "メールアドレス：sales@chajewelsjp.com"], en: ["Messenger: m.me/chajewelsjapan", "Email: sales@chajewelsjp.com"] } },
      { kind: "h", text: { ja: "ステップ3：返品の承認をお待ちいただく", en: "Step 3: Wait for return authorization" } },
      { kind: "p", text: { ja: "当社担当者がお申し出の内容を確認し、次の事項をご案内します。", en: "Our team will review the request and provide:" } },
      { kind: "list", items: { ja: ["承認またはご判断の結果。", "返送の方法。", "返送費用を当社が負担する場合における返送用ラベル。", "検品のために必要となる追加の情報。"], en: ["The approval or decision.", "Return instructions.", "A return label, when Cha Jewels is responsible for the return cost.", "Any additional information needed for inspection."] } },
      { kind: "p", text: { ja: "承認を得ずに商品を返送されないようお願いします。承認のない返送または着払いでの返送は、法令上認められる範囲でお受けできない場合があります。", en: "Please do not return an item without authorization. Unauthorized or cash-on-delivery returns may be refused when legally permitted." } },
      { kind: "h", text: { ja: "ステップ4：商品の返送", en: "Step 4: Return the item" } },
      { kind: "p", text: { ja: "別途ご案内がない限り、承認後7日以内（暦日）に返送してください。", en: "Unless otherwise instructed, an approved return should be sent within seven calendar days after authorization." } },
      { kind: "p", text: { ja: "商品は、合理的な検品による場合を除き、お受け取りいただいた状態で返送してください。元の梱包材、タグ、鑑定書および付属品は、お手元にある場合は同梱してください。", en: "The item should be returned in the condition in which it was received, except for reasonable inspection. Please include the original packaging, tags, certificates, and accessories where available." } },
      { kind: "h", text: { ja: "ステップ5：検品とご対応", en: "Step 5: Inspection and resolution" } },
      { kind: "p", text: { ja: "返送品を受領後、当社が商品を検品し、その結果をご連絡します。", en: "After receiving the return, we will inspect the item and notify you of the outcome." } },
      { kind: "p", text: { ja: "承認された交換、ストアクレジットの付与またはご返金は、検品後7営業日以内に処理するのが通例です。金融機関または決済事業者の処理に、さらに日数を要する場合があります。", en: "Approved replacements, store credits, or refunds are normally processed within seven business days after inspection. Banks and payment providers may require additional processing time." } },
    ],
  },
  {
    n: 9,
    h: { ja: "ストアクレジット", en: "Store Credit" },
    blocks: [
      { kind: "p", text: { ja: "本ポリシーに基づき付与するストアクレジットの取扱いは、次のとおりです。", en: "Store credit issued under this policy:" } },
      { kind: "list", items: { ja: ["付与日から1年（12か月）間有効です。", "在庫のあるCha Jewelsの商品にご利用いただけます。", "ご購入されたお客様ご本人に付与します。", "当社が書面により承認した場合を除き、譲渡することはできません。", "法令により必要な場合を除き、売却または現金への交換はできません。", "法令上認められる範囲において、12か月の経過により自動的に失効します。", "失効後の再発行は、当社が合意した場合または法令上必要な場合を除き、行いません。"], en: ["Is valid for one year or 12 months from the date of issue.", "May be used for available Cha Jewels products.", "Is issued to the original customer.", "Is non-transferable unless Cha Jewels approves otherwise in writing.", "Cannot be sold or exchanged for cash, except when required by law.", "Automatically expires after 12 months, where permitted by applicable law.", "Cannot be reissued after expiration unless Cha Jewels agrees or applicable law requires otherwise."] } },
      { kind: "p", text: { ja: "ストアクレジットには利息は付さず、法令に別段の定めがある場合を除き、現金としての価値を有しません。", en: "Store credit does not earn interest and has no cash value except where applicable law provides otherwise." } },
    ],
  },
  {
    n: 10,
    h: { ja: "送料その他の費用", en: "Shipping and Other Charges" },
    blocks: [
      { kind: "p", text: { ja: "商品の誤り、破損または説明との重大な相違が当社において確認され、それに伴い返送が生じた場合、合理的な返送費用および法令上必要なその他の金額は当社が負担します。", en: "When the return results from an incorrect, damaged, or materially misdescribed item confirmed by Cha Jewels, we will cover reasonable return-delivery costs and any other amounts required by law." } },
      { kind: "p", text: { ja: "お客様のお申し出による任意の返品またはキャンセルの場合の取扱いは、次のとおりです。", en: "For a discretionary return or cancellation requested by the customer:" } },
      { kind: "list", items: { ja: ["返送料はお客様のご負担となります。", "当初の配送料、関税、税金および決済手数料は、ストアクレジットに含まれない場合があります。", "差引きは、法令上認められる範囲に限られます。"], en: ["Return shipping is the customer’s responsibility.", "Original delivery charges, customs duties, taxes, and payment fees may not be included in store credit.", "Any deduction must remain within the limits permitted by applicable law."] } },
      { kind: "p", text: { ja: "海外のお客様は、Cha Jewelsがご案内する返送および通関の手続に従っていただく必要があります。", en: "International customers are responsible for following the return shipping and customs instructions provided by Cha Jewels." } },
    ],
  },
  {
    n: 11,
    h: { ja: "適用される法令", en: "Applicable Law" },
    blocks: [
      { kind: "p", text: { ja: "本ポリシーは日本法に準拠します。ただし、適用される消費者の強行法規上の権利を制限するものではありません。", en: "This policy is governed by the laws of Japan, without limiting any mandatory consumer rights that may apply." } },
      { kind: "p", text: { ja: "本ポリシーの一部が強行法規に反する場合、当該法令が優先し、その他の条項は引き続き有効に適用されます。", en: "If any part of this policy conflicts with a mandatory law, the applicable law will take priority and the remaining sections will continue to apply." } },
    ],
  },
  {
    n: 12,
    h: { ja: "お問い合わせ", en: "Contact Us" },
    blocks: [
      { kind: "p", text: { ja: "ご質問または返品のお申し出は、次の窓口までご連絡ください。", en: "For questions or return requests, contact:" } },
      { kind: "lines", lines: { ja: [COMPANY_NAME, "代表取締役：Cynthia Largo"], en: [COMPANY_NAME, "Representative Director: Cynthia Largo"] } },
      { kind: "lines", lines: { ja: ["〒124-0012", "東京都葛飾区立石6-5-1", "タイムマンション301"], en: ["Time Mansion 301", "6-5-1 Tateishi, Katsushika-ku", "Tokyo 124-0012, Japan"] } },
      { kind: "lines", lines: { ja: ["Messenger：m.me/chajewelsjapan", "メールアドレス：sales@chajewelsjp.com"], en: ["Messenger: m.me/chajewelsjapan", "Email: sales@chajewelsjp.com"] } },
    ],
  },
];

/**
 * NOT REVIEWED BY A LAWYER — every page built from this file. Each document
 * carries its own "last updated" line instead of a shared draft banner, because
 * two dates on one legal page contradict each other (see LegalArticles).
 *
 * Substantive terms must agree across /legal/terms, /legal/returns, /layaway
 * and /legal/tokusho. They currently DO NOT on returns, and tokusho is the
 * outlier — reported to Cynthia rather than reconciled here.
 */
/** Title for the privacy page; the page itself carries no literal. */
export const legalTitles: Record<"privacy", Record<Lang, string>> = {
  privacy: { ja: "プライバシーポリシー", en: "Privacy Policy" },
};

/**
 * 特定商取引法に基づく表記 — required by Japanese law for online sales.
 * BILINGUAL and it follows the toggle; the rows carry the reasoning, see the
 * comment on `rows` below. (This paragraph used to say the page was rendered in
 * Japanese in both languages and that EN explained why. Both were true of an
 * earlier version and were overruled on 2026-09-16; the comment outlived the
 * code it described.) Confirm every line with a JP compliance review before
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
      v: { ja: COMPANY_NAME, en: COMPANY_NAME },
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
 * THE COMPANY NAME IS "Ｃｈａ　Ｊｅｗｅｌｓ株式会社" (owner-confirmed
 * 2026-09-16), and it is the SAME string on every legal surface: this policy's
 * articles 1 and 14, and the tokusho 販売業者 row. The earlier discrepancy —
 * article 1 saying "Cha Jewels株式会社" while tokusho said 株式会社チャジュエルズ
 * — is resolved, and the answer was neither of them.
 *
 * THE FULL-WIDTH FORM IS DELIBERATE. Ｃｈａ and Ｊｅｗｅｌｓ are fullwidth Latin
 * (U+FF23 …) separated by an IDEOGRAPHIC SPACE (U+3000), not ASCII. Full-width
 * Latin is a normal Japanese corporate-registration convention, so do NOT
 * "normalise" it to "Cha Jewels株式会社" — that is a different string and it is
 * the wrong one. Still to be confirmed against the registration certificate
 * before the compliance review signs off; see the PR.
 */
export const privacyArticles: LegalArticle[] = [
  {
    n: 1,
    h: { ja: "当社について", en: "Who We Are" },
    blocks: [
      { kind: "p", text: { ja: `Cha Jewels Co., Ltd.（${COMPANY_NAME}。以下「Cha Jewels」または「当社」といいます）は、本ウェブサイトを運営し、本プライバシーポリシーに記載する個人情報について責任を負います。`, en: `Cha Jewels Co., Ltd. (${COMPANY_NAME}, “Cha Jewels,” “we,” “us,” or “our”) operates this website and is responsible for the personal information described in this Privacy Policy.` } },
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
        lines: { ja: [COMPANY_NAME, "〒124-0012", "東京都葛飾区立石6-5-1", "タイムマンション301"], en: [COMPANY_NAME, "Time Mansion 301", "6-5-1 Tateishi, Katsushika-ku", "Tokyo 124-0012, Japan"] },
      },
      { kind: "p", text: { ja: "メールアドレス：sales@chajewelsjp.com", en: "Email: sales@chajewelsjp.com" } },
      { kind: "p", text: { ja: "当社は、個人情報に関する苦情を確認し、合理的に可能な限り速やかに回答します。また、個人情報保護委員会（日本）その他お住まいの地域の所轄の監督機関にご連絡いただくこともできます。", en: "We will review privacy complaints and respond as promptly as reasonably possible. You may also contact the Personal Information Protection Commission of Japan or another competent privacy regulator where you live." } },
    ],
  },
];


/**
 * TERMS OF SERVICE — owner-supplied text, 2026-09-15. Thirty-one sections.
 *
 * REPLACES the seven-section `termsSections` that /legal/terms used to render.
 * What the old page said and this text does not is listed in the PR, section by
 * section; three figures were genuinely dropped (the 30% down payment, the
 * 60-minute live hold, the seven-day buy-back quote) and they live on /layaway,
 * /loyalty and the FAQ, which is why the PR flags them rather than this comment
 * carrying them.
 *
 * The English is Cynthia's, verbatim. The Japanese is MY TRANSLATION and is a
 * DRAFT: it needs a native read before merge. Same 敬体 register and the same
 * settled renderings as the privacy policy and the returns policy — 分割予約
 * （レイアウェイ）, ストアクレジット, プレラブド, 強行法規.
 *
 * THE LINKS WERE WRONG IN THE SOURCE and are corrected here: sections 2, 14 and
 * 22 pointed at cha-jewels.com/policies/…, a host this business does not own.
 * They now point at /legal/privacy and /legal/returns. Four more sections (5,
 * 11, 13, 17) mention the returns policy in prose; those are linked too, since
 * a reader told to "follow the process in our Return, Cancellation and Refund
 * Policy" needs the route more than the reader of section 14 does.
 *
 * §11 DESCRIBES LAYAWAY IN JAPANESE, which the Japanese site does not sell
 * (owner decision 2026-09-15). The old page filtered its layaway section out on
 * `ja`; this text cannot be filtered the same way — §11 is one of thirty-one
 * numbered sections and layaway also appears in §2, §14, §16, §22 and §30, so
 * removing one leaves the rest and renumbers the document. Flagged for Cynthia
 * in the PR, not decided here. /legal/tokusho is already in the same state.
 */
export const tosTitle: Record<Lang, string> = {
  ja: "利用規約",
  en: "Terms of Service",
};

export const tosUpdated: Record<Lang, string> = {
  ja: "最終更新日：2026年9月15日",
  en: "Last updated: September 15, 2026",
};

export const tosArticles: LegalArticle[] = [
  {
    n: 1,
    h: { ja: "Cha Jewelsについて", en: "About Cha Jewels" },
    blocks: [
      { kind: "p", text: { ja: "本ウェブサイトおよび関連するサービスは、次の者が運営しています。", en: "This website and the related services are operated by:" } },
      { kind: "lines", lines: { ja: [`Cha Jewels Co., Ltd.（${COMPANY_NAME}）`, "代表取締役：Cynthia Largo"], en: [`Cha Jewels Co., Ltd. (${COMPANY_NAME})`, "Representative Director: Cynthia Largo"] } },
      { kind: "lines", lines: { ja: ["〒124-0012", "東京都葛飾区立石6-5-1", "タイムマンション301"], en: ["Time Mansion 301", "6-5-1 Tateishi, Katsushika-ku", "Tokyo 124-0012, Japan"] } },
      { kind: "lines", lines: { ja: ["メールアドレス：sales@chajewelsjp.com", "Messenger：m.me/chajewelsjapan"], en: ["Email: sales@chajewelsjp.com", "Messenger: m.me/chajewelsjapan"] } },
      { kind: "p", text: { ja: `本規約において「Cha Jewels」「当社」とは${COMPANY_NAME}を指し、「お客様」とは、当社の商品またはサービスをご購入、ご予約またはご利用になる方を指します。`, en: `In these Terms, “Cha Jewels,” “we,” “us,” and “our” refer to ${COMPANY_NAME}. “Customer,” “you,” and “your” refer to the person purchasing, reserving, or using our products or services.` } },
    ],
  },
  {
    n: 2,
    h: { ja: "本規約への同意", en: "Acceptance of These Terms" },
    blocks: [
      { kind: "p", text: { ja: "本規約は、次の事項に適用されます。", en: "These Terms apply to:" } },
      { kind: "list", items: { ja: ["本ウェブサイトを通じたご購入。", "Cha Jewelsの公式メッセージ窓口を通じたご注文およびご予約。", "当社のライブ販売を通じたご注文。", "お客様アカウントおよびカスタマーポータル。", "分割予約（レイアウェイ）のご注文。", "ポイントおよびストアクレジット。", "サイズ直し、研磨、修理、鑑定など、ジュエリーに関するサービス。"], en: ["Purchases made through our website.", "Orders and reservations made through official Cha Jewels messaging channels.", "Orders placed through our live-selling activities.", "Customer accounts and the customer portal.", "Layaway orders.", "Loyalty points and store credit.", "Jewelry-related services such as resizing, polishing, repair, and certification."] } },
      { kind: "p", text: { ja: "ご注文またはご予約、代金もしくは予約金のお支払い、アカウントの作成その他当社のサービスのご利用をもって、お客様は本規約およびご購入前に明示した個別のご注文条件に同意されたものとみなします。", en: "By placing or reserving an order, making a payment or down payment, creating an account, or otherwise using our services, you agree to these Terms and any order-specific conditions disclosed before purchase." } },
      { kind: "rich", runs: { ja: [{ t: "当社の" }, { t: "プライバシーポリシー", href: "/legal/privacy" }, { t: "および" }, { t: "返品・キャンセル・返金ポリシー", href: "/legal/returns" }, { t: "は、本規約の一部を構成します。" }], en: [{ t: "Our " }, { t: "Privacy Policy", href: "/legal/privacy" }, { t: " and " }, { t: "Return, Cancellation and Refund Policy", href: "/legal/returns" }, { t: " form part of these Terms." }] } },
      { kind: "p", text: { ja: "卸売および事業者間のお取引については、別途の書面による契約が適用される場合があります。", en: "Wholesale and business-to-business transactions may be governed by separate written agreements." } },
    ],
  },
  {
    n: 3,
    h: { ja: "ご利用の条件", en: "Customer Eligibility" },
    blocks: [
      { kind: "p", text: { ja: "お客様は、18歳以上であり、かつ契約を締結する法的な能力を有している必要があります。", en: "You must be at least 18 years old and legally capable of entering into a contract." } },
      { kind: "p", text: { ja: "18歳未満の方の場合は、親権者または法定代理人がご注文を行うか、これを承認する必要があります。法人または他の方に代わってご注文される場合、お客様は、当該の方または組織を拘束する権限を有していることを表明したものとみなします。", en: "If you are under 18, a parent or legal guardian must place or approve the order. By placing an order on behalf of a company or another person, you confirm that you have authority to bind that person or organization." } },
      { kind: "p", text: { ja: "お客様は、正確かつ完全な情報をご提供いただく必要があります。当社は、不正の防止または法令の遵守のために合理的に必要な場合、本人、住所、お支払方法または権限の確認を求めることがあります。", en: "You must provide accurate and complete information. We may request identity, address, payment, or authorization verification when reasonably necessary to prevent fraud or comply with the law." } },
    ],
  },
  {
    n: 4,
    h: { ja: "お客様アカウント", en: "Customer Accounts" },
    blocks: [
      { kind: "p", text: { ja: "お客様には、次の事項について責任を負っていただきます。", en: "You are responsible for:" } },
      { kind: "list", items: { ja: ["正確なアカウント情報をご登録いただくこと。", "ログイン情報を安全に管理いただくこと。", "アカウントへの不正なアクセスを防止いただくこと。", "不正な利用が疑われる場合に速やかに当社へご連絡いただくこと。", "ご連絡先およびお届け先の情報に変更が生じた場合に更新いただくこと。"], en: ["Providing accurate account information.", "Keeping your login details secure.", "Preventing unauthorized access to your account.", "Promptly notifying us of suspected unauthorized activity.", "Updating your contact and delivery information when it changes."] } },
      { kind: "p", text: { ja: "お客様は、アカウントを通じて行われた行為について責任を負います。ただし、当社の責めに帰すべきセキュリティ上の不備によって生じた場合を除きます。", en: "You are responsible for activities conducted through your account unless the activity resulted from a security failure attributable to Cha Jewels." } },
      { kind: "p", text: { ja: "当社は、不正、お支払いに関する紛争、不正なアクセスまたは本規約の違反について調査するために合理的に必要な場合、アカウントの利用を一時的に制限することがあります。", en: "We may temporarily restrict an account when reasonably necessary to investigate fraud, payment disputes, unauthorized access, or violations of these Terms." } },
    ],
  },
  {
    n: 5,
    h: { ja: "商品情報", en: "Product Information" },
    blocks: [
      { kind: "p", text: { ja: "当社は、素材、刻印、重量、寸法、宝石に関する情報、状態、付属する鑑定書または付属品を含め、すべての商品について正確に記載するよう合理的に努めます。", en: "We make reasonable efforts to describe every item accurately, including its material, hallmark, weight, dimensions, gemstone information, condition, and included certificates or accessories." } },
      { kind: "h", text: { ja: "プレラブドジュエリー", en: "Preloved jewelry" } },
      { kind: "p", text: { ja: "プレラブドジュエリーには、軽微な傷、汚れ、修理跡、使用感、または経年および状態に応じた変化など、以前の所有に伴う痕跡が見られる場合があります。", en: "Preloved jewelry may show signs of previous ownership, including minor scratches, marks, repairs, wear, or changes consistent with its age and condition." } },
      { kind: "p", text: { ja: "商品ページ、写真、ライブでのご紹介、請求書またはご注文確認において明示した特徴は、商品説明の一部とみなします。", en: "Characteristics clearly disclosed in the listing, photographs, live presentation, invoice, or order confirmation are considered part of the product description." } },
      { kind: "h", text: { ja: "手作り商品および天然素材", en: "Handmade products and natural materials" } },
      { kind: "p", text: { ja: "手作りの宝石ブレスレット、真珠および天然石には、次の点で個体差があります。", en: "Handmade gemstone bracelets, pearls, and natural gemstones may vary in:" } },
      { kind: "list", items: { ja: ["色および色調。", "模様および内包物。", "形状および大きさ。", "表面の状態。", "配置および仕上げ。"], en: ["Color and tone.", "Pattern and inclusions.", "Shape and size.", "Surface characteristics.", "Arrangement and workmanship."] } },
      { kind: "p", text: { ja: "これらの天然または手作りに由来する個体差は、商品が合意した説明と重大に相違する場合を除き、不具合とはみなしません。", en: "These natural or handmade variations are not defects unless the item is materially different from the agreed description." } },
      { kind: "h", text: { ja: "写真および画面表示", en: "Photographs and displays" } },
      { kind: "p", text: { ja: "当社は、商品の色や細部を正確にお伝えするよう努めています。もっとも、照明、撮影、画面設定および端末の違いにより、商品の見え方が異なる場合があります。", en: "We try to present product colors and details accurately. However, lighting, photography, screen settings, and device differences may affect how an item appears." } },
      { kind: "rich", runs: { ja: [{ t: "寸法および重量には、測定器具または測定方法による合理的な誤差が生じる場合があります。重大な相違については、当社の返品・キャンセル・返金ポリシーおよび適用される法令に従います。" }], en: [{ t: "Measurements and weights may have reasonable variations caused by measuring equipment or methods. Any material discrepancy remains subject to our Return, Cancellation and Refund Policy and applicable law." }] } },
      { kind: "h", text: { ja: "鑑定書および査定書", en: "Certificates and appraisals" } },
      { kind: "p", text: { ja: "宝石鑑別書、鑑定書および査定書は、特に記載がある場合にのみ付属します。独立した鑑定機関が発行する書面は、検査時点における当該機関の評価を示すものです。", en: "Gemological reports, certificates, and appraisals are included only when specifically stated. Reports issued by independent laboratories reflect that organization’s assessment at the time of examination." } },
      { kind: "p", text: { ja: "鑑定書または査定書は、商品の将来の市場価格、再販価値または売却の可能性を保証するものではありません。", en: "A certificate or appraisal is not a guarantee of the item’s future market price, resale value, or ability to be sold." } },
    ],
  },
  {
    n: 6,
    h: { ja: "ジュエリーは投資を保証するものではありません", en: "Jewelry Is Not a Guaranteed Investment" },
    blocks: [
      { kind: "p", text: { ja: "ジュエリー、貴金属、宝石およびブランド品は、時間の経過とともに価値を保つこともあれば変動することもあり、将来の価値は不確実です。", en: "Jewelry, precious metals, gemstones, and branded items may retain or change in value over time, but their future value is uncertain." } },
      { kind: "p", text: { ja: "ジュエリーを「資産」「投資」「価値の保存手段」または「資産価値のあるもの」として言及する場合、これは一般的な説明であり、次のいずれにも該当しません。", en: "References to jewelry as an “asset,” “investment,” “store of value,” or item with “investment value” are general descriptions and do not constitute:" } },
      { kind: "list", items: { ja: ["金融または投資に関する助言。", "規制の対象となる投資商品。", "利益または価値の上昇のお約束。", "再販価格の保証。", "買い取りのお約束の保証。", "将来において買い手または市場が存在することの保証。"], en: ["Financial or investment advice.", "A regulated investment product.", "A promise of profit or appreciation.", "A guaranteed resale price.", "A guaranteed buyback commitment.", "A guarantee that a buyer or market will be available in the future."] } },
      { kind: "p", text: { ja: "金、宝石、為替、小売および再販の価格は、上昇することも下落することもあります。お客様は、ご自身の状況に基づいてご購入を判断してください。", en: "Gold, gemstone, currency, retail, and resale prices may rise or fall. Customers must make purchasing decisions based on their own circumstances." } },
      { kind: "p", text: { ja: "当社は、別途の書面による合意において確認した場合にのみ、買い取りまたは再販のお取扱いを行います。", en: "Cha Jewels offers a buyback or resale arrangement only when confirmed in a separate written agreement." } },
    ],
  },
  {
    n: 7,
    h: { ja: "ご注文と契約の成立", en: "Orders and Contract Formation" },
    blocks: [
      { kind: "p", text: { ja: "ご注文は、次の方法でお申し込みいただけます。", en: "You may submit an order by:" } },
      { kind: "list", items: { ja: ["本ウェブサイトのご注文手続きを完了すること。", "公式のライブ販売において商品をご予約またはご指名すること。", "Cha Jewelsの公式メッセージ窓口を通じてご注文のお申し出をお送りいただくこと。", "請求書または書面のお見積りをご承諾いただくこと。", "合意した予約金または代金全額をお支払いいただくこと。"], en: ["Completing the website checkout process.", "Reserving or claiming an item during an official live-selling session.", "Sending an order request through an official Cha Jewels messaging channel.", "Accepting an invoice or written quotation.", "Paying an agreed down payment or full-payment amount."] } },
      { kind: "p", text: { ja: "ご注文のお申し込みまたはライブ販売でのご指名は、商品のご購入のお申し出です。当社が商品の割り当てを確認し、ご注文確認、請求書その他明確な承諾をお送りした時点で、拘束力のあるご注文が成立します。", en: "Submitting an order or making a claim during live selling is a request to purchase the item. A binding order is formed when Cha Jewels confirms the item’s allocation and sends an order confirmation, invoice, or other clear acceptance." } },
      { kind: "p", text: { ja: "お申し出を受領したことをお知らせする自動の通知は、必ずしも商品のご注文の承諾または割り当てを意味するものではありません。", en: "An automatic acknowledgment that we received your request does not necessarily mean the item has been accepted or allocated." } },
      { kind: "p", text: { ja: "当社の商品は一点物が多く、複数の販売経路でご案内しているため、割り当ての確認前に商品がご用意できなくなる場合があります。ご用意できない商品について既に代金をお受けしている場合は、適切な代替品、お客様がご了承されたストアクレジット、または元のお支払方法でのご返金をご案内します。", en: "Because many items are unique and offered through several sales channels, an item may become unavailable before allocation is confirmed. If payment was received for an unavailable item, we will offer an appropriate alternative, store credit accepted by the customer, or a refund through the original payment method." } },
    ],
  },
  {
    n: 8,
    h: { ja: "ご注文の確認とお断り", en: "Order Review and Refusal" },
    blocks: [
      { kind: "p", text: { ja: "当社は、ご注文を承諾する前に、追加の情報をお伺いすること、または次のような正当な理由によりご注文をお断りすることがあります。", en: "Before accepting an order, we may request additional information or decline the order for legitimate reasons, including:" } },
      { kind: "list", items: { ja: ["商品をご用意できない場合。", "価格または商品説明に明らかな誤りがある場合。", "お支払いを確認できない場合。", "お届け先の情報が不十分な場合。", "不正、無権限の利用、転売の濫用または違法な行為が合理的に疑われる場合。", "ご指定の場所へ適法に商品をお届けできない場合。"], en: ["The item is unavailable.", "The price or description contains a clear error.", "Payment cannot be verified.", "Delivery information is incomplete.", "We reasonably suspect fraud, unauthorized activity, resale abuse, or unlawful conduct.", "We cannot lawfully deliver the item to the requested location."] } },
      { kind: "p", text: { ja: "当社が商品をご提供できないために、承諾済みのご注文をキャンセルせざるを得ない場合、お客様が自らのご意思により他の対応をお選びになる場合を除き、該当するお支払いは元のお支払方法にご返金します。", en: "If an accepted order must be cancelled because Cha Jewels cannot supply the item, any affected payment will be refunded through the original payment method unless the customer voluntarily chooses another resolution." } },
      { kind: "p", text: { ja: "当社は、より高い価格で転売することのみを目的として、承諾済みのご注文をキャンセルすることはありません。", en: "We will not cancel an accepted order solely to resell the item at a higher price." } },
    ],
  },
  {
    n: 9,
    h: { ja: "価格、税金および通貨", en: "Prices, Taxes, and Currency" },
    blocks: [
      { kind: "p", text: { ja: "価格は、商品ページ、請求書またはご注文確認に記載の通貨で表示します。", en: "Prices are displayed in the currency stated on the product page, invoice, or order confirmation." } },
      { kind: "p", text: { ja: "別段の記載がない限り、次のとおりです。", en: "Unless otherwise stated:" } },
      { kind: "list", items: { ja: ["消費税が課される場合は、税込みの価格です。", "送料は別途計算します。", "海外の関税、輸入税、通関手数料および現地の費用は、お客様のご負担となります。", "参考のために表示する換算額は概算です。", "お客様の金融機関、カード発行会社または決済事業者が、異なる為替レートを適用し、または追加の手数料を課す場合があります。"], en: ["Japanese consumption tax is included where applicable.", "Shipping charges are calculated separately.", "International customs duties, import taxes, brokerage charges, and local fees are the customer’s responsibility.", "Currency conversions displayed for convenience are estimates.", "The customer’s bank, card issuer, or payment provider may use a different exchange rate or impose additional fees."] } },
      { kind: "p", text: { ja: "最終のご注文確認には、適用される商品価格、割引、送料、お支払い予定および合計金額を記載します。", en: "The final order confirmation will show the applicable item price, discounts, shipping charges, payment schedule, and total amount." } },
      { kind: "p", text: { ja: "ご注文の承諾後は、金、宝石または為替の市場価格の変動によって確定した価格が変わることはありません。ただし、両当事者が書面により合意した場合を除きます。", en: "Once an order is accepted, market changes in gold, gemstone, or foreign-exchange prices do not change the confirmed price unless both parties agree in writing." } },
    ],
  },
  {
    n: 10,
    h: { ja: "お支払い", en: "Payment" },
    blocks: [
      { kind: "p", text: { ja: "ご利用いただけるお支払方法は、ご注文手続きの画面に表示し、または請求書に記載します。", en: "Available payment methods are displayed during checkout or stated on the invoice." } },
      { kind: "p", text: { ja: "お客様は、次の事項を表明していただくものとします。", en: "You confirm that:" } },
      { kind: "list", items: { ja: ["お選びのお支払方法をご利用になる権限を有していること。", "ご提供いただいたお支払いに関する情報が正確であること。", "資金が違法な行為に由来するものでないこと。", "所定の期限までにすべての金額をお支払いいただくこと。"], en: ["You are authorized to use the selected payment method.", "The payment information provided is accurate.", "The funds do not come from unlawful activity.", "You will pay all amounts by the stated deadlines."] } },
      { kind: "p", text: { ja: "ご注文は、当社がお支払いを受領し、その内容を確認するまで、お支払い済みとは扱いません。", en: "An order is not considered paid until the payment has been received and validated by Cha Jewels." } },
      { kind: "p", text: { ja: "お支払いは、第三者である決済事業者が処理する場合があります。この場合、当該事業者の規約およびプライバシーポリシーも適用されます。", en: "Payment may be processed by a third-party payment provider. That provider’s terms and privacy policy may also apply." } },
      { kind: "p", text: { ja: "お支払いが取り消され、拒否され、チャージバックされ、または後に無権限のものと判明した場合、当社は、履行を停止し、関連するポイントを取り消し、未払いの金額の回収のために合理的な措置を講じることがあります。", en: "If a payment is reversed, rejected, charged back, or later found to be unauthorized, we may suspend fulfilment, reverse related loyalty points, and take reasonable steps to recover the unpaid amount." } },
      { kind: "p", text: { ja: "本条は、お客様が誠実にお取引について異議を申し立てること、または法令上の消費者としての権利を行使することを妨げるものではありません。", en: "Nothing in this section prevents a customer from disputing a transaction in good faith or exercising a lawful consumer right." } },
    ],
  },
  {
    n: 11,
    h: { ja: "分割予約（レイアウェイ）", en: "Layaway" },
    blocks: [
      { kind: "p", text: { ja: "分割予約は、対象となるお客様が商品をお取り置きし、お引き渡しの前に合意したお支払い予定に沿ってお支払いいただく仕組みです。", en: "Layaway allows an eligible customer to reserve an item and pay according to an agreed schedule before delivery." } },
      { kind: "h", text: { ja: "分割予約の契約内容", en: "Layaway agreement" } },
      { kind: "p", text: { ja: "次の事項は、請求書、カスタマーポータルまたは書面の分割予約確認に記載します。", en: "The following information will be shown in the invoice, customer portal, or written layaway confirmation:" } },
      { kind: "list", items: { ja: ["ご注文金額の合計。", "お支払いいただく予約金。", "お支払い予定。", "お支払いの回数および各回の金額。", "最終回のお支払期日。", "適用されるキャンペーン。", "キャンセルまたは不履行の場合の条件。"], en: ["Total order price.", "Required down payment.", "Payment schedule.", "Number and amount of payments.", "Final payment date.", "Any applicable promotion.", "Cancellation or default conditions."] } },
      { kind: "p", text: { ja: "当社が通常ご用意しているのは3か月および6か月のプランです。一定の条件を満たすご購入については、より長期のプランをご案内する場合があります。ご注文について確定したプランの内容が優先します。", en: "Cha Jewels commonly offers three-month and six-month plans. Longer plans may be offered for qualifying purchases. The exact plan confirmed for the order will control." } },
      { kind: "p", text: { ja: "特に別段の明示がない限り、当社の分割予約に金利は発生しません。", en: "Unless specifically disclosed otherwise, Cha Jewels layaway does not charge interest." } },
      { kind: "h", text: { ja: "お取り置きと所有権", en: "Reservation and ownership" } },
      { kind: "p", text: { ja: "分割予約の商品は、所定の予約金を当社が受領し、その内容を確認した後に、お客様のためにお取り置きします。", en: "A layaway item is reserved for the customer after the required down payment has been received and validated." } },
      { kind: "p", text: { ja: "所有権は、ご注文の代金が全額お支払いされるまで当社に留保されます。商品は、代金全額および適用される配送料のお支払いが完了するまで、原則としてお引き渡しいたしません。", en: "Ownership remains with Cha Jewels until the order has been paid in full. The item will not normally be delivered until full payment and any applicable delivery charges have been completed." } },
      { kind: "h", text: { ja: "分割予約期間中に行う作業", en: "Services performed during layaway" } },
      { kind: "p", text: { ja: "当社は、お客様のご依頼により、最終回のお支払いの前に、サイズ直し、研磨、鑑定、修理その他ご承認いただいた作業を開始する場合があります。", en: "At the customer’s request, Cha Jewels may begin resizing, polishing, certification, repair, or another approved service before the final layaway payment." } },
      { kind: "p", text: { ja: "その後にお客様がキャンセルまたは不履行となった場合、既に発生した作業の合理的な費用は、適用される法令に従い、お客様のご負担となります。", en: "The customer remains responsible for reasonable service costs already incurred if the customer later cancels or defaults, subject to applicable law." } },
      { kind: "h", text: { ja: "繰上げでのお支払い", en: "Early payment" } },
      { kind: "p", text: { ja: "お客様は、残額を繰り上げてお支払いいただくことができ、繰上げに伴う手数料は発生しません。ただし、プランのお申込み前に異なる条件を書面で明示していた場合を除きます。", en: "Customers may complete the remaining balance early without an early-payment fee unless different written terms were disclosed before entering the plan." } },
      { kind: "h", text: { ja: "お支払いの遅延", en: "Missed payments" } },
      { kind: "p", text: { ja: "当社は、ご登録のメールアドレスまたはメッセージ窓口を通じて、お支払いのご案内をお送りすることがあります。", en: "We may send payment reminders through the customer’s registered email or messaging channel." } },
      { kind: "p", text: { ja: "お支払いの遅延が続く場合、当社は、分割予約をキャンセルする前に、ご通知のうえ遅延分をお支払いいただく機会を設けることがあります。ただし、不正その他の重大な違反により直ちに対応することが合理的に必要な場合を除きます。", en: "If a payment remains overdue, we may provide notice and an opportunity to correct the missed payment before cancelling the layaway, unless immediate action is reasonably necessary due to fraud or another serious breach." } },
      { kind: "rich", runs: { ja: [{ t: "キャンセル、予約金の取扱い、法令上認められる差引き、および残額のストアクレジットについては、当社の" }, { t: "返品・キャンセル・返金ポリシー", href: "/legal/returns" }, { t: "および個別の分割予約契約に従います。" }], en: [{ t: "Cancellation, down-payment treatment, lawful deductions, and any remaining store credit are governed by our " }, { t: "Return, Cancellation and Refund Policy", href: "/legal/returns" }, { t: " and the order-specific layaway agreement." }] } },
      { kind: "h", text: { ja: "お取り置き商品の変更", en: "Changing the reserved item" } },
      { kind: "p", text: { ja: "予約金のお支払い後に商品を変更される場合は、元のご注文のキャンセルおよび新たなご注文として取り扱い、所定のキャンセル料が発生することがあります。", en: "Changing an item after the down payment has been made is treated as cancellation of the original order and creation of a new order. Applicable cancellation charges may apply." } },
      { kind: "p", text: { ja: "キャンペーンによる例外は、当社が書面により確認した場合にのみ適用されます。", en: "A promotional exception applies only when confirmed by Cha Jewels in writing." } },
    ],
  },
  {
    n: 12,
    h: { ja: "配送とお引き渡し", en: "Shipping and Delivery" },
    blocks: [
      { kind: "p", text: { ja: "お客様は、完全かつ正確なお届け先住所をご提供いただく必要があります。", en: "Customers must provide a complete and accurate delivery address." } },
      { kind: "p", text: { ja: "お届け日は、当社が特定の日を書面で明確に保証した場合を除き、目安です。配送は、配送業者の稼働状況、通関、天候、災害、休日その他当社の合理的な支配の及ばない事情により影響を受ける場合があります。", en: "Delivery dates are estimates unless Cha Jewels expressly guarantees a specific date in writing. Delivery may be affected by carrier operations, customs, weather, disasters, holidays, or other circumstances outside our reasonable control." } },
      { kind: "p", text: { ja: "危険負担は、原則として、ご提供いただいた住所においてお届けが確認された時点でお客様に移転します。ただし、配送中の破損に関する申し立ておよび法令上の強行的な権利を妨げません。", en: "Risk of loss generally transfers to the customer when delivery is confirmed at the address provided, subject to shipping-damage claims and any mandatory legal rights." } },
      { kind: "p", text: { ja: "住所の誤り、受取の拒否、お受け取りがないこと、または関税の未払いにより荷物が返送された場合、返送および再配送に要する合理的な費用は、お客様のご負担となることがあります。", en: "If a parcel is returned because of an incorrect address, refusal, failure to collect, or unpaid customs charges, the customer may be responsible for reasonable return and redelivery costs." } },
      { kind: "p", text: { ja: "海外へのご注文については、次のとおりです。", en: "For international orders:" } },
      { kind: "list", items: { ja: ["税関が荷物を検査し、または留め置くことがあります。", "輸入に関する要件の遵守は、お受け取りになる方の責任となります。", "関税、税金および通関手数料は、通常、お受け取りになる方のご負担です。", "当社は、虚偽の価額を申告すること、または商業目的のご購入を贈答品として申告することはできません。"], en: ["Customs authorities may inspect or delay the parcel.", "The recipient is responsible for complying with import requirements.", "Customs duties, taxes, and brokerage charges are normally paid by the recipient.", "We cannot declare a false value or describe a commercial purchase as a gift."] } },
      { kind: "p", text: { ja: "送料無料のキャンペーンは、当該のご注文またはキャンペーンについて記載した条件に従う場合にのみ適用されます。", en: "Free-shipping promotions apply only under the conditions stated for the relevant order or promotion." } },
    ],
  },
  {
    n: 13,
    h: { ja: "お受け取り後のご確認", en: "Inspection After Delivery" },
    blocks: [
      { kind: "p", text: { ja: "お届け後は、速やかに商品をご確認ください。", en: "Please inspect your order promptly after delivery." } },
      { kind: "rich", runs: { ja: [{ t: "商品に誤りがある場合、破損している場合、欠品がある場合、または商品説明と重大に相違する場合は、5日以内（暦日）を目安に当社までご連絡いただき、" }, { t: "返品・キャンセル・返金ポリシー", href: "/legal/returns" }, { t: "に定める手続きに従ってください。" }], en: [{ t: "If the item is incorrect, damaged, incomplete, or materially different from its description, contact us preferably within five calendar days and follow the process in our " }, { t: "Return, Cancellation and Refund Policy", href: "/legal/returns" }, { t: "." }] } },
      { kind: "p", text: { ja: "開封の様子を撮影した動画を記録し、梱包材、タグ、鑑定書および付属品のすべてを保管されることを強くお勧めします。もっとも、開封動画は、法令上除外することができない権利を行使するための絶対の条件ではありません。", en: "We strongly recommend recording an unboxing video and keeping all packaging, tags, certificates, and accessories. However, an unboxing video is not an absolute condition for exercising a right that cannot legally be excluded." } },
    ],
  },
  {
    n: 14,
    h: { ja: "返品、キャンセルおよび返金", en: "Returns, Cancellations, and Refunds" },
    blocks: [
      { kind: "rich", runs: { ja: [{ t: "返品、キャンセル、交換、ストアクレジットおよびご返金については、当社の" }, { t: "返品・キャンセル・返金ポリシー", href: "/legal/returns" }, { t: "に従います。" }], en: [{ t: "Returns, cancellations, replacements, store credit, and refunds are governed by our " }, { t: "Return, Cancellation and Refund Policy", href: "/legal/returns" }, { t: "." }] } },
      { kind: "p", text: { ja: "概要は次のとおりです。", en: "In summary:" } },
      { kind: "list", items: { ja: ["お客様のご都合による返品は、原則としてお受けしておりません。", "お受けしたお客様のお申し出によるキャンセルは、原則としてストアクレジットでの対応となります。", "同日中のキャンセルの条件は、返金ポリシーに記載のとおりに限り適用されます。", "30%を上限とするキャンセル料が発生する場合がありますが、法令上認められる合理的な範囲を超えることはありません。", "分割予約の予約金は、法令上認められるキャンセル料として留保する場合があります。", "商品に誤りがある場合、破損している場合または契約の内容に適合しない場合における法令上の強行的な救済は、ストアクレジットに限定されません。", "適用される法令により金銭でのご返金が必要な場合は、元のお支払方法にご返金します。"], en: ["Change-of-mind returns are generally not accepted.", "Approved voluntary cancellations are normally issued as store credit.", "Same-day cancellation conditions apply only as described in the Refund Policy.", "A cancellation charge of up to 30% may apply, but it will not exceed the reasonable limit permitted by law.", "Layaway down payments may be retained as a lawful cancellation charge.", "A customer’s mandatory remedies for incorrect, damaged, or non-conforming items are not limited to store credit.", "When applicable law requires a monetary refund, it will be made through the original payment method."] } },
      { kind: "rich", runs: { ja: [{ t: "返品に関する事項について本規約と" }, { t: "返品・キャンセル・返金ポリシー", href: "/legal/returns" }, { t: "が矛盾する場合は、強行法規に反しない限り、より具体的な返品・キャンセル・返金ポリシーが適用されます。" }], en: [{ t: "If these Terms conflict with the " }, { t: "Return, Cancellation and Refund Policy", href: "/legal/returns" }, { t: " on a return-related matter, the more specific Return, Cancellation and Refund Policy will apply, subject to mandatory law." }] } },
    ],
  },
  {
    n: 15,
    h: { ja: "ジュエリーに関するサービス", en: "Jewelry Services" },
    blocks: [
      { kind: "p", text: { ja: "当社は、次のようなサービスをご提供する場合があります。", en: "Cha Jewels may offer services including:" } },
      { kind: "list", items: { ja: ["リングのサイズ直し。", "チェーンまたはジュエリーの修理。", "研磨およびクリーニング。", "宝石または真珠の糸替え。", "鑑定または鑑定機関による検査。", "その他合意した加工。"], en: ["Ring resizing.", "Chain or jewelry repair.", "Polishing and cleaning.", "Gemstone or pearl restringing.", "Certification or laboratory examination.", "Other agreed alterations."] } },
      { kind: "p", text: { ja: "作業の完了日は目安です。通常は2週間以上を要しますが、複雑な作業、鑑定機関での処理、資材の入手状況または海外への配送により、さらに日数を要する場合があります。", en: "Service completion dates are estimates. Services normally require at least two weeks, but complex work, laboratory processing, unavailable materials, or international delivery may require additional time." } },
      { kind: "p", text: { ja: "作業の過程で、事前には合理的に把握できなかった内部の劣化、過去の修理跡、金属疲労、石の緩みその他の状態が判明する場合があります。重要な追加の作業または費用が必要となる場合は、お客様にご連絡します。", en: "Some work may reveal hidden weakness, previous repair, metal fatigue, loose stones, or other conditions that could not reasonably be identified beforehand. We will contact the customer if additional material work or cost is required." } },
      { kind: "p", text: { ja: "当社は、お客様のご承認なく重要な内容の異なる追加の作業を行うことはありません。ただし、ご依頼いただいた作業を安全に完了するために合理的に必要な軽微な処置を除きます。", en: "We will not perform materially different additional work without the customer’s approval, except for minor steps reasonably necessary to complete the authorized service safely." } },
      { kind: "p", text: { ja: "名入れ、サイズ直し、刻印、修理その他の加工を行った商品は、お客様のご都合による返品の対象外となります。これは、作業の瑕疵に関する申し立てその他法令上の強行的な権利を排除するものではありません。", en: "Customized, resized, engraved, repaired, or otherwise altered items are not eligible for change-of-mind returns. This does not exclude claims relating to defective workmanship or other mandatory rights." } },
    ],
  },
  {
    n: 16,
    h: { ja: "会員プログラム", en: "Loyalty Program" },
    blocks: [
      { kind: "p", text: { ja: "対象となるお支払いには、本ウェブサイトまたはお客様アカウントに表示するプログラムの規定に基づき、Cha Jewelsのポイントが付与される場合があります。", en: "Eligible payments may earn Cha Jewels loyalty points under the program rules displayed on the website or customer account." } },
      { kind: "h", text: { ja: "ポイントの付与", en: "Crediting points" } },
      { kind: "p", text: { ja: "ポイントは、全額お支払いのご注文であるか分割予約のご注文であるかを問わず、対象となるお支払いの内容を確認した後にのみ付与します。", en: "Points are credited only after an eligible payment has been validated, whether the payment relates to a paid-in-full or layaway order." } },
      { kind: "p", text: { ja: "ポイント数、対象となる条件、会員レベル、キャンペーン、交換価値および有効期限は、該当するプログラムの案内に表示します。", en: "The number of points, eligibility rules, membership levels, promotions, redemption value, and any expiration date will be displayed in the applicable program information." } },
      { kind: "h", text: { ja: "調整", en: "Adjustments" } },
      { kind: "p", text: { ja: "当社は、次の事由により付与されたポイントを修正することがあります。", en: "We may correct points credited because of:" } },
      { kind: "list", items: { ja: ["計算上または技術上の誤り。", "キャンセルまたはご返金されたお支払い。", "お支払いの取消しまたはチャージバック。", "不正または濫用にあたる行為。", "重複したお取引。"], en: ["A calculation or technical error.", "A cancelled or refunded payment.", "A payment reversal or chargeback.", "Fraudulent or abusive activity.", "Duplicate transactions."] } },
      { kind: "p", text: { ja: "ポイントは現金ではなく、利息は付さず、当社が別途承認した場合を除き、売却または譲渡することはできません。ポイントは、法令により必要な場合を除き、現金に交換することはできません。", en: "Points are not cash, do not earn interest, and cannot be sold or transferred unless we approve otherwise. Points cannot be exchanged for cash except where required by law." } },
      { kind: "p", text: { ja: "当社は、合理的な予告をもって会員プログラムを変更または終了することがあります。法令により禁止される場合において、適切に獲得されたポイントまたは特典を不当に失わせることはありません。", en: "We may modify or discontinue the loyalty program with reasonable notice. Changes will not unfairly remove properly earned points or benefits where prohibited by law." } },
    ],
  },
  {
    n: 17,
    h: { ja: "ストアクレジット", en: "Store Credit" },
    blocks: [
      { kind: "rich", runs: { ja: [{ t: "当社の" }, { t: "返品・キャンセル・返金ポリシー", href: "/legal/returns" }, { t: "に基づき付与するストアクレジットの取扱いは、次のとおりです。" }], en: [{ t: "Store credit issued under our " }, { t: "Return, Cancellation and Refund Policy", href: "/legal/returns" }, { t: ":" }] } },
      { kind: "list", items: { ja: ["原則として、付与日から12か月間有効です。", "ご購入されたお客様ご本人に紐づきます。", "書面による承認がない限り、譲渡することはできません。", "在庫のあるCha Jewelsの商品にご利用いただけます。", "法令により必要な場合を除き、売却または現金への交換はできません。", "法令上認められる範囲において、明示した有効期間の経過により失効します。"], en: ["Is normally valid for 12 months from the date of issue.", "Is connected to the original customer.", "Is non-transferable unless approved in writing.", "May be used for available Cha Jewels products.", "Cannot be sold or exchanged for cash except when required by law.", "Expires after the disclosed validity period where permitted by law."] } },
      { kind: "p", text: { ja: "ストアクレジットとポイントは別個の特典であり、適用される規定が異なる場合があります。", en: "Store credit and loyalty points are separate benefits and may have different rules." } },
    ],
  },
  {
    n: 18,
    h: { ja: "キャンペーンおよび割引コード", en: "Promotions and Discount Codes" },
    blocks: [
      { kind: "p", text: { ja: "キャンペーン、割引コード、送料無料、特別な予約金額および回数を限定したお支払いプランは、それぞれの案内に記載の条件に従います。", en: "Promotions, discount codes, free shipping, special reservation amounts, and limited-payment plans are subject to the conditions stated in the relevant offer." } },
      { kind: "p", text: { ja: "別段の記載がない限り、次のとおりです。", en: "Unless otherwise stated:" } },
      { kind: "list", items: { ja: ["キャンペーンの併用はできません。", "割引に現金としての価値はありません。", "キャンペーンは、記載の期間中にのみ適用されます。", "対象となるかどうかは、商品、ご注文金額、お支払方法、地域またはお客様の区分により異なる場合があります。", "キャンペーン価格を遡って適用することはできません。"], en: ["Promotions cannot be combined.", "Discounts have no cash value.", "Promotions apply only during the stated period.", "Eligibility may depend on product, order value, payment method, location, or customer status.", "Promotional pricing cannot be applied retroactively."] } },
      { kind: "p", text: { ja: "当社は、明らかな誤りを含むキャンペーンを中止または訂正することがありますが、法令により必要な場合は、承諾済みのご注文についてはその内容を尊重します。", en: "We may cancel or correct a promotion containing a clear mistake, but we will honour accepted orders where required by law." } },
    ],
  },
  {
    n: 19,
    h: { ja: "本ウェブサイトのご利用にあたって", en: "Acceptable Use of Our Website" },
    blocks: [
      { kind: "p", text: { ja: "お客様は、次の行為を行わないものとします。", en: "You must not:" } },
      { kind: "list", items: { ja: ["違法、不正または欺瞞的な行為のために本ウェブサイトを利用すること。", "アカウントまたはシステムへ不正にアクセスしようとすること。", "本ウェブサイトのセキュリティまたは運営を妨げること。", "悪意のあるコードまたは有害なコンテンツを送信すること。", "許可なく本ウェブサイトのコンテンツを相当量にわたり取得、複製または転載すること。", "他人になりすますこと。", "無権限のお支払い情報を用いてご注文を行うこと。", "キャンペーン、ポイント、ストアクレジット、返品またはお支払いに関する異議申立てを濫用すること。", "当社の推奨または提携があると誤解させる形で当社の知的財産を使用すること。"], en: ["Use the website for unlawful, fraudulent, or deceptive activity.", "Attempt to gain unauthorized access to an account or system.", "Interfere with website security or operation.", "Upload malicious code or harmful content.", "Scrape, copy, or reproduce substantial website content without permission.", "Impersonate another person.", "Place orders using unauthorized payment information.", "Abuse promotions, loyalty points, store credit, returns, or payment disputes.", "Use our intellectual property in a way that falsely suggests endorsement or affiliation."] } },
      { kind: "p", text: { ja: "当社は、これらの行為を防止し、または調査するために合理的に必要な場合、ご利用を制限することがあります。", en: "We may restrict access when reasonably necessary to prevent or investigate these activities." } },
    ],
  },
  {
    n: 20,
    h: { ja: "レビュー、写真およびお客様のコンテンツ", en: "Reviews, Photographs, and Customer Content" },
    blocks: [
      { kind: "p", text: { ja: "お客様が公開を目的としてレビュー、ご感想、写真、動画その他のコンテンツを任意にご提供いただく場合、次の事項を表明していただくものとします。", en: "If you voluntarily submit a review, testimonial, photograph, video, or other content for publication, you confirm that:" } },
      { kind: "list", items: { ja: ["お客様が作成されたものであるか、使用の許諾を得ていること。", "他人の権利を侵害しないこと。", "お客様の認識において、虚偽、違法、威迫的または誤解を招くものでないこと。"], en: ["You created it or have permission to use it.", "It does not violate another person’s rights.", "It is not knowingly false, unlawful, threatening, or misleading."] } },
      { kind: "p", text: { ja: "公開をご承諾いただいた場合、お客様は当社に対し、当社のウェブサイト、ソーシャルメディアおよび販促のために、当該コンテンツを複製し、体裁を整えるために編集し、翻訳し、および表示するための、非独占的、世界的かつ無償の使用許諾を付与するものとします。", en: "When you authorize publication, you grant Cha Jewels a non-exclusive, worldwide, royalty-free license to reproduce, edit for formatting, translate, and display the content for Cha Jewels’ website, social media, and marketing." } },
      { kind: "p", text: { ja: "コンテンツの権利はお客様に留保されます。当社は、法令上認められる場合または紛争の解決のために必要な場合を除き、許可なくお客様との個別のメッセージまたは私的な写真を公に使用することはありません。", en: "You retain ownership of your content. We will not publicly use private customer messages or personal photographs without permission, except where legally permitted or necessary to resolve a dispute." } },
    ],
  },
  {
    n: 21,
    h: { ja: "知的財産", en: "Intellectual Property" },
    blocks: [
      { kind: "p", text: { ja: "Cha Jewelsの名称、ブランド表示、ウェブサイトのデザイン、写真、商品説明、動画、図版その他のオリジナルの素材は、当社が権利を有し、または使用の許諾を受けているものです。", en: "The Cha Jewels name, branding, website design, photographs, product descriptions, videos, graphics, and other original materials are owned by or licensed to Cha Jewels." } },
      { kind: "p", text: { ja: "お客様は、個人的なお買い物の目的で本ウェブサイトをご覧いただき、ご利用いただけます。書面による許可なく、当社の素材を複製し、販売し、商業的に利用し、またはお客様自身のものとして表示することはできません。", en: "You may view and use the website for personal shopping purposes. You may not reproduce, sell, commercially exploit, or falsely represent our materials as your own without written permission." } },
      { kind: "p", text: { ja: "第三者の商標およびブランド名は、それぞれの権利者に帰属します。", en: "Third-party trademarks and brand names remain the property of their respective owners." } },
    ],
  },
  {
    n: 22,
    h: { ja: "個人情報とご連絡", en: "Privacy and Communications" },
    blocks: [
      { kind: "rich", runs: { ja: [{ t: "当社による個人情報の取得および利用については、当社の" }, { t: "プライバシーポリシー", href: "/legal/privacy" }, { t: "に記載しています。" }], en: [{ t: "Our collection and use of personal information are described in our " }, { t: "Privacy Policy", href: "/legal/privacy" }, { t: "." }] } },
      { kind: "p", text: { ja: "ご注文をもって、お客様は、次のものを含む取引上必要なご連絡をお受けいただくことに同意されたものとみなします。", en: "By placing an order, you agree to receive necessary transactional communications, including:" } },
      { kind: "list", items: { ja: ["ご注文確認。", "お支払いのご案内。", "分割予約に関するお知らせ。", "配送に関するご連絡。", "作業の進捗に関するご連絡。", "セキュリティおよびアカウントに関するお知らせ。"], en: ["Order confirmations.", "Payment reminders.", "Layaway updates.", "Delivery notices.", "Service updates.", "Security and account notices."] } },
      { kind: "p", text: { ja: "販促のご連絡は、ご同意に基づき、またはその他法令上認められる範囲でお送りします。お客様は、ご注文に関する必要なご連絡を停止することなく、販促のご連絡の受信を停止いただけます。", en: "Promotional communications are sent based on consent or as otherwise permitted by law. You may opt out of marketing without stopping necessary order-related messages." } },
    ],
  },
  {
    n: 23,
    h: { ja: "第三者のサービスおよびリンク", en: "Third-Party Services and Links" },
    blocks: [
      { kind: "p", text: { ja: "本ウェブサイトには、決済事業者、配送会社、メッセージ基盤、ソーシャルメディアその他の第三者へのリンクが含まれる場合があります。", en: "Our website may link to payment providers, delivery companies, messaging platforms, social-media services, or other third parties." } },
      { kind: "p", text: { ja: "これらのサービスは、それぞれの規約およびプライバシーポリシーに基づき運営されています。当社は、法令上責任を免れることができない場合、または当該第三者が当社に代わって行為する場合を除き、独立した第三者のコンテンツまたは行為について責任を負いません。", en: "Those services operate under their own terms and privacy policies. Cha Jewels is not responsible for an independent third party’s content or conduct, except to the extent responsibility cannot legally be excluded or the third party acts on our behalf." } },
    ],
  },
  {
    n: 24,
    h: { ja: "サービスのご提供", en: "Service Availability" },
    blocks: [
      { kind: "p", text: { ja: "当社は、本ウェブサイトおよびお客様向けのサービスを利用可能かつ正確な状態に保つよう努めますが、中断がないことまたは誤りがないことを保証することはできません。", en: "We aim to keep the website and customer services available and accurate, but we cannot guarantee uninterrupted or error-free operation." } },
      { kind: "p", text: { ja: "当社は、保守、セキュリティ、技術上の問題または法令の遵守のため、本ウェブサイトを一時的に停止し、または更新することがあります。これは、合理的に必要な場合を除き、既に承諾したご注文に影響を及ぼすものではなく、当社はお客様への影響を最小限にとどめるため適切な措置を講じます。", en: "We may temporarily suspend or update the website for maintenance, security, technical problems, or legal compliance. This does not affect already accepted orders except where reasonably necessary, and we will take appropriate steps to minimize customer impact." } },
    ],
  },
  {
    n: 25,
    h: { ja: "責任の制限", en: "Limitation of Liability" },
    blocks: [
      { kind: "p", text: { ja: "本規約は、故意、重大な過失または消費者保護に関する強行法規に基づく責任を含め、法令上免除することができない責任を排除または制限するものではありません。", en: "Nothing in these Terms excludes or limits liability that cannot legally be excluded, including liability arising from intentional misconduct, gross negligence, or mandatory consumer-protection law." } },
      { kind: "p", text: { ja: "法令上認められる範囲において、次のとおりとします。", en: "To the extent permitted by law:" } },
      { kind: "list", items: { ja: ["当社は、ご注文の時点において合理的に予見することができなかった間接損害または派生的損害について責任を負いません。", "軽過失による損害については、当社の責任は、原則として当該ご注文についてお支払いいただいた金額を限度とします。", "当社は、お客様がご提供された情報の誤りのみに起因する損害、またはお客様による当社サービスの無権限の利用のみに起因する損害について責任を負いません。"], en: ["Cha Jewels is not responsible for indirect or consequential losses that were not reasonably foreseeable when the order was placed.", "For loss caused by ordinary negligence, our liability will generally be limited to the amount paid for the affected order.", "We are not responsible for loss caused solely by inaccurate information provided by the customer or the customer’s unauthorized use of our services."] } },
      { kind: "p", text: { ja: "これらの制限は、破損、誤り、説明との相違または契約の内容への不適合に関するお客様の権利に影響を及ぼしません。", en: "These limitations do not affect a customer’s rights relating to damaged, incorrect, misdescribed, or non-conforming products." } },
    ],
  },
  {
    n: 26,
    h: { ja: "当社の支配の及ばない事由", en: "Events Outside Our Reasonable Control" },
    blocks: [
      { kind: "p", text: { ja: "当社は、自然災害、悪天候、火災、戦争、内乱、政府による措置、通関上の規制、配送業者の混乱、労働争議、感染症の流行、通信の障害または大規模なシステム障害を含め、当社の合理的な支配の及ばない事情による遅延について責任を負いません。", en: "We are not responsible for delay caused by circumstances outside our reasonable control, including natural disasters, severe weather, fire, war, civil disturbance, government action, customs restrictions, carrier disruption, labour disputes, epidemics, communication failures, or major system outages." } },
      { kind: "p", text: { ja: "当社は、影響を受けるお客様へのご連絡および履行の再開のために合理的な措置を講じます。履行が不能となった場合は、適用される法令上必要な対応を行います。", en: "We will take reasonable steps to notify affected customers and resume performance. If fulfilment becomes impossible, we will provide the resolution required by applicable law." } },
    ],
  },
  {
    n: 27,
    h: { ja: "利用の停止および終了", en: "Suspension or Termination" },
    blocks: [
      { kind: "p", text: { ja: "お客様は、いつでも本ウェブサイトのご利用をおやめいただけます。", en: "You may stop using the website at any time." } },
      { kind: "p", text: { ja: "当社は、本規約の重大な違反、不正、無権限のお支払い、脅迫、濫用または違法な行為があった場合、アカウントの利用を停止または終了することがあります。", en: "We may suspend or terminate an account for a material violation of these Terms, fraud, unauthorized payments, threats, abuse, or unlawful conduct." } },
      { kind: "p", text: { ja: "アカウントの利用停止により、承諾済みのご注文が当然にキャンセルされるものではなく、既存のお支払義務、返金を受ける権利、ポイント残高またはストアクレジットが失われるものでもありません。これらは、該当するご注文の条件および法令に従って取り扱います。", en: "Account suspension does not automatically cancel an accepted order or remove existing payment obligations, refund rights, loyalty balances, or store credit. These will be handled under the applicable order terms and law." } },
    ],
  },
  {
    n: 28,
    h: { ja: "本規約の変更", en: "Changes to These Terms" },
    blocks: [
      { kind: "p", text: { ja: "当社は、サービス、事業上の運用または法令上の義務に変更が生じた場合、本規約を改定することがあります。", en: "We may update these Terms when our services, business practices, or legal obligations change." } },
      { kind: "p", text: { ja: "改定後の本規約は、新たな「最終更新日」とともに掲載します。重要な変更は、法令上直ちに変更することが必要な場合またはお客様が別途同意された場合を除き、将来に向かって適用されます。", en: "Updated Terms will be posted with a new “Last updated” date. Material changes will apply prospectively unless an immediate change is legally required or the customer agrees otherwise." } },
      { kind: "p", text: { ja: "ご注文が確定した時点で適用されていた条件は、原則として当該ご注文について引き続き適用されます。", en: "The terms accepted when an order was confirmed will generally continue to govern that order." } },
    ],
  },
  {
    n: 29,
    h: { ja: "準拠法および紛争の解決", en: "Governing Law and Disputes" },
    blocks: [
      { kind: "p", text: { ja: "本規約および当社とのお取引は、日本法に準拠します。", en: "These Terms and transactions with Cha Jewels are governed by the laws of Japan." } },
      { kind: "p", text: { ja: "ご懸念がある場合は、公正かつ速やかな解決に努めますので、まず当社までご連絡いただくことをお勧めします。", en: "We encourage customers to contact us first so we can attempt to resolve any concern fairly and promptly." } },
      { kind: "p", text: { ja: "管轄に関する消費者の強行的な権利を妨げない限り、本規約または当社とのお取引に起因する紛争については、東京地方裁判所または東京簡易裁判所を管轄裁判所とします。", en: "Subject to any mandatory consumer right concerning jurisdiction, the Tokyo District Court or Tokyo Summary Court will have jurisdiction over disputes arising from these Terms or a Cha Jewels transaction." } },
      { kind: "p", text: { ja: "本条は、お客様が所轄の消費者保護機関にご連絡いただくこと、またはお住まいの地域において認められる強行的な権利を行使することを妨げるものではありません。", en: "Nothing in this section prevents a customer from contacting a competent consumer-protection authority or exercising a mandatory right available where the customer lives." } },
    ],
  },
  {
    n: 30,
    h: { ja: "一般条項", en: "General Provisions" },
    blocks: [
      { kind: "p", text: { ja: "本規約の一部が無効または執行不能と判断された場合、当該部分は必要な範囲においてのみ限定または削除され、その他の条項は引き続き適用されます。", en: "If any part of these Terms is found invalid or unenforceable, that part will be limited or removed only to the extent necessary. The remaining Terms will continue to apply." } },
      { kind: "p", text: { ja: "当社が権利の行使を遅滞したとしても、当該権利を放棄したことを意味するものではありません。", en: "A delay in enforcing a right does not mean that Cha Jewels has waived that right." } },
      { kind: "p", text: { ja: "お客様は、当社の書面による承認なく、ご注文、アカウント、分割予約契約、ポイントまたはストアクレジットを譲渡することはできません。当社は、お客様の権利が実質的に減縮されない限り、正当な事業の承継の一部として、その権利および義務を移転することがあります。", en: "You may not transfer an order, account, layaway agreement, loyalty points, or store credit without our written approval. Cha Jewels may transfer its rights and obligations as part of a legitimate business transfer, provided customer rights are not materially reduced." } },
      { kind: "p", text: { ja: "本規約、確定したご注文の内容、適用される各ポリシー、および個別のご注文に関する書面による合意が、当社とお客様との間の合意を構成します。", en: "These Terms, the confirmed order information, applicable policies, and any written order-specific agreement constitute the agreement between Cha Jewels and the customer." } },
    ],
  },
  {
    n: 31,
    h: { ja: "お問い合わせ", en: "Contact Us" },
    blocks: [
      { kind: "p", text: { ja: "本規約に関するご質問は、次の窓口までお寄せください。", en: "Questions about these Terms may be directed to:" } },
      { kind: "lines", lines: { ja: [COMPANY_NAME, "代表取締役：Cynthia Largo"], en: [COMPANY_NAME, "Representative Director: Cynthia Largo"] } },
      { kind: "lines", lines: { ja: ["〒124-0012", "東京都葛飾区立石6-5-1", "タイムマンション301"], en: ["Time Mansion 301", "6-5-1 Tateishi, Katsushika-ku", "Tokyo 124-0012, Japan"] } },
      { kind: "lines", lines: { ja: ["メールアドレス：sales@chajewelsjp.com", "Messenger：m.me/chajewelsjapan"], en: ["Email: sales@chajewelsjp.com", "Messenger: m.me/chajewelsjapan"] } },
    ],
  },
];

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
  | { kind: "h"; text: Record<Lang, string> }
  | { kind: "list"; items: Record<Lang, string[]> }
  | { kind: "lines"; lines: Record<Lang, string[]> };

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

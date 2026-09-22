import type { Lang } from "@/lib/i18n";
import type { LegalBlock } from "@/lib/content/legal";

/**
 * PREVIEW FIXTURE SOURCE ONLY, SINCE 2026-09-22. The site reads the FAQ from
 * the Hub (lib/faq.ts); this file is what lib/fixtures.ts converts into the
 * preview's FAQ so `NEXT_PUBLIC_PREVIEW_FIXTURES=1` exercises the real markdown
 * path against the real answers. NOTHING ON A PRODUCTION PATH READS IT. It was
 * kept rather than deleted for exactly that one importer; deleting it means
 * first giving lib/fixtures.ts a literal copy of the 39 seeded answers.
 *
 * The live answers are the Hub's rows. If this file and the Hub disagree, the
 * HUB is right and this is a stale preview — the reverse of what follows, which
 * was written when this file was the site.
 *
 * THE FAQ IS AUTHORITATIVE (owner-confirmed 2026-09-16).
 *
 * Where this file and another page disagree about a fact, this file is right
 * and the other page is out of date. Three facts were changed across the site
 * to match it, and each had a stale value somewhere:
 *
 *   - LAYAWAY is three, six and eight months — eight for qualifying orders of
 *     ¥300,000 or more. Not "three to six, stretching to eight".
 *   - A CLAIM IS HELD 24 hours for a new customer and 72 for a returning one.
 *     The 60-minute hold is the OLD rule. `loyalty_tiers.hold_minutes` in the
 *     Hub still says 60 and is NOT authoritative — see the PR, and note the
 *     Hub does not act on it at all today.
 *   - LOYALTY earns 1% at Glimmer, the first tier. Higher tiers multiply above
 *     that base. "¥10,000 = 100 points" was the same rate stated without the
 *     tier, which read as if it were the only rate.
 *
 * The English is Cynthia's, verbatim. The Japanese is MY TRANSLATION and is a
 * DRAFT needing a native read, in the same 敬体 register and with the same
 * settled renderings as the three legal pages.
 *
 * Answers are LegalBlock[] — the same shape the legal pages use, rendered by
 * the same component, so a bullet here is the same native list-disc marker as a
 * bullet in the privacy policy and cannot reintroduce the "\2022" defect.
 * The page renders this list twice, visibly and as FAQPage JSON-LD, and both
 * come from these blocks so the structured data cannot drift from the prose.
 */
export type FaqEntry = { q: Record<Lang, string>; a: LegalBlock[] };
export type FaqSection = { h: Record<Lang, string>; items: FaqEntry[] };

export const faqSections: FaqSection[] = [
  {
    h: { ja: "商品と真贋", en: "Products and Authenticity" },
    items: [
      {
        q: { ja: "Cha Jewelsの商品は本物ですか？", en: "Are Cha Jewels products authentic?" },
        a: [
          { kind: "p", text: { ja: "はい。当社はジュエリーを検品し、素材、刻印、グラム重量、状態、宝石、および付属する鑑定書の有無を各商品ページに明記しています。", en: "Yes. We inspect our jewelry and clearly describe the material, hallmark, gram weight, condition, gemstones, and available certification in each listing." } },
          { kind: "p", text: { ja: "ダイヤモンドの鑑定書、鑑別書、ブランドの付属品および元の箱は、商品説明に特に記載がある場合にのみ付属します。", en: "Diamond certificates, laboratory reports, branded accessories, and original packaging are included only when specifically stated in the product description." } },
        ],
      },
      {
        q: { ja: "「プレラブド」とはどういう意味ですか？", en: "What does “preloved” mean?" },
        a: [
          { kind: "p", text: { ja: "プレラブドとは、以前の所有者がいたジュエリーを指します。軽微な傷、汚れ、修理跡その他の通常の使用感が見られる場合があります。", en: "Preloved means the jewelry has had a previous owner. It may show minor scratches, marks, repairs, or other signs of normal wear." } },
          { kind: "p", text: { ja: "把握している状態については、商品説明、写真および動画で開示しており、ご注文の前にご確認いただけます。開示済みの使用感は不具合とはみなしません。", en: "We disclose known condition details through descriptions, photographs, and videos so customers can review the piece before ordering. Disclosed signs of previous use are not considered defects." } },
        ],
      },
      {
        q: { ja: "Cha Jewelsの商品はすべて日本製ですか？", en: "Are all Cha Jewels products made in Japan?" },
        a: [
          { kind: "p", text: { ja: "当社では、K18ゴールド、プラチナ、あこや真珠、ダイヤモンド、カラーストーン、手作りの宝石ブレスレットなど、日本製および日本で調達したジュエリーをお取り扱いしています。", en: "We offer Japan-made and Japan-sourced jewelry, including K18 gold, platinum, Akoya pearls, diamonds, colored gemstones, and handmade gemstone bracelets." } },
          { kind: "p", text: { ja: "あわせて、厳選した海外のプレラブド・ラグジュアリーブランドもお取り扱いしています。各商品の産地、素材および判明している詳細は、商品ページに記載しています。", en: "We also offer selected preloved international luxury brands. The origin, material, and available details of each item are stated in its listing." } },
        ],
      },
      {
        q: { ja: "実際の色が写真と少し違って見えることがあるのはなぜですか？", en: "Why might the actual color look slightly different from the photograph?" },
        a: [
          { kind: "p", text: { ja: "照明、撮影、画面設定および端末の表示により、色の見え方が異なる場合があります。また、天然石、真珠および手作りのブレスレットには、色、形状、内包物、模様に個体差があります。", en: "Lighting, photography, screen settings, and device displays can affect how colors appear. Natural gemstones, pearls, and handmade bracelets may also have unique variations in color, shape, inclusions, and pattern." } },
          { kind: "p", text: { ja: "軽微な見え方の違いは必ずしも不具合ではありませんが、商品が説明と重大に相違する場合は当社までご連絡ください。", en: "A minor visual difference is not necessarily a defect, but please contact us if the item is materially different from its description." } },
        ],
      },
      {
        q: { ja: "ダイヤモンドや宝石には必ず鑑定書が付きますか？", en: "Does every diamond or gemstone include a certificate?" },
        a: [
          { kind: "p", text: { ja: "いいえ。鑑定書または鑑別書は、商品ページに記載がある場合にのみ付属します。", en: "No. A certificate or laboratory report is included only when stated in the product listing." } },
          { kind: "p", text: { ja: "対象となる商品については、鑑定をご依頼いただくこともできます。別途費用および日数を要する場合があります。", en: "Certification may also be requested for eligible items. Additional fees and processing time may apply." } },
        ],
      },
      {
        q: { ja: "ジュエリーの将来の価値は保証されますか？", en: "Is the future value of my jewelry guaranteed?" },
        a: [
          { kind: "p", text: { ja: "いいえ。金、宝石、ブランドジュエリーその他の貴重品の価値は、市場の状況、商品の状態、需要、為替相場および再販に要する費用により、維持されることも、上昇することも、下落することもあります。", en: "No. Gold, gemstones, branded jewelry, and other precious items may retain, increase, or decrease in value depending on market conditions, condition, demand, currency rates, and resale costs." } },
          { kind: "p", text: { ja: "ジュエリーを資産または投資として言及する場合も、価値の上昇、利益、再販価格または将来の換金性を保証するものではありません。", en: "References to jewelry as an asset or investment do not guarantee appreciation, profit, resale value, or future liquidity." } },
        ],
      },
    ],
  },
  {
    h: { ja: "ご注文とライブ販売でのご予約", en: "Orders and Live-Selling Claims" },
    items: [
      {
        q: { ja: "ライブ販売で商品を予約するにはどうすればよいですか？", en: "How do I claim an item during Live selling?" },
        a: [
          { kind: "p", text: { ja: "ライブ中にご案内する予約の方法に従ってください。ご興味をお示しいただくコメントやメッセージだけでは、ご購入は確定しません。", en: "Follow the claiming instructions announced during the Live. A comment or message expressing interest does not automatically confirm the sale." } },
          { kind: "p", text: { ja: "ご注文は、当社が在庫を確認し、商品を割り当て、請求書または書面のご注文確認をお送りした後に確定します。", en: "The order is confirmed after Cha Jewels verifies availability, allocates the item, and sends an invoice or written order confirmation." } },
        ],
      },
      {
        q: { ja: "ライブで予約した商品をすぐにお支払いしない場合はどうなりますか？", en: "What happens if I claim a piece during Live but do not pay immediately?" },
        a: [
          { kind: "p", text: { ja: "ご予約いただいた商品は、原則として次の期間お取り置きします。", en: "A claimed item is normally reserved for:" } },
          { kind: "list", items: { ja: ["はじめてのお客様：24時間まで。", "2回目以降のお客様：72時間まで。"], en: ["New customers: Up to 24 hours.", "Returning customers: Up to 72 hours."] } },
          { kind: "p", text: { ja: "この期限は、異なるキャンペーン条件を明確にご案内している場合を除き、会員レベルを問わず適用されます。", en: "The deadline applies regardless of loyalty level unless different promotional terms are clearly announced." } },
          { kind: "p", text: { ja: "期限までに所定のお支払い、予約金のお支払い、または当社が承認したお取り決めが完了しない場合、商品のお取り置きを解除し、改めて販売することがあります。この場合、事前のご連絡はいたしません。", en: "If the required payment, down payment, or approved arrangement is not completed before the deadline, the item may be released and returned for sale without further notice." } },
        ],
      },
      {
        q: { ja: "少額で商品をお取り置きできますか？", en: "Can I reserve an item with a small amount?" },
        a: [
          { kind: "p", text: { ja: "予約金額を引き下げた取扱いは、キャンペーンの一環として特にご案内している場合にのみご利用いただけます。", en: "A reduced reservation amount is available only when specifically offered as part of a promotion." } },
          { kind: "p", text: { ja: "キャンペーン期間外は、通常の全額お支払い、または分割予約の予約金のお支払いが必要です。所定のお支払いのないメッセージまたは口頭のお約束では、商品は確保されません。", en: "Outside a promotion, the standard full-payment or layaway down-payment requirement applies. A message or verbal promise without the required payment does not secure the item." } },
        ],
      },
      {
        q: { ja: "ご注文後に商品がご用意できなくなった場合はどうなりますか？", en: "What happens if an item becomes unavailable after I order it?" },
        a: [
          { kind: "p", text: { ja: "当社のプレラブド商品は一点物が多く、複数の販売経路でご案内している場合があります。", en: "Many of our preloved pieces are unique and may be offered through more than one sales channel." } },
          { kind: "p", text: { ja: "割り当ての確定前に商品がご用意できなくなった場合は、お客様にご連絡します。既に代金をお受けしている場合は、適切な代替品、お客様がご了承されたストアクレジット、または元のお支払方法でのご返金をご案内します。", en: "If an item becomes unavailable before your allocation is confirmed, we will inform you. If payment was already received, we will offer a suitable alternative, an accepted store-credit option, or a refund through the original payment method." } },
        ],
      },
      {
        q: { ja: "予約金のお支払い後に別の商品へ変更できますか？", en: "Can I change to another item after paying my down payment?" },
        a: [
          { kind: "p", text: { ja: "お取り置き商品の変更は、元のご注文のキャンセルおよび新たなご注文として取り扱います。", en: "Changing the reserved item is treated as cancellation of the original order and creation of a new order." } },
          { kind: "rich", runs: { ja: [{ t: "キャンセル料またはストアクレジットの条件は、当社の" }, { t: "返品・キャンセル・返金ポリシー", href: "/legal/returns" }, { t: "に従います。例外は、当社が書面により承認した場合にのみ適用されます。" }], en: [{ t: "Cancellation charges or store-credit conditions may apply under our " }, { t: "Return, Cancellation and Refund Policy", href: "/legal/returns" }, { t: ". An exception applies only when Cha Jewels approves it in writing." }] } },
        ],
      },
    ],
  },
  {
    h: { ja: "お支払いと分割予約", en: "Payments and Layaway" },
    items: [
      {
        q: { ja: "どのようなお支払方法が使えますか？", en: "What payment methods do you accept?" },
        a: [
          { kind: "p", text: { ja: "ご利用いただけるお支払方法は、ご注文手続きの画面に表示し、または請求書に記載します。ご注文は、当社がお支払いを受領し、その内容を確認した後にお支払い済みとなります。", en: "Available payment methods are displayed at checkout or stated on your invoice. Payment must be received and validated before an order is considered paid." } },
          { kind: "p", text: { ja: "お客様の金融機関、カード発行会社または決済事業者が、別途の取引手数料または為替手数料を課す場合があります。", en: "Your bank, card issuer, or payment provider may charge separate transaction or currency-conversion fees." } },
        ],
      },
      {
        q: { ja: "フィリピンペソで支払えますか？", en: "Can I pay in Philippine pesos?" },
        a: [
          { kind: "p", text: { ja: "フィリピンペソでのお支払いは、請求書に特に記載がある場合、または当社が承認したお支払方法によりご利用いただける場合があります。", en: "Philippine-peso payment may be available when it is specifically provided on your invoice or through an approved payment method." } },
          { kind: "p", text: { ja: "ウェブサイトに表示するペソ金額は参考の概算です。実際のお支払額は、最終の請求書、決済事業者の為替レートおよび適用される手数料により決まります。", en: "Peso figures displayed on the website are indicative estimates. Your final invoice, payment provider’s exchange rate, and applicable fees determine the actual amount payable." } },
        ],
      },
      {
        q: { ja: "分割予約にはどのようなプランがありますか？", en: "What layaway plans are available?" },
        a: [
          { kind: "p", text: { ja: "当社の標準的な無利息の分割予約プランは次のとおりです。", en: "Our standard interest-free layaway options are:" } },
          { kind: "list", items: { ja: ["3か月", "6か月", "8か月（¥300,000以上の対象となるご注文）"], en: ["Three months", "Six months", "Eight months for qualifying orders of ¥300,000 or more"] } },
          { kind: "p", text: { ja: "承認されたお支払い予定は、請求書またはカスタマーポータルに表示します。キャンペーンのプランは条件が異なる場合があります。", en: "The approved payment schedule will be shown on your invoice or customer portal. Promotional plans may have different conditions." } },
        ],
      },
      {
        q: { ja: "分割予約の予約金はいくらですか？", en: "How much is the layaway down payment?" },
        a: [
          { kind: "p", text: { ja: "標準の予約金は、原則としてご注文金額の合計の30%です。", en: "The standard down payment is normally 30% of the total order price." } },
          { kind: "p", text: { ja: "キャンペーンによっては、予約金額の引き下げまたは異なる予約金の条件をご案内する場合があります。キャンペーンによる例外は、ご案内した期間中に限り適用され、書面による確認が必要です。", en: "Some promotions may offer a reduced reservation amount or different down-payment conditions. A promotional exception applies only during the announced period and must be confirmed in writing." } },
        ],
      },
      {
        q: { ja: "分割予約に金利はかかりますか？", en: "Does Cha Jewels charge interest on layaway?" },
        a: [
          { kind: "p", text: { ja: "当社の標準的な分割予約プランは金利0%です。お客様は、承認されたお支払い予定に沿って、確定した商品代金をお支払いいただきます。", en: "Our standard layaway plans are 0% interest. Customers pay the confirmed product price according to the approved schedule." } },
          { kind: "p", text: { ja: "決済事業者の手数料、為替手数料、配送料、作業費用および関税は別途のものであり、分割予約の金利には該当しません。", en: "Payment-provider, currency-conversion, delivery, service, or customs fees are separate and are not considered layaway interest." } },
        ],
      },
      {
        q: { ja: "分割予約のお支払いが遅れた場合はどうなりますか？", en: "What happens if I miss a layaway payment?" },
        a: [
          { kind: "p", text: { ja: "当社は、ご登録のメールアドレスまたはメッセージ窓口を通じて、自動のご案内をお送りする場合があります。", en: "We may send an automated reminder using your registered email address or messaging channel." } },
          { kind: "rich", runs: { ja: [{ t: "お支払いの遅延が続く場合、当社は、分割予約をキャンセルする前に、ご通知のうえ遅延分をお支払いいただく機会を設けることがあります。キャンセル料、予約金の取扱いおよび残額については、適用される分割予約規約および" }, { t: "返品・キャンセル・返金ポリシー", href: "/legal/returns" }, { t: "に従って取り扱います。" }], en: [{ t: "If payment remains overdue, we may provide notice and an opportunity to correct it before cancelling the layaway. Cancellation charges, down-payment treatment, and any remaining balance are handled according to the applicable Layaway Terms and " }, { t: "Return, Cancellation and Refund Policy", href: "/legal/returns" }, { t: "." }] } },
        ],
      },
      {
        q: { ja: "分割予約を繰り上げて完済できますか？", en: "Can I pay off my layaway early?" },
        a: [
          { kind: "p", text: { ja: "はい。プランのお申込み前に異なる条件を明示していた場合を除き、残額を繰り上げてお支払いいただけ、繰上げに伴う手数料は発生しません。", en: "Yes. You may complete your remaining balance early without an early-payment charge unless different conditions were disclosed before the plan began." } },
        ],
      },
      {
        q: { ja: "分割予約の商品を完済前に発送してもらえますか？", en: "Can my layaway item be shipped before it is fully paid?" },
        a: [
          { kind: "p", text: { ja: "いいえ。分割予約の商品は、原則として、残額全額および適用される送料のお支払いを受領し、その内容を確認した後にのみ発送します。", en: "No. Layaway items are normally shipped only after the full balance and applicable shipping charges have been paid and validated." } },
          { kind: "p", text: { ja: "もっとも、サイズ直し、研磨、修理、鑑定などご依頼いただいた作業は、完済後すぐに発送できるよう、最終回のお支払いの前に開始する場合があります。", en: "However, requested services such as resizing, polishing, repair, or certification may begin before the final payment so the item can be prepared for prompt shipment after completion of payment." } },
        ],
      },
    ],
  },
  {
    h: { ja: "ポイントとストアクレジット", en: "Loyalty Points and Store Credit" },
    items: [
      {
        q: { ja: "ポイントはどのように貯まりますか？", en: "How do I earn loyalty points?" },
        a: [
          { kind: "p", text: { ja: "対象となるお支払いには、全額お支払いのご注文か分割予約のご注文かを問わず、各回のお支払いの内容を確認した後にポイントが付与されます。", en: "Eligible payments earn loyalty points after each payment has been validated, whether the payment is for a paid-in-full order or a layaway order." } },
          { kind: "p", text: { ja: "標準の付与率1%の場合、対象となる¥100,000のお支払いで1,000ポイントが付与されます。キャンペーンの付与率および対象外となる条件は異なる場合があります。", en: "At the standard 1% earning rate, an eligible payment of ¥100,000 earns 1,000 points. Promotional rates and exclusions may vary." } },
          { kind: "p", text: { ja: "お支払いがキャンセル、返金、取消しまたはチャージバックとなった場合、ポイントを調整することがあります。", en: "Points may be adjusted if a payment is cancelled, refunded, reversed, or charged back." } },
        ],
      },
      {
        q: { ja: "ポイントはどのように使えますか？", en: "How can I use my loyalty points?" },
        a: [
          { kind: "p", text: { ja: "ご利用可能なポイントは、お客様アカウントに表示するプログラムの条件に従い、対象となるCha Jewelsの商品のご購入、送料または当社が承認した作業にご利用いただけます。", en: "Available points may be used on eligible Cha Jewels purchases, shipping, or approved services, subject to the program conditions displayed in your account." } },
          { kind: "p", text: { ja: "ポイントは、当社が別途承認した場合を除き、現金への交換または他のお客様への譲渡はできません。", en: "Loyalty points cannot be exchanged for cash or transferred to another customer unless Cha Jewels approves otherwise." } },
        ],
      },
      {
        q: { ja: "ストアクレジットとポイントは同じものですか？", en: "Is store credit the same as loyalty points?" },
        a: [
          { kind: "p", text: { ja: "いいえ。ストアクレジットとポイントは別個のものです。", en: "No. Store credit and loyalty points are separate." } },
          { kind: "rich", runs: { ja: [{ t: "当社の" }, { t: "返品・キャンセル・返金ポリシー", href: "/legal/returns" }, { t: "に基づき付与するストアクレジットは、原則として付与日から12か月間有効です。譲渡することはできず、法令により必要な場合を除き、現金への交換はできません。" }], en: [{ t: "Store credit issued under our " }, { t: "Return, Cancellation and Refund Policy", href: "/legal/returns" }, { t: " is normally valid for 12 months from the date of issue. It is non-transferable and cannot be exchanged for cash unless required by law." }] } },
        ],
      },
    ],
  },
  {
    h: { ja: "配送", en: "Shipping" },
    items: [
      {
        q: { ja: "フィリピンへ発送できますか？", en: "Do you ship to the Philippines?" },
        a: [
          { kind: "p", text: { ja: "はい。東京から、フィリピンおよびお取り扱いのある海外の国・地域のお客様へ発送しています。", en: "Yes. We ship from Tokyo to customers in the Philippines and other supported international destinations." } },
          { kind: "p", text: { ja: "ご利用いただける配送方法、送料およびお届けの目安は、ご注文手続きの画面に表示し、または請求書でご確認いただけます。", en: "Available shipping methods, charges, and estimated delivery times are shown during checkout or confirmed on your invoice." } },
        ],
      },
      {
        q: { ja: "追跡番号はもらえますか？", en: "Do you provide tracking information?" },
        a: [
          { kind: "p", text: { ja: "はい。追跡可能な配送方法をご利用の場合、発送後に追跡番号をご案内します。", en: "Yes. When tracked delivery is available, we will provide the tracking number after the parcel has been dispatched." } },
          { kind: "p", text: { ja: "配送ラベルの作成直後は、追跡情報がすぐに更新されないことがあります。", en: "Tracking may not update immediately after the shipping label is created." } },
        ],
      },
      {
        q: { ja: "注文した商品はいつ発送されますか？", en: "When will my order be shipped?" },
        a: [
          { kind: "p", text: { ja: "全額お支払いのご注文は、お支払いの確認後に準備を行います。分割予約のご注文は、残額の完済後に発送の準備を行います。", en: "Paid-in-full orders are prepared after payment validation. Layaway orders are prepared for dispatch after the balance has been fully paid." } },
          { kind: "p", text: { ja: "サイズ直し、研磨、鑑定、修理その他の作業を伴うご注文は、ご依頼いただいた作業の完了後に発送します。", en: "Orders requiring resizing, polishing, certification, repair, or another service will be shipped after the requested work has been completed." } },
        ],
      },
      {
        q: { ja: "ジュエリーの作業にはどのくらいかかりますか？", en: "How long do jewelry services take?" },
        a: [
          { kind: "p", text: { ja: "サイズ直し、鑑定、修理その他の作業には、通常2週間以上を要します。", en: "Resizing, certification, repair, and other service items normally require at least two weeks." } },
          { kind: "p", text: { ja: "複雑な作業、鑑定機関での処理、資材の入手状況、休業期間および海外への配送により、さらに日数を要する場合があります。", en: "Complex work, laboratory processing, material availability, holidays, and international delivery may require additional time." } },
        ],
      },
      {
        q: { ja: "送料無料はありますか？", en: "Do you offer free shipping?" },
        a: [
          { kind: "lines", lines: { ja: ["日本国内：¥8,000以上の対象となるご注文について、国内送料が無料となる場合があります。", "海外：1点あたり¥8,000以上の対象商品が5点含まれる場合、おまとめ発送の対象となることがあります。ご友人5名様分のご購入をまとめていただくこともできます。"], en: ["Japan: Free domestic shipping may apply to eligible orders of ¥8,000 or more.", "International: Grouped shipping may qualify when five eligible items, each priced at ¥8,000 or more, are included. A qualifying group may include purchases from five friends."] } },
          { kind: "p", text: { ja: "対象となるかどうか、お届け先、発送の時期およびキャンペーンの条件は、発送前にご確認いただく必要があります。", en: "Eligibility, destination, shipment timing, and promotional conditions must be confirmed before dispatch." } },
        ],
      },
      {
        q: { ja: "複数のご注文をまとめて発送できますか？", en: "Can several orders be shipped together?" },
        a: [
          { kind: "p", text: { ja: "はい。実務上可能な場合、当社が承認したご注文を1つの発送にまとめることができます。", en: "Yes, approved orders may be combined into one shipment when practical." } },
          { kind: "p", text: { ja: "まとめる商品はすべて、お支払いが完了し発送可能な状態である必要があります。分割予約中の商品やご依頼いただいた作業中の商品が含まれる場合、おまとめにより発送が遅くなることがあります。", en: "All included items must be fully paid and ready for dispatch. Combining orders may delay shipment if one item is still under layaway or undergoing a requested service." } },
        ],
      },
      {
        q: { ja: "関税や輸入税は誰が負担しますか？", en: "Who pays customs duties and import taxes?" },
        a: [
          { kind: "p", text: { ja: "海外のお客様は、原則として、お届け先の国で課される関税、輸入税、通関手数料その他の費用をご負担いただきます。", en: "International customers are generally responsible for customs duties, import taxes, brokerage charges, and other fees collected in the destination country." } },
          { kind: "p", text: { ja: "税関が荷物を検査し、または留め置くことがあります。当社は、虚偽の価額を申告すること、または商業目的のご購入を贈答品として申告することはできません。", en: "Customs authorities may inspect or delay a parcel. Cha Jewels cannot declare a false value or describe a commercial purchase as a gift." } },
        ],
      },
    ],
  },
  {
    h: { ja: "作業、返品およびキャンセル", en: "Services, Returns, and Cancellations" },
    items: [
      {
        q: { ja: "サイズ直し、研磨、修理、鑑定はしていますか？", en: "Do you offer resizing, polishing, repair, or certification?" },
        a: [
          { kind: "p", text: { ja: "はい。ご提供できる作業は、商品の素材、構造、状態、デザインおよび石留めの状況により異なります。", en: "Yes. Available services depend on the item’s material, construction, condition, design, and gemstone setting." } },
          { kind: "p", text: { ja: "対象となるCha Jewelsの商品は、研磨を無料で承る場合があります。サイズ直し、修理、鑑定、鑑定機関での作業または資材の追加には、別途費用が発生することがあります。", en: "Eligible Cha Jewels pieces may receive complimentary polishing. Resizing, repair, certification, laboratory work, or additional materials may involve separate fees." } },
          { kind: "p", text: { ja: "有償の作業を開始する前に、お受けできるかどうか、費用の目安および作業に要する期間をご案内します。", en: "We will confirm availability, estimated cost, and processing time before beginning chargeable work." } },
        ],
      },
      {
        q: { ja: "サイズ直しや加工をした商品は返品できますか？", en: "Can I return a resized or customized item?" },
        a: [
          { kind: "p", text: { ja: "サイズ直し、刻印、修理、鑑定、名入れその他の加工を行った商品は、お客様のご都合による返品の対象外です。", en: "Resized, engraved, repaired, certified, personalized, or otherwise altered items are not eligible for change-of-mind returns." } },
          { kind: "p", text: { ja: "これは、作業に不備があった場合、またはその他消費者の強行法規上の権利が及ぶ場合のお客様の権利を失わせるものではありません。", en: "This does not remove your rights if the service was performed incorrectly or the item is otherwise covered by a mandatory consumer right." } },
        ],
      },
      {
        q: { ja: "気が変わった場合に返品できますか？", en: "Can I return an item because I changed my mind?" },
        a: [
          { kind: "p", text: { ja: "お客様のご都合による返品は、原則としてお受けしておりません。", en: "Change-of-mind returns are generally not accepted." } },
          { kind: "rich", runs: { ja: [{ t: "お受けしたお客様のお申し出によるキャンセルは、原則としてストアクレジットでの対応となり、法令上認められるキャンセル料が発生する場合があります。ご注文の前に、当社の" }, { t: "返品・キャンセル・返金ポリシー", href: "/legal/returns" }, { t: "をご確認ください。" }], en: [{ t: "Approved voluntary cancellations are normally issued as store credit and may be subject to a lawful cancellation charge. Please review our " }, { t: "Return, Cancellation and Refund Policy", href: "/legal/returns" }, { t: " before ordering." }] } },
        ],
      },
      {
        q: { ja: "違う商品や破損した商品が届いた場合はどうすればよいですか？", en: "What should I do if I receive the wrong or a damaged item?" },
        a: [
          { kind: "p", text: { ja: "お受け取り後5日以内（暦日）を目安に、速やかに当社までご連絡ください。", en: "Contact us promptly, preferably within five calendar days after delivery." } },
          { kind: "p", text: { ja: "次の内容をお知らせください。", en: "Please provide:" } },
          { kind: "list", items: { ja: ["ご注文番号または請求書番号。", "商品および梱包材の鮮明な写真。", "問題の概要。", "開封動画（ある場合）。"], en: ["Your order or invoice number.", "Clear photographs of the item and packaging.", "A brief explanation of the problem.", "An unboxing video, if available."] } },
          { kind: "p", text: { ja: "状況に応じて、修理、交換、代金の減額、お客様がご了承されたストアクレジット、または元のお支払方法でのご返金といった対応をご案内します。", en: "Depending on the circumstances, an eligible resolution may include repair, replacement, price reduction, store credit accepted by the customer, or a refund through the original payment method." } },
        ],
      },
      {
        q: { ja: "開封動画は必須ですか？", en: "Is an unboxing video required?" },
        a: [
          { kind: "p", text: { ja: "開封動画は、お届け時の荷物の状態を記録するうえで役立つため、強くお勧めしています。", en: "An unboxing video is strongly recommended because it helps document the parcel’s condition at delivery." } },
          { kind: "p", text: { ja: "もっとも、動画がないことによって、法令上除外することができない権利が当然に失われるものではありません。当社は、写真、梱包材、配送記録および検品結果も確認します。", en: "However, the absence of a video does not automatically remove a right that cannot legally be excluded. We may also review photographs, packaging, delivery records, and inspection results." } },
        ],
      },
    ],
  },
  {
    h: { ja: "トレードプログラムと卸売", en: "Trade Program and Wholesale" },
    items: [
      {
        q: { ja: "ジュエリーの買い取りはしていますか？", en: "Will Cha Jewels buy back my jewelry?" },
        a: [
          { kind: "p", text: { ja: "当社は、自動的または保証された買い取りサービスは行っておりません。", en: "Cha Jewels does not offer an automatic or guaranteed buyback service." } },
          { kind: "p", text: { ja: "一部のジュエリーについては、当社の公式トレードプログラムを通じてのみご相談を承ります。お引き受けは、検品および当社の承認を条件とします。", en: "Selected jewelry may be considered only through our official Trade Program. Acceptance is subject to inspection and approval." } },
          { kind: "p", text: { ja: "トレードの査定額は、次の事項により変動します。", en: "Trade value may depend on:" } },
          { kind: "list", items: { ja: ["地金の純度およびグラム重量。", "宝石および鑑定書の有無。", "ブランドおよび型番。", "状態および付属品の欠品の有無。", "その時点の貴金属相場。", "その時点のお客様の需要および再販の需要。"], en: ["Metal purity and gram weight.", "Gemstones and available certification.", "Brand and model.", "Condition and completeness.", "Current precious-metal prices.", "Current customer and resale demand."] } },
          { kind: "p", text: { ja: "お持ち込みいただいても、お引き受けを保証するものではありません。査定額、その有効期間および条件は書面でご案内します。将来のトレードの査定額がご購入時の価格と同額になることは保証しておりません。", en: "Submitting an item does not guarantee acceptance. Any trade value, validity period, and conditions will be provided in writing. We do not guarantee that the future trade value will equal the original purchase price." } },
        ],
      },
      {
        q: { ja: "委託販売は行っていますか？", en: "Does Cha Jewels offer consignment?" },
        a: [
          { kind: "p", text: { ja: "通常の買い取りの手続きにおいて、自動的な委託販売は行っておりません。対象となる商品は、別途の書面による合意がある場合を除き、現行のトレードプログラムに従ってのみお取り扱いします。", en: "We do not offer automatic consignment under the standard buyback process. Eligible items are handled only according to the current Trade Program unless a separate written agreement is made." } },
        ],
      },
      {
        q: { ja: "卸売の最低数量はありますか？", en: "What are your wholesale minimums?" },
        a: [
          { kind: "p", text: { ja: "すべての商品カテゴリーに一律に適用される、公開の卸売最低数量はありません。", en: "There is no single public wholesale minimum that applies to every product category." } },
          { kind: "p", text: { ja: "卸売の対象となるかどうか、最低数量、価格、必要なお預り金、お支払い予定、在庫状況および納品の条件は、当社が承認した書面のお見積りにより決定します。これらは、商品の種類、グラム重量、ご注文数量およびその時点の貴金属相場により異なります。", en: "Wholesale eligibility, minimum quantity, pricing, required deposit, payment schedule, availability, and delivery terms are determined through an approved written quotation. They may vary according to the product type, gram weight, order quantity, and current precious-metal market." } },
          { kind: "p", text: { ja: "小売向けの分割予約、ポイント、送料無料のご案内およびキャンペーンの割引は、卸売のご注文に当然に適用されるものではありません。", en: "Retail layaway, loyalty points, free-shipping offers, and promotional discounts do not automatically apply to wholesale orders." } },
        ],
      },
      {
        q: { ja: "卸売価格を申し込むにはどうすればよいですか？", en: "How do I apply for wholesale pricing?" },
        a: [
          { kind: "p", text: { ja: "次の内容を添えて当社までご連絡ください。", en: "Contact us with:" } },
          { kind: "list", items: { ja: ["お名前または屋号・会社名。", "国およびお届け先。", "ご関心のある商品カテゴリー。", "想定される数量またはご予算。", "ご希望のお支払いおよび納品の時期。"], en: ["Your name or business name.", "Country and delivery destination.", "Product categories of interest.", "Expected quantity or budget.", "Preferred payment and delivery schedule."] } },
          { kind: "p", text: { ja: "内容を確認のうえ、ご案内可能な最低数量、価格およびお支払いの条件を書面でお知らせします。", en: "We will review the request and provide the available minimums, pricing, and payment conditions in writing." } },
        ],
      },
    ],
  },
  {
    h: { ja: "お問い合わせ", en: "Contacting Cha Jewels" },
    items: [
      {
        q: { ja: "問い合わせ方法を教えてください。", en: "How can I contact you?" },
        a: [
          { kind: "p", text: { ja: "ご注文、商品、トレード、卸売または作業に関するお問い合わせは、次の窓口までお願いします。", en: "For order, product, trade, wholesale, or service questions:" } },
          { kind: "lines", lines: { ja: ["Messenger：m.me/chajewelsjapan", "メールアドレス：sales@chajewelsjp.com"], en: ["Messenger: m.me/chajewelsjapan", "Email: sales@chajewelsjp.com"] } },
          { kind: "p", text: { ja: "既にご購入いただいた商品についてのお問い合わせの際は、ご注文番号または請求書番号をお知らせください。", en: "Please include your order or invoice number when contacting us about an existing purchase." } },
        ],
      },
    ],
  },
];

/**
 * Flattens one answer to plain text for the FAQPage structured data. Same
 * source as the rendered prose, which is the point: Google must never be shown
 * an answer a reader cannot find on the page.
 *
 * `h` is handled although no answer uses one: LegalBlock is shared with the
 * legal pages, and a non-exhaustive switch here would break the build the day
 * someone adds a sub-heading to an answer rather than silently dropping it.
 */
export function answerText(blocks: LegalBlock[], lang: Lang): string {
  return blocks
    .map((b) =>
      b.kind === "p" || b.kind === "h" ? b.text[lang]
      : b.kind === "rich" ? b.runs[lang].map((r) => r.t).join("")
      : b.kind === "list" ? b.items[lang].join(" ")
      : b.lines[lang].join(" "),
    )
    .join(" ");
}

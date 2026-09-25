-- Cha Jewels FAQ seed — GENERATED, do not hand-edit.
--
-- HISTORICAL RECORD. The generator and check:faq were removed in 5af6eb8 (the
-- FAQ is read from the Hub only). One row was edited by hand on 2026-09-25 to
-- the owner's new origin Q/A so this file matches the live row.
--   source:    lib/content/faq.ts
--   generator: node scripts/faq-seed.mjs
--   gate:      npm run check:faq (regenerates and compares to this file)
--
-- Answers are markdown, converted from the LegalBlock[] the site renders
-- today: paragraphs, ### sub-headings, "- " bullets, hard breaks (a
-- trailing backslash) and [text](href) links. npm run check:faq renders
-- both the blocks and this markdown to plain text and asserts they are
-- identical — the FAQ is authoritative and much of it is terms, so not one
-- word may change on the way in.
--
-- IDEMPOTENT. Every insert is guarded, so running it twice inserts nothing
-- the second time: sections on their slug, items on their section's slug
-- plus their sort_order. It will NOT update a row that already exists —
-- this is a seed, not a sync, and silently overwriting an answer an owner
-- has since edited in the Hub is the one thing it must never do.
--
-- layaway_only is false on every row. Nothing in lib/content/faq.ts carries
-- that flag today; the column is seeded so the Hub can set it on a future
-- answer, and the site already hides such an answer on Japanese.
--
-- RUN BY: Cynthia, in the Supabase SQL editor. Nothing in this repo runs it.

BEGIN;

-- 1. Products and Authenticity (6 items)
INSERT INTO public.website_faq_sections (slug, title_en, title_ja, sort_order)
SELECT 'products-and-authenticity', 'Products and Authenticity', '商品と真贋', 10
WHERE NOT EXISTS (SELECT 1 FROM public.website_faq_sections WHERE slug = 'products-and-authenticity');

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Are Cha Jewels products authentic?', 'Cha Jewelsの商品は本物ですか？',
       'Yes. We inspect our jewelry and clearly describe the material, hallmark, gram weight, condition, gemstones, and available certification in each listing.

Diamond certificates, laboratory reports, branded accessories, and original packaging are included only when specifically stated in the product description.',
       'はい。当社はジュエリーを検品し、素材、刻印、グラム重量、状態、宝石、および付属する鑑定書の有無を各商品ページに明記しています。

ダイヤモンドの鑑定書、鑑別書、ブランドの付属品および元の箱は、商品説明に特に記載がある場合にのみ付属します。',
       false, 10
  FROM public.website_faq_sections s
 WHERE s.slug = 'products-and-authenticity'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 10);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'What does “preloved” mean?', '「プレラブド」とはどういう意味ですか？',
       'Preloved means the jewelry has had a previous owner. It may show minor scratches, marks, repairs, or other signs of normal wear.

We disclose known condition details through descriptions, photographs, and videos so customers can review the piece before ordering. Disclosed signs of previous use are not considered defects.',
       'プレラブドとは、以前の所有者がいたジュエリーを指します。軽微な傷、汚れ、修理跡その他の通常の使用感が見られる場合があります。

把握している状態については、商品説明、写真および動画で開示しており、ご注文の前にご確認いただけます。開示済みの使用感は不具合とはみなしません。',
       false, 20
  FROM public.website_faq_sections s
 WHERE s.slug = 'products-and-authenticity'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 20);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Is everything made in Japan?', 'すべて日本製ですか？',
       'Our new jewelry is made in Japan, and so are many of our preloved pieces. Preloved branded pieces are made by their original brands and authenticated in Japan. The origin, material, and available details of each item are stated in its listing.',
       '新品ジュエリーはすべて日本製で、中古品にも日本製が多くあります。中古ブランド品は各ブランドの製品で、日本で真贋鑑定済みです。各商品の産地、素材および判明している詳細は、商品ページに記載しています。',
       false, 30
  FROM public.website_faq_sections s
 WHERE s.slug = 'products-and-authenticity'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 30);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Why might the actual color look slightly different from the photograph?', '実際の色が写真と少し違って見えることがあるのはなぜですか？',
       'Lighting, photography, screen settings, and device displays can affect how colors appear. Natural gemstones, pearls, and handmade bracelets may also have unique variations in color, shape, inclusions, and pattern.

A minor visual difference is not necessarily a defect, but please contact us if the item is materially different from its description.',
       '照明、撮影、画面設定および端末の表示により、色の見え方が異なる場合があります。また、天然石、真珠および手作りのブレスレットには、色、形状、内包物、模様に個体差があります。

軽微な見え方の違いは必ずしも不具合ではありませんが、商品が説明と重大に相違する場合は当社までご連絡ください。',
       false, 40
  FROM public.website_faq_sections s
 WHERE s.slug = 'products-and-authenticity'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 40);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Does every diamond or gemstone include a certificate?', 'ダイヤモンドや宝石には必ず鑑定書が付きますか？',
       'No. A certificate or laboratory report is included only when stated in the product listing.

Certification may also be requested for eligible items. Additional fees and processing time may apply.',
       'いいえ。鑑定書または鑑別書は、商品ページに記載がある場合にのみ付属します。

対象となる商品については、鑑定をご依頼いただくこともできます。別途費用および日数を要する場合があります。',
       false, 50
  FROM public.website_faq_sections s
 WHERE s.slug = 'products-and-authenticity'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 50);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Is the future value of my jewelry guaranteed?', 'ジュエリーの将来の価値は保証されますか？',
       'No. Gold, gemstones, branded jewelry, and other precious items may retain, increase, or decrease in value depending on market conditions, condition, demand, currency rates, and resale costs.

References to jewelry as an asset or investment do not guarantee appreciation, profit, resale value, or future liquidity.',
       'いいえ。金、宝石、ブランドジュエリーその他の貴重品の価値は、市場の状況、商品の状態、需要、為替相場および再販に要する費用により、維持されることも、上昇することも、下落することもあります。

ジュエリーを資産または投資として言及する場合も、価値の上昇、利益、再販価格または将来の換金性を保証するものではありません。',
       false, 60
  FROM public.website_faq_sections s
 WHERE s.slug = 'products-and-authenticity'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 60);

-- 2. Orders and Live-Selling Claims (5 items)
INSERT INTO public.website_faq_sections (slug, title_en, title_ja, sort_order)
SELECT 'orders-and-live-selling-claims', 'Orders and Live-Selling Claims', 'ご注文とライブ販売でのご予約', 20
WHERE NOT EXISTS (SELECT 1 FROM public.website_faq_sections WHERE slug = 'orders-and-live-selling-claims');

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'How do I claim an item during Live selling?', 'ライブ販売で商品を予約するにはどうすればよいですか？',
       'Follow the claiming instructions announced during the Live. A comment or message expressing interest does not automatically confirm the sale.

The order is confirmed after Cha Jewels verifies availability, allocates the item, and sends an invoice or written order confirmation.',
       'ライブ中にご案内する予約の方法に従ってください。ご興味をお示しいただくコメントやメッセージだけでは、ご購入は確定しません。

ご注文は、当社が在庫を確認し、商品を割り当て、請求書または書面のご注文確認をお送りした後に確定します。',
       false, 10
  FROM public.website_faq_sections s
 WHERE s.slug = 'orders-and-live-selling-claims'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 10);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'What happens if I claim a piece during Live but do not pay immediately?', 'ライブで予約した商品をすぐにお支払いしない場合はどうなりますか？',
       'A claimed item is normally reserved for:

- New customers: Up to 24 hours.
- Returning customers: Up to 72 hours.

The deadline applies regardless of loyalty level unless different promotional terms are clearly announced.

If the required payment, down payment, or approved arrangement is not completed before the deadline, the item may be released and returned for sale without further notice.',
       'ご予約いただいた商品は、原則として次の期間お取り置きします。

- はじめてのお客様：24時間まで。
- 2回目以降のお客様：72時間まで。

この期限は、異なるキャンペーン条件を明確にご案内している場合を除き、会員レベルを問わず適用されます。

期限までに所定のお支払い、予約金のお支払い、または当社が承認したお取り決めが完了しない場合、商品のお取り置きを解除し、改めて販売することがあります。この場合、事前のご連絡はいたしません。',
       false, 20
  FROM public.website_faq_sections s
 WHERE s.slug = 'orders-and-live-selling-claims'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 20);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Can I reserve an item with a small amount?', '少額で商品をお取り置きできますか？',
       'A reduced reservation amount is available only when specifically offered as part of a promotion.

Outside a promotion, the standard full-payment or layaway down-payment requirement applies. A message or verbal promise without the required payment does not secure the item.',
       '予約金額を引き下げた取扱いは、キャンペーンの一環として特にご案内している場合にのみご利用いただけます。

キャンペーン期間外は、通常の全額お支払い、または分割予約の予約金のお支払いが必要です。所定のお支払いのないメッセージまたは口頭のお約束では、商品は確保されません。',
       false, 30
  FROM public.website_faq_sections s
 WHERE s.slug = 'orders-and-live-selling-claims'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 30);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'What happens if an item becomes unavailable after I order it?', 'ご注文後に商品がご用意できなくなった場合はどうなりますか？',
       'Many of our preloved pieces are unique and may be offered through more than one sales channel.

If an item becomes unavailable before your allocation is confirmed, we will inform you. If payment was already received, we will offer a suitable alternative, an accepted store-credit option, or a refund through the original payment method.',
       '当社のプレラブド商品は一点物が多く、複数の販売経路でご案内している場合があります。

割り当ての確定前に商品がご用意できなくなった場合は、お客様にご連絡します。既に代金をお受けしている場合は、適切な代替品、お客様がご了承されたストアクレジット、または元のお支払方法でのご返金をご案内します。',
       false, 40
  FROM public.website_faq_sections s
 WHERE s.slug = 'orders-and-live-selling-claims'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 40);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Can I change to another item after paying my down payment?', '予約金のお支払い後に別の商品へ変更できますか？',
       'Changing the reserved item is treated as cancellation of the original order and creation of a new order.

Cancellation charges or store-credit conditions may apply under our [Return, Cancellation and Refund Policy](/legal/returns). An exception applies only when Cha Jewels approves it in writing.',
       'お取り置き商品の変更は、元のご注文のキャンセルおよび新たなご注文として取り扱います。

キャンセル料またはストアクレジットの条件は、当社の[返品・キャンセル・返金ポリシー](/legal/returns)に従います。例外は、当社が書面により承認した場合にのみ適用されます。',
       false, 50
  FROM public.website_faq_sections s
 WHERE s.slug = 'orders-and-live-selling-claims'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 50);

-- 3. Payments and Layaway (8 items)
INSERT INTO public.website_faq_sections (slug, title_en, title_ja, sort_order)
SELECT 'payments-and-layaway', 'Payments and Layaway', 'お支払いと分割予約', 30
WHERE NOT EXISTS (SELECT 1 FROM public.website_faq_sections WHERE slug = 'payments-and-layaway');

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'What payment methods do you accept?', 'どのようなお支払方法が使えますか？',
       'Available payment methods are displayed at checkout or stated on your invoice. Payment must be received and validated before an order is considered paid.

Your bank, card issuer, or payment provider may charge separate transaction or currency-conversion fees.',
       'ご利用いただけるお支払方法は、ご注文手続きの画面に表示し、または請求書に記載します。ご注文は、当社がお支払いを受領し、その内容を確認した後にお支払い済みとなります。

お客様の金融機関、カード発行会社または決済事業者が、別途の取引手数料または為替手数料を課す場合があります。',
       false, 10
  FROM public.website_faq_sections s
 WHERE s.slug = 'payments-and-layaway'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 10);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Can I pay in Philippine pesos?', 'フィリピンペソで支払えますか？',
       'Philippine-peso payment may be available when it is specifically provided on your invoice or through an approved payment method.

Peso figures displayed on the website are indicative estimates. Your final invoice, payment provider’s exchange rate, and applicable fees determine the actual amount payable.',
       'フィリピンペソでのお支払いは、請求書に特に記載がある場合、または当社が承認したお支払方法によりご利用いただける場合があります。

ウェブサイトに表示するペソ金額は参考の概算です。実際のお支払額は、最終の請求書、決済事業者の為替レートおよび適用される手数料により決まります。',
       false, 20
  FROM public.website_faq_sections s
 WHERE s.slug = 'payments-and-layaway'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 20);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'What layaway plans are available?', '分割予約にはどのようなプランがありますか？',
       'Our standard interest-free layaway options are:

- Three months
- Six months
- Eight months for qualifying orders of ¥300,000 or more

The approved payment schedule will be shown on your invoice or customer portal. Promotional plans may have different conditions.',
       '当社の標準的な無利息の分割予約プランは次のとおりです。

- 3か月
- 6か月
- 8か月（¥300,000以上の対象となるご注文）

承認されたお支払い予定は、請求書またはカスタマーポータルに表示します。キャンペーンのプランは条件が異なる場合があります。',
       false, 30
  FROM public.website_faq_sections s
 WHERE s.slug = 'payments-and-layaway'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 30);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'How much is the layaway down payment?', '分割予約の予約金はいくらですか？',
       'The standard down payment is normally 30% of the total order price.

Some promotions may offer a reduced reservation amount or different down-payment conditions. A promotional exception applies only during the announced period and must be confirmed in writing.',
       '標準の予約金は、原則としてご注文金額の合計の30%です。

キャンペーンによっては、予約金額の引き下げまたは異なる予約金の条件をご案内する場合があります。キャンペーンによる例外は、ご案内した期間中に限り適用され、書面による確認が必要です。',
       false, 40
  FROM public.website_faq_sections s
 WHERE s.slug = 'payments-and-layaway'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 40);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Does Cha Jewels charge interest on layaway?', '分割予約に金利はかかりますか？',
       'Our standard layaway plans are 0% interest. Customers pay the confirmed product price according to the approved schedule.

Payment-provider, currency-conversion, delivery, service, or customs fees are separate and are not considered layaway interest.',
       '当社の標準的な分割予約プランは金利0%です。お客様は、承認されたお支払い予定に沿って、確定した商品代金をお支払いいただきます。

決済事業者の手数料、為替手数料、配送料、作業費用および関税は別途のものであり、分割予約の金利には該当しません。',
       false, 50
  FROM public.website_faq_sections s
 WHERE s.slug = 'payments-and-layaway'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 50);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'What happens if I miss a layaway payment?', '分割予約のお支払いが遅れた場合はどうなりますか？',
       'We may send an automated reminder using your registered email address or messaging channel.

If payment remains overdue, we may provide notice and an opportunity to correct it before cancelling the layaway. Cancellation charges, down-payment treatment, and any remaining balance are handled according to the applicable Layaway Terms and [Return, Cancellation and Refund Policy](/legal/returns).',
       '当社は、ご登録のメールアドレスまたはメッセージ窓口を通じて、自動のご案内をお送りする場合があります。

お支払いの遅延が続く場合、当社は、分割予約をキャンセルする前に、ご通知のうえ遅延分をお支払いいただく機会を設けることがあります。キャンセル料、予約金の取扱いおよび残額については、適用される分割予約規約および[返品・キャンセル・返金ポリシー](/legal/returns)に従って取り扱います。',
       false, 60
  FROM public.website_faq_sections s
 WHERE s.slug = 'payments-and-layaway'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 60);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Can I pay off my layaway early?', '分割予約を繰り上げて完済できますか？',
       'Yes. You may complete your remaining balance early without an early-payment charge unless different conditions were disclosed before the plan began.',
       'はい。プランのお申込み前に異なる条件を明示していた場合を除き、残額を繰り上げてお支払いいただけ、繰上げに伴う手数料は発生しません。',
       false, 70
  FROM public.website_faq_sections s
 WHERE s.slug = 'payments-and-layaway'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 70);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Can my layaway item be shipped before it is fully paid?', '分割予約の商品を完済前に発送してもらえますか？',
       'No. Layaway items are normally shipped only after the full balance and applicable shipping charges have been paid and validated.

However, requested services such as resizing, polishing, repair, or certification may begin before the final payment so the item can be prepared for prompt shipment after completion of payment.',
       'いいえ。分割予約の商品は、原則として、残額全額および適用される送料のお支払いを受領し、その内容を確認した後にのみ発送します。

もっとも、サイズ直し、研磨、修理、鑑定などご依頼いただいた作業は、完済後すぐに発送できるよう、最終回のお支払いの前に開始する場合があります。',
       false, 80
  FROM public.website_faq_sections s
 WHERE s.slug = 'payments-and-layaway'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 80);

-- 4. Loyalty Points and Store Credit (3 items)
INSERT INTO public.website_faq_sections (slug, title_en, title_ja, sort_order)
SELECT 'loyalty-points-and-store-credit', 'Loyalty Points and Store Credit', 'ポイントとストアクレジット', 40
WHERE NOT EXISTS (SELECT 1 FROM public.website_faq_sections WHERE slug = 'loyalty-points-and-store-credit');

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'How do I earn loyalty points?', 'ポイントはどのように貯まりますか？',
       'Eligible payments earn loyalty points after each payment has been validated, whether the payment is for a paid-in-full order or a layaway order.

At the standard 1% earning rate, an eligible payment of ¥100,000 earns 1,000 points. Promotional rates and exclusions may vary.

Points may be adjusted if a payment is cancelled, refunded, reversed, or charged back.',
       '対象となるお支払いには、全額お支払いのご注文か分割予約のご注文かを問わず、各回のお支払いの内容を確認した後にポイントが付与されます。

標準の付与率1%の場合、対象となる¥100,000のお支払いで1,000ポイントが付与されます。キャンペーンの付与率および対象外となる条件は異なる場合があります。

お支払いがキャンセル、返金、取消しまたはチャージバックとなった場合、ポイントを調整することがあります。',
       false, 10
  FROM public.website_faq_sections s
 WHERE s.slug = 'loyalty-points-and-store-credit'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 10);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'How can I use my loyalty points?', 'ポイントはどのように使えますか？',
       'Available points may be used on eligible Cha Jewels purchases, shipping, or approved services, subject to the program conditions displayed in your account.

Loyalty points cannot be exchanged for cash or transferred to another customer unless Cha Jewels approves otherwise.',
       'ご利用可能なポイントは、お客様アカウントに表示するプログラムの条件に従い、対象となるCha Jewelsの商品のご購入、送料または当社が承認した作業にご利用いただけます。

ポイントは、当社が別途承認した場合を除き、現金への交換または他のお客様への譲渡はできません。',
       false, 20
  FROM public.website_faq_sections s
 WHERE s.slug = 'loyalty-points-and-store-credit'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 20);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Is store credit the same as loyalty points?', 'ストアクレジットとポイントは同じものですか？',
       'No. Store credit and loyalty points are separate.

Store credit issued under our [Return, Cancellation and Refund Policy](/legal/returns) is normally valid for 12 months from the date of issue. It is non-transferable and cannot be exchanged for cash unless required by law.',
       'いいえ。ストアクレジットとポイントは別個のものです。

当社の[返品・キャンセル・返金ポリシー](/legal/returns)に基づき付与するストアクレジットは、原則として付与日から12か月間有効です。譲渡することはできず、法令により必要な場合を除き、現金への交換はできません。',
       false, 30
  FROM public.website_faq_sections s
 WHERE s.slug = 'loyalty-points-and-store-credit'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 30);

-- 5. Shipping (7 items)
INSERT INTO public.website_faq_sections (slug, title_en, title_ja, sort_order)
SELECT 'shipping', 'Shipping', '配送', 50
WHERE NOT EXISTS (SELECT 1 FROM public.website_faq_sections WHERE slug = 'shipping');

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Do you ship to the Philippines?', 'フィリピンへ発送できますか？',
       'Yes. We ship from Tokyo to customers in the Philippines and other supported international destinations.

Available shipping methods, charges, and estimated delivery times are shown during checkout or confirmed on your invoice.',
       'はい。東京から、フィリピンおよびお取り扱いのある海外の国・地域のお客様へ発送しています。

ご利用いただける配送方法、送料およびお届けの目安は、ご注文手続きの画面に表示し、または請求書でご確認いただけます。',
       false, 10
  FROM public.website_faq_sections s
 WHERE s.slug = 'shipping'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 10);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Do you provide tracking information?', '追跡番号はもらえますか？',
       'Yes. When tracked delivery is available, we will provide the tracking number after the parcel has been dispatched.

Tracking may not update immediately after the shipping label is created.',
       'はい。追跡可能な配送方法をご利用の場合、発送後に追跡番号をご案内します。

配送ラベルの作成直後は、追跡情報がすぐに更新されないことがあります。',
       false, 20
  FROM public.website_faq_sections s
 WHERE s.slug = 'shipping'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 20);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'When will my order be shipped?', '注文した商品はいつ発送されますか？',
       'Paid-in-full orders are prepared after payment validation. Layaway orders are prepared for dispatch after the balance has been fully paid.

Orders requiring resizing, polishing, certification, repair, or another service will be shipped after the requested work has been completed.',
       '全額お支払いのご注文は、お支払いの確認後に準備を行います。分割予約のご注文は、残額の完済後に発送の準備を行います。

サイズ直し、研磨、鑑定、修理その他の作業を伴うご注文は、ご依頼いただいた作業の完了後に発送します。',
       false, 30
  FROM public.website_faq_sections s
 WHERE s.slug = 'shipping'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 30);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'How long do jewelry services take?', 'ジュエリーの作業にはどのくらいかかりますか？',
       'Resizing, certification, repair, and other service items normally require at least two weeks.

Complex work, laboratory processing, material availability, holidays, and international delivery may require additional time.',
       'サイズ直し、鑑定、修理その他の作業には、通常2週間以上を要します。

複雑な作業、鑑定機関での処理、資材の入手状況、休業期間および海外への配送により、さらに日数を要する場合があります。',
       false, 40
  FROM public.website_faq_sections s
 WHERE s.slug = 'shipping'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 40);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Do you offer free shipping?', '送料無料はありますか？',
       'Japan: Free domestic shipping may apply to eligible orders of ¥8,000 or more.\
International: Grouped shipping may qualify when five eligible items, each priced at ¥8,000 or more, are included. A qualifying group may include purchases from five friends.

Eligibility, destination, shipment timing, and promotional conditions must be confirmed before dispatch.',
       '日本国内：¥8,000以上の対象となるご注文について、国内送料が無料となる場合があります。\
海外：1点あたり¥8,000以上の対象商品が5点含まれる場合、おまとめ発送の対象となることがあります。ご友人5名様分のご購入をまとめていただくこともできます。

対象となるかどうか、お届け先、発送の時期およびキャンペーンの条件は、発送前にご確認いただく必要があります。',
       false, 50
  FROM public.website_faq_sections s
 WHERE s.slug = 'shipping'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 50);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Can several orders be shipped together?', '複数のご注文をまとめて発送できますか？',
       'Yes, approved orders may be combined into one shipment when practical.

All included items must be fully paid and ready for dispatch. Combining orders may delay shipment if one item is still under layaway or undergoing a requested service.',
       'はい。実務上可能な場合、当社が承認したご注文を1つの発送にまとめることができます。

まとめる商品はすべて、お支払いが完了し発送可能な状態である必要があります。分割予約中の商品やご依頼いただいた作業中の商品が含まれる場合、おまとめにより発送が遅くなることがあります。',
       false, 60
  FROM public.website_faq_sections s
 WHERE s.slug = 'shipping'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 60);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Who pays customs duties and import taxes?', '関税や輸入税は誰が負担しますか？',
       'International customers are generally responsible for customs duties, import taxes, brokerage charges, and other fees collected in the destination country.

Customs authorities may inspect or delay a parcel. Cha Jewels cannot declare a false value or describe a commercial purchase as a gift.',
       '海外のお客様は、原則として、お届け先の国で課される関税、輸入税、通関手数料その他の費用をご負担いただきます。

税関が荷物を検査し、または留め置くことがあります。当社は、虚偽の価額を申告すること、または商業目的のご購入を贈答品として申告することはできません。',
       false, 70
  FROM public.website_faq_sections s
 WHERE s.slug = 'shipping'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 70);

-- 6. Services, Returns, and Cancellations (5 items)
INSERT INTO public.website_faq_sections (slug, title_en, title_ja, sort_order)
SELECT 'services-returns-and-cancellations', 'Services, Returns, and Cancellations', '作業、返品およびキャンセル', 60
WHERE NOT EXISTS (SELECT 1 FROM public.website_faq_sections WHERE slug = 'services-returns-and-cancellations');

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Do you offer resizing, polishing, repair, or certification?', 'サイズ直し、研磨、修理、鑑定はしていますか？',
       'Yes. Available services depend on the item’s material, construction, condition, design, and gemstone setting.

Eligible Cha Jewels pieces may receive complimentary polishing. Resizing, repair, certification, laboratory work, or additional materials may involve separate fees.

We will confirm availability, estimated cost, and processing time before beginning chargeable work.',
       'はい。ご提供できる作業は、商品の素材、構造、状態、デザインおよび石留めの状況により異なります。

対象となるCha Jewelsの商品は、研磨を無料で承る場合があります。サイズ直し、修理、鑑定、鑑定機関での作業または資材の追加には、別途費用が発生することがあります。

有償の作業を開始する前に、お受けできるかどうか、費用の目安および作業に要する期間をご案内します。',
       false, 10
  FROM public.website_faq_sections s
 WHERE s.slug = 'services-returns-and-cancellations'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 10);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Can I return a resized or customized item?', 'サイズ直しや加工をした商品は返品できますか？',
       'Resized, engraved, repaired, certified, personalized, or otherwise altered items are not eligible for change-of-mind returns.

This does not remove your rights if the service was performed incorrectly or the item is otherwise covered by a mandatory consumer right.',
       'サイズ直し、刻印、修理、鑑定、名入れその他の加工を行った商品は、お客様のご都合による返品の対象外です。

これは、作業に不備があった場合、またはその他消費者の強行法規上の権利が及ぶ場合のお客様の権利を失わせるものではありません。',
       false, 20
  FROM public.website_faq_sections s
 WHERE s.slug = 'services-returns-and-cancellations'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 20);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Can I return an item because I changed my mind?', '気が変わった場合に返品できますか？',
       'Change-of-mind returns are generally not accepted.

Approved voluntary cancellations are normally issued as store credit and may be subject to a lawful cancellation charge. Please review our [Return, Cancellation and Refund Policy](/legal/returns) before ordering.',
       'お客様のご都合による返品は、原則としてお受けしておりません。

お受けしたお客様のお申し出によるキャンセルは、原則としてストアクレジットでの対応となり、法令上認められるキャンセル料が発生する場合があります。ご注文の前に、当社の[返品・キャンセル・返金ポリシー](/legal/returns)をご確認ください。',
       false, 30
  FROM public.website_faq_sections s
 WHERE s.slug = 'services-returns-and-cancellations'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 30);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'What should I do if I receive the wrong or a damaged item?', '違う商品や破損した商品が届いた場合はどうすればよいですか？',
       'Contact us promptly, preferably within five calendar days after delivery.

Please provide:

- Your order or invoice number.
- Clear photographs of the item and packaging.
- A brief explanation of the problem.
- An unboxing video, if available.

Depending on the circumstances, an eligible resolution may include repair, replacement, price reduction, store credit accepted by the customer, or a refund through the original payment method.',
       'お受け取り後5日以内（暦日）を目安に、速やかに当社までご連絡ください。

次の内容をお知らせください。

- ご注文番号または請求書番号。
- 商品および梱包材の鮮明な写真。
- 問題の概要。
- 開封動画（ある場合）。

状況に応じて、修理、交換、代金の減額、お客様がご了承されたストアクレジット、または元のお支払方法でのご返金といった対応をご案内します。',
       false, 40
  FROM public.website_faq_sections s
 WHERE s.slug = 'services-returns-and-cancellations'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 40);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Is an unboxing video required?', '開封動画は必須ですか？',
       'An unboxing video is strongly recommended because it helps document the parcel’s condition at delivery.

However, the absence of a video does not automatically remove a right that cannot legally be excluded. We may also review photographs, packaging, delivery records, and inspection results.',
       '開封動画は、お届け時の荷物の状態を記録するうえで役立つため、強くお勧めしています。

もっとも、動画がないことによって、法令上除外することができない権利が当然に失われるものではありません。当社は、写真、梱包材、配送記録および検品結果も確認します。',
       false, 50
  FROM public.website_faq_sections s
 WHERE s.slug = 'services-returns-and-cancellations'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 50);

-- 7. Trade Program and Wholesale (4 items)
INSERT INTO public.website_faq_sections (slug, title_en, title_ja, sort_order)
SELECT 'trade-program-and-wholesale', 'Trade Program and Wholesale', 'トレードプログラムと卸売', 70
WHERE NOT EXISTS (SELECT 1 FROM public.website_faq_sections WHERE slug = 'trade-program-and-wholesale');

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Will Cha Jewels buy back my jewelry?', 'ジュエリーの買い取りはしていますか？',
       'Cha Jewels does not offer an automatic or guaranteed buyback service.

Selected jewelry may be considered only through our official Trade Program. Acceptance is subject to inspection and approval.

Trade value may depend on:

- Metal purity and gram weight.
- Gemstones and available certification.
- Brand and model.
- Condition and completeness.
- Current precious-metal prices.
- Current customer and resale demand.

Submitting an item does not guarantee acceptance. Any trade value, validity period, and conditions will be provided in writing. We do not guarantee that the future trade value will equal the original purchase price.',
       '当社は、自動的または保証された買い取りサービスは行っておりません。

一部のジュエリーについては、当社の公式トレードプログラムを通じてのみご相談を承ります。お引き受けは、検品および当社の承認を条件とします。

トレードの査定額は、次の事項により変動します。

- 地金の純度およびグラム重量。
- 宝石および鑑定書の有無。
- ブランドおよび型番。
- 状態および付属品の欠品の有無。
- その時点の貴金属相場。
- その時点のお客様の需要および再販の需要。

お持ち込みいただいても、お引き受けを保証するものではありません。査定額、その有効期間および条件は書面でご案内します。将来のトレードの査定額がご購入時の価格と同額になることは保証しておりません。',
       false, 10
  FROM public.website_faq_sections s
 WHERE s.slug = 'trade-program-and-wholesale'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 10);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'Does Cha Jewels offer consignment?', '委託販売は行っていますか？',
       'We do not offer automatic consignment under the standard buyback process. Eligible items are handled only according to the current Trade Program unless a separate written agreement is made.',
       '通常の買い取りの手続きにおいて、自動的な委託販売は行っておりません。対象となる商品は、別途の書面による合意がある場合を除き、現行のトレードプログラムに従ってのみお取り扱いします。',
       false, 20
  FROM public.website_faq_sections s
 WHERE s.slug = 'trade-program-and-wholesale'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 20);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'What are your wholesale minimums?', '卸売の最低数量はありますか？',
       'There is no single public wholesale minimum that applies to every product category.

Wholesale eligibility, minimum quantity, pricing, required deposit, payment schedule, availability, and delivery terms are determined through an approved written quotation. They may vary according to the product type, gram weight, order quantity, and current precious-metal market.

Retail layaway, loyalty points, free-shipping offers, and promotional discounts do not automatically apply to wholesale orders.',
       'すべての商品カテゴリーに一律に適用される、公開の卸売最低数量はありません。

卸売の対象となるかどうか、最低数量、価格、必要なお預り金、お支払い予定、在庫状況および納品の条件は、当社が承認した書面のお見積りにより決定します。これらは、商品の種類、グラム重量、ご注文数量およびその時点の貴金属相場により異なります。

小売向けの分割予約、ポイント、送料無料のご案内およびキャンペーンの割引は、卸売のご注文に当然に適用されるものではありません。',
       false, 30
  FROM public.website_faq_sections s
 WHERE s.slug = 'trade-program-and-wholesale'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 30);

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'How do I apply for wholesale pricing?', '卸売価格を申し込むにはどうすればよいですか？',
       'Contact us with:

- Your name or business name.
- Country and delivery destination.
- Product categories of interest.
- Expected quantity or budget.
- Preferred payment and delivery schedule.

We will review the request and provide the available minimums, pricing, and payment conditions in writing.',
       '次の内容を添えて当社までご連絡ください。

- お名前または屋号・会社名。
- 国およびお届け先。
- ご関心のある商品カテゴリー。
- 想定される数量またはご予算。
- ご希望のお支払いおよび納品の時期。

内容を確認のうえ、ご案内可能な最低数量、価格およびお支払いの条件を書面でお知らせします。',
       false, 40
  FROM public.website_faq_sections s
 WHERE s.slug = 'trade-program-and-wholesale'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 40);

-- 8. Contacting Cha Jewels (1 item)
INSERT INTO public.website_faq_sections (slug, title_en, title_ja, sort_order)
SELECT 'contacting-cha-jewels', 'Contacting Cha Jewels', 'お問い合わせ', 80
WHERE NOT EXISTS (SELECT 1 FROM public.website_faq_sections WHERE slug = 'contacting-cha-jewels');

INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)
SELECT s.id, 'How can I contact you?', '問い合わせ方法を教えてください。',
       'For order, product, trade, wholesale, or service questions:

Messenger: m.me/chajewelsjapan\
Email: sales@chajewelsjp.com

Please include your order or invoice number when contacting us about an existing purchase.',
       'ご注文、商品、トレード、卸売または作業に関するお問い合わせは、次の窓口までお願いします。

Messenger：m.me/chajewelsjapan\
メールアドレス：sales@chajewelsjp.com

既にご購入いただいた商品についてのお問い合わせの際は、ご注文番号または請求書番号をお知らせください。',
       false, 10
  FROM public.website_faq_sections s
 WHERE s.slug = 'contacting-cha-jewels'
   AND NOT EXISTS (
         SELECT 1 FROM public.website_faq_items i
          WHERE i.section_id = s.id AND i.sort_order = 10);

COMMIT;

-- Cha Jewels posts seed — GENERATED, do not hand-edit.
--   source:    lib/blog.ts
--   generator: npm run posts:seed
--   gate:      npm run check:posts (regenerates and compares to this file)
--
-- The two editorial posts this repo has carried since before there was a
-- Hub. Bodies are markdown: each paragraph of the string[] separated by a
-- blank line, which is all a paragraph break is. npm run check:posts
-- renders the static body and this markdown through the site's OWN two
-- renderers and asserts the HTML is byte-identical, so the conversion
-- cannot quietly reword, reflow or drop a paragraph.
--
-- IDEMPOTENT. Each insert is guarded on the slug, so running it twice
-- inserts nothing the second time. It will NOT update a row that already
-- exists — this is a seed, not a sync, and silently overwriting a post an
-- owner has since edited in the Hub is the one thing it must never do.
--
-- layaway_only is carried across from lib/blog.ts unchanged: such a post is
-- listed and readable on English only (lib/layaway-availability.ts, owner
-- decision 2026-09-15), and the site already applies that rule to Hub rows.
--
-- RUN BY: Cynthia, in the Supabase SQL editor. Nothing in this repo runs it.

BEGIN;

-- 1. what-k18-means — 2026-09-01
INSERT INTO public.website_posts (slug, type, title_en, title_ja, excerpt_en, excerpt_ja, body_en, body_ja, published, published_at, layaway_only)
SELECT 'what-k18-means', 'article',
       'What K18 means, and why it is the Japanese standard',
       'K18とは何か、なぜ日本の基準なのか',
       'What 75% purity means, how to read the stamp, and why K18 rather than K24 is chosen for jewelry worn every day.',
       '純度75%の意味、刻印の読み方、なぜK24ではなくK18が毎日身につけるジュエリーに選ばれるのか。',
       'K18 means the metal is 75% gold. The other 25% is an alloy of silver and copper that sets hardness and color.

K24 is purer but soft; as a ring or chain it bends and scratches. K18 is the balance point between asset value and durability, and the standard for fine jewelry in Japan.

The stamp reads K18 or AU750, often with a maker''s mark beside it. Any jeweler can read it.',
       'K18は金の含有率が75%であることを示します。残りの25%は銀や銅などの合金で、これが硬さと色を決めます。

純度の高いK24は柔らかく、指輪やチェーンとしては曲がりやすく傷つきやすい。K18は資産価値と耐久性の両立点として、日本の高級ジュエリーの標準になっています。

刻印はK18またはAU750。メーカーの刻印が入ることもあります。どの宝石店でも読み取れます。',
       true, '2026-09-01', false
WHERE NOT EXISTS (SELECT 1 FROM public.website_posts WHERE slug = 'what-k18-means');

-- 2. layaway-explained — 2026-08-20, layaway only (English)
INSERT INTO public.website_posts (slug, type, title_en, title_ja, excerpt_en, excerpt_ja, body_en, body_ja, published, published_at, layaway_only)
SELECT 'layaway-explained', 'article',
       'Layaway explained: 30%, 0% interest, three, six or eight months',
       '分割予約のしくみ：30%、無利息、3・6・8か月',
       'The deposit, the schedule, the reminders, and what happens if a payment is late.',
       '予約金、支払いスケジュール、リマインダー、そして支払いが遅れたときにどうなるか。',
       'Once 30% is paid the piece is reserved and not sold to anyone else.

The balance is split evenly over three or six months, and orders of ¥300,000 and above can choose eight. There is no interest.

You get a reminder three days before each due date by Messenger, SMS or email. Late-payment handling is written into your agreement.',
       '30%をお支払いいただいた時点で商品は確保され、他のお客様には販売されません。

残額は3か月または6か月の均等払い。¥300,000以上のご注文は8か月もお選びいただけます。金利はかかりません。

各支払日の3日前にMessenger、SMS、またはメールでお知らせします。遅延時の扱いは契約書に明記しています。',
       true, '2026-08-20', true
WHERE NOT EXISTS (SELECT 1 FROM public.website_posts WHERE slug = 'layaway-explained');

COMMIT;

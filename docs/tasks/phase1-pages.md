# Task for Claude Code — cha-jewels-web, Phase 1 remaining pages

Repo: `chajewels/cha-jewels-web`, branch `main`. Read `CLAUDE.md` first and follow it (terminology rule, no layaway math in the site, Hub API only). Run `npm run check:terms` and `npm run typecheck` before pushing. Push directly to `main`; Vercel deploys it.

Site conventions to reuse: `getLang()` from `lib/i18n-server`, `tr()` / `dict` from `lib/i18n`, `hub` from `lib/hub-api`, `Button` from `components/ui/button`, section wrapper classes `wrap`, `rule-grid`, `display`. Japanese is the default language; every new page needs `ja` and `en` copy. Use the `.display` heading style and the existing velvet/gold palette. No new dependencies.

## 1. Calculator: show the rate date
`components/commerce/layaway-calculator.tsx` receives `phpRate`. Add an optional `phpRateAsOf?: string` prop; the pages that render the calculator already fetch `hub.fx()` — pass `fx.as_of` through. When the ₱ display is active, render under the note: JA `レート基準日 {date}` / EN `Rate as of {date}`, date formatted `YYYY-MM-DD`.

## 2. `/wholesale` — lead page
Server page with copy + a client form.

Copy (JA / EN):
- H1: 東京から直接、店舗の仕入れを / Stock your shop from Tokyo
- Lede: ライブ販売者、ブティック、ファミリー経営の宝飾店に、K18ゴールドを卸価格で供給しています。お客様が求める「刻印の裏付け」を、東京まで来ずに手に入れられます。 / We supply live sellers, boutiques and family jewelry businesses in Japan and the Philippines with K18 gold at trade prices. You get the hallmark story your customers already want to hear, without flying here to source it.
- Bullets:
  - 1回のご注文は10点から。チェーン、バングル、リング、ピアスを組み合わせ可。 / Minimum 10 pieces per order. Mix chains, bangles, rings and earrings.
  - 価格はグラム重量と当日の金相場に連動。 / Pricing tied to gram weight and the day's gold rate.
  - 全SKUに写真・仕様書・純度証明書を添付。 / Photos, spec sheets and a purity certificate for every SKU.
  - 在庫品は5営業日以内に東京から保険付きで発送。 / In-stock items ship insured from Tokyo within 5 business days.
  - 円またはペソでお支払い。3回目以降のご注文で30日払いをご相談可。 / Pay in JPY or PHP. Established partners can apply for 30-day terms after the third order.

Form fields: name (required), business/page name (required), email (required), mobile/WhatsApp, market (Japan / Philippines / Both / Elsewhere), monthly volume (Testing 10–20 / 20–50 / 50–200 / 200+), notes (textarea). Submit label: 価格表を受け取る / Send me the price list. Success text: 送信しました。1営業日以内に価格表と担当者からのご連絡をお送りします。 / Sent. The price list and a message from our team will reach you within one business day.

Implementation: client component `components/wholesale/inquiry-form.tsx` posting to a new route `app/api/wholesale/route.ts`, which validates with zod and calls a new `hub.wholesaleInquiry(body)` → `POST /wholesale/inquiry` (add to `lib/hub-api.ts`, fixture mode returns `{ok:true}`). The Hub endpoint and `wholesale_inquiries` table already exist (la-tracking commit 91fb4d0); body `{name, business, email, phone?, market: JP|PH|BOTH|OTHER, volume: TEST|20_50|50_200|200_PLUS, notes?, lang}`. Add it to `supabase/contracts/api.md`.

## 3. `/faq`
Use `<details>` accordions styled like the existing site. Seven questions, JA + EN. Include FAQPage JSON-LD via `components/site/json-ld.tsx` (extend it with a `faq` type taking `{q,a}[]`).

1. 本当に日本製ですか？ / Is your gold really made in Japan? — Yes. Every gold piece is K18 (75% pure), carries the K18 stamp and a maker's mark, and is made by Japanese workshops we work with directly. We describe gold by its purity and where it is crafted, never by a country name as a substitute for a purity claim. (JA equivalent.)
2. 分割予約のしくみは？ / How does layaway work? — 30% to reserve; balance in equal monthly payments over 3–6 months at 0% interest; ¥300,000+ up to 8 months; written schedule; reminders 3 days before each due date; ships after the last payment.
3. フィリピンへの配送とペソ払いはできますか？ / Do you ship to the Philippines and can I pay in pesos? — Ships insured from Tokyo. Peso figures on the site are indicative at the day's rate; payment is settled in yen (state this exactly — the Hub prices in JPY only).
4. 家族へのプレゼントとして送れますか？ / Can I buy for family back home? — Para Sa Iba: pay here, we deliver to your family in Japan or the Philippines with your note; for layaway, ships after the final payment; points go to the payer.
5. ライブで予約した商品を支払わないとどうなりますか？ / What happens to my claimed piece from Live if I don't pay right away? — Claimed pieces are held for 60 minutes for every member; after that the piece returns to sale.
6. 買い取りはしていますか？ / Will you buy it back? — K18 pieces bought from us: quoted in writing against the current gold price, valid 7 days. Preloved luxury: consignment help instead.
7. 卸売の最低数量は？ / What are your wholesale minimums? — 10 pieces per order, mixed SKUs; pricing by gram weight and the day's rate; 30-day terms possible after the third order.

## 4. `/gold-guide`
Three sections with the `.facts` style grid from the home page:
- K18とは / What K18 means — 75% gold, remaining 25% alloy sets hardness and colour; K24 too soft for daily wear; K18 is the fine-jewelry standard in Japan. Mention that 750 and Au750 are the same standard as K18 (European marking).
- 刻印の読み方 / How to read the stamp — K18 or 750, plus maker's mark; PT900/PT950 for platinum; where to look (clasp tab, inside of ring, earring post).
- お手入れ / Care — warm water and mild soap, soft cloth, store separately, avoid hot springs and chlorine; pearls: wipe after wearing, restring every few years.
End with a CTA to `/collections`.

## 5. `/legal/privacy` and `/legal/terms`
Bilingual pages (JA first, then EN below). Mark each with a visible line: `最終更新 2026-09-08 · 法務レビュー前の草案 / Draft pending legal review` so nobody mistakes them for final.
- Privacy: operator = 株式会社チャジュエルズ; data collected (name, contact, delivery address, order and layaway records, loyalty points, site usage); purposes; sharing only with delivery, payment and messaging providers; retention; rights (access, correction, deletion) and the contact address chajewelsjapan@gmail.com; reference to APPI (Japan) and the Data Privacy Act (Philippines) for PH customers; cookies limited to language/session.
- Terms: prices in JPY; peso figures indicative; layaway summary with a link to `/layaway`; live-claim hold rule (60 minutes); shipping and risk of loss; returns 7 days unused (matching the tokusho page); repairs and buy-back as described on the site; governing law Japan, Tokyo District Court.

Link both from the footer (already there) and from the loyalty join form consent line.

## 6. Restore CI
Add `.github/workflows/ci.yml`: on push/PR, Node 22, `npm ci`, `npm run check:terms`, `npm run typecheck`, `npm run lint`. Delete the template `node.js.yml` that was added from GitHub's UI. (If the push is rejected for missing `workflow` scope, commit everything else first and report that the workflow files need a token with `workflow` scope.)

## 7. Sitemap and nav
Add the new routes to `app/sitemap.ts`. Add FAQ and Gold Guide to the footer Help column; add Wholesale to the header nav after Loyalty (JA 卸売 / EN Wholesale).

## Done when
`npm run check:terms` and `npm run typecheck` pass, all new routes return 200 in `NEXT_PUBLIC_PREVIEW_FIXTURES=1` mode, and the commit is on `main`. Report the Vercel deployment URL.

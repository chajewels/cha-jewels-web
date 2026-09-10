export type Lang = "ja" | "en";
export const LANG_COOKIE = "cj-lang";
export const DEFAULT_LANG: Lang = "ja";

export const dict = {
  nav: { home: { ja: "ホーム", en: "Home" }, about: { ja: "私たちについて", en: "About Us" }, blog: { ja: "ブログ", en: "Blog" }, collections: { ja: "コレクション", en: "Collections" }, layaway: { ja: "分割予約", en: "Layaway" }, loyalty: { ja: "会員プログラム", en: "Loyalty" }, claim: { ja: "ライブ予約の確定", en: "Claim from Live" } },
  hero: {
    h1a: { ja: "身につける資産。", en: "Gold you can wear." }, h1b: { ja: "証明できる価値。", en: "Value you can prove." },
    lede: { ja: "日本の工房で作られたK18ゴールド、あこや真珠、鑑定書付きダイヤモンド。すべて重量で価格を明示。無利息の分割予約で一点から、卸売なら東京から直接。次の世代へ受け継ぐ、資産としてのジュエリーです。", en: "K18 gold, Akoya pearls and certified diamonds, crafted in Japanese workshops and priced by what they weigh. Buy one piece on 0% layaway, stock your shop from Tokyo, or build a gold collection your daughter will inherit." },
    cta1: { ja: "コレクションを見る", en: "Shop the collections" }, cta2: { ja: "分割予約を計算する", en: "Calculate layaway" },
  },
  home: {
    colsH: { ja: "アイテム別に探す", en: "Shop by type" },
    colsP: { ja: "ゴールドはすべてK18、刻印入り、日本製。すべての商品に重量・純度・石の情報を表示しています。", en: "Every gold piece is K18, stamped and Made in Japan. Every listing shows weight, purity and stones." },
    newH: { ja: "新着", en: "New on the bench" }, viewAll: { ja: "すべての商品を見る", en: "View all pieces" },
    layH: { ja: "今すぐ予約、月々のお支払い", en: "Reserve it now, pay it off monthly" },
    layP: { ja: "30%のお支払いで商品を確保。残額は無利息で月々均等払い。¥300,000以上のご注文は最長8か月まで。", en: "Pay 30% to take the piece off the shelf, then the balance in equal monthly amounts at 0% interest. Orders of ¥300,000 and above can stretch to eight months." },
  },
  product: { metal: { ja: "素材", en: "Metal" }, weight: { ja: "重量", en: "Weight" }, stone: { ja: "石", en: "Stone" }, reserveFrom: { ja: "予約金", en: "reserve from" }, reserved: { ja: "予約済み", en: "Currently reserved" }, orReserve: { ja: "または {dp} で予約し、残額を無利息で月々お支払い", en: "or reserve with {dp} and pay the rest monthly at 0% interest" }, madeInJapan: { ja: "K18ゴールド · 日本製", en: "K18 gold · Made in Japan" } },
  calc: { price: { ja: "商品価格", en: "Piece price" }, term: { ja: "期間（か月）", en: "Term (months)" }, currency: { ja: "通貨", en: "Currency" }, dp: { ja: "予約金（30%）", en: "Down payment (30%)" }, monthly: { ja: "月々", en: "Monthly" }, total: { ja: "合計", en: "Total" }, note: { ja: "概算です。正確な日程と金額は契約書に記載します。", en: "Estimate. Your signed agreement shows exact dates and amounts." }, updating: { ja: "更新中…", en: "Updating…" }, err: { ja: "見積もりを取得できませんでした", en: "Could not get a quote" }, eightNote: { ja: "（¥300,000以上）", en: "(¥300,000+)" }, phpNote: { ja: "ペソ表示は本日のレートによる参考値です。お支払いは円建てで確定します。", en: "Peso figures are indicative at today's rate. Payments are settled in yen." } },
  collection: { empty: { ja: "まだ商品が登録されていません。Hubで追加された商品は1分以内に表示されます。", en: "No pieces are listed here yet. New pieces are added from the Hub and appear within a minute." } },
  footer: { blurb: { ja: "日本製のK18ゴールド、パール、ダイヤモンドジュエリーと、厳選したプレラブド・ラグジュアリー。東京のお客様と、世界中のフィリピン人ファミリーのために。", en: "K18 gold, pearl and diamond jewelry crafted in Japan, and curated preloved luxury. For our neighbours in Tokyo and Filipino families everywhere." }, shop: { ja: "ショップ", en: "Shop" }, help: { ja: "サポート", en: "Help" }, legal: { ja: "法的情報", en: "Legal" }, terms: { ja: "分割予約規約", en: "Layaway terms" }, faq: { ja: "よくある質問", en: "FAQ" }, privacy: { ja: "プライバシーポリシー", en: "Privacy policy" }, sale: { ja: "利用規約", en: "Terms of sale" } },
  loyalty: {
    h1: { ja: "積み上がる会員プログラム", en: "Loyalty that adds up" },
    lede: { ja: "¥10,000のお買い上げごとに100ポイント。1ポイント＝¥1として次回のお買い物にご利用いただけます。6か月以内にご購入があればポイントは失効しません。ポイントは譲渡・換金できません。", en: "Every ¥10,000 spent earns 100 points, and one point is worth ¥1 on your next piece. Points stay active as long as you buy something within six months. Points cannot be transferred or cashed out." },
    levelsH: { ja: "レベルの仕組み", en: "How the levels work" },
    levelsP: { ja: "レベルは過去12か月のお買い上げ合計で決まります。上のレベルに達すると即時に反映され、その日から特典が使えます。", en: "Your level is set by your total purchases over the past 12 months. Reaching the next level applies immediately, and the perks start the same day." },
    threshold: { ja: "12か月の累計", en: "12-month total" }, perks: { ja: "特典", en: "Perks" },
    multiplier: { ja: "ポイント倍率", en: "Points" }, requalify: { ja: "継続条件", en: "To requalify" },
    requalifyNone: { ja: "不要", en: "Not required" },
    holdNote: { ja: "ご予約いただいた商品は、レベルを問わず60分間お取り置きします。", en: "A claimed piece is held for 60 minutes, the same at every level." },
    join: { ja: "無料で入会する", en: "Join free" }, joinH: { ja: "入会はこちら", en: "Join the program" },
    joinP: { ja: "入会は無料です。お名前と連絡先だけで、次回のお買い物からポイントが貯まります。", en: "Joining is free. Just a name and a way to reach you, and points start with your next purchase." },
    name: { ja: "お名前", en: "Your name" }, contact: { ja: "携帯番号またはメール", en: "Mobile number or email" }, region: { ja: "お住まいの地域", en: "Where you live" }, submit: { ja: "入会する", en: "Join" },
    ok: { ja: "ご入会ありがとうございます。担当者から1営業日以内にご連絡します。", en: "You are in. A team member will confirm within one business day." },
    consent: { ja: "入会により利用規約とプライバシーポリシーに同意したものとみなします。", en: "By joining you agree to the terms of sale and privacy policy." },
  },
  about: { h1: { ja: "私たちについて", en: "About Us" } },
  blog: { h1: { ja: "ブログ", en: "Blog" }, back: { ja: "ブログ一覧へ", en: "All posts" } },
} as const;

type Leaf = { ja: string; en: string };
export function tr(lang: Lang) {
  return function t<S extends keyof typeof dict, K extends keyof (typeof dict)[S]>(section: S, key: K, vars?: Record<string, string>) {
    let s: string = ((dict[section][key] as unknown) as Leaf)[lang];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
  };
}

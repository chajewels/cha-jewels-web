export type Lang = "ja" | "en";
export const LANG_COOKIE = "cj-lang";
export const DEFAULT_LANG: Lang = "ja";

export const dict = {
  nav: { home: { ja: "ホーム", en: "Home" }, about: { ja: "私たちについて", en: "About Us" }, blog: { ja: "ブログ", en: "Blog" }, collections: { ja: "コレクション", en: "Collections" }, layaway: { ja: "分割予約", en: "Layaway" }, loyalty: { ja: "会員プログラム", en: "Loyalty" }, claim: { ja: "ライブ予約の確定", en: "Claim from Live" }, wholesale: { ja: "卸売", en: "Wholesale" }, account: { ja: "アカウント", en: "Account" } },
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
  calc: { price: { ja: "商品価格", en: "Piece price" }, term: { ja: "期間（か月）", en: "Term (months)" }, currency: { ja: "通貨", en: "Currency" }, dp: { ja: "予約金（30%）", en: "Down payment (30%)" }, monthly: { ja: "月々", en: "Monthly" }, total: { ja: "合計", en: "Total" }, note: { ja: "概算です。正確な日程と金額は契約書に記載します。", en: "Estimate. Your signed agreement shows exact dates and amounts." }, updating: { ja: "更新中…", en: "Updating…" }, err: { ja: "見積もりを取得できませんでした", en: "Could not get a quote" }, eightNote: { ja: "（¥300,000以上）", en: "(¥300,000+)" }, phpNote: { ja: "ペソ表示は本日のレートによる参考値です。お支払いは円建てで確定します。", en: "Peso figures are indicative at today's rate. Payments are settled in yen." }, rateAsOf: { ja: "レート基準日 {date}", en: "Rate as of {date}" } },
  collection: {
    empty: { ja: "まだ商品が登録されていません。Hubで追加された商品は1分以内に表示されます。", en: "No pieces are listed here yet. New pieces are added from the Hub and appear within a minute." },
    emptyFiltered: { ja: "この条件に該当する商品はありません。", en: "No pieces match this filter." },
    filterLabel: { ja: "状態でしぼり込む", en: "Filter by condition" },
    filterAll: { ja: "すべて", en: "All" }, filterNew: { ja: "新品", en: "New" }, filterPreloved: { ja: "プレラブド", en: "Preloved" },
  },
  footer: { blurb: { ja: "日本製のK18ゴールド、パール、ダイヤモンドジュエリーと、厳選したプレラブド・ラグジュアリー。東京のお客様と、世界中のフィリピン人ファミリーのために。", en: "K18 gold, pearl and diamond jewelry crafted in Japan, and curated preloved luxury. For our neighbours in Tokyo and Filipino families everywhere." }, shop: { ja: "ショップ", en: "Shop" }, help: { ja: "サポート", en: "Help" }, legal: { ja: "法的情報", en: "Legal" }, terms: { ja: "分割予約規約", en: "Layaway terms" }, faq: { ja: "よくある質問", en: "FAQ" }, goldGuide: { ja: "ゴールドの基礎知識", en: "Gold guide" }, privacy: { ja: "プライバシーポリシー", en: "Privacy policy" }, sale: { ja: "利用規約", en: "Terms of sale" } },
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
  wholesale: {
    h1: { ja: "東京から直接、店舗の仕入れを", en: "Stock your shop from Tokyo" },
    lede: { ja: "ライブ販売者、ブティック、ファミリー経営の宝飾店に、K18ゴールドを卸価格で供給しています。お客様が求める「刻印の裏付け」を、東京まで来ずに手に入れられます。", en: "We supply live sellers, boutiques and family jewelry businesses in Japan and the Philippines with K18 gold at trade prices. You get the hallmark story your customers already want to hear, without flying here to source it." },
    formH: { ja: "価格表のご請求", en: "Request the price list" },
    name: { ja: "お名前", en: "Your name" }, business: { ja: "店舗名・ページ名", en: "Business or page name" },
    email: { ja: "メールアドレス", en: "Email" }, phone: { ja: "携帯番号 / WhatsApp（任意）", en: "Mobile or WhatsApp (optional)" },
    market: { ja: "販売地域", en: "Where you sell" }, volume: { ja: "月間の想定数量", en: "Monthly volume" },
    notes: { ja: "ご要望（任意）", en: "Anything else (optional)" },
    submit: { ja: "価格表を受け取る", en: "Send me the price list" },
    ok: { ja: "送信しました。1営業日以内に価格表と担当者からのご連絡をお送りします。", en: "Sent. The price list and a message from our team will reach you within one business day." },
    err: { ja: "送信できませんでした。もう一度お試しください。", en: "Could not submit. Please try again." },
  },
  faq: { h1: { ja: "よくある質問", en: "Frequently asked questions" }, lede: { ja: "お問い合わせの多いご質問をまとめました。ほかにご不明な点があればお気軽にご連絡ください。", en: "The questions we are asked most. If yours is not here, please get in touch." } },
  gold: { h1: { ja: "ゴールドの基礎知識", en: "The gold guide" }, lede: { ja: "K18の意味、刻印の読み方、長く美しく保つためのお手入れ。購入前に知っておいていただきたいことをまとめました。", en: "What K18 means, how to read a stamp, and how to keep a piece looking right. The things worth knowing before you buy." }, cta: { ja: "コレクションを見る", en: "Shop the collections" } },
  legal: { draft: { ja: "最終更新 2026-09-08 · 法務レビュー前の草案", en: "Last updated 2026-09-08 · Draft pending legal review" } },
  account: {
    h1: { ja: "アカウント", en: "Your account" },
    loginH: { ja: "サインイン", en: "Sign in" },
    loginP: { ja: "メールアドレスにサインイン用のリンクをお送りします。パスワードは不要です。", en: "We email you a sign-in link. No password to remember." },
    email: { ja: "メールアドレス", en: "Email" },
    sendLink: { ja: "リンクを送る", en: "Email me a link" },
    sent: { ja: "リンクをお送りしました。メールをご確認ください。リンクは1回のみ有効です。", en: "Check your email. The link works once." },
    err: { ja: "送信できませんでした。もう一度お試しください。", en: "Could not send the link. Please try again." },
    note: { ja: "現在はメールでのサインインのみご利用いただけます。SMSでのサインインは準備中です。", en: "Email sign-in only for now. Signing in by SMS is not available yet." },
    signOut: { ja: "サインアウト", en: "Sign out" },
    profile: { ja: "お客様情報", en: "Your details" },
    name: { ja: "お名前", en: "Name" }, code: { ja: "お客様番号", en: "Customer number" },
    loyalty: { ja: "会員プログラム", en: "Loyalty" },
    tier: { ja: "レベル", en: "Level" }, points: { ja: "ポイント", en: "Points" },
    notEnrolled: { ja: "まだご入会いただいていません。", en: "You have not joined yet." },
    addresses: { ja: "お届け先", en: "Addresses" },
    noAddresses: { ja: "お届け先が登録されていません。ご注文時にご登録いただけます。", en: "No addresses saved yet. You can add one at checkout." },
    default: { ja: "既定", en: "Default" },
    unavailable: { ja: "アカウント情報を読み込めませんでした。しばらくしてからもう一度お試しください。", en: "We could not load your account just now. Please try again shortly." },
    soon: { ja: "ご注文と分割予約の履歴は順次公開します。", en: "Orders and layaway plans appear here as they go live." },
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

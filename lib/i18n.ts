export type Lang = "ja" | "en";
export const LANG_COOKIE = "cj-lang";
export const DEFAULT_LANG: Lang = "ja";

/**
 * Query parameter that sets the language for a shareable link, e.g.
 * /layaway?lang=en. Honoured by the middleware, which treats it exactly like
 * pressing the toggle: it writes the cookie, so the choice sticks for the rest
 * of the visit. This is what makes an English link postable — the Filipino
 * customer base arrives from Facebook, and without it every such link lands on
 * Japanese and therefore on no layaway at all.
 */
export const LANG_PARAM = "lang";

/**
 * Request header the middleware uses to tell a server render which path it is.
 *
 * `generateMetadata` is handed params and searchParams but never the pathname,
 * and a layout's metadata is what every page inherits — so without this the
 * root layout cannot name the page it is describing. That is exactly how every
 * URL on the site came to declare rel=canonical pointing at the home page.
 */
export const PATH_HEADER = "x-cj-path";

/** A value we are willing to treat as a language choice. */
export function asLang(value: string | null | undefined): Lang | null {
  return value === "ja" || value === "en" ? value : null;
}

/**
 * WHICH LANGUAGE DOES THIS VISITOR GET? ONE RULE, ONE PLACE.
 *
 * Order of authority:
 *   1. An explicit choice — the `cj-lang` cookie, written by the toggle or by
 *      ?lang=. It always wins; detection never overrides a person.
 *   2. Accept-Language, on a FIRST visit only (owner decision 2026-09-15).
 *   3. DEFAULT_LANG (ja) when the browser expresses no preference at all.
 *
 * THE DETECTION RULE, stated so it can be argued with rather than reverse
 * engineered: Japanese only for a visitor who actually asks for Japanese.
 * A header that ranks Japanese above every other tag we understand gets `ja`;
 * anything else gets `en`, including languages we do not serve — someone whose
 * browser asks for `tl`, `fil`, `zh` or `de` reads neither of our two
 * languages natively, and English is the likelier second. No header at all
 * (most crawlers, some bots) falls through to DEFAULT_LANG.
 *
 * WHY THIS EXISTS: before it, `ja` was served to every first-time visitor
 * because nothing looked at the browser at all, so a Filipino customer
 * following a link landed on Japanese — and since 2026-09-15 that also means
 * landing on a site with no layaway. The default was working against the
 * customer base the feature is for.
 *
 * q-values are respected, so `en;q=0.9, ja;q=0.4` is an English reader who can
 * also read some Japanese, and gets English. `q=0` is an explicit refusal of
 * that language, and a bare `*` is "anything" — no preference, so DEFAULT_LANG.
 */
export function detectLang(acceptLanguage: string | null | undefined): Lang {
  if (!acceptLanguage || !acceptLanguage.trim()) return DEFAULT_LANG;

  let best: { lang: Lang; q: number } | null = null;
  for (const part of acceptLanguage.split(",")) {
    const [tagRaw, ...params] = part.trim().split(";");
    const tag = tagRaw.trim().toLowerCase();
    if (!tag) continue;

    // "*" is "any language is acceptable" — no preference at all, so it is not
    // evidence that the visitor cannot read Japanese. Treated as no signal.
    if (tag === "*") return DEFAULT_LANG;

    const lang: Lang | null = tag === "ja" || tag.startsWith("ja-")
      ? "ja"
      : tag === "en" || tag.startsWith("en-")
        ? "en"
        : null;
    if (!lang) continue;

    const qParam = params.map((s) => s.trim()).find((s) => s.startsWith("q="));
    const parsed = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
    const q = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 1;
    if (q <= 0) continue; // q=0 is an explicit refusal of that language.

    // Strictly greater, so the earliest tag wins a tie — the order the browser
    // sent is itself a preference.
    if (!best || q > best.q) best = { lang, q };
  }

  // A header that named languages but none of ours (tl, fil, zh, de …) reaches
  // here with best === null. That visitor is not a Japanese reader, so English.
  if (!best) return "en";
  return best.lang;
}

/** The whole resolution in one call: explicit choice, else detection. */
export function resolveLang(
  cookieValue: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Lang {
  return asLang(cookieValue) ?? detectLang(acceptLanguage);
}

export const dict = {
  newsletter: { placeholder: { ja: "メールアドレス", en: "Email address" }, submit: { ja: "登録", en: "Sign up" }, success: { ja: "ご登録ありがとうございます。", en: "Thank you — you're on the list." }, already: { ja: "すでにご登録いただいています。", en: "You're already subscribed." }, invalid: { ja: "メールアドレスをご確認ください。", en: "Please check the email address." }, rateLimited: { ja: "しばらく時間をおいてからお試しください。", en: "Too many attempts — please try again shortly." }, error: { ja: "登録できませんでした。時間をおいてお試しください。", en: "We couldn't sign you up. Please try again later." }, unsubscribed: { ja: "配信を停止しました。", en: "You're unsubscribed." } },
  nav: { skip: { ja: "本文へ", en: "Skip to content" }, primary: { ja: "メインナビゲーション", en: "Primary" }, openMenu: { ja: "メニューを開く", en: "Open menu" }, closeMenu: { ja: "メニューを閉じる", en: "Close menu" }, language: { ja: "言語", en: "Language" }, langJa: { ja: "日本語", en: "日本語" }, langEn: { ja: "EN", en: "EN" }, home: { ja: "ホーム", en: "Home" }, about: { ja: "ブランドについて", en: "About Us" }, blog: { ja: "ブログ", en: "Blog" }, collections: { ja: "コレクション", en: "Collections" }, layaway: { ja: "分割予約", en: "Layaway" }, loyalty: { ja: "ロイヤルティ", en: "Loyalty" }, wholesale: { ja: "卸売", en: "Wholesale" }, account: { ja: "マイアカウント", en: "Account" }, cart: { ja: "カート", en: "Cart" }, orders: { ja: "ご注文履歴", en: "Orders" } },
  /**
   * Header menu copy. `tr` reads dict[section][key] as a {ja,en} leaf, so these
   * are flat keys in their own section rather than a nested nav.company object,
   * which that helper cannot index.
   *
   * The Japanese was OWNER-REVIEWED 2026-09-22 and is settled. Note that
   * faqDesc's two languages say different things on purpose; the comment on
   * that key explains why.
   */
  navMenu: {
    company: { ja: "会社情報", en: "Company" },
    companyMenu: { ja: "会社情報メニュー", en: "Company menu" },
    collections: { ja: "コレクション", en: "Collections" },
    collectionsMenu: { ja: "コレクションメニュー", en: "Collections menu" },
    shopByType: { ja: "種類から探す", en: "Shop by type" },
    categories: { ja: "カテゴリー", en: "Categories" },
    viewAll: { ja: "コレクションをすべて見る", en: "View all collections" },
    about: { ja: "ブランドについて", en: "About Us" },
    aboutDesc: { ja: "私たちの歩みと基準、東京の拠点。", en: "Our story, our standards, our Tokyo base." },
    why: { ja: "Cha Jewelsが選ばれる理由", en: "Why Cha Jewels" },
    whyDesc: { ja: "お選びいただく理由と、私たちのお約束。", en: "What you can expect from us, and why it matters." },
    faq: { ja: "よくある質問", en: "FAQ" },
    // JA DELIBERATELY DOES NOT MATCH EN HERE. Layaway is offered on the
    // English site only (lib/layaway-availability.ts, owner decision
    // 2026-09-15), so the Japanese description must not advertise it — the
    // menu would be promising a page that 404s in Japanese. The English keeps
    // it, because in English it is real.
    faqDesc: { ja: "配送・返品・ポイントなどのご質問に。", en: "Answers on layaway, delivery, returns and loyalty." },
    blog: { ja: "ブログ", en: "Blog" },
    blogDesc: { ja: "ジュエリーの選び方、お手入れ、読みもの。", en: "Choosing, caring for and living with jewelry." },
    news: { ja: "お知らせ", en: "News & Updates" },
    newsDesc: { ja: "新着情報とお知らせ。", en: "New arrivals and announcements." },
    contact: { ja: "お問い合わせ", en: "Contact" },
    contactDesc: { ja: "ご連絡先と所在地。", en: "How to reach us, and where we are." },
    affiliations: { ja: "所属団体", en: "Affiliations" },
    affiliationsDesc: { ja: "東京の経済団体への所属。", en: "Our memberships in Tokyo's business community." },
  },
  /**
   * /why-cha-jewels. The ENGLISH IS THE OWNER'S, VERBATIM — do not reword it,
   * tighten it, or "fix" its punctuation. The JAPANESE WAS OWNER-REVIEWED
   * 2026-09-22 and is settled on the same terms — it is written in the same
   * 敬体 register as the about page and borrows the site's settled renderings
   * (プレラブド, 分割予約).
   *
   * s4 is the layaway section and renders only where layaway is offered
   * (English only, owner decision 2026-09-15) — lib/layaway-availability is the
   * one rule. The Japanese is kept here anyway so the day layaway opens in JA
   * the copy is not the thing blocking it.
   */
  why: {
    h1: { ja: "Cha Jewelsが選ばれる理由", en: "Why Cha Jewels Is the Right Choice for You!" },
    sub: { ja: "心を込めて選んだジュエリー。明確な情報。お一人おひとりへの丁寧な対応。", en: "Thoughtfully chosen jewelry. Clear details. Personal care." },
    intro: { ja: "ジュエリーは、お客様の物語の一部になります。Cha Jewelsでは、お客様らしさを映し、人生の節目を彩り、長く大切に思っていただける一点をお選びいただけるようお手伝いします。", en: "Jewelry becomes part of your story. At Cha Jewels, we help you choose pieces that reflect your style, celebrate your milestones, and feel meaningful for years to come." },
    s1h: { ja: "日本を拠点とした、お一人おひとりとのつながり", en: "A Personal Connection, Rooted in Japan" },
    s1p: { ja: "2021年からお客様にご愛顧いただき、2024年に法人化しました。東京を拠点とするCha Jewelsは、お客様お一人おひとりとの関係を大切にしています。", en: "Serving our community since 2021 and incorporated in 2024, Tokyo-based Cha Jewels brings a personal approach to every customer relationship." },
    s2h: { ja: "お探しの一点に出会う、より多くの選択肢", en: "More Ways to Find Your Perfect Piece" },
    s2p: { ja: "新品のファインジュエリーに加え、厳選したプレラブドの時計、ブランドジュエリー、デザイナーアクセサリー、ノーブランドジュエリーをご用意しています。", en: "Discover new fine jewelry alongside carefully selected preloved watches, branded jewelry, designer accessories, and unbranded jewelry." },
    s3h: { ja: "納得してお選びいただくための情報", en: "Details That Help You Choose Confidently" },
    s3p: { ja: "素材、寸法、状態、ご用意できる書類について明確にお伝えし、見た目だけではわからない一点一点の違いをご理解いただけるようにしています。", en: "We make relevant materials, measurements, condition, and available documentation clear, helping you understand each piece beyond its appearance." },
    s4h: { ja: "お求めやすくするための柔軟なお支払い方法", en: "Flexible Ways to Make It Yours" },
    s4p: { ja: "無金利の分割予約をご利用いただけます。適用される条件は、お申し込み前にご説明します。", en: "Our interest-free layaway options help you plan your purchase, with applicable terms explained before you commit." },
    s5h: { ja: "ご購入後も続くサポート", en: "Support Beyond Your Purchase" },
    s5p: { ja: "商品の比較から、お手入れの方法まで。ご質問にお答えし、ご利用いただけるサービスをご案内します。", en: "From comparing pieces to understanding their care, we're here to answer your questions and guide you through available services." },
    close: { ja: "お客様の物語の一部となる一点を、ぜひ見つけてください。", en: "Find a piece that becomes part of your story." },
    cta: { ja: "コレクションを見る", en: "Explore Our Collections" },
    imageAlt: { ja: "クリーム色の布の上に並べたCha Jewelsのゴールドネックレス、リング、パールピアス", en: "A Cha Jewels gold necklace, ring and pearl earrings arranged on cream fabric" },
  },
  /**
   * /contact. Every VALUE on that page is read from lib/content/legal.ts —
   * these keys are labels only. No address, email or number is typed here, so
   * there is one place a contact detail can be wrong.
   *
   * Both phone numbers ARE published here, as tel: links from the same
   * COMPANY_PHONE constant tokusho prints: they were confirmed digit by digit
   * on 2026-09-21. (This comment said the opposite until 2026-09-22 — it was
   * written while they were still being checked and outlived the check.)
   *
   * STILL NO OPENING HOURS: they are in no source file, and are not invented
   * here.
   *
   * The Japanese was OWNER-REVIEWED 2026-09-22 and is settled.
   */
  contact: {
    h1: { ja: "お問い合わせ", en: "Contact" },
    intro: { ja: "ご質問やお見積りなど、お気軽にご連絡ください。", en: "Questions, quotes or anything about a piece — we're glad to hear from you." },
    company: { ja: "会社名", en: "Company" },
    address: { ja: "所在地", en: "Address" },
    email: { ja: "メールアドレス", en: "Email" },
    phoneOffice: { ja: "電話（代表）", en: "Phone (office)" },
    phoneMobile: { ja: "電話（携帯）", en: "Phone (mobile)" },
    map: { ja: "Googleマップで見る", en: "View on Google Maps" },
    follow: { ja: "フォローする", en: "Follow us" },
    legalNote: { ja: "特定商取引法に基づく表記に、事業者情報の全文を掲載しています。", en: "Full business details are on our legal notice." },
    // /affiliations. Memberships are FACTS about the business, so the two
    // entries state what they are and nothing more — no logos, no member
    // numbers, no claim that a membership certifies anything about a piece.
    // The two-panel section and its form.
    h1Panel: { ja: "お問い合わせ", en: "Get in touch" },
    panelLede: { ja: "ご質問やお見積りなど、下のフォームからお気軽にご連絡ください。1営業日以内にご返信します。", en: "Questions, quotes or anything about a piece — send us a note below and we'll reply within one business day." },
    fullName: { ja: "お名前", en: "Full name" },
    phoneOptional: { ja: "電話番号（任意）", en: "Phone (optional)" },
    message: { ja: "お問い合わせ内容", en: "Message" },
    messageCount: { ja: "{n} / {max} 文字", en: "{n} / {max} characters" },
    newsletterOptIn: { ja: "ニュースレターを受け取る", en: "Send me the newsletter" },
    send: { ja: "送信する", en: "Send" },
    sending: { ja: "送信中…", en: "Sending…" },
    sent: { ja: "ありがとうございます。1営業日以内にご返信します。", en: "Thank you — we'll reply within one business day." },
    invalid: { ja: "入力内容をご確認ください。お名前、メールアドレス、10文字以上のお問い合わせ内容が必要です。", en: "Please check the form. We need your name, a valid email address and a message of at least 10 characters." },
    rateLimited: { ja: "しばらく時間をおいてからお試しください。", en: "Too many attempts — please try again shortly." },
    error: { ja: "送信できませんでした。時間をおいてお試しいただくか、メールでご連絡ください。", en: "We couldn't send your message. Please try again shortly, or email us instead." },
    affiliationsH: { ja: "所属団体", en: "Affiliations" },
    affiliationsLede: { ja: "Cha Jewelsが所属している東京の経済団体です。", en: "The business organisations Cha Jewels belongs to in Tokyo." },
    afCciName: { ja: "東京商工会議所", en: "Tokyo Chamber of Commerce and Industry" },
    afCciDetail: { ja: "2026年3月入会／葛飾支部 商業部会", en: "Member since March 2026 · Katsushika Branch, Commerce Division" },
    afRotaryName: { ja: "東京葛飾中央ロータリークラブ", en: "Tokyo Katsushika Central Rotary Club" },
    afRotaryDetail: { ja: "2026年9月入会", en: "Member since September 2026" },
    affiliationsFromAbout: { ja: "所属する経済団体については、所属団体のページをご覧ください。", en: "The business organisations we belong to are listed on our affiliations page." },
  },
  hero: {
    h1a: { ja: "身につける、時を超える美しさ。", en: "Timeless beauty to wear." }, h1b: { ja: "受け継がれる、確かな価値。", en: "Lasting value to pass on." },
    // Keep layaway out of the Japanese hero: it is English-only (owner
    // decision 2026-09-15), and the hero is the first thing a Japanese visitor
    // reads. The section and CTA are gated together elsewhere.
    lede: { ja: "Cha Jewelsは、厳選したファインジュエリーを通して、時を超える美しさと永く続く価値をお届けします。日本で仕立てられた上質なゴールド、パール、ダイヤモンドジュエリーから、世界を代表するラグジュアリーブランドの厳選プレラブドアイテムまで。すべての一点を、品質、気品、そして変わらない価値を基準に選んでいます。", en: "Cha Jewels brings together timeless beauty and lasting value through a carefully selected collection of fine jewelry. From high-quality gold, pearl, and diamond pieces crafted in Japan to curated preloved treasures from iconic luxury brands, every piece is chosen for its quality, elegance, and enduring worth." },
    lede2: { ja: "私たちは、ジュエリーは美しいだけのものではなく、大切に受け継ぎ、自信を持って身につけ、次の世代へつないでいけるものであるべきだと考えています。特にゴールドが持つ永続的な価値を大切にし、ネックレス、リング、ブレスレット、そして唯一無二の一点ものまで、お客様の人生の物語に寄り添い続けるジュエリーをご提案します。", en: "We believe jewelry should be more than beautiful—it should be something you can cherish, wear with confidence, and pass on for generations. With a special focus on the lasting value of gold, Cha Jewels offers necklaces, rings, bracelets, and one-of-a-kind pieces designed to become part of your story for a lifetime." },
    cta1: { ja: "コレクションを見る", en: "Shop the collections" }, cta2: { ja: "分割予約を計算する", en: "Calculate layaway" },
    videoPlay: { ja: "背景動画を再生", en: "Play background video" },
    videoPause: { ja: "背景動画を一時停止", en: "Pause background video" },
  },
  home: {
    valuesEyebrow: { ja: "Cha Jewelsが大切にすること", en: "What guides every piece" },
    valuesH: { ja: "私たちの価値観", en: "Our Values" },
    valuesP: { ja: "私たちが選ぶすべてのジュエリーには、流行を超える美しさ、分かりやすい価値、丁寧な仕立て、そして信頼できる品質という4つの基準があります。", en: "Every piece we choose is guided by four standards: beauty beyond trends, value you can understand, careful workmanship and quality you can trust." },
    valuesImageAlt: { ja: "真珠を糸に通す職人の手元", en: "An artisan's hands stringing pearls at a workbench" },
    valueTimelessH: { ja: "普遍性", en: "Timeless" },
    valueTimelessP: { ja: "流行に左右されず、世代を超えて身につけられるデザインを選びます。", en: "We choose designs made to stay relevant beyond seasons and trends." },
    valueWorthH: { ja: "価値", en: "Value" },
    valueWorthP: { ja: "純度・重量・石の情報を明示し、選ぶ理由を分かりやすくお伝えします。", en: "Purity, gram weight and stone details are shown clearly, so you understand what you are buying." },
    valueCraftH: { ja: "職人技", en: "Craftsmanship" },
    valueCraftP: { ja: "仕立てと仕上げを厳選し、長く身につけられる品質を重視します。", en: "We select careful workmanship and finishing intended for years of wear." },
    valueQualityH: { ja: "品質", en: "Quality" },
    valueQualityP: { ja: "すべての商品は、販売前に日本で一点ずつ確認します。", en: "Every piece is checked individually in Japan before it is offered." },
    colsH: { ja: "アイテム別に探す", en: "Shop by type" },
    colsP: { ja: "ゴールドはすべてK18、刻印入り、日本で真贋確認済み。すべての商品に重量・純度・石の情報を表示しています。", en: "Every gold piece is K18, stamped and hallmark checked in Japan. Every listing shows weight, purity and stones." },
    newH: { ja: "新着", en: "New on the bench" }, viewAll: { ja: "すべての商品を見る", en: "View all pieces" },
    layH: { ja: "今すぐ予約、月々のお支払い", en: "Reserve it now, pay it off monthly" },
    layP: { ja: "30%のお支払いで商品を確保。残額は無利息で月々均等払い。3か月、6か月、または¥300,000以上のご注文なら8か月からお選びいただけます。", en: "Pay 30% to take the piece off the shelf, then the balance in equal monthly amounts at 0% interest. Choose three months, six months, or eight for orders of ¥300,000 and above." },
    // Phase 4 (Stitch homepage). New keys only where the design had text with no
    // existing key; where the file's Japanese differed from a key above, the key won.
    trust1H: { ja: "日本国内検品済み", en: "Checked in Japan" },
    colsEyebrow: { ja: "カテゴリーから選ぶ", en: "Browse by category" }, colsLink: { ja: "コレクションを見る", en: "View collection" },
    layPill: { ja: "無利息 · 銀行ローン不要 · 3〜8か月", en: "0% interest · No bank loans · 3 to 8 months" },
    layStep1H: { ja: "頭金30%で取り置き", en: "Reserve with a 30% deposit" }, layStep1P: { ja: "頭金の入金確認後、すぐに商品を確保します。", en: "Your piece is set aside the moment the deposit clears." },
    layStep2H: { ja: "残額を3〜8か月で分割", en: "Spread the balance over 3 to 8 months" }, layStep2P: { ja: "無利息・手数料なし。8か月プランは30万円以上のご注文が対象です。", en: "0% interest, no fees. Eight months on orders of ¥300,000 and above." },
    layStep3H: { ja: "最終回のお支払い後にお届け", en: "Delivered on the final payment" }, layStep3P: { ja: "各回は銀行振込。プラン完了後に発送します。", en: "Pay each instalment by bank transfer; the piece ships once the plan completes." },
    layCalcH: { ja: "レイアウェイ計算", en: "Layaway calculator" }, layCalcP: { ja: "毎月のお支払い目安", en: "Estimate your monthly plan" }, layCalcChip: { ja: "無利息", en: "0% interest" },
    // "Start a layaway" pointed at /layaway, which is the page the button is
    // ON — a self-link, and on the homepage a link to an explainer rather than
    // to anything buyable. A layaway is NOT started from a calculator in any
    // case: it is started from a piece, at checkout. So the button says the
    // next thing the customer actually has to do, and goes where they can do
    // it. See components/commerce/layaway-band.tsx.
    layCta: { ja: "商品を選ぶ", en: "Choose a piece" },
    newEyebrow: { ja: "一点物・新着品", en: "One-of-a-kind, newly listed" }, newDetail: { ja: "詳細を見る", en: "View details" },
    testiEyebrow: { ja: "ご愛用者様の声", en: "Voices" },
    testiH: { ja: "お客様の声", en: "Customer stories" },
    testiP: { ja: "Cha Jewelsでお選びいただいたお客様からのご感想をご紹介します。", en: "Notes from customers who chose Cha Jewels." },
    slideEyebrow: { ja: "カテゴリー", en: "Category" }, slideShop: { ja: "{name}を見る", en: "Shop {name}" },
    slidePrev: { ja: "前のスライド", en: "Previous slide" }, slideNext: { ja: "次のスライド", en: "Next slide" },
    slideDot: { ja: "{n}枚目へ", en: "Go to slide {n}" }, slideOf: { ja: "{total}枚中{n}枚目", en: "{n} of {total}" },
    tabHome: { ja: "ホーム", en: "Home" }, tabPieces: { ja: "作品一覧", en: "Pieces" }, tabLayaway: { ja: "分割購入", en: "Layaway" }, tabLoyalty: { ja: "特典", en: "Rewards" }, tabAccount: { ja: "マイページ", en: "My page" },
  },
  product: { gallery: { ja: "商品写真", en: "Product photos" }, photoOf: { ja: "写真 {n} / {total}", en: "Photo {n} of {total}" }, prevPhoto: { ja: "前の写真", en: "Previous photo" }, nextPhoto: { ja: "次の写真", en: "Next photo" }, originJapan: { ja: "日本製", en: "Made in Japan" }, preloved: { ja: "プレラブド · 日本で真贋確認済み", en: "Preloved · authenticated in Japan" }, metal: { ja: "素材", en: "Metal" }, weight: { ja: "重量", en: "Weight" }, stone: { ja: "石", en: "Stone" }, reserveFrom: { ja: "予約金", en: "reserve from" }, reserved: { ja: "予約済み", en: "Reserved" }, sold: { ja: "売却済み", en: "Sold" }, orReserve: { ja: "または {dp} で予約し、残額を無利息で月々お支払い", en: "or reserve with {dp} and pay the rest monthly at 0% interest" }, reserveCta: { ja: "分割予約で申し込む", en: "Reserve with layaway" }, reserveNote: { ja: "カートに入れて、お支払い手続きで分割予約をお選びください。", en: "Adds the piece to your cart; choose layaway at checkout." } },
  calc: { jpy: { ja: "¥ 円", en: "¥ JPY" }, php: { ja: "₱ ペソ", en: "₱ PHP" }, price: { ja: "商品価格", en: "Piece price" }, term: { ja: "期間（か月）", en: "Term (months)" }, currency: { ja: "通貨", en: "Currency" }, dp: { ja: "予約金（30%）", en: "Down payment (30%)" }, monthly: { ja: "月々", en: "Monthly" }, total: { ja: "合計", en: "Total" }, note: { ja: "概算です。正確な日程と金額は契約書に記載します。", en: "Estimate. Your signed agreement shows exact dates and amounts." }, updating: { ja: "更新中…", en: "Updating…" }, err: { ja: "見積もりを取得できませんでした", en: "Could not get a quote" }, eightNote: { ja: "（¥300,000以上）", en: "(¥300,000+)" }, phpNote: { ja: "ペソ表示は本日のレートによる参考値です。お支払いは円建てで確定します。", en: "Peso figures are indicative at today's rate. Payments are settled in yen." }, unavailableTerm: { ja: "この金額ではご利用いただけません", en: "Not available at this amount" }, invalidPrice: { ja: "0より大きい金額を入力してください", en: "Enter a price greater than zero" }, notLaunched: { ja: "準備中", en: "coming soon" }, minFrom: { ja: "{amount}以上", en: "from {amount}" } },
  search: {
    placeholder: { ja: "ジュエリーを検索", en: "Search jewelry" },
    prompt: { ja: "品名、ブランド名、素材、商品番号などを入力してください。", en: "Type a name, a brand, a metal or a product number." },
    title: { ja: "「{q}」の検索結果", en: "Results for \u201c{q}\u201d" },
    count: { ja: "{n}件の商品が見つかりました。", en: "{n} pieces found." },
    none: { ja: "「{q}」に該当する商品はありませんでした。", en: "Nothing matches \u201c{q}\u201d." },
    seeAll: { ja: "{n}件すべてを見る", en: "See all {n} results" },
    open: { ja: "検索を開く", en: "Open search" },
    close: { ja: "検索を閉じる", en: "Close search" },
  },
  categories: {
    eyebrow: { ja: "カテゴリー", en: "Category" },
  },
  collection: {
    // CUSTOMER COPY. This said "New pieces are added from the Hub and appear
    // within a minute" until 2026-09-22 — "the Hub" is the name of the staff
    // ERP, which no shopper has heard of, and "within a minute" described a
    // cache TTL rather than anything a customer waits for. An empty shelf is
    // not the place to explain our infrastructure; it is the place to point at
    // a shelf that is not empty.
    empty: { ja: "新しい商品を準備中です。現在お求めいただける商品をご覧ください。", en: "New pieces are on their way. Browse what's available now." },
    emptyCta: { ja: "コレクションを見る", en: "Browse collections" },
    emptyFiltered: { ja: "この条件に該当する商品はありません。", en: "No pieces match this filter." },
    filterLabel: { ja: "状態でしぼり込む", en: "Filter by condition" },
    filterAll: { ja: "すべて", en: "All" }, filterNew: { ja: "新品", en: "New" }, filterPreloved: { ja: "プレラブド", en: "Preloved" },
  },
  footer: { follow: { ja: "フォローする", en: "Follow us" }, tokusho: { ja: "特定商取引法に基づく表記", en: "Legal notice (Specified Commercial Transactions Act)" }, invoiceReg: { ja: "適格請求書発行事業者登録番号 T7011801044120", en: "Qualified invoice issuer registration no. T7011801044120" }, shop: { ja: "ショップ", en: "Shop" }, all: { ja: "すべて", en: "All" }, help: { ja: "サポート", en: "Help" }, legal: { ja: "法的情報", en: "Legal" }, terms: { ja: "分割予約規約", en: "Layaway terms" }, faq: { ja: "よくある質問", en: "FAQ" }, goldGuide: { ja: "ゴールドの基礎知識", en: "Gold guide" }, privacy: { ja: "プライバシーポリシー", en: "Privacy policy" }, sale: { ja: "利用規約", en: "Terms of Service" }, returns: { ja: "返品・キャンセル・返金", en: "Returns and refunds" }, collections: { ja: "コレクション", en: "Collections" }, care: { ja: "カスタマーケア・法的情報", en: "Customer care and legal" }, newsletter: { ja: "ニュースレター", en: "Newsletter" }, newsletterNote: { ja: "新着・会員向け先行案内。いつでも解除できます。", en: "New pieces, member previews. Unsubscribe any time." } },
  loyalty: {
    level: { ja: "レベル {n}", en: "Level {n}" }, onJoining: { ja: "入会時", en: "On joining" }, times: { ja: "{n}倍", en: "{n}x" },
    regionJp: { ja: "日本", en: "Japan" }, regionPh: { ja: "フィリピン", en: "Philippines" }, regionOther: { ja: "その他", en: "Elsewhere" },
    contactPlaceholder: { ja: "+81 / +63 / メール", en: "+81 / +63 / email" },
    err: { ja: "送信できませんでした。もう一度お試しください。", en: "Could not submit. Please try again." },
    h1: { ja: "積み上がる会員プログラム", en: "Loyalty that adds up" },
    lede: { ja: "ポイントは最初のレベルGlimmerで1%付与され、上のレベルではこの基本付与率に倍率がかかります。1ポイント＝¥1として次回のお買い物にご利用いただけます。6か月以内にご購入があればポイントは失効しません。ポイントは譲渡・換金できません。", en: "Points earn at 1% on the first level, Glimmer, and the higher levels multiply that base rate. One point is worth ¥1 on your next piece. Points stay active as long as you buy something within six months. Points cannot be transferred or cashed out." },
    levelsH: { ja: "レベルの仕組み", en: "How the levels work" },
    levelsP: { ja: "レベルはこれまでのお買い上げ合計で決まります。上のレベルに達すると即時に反映され、その日から特典が使えます。", en: "Your level is set by your lifetime purchases with Cha Jewels. Reaching the next level applies immediately, and the perks start the same day." },
    inactivityP: { ja: "180日間お買い上げがない場合、レベルは1段階下がります。その後、下の欄の金額をお買い上げいただくと元のレベルに戻ります。", en: "If 180 days pass without a purchase, your level steps down by one. Spend the amount shown below to regain it." },
    threshold: { ja: "これまでのお買い上げ合計", en: "Lifetime purchases" }, perks: { ja: "特典", en: "Perks" },
    multiplier: { ja: "ポイント倍率", en: "Points" }, requalify: { ja: "復帰条件", en: "To regain after 180 days of inactivity" },
    requalifyNone: { ja: "不要", en: "Not required" },
    holdNote: { ja: "ご予約いただいた商品は、はじめてのお客様は24時間、2回目以降のお客様は72時間お取り置きします。会員レベルによる違いはありません。", en: "A claimed piece is held for 24 hours for a new customer and 72 hours for a returning one. This does not vary by level." },
    join: { ja: "無料で入会する", en: "Join free" }, joinH: { ja: "入会はこちら", en: "Join the program" },
    joinP: { ja: "入会は無料です。メールアドレスでサインインすると、次回のお買い物からポイントが貯まります。", en: "Joining is free. Sign in with your email and points start with your next purchase." },
    name: { ja: "お名前", en: "Your name" }, contact: { ja: "携帯番号またはメール", en: "Mobile number or email" }, region: { ja: "お住まいの地域", en: "Where you live" }, submit: { ja: "入会する", en: "Join" },
    ok: { ja: "ご入会ありがとうございます。次回のお買い物からポイントが貯まります。", en: "Welcome, you are a member. Points start with your next purchase." },
    alreadyMember: { ja: "すでに会員です。ポイントはアカウントページでご確認いただけます。", en: "You are already a member. See your points on your account page." },
    joinFailed: { ja: "入会を完了できませんでした。担当者より1営業日以内にご連絡します。", en: "We could not complete your membership. A team member will contact you within one business day." },
    consent: { ja: "入会により利用規約とプライバシーポリシーに同意したものとみなします。", en: "By joining you agree to the terms of sale and privacy policy." },
    groupH: { ja: "会員グループに参加", en: "Join the member group" },
    groupP: { ja: "会員限定のお知らせ・先行案内・サポート", en: "Members-only updates, early previews and support." },
  },
  /**
   * The announcement bar (components/site/announcement-bar.tsx). Its SENTENCE
   * is owner-written in the Hub and is not a dictionary key; the only string
   * this repo owns is the close button's accessible name, because the button
   * is an icon and carries no visible label.
   */
  announcement: {
    dismiss: { ja: "閉じる", en: "Dismiss" },
  },
  /** Accessible names for the social icon buttons (components/site/social-icons.tsx). The icons carry no visible text. */
  social: {
    email: { ja: "メールで問い合わせる", en: "Email us" },
    facebook: { ja: "Facebookページ", en: "Facebook page" },
    messenger: { ja: "Messengerで連絡する", en: "Message us on Messenger" },
    whatsapp: { ja: "WhatsAppグループに参加", en: "Join the WhatsApp group" },
    line: { ja: "LINEグループに参加", en: "Join the LINE group" },
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
  account: {
    print: { ja: "印刷 / PDFで保存", en: "Print / save as PDF" },
    invoiceNo: { ja: "請求書番号", en: "Invoice no." },
    issuedBy: { ja: "発行者", en: "Issued by" },
    h1: { ja: "アカウント", en: "Your account" },
    // "Sign in" alone told a first-time customer they were in the wrong place:
    // there is no separate sign-up on this site — the first link creates the
    // account — and nothing on the page said so.
    loginH: { ja: "ログインまたは新規登録", en: "Sign in or create an account" },
    loginP: { ja: "安全なログインリンクをメールでお送りします。はじめての方は、そのままアカウントが作成されます。", en: "We'll email you a secure link — new customers get an account automatically." },
    sentH: { ja: "メールをご確認ください", en: "Check your email" },
    sentTo: { ja: "{email} にログインリンクをお送りしました。", en: "We sent a sign-in link to {email}." },
    resend: { ja: "リンクを再送する", en: "Send the link again" },
    resendIn: { ja: "再送まで{s}秒", en: "Send again in {s}s" },
    differentEmail: { ja: "別のメールアドレスを使う", en: "Use a different email" },
    linkOnce: { ja: "リンクは1回のみ有効です。", en: "The link works once." },
    linkOnceExpires: { ja: "リンクは1回のみ有効で、{duration}で期限切れとなります。", en: "The link works once and expires after {duration}." },
    expiryMinutes: { ja: "{n}分", en: "{n} minutes" },
    expiryHour: { ja: "1時間", en: "1 hour" },
    expiryHours: { ja: "{n}時間", en: "{n} hours" },
    continueShopping: { ja: "お買い物を続ける", en: "Continue shopping" },
    email: { ja: "メールアドレス", en: "Email" },
    sendLink: { ja: "リンクを送る", en: "Email me a link" },
    err: { ja: "送信できませんでした。もう一度お試しください。", en: "Could not send the link. Please try again." },
    note: { ja: "現在はメールでのサインインのみご利用いただけます。SMSでのサインインは準備中です。", en: "Email sign-in only for now. Signing in by SMS is not available yet." },
    signOut: { ja: "サインアウト", en: "Sign out" },
    configErr: { ja: "ただいまサインインをご利用いただけません。恐れ入りますが、時間をおいて再度お試しください。", en: "Sign-in is temporarily unavailable. Please try again shortly." },
    linkExpired: { ja: "サインインリンクの有効期限が切れているか、すでに使用されています。メールアドレスを入力していただければ、新しいリンクをお送りします。", en: "That sign-in link has expired or was already used. Enter your email and we will send a new one." },
    linkFailed: { ja: "サインインを完了できませんでした。メールアドレスを入力していただければ、新しいリンクをお送りします。", en: "We could not complete sign-in. Enter your email and we will send a fresh link." },
    confirmH: { ja: "サインインを完了する", en: "Finish signing in" },
    confirmP: { ja: "下のボタンを押すとサインインが完了します。このリンクは1回のみ有効です。", en: "Press the button to finish signing in. This link works once." },
    confirmBtn: { ja: "サインイン", en: "Sign in" },
    confirming: { ja: "サインイン中…", en: "Signing in…" },
    profile: { ja: "お客様情報", en: "Your details" },
    name: { ja: "お名前", en: "Name" }, code: { ja: "お客様番号", en: "Customer number" },
    loyalty: { ja: "会員プログラム", en: "Loyalty" },
    tier: { ja: "レベル", en: "Level" }, points: { ja: "ポイント", en: "Points" },
    levelReduced: { ja: "レベル一時変更中", en: "Level temporarily reduced" },
    levelReducedP: { ja: "180日間お買い上げがなかったため、レベルが1段階下がっています。下記の金額をお買い上げいただくと元のレベルに戻ります。", en: "180 days passed without a purchase, so your level has stepped down by one. Spend the amount below and your earned level comes back." },
    earnedLevel: { ja: "これまでに獲得されたレベル", en: "Level you earned" },
    regain: { ja: "復帰までのお買い上げ額", en: "Spend to regain it" },
    levelRule: { ja: "レベルはこれまでのお買い上げ合計で決まります。180日間お買い上げがない場合はレベルが1段階下がり、復帰条件の金額をお買い上げいただくと元に戻ります。", en: "Your level is set by your lifetime purchases. If 180 days pass without a purchase it steps down by one, and it comes back once you spend that level's regain amount." },
    notEnrolled: { ja: "まだご入会いただいていません。", en: "You have not joined yet." },
    addresses: { ja: "お届け先", en: "Addresses" },
    noAddresses: { ja: "お届け先が登録されていません。ご注文時にご登録いただけます。", en: "No addresses saved yet. You can add one at checkout." },
    default: { ja: "既定", en: "Default" },
    unavailable: { ja: "アカウント情報を読み込めませんでした。しばらくしてからもう一度お試しください。", en: "We could not load your account just now. Please try again shortly." },
    /**
     * WAS "Orders and layaway plans appear here as they go live." — true while
     * the account page could only show web orders, and false the moment it
     * could show everything. Now it says what the two links are.
     */
    soon: { ja: "ご注文と分割予約の履歴をご確認いただけます。", en: "Everything you have with us is listed here." },
    /**
     * A signed-in customer with no orders and no plans on this record. Two
     * sentences, because the two causes need different advice: a genuinely new
     * customer, and a customer whose history sits on a second record carrying
     * the same email (eight such addresses in live data). Neither renders as a
     * blank page, which is what used to happen.
     */
    noRecords: { ja: "このサインインでは、ご注文・ご予約が見つかりませんでした。以前にお買い上げいただいている場合は、別のメールアドレスでご登録されている可能性がございます。ご連絡いただければお調べいたします。", en: "We cannot see any orders or plans on this sign-in. If you have bought from us before, your records may sit under a different email address — message us and we will find them." },
    noRecordsShared: { ja: "このサインインでは、ご注文・ご予約が見つかりませんでした。このメールアドレスには複数のご登録が残っているため、担当者に通知いたしました。記録を統合いたしますので、お急ぎの場合はご連絡ください。", en: "We cannot see any orders or plans on this sign-in, and we hold more than one record for this email address. Our team has been told and will join them up. Message us if you need something before then." },
    ordersNone: { ja: "ご注文履歴はまだありません。", en: "No orders yet." },
    /** What the other surface is for. Shown on the account page, in both languages. */
    portalH: { ja: "カスタマーポータル", en: "Your customer portal" },
    portalP: { ja: "お支払いのご報告、延長のお申し出、ご利用明細、ポイントのご利用はカスタマーポータルから承ります。こちらのサイトはお買い物と、お取引内容のご確認にご利用ください。", en: "Reporting a payment, asking for an extension, your statements and spending your points are all handled in the customer portal. This site is for shopping, and for looking at everything you have with us." },
    layawayH: { ja: "分割予約", en: "Your layaway plans" },
    layawaySoon: { ja: "分割予約のご利用状況はまもなくこちらでご覧いただけます。それまでのお問い合わせは、ご注文時のメールへのご返信でお受けしています。", en: "Your layaway plans will appear here soon. Until then, reply to any order email and we will help." },
    layawayLearn: { ja: "分割予約について", en: "How layaway works" },
    addressesH: { ja: "お届け先住所", en: "Your addresses" },
    /**
     * CORRECTED 2026-09-15: this said "Add or change one during checkout",
     * which was false on the second half. Checkout only ever appends
     * (saveAddressAction -> PUT /me/addresses with the existing list plus one),
     * and this page is read-only — there is no edit, no delete and no
     * set-default anywhere in the site. The new address silently becomes the
     * default, which the old copy did not say either. Describe what actually
     * happens, and point elsewhere for the rest.
     */
    addressesP: { ja: "ご注文時に選択できるお届け先です。新しいお届け先はご注文手続きの中で追加でき、最後に追加したものが既定のお届け先になります。変更・削除をご希望の場合はお問い合わせください。", en: "The addresses you can ship to. You can add a new one during checkout, and the most recent becomes your default. To change or remove an address, please contact us." },
  },
  cart: {
    h1: { ja: "カート", en: "Your cart" },
    empty: { ja: "カートは空です。", en: "Your cart is empty." },
    browse: { ja: "コレクションを見る", en: "Browse the collections" },
    dropped: { ja: "在庫がなくなった商品をカートから削除しました。", en: "We removed a piece that is no longer available." },
    remove: { ja: "削除", en: "Remove" },
    qty: { ja: "数量", en: "Qty" },
    oneOfAKind: { ja: "一点物のため数量は1点のみです。", en: "One of a kind — quantity is fixed at 1." },
    soldOut: { ja: "売り切れ", en: "Sold out" },
    subtotal: { ja: "小計", en: "Subtotal" },
    shippingNote: { ja: "送料はお届け先の入力後に計算します。", en: "Shipping is calculated once you enter a delivery address." },
    checkout: { ja: "お支払いへ進む", en: "Checkout" },
    add: { ja: "カートに入れる", en: "Add to cart" },
    added: { ja: "カートに入れました", en: "Added to cart" },
    viewCart: { ja: "カートを見る", en: "View cart" },
  },
  checkout: {
    h1: { ja: "ご注文手続き", en: "Checkout" },
    step1: { ja: "お届け先", en: "Delivery" },
    step2: { ja: "ご注文内容の確認", en: "Review" },
    step3: { ja: "お支払い", en: "Payment" },
    chooseAddress: { ja: "お届け先を選択", en: "Choose a delivery address" },
    newAddress: { ja: "新しいお届け先を追加", en: "Add a new address" },
    recipientName: { ja: "お受け取りの方のお名前", en: "Recipient name" },
    line1: { ja: "住所1（番地まで）", en: "Address line 1" },
    line2: { ja: "住所2（建物名・部屋番号）", en: "Address line 2" },
    city: { ja: "市区町村", en: "City" },
    region: { ja: "都道府県 / 州", en: "Prefecture / province" },
    postal: { ja: "郵便番号", en: "Postal code" },
    country: { ja: "国", en: "Country" },
    phone: { ja: "電話番号", en: "Phone" },
    saveAddress: { ja: "お届け先を保存", en: "Save address" },
    orderType: { ja: "ご注文の種類", en: "Order type" },
    self: { ja: "ご本人用", en: "For myself" },
    gift: { ja: "ギフト", en: "A gift" },
    proxy: { ja: "代理購入", en: "Buying for someone else" },
    giftNote: { ja: "メッセージカード（任意）", en: "Gift message (optional)" },
    recipientPhone: { ja: "お受け取りの方の電話番号", en: "Recipient phone" },
    continue: { ja: "次へ", en: "Continue" },
    back: { ja: "戻る", en: "Back" },
    subtotal: { ja: "小計", en: "Subtotal" },
    shipping: { ja: "送料", en: "Shipping" },
    free: { ja: "無料", en: "Free" },
    total: { ja: "合計", en: "Total" },
    manualQuote: { ja: "この国への送料は個別にお見積りいたします。ご注文前に担当者よりご連絡いたします。", en: "We quote shipping to this country individually. Our team will contact you before the order is placed." },
    payHeading: { ja: "お支払い方法", en: "How you will pay" },
    // Region-neutral by design: a customer is shown the methods for their own
    // destination and must never learn what the other region pays into.
    transferOnly: { ja: "現在はお振込のみご利用いただけます。カード決済は準備中です。", en: "Bank transfer only for now. Card payment is coming soon." },
    transferPreview: { ja: "お振込先は以下のとおりです。ご注文確定後、この画面とメールでも改めてご案内します。", en: "You will transfer to the account below. We show it again after you place the order, and send it by email." },
    placeOrder: { ja: "ご注文を確定する", en: "Place order" },
    placing: { ja: "処理中…", en: "Placing your order…" },
    // THE DEADLINE IS THE CUSTOMER'S, NOT A CONSTANT (owner decision 2026-09-16).
    // 24 hours on a first order, 72 when they have ordered before. The number
    // comes from the quote, which reads the same Hub function the creation RPC
    // defaults from — so what this says is what gets stored.
    //
    // Split in two on purpose. `deadlineWithin` names the number and is only
    // rendered when the Hub actually sent one. `deadlineNote` carries the
    // consequence and names no number at all, so it is safe on the confirmation
    // page (where the exact date and time is already shown) and safe when the
    // number is unknown. Its wording matches the confirmation email's, so the
    // customer reads the same sentence twice rather than two near-misses.
    deadlineWithin: {
      ja: "ご注文後{hours}時間以内にお振込ください。",
      en: "Please transfer within {hours} hours.",
    },
    deadlineNote: { ja: "期限を過ぎたご注文は自動的にキャンセルとなり、商品は再び販売されます。", en: "After the deadline the order is cancelled automatically and the piece goes back on sale." },
    soldOut: { ja: "申し訳ありません。ご注文手続き中にこの商品は売り切れとなりました。", en: "Sorry — that piece sold while you were checking out." },
    expired: { ja: "お見積りの有効期限が切れました。もう一度お試しください。", en: "Your quote expired. Please try again." },
    expiredRequoted: { ja: "お見積りの有効期限が切れたため、最新の内容でお見積りし直しました。ご確認のうえ、もう一度お進みください。", en: "Your quote had expired, so we priced your order again. Please review it and continue." },
    ref: { ja: "参照番号", en: "Reference" },
    failed: { ja: "ご注文を完了できませんでした。しばらくしてからもう一度お試しください。", en: "We could not complete your order. Please try again shortly." },
    emptyCart: { ja: "カートが空のためお手続きできません。", en: "There is nothing in your cart to check out." },
    addressRequired: { ja: "お届け先をご入力ください。", en: "Please enter a delivery address." },
    // ── THE LAYAWAY AGREEMENT GATE (2026-09-18) ──────────────────────────────
    // No plan is created until the customer has signed. The AGREEMENT itself is
    // TAGALOG ONLY (owner decision) — these strings are the site's own copy
    // around it, in the site's own language, and they are not a translation of
    // the agreement and never quote its terms.
    agreementHeading: { ja: "分割予約契約書へのご署名", en: "Sign the layaway agreement" },
    agreementIntro: {
      ja: "お取り置きを確定する前に、分割予約契約書をお読みいただき、ご署名をお願いいたします。ご署名後、この画面に戻って「署名しました」を押してください。",
      en: "Before we hold the piece, please read and sign the layaway agreement. When you have signed, come back to this page and press “I have signed”.",
    },
    agreementTagalogNote: {
      ja: "契約書はタガログ語のみでご用意しています。",
      en: "The agreement is provided in Tagalog only.",
    },
    agreementOpen: { ja: "契約書を開く", en: "Open the agreement" },
    agreementNewTabNote: {
      ja: "契約書は新しいタブで開きます。この画面はそのまま残りますので、ご署名後にお戻りください。",
      en: "The agreement opens in a new tab. This page stays as it is — come back to it once you have signed.",
    },
    agreementDone: { ja: "署名しました", en: "I have signed" },
    agreementChecking: { ja: "確認中…", en: "Checking…" },
    // The version and date the signing record actually holds — the same two
    // values stored on the plan, shown so a wrong one is visible beforehand.
    agreementSigned: {
      ja: "契約書へのご署名を確認しました（版 {version}・{date}）。",
      en: "Agreement signed — version {version}, {date}.",
    },
    // TWO MESSAGES, NEVER ONE. The first is the customer's to fix; the second
    // is ours, and telling someone who HAS signed that they have not would be
    // both wrong and insulting.
    agreementRequired: {
      ja: "分割予約契約書へのご署名が確認できておりません。契約書を開いてご署名のうえ、もう一度お試しください。",
      en: "We have not received your signed layaway agreement yet. Please open the agreement, sign it, and try again.",
    },
    agreementUnverified: {
      ja: "ご署名の確認ができませんでした。お客様の操作に問題はございません。しばらくしてからもう一度お試しいただくか、sales@chajewelsjp.com までご連絡ください。",
      en: "We could not check your signature just now — this is not something you did wrong. Please try again in a moment, or email sales@chajewelsjp.com and we will finish this for you.",
    },
    // A signature belongs to one quote, so a detour longer than the quote's
    // 30 minutes means signing again. Said plainly rather than met as a
    // refusal at the last click.
    expiredResign: {
      ja: "お見積りの有効期限が切れたため、最新の内容でお見積りし直しました。お手数ですが、新しいお見積りに対して契約書へ再度ご署名ください。",
      en: "Your quote expired, so we priced your order again. Because a signature belongs to one quote, please sign the agreement once more for the new one.",
    },
    // JOINING THE PROGRAMME AT CHECKOUT.
    // Consent, so the box is never pre-ticked. The label says what they earn;
    // the note says what we do with the details they have just entered. It does
    // NOT say "we will create your account", because by this point the account
    // already exists — /checkout is behind sign-in and the page links the
    // customer record before it renders. Promising to create something that is
    // already there would be the one sentence here a customer could catch us on.
    // The programme itself is explained at /loyalty, never inline.
    joinLoyalty: {
      ja: "Cha Jewels Circleに入会する — 今回のご注文から、お買い上げ金額の1%をポイントとして進呈いたします。",
      en: "Join Cha Jewels Circle — earn 1% back in points on this order and every order after it.",
    },
    joinLoyaltyNote: {
      ja: "本注文にご入力いただいたお名前・ご住所・ご連絡先をもとに会員情報を作成いたします。会員ランクはGlimmerからのスタートです。",
      en: "We set your membership up from the name, address and contact details on this order. Members start at Glimmer, the first level.",
    },
    joinLoyaltyLink: { ja: "プログラムの詳細", en: "About the programme" },
    // Phase 2 step 4 — paying in instalments.
    modeH: { ja: "お支払い方法をお選びください", en: "How would you like to pay?" },
    modeFull: { ja: "一括でお支払い", en: "Pay in full" },
    modeLayaway: { ja: "分割予約でお支払い", en: "Reserve and pay monthly" },
    modeFullNote: { ja: "お振込1回でお手続きが完了します。", en: "One transfer and the order is done." },
    modeLayawayNote: { ja: "30%のお申込金で商品を確保し、残額を無利息で月々均等払い。", en: "Pay 30% to hold the piece, then the balance in equal monthly amounts at 0% interest." },
    settlementH: { ja: "お支払い通貨", en: "Pay in" },
    settlementJpy: { ja: "日本円で", en: "Japanese yen" },
    settlementPhp: { ja: "フィリピンペソで", en: "Philippine pesos" },
    settlementNote: { ja: "お選びいただいた通貨で金額が確定します。以降のお支払いもすべて同じ通貨です。", en: "Your plan is fixed in the currency you choose here, and every payment on it is in that currency." },
    settlementFullNote: { ja: "一括でのお支払いは日本円のみとなります。", en: "Paying in full is available in yen only." },
    termH: { ja: "お支払い回数", en: "Over how many months?" },
    termMonths: { ja: "{n}か月", en: "{n} months" },
    termMin: { ja: "{amount}以上", en: "from {amount}" },
    termUnavailable: { ja: "このご注文金額では選択いただけません", en: "Not available at this order total" },
    /* A term that EXISTS in the Hub but is not open to web customers yet
       (owner decision 2026-09-16). Deliberately different words from
       termUnavailable, which means "your basket is too small for this term" —
       a bigger basket fixes that one and nothing fixes this one. */
    termNotLaunched: { ja: "準備中", en: "Coming soon" },
    termNotLaunchedHint: { ja: "このお支払い回数は現在まだご利用いただけません。3か月または6か月をお選びください。", en: "This plan is not open yet. Please choose three or six months." },
    layawayDeposit: { ja: "お申込金（本日のお支払い）", en: "Deposit (what you send now)" },
    layawayMonthly: { ja: "月々のお支払い", en: "Monthly" },
    layawayLast: { ja: "最終回", en: "Final payment" },
    layawaySchedule: { ja: "お支払い予定", en: "Your schedule" },
    // Shown if a shopper had layaway selected and the site language moved to
    // Japanese before they paid — layaway is English-only (owner decision
    // 2026-09-15). Nothing was charged and the basket is intact, so the copy
    // says what to do next rather than apologising.
    layawayUnavailable: { ja: "分割予約は英語表示のみでのお取り扱いとなります。全額でのお支払いにお進みいただくか、表示言語をEnglishに切り替えてください。カートの中身はそのままです。", en: "Layaway is available on the English site only. Pay in full, or switch the language to English to reserve. Your basket is untouched." },
    layawayDeadline: { ja: "お申込金は72時間以内にお振込ください。期限を過ぎた場合はお取り置きを解除し、商品は再び販売いたします。お支払いは発生しません。", en: "Please send the deposit within 72 hours. After that we release the hold and the piece goes back on sale; nothing is owed." },
    reservePiece: { ja: "この内容で予約する", en: "Reserve this piece" },
    reserving: { ja: "手続き中…", en: "Reserving…" },
    belowMinimum: { ja: "このご注文金額では、お選びの回数をご利用いただけません。ご利用いただける回数からお選びください。", en: "That number of months is not available at this order total. Please choose from the terms shown." },
    currencyUnsupported: { ja: "一括でのお支払いは日本円のみとなります。", en: "Paying in full is available in yen only." },
    rateUnavailable: { ja: "ただいま為替レートを取得できません。恐れ入りますが、時間をおいてお試しください。", en: "We cannot fetch today's exchange rate. Please try again shortly." },
    transferUnavailable: {
      ja: "申し訳ありません。お届け先の国へのお支払い方法をただいまご用意できません。お手数ですが当店までご連絡ください。",
      en: "Sorry — we cannot take payment for that destination just now. Please contact us and we will arrange it.",
    },
  },
  transfer: {
    bank: { ja: "銀行口座", en: "Bank account" },
    gcash: { ja: "GCash", en: "GCash" },
    bankName: { ja: "銀行名", en: "Bank" },
    branch: { ja: "支店名", en: "Branch" },
    accountType: { ja: "口座種別", en: "Account type" },
    accountNumber: { ja: "口座番号", en: "Account number" },
    accountHolder: { ja: "口座名義", en: "Account holder" },
    gcashNumber: { ja: "GCash 番号", en: "GCash number" },
    gcashName: { ja: "GCash 名義", en: "GCash name" },
    mayaNumber: { ja: "Maya 番号", en: "Maya number" },
    mayaName: { ja: "Maya 名義", en: "Maya name" },
    walletNumber: { ja: "送金先番号", en: "Account / number" },
    walletName: { ja: "登録名義", en: "Registered name" },
    nameNotice: { ja: "振込名義はご注文者名でお願いします", en: "Transfer under the name on the order" },
    unavailable: {
      ja: "お振込先の準備中です。お手数ですが当店までご連絡ください。",
      en: "Transfer details not yet available — please contact us.",
    },
  },
  complete: {
    h1: { ja: "ご注文ありがとうございます", en: "Thank you for your order" },
    lede: { ja: "ご注文を承りました。お振込の確認後、発送の手配をいたします。", en: "Your order is placed. We ship as soon as we see your transfer." },
    reference: { ja: "ご注文番号", en: "Order reference" },
    amount: { ja: "お振込金額", en: "Amount to transfer" },
    deadline: { ja: "お振込期限", en: "Transfer by" },
    instructions: { ja: "お振込先", en: "Where to send it" },
    viewOrder: { ja: "ご注文の詳細を見る", en: "View this order" },
    keepRef: { ja: "お振込の際は、ご注文番号を明記いただくとスムーズです。", en: "Quoting your order reference on the transfer helps us match it quickly." },
    layawayH1: { ja: "お取り置きいたしました", en: "Your piece is reserved" },
    layawayLede: { ja: "ご予約を承りました。お申込金のご入金を確認しだい、お支払い予定に沿ってお進みいただけます。", en: "Your plan is created. Once we see your deposit, the schedule below is yours to follow." },
    layawayDeposit: { ja: "お申込金", en: "Deposit" },
    layawayViewPlan: { ja: "ご予約の詳細を見る", en: "View this plan" },
  },
  orders: {
    h1: { ja: "ご注文履歴", en: "Your orders" },
    empty: { ja: "まだご注文はありません。", en: "No orders yet." },
    reference: { ja: "ご注文番号", en: "Reference" },
    placed: { ja: "ご注文日", en: "Placed" },
    total: { ja: "合計", en: "Total" },
    view: { ja: "詳細", en: "View" },
    back: { ja: "ご注文履歴へ", en: "All orders" },
    items: { ja: "ご注文商品", en: "Items" },
    shipTo: { ja: "お届け先", en: "Shipping to" },
    tracking: { ja: "追跡番号", en: "Tracking number" },
    notFound: { ja: "ご注文が見つかりませんでした。", en: "We could not find that order." },
    statusPendingTransfer: { ja: "お振込待ち", en: "Awaiting transfer" },
    statusPaid: { ja: "お支払い済み", en: "Paid" },
    statusCancelled: { ja: "キャンセル済み", en: "Cancelled" },
    statusExpired: { ja: "期限切れ", en: "Expired" },
    statusRefunded: { ja: "返金済み", en: "Refunded" },
    statusFailed: { ja: "お支払い失敗", en: "Payment failed" },
    statusShipped: { ja: "発送済み", en: "Shipped" },
    cancelReason: { ja: "キャンセル理由", en: "Reason" },
    refund: { ja: "返金", en: "Refund" },
    refundIssued: { ja: "返金済み", en: "Refund issued" },
    refundPending: { ja: "返金手続き中", en: "Refund pending" },
    storeCredit: { ja: "ストアクレジット発行", en: "Store credit issued" },
    noRefund: { ja: "返金なし", en: "No refund" },
    cancelledOn: { ja: "キャンセル日", en: "Cancelled on" },
    /**
     * 153 of the 154 orders arranged with us directly carry no line items and
     * no saved address — those are recorded on the invoice, not in this table.
     * Without this line the order page showed a total and nothing else.
     */
    arrangedWithUs: { ja: "このご注文は当店にて直接承ったものです。お品物とお届け先の詳細はご請求書に記載しております。ご確認が必要な場合はご連絡ください。", en: "This order was arranged with us directly, so the pieces and the delivery details are on your invoice rather than here. Ask us any time and we will send it again." },
  },
  /** Phase 2 step 4 — layaway plans in the account area, and the pay-now form. */
  plans: {
    h1: { ja: "分割予約", en: "Your layaway" },
    empty: { ja: "分割予約のお申込みはまだありません。", en: "No layaway plans yet." },
    reference: { ja: "ご予約番号", en: "Reference" },
    view: { ja: "詳細", en: "View" },
    back: { ja: "分割予約一覧へ", en: "All plans" },
    notFound: { ja: "ご予約が見つかりませんでした。", en: "We could not find that plan." },
    total: { ja: "お支払い総額", en: "Plan total" },
    paid: { ja: "お支払い済み", en: "Paid so far" },
    remaining: { ja: "残額", en: "Still to pay" },
    deposit: { ja: "お申込金", en: "Deposit" },
    term: { ja: "お支払い回数", en: "Term" },
    months: { ja: "{n}か月", en: "{n} months" },
    depositDue: { ja: "お申込金のお支払い期限", en: "Deposit due" },
    settlementDue: { ja: "完済予定日", en: "Settlement due" },
    schedule: { ja: "お支払い予定", en: "Payment schedule" },
    installment: { ja: "{n}回目", en: "Payment {n}" },
    due: { ja: "お支払い期限", en: "Due" },
    amount: { ja: "金額", en: "Amount" },
    rowPaid: { ja: "お支払い済み", en: "Paid" },
    rowPartial: { ja: "一部お支払い済み", en: "Part paid" },
    rowPending: { ja: "お支払い前", en: "Due" },
    rowOverdue: { ja: "お支払い期限超過", en: "Overdue" },
    rowCancelled: { ja: "取消済み", en: "Cancelled" },
    statusActive: { ja: "お支払い中", en: "In progress" },
    statusOverdue: { ja: "お支払い期限超過", en: "Overdue" },
    statusCompleted: { ja: "完済", en: "Paid in full" },
    statusCancelled: { ja: "終了", en: "Closed" },
    /**
     * Hub-created plans reach states a web plan never had. `statusCancelled`
     * used to absorb all of them, which made a forfeited plan read as a
     * clerical "Closed" beside a live-looking balance. Each state now says what
     * it is, and `planNote` below adds the one sentence that explains it.
     */
    statusForfeited: { ja: "規約により終了", en: "Closed under the plan terms" },
    statusSettlement: { ja: "精算手続き中", en: "In settlement" },
    statusExtension: { ja: "延長中", en: "Extended" },
    /**
     * A closed plan still carries a positive remaining_balance in the Hub — all
     * 53 forfeited plans do, up to ¥478,556. Labelling that figure "Still to
     * pay" invites a payment the plan cannot take, so a closed plan labels it
     * for what it is: what was outstanding when the plan closed.
     */
    unpaidAtClosure: { ja: "終了時点の未払額", en: "Unpaid when it closed" },
    noteOverdue: { ja: "お支払い期限を過ぎているお支払いがございます。ご不明な点はお問い合わせください。", en: "One or more payments are past their due date. Please get in touch if anything is unclear." },
    noteExtension: { ja: "お取り決めにより、お支払い期間を延長しています。", en: "This plan is running on an agreed extension." },
    noteCompleted: { ja: "完済いただきました。ありがとうございます。", en: "This plan is paid in full. Thank you." },
    noteForfeited: { ja: "お支払いが規約どおりに完了しなかったため、このご予約は終了しております。ご相談をご希望の場合はご連絡ください。", en: "This plan was closed because the payments were not completed under the plan terms. Please contact us if you would like to talk about it." },
    noteSettlement: { ja: "このご予約は終了し、別途精算のお手続きとなっております。詳細はお問い合わせください。", en: "This plan is closed and is being settled with us separately. Please contact us for the details." },
    noteCancelled: { ja: "このご予約は終了しております。", en: "This plan is closed." },
    /**
     * 0 of 1,448 Hub-created plans carry item lines — those live only for plans
     * placed on this site. Rendering nothing at all left a plan page with
     * figures and no idea what the piece was.
     */
    arrangedWithUs: { ja: "このご予約は当店にて直接承ったものです。お品物の詳細はご請求書に記載しております。ご確認が必要な場合はご連絡ください。", en: "This plan was arranged with us directly, so the piece is described on your invoice rather than here. Ask us any time and we will send it again." },
    payElsewhereH: { ja: "お支払いのご報告", en: "Paying this plan" },
    payElsewhereP: { ja: "このご予約のお支払いは、カスタマーポータルからご報告いただけます。担当者が入金を確認したうえで、お支払い予定に反映いたします。このページはご確認用です。", en: "Payments for this plan are reported in your customer portal, where our team checks them against the bank before the balance moves. This page is for looking." },
    portalCta: { ja: "ポータルを開く", en: "Open your portal" },
    portalFallback: { ja: "リンクが開かない場合は、ご連絡いただければ新しいリンクをお送りいたします。", en: "If that link does not open your account, message us and we will send you a fresh one." },
    readOnlyNote: { ja: "こちらではすべてのご予約をご確認いただけます。お支払いのご報告、延長のお申し出、ポイントはカスタマーポータルをご利用ください。", en: "Every plan you have with us is listed here. Reporting a payment, asking for an extension and your points are all in the customer portal." },
    awaitingDeposit: { ja: "お申込金のご入金をお待ちしています。ご入金が確認できるまで、お品物をお取り置きしています。", en: "We are waiting for your deposit. The piece stays reserved until it arrives." },
    expiredNote: { ja: "お申込金を期限までに確認できなかったため、お取り置きを解除しました。お支払いは発生しておりません。", en: "The deposit did not arrive by the deadline, so the hold was released. Nothing was paid and nothing is owed." },
    payH: { ja: "お振込を報告する", en: "Tell us about your transfer" },
    payP: { ja: "お振込後、こちらからご連絡ください。担当者が確認しだい、お支払い予定に反映します。確認までは残額は変わりません。", en: "Send us the details after you transfer. A member of our team checks it and adds it to your schedule; the balance does not change until they do." },
    payAmount: { ja: "お振込金額", en: "Amount you sent" },
    payDate: { ja: "お振込日", en: "Date you sent it" },
    payMethod: { ja: "お振込方法", en: "How you sent it" },
    payReference: { ja: "受付番号・参照番号（任意）", en: "Transaction reference (optional)" },
    payProof: { ja: "お振込明細の画像", en: "Photo of your receipt" },
    payProofNote: { ja: "スクリーンショットまたは写真。10MBまで。", en: "A screenshot or a photo, up to 10 MB." },
    paySubmit: { ja: "送信する", en: "Send it" },
    paySending: { ja: "送信中…", en: "Sending…" },
    paySent: { ja: "ありがとうございます。確認しだいご連絡いたします。", en: "Thank you. We will confirm it shortly." },
    pending: { ja: "確認待ちのお振込", en: "Waiting to be checked" },
    pendingNote: { ja: "{amount}（{date}）を確認中です。", en: "{amount} sent on {date} is being checked." },
    payments: { ja: "お支払い履歴", en: "Payments received" },
    errBadAmount: { ja: "金額をご確認ください。", en: "Please check the amount." },
    errBadDate: { ja: "お振込日をご確認ください。", en: "Please check the date." },
    errMethod: { ja: "お振込方法をお選びください。", en: "Please choose how you sent it." },
    errProof: { ja: "お振込明細の画像を添付してください。", en: "Please attach a photo of your receipt." },
    errProofLarge: { ja: "画像が大きすぎます。10MB以下にしてください。", en: "That file is too large. Please keep it under 10 MB." },
    errProofUpload: { ja: "画像をアップロードできませんでした。もう一度お試しください。", en: "We could not upload that image. Please try again." },
    errTooMany: { ja: "本日のご報告は上限に達しました。恐れ入りますが、明日以降にお試しください。", en: "That is as many reports as we can take today. Please try again tomorrow." },
    errExceeds: { ja: "残額を超える金額はお受けできません。", en: "That is more than the plan still owes." },
    errNotLive: { ja: "このご予約は終了しているため、お支払いをお受けできません。", en: "This plan is closed, so we cannot take a payment for it." },
    errFailed: { ja: "送信できませんでした。もう一度お試しください。", en: "We could not send that. Please try again." },
  },
  about: { h1: { ja: "私たちについて", en: "About Us" } },
  blog: { h1: { ja: "ブログ", en: "Blog" }, back: { ja: "ブログ一覧へ", en: "All posts" }, empty: { ja: "この分類の記事はまだありません。", en: "Nothing here yet." } },
  notFound: { h1: { ja: "そのお品物はここにはありません。", en: "That piece is not here." }, p: { ja: "すでに売れたか、リンクが古い可能性があります。", en: "It may have sold, or the link is old." }, back: { ja: "コレクションに戻る", en: "Back to the collections" } },
  /** Header account menu (signed in) and the drawer's account section. */
  /** Service requests — raised from an order or plan, answered by staff in the Hub. */
  service: {
    h1: { ja: "サービス依頼", en: "Service requests" },
    lede: { ja: "ご購入いただいたお品物のリサイズ、クリーニング、修理、鑑定のご依頼です。担当者が確認し、こちらでお返事します。", en: "Resizing, cleaning, repairs and appraisals for pieces you bought from us. We review each request and reply here." },
    formH: { ja: "サービスを依頼する", en: "Request a service" },
    formP: { ja: "リサイズ、クリーニング、修理、鑑定など、ご希望をお書きください。担当者が確認後、こちらにお返事します。", en: "A resize, a cleaning, a repair or an appraisal. Tell us what you need; we will review it and reply here." },
    kind: { ja: "ご依頼内容", en: "Service" },
    kindResize: { ja: "リサイズ", en: "Resize" },
    kindCleaning: { ja: "クリーニング", en: "Cleaning" },
    kindRepair: { ja: "修理", en: "Repair" },
    kindAppraisal: { ja: "鑑定・査定", en: "Appraisal" },
    kindOther: { ja: "その他", en: "Other" },
    item: { ja: "対象のお品物", en: "Item" },
    itemAny: { ja: "指定なし（ご注文全体）", en: "Not a specific item" },
    ringSize: { ja: "ご希望のリングサイズ", en: "Ring size" },
    ringSizeHint: { ja: "日本サイズ、または現在のサイズと変更幅をお書きください。", en: "Japanese size, or your current size and how much to change it." },
    details: { ja: "詳細", en: "Details" },
    detailsHint: { ja: "気になる点、ご希望の仕上がり、お急ぎの場合はその旨をお書きください。", en: "What you have noticed, what you would like done, and any dates that matter." },
    submit: { ja: "依頼を送信", en: "Send request" },
    submitting: { ja: "送信中…", en: "Sending…" },
    success: { ja: "ご依頼を受け付けました。担当者が確認後、こちらにお返事します。", en: "Your request has been sent. We will review it and reply here." },
    listH: { ja: "ご依頼履歴", en: "Your requests" },
    emptyHere: { ja: "まだご依頼はありません。", en: "No requests yet." },
    empty: { ja: "サービス依頼はまだありません。ご注文または分割予約のページから依頼できます。", en: "No service requests yet. You can raise one from an order or a layaway plan." },
    requestedOn: { ja: "{date} 依頼", en: "Requested {date}" },
    noteFrom: { ja: "Cha Jewelsからのお返事", en: "Reply from Cha Jewels" },
    viewOrder: { ja: "ご注文を見る", en: "View order" },
    viewPlan: { ja: "分割予約を見る", en: "View plan" },
    statusRequested: { ja: "受付待ち", en: "Requested" },
    statusReceived: { ja: "受付済み", en: "Received" },
    statusInProgress: { ja: "対応中", en: "In progress" },
    statusCompleted: { ja: "完了", en: "Completed" },
    statusDeclined: { ja: "お受けできません", en: "Declined" },
    errDetails: { ja: "詳細をご記入ください（2,000文字まで）。", en: "Please describe the request (up to 2,000 characters)." },
    errRingSize: { ja: "リサイズにはご希望のサイズが必要です。", en: "A resize needs the size you want." },
    errSignedOut: { ja: "サインインが切れました。もう一度サインインしてください。", en: "You have been signed out. Please sign in again." },
    errFailed: { ja: "送信できませんでした。しばらくしてからもう一度お試しください。", en: "We could not send your request. Please try again in a moment." },
    ref: { ja: "参照番号: {id}", en: "Ref: {id}" },
  },
  accountMenu: {
    menu: { ja: "アカウントメニュー", en: "Account menu" },
    fallback: { ja: "アカウント", en: "Account" },
    myAccount: { ja: "マイページ", en: "My account" },
    orders: { ja: "注文履歴", en: "Orders" },
    layaway: { ja: "分割予約", en: "Layaway" },
    addresses: { ja: "住所", en: "Addresses" },
    service: { ja: "サービス依頼", en: "Service requests" },
    points: { ja: "ポイント・会員レベル", en: "Points & level" },
    signOut: { ja: "サインアウト", en: "Sign out" },
    signedOut: { ja: "サインアウトしました", en: "Signed out" },
  },
  /** Page <title> and description, chosen by the language cookie in generateMetadata (lib/page-meta.ts). */
  /**
   * PAGE METADATA. The ja descriptions no longer mention 分割予約: they are the
   * Japanese search snippet and the link preview, so they advertise the offer
   * as surely as the page does. The en descriptions are unchanged. Layaway is
   * English-only — owner decision 2026-09-15, lib/layaway-availability.
   */
  meta: {
    // NO BLANKET CERTIFICATE CLAIM. This said "certified diamonds" /
    // 鑑定書付きダイヤモンド, which is not true of every diamond we sell — the
    // FAQ is explicit that "a certificate or laboratory report is included
    // only when stated in the product listing", and the FAQ is authoritative.
    // A site description is the one sentence Google shows before anyone reads
    // a listing, so it is the worst place to promise per-piece paperwork.
    //
    // "authenticated in Japan" stays: that is the site-wide wording CLAUDE.md
    // sanctions, and it is a claim about our own checking rather than about
    // documents travelling with the stone.
    site: { title: { ja: "Cha Jewels | K18ゴールド・パール・ダイヤモンド", en: "Cha Jewels | K18 gold, pearls and diamonds" }, description: { ja: "日本で真贋確認済みのK18ゴールド、あこや真珠、ダイヤモンド。東京からの卸売、日本・フィリピン・海外への配送。", en: "K18 gold, Akoya pearls and diamonds, authenticated in Japan. 0% layaway, wholesale from Tokyo, shipping to Japan, the Philippines and worldwide." } },
    layaway: { title: { ja: "分割予約", en: "Layaway" } },
    blog: { title: { ja: "ブログ", en: "Blog" } },
    account: { title: { ja: "アカウント", en: "Account" } },
    orders: { title: { ja: "ご注文履歴", en: "Your orders" } },
    addresses: { title: { ja: "お届け先住所", en: "Your addresses" } },
    order: { title: { ja: "ご注文詳細", en: "Order" } },
    serviceRequests: { title: { ja: "サービス依頼", en: "Service requests" } },
    loyalty: { title: { ja: "会員プログラム", en: "Loyalty" } },
    join: { title: { ja: "入会", en: "Join" } },
    goldGuide: { title: { ja: "ゴールドの基礎知識", en: "Gold guide" }, description: { ja: "K18の意味、刻印の読み方、ゴールドとパールのお手入れ方法。", en: "What K18 means, how to read a hallmark, and how to care for gold and pearls." } },
    checkout: { title: { ja: "ご注文手続き", en: "Checkout" } },
    complete: { title: { ja: "ご注文ありがとうございます", en: "Thank you" } },
    wholesale: { title: { ja: "卸売", en: "Wholesale" }, description: { ja: "日本とフィリピンのライブ販売者、ブティック、ファミリー経営の宝飾店に、K18ゴールドを卸価格で。", en: "K18 gold at trade prices for live sellers, boutiques and family jewelry businesses in Japan and the Philippines." } },
    cart: { title: { ja: "カート", en: "Cart" } },
    login: { title: { ja: "サインイン", en: "Sign in" } },
    about: { title: { ja: "私たちについて", en: "About Us" } },
    why: { title: { ja: "Cha Jewelsが選ばれる理由", en: "Why Cha Jewels" }, description: { ja: "心を込めて選んだジュエリー、明確な情報、お一人おひとりへの丁寧な対応。東京を拠点とするCha Jewelsが選ばれる理由。", en: "Thoughtfully chosen jewelry, clear details and personal care — why customers choose Tokyo-based Cha Jewels." } },
    contact: { title: { ja: "お問い合わせ", en: "Contact" }, description: { ja: "Cha Jewelsの所在地とご連絡先。メールおよびSNSからお問い合わせいただけます。", en: "How to reach Cha Jewels: our registered address, email and social channels." } },
    affiliations: { title: { ja: "所属団体", en: "Affiliations" }, description: { ja: "Cha Jewelsが所属している東京の経済団体。東京商工会議所および東京葛飾中央ロータリークラブ。", en: "The business organisations Cha Jewels belongs to in Tokyo: the Tokyo Chamber of Commerce and Industry and the Tokyo Katsushika Central Rotary Club." } },
    faq: { title: { ja: "よくある質問", en: "FAQ" }, description: { ja: "フィリピンへの配送、ご家族へのご購入、ライブからの予約、買取、卸売の最低数量について。", en: "Layaway, shipping to the Philippines, buying for family, claims from Live, buy-back and wholesale minimums." } },
    collections: { title: { ja: "コレクション", en: "Collections" } },
    terms: { title: { ja: "利用規約", en: "Terms of Service" }, description: { ja: "ご注文と契約の成立、価格と通貨、お支払い、分割予約、配送、返品、サービス、ポイント、責任、準拠法。", en: "Orders and contract formation, prices and currency, payment, layaway, shipping, returns, services, loyalty points, liability and governing law." } },
    privacy: { title: { ja: "プライバシーポリシー", en: "Privacy policy" }, description: { ja: "Cha Jewelsが収集する情報、その目的、第三者への提供、開示・削除のご請求方法。", en: "What Cha Jewels collects, why, who else sees it, and how to ask for a copy or a deletion." } },
    tokusho: { title: { ja: "特定商取引法に基づく表記", en: "Legal notice (Specified Commercial Transactions Act)" } },
    returns: { title: { ja: "返品・キャンセル・返金ポリシー", en: "Return, Cancellation and Refund Policy" }, description: { ja: "返品をお受けする場合と条件、キャンセル料、分割予約の予約金、ストアクレジットの有効期限、返品のお申し出の手続。", en: "When we accept a return and on what terms, cancellation charges, layaway down payments, how long store credit lasts, and how to make a request." } },
  },
} as const;

type Leaf = { ja: string; en: string };
export function tr(lang: Lang) {
  return function t<S extends keyof typeof dict, K extends keyof (typeof dict)[S]>(section: S, key: K, vars?: Record<string, string>) {
    let s: string = ((dict[section][key] as unknown) as Leaf)[lang];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
  };
}

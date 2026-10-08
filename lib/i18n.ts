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
  nav: { skip: { ja: "本文へ", en: "Skip to content" }, primary: { ja: "メインナビゲーション", en: "Primary" }, menu: { ja: "メニュー", en: "Menu" }, openMenu: { ja: "メニューを開く", en: "Open menu" }, closeMenu: { ja: "メニューを閉じる", en: "Close menu" }, language: { ja: "言語", en: "Language" }, langJa: { ja: "日本語", en: "日本語" }, langEn: { ja: "EN", en: "EN" }, home: { ja: "ホーム", en: "Home" }, about: { ja: "ブランドについて", en: "About Us" }, blog: { ja: "ブログ", en: "Blog" }, collections: { ja: "コレクション", en: "Collections" }, layaway: { ja: "分割予約", en: "Layaway" }, loyalty: { ja: "ロイヤルティ", en: "Loyalty" }, wholesale: { ja: "卸売", en: "Wholesale" }, account: { ja: "マイアカウント", en: "Account" }, cart: { ja: "カート", en: "Cart" }, orders: { ja: "ご注文履歴", en: "Orders" }, tabBar: { ja: "モバイルナビゲーション", en: "Mobile navigation" } },
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
    // The site frame (build step 1, comps in page-comps/site-frame). Menu
    // chrome only; the category one-liners are content (lib/content/frame.ts).
    count: { ja: "{n}点", en: "{n}" },
    countLabel: { ja: "在庫{n}点", en: "{n} available" },
    since: { ja: "2021年創業・東京", en: "Since 2021 · Tokyo" },
    // The menus' customer-story panel links to the home page's section.
    moreStories: { ja: "お客様の声をもっと見る", en: "More customer stories" },
  },
  /** The trust ledger at the foot of every page (components/site/footer.tsx). */
  trust: {
    founded: { ja: "創業", en: "Founded" },
    foundedValue: { ja: "2021年・東京", en: "2021 · Tokyo" },
    incorporated: { ja: "2024年法人化", en: "Incorporated 2024" },
    auth: { ja: "真贋・刻印確認", en: "Authentication" },
    authValue: { ja: "日本で鑑定済み", en: "Authenticated in Japan" },
    authNote: { ja: "プレラブド品は入荷時に確認", en: "Checked at intake, every preloved piece" },
    permit: { ja: "古物商許可", en: "Secondhand dealer permit" },
    invoice: { ja: "適格請求書発行事業者", en: "Qualified invoice issuer" },
    company: { ja: "会社情報", en: "Company" },
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
    // EN title "Why Cha Jewels", the nav label (owner decision D5-1,
    // 2026-09-30); it was "Why Cha Jewels Is the Right Choice for You!".
    h1: { ja: "Cha Jewelsが選ばれる理由", en: "Why Cha Jewels" },
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
    // Build step 5 (comp brand-programmes "why"): the proof beside each
    // reason. Labels only; every figure beside them is a real date on record
    // or the Hub's own data (category counts, a piece's spec and down payment).
    proofRecord: { ja: "記録", en: "On record" },
    founded: { ja: "創業", en: "Founded" }, incorporated: { ja: "法人化", en: "Incorporated" },
    tokyo: { ja: "東京", en: "Tokyo" }, tateishi: { ja: "葛飾区立石", en: "Tateishi" },
    proofExample: { ja: "例：{sku}", en: "Example: {sku}" },
    pieces: { ja: "{n}点", en: "{n} pieces" }, piece: { ja: "1点", en: "1 piece" }, noneInStock: { ja: "入荷待ち", en: "None in stock" },
    // s4 (layaway) proof: rendered only where s4 is, behind layawayOffered.
    dpOn: { ja: "{sku}の予約金", en: "Down payment on {sku}" },
    howLayaway: { ja: "分割予約について", en: "How layaway works" },
    proofReach: { ja: "連絡先", en: "Reach a person" },
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
    // Build step 5 (comp brand-programmes "affiliations"): each card's detail
    // line is split into a Joined row and a Section row, same words as the
    // former afCciDetail / afRotaryDetail.
    afJoined: { ja: "入会", en: "Joined" }, afSection: { ja: "所属", en: "Section" },
    afCciJoined: { ja: "2026年3月入会", en: "Member since March 2026" },
    afCciSection: { ja: "葛飾支部 商業部会", en: "Katsushika Branch, Commerce Division" },
    afRotaryName: { ja: "東京葛飾中央ロータリークラブ", en: "Tokyo Katsushika Central Rotary Club" },
    afRotaryJoined: { ja: "2026年9月入会", en: "Member since September 2026" },
    // The trust ledger under the cards: the permit's number and authority.
    permitNo: { ja: "第{n}号", en: "No. {n}" },
    permitAuthority: { ja: "東京都公安委員会", en: "Tokyo Metropolitan Public Safety Commission" },
    affiliationsFromAbout: { ja: "所属する経済団体については、所属団体のページをご覧ください。", en: "The business organisations we belong to are listed on our affiliations page." },
  },
  /**
   * THE ORIGIN CLARIFIER (owner decision 2026-09-25). One key, rendered under
   * the hero lede and in About (not the footer, whose text is the Hub tagline
   * alone, owner decision 2026-09-26), so the copies can
   * never drift apart. These exact sentences are the only site-wide origin
   * statement check:terms accepts outside OriginBadge: change a word here and
   * scripts/check-terminology.mjs must change with it.
   */
  brand: {
    originNote: { ja: "新品ジュエリーはすべて日本製で、中古品にも日本製が多くあります。中古ブランド品は各ブランドの製品で、日本で真贋鑑定済みです。", en: "Our new jewelry is made in Japan, and so are many of our preloved pieces. Preloved branded pieces are made by their original brands and authenticated in Japan." },
  },
  hero: {
    h1a: { ja: "身につける、時を超える美しさ。", en: "Timeless beauty to wear." }, h1b: { ja: "受け継がれる、確かな価値。", en: "Lasting value to pass on." },
    // Keep layaway out of the Japanese hero: it is English-only (owner
    // decision 2026-09-15), and the hero is the first thing a Japanese visitor
    // reads. The section and CTA are gated together elsewhere.
    lede: { ja: "Cha Jewelsは、厳選したファインジュエリーを通して、時を超える美しさと永く続く価値をお届けします。新品の上質なゴールド、パール、ダイヤモンドジュエリーから、世界を代表するラグジュアリーブランドの厳選プレラブドアイテムまで。すべての一点を、品質、気品、そして変わらない価値を基準に選んでいます。", en: "Cha Jewels brings together timeless beauty and lasting value through a carefully selected collection of fine jewelry. From new gold, pearl, and diamond pieces to curated preloved treasures from iconic luxury brands, every piece is chosen for its quality, elegance, and enduring worth." },
    // RENDERED IN THE VALUES SECTION, not the hero (2026-09-22). It was the
    // intro slide's second paragraph until the hero was shortened to headline
    // + one sentence + the two buttons; the key keeps its name so the wording
    // and both languages stayed exactly as the owner reviewed them. See
    // components/home/values-bento.tsx.
    lede2: { ja: "私たちは、ジュエリーは美しいだけのものではなく、大切に受け継ぎ、自信を持って身につけ、次の世代へつないでいけるものであるべきだと考えています。特にゴールドが持つ永続的な価値を大切にし、ネックレス、リング、ブレスレット、そして唯一無二の一点ものまで、お客様の人生の物語に寄り添い続けるジュエリーをご提案します。", en: "We believe jewelry should be more than beautiful—it should be something you can cherish, wear with confidence, and pass on for generations. With a special focus on the lasting value of gold, Cha Jewels offers necklaces, rings, bracelets, and one-of-a-kind pieces designed to become part of your story for a lifetime." },
    cta1: { ja: "コレクションを見る", en: "Shop the collections" }, cta2: { ja: "分割予約を計算する", en: "Calculate layaway" },
    // ONE CONTROL FOR THE WHOLE HERO. It pauses the background video AND the
    // slide rotation (components/home/hero.tsx), so naming only the video
    // would describe half of what pressing it does.
    videoPlay: { ja: "ヒーローの動きを再生", en: "Play hero motion" },
    videoPause: { ja: "ヒーローの動きを一時停止", en: "Pause hero motion" },
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
    // The typing slideshow's controls (components/home/story-show.tsx). Owner
    // approval 2026-09-26, wording as drafted in the section comps.
    storyPrev: { ja: "前のお客様の声", en: "Previous story" }, storyNext: { ja: "次のお客様の声", en: "Next story" },
    storyPause: { ja: "お客様の声を一時停止", en: "Pause stories" }, storyPlay: { ja: "お客様の声を再生", en: "Play stories" },
    storyUpNext: { ja: "次のお声", en: "Up next" },
    slideEyebrow: { ja: "カテゴリー", en: "Category" }, slideShop: { ja: "{name}を見る", en: "Shop {name}" },
    slidePrev: { ja: "前のスライド", en: "Previous slide" }, slideNext: { ja: "次のスライド", en: "Next slide" },
    slideDot: { ja: "{n}枚目へ", en: "Go to slide {n}" }, slideOf: { ja: "{total}枚中{n}枚目", en: "{n} of {total}" },
    // HERO SLIDER v2 (owner approvals 2026-09-26). Approved wording; do not
    // reword without an owner decision. components/home/hero-slides.tsx.
    heroDeck: { ja: "おすすめのスライド", en: "Featured slides" },
    heroFilmName: { ja: "Cha Jewels", en: "Cha Jewels" },
    heroSince: { ja: "2021年創業・東京", en: "Since 2021 · Tokyo" },
    // Slide 1's outline button (owner approval 2026-09-26): the whole
    // collection, the same destination as "New on the bench" → home.viewAll.
    // Its own key because the approved JA wording (作品) differs from
    // home.viewAll's (商品), which stays as it is.
    heroViewAll: { ja: "すべての作品を見る", en: "View all pieces" },
    heroReserve: { ja: "この一点を予約する", en: "Reserve this piece" },
    heroAsk: { ja: "在庫について問い合わせる", en: "Ask about availability" },
    // Caller lines above each category title (owner corrections 2026-09-26).
    // EN is set in capitals by the eyebrow style (.hd-eyebrow), not in the text.
    heroCallerFine: { ja: "新品ジュエリー", en: "New jewelry" },
    heroPrelovedEyebrow: { ja: "プレラブド・日本で真贋鑑定済み", en: "Preloved · Authenticated in Japan" },
    heroCallerBranded: { ja: "プレラブド ブランド・日本で真贋鑑定済み", en: "Preloved branded · Authenticated in Japan" },
    heroCallerWatches: { ja: "プレラブド ウォッチ・日本で真贋鑑定済み", en: "Preloved watches · Authenticated in Japan" },
    heroCallerAccessories: { ja: "プレラブド 小物・日本で真贋鑑定済み", en: "Preloved accessories · Authenticated in Japan" },
    heroClockCity: { ja: "東京", en: "Tokyo" }, heroClockZone: { ja: "日本時間", en: "JST" },
    heroClockLabel: { ja: "東京の現在時刻", en: "Time in Tokyo now" },
    heroAcc1: { ja: "財布", en: "Wallets" }, heroAcc2: { ja: "カードケース", en: "Cardholders" }, heroAcc3: { ja: "ベルト", en: "Belts" }, heroAcc4: { ja: "小物レザー", en: "Small leather" },
    // Hero v3 slide 6 (owner approval 2026-09-26): each Index row's stock, or
    // 「入荷待ち」 / "Coming soon" when that type has none.
    heroAccCount: { ja: "{n}点", en: "{n} in stock" }, heroComingSoon: { ja: "入荷待ち", en: "Coming soon" },
    // Preview deployments only (lib/hero-demo.ts): the label on the hero while
    // demo mode shows the comps' cut-outs. Never rendered in production.
    heroDemoTag: { ja: "プレビュー専用デモ：承認カンプの切り抜き画像を表示中", en: "Preview-only demo: showing the approved comps' cut-outs" },
    heroPause: { ja: "スライドと映像を一時停止", en: "Pause slides and film" }, heroPlay: { ja: "スライドと映像を再生", en: "Play slides and film" },
    heroSlideLabel: { ja: "{total}枚中{n}枚目：{name}", en: "{n} of {total}: {name}" },
    // The tab bar says what the nav says (site frame; audit: label drift).
    // tabLayaway is rendered only behind layawayOffered (English only).
    tabHome: { ja: "ホーム", en: "Home" }, tabPieces: { ja: "コレクション", en: "Collections" }, tabLayaway: { ja: "分割購入", en: "Layaway" }, tabLoyalty: { ja: "ロイヤルティ", en: "Loyalty" }, tabAccount: { ja: "マイアカウント", en: "Account" },
  },
  product: { gallery: { ja: "商品写真", en: "Product photos" }, photoOf: { ja: "写真 {n} / {total}", en: "Photo {n} of {total}" }, prevPhoto: { ja: "前の写真", en: "Previous photo" }, nextPhoto: { ja: "次の写真", en: "Next photo" }, openPhoto: { ja: "写真 {n} を全画面で見る", en: "View photo {n} full screen" }, viewer: { ja: "全画面の商品写真", en: "Full-screen photos" }, closeViewer: { ja: "全画面表示を閉じる", en: "Close full screen" }, originJapan: { ja: "日本製", en: "Made in Japan" }, preloved: { ja: "プレラブド · 日本で真贋確認済み", en: "Preloved · authenticated in Japan" }, metal: { ja: "素材", en: "Metal" }, weight: { ja: "重量", en: "Weight" }, stone: { ja: "石", en: "Stone" }, reserveFrom: { ja: "予約金", en: "reserve from" }, sold: { ja: "売約済み", en: "Sold" }, orReserve: { ja: "または {dp} で予約し、残額を無利息で月々お支払い", en: "or reserve with {dp} and pay the rest monthly at 0% interest" }, reserveCta: { ja: "分割予約で申し込む", en: "Reserve with layaway" }, reserveNote: { ja: "カートに入れて、お支払い手続きで分割予約をお選びください。", en: "Adds the piece to your cart; choose layaway at checkout."  },
    // Loyalty points line under the price (2026-10-03). Figures are the Hub's
    // (GET /me/points-preview); {mult} is the level's multiplier.
    pointsEarn: { ja: "このアイテムで{points}ポイント獲得（{tier}・{mult}倍）", en: "Earn {points} points with this piece at {tier} ({mult}×)." },
    pointsEarnUp: { ja: "このアイテムで{points}ポイント獲得（ご購入で{tier}にランクアップ・{mult}倍）", en: "Earn {points} points with this piece at {tier} ({mult}×), the level this purchase takes you to." },
    pointsBonus: { ja: "＋開催中のキャンペーンでボーナス{bonus}ポイント", en: "+ {bonus} bonus points while the current promotion runs." },
    pointsJoin: { ja: "会員プログラムにご参加いただくと、このアイテムで{points}ポイント獲得できます。", en: "Join our loyalty programme to earn {points} points with this piece." },
    pointsJoinCta: { ja: "参加する", en: "Join" } },
  calc: { jpy: { ja: "¥ 円", en: "¥ JPY" }, php: { ja: "₱ ペソ", en: "₱ PHP" }, price: { ja: "商品価格", en: "Piece price" }, term: { ja: "期間（か月）", en: "Term (months)" }, currency: { ja: "通貨", en: "Currency" }, dp: { ja: "予約金", en: "Down payment" }, dpPct: { ja: "予約金（{pct}）", en: "Down payment ({pct})" }, monthly: { ja: "月々", en: "Monthly" }, total: { ja: "合計", en: "Total" }, note: { ja: "目安です。正確なお支払日と金額は、ご予約確定後にアカウントに表示されます。", en: "Estimate. Your exact payment dates and amounts will appear in your account once your reservation is confirmed." }, updating: { ja: "更新中…", en: "Updating…" }, err: { ja: "見積もりを取得できませんでした", en: "Could not get a quote" }, eightNote: { ja: "（¥300,000以上）", en: "(¥300,000+)" }, unavailableTerm: { ja: "この金額ではご利用いただけません", en: "Not available at this amount" }, invalidPrice: { ja: "0より大きい金額を入力してください", en: "Enter a price greater than zero" }, notLaunched: { ja: "準備中", en: "coming soon" }, minFrom: { ja: "{amount}以上", en: "from {amount}" },
    // /layaway's piece mode (build step 5, comp brand-programmes "layaway"):
    // the term buttons read "6 months", a minimum under it as "orders from ¥…"
    // so it is not read as a price. English only in practice (/layaway is not
    // found on ja); the Japanese is kept for the day it opens.
    termPlain: { ja: "期間", en: "Term" }, monthsN: { ja: "{n}か月", en: "{n} months" }, ordersFrom: { ja: "{amount}以上のご注文", en: "orders from {amount}" } },
  search: {
    placeholder: { ja: "ジュエリーを検索", en: "Search jewelry" },
    prompt: { ja: "品名、ブランド名、素材、商品番号などを入力してください。", en: "Type a name, a brand, a metal or a product number." },
    title: { ja: "「{q}」の検索結果", en: "Results for \u201c{q}\u201d" },
    count: { ja: "{n}件の商品が見つかりました。", en: "{n} pieces found." },
    // English needs the singular; Japanese does not inflect for number, so the
    // two strings are deliberately identical there. Without this, one result
    // read "1 pieces found." — on /search and, once the suggestion panel got a
    // live region, out loud.
    countOne: { ja: "1件の商品が見つかりました。", en: "1 piece found." },
    none: { ja: "「{q}」に該当する商品はありませんでした。", en: "Nothing matches \u201c{q}\u201d." },
    seeAll: { ja: "{n}件すべてを見る", en: "See all {n} results" },
    open: { ja: "検索を開く", en: "Open search" },
    close: { ja: "検索を閉じる", en: "Close search" },
    // The suggestion panel's three non-result states. `noneShort` is the
    // dropdown's version of `none` above: the panel is narrow and the query is
    // already in the box the reader is looking at, so it does not repeat it.
    searching: { ja: "検索しています…", en: "Searching…" },
    noneShort: { ja: "該当する商品はありません。", en: "No pieces match." },
    browseAll: { ja: "コレクションを見る", en: "Browse collections" },
    failed: { ja: "検索を利用できません。もう一度お試しください。", en: "Search is unavailable — try again." },
    pieces: { ja: "作品", en: "Pieces" },
    collections: { ja: "コレクション", en: "Collections" },
    hint: { ja: "↑↓で選択、Enterで開く", en: "↑↓ to move, Enter to open" },
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
    // PRODUCT + GRID BUILD (step 2, 2026-09-27; comps in page-comps/
    // product-collection). New chrome, applied as recommended pending the
    // owner's review on the branch preview (D2-2, D2-3): listed in the PR.
    eyebrow: { ja: "コレクション", en: "Collection" },
    available: { ja: "{n}点 販売中", en: "{n} pieces available" },
    availableOne: { ja: "{n}点 販売中", en: "{n} piece available" },
    count: { ja: "{n}点", en: "{n} pieces" },
    countOne: { ja: "{n}点", en: "{n} piece" },
    includingSold: { ja: "（売約済みを含む）", en: " (including sold)" },
    condition: { ja: "状態", en: "Condition" },
    type: { ja: "種類", en: "Type" },
    typeJewelry: { ja: "ジュエリー", en: "Jewelry" }, typeWatch: { ja: "ウォッチ", en: "Watch" }, typeAccessory: { ja: "アクセサリー", en: "Accessory" },
    metal: { ja: "素材", en: "Metal" },
    availableOnly: { ja: "販売中のみ", en: "Available only" },
    sort: { ja: "並び替え", en: "Sort" },
    sortLabel: { ja: "並び替え：{s}", en: "Sort: {s}" },
    sortNewest: { ja: "新着順", en: "Newest" }, sortLow: { ja: "価格の安い順", en: "Price: low to high" }, sortHigh: { ja: "価格の高い順", en: "Price: high to low" },
    filter: { ja: "絞り込み", en: "Filter" },
    filters: { ja: "絞り込みと並び替え", en: "Filter and sort" },
    clear: { ja: "クリア", en: "Clear" },
    show: { ja: "{n}点を表示", en: "Show {n} pieces" },
    close: { ja: "閉じる", en: "Close" },
    askEyebrow: { ja: "スタッフに相談", en: "Ask a person" },
    askTitle: { ja: "お探しの一点をお聞かせください。", en: "Tell us the piece you are looking for." },
    availableNow: { ja: "販売中の作品", en: "Available now" },
    viewAll: { ja: "すべて見る", en: "View all" },
    // The card's reserve line, EN only (layawayOffered): the Hub's down payment, ¥ (₱).
    downPayment: { ja: "頭金 {dp}", en: "Down payment {dp}" },
  },
  /** The product page (step 2 build). New chrome listed in the PR for approval (D2-2, D2-3). */
  pdp: {
    breadcrumb: { ja: "パンくずリスト", en: "Breadcrumb" },
    video: { ja: "動画", en: "Video" },
    videoPlay: { ja: "動画を再生", en: "Play the video" },
    videoPause: { ja: "動画を一時停止", en: "Pause the video" },
    fullScreen: { ja: "全画面で見る", en: "Full screen" },
    specs: { ja: "仕様", en: "Specifications" },
    about: { ja: "作品について", en: "About this piece" },
    related: { ja: "関連する作品", en: "Related pieces" },
    condition: { ja: "状態", en: "Condition" },
    category: { ja: "カテゴリー", en: "Category" },
    size: { ja: "サイズ", en: "Size" },
    securePay: { ja: "安全なお支払い", en: "Secure payment" },
    shipping: { ja: "配送", en: "Shipping" },
    reserveReturns: { ja: "ご予約・返品", en: "Reservation and returns" },
    soldTitle: { ja: "この作品は売約済みです。", en: "This piece has sold." },
    soldBody: { ja: "近い作品をご覧いただくか、スタッフにお探しの一点をお伝えください。", en: "See the closest pieces we have now, or tell us what you are looking for." },
    soldAsk: { ja: "Messengerで似た作品を相談する", en: "Ask about a similar piece on Messenger" },
    buyBar: { ja: "購入バー", en: "Buy bar" },
    trustRows: { ja: "安心のポイント", en: "Why buy from us" },
  },
  footer: { follow: { ja: "フォローする", en: "Follow us" }, tokusho: { ja: "特定商取引法に基づく表記", en: "Legal notice (Specified Commercial Transactions Act)" }, invoiceReg: { ja: "適格請求書発行事業者登録番号 T7011801044120", en: "Qualified invoice issuer registration no. T7011801044120" }, secondhandPermit: { ja: "古物商許可 東京都公安委員会 第307762418064号", en: "Secondhand dealer permit: Tokyo Metropolitan Public Safety Commission No. 307762418064" }, shop: { ja: "ショップ", en: "Shop" }, all: { ja: "すべて", en: "All" }, help: { ja: "サポート", en: "Help" }, legal: { ja: "法的情報", en: "Legal" }, terms: { ja: "分割予約規約", en: "Layaway terms" }, faq: { ja: "よくある質問", en: "FAQ" }, goldGuide: { ja: "ゴールドの基礎知識", en: "Gold guide" }, privacy: { ja: "プライバシーポリシー", en: "Privacy policy" }, sale: { ja: "利用規約", en: "Terms of Service" }, returns: { ja: "返品・キャンセル・返金", en: "Returns and refunds" }, collections: { ja: "コレクション", en: "Collections" }, care: { ja: "カスタマーケア・法的情報", en: "Customer care and legal" }, newsletter: { ja: "ニュースレター", en: "Newsletter" }, newsletterNote: { ja: "新着・会員向け先行案内。いつでも解除できます。", en: "New pieces, member previews. Unsubscribe any time." }, cards: { ja: "ご利用いただけるカード：Visa・Mastercard・American Express・JCB・Diners Club・Discover", en: "Cards accepted: Visa, Mastercard, American Express, JCB, Diners Club and Discover" }, paidy: { ja: "Paidyあと払いがご利用いただけます", en: "Paidy (pay later) accepted" } },
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
    join: { ja: "無料で入会する", en: "Join free" }, joinH: { ja: "入会はこちら", en: "Join the program" },
    joinP: { ja: "入会は無料です。メールアドレスでサインインすると、次回のお買い物からポイントが貯まります。", en: "Joining is free. Sign in with your email and points start with your next purchase." },
    name: { ja: "お名前", en: "Your name" }, contact: { ja: "携帯番号またはメール", en: "Mobile number or email" }, region: { ja: "お住まいの地域", en: "Where you live" }, submit: { ja: "入会する", en: "Join" },
    ok: { ja: "ご入会ありがとうございます。次回のお買い物からポイントが貯まります。", en: "Welcome, you are a member. Points start with your next purchase." },
    alreadyMember: { ja: "すでに会員です。ポイントはアカウントページでご確認いただけます。", en: "You are already a member. See your points on your account page." },
    joinFailed: { ja: "入会を完了できませんでした。担当者より1営業日以内にご連絡します。", en: "We could not complete your membership. A team member will contact you within one business day." },
    consent: { ja: "入会により利用規約とプライバシーポリシーに同意したものとみなします。", en: "By joining you agree to the terms of sale and privacy policy." },
    groupH: { ja: "会員グループに参加", en: "Join the member group" },
    groupP: { ja: "会員限定のお知らせ・先行案内・サポート", en: "Members-only updates, early previews and support." },
    // The hero's two-cell ledger (build step 5, comp brand-programmes
    // "loyalty"). Both facts are the lede's own words set as figures — 1% at
    // Glimmer, one point = ¥1 — not new claims and not computed.
    baseRate: { ja: "基本付与率", en: "Base rate" }, baseRateValue: { ja: "1%", en: "1%" },
    pointValue: { ja: "ポイントの価値", en: "Point value" }, pointValueValue: { ja: "1 = ¥1", en: "1 = ¥1" },
    onNextPiece: { ja: "次回のお買い物に", en: "on your next piece" },
  },
  /**
   * /layaway (build step 5, comp brand-programmes "layaway"): the calculator's
   * chosen piece and the strip of pieces under it. The page is not found on
   * ja (layawayOffered), so only the English renders; the Japanese is kept
   * neutral for the day it opens.
   */
  layawayPage: {
    chosenPiece: { ja: "選んだ商品", en: "Chosen piece" },
    choosePiece: { ja: "ほかの商品を選ぶ", en: "Choose another piece" },
    reserveThis: { ja: "この商品を予約する", en: "Reserve this piece with layaway" },
    reserveToday: { ja: "今すぐ予約できる商品", en: "Pieces you can reserve today" },
    allPieces: { ja: "すべての商品", en: "All pieces" },
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
    // The floating button (components/site/messenger-button.tsx). Its own key:
    // the owner chose different Japanese for it than for the footer icon.
    messengerButton: { ja: "Messengerでお問い合わせ", en: "Message us on Messenger" },
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
  faq: { h1: { ja: "よくある質問", en: "Frequently asked questions" }, lede: { ja: "お問い合わせの多いご質問をまとめました。ほかにご不明な点があればお気軽にご連絡ください。", en: "The questions we are asked most. If yours is not here, please get in touch." }, categories: { ja: "質問のカテゴリー", en: "Question categories" } },
  gold: { h1: { ja: "ゴールドの基礎知識", en: "The gold guide" }, lede: { ja: "K18の意味、刻印の読み方、長く美しく保つためのお手入れ。購入前に知っておいていただきたいことをまとめました。", en: "What K18 means, how to read a stamp, and how to keep a piece looking right. The things worth knowing before you buy." }, cta: { ja: "コレクションを見る", en: "Shop the collections" }, plateGold: { ja: "金 75%", en: "Gold 75%" }, plateAlloy: { ja: "割金 25%（銀・銅など）", en: "Alloy 25% (silver, copper)" }, illustration: { ja: "イメージ", en: "Illustration" }, },
  account: {
    print: { ja: "印刷 / PDFで保存", en: "Print / save as PDF" },
    invoiceNo: { ja: "請求書番号", en: "Invoice no." },
    issuedBy: { ja: "発行者", en: "Issued by" },
    // The payment card that leads an order or plan page while money is due
    // (owner request 2026-09-24): what to send, by when, and where.
    payH: { ja: "お支払い方法", en: "How to pay" },
    amountDue: { ja: "お支払い金額", en: "Amount due" },
    depositAmountDue: { ja: "お申込金", en: "Deposit due" },
    payBy: { ja: "お支払い期限", en: "Pay by" },
    h1: { ja: "マイアカウント", en: "Your account" },
    // "Sign in" alone told a first-time customer they were in the wrong place:
    // there is no separate sign-up on this site — the first link creates the
    // account — and nothing on the page said so.
    loginH: { ja: "ログインまたは新規登録", en: "Sign in or create an account" },
    loginP: { ja: "安全なログインリンクをメールでお送りします。初めての方は、その後かんたんなプロフィールのご入力をお願いします。", en: "We'll email you a secure link. New customers then complete a short profile." },
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
    // Build step 4 (comp page-comps/account-signin): the sign-in page's other
    // half, and the check-your-email hints. "No password" is simply true of
    // email-link sign-in.
    noPassword: { ja: "パスワードは不要です。", en: "No password." },
    spamHint: { ja: "届かない場合は迷惑メールフォルダもご確認ください。", en: "If it is not there, check your spam folder." },
    stuck: { ja: "お困りの場合は、Messengerでスタッフにご連絡ください。", en: "Stuck? Message us on Messenger and a person will help." },
    holdsH: { ja: "アカウントでできること", en: "What your account holds" },
    perkOrders: { ja: "ご注文とご予約の状況", en: "Your orders and reservations" },
    perkLayaway: { ja: "分割予約のプランとお支払い予定", en: "Your layaway plans and schedule" },
    perkPoints: { ja: "ポイント・会員レベル（1ポイント＝¥1）", en: "Points and level (1 point = ¥1)" },
    perkAddresses: { ja: "保存したお届け先", en: "Saved delivery addresses" },
    welcome: { ja: "{name} 様", en: "Welcome back, {name}" },
    currentH: { ja: "現在のご予約", en: "Your current reservation" },
    viewOrder: { ja: "ご注文の詳細を見る", en: "View this order" },
    yourLevel: { ja: "会員レベル", en: "Your level" },
    pointsRate: { ja: "ポイント倍率 {n} · 1ポイント＝¥1", en: "Points {n} · 1 point = ¥1" },
    pointsYen: { ja: "ポイントは常に円で計算", en: "Always calculated in yen" },
    // The next level, from the Hub's own figures (lifetime_jpy, to_next_jpy).
    toNext: { ja: "{tier}まであと{amount}", en: "{amount} more to {tier}" },
    topLevel: { ja: "最上位のレベルです", en: "You are at the top level" },
    pointsSpend: { ja: "ポイントはこちらのサイトのご注文手続きでご利用いただけます。ポイントは譲渡・換金できません。", en: "Points can be used at checkout on this site. Points cannot be transferred or cashed out." },
    seeAddresses: { ja: "住所を見る", en: "See addresses" },
    addressCount: { ja: "{n}件のお届け先", en: "{n} saved" },
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
    soon: { ja: "ご注文の履歴をご確認いただけます。", en: "Everything you have with us is listed here." },
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
    portalP: { ja: "当店で直接承ったご注文のお支払いのご報告とご利用明細は、カスタマーポータルから承ります。こちらのサイトでのご注文は各ご注文ページからお支払いいただけ、ポイントはご注文手続きでご利用いただけます。", en: "For orders and plans arranged with us directly, payments are reported, extensions asked for and statements kept in the customer portal. Orders and plans placed on this site are paid from their own page here, and points can be used at checkout." },
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
    // Product page, stock above 1 (owner 2026-09-29, NL366 showed "one of a kind" with 6 in stock).
    inStockCount: { ja: "在庫{n}点。数量はカートで選べます。", en: "{n} in stock — choose the quantity in your cart." },
    soldOut: { ja: "売り切れ", en: "Sold out" },
    subtotal: { ja: "小計", en: "Subtotal" },
    shippingNote: { ja: "送料はお届け先の入力後に計算します。", en: "Shipping is calculated once you enter a delivery address." },
    // STEP 3 REDESIGN (comp page-comps/cart-checkout, D3-3): every order is a
    // reservation first, so the cart's one orange action says so.
    checkout: { ja: "ご予約手続きへ進む", en: "Continue to reserve" },
    checkoutShort: { ja: "ご予約手続きへ", en: "Continue to reserve" },
    plusShipping: { ja: "送料別", en: "+ shipping" },
    shippingCalc: { ja: "お届け先確定後に計算", en: "Calculated after the address" },
    // A quote never reserves stock (CLAUDE.md); the cart says so plainly.
    notHeld: { ja: "カートに入れても商品は確保されません。ご予約の確定時に在庫を確保し、スタッフが商品を確認してからお支払い方法をお送りします。", en: "A cart does not hold the piece. It is held when you reserve; staff then confirm it and send you how to pay." },
    continueShopping: { ja: "お買い物を続ける", en: "Continue shopping" },
    youMayLike: { ja: "あわせて見たい作品", en: "You may also like" },
    availableNow: { ja: "いまご予約いただける作品", en: "Available to reserve now" },
    emptyHelp: { ja: "一点物のため、気になる作品はお早めにご予約ください。ご質問はスタッフへどうぞ。", en: "Most pieces are one of a kind. Reserve the one you like, or ask us about it." },
    summaryH: { ja: "ご注文内容", en: "Your order" },
    removeItem: { ja: "{name}をカートから削除", en: "Remove {name} from the cart" },
    pieceOne: { ja: "1点", en: "1 piece" },
    pieces: { ja: "{n}点", en: "{n} pieces" },
    add: { ja: "カートに入れる", en: "Add to cart" },
    added: { ja: "カートに入れました", en: "Added to cart" },
    viewCart: { ja: "カートを見る", en: "View cart" },
  },
  checkout: {
    h1: { ja: "ご注文手続き", en: "Checkout" },
    // FOUR STEPS (D3-1, comp page-comps/cart-checkout): the customer reviews
    // last and reserves from the page that shows everything.
    stepDetails: { ja: "お客様情報", en: "Your details" },
    stepDelivery: { ja: "配送", en: "Delivery" },
    stepPayment: { ja: "お支払い", en: "Payment" },
    stepReview: { ja: "ご確認", en: "Review" },
    stepsLabel: { ja: "手続きの段階", en: "Checkout steps" },
    stepOf: { ja: "ステップ {n} / 4：{label}", en: "Step {n} of 4: {label}" },
    eyebrow: { ja: "ご予約手続き", en: "Reserve" },
    continueDelivery: { ja: "次へ：配送", en: "Continue: delivery" },
    continuePayment: { ja: "次へ：お支払い", en: "Continue: payment" },
    continueReview: { ja: "次へ：ご確認", en: "Continue: review" },
    backToCart: { ja: "カートへ戻る", en: "Back to cart" },
    // Before the Hub's quote the summary's figure is the pieces alone, not a
    // total: shipping is not known yet, so the label does not claim one.
    cartTotal: { ja: "商品合計", en: "Pieces total" },
    whenShips: { ja: "発送時期", en: "When it ships" },
    // The approved legal notice's own sentence (lib/content/legal.ts,
    // tokusho "delivery"): its first sentence only on EN, whose second names layaway.
    shipsWithin: { ja: "入金確認後5営業日以内に発送。", en: "Dispatched within five business days of payment clearing." },
    reviewName: { ja: "お客様", en: "Name" },
    reviewShipTo: { ja: "お届け先", en: "Shipping to" },
    reviewPayment: { ja: "お支払い", en: "Payment" },
    change: { ja: "変更", en: "Change" },
    changeItem: { ja: "{item}を変更", en: "Change {item}" },
    payJpy: { ja: "銀行振込（円）", en: "Bank transfer in yen" },
    payPhp: { ja: "振込（ペソ）", en: "Transfer in pesos" },
    reserveFirstH: { ja: "ご予約が先、お支払いは後です。", en: "Reserve first, pay after." },
    seeSummary: { ja: "ご注文内容を見る", en: "See your order" },
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
    // The order summary's peso figures before the checkout quote: the Hub's
    // estimate, labelled as one, with the yen beside it (lib/checkout-summary).
    pesoApprox: { ja: "約 {amount}", en: "≈ {amount}" },
    pesoEstimateNote: { ja: "（ご注文確定時に一度だけ換算します）", en: "(final amount converted once when you place the order)" },
    pesoNextStep: { ja: "ペソでの金額は次のステップで表示します。", en: "The peso amount will be shown at the next step." },
    manualQuote: { ja: "この国への送料は個別にお見積りいたします。ご注文前に担当者よりご連絡いたします。", en: "We quote shipping to this country individually. Our team will contact you before the order is placed." },
    shippingAtConfirmation: { ja: "送料は、スタッフがご注文を確認する際に加算いたします。確定した合計金額とお支払い方法はメールでお知らせします。現時点でお支払いの必要はございません。", en: "Shipping is added when we confirm your order. We will email you the final total and how to pay. There is nothing to pay yet." },
    shippingLaterShort: { ja: "確認時に加算", en: "Added when we confirm" },
    totalBeforeShipping: { ja: "合計（送料別）", en: "Total before shipping" },
    payHeading: { ja: "お支払い方法", en: "How you will pay" },
    // CHECKOUT PAYMENT CHOICE + POINTS (owner C1–C7, 2026-10-05). The method is
    // chosen on Review, from the Hub's own list; one that cannot be used is
    // shown greyed with its reason, never hidden. Japanese strings never name
    // layaway: on the Japanese site the layaway reason cannot render.
    payChooseOnReview: { ja: "銀行振込・あと払い（ペイディ）・カードの中から、確認画面でお選びいただけます。", en: "You choose bank transfer, Paidy or card on the review screen." },
    methodH: { ja: "お支払い方法を選択", en: "How would you like to pay?" },
    methodTransfer: { ja: "銀行振込", en: "Bank transfer" },
    methodTransferNote: { ja: "商品の確認後、お振込先と期限をメールでお送りします。", en: "Once we confirm your piece, we email you where to transfer and by when." },
    methodPaidy: { ja: "あと払い（ペイディ）", en: "Paidy (pay later)" },
    methodPaidyNote: { ja: "商品の確認後、ご注文ページからペイディでお支払いいただけます。翌月まとめて、または3回あと払い。", en: "Once we confirm your piece, pay with Paidy from your order page — next month, or in 3 instalments." },
    methodPaidyNeeds: { ja: "ペイディには、日本国内のご住所（都道府県を含む）、ご本人の日本の携帯電話番号、姓と名が必要です。", en: "Paidy needs a Japanese home address with prefecture, your own Japanese mobile number, and your family and given names." },
    methodCard: { ja: "クレジットカード・デビットカード", en: "Credit or debit card" },
    methodCardNote: { ja: "日本円でのお支払いです。商品の確認後、ご注文ページでカード購入同意書に署名し、カード情報を入力します（3Dセキュア）。お支払いの確認までは与信のみで、確認時に請求されます。", en: "Charged in yen. Once we confirm your piece: sign the card purchase agreement, then enter your card on your order page (3-D Secure). The card is only authorised until we confirm the payment." },
    methodWhyLayaway: { ja: "一括払いのみご利用いただけます", en: "For full payment only" },
    methodWhyCardYen: { ja: "カードは日本円でのお支払いのみです — ¥ を選ぶとご利用いただけます。", en: "Card payments are charged in yen — choose ¥ to pay by card." },
    methodWhyPaidyYen: { ja: "ペイディは日本円でのお支払いのみです — ¥ を選ぶとご利用いただけます。", en: "Paidy is in yen only — choose ¥ to use Paidy." },
    methodWhyPaidyJp: { ja: "日本国内のお届け先のみご利用いただけます。", en: "Paidy needs a delivery address in Japan." },
    methodWhyOff: { ja: "現在ご利用いただけません。", en: "Not available right now." },
    methodWhyNoAccount: { ja: "この通貨のお振込先が現在ありません。", en: "No transfer account for this currency right now." },
    methodLocked: { ja: "ご予約後はお支払い方法を変更できません。変更が必要な場合はご連絡ください。", en: "Once you reserve, your payment method is set. Contact us if it needs to change." },
    methodUnavailable: { ja: "選択したお支払い方法は現在ご利用いただけません。別の方法をお選びください。", en: "That payment method can't be used for this order now. Please choose another." },
    usePoints: { ja: "ポイントを使う", en: "Use points" },
    pointsBalance: { ja: "保有ポイント：{points} ポイント（= {value}）", en: "You have {points} points (= {value})." },
    pointsMax: { ja: "このご注文には最大 {points} ポイント（= {value}）までご利用いただけます。送料には使えません。", en: "You can use up to {points} points (= {value}) on this order. Points never pay shipping." },
    pointsMaxDeposit: { ja: "お申込金に最大 {points} ポイント（= {value}）までご利用いただけます。", en: "You can use up to {points} points (= {value}) on the deposit." },
    pointsInputLabel: { ja: "使うポイント", en: "Points to use" },
    pointsApply: { ja: "適用", en: "Apply" },
    pointsUseAll: { ja: "最大まで使う", en: "Use the most" },
    pointsRow: { ja: "ポイント利用", en: "Points" },
    pointsNewTotal: { ja: "ポイント利用後の合計", en: "Total after points" },
    amountToPay: { ja: "お支払い金額", en: "Amount to pay" },
    pointsDepositDue: { ja: "ポイント利用後のお申込金", en: "Deposit after points" },
    pointsHeldNote: { ja: "ポイントはスタッフがご注文を確認した時点で使われます。確認できなかった場合、ポイントはお戻しします。", en: "Points are taken when we confirm your piece. If we can't confirm it, they come back to you." },
    pointsNotReturned: { ja: "期限までにお支払いがない場合、ご利用のポイントは戻りません。", en: "If payment isn't completed by the deadline, the points used are not returned." },
    pointsWhyNotEnrolled: { ja: "ポイントは会員の方のみご利用いただけます。", en: "Points are for loyalty members." },
    pointsWhyNoPoints: { ja: "ご利用いただけるポイントがありません。", en: "You have no points to use yet." },
    pointsWhyOff: { ja: "現在ポイントはご利用いただけません。", en: "Points can't be used right now." },
    pointsWhyNone: { ja: "このご注文ではポイントをご利用いただけません。", en: "Points can't be used on this order." },
    pointsInvalid: { ja: "0〜{points} の間で入力してください。", en: "Enter a number from 0 to {points}." },
    pointsUnavailable: { ja: "ポイントを適用できませんでした。残高をご確認のうえ、もう一度お試しください。", en: "We couldn't apply those points. Check your balance and try again." },
    choiceFailed: { ja: "お支払い方法を更新できませんでした。もう一度お試しください。", en: "We couldn't update your payment choice. Please try again." },
    reserveExplainPaidy: { ja: "商品を確認後、ご注文ページのリンクをメールでお送りします。そこからペイディでお支払いください。", en: "You'll pay with Paidy after we confirm your piece — we'll email you the link." },
    reserveExplainCard: { ja: "商品を確認後、ご注文ページのリンクをメールでお送りします。そこからカードでお支払いください。", en: "You'll pay by card after we confirm your piece — we'll email you the link." },
    // Region-neutral by design: a customer is shown the methods for their own
    // destination and must never learn what the other region pays into.
    // Card (Square) is offered only on a confirmed YEN order paid in full, from
    // the order page (never layaway, never pesos) — so the line depends on both.
    transferOnly: { ja: "お支払いは銀行振込です。", en: "Paid by bank transfer." },
    transferThenCard: { ja: "銀行振込、またはご注文確定後にご注文ページからカードでもお支払いいただけます。", en: "Bank transfer, or by card once we confirm your order — the card option appears on your order page." },
    transferPreview: { ja: "お振込先は以下のとおりです。ご注文確定後、この画面とメールでも改めてご案内します。", en: "You will transfer to the account below. We show it again after you place the order, and send it by email." },
    placeOrder: { ja: "ご注文を確定する", en: "Place order" },
    // RESERVE FIRST (Hub A2). Shown only when the quote came back with
    // `reservation_mode`: no bank details and no deadline until staff confirm
    // the piece (owner rule).
    reserveNow: { ja: "予約する", en: "Reserve this piece" },
    reserveExplain: { ja: "商品を確認後、お支払い方法をメールでお送りします。", en: "We'll confirm your piece and email you payment details." },
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
    // ONE DOCUMENT IN TAGALOG WITH ENGLISH (owner decision 2026-09-25; no
    // separate English or Tagalog version) — these strings are the site's own copy
    // around it, in the site's own language, and they are not a translation of
    // the agreement and never quote its terms.
    agreementHeading: { ja: "分割予約契約書へのご署名", en: "Sign the layaway agreement" },
    agreementIntro: {
      ja: "お取り置きを確定する前に、分割予約契約書をお読みいただき、ご署名をお願いいたします。ご署名後、この画面に戻って「署名しました」を押してください。",
      en: "Before we hold the piece, please read and sign the layaway agreement. When you have signed, come back to this page and press “I have signed”.",
    },
    agreementLanguageNote: {
      ja: "契約書はタガログ語と英語を併用した1つの書面です。",
      en: "The agreement is written in Tagalog with English, as one document.",
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
    settlementOrderNote: { ja: "価格は日本円で設定しています。ペソでお支払いの場合は、ご注文時に一度だけ換算し、1ペソ単位に四捨五入します。", en: "Prices are set in yen. If you pay in pesos, your total is converted once, when you place the order, and rounded to the nearest peso." },
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
    layawayUnavailable: { ja: "このお支払い方法は日本語表示ではご利用いただけません。全額でのお支払いにお進みください。カートの中身はそのままです。", en: "Layaway is available on the English site only. Pay in full, or switch the language to English to reserve. Your basket is untouched." },
    // THE DEPOSIT DEADLINE IS THE CUSTOMER'S, NOT A CONSTANT. It said "72
    // hours" to everyone until 2026-09-24, and a first order gets 24. Same
    // split as deadlineWithin / deadlineNote: the number is rendered only when
    // the quote carries one, and the consequence names none.
    layawayDepositWithin: { ja: "お申込金は{hours}時間以内にお振込ください。", en: "Please send the deposit within {hours} hours." },
    layawayDeadlineNote: { ja: "期限を過ぎた場合はお取り置きを解除し、商品は再び販売いたします。お支払いは発生しません。", en: "After the deadline we release the hold and the piece goes back on sale; nothing is owed." },
    // Reservation mode: the deadline starts only when staff confirm the piece,
    // and the schedule is re-dated to that day, so neither gets a number here.
    layawayReserveNote: { ja: "商品の確認後に、お申込金のお振込先と期限をメールでお知らせします。お支払い期限はそこから始まります。それまでお支払いは発生しません。", en: "Once we confirm your piece, we email you where to send the deposit and by when — the deadline starts then. Nothing is owed before that." },
    layawayScheduleProvisional: { ja: "お支払い日は、商品を確認した日から数えて決まります。", en: "The dates are counted from the day we confirm your piece." },
    layawayFiguresProvisional: { ja: "お申込金とお支払い予定は確認の際に確定し、送料やご依頼のサービス料金が加わる場合があります。", en: "The deposit and schedule are final when we confirm, and may then include shipping and any service you asked for." },
    reservePiece: { ja: "この内容で予約する", en: "Reserve this piece" },
    reserving: { ja: "手続き中…", en: "Reserving…" },
    belowMinimum: { ja: "このご注文金額では、お選びの回数をご利用いただけません。ご利用いただける回数からお選びください。", en: "That number of months is not available at this order total. Please choose from the terms shown." },
    currencyUnsupported: { ja: "ただいまこの通貨ではお支払いいただけません。日本円をお選びいただくか、しばらくしてからお試しください。", en: "Paying in this currency isn't available right now. Please choose yen, or try again shortly." },
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
    // RESERVE FIRST (Hub A2). No bank details and no deadline on this screen:
    // staff confirm the piece first, and the payment email follows.
    reservedH1: { ja: "ご予約を承りました", en: "Reservation received" },
    reservedLede: { ja: "商品をお取り置きしております。商品を確認のうえ、1営業日以内にお支払い方法をメールでお送りします。", en: "Your piece is held for you. We'll check it and email you within one business day with how to pay." },
    reservedNoPayment: { ja: "お支払いは、確認のメールをお受け取りになるまでお待ちください。", en: "Please don't send any payment until that email arrives." },
    reservedPieces: { ja: "ご予約商品", en: "Pieces" },
    reservedTotal: { ja: "合計", en: "Total" },
    // WHAT HAPPENS NEXT (comp page-comps/cart-checkout, confirmation). No fixed
    // "72 hours" anywhere (D3-8): a first order gets 24, so the deadline is the
    // one in the payment email. No tracking promise (D3-20).
    nextH: { ja: "このあとの流れ", en: "What happens next" },
    next1: { ja: "ご予約受付 — 本日", en: "Reserved — today" },
    next1p: { ja: "商品はお取り置き中です。ほかの方はご予約できません。", en: "The piece is held. Nobody else can reserve it." },
    // "within one business day" only where reservedLede already promises it.
    next2: { ja: "スタッフが商品を確認 — 1営業日以内", en: "We confirm the piece — within one business day" },
    next2Plain: { ja: "スタッフが商品を確認", en: "We confirm the piece" },
    next2p: { ja: "刻印・状態を確認し、メールでご連絡します。", en: "We check the stamp and condition, then email you." },
    next3: { ja: "お振込 — メールに記載の期限まで", en: "You transfer — by the deadline in that email" },
    next4: { ja: "発送 — 入金確認後5営業日以内", en: "We ship — within 5 business days of your payment" },
    // English site only (layaway drafts are not found on ja).
    next3Paidy: { ja: "ペイディでお支払い — 確定メールのあとで", en: "You pay with Paidy — after the confirmation email" },
    next3Card: { ja: "カードでお支払い — 確定メールのあとで", en: "You pay by card — after the confirmation email" },
    next3Layaway: { ja: "お申込金のお振込 — メールに記載の期限まで", en: "Send the deposit — by the deadline in that email" },
    next4Layaway: { ja: "月々のお支払いのあと発送", en: "Monthly payments, then we ship" },
    next4LayawayP: { ja: "全額のお支払い完了後に発送します。", en: "The piece ships once the plan is paid in full." },
  },
  // 『あと払い（ペイディ）』 on a confirmed order (Paidy, 2026-10-03). The label
  // is Paidy's prescribed one, exactly; the explainer names the two plans the
  // merchant terms enable (pay next month, or 3 instalments chosen in the
  // Paidy app). Every amount shown is the Hub's; nothing here states a fee.
  paidy: {
    label: { ja: "あと払い（ペイディ）", en: "Paidy — あと払い（ペイディ）" },
    lede: { ja: "メールアドレスと携帯電話番号だけで、お支払いは翌月でOK。3回あと払いもペイディアプリからお選びいただけます。", en: "Pay next month with just your email and Japanese mobile number, or split into 3 in the Paidy app. For customers living in Japan." },
    button: { ja: "ペイディで支払う", en: "Pay with Paidy" },
    filing: { ja: "確認中…", en: "Confirming…" },
    note: { ja: "ペイディでのお申込み後、Cha Jewelsが内容を確認してからご請求が確定します。確定後、ご利用額は翌月にペイディからご請求されます（コンビニ払い・銀行振込・口座振替）。ペイディの処理中は、他のお支払い方法はご利用いただけません。", en: "After Paidy approves, Cha Jewels confirms the order before the charge is final. Paidy then bills you next month (convenience store, bank transfer or direct debit). While Paidy is processing, other ways to pay are not available." },
    testMode: { ja: "テストモード：実際の請求は発生しません。", en: "Test mode — nothing is charged." },
    rejected: { ja: "ペイディでのお支払いはご利用いただけませんでした。他のお支払い方法をご利用ください。", en: "Paidy could not approve this payment. Please use another way to pay." },
    errMismatch: { ja: "ペイディの承認内容がご注文と一致しなかったため、取り消しました。もう一度お試しください。ほかの方法をご希望の場合はご連絡ください。", en: "Paidy's approval did not match this order, so it was cancelled. Please try again, or contact us if you'd like to pay another way." },
    errNotOffered: { ja: "このご注文では現在ペイディをご利用いただけません。ページを再読み込みしてご確認ください。", en: "Paidy is not available for this order right now. Please reload the page." },
    errPending: { ja: "このご注文には確認中のお支払いがあります。", en: "A payment on this order is already being checked." },
    errTooMany: { ja: "お支払いの登録が上限に達しました。しばらくしてからお試しください。", en: "Too many payment attempts for now. Please try again later." },
    errSignedOut: { ja: "セッションが切れました。もう一度サインインしてください。", en: "Your session ended. Please sign in again." },
    errFailed: { ja: "ペイディのお支払いを登録できませんでした。もう一度お試しください。ほかの方法をご希望の場合はご連絡ください。", en: "We could not record the Paidy payment. Please try again, or contact us if you'd like to pay another way." },
    uncertain: { ja: "ペイディのお支払いを確認しています。二重のお支払いを防ぐため、確認が終わるまで他のお支払い方法は表示されません。", en: "We are checking your Paidy payment. To avoid paying twice, no other way to pay is shown until it is confirmed." },
    processingTitle: { ja: "ペイディのお支払いを処理中です", en: "Your Paidy payment is being processed" },
    processingBody: { ja: "ペイディでのお支払いを処理しています。二重のお支払いを防ぐため、この間は他のお支払い方法は表示されません。ペイディとCha Jewelsの確認が済み次第、このページが更新されます。", en: "Your Paidy payment is being processed. To avoid paying twice, no other way to pay is shown meanwhile. This page updates once Paidy and Cha Jewels have confirmed it." },
    windowOpenTitle: { ja: "ペイディの画面が開いたままです", en: "Your Paidy window was left open" },
    // PA04 wording (owner 2026-10-08): says what the Hub does — its next
    // hourly check finds no Paidy payment on this order — never that Paidy
    // "confirmed" anything. 30-minute window + the check at :51 = ~90 min.
    windowOpenBody: { ja: "ペイディの画面をお支払いを完了せずに閉じた（または開いたままにした）ようです。ペイディでのお支払いは今すぐやり直せます。二重のお支払いを防ぐため、銀行振込とカードは、次回の定期確認（通常90分以内）でこのご注文にペイディのお支払いがないことを確認できるまで表示されません。", en: "It looks like you closed Paidy without completing it, or left it open. You can open Paidy again right now. To protect you from paying twice, bank transfer and card stay hidden until our next hourly check finds no Paidy payment on this order — usually within 90 minutes." },
    // P05 (owner 2026-10-08): what Paidy needs from the buyer herself.
    needsTitle: { ja: "ペイディのご利用に必要な情報", en: "What Paidy needs from you" },
    needsBody: { ja: "ペイディでお支払いいただくには、次の情報が必要です。入力後、このページにペイディのお支払いボタンが表示されます。", en: "To pay with Paidy we need the details below. Once they are complete, the Paidy button appears on this page." },
    reqAddress: { ja: "日本国内のご住所（都道府県を含む）をアドレス帳の「既定の住所」に登録", en: "A Japanese home address, including the prefecture, set as your default address" },
    reqMobile: { ja: "ご本人の日本の携帯電話番号（070 / 080 / 090）", en: "Your own Japanese mobile number (070 / 080 / 090)" },
    reqNames: { ja: "姓と名（それぞれ入力）", en: "Your family name and given name, entered separately" },
    setAddress: { ja: "アドレス帳で既定の住所を設定する", en: "Set your default address in your address book" },
    familyName: { ja: "姓", en: "Family name" },
    givenName: { ja: "名", en: "Given name" },
    jpMobile: { ja: "日本の携帯電話番号", en: "Japanese mobile number" },
    save: { ja: "保存する", en: "Save" },
    saving: { ja: "保存中…", en: "Saving…" },
    errFamilyName: { ja: "姓を入力してください。", en: "Please enter your family name." },
    errGivenName: { ja: "名を入力してください。", en: "Please enter your given name." },
    errJpMobile: { ja: "070・080・090で始まる日本の携帯電話番号を入力してください。", en: "Please enter a Japanese mobile number starting with 070, 080 or 090." },
    errSaveFailed: { ja: "保存できませんでした。もう一度お試しください。", en: "That didn't save. Please try again." },
    // Under the N-Pay widget on every product page (owner decisions 2026-10-03
    // 22:01 / 22:04: the widget stays visible to every visitor; the condition
    // is stated right under it, never hidden by geography — and the condition
    // is WHO the customer is (lives in Japan: Japanese mobile, Paidy identity
    // check, pays in Japan), never "a delivery address in Japan", which would
    // read as usable by an overseas buyer shipping to a friend here).
    widgetNote: { ja: "ペイディは日本国内にお住まいのお客様向けです。日本の携帯電話番号と本人確認が必要で、お支払いは日本国内（コンビニ・銀行振込・口座振替）で行います。", en: "Paidy is for customers living in Japan: it requires a Japanese mobile number and Paidy's identity check, and you pay Paidy in Japan (convenience store, bank transfer or direct debit). Not available to customers outside Japan." },
  },
  // Card payment (Square) on a confirmed order (S3, 2026-10-04). The card is
  // HELD, never charged here: a reviewer's Confirm captures it, Reject releases
  // it. Every amount shown is the Hub's. The Card Purchase Agreement (owner D9)
  // is signed first on agreement.chajewelsjp.com; English governs, Japanese is
  // a translation.
  card: {
    eyebrow: { ja: "カードでお支払い", en: "Pay by card" },
    title: { ja: "カードでお支払い", en: "Pay by card" },
    orderButton: { ja: "カードで支払う", en: "Pay by card" },
    orderLede: { ja: "Visa・Mastercard・American Express・JCB・Diners Club・Discover。ご入力後はカードの与信枠を確保するのみで、Cha Jewelsがご注文を確認した時点で請求が確定します。", en: "Visa, Mastercard, American Express, JCB, Diners Club and Discover. Your card is only held when you pay; the charge is made once Cha Jewels confirms your order." },
    amount: { ja: "お支払い金額", en: "Amount" },
    forOrder: { ja: "ご注文", en: "Order" },
    lede: { ja: "カード情報はSquareの安全なフォームに直接入力され、Cha Jewelsには届きません。本人認証（3Dセキュア）が求められる場合があります。", en: "Your card details go straight into Square's secure form — Cha Jewels never sees them. Your bank may ask you to confirm the payment (3-D Secure)." },
    terms: { ja: "カード購入同意書の内容に同意し、与信枠の確保と、Cha Jewelsによる確認後の請求に同意します。", en: "I agree to the Card Purchase Agreement, to a hold on my card now, and to the charge once Cha Jewels confirms my order." },
    button: { ja: "カードで支払う", en: "Pay by card" },
    filing: { ja: "確認中…", en: "Confirming…" },
    loading: { ja: "カードフォームを読み込んでいます…", en: "Loading the card form…" },
    testMode: { ja: "テストモード：実際の請求は発生しません。", en: "Test mode — nothing is charged." },
    note: { ja: "この時点ではカードの与信枠を確保するだけで、請求はまだ行われません。Cha Jewelsがご注文を確認した時点で請求が確定し、確認できない場合は与信枠を解放します（7日以内）。", en: "Nothing is charged yet: your card is held, and the charge is made when Cha Jewels confirms your order. If the order cannot be confirmed, the hold is released (within 7 days)." },
    // SQ22: an authorisation is never "payment received". What is true at
    // each step, and nothing more.
    held: { ja: "{card}のカードを承認しました（与信の確保のみで、まだ請求はしていません）。お支払いを確認した時点で請求し、メールでお知らせします。", en: "Your card {card} is authorised — not charged yet. We charge it when we confirm your payment, and we will email you then." },
    heldNoCard: { ja: "カードを承認しました（与信の確保のみで、まだ請求はしていません）。お支払いを確認した時点で請求し、メールでお知らせします。", en: "Your card is authorised — not charged yet. We charge it when we confirm your payment, and we will email you then." },
    heldUntil: { ja: "この与信は{date}まで有効です。", en: "The authorisation stays open until {date}." },
    processing: { ja: "カード会社にお支払いを確認しています。もう一度お支払いはしないでください。確認が終わるとこのページに表示されます。", en: "We're confirming your card payment with your bank. Please don't pay again — this page updates when it's done." },
    capturing: { ja: "ただいまカードのお支払いを確定しています。", en: "We're taking the card payment now." },
    recording: { ja: "カードのお支払いが完了しました。現在、記録しています。", en: "Your card payment went through; we're recording it." },
    statusTitle: { ja: "カードのお支払い", en: "Card payment" },
    statusRef: { ja: "お問い合わせ番号 {ref}", en: "Reference {ref}" },
    statusOthersHidden: { ja: "このカードのお支払いの手続き中は、ほかのお支払い方法は表示されません。", en: "Other ways to pay are hidden while this card payment is open." },
    refresh: { ja: "ページを再読み込み", en: "Refresh this page" },
    // The cardholder (owner 4A): her name as on the card, never a gift recipient's.
    cardholderName: { ja: "カード名義人", en: "Cardholder name" },
    cardholderHint: { ja: "カードに記載のお名前を、一行でご入力ください。", en: "As on the card — your whole name on one line." },
    billingSame: { ja: "請求先住所はお届け先と同じ", en: "Billing address same as delivery" },
    billingDelivery: { ja: "このご注文のお届け先", en: "Delivery address on this order" },
    billingTitle: { ja: "請求先住所", en: "Billing address" },
    billingCountry: { ja: "国", en: "Country" },
    billingCountryPlaceholder: { ja: "国を選択", en: "Choose a country" },
    billingPostal: { ja: "郵便番号", en: "Postal code" },
    billingState: { ja: "都道府県・州", en: "Prefecture / state" },
    billingCity: { ja: "市区町村", en: "City" },
    billingLine1: { ja: "住所1", en: "Address line 1" },
    billingLine2: { ja: "住所2（任意）", en: "Address line 2 (optional)" },
    errBillingName: { ja: "カード名義人をご入力ください。", en: "Please enter the cardholder name." },
    errBillingAddress: { ja: "請求先住所（国・住所1・市区町村）をご入力ください。", en: "Please enter the billing address (country, address line 1 and city)." },
    backToOrder: { ja: "ご注文ページへ戻る", en: "Back to the order" },
    // The agreement gate, before the form (owner D9).
    signTitle: { ja: "まずカード購入同意書にご署名ください", en: "First, sign the Card Purchase Agreement" },
    signLede: { ja: "カードでのお支払いには、電子署名によるカード購入同意書が必要です。署名ページでご注文内容をご確認のうえ署名すると、このページに戻ってカード情報をご入力いただけます。", en: "A card payment needs the e-signed Card Purchase Agreement. The signing page shows your order; once you sign, it brings you back here to enter your card." },
    signButton: { ja: "同意書に署名する", en: "Sign the agreement" },
    signedCheck: { ja: "署名済みの方はこちら", en: "Already signed? Check again" },
    // Signed, but not for this customer and amount (owner 5A).
    resignTitle: { ja: "同意書にもう一度ご署名ください", en: "Please sign the agreement again" },
    resignAmount: { ja: "ご署名の後にお支払い金額が変わりました。新しい金額で同意書にもう一度ご署名ください。", en: "The amount changed after you signed. Please sign the agreement again for the new amount." },
    resignUnbound: { ja: "このご注文について、カード購入同意書にもう一度ご署名ください。新しい署名リンクでは、お客様のアカウントとお支払い金額が記録されます。", en: "Please sign the Card Purchase Agreement again for this order — the new signing link records your account and the amount." },
    unverified: { ja: "署名の確認ができませんでした。しばらくしてからもう一度お試しください。問題が続く場合はご連絡ください。", en: "We could not check your signature right now. Please try again in a moment; if it keeps happening, message us." },
    notOffered: { ja: "このご注文では現在カードでのお支払いをご利用いただけません。", en: "A card payment is not available for this order right now." },
    // Refusals (SQ22). "Nothing was charged" appears ONLY where it is true:
    // a decline, a voided mismatch, a changed amount, the caps, a refusal
    // before Square, and a 502 (Square refused the request itself).
    errDeclined: { ja: "カード会社がこのお支払いを承認しませんでした。請求は発生していません。別のカードをお試しください。ほかの方法をご希望の場合はご連絡ください。", en: "Your bank did not approve this payment. Nothing was charged. Please try another card, or contact us if you'd like to pay another way." },
    errDeclinedCancelled: { ja: "カードが複数回承認されなかったため、セキュリティ保護のためこのご注文をキャンセルしました。請求は発生していません。お手数ですがお問い合わせください。", en: "For your security this order was cancelled after several declined cards. Nothing was charged. Please contact us." },
    errMismatch: { ja: "カードの承認内容がご注文と一致しなかったため、取り消しました。請求は発生していません。もう一度お試しください。", en: "The card authorisation did not match this order, so it was cancelled. Nothing was charged. Please try again." },
    errMismatchPending: { ja: "カードの承認内容がご注文と一致しなかったため、取り消しの手続き中です。まだもう一度お支払いはしないでください。担当者からご連絡します。", en: "The card authorisation did not match this order and is being cancelled. Please don't pay again yet — our team will contact you." },
    errAttemptPending: { ja: "前回のカードのお支払いを確認中です。数分お待ちいただき、このページを再読み込みしてください。", en: "Your previous card attempt is still being confirmed. Please wait a few minutes, then refresh this page." },
    errAmountChanged: { ja: "このご注文のお支払い金額が変わりました。請求は発生していません。ページを再読み込みして、新しい金額をご確認ください。", en: "The amount due on this order has changed. Nothing was charged — please reload this page to see the new amount." },
    errHoldUnfiled: { ja: "カードの承認は受け取りましたが、ご注文に紐づけることができませんでした。担当者からご連絡します。もう一度お支払いはしないでください。", en: "We received an authorisation but couldn't attach it to your order; our team will contact you. Please don't pay again." },
    errUnconfirmed: { ja: "結果を確認できませんでした。まだもう一度お支払いはしないでください。1分ほどしてからこのページを再読み込みしてください。", en: "We couldn't confirm the result. Please don't pay again yet — refresh this page in a minute." },
    errVerification: { ja: "本人認証（3Dセキュア）が完了しませんでした。もう一度お試しください。", en: "The bank's confirmation (3-D Secure) did not complete. Please try again." },
    errNotOffered: { ja: "このご注文では現在カードでのお支払いをご利用いただけません。ページを再読み込みしてご確認ください。", en: "A card payment is not available for this order right now. Please reload the page." },
    errPending: { ja: "このご注文には確認中のお支払いがあります。", en: "A payment on this order is already being checked." },
    errTooMany: { ja: "お支払いの試行回数が上限に達しました。請求は発生していません。しばらくしてからお試しください。", en: "Too many card attempts for now. Nothing was charged. Please try again later." },
    errSignedOut: { ja: "セッションが切れました。もう一度サインインしてください。", en: "Your session ended. Please sign in again." },
    errTerms: { ja: "お支払いを続けるには同意が必要です。", en: "Please tick the agreement line to continue." },
    errUnavailable: { ja: "カード決済サービスに接続できませんでした。請求は発生していません。しばらくしてからお試しください。ほかの方法をご希望の場合はご連絡ください。", en: "We couldn't reach the card service. Nothing was charged. Please try again shortly, or contact us if you'd like to pay another way." },
    failsafe: { ja: "ただいまカードでのお支払いをご利用いただけません。ページを再読み込みするか、ご連絡ください。", en: "Card payment isn't available right now. Please reload the page, or contact us." },
    errFailed: { ja: "カードのお支払いを開始できませんでした。請求は発生していません。もう一度お試しください。ほかの方法をご希望の場合はご連絡ください。", en: "We couldn't start the card payment. Nothing was charged. Please try again, or contact us if you'd like to pay another way." },
    // Square's card box marks the field it refused (number, expiry, CVV, ZIP).
    errForm: { ja: "カード入力欄に表示された項目をご確認ください。", en: "Please check the card field marked in the card box above." },
    errVerificationFailed: { ja: "カード会社での確認ができませんでした。請求は発生していません。もう一度お試しいただくか、別のカードをご利用ください。", en: "Your card couldn't be checked with your bank. Nothing was charged. Please try again, or use another card." },
  },
  orders: {
    // A submission the Hub is still checking (a transfer slip, a Paidy
    // authorisation or a card hold): shown instead of the payment card until
    // a reviewer confirms or rejects it. Same shape as plans.pending.
    pending: { ja: "お支払いを確認中です", en: "Your payment is being checked" },
    pendingNote: { ja: "{amount}（{date}・{method}）を確認中です。確認後にメールでお知らせします。", en: "{amount} ({date}, {method}) is being checked. We will email you once it is confirmed." },
    methodPaidy: { ja: "あと払い（ペイディ）", en: "Paidy" },
    methodCard: { ja: "カード", en: "card" },
    methodTransfer: { ja: "お振込", en: "bank transfer" },
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
    // Build step 4: the orders ledger and the order page's status line.
    status: { ja: "状況", en: "Status" },
    directToo: { ja: "ライブ販売などで当店に直接ご注文いただいた分も、こちらに表示されます。", en: "Orders arranged with us directly, such as from a live sale, are listed here too." },
    arrangedShort: { ja: "当店で直接承ったご注文", en: "Arranged with us directly" },
    orderRef: { ja: "ご注文 {ref}", en: "Order {ref}" },
    progress: { ja: "ご注文の進み具合", en: "Order progress" },
    stageReserved: { ja: "ご予約受付", en: "Reserved" },
    stageConfirmed: { ja: "商品の確認", en: "Piece confirmed" },
    stagePayment: { ja: "お支払い案内・お振込", en: "Payment details, transfer" },
    // Payment lifecycle S1: step 3 follows the method she chose.
    stagePaymentPaidy: { ja: "お支払い（ペイディ）", en: "Payment (Paidy)" },
    stagePaymentCard: { ja: "お支払い（カード）", en: "Payment (card)" },
    stagePaid: { ja: "入金確認", en: "Payment received" },
    stageShipped: { ja: "発送", en: "Shipped" },
    stageDone: { ja: "{stage}（完了）", en: "{stage} (done)" },
    stageNow: { ja: "{stage}（現在）", en: "{stage} (now)" },
    payment: { ja: "お支払い", en: "Payment" },
    bankTransfer: { ja: "銀行振込", en: "Bank transfer" },
    plusShipping: { ja: "＋送料", en: "+ shipping" },
    payVia: { ja: "{method}（{currency}）", en: "{method} in {currency}" },
    // C1 (2026-10-05): a website order shows only the method she chose.
    chosenPaidy: { ja: "あと払い（ペイディ）", en: "Paidy (pay later)" },
    chosenCard: { ja: "クレジットカード・デビットカード（日本円）", en: "Credit or debit card (in yen)" },
    pointsUsed: { ja: "ポイント利用", en: "Points used" },
    pointsNotReturned: { ja: "期限までにお支払いがない場合、ご利用のポイントは戻りません。", en: "If payment isn't completed by the deadline, the points used are not returned." },
    methodUnavailableNote: { ja: "お選びいただいたお支払い方法が現在ご利用いただけません。お手数ですが、お問い合わせください。", en: "The payment method you chose can't be used on this order right now. Please contact us and we'll sort it out." },
    currencyJPY: { ja: "円", en: "yen" },
    currencyPHP: { ja: "ペソ", en: "pesos" },
    notFound: { ja: "ご注文が見つかりませんでした。", en: "We could not find that order." },
    statusPendingTransfer: { ja: "お振込待ち", en: "Awaiting transfer" },
    // Payment lifecycle S1: a Paidy or card order waits for a payment, not a transfer.
    statusPendingPayment: { ja: "お支払い待ち", en: "Awaiting payment" },
    // Payment lifecycle S3: the reviewer's last decision, and "Pay another way" after a rejection.
    decisionRejected: { ja: "前回のお支払い（{method} {amount}・{date}）はお受けできませんでした。", en: "Your last payment ({method} {amount}, {date}) was not accepted." },
    decisionMethodPaidy: { ja: "ペイディ", en: "Paidy" },
    decisionMethodCard: { ja: "カード", en: "card" },
    decisionMethodTransfer: { ja: "お振込", en: "bank transfer" },
    decisionNothingCharged: { ja: "ご請求は発生していません。", en: "Nothing was charged." },
    decisionNeedsInfo: { ja: "お支払いの確認のため、ご連絡が必要です。", en: "We need to hear from you to confirm your payment." },
    decisionReplyHint: { ja: "お送りしたメールにご返信いただくか、お問い合わせください。", en: "Please reply to the email we sent you, or contact us." },
    decisionMessage: { ja: "当店からのご連絡", en: "Our note" },
    switchLink: { ja: "ほかのお支払い方法に変更する", en: "Pay another way" },
    switchConfirm: { ja: "お支払い方法を「{method}」に変更します。よろしいですか？", en: "Change how you pay to {method}?" },
    switchConfirmButton: { ja: "変更する", en: "Change" },
    switchCancel: { ja: "やめる", en: "Keep as is" },
    switchInProgress: { ja: "お支払いの手続き中のため、いまは変更できません。少し時間をおいて、ページを再読み込みしてください。", en: "A payment is being processed on this order, so it can't be changed right now. Please reload the page in a moment." },
    switchNotAllowed: { ja: "このご注文では、お支払い方法を変更できなくなりました。ページを再読み込みしてご確認ください。ご不明な点はご連絡ください。", en: "The payment method on this order can no longer be changed. Please reload the page, and contact us if you need help." },
    switchFailed: { ja: "変更できませんでした。もう一度お試しいただくか、ご連絡ください。", en: "We couldn't change it. Please try again, or contact us." },
    amountToPay: { ja: "お支払い金額", en: "Amount to pay" },
    paidyContactToSwitch: { ja: "ほかの方法でのお支払いをご希望の場合は、ご連絡ください", en: "If you'd like to pay another way, please contact us." },
    statusReserved: { ja: "ご予約受付 — 確認中", en: "Reserved — confirming your piece" },
    reservedNote: { ja: "商品を確認しております。1営業日以内にメールでご連絡します。確認後は、お支払い方法と期限もこちらに表示されます。", en: "We're confirming your piece and will email you within one business day. Once it's confirmed, how to pay and the deadline appear here too." },
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
  /**
   * WEBSITE ORDERS (Hub PR 6 / storefront PR 7): a checkout the Hub holds as a
   * DRAFT until staff confirm the piece. Nothing to pay until then; the figures
   * are provisional. Layaway wording is English-only in effect: a layaway draft
   * page is not found on the Japanese site (layawayOffered).
   */
  draft: {
    h1: { ja: "ご注文を承りました", en: "We have your order" },
    lede: { ja: "スタッフがお品物を確認しております。確認が取れ次第、確定した合計金額とお支払い方法をメールでお知らせします。", en: "Our staff are confirming your piece. As soon as it is confirmed we will email you the final total and how to pay." },
    layawayH1: { ja: "お申込みを承りました", en: "We have your layaway request" },
    layawayLede: { ja: "スタッフがお品物を確認しております。確認が取れ次第、お申込金、お振込先、お支払い予定をメールでお知らせします。", en: "Our staff are confirming your piece. As soon as it is confirmed we will email you the deposit, where to send it and your payment schedule." },
    nothingYet: { ja: "現時点でお支払いの必要はございません。確認のメールが届くまでお支払いはお控えください。", en: "There is nothing to pay yet. Please don't send any payment until that email arrives." },
    // C1–C5 (2026-10-05): what she chose at checkout, shown while we confirm.
    payWith: { ja: "お支払い方法", en: "Paying by" },
    payWithTransfer: { ja: "銀行振込 — 商品の確認後、お振込先と期限をメールでお送りします。", en: "Bank transfer — we'll email you where to transfer and by when once we confirm your piece." },
    payWithPaidy: { ja: "あと払い（ペイディ） — 商品の確認後、ご注文ページのリンクをメールでお送りします。", en: "Paidy — you'll pay with Paidy after we confirm your piece; we'll email you the link." },
    payWithCard: { ja: "クレジットカード・デビットカード（日本円） — 商品の確認後、ご注文ページのリンクをメールでお送りします。カード購入同意書への署名、カード情報の入力（3Dセキュア）、確認までは与信のみです。", en: "Card, charged in yen — after we confirm your piece we'll email you the link. Then: sign the card purchase agreement, enter your card (3-D Secure); it is only authorised until we confirm the payment." },
    points: { ja: "ポイント利用", en: "Points" },
    pointsHeld: { ja: "ポイントはスタッフの確認時に使われます。確認できなかった場合はお戻しします。", en: "Your points are taken when we confirm your piece, and come back to you if we can't." },
    provisional: { ja: "表示の金額は確認前の目安です。送料やご依頼のサービス料金が加わる場合があります。", en: "These figures are provisional. Shipping, and any service you asked for, may be added when we confirm." },
    reference: { ja: "ご注文番号", en: "Order reference" },
    totalSoFar: { ja: "合計（確認前）", en: "Total so far" },
    amountToPay: { ja: "お支払い予定額", en: "Amount to pay" },
    shipping: { ja: "送料", en: "Shipping" },
    shippingLater: { ja: "確認時に加算", en: "Added when we confirm" },
    deposit: { ja: "お申込金（確認前）", en: "Deposit (provisional)" },
    term: { ja: "期間", en: "Term" },
    months: { ja: "{n}か月", en: "{n} months" },
    pieces: { ja: "ご注文商品", en: "Pieces" },
    shipTo: { ja: "お届け先", en: "Shipping to" },
    statusWaiting: { ja: "確認中", en: "Confirming your piece" },
    statusDeclined: { ja: "ご用意できませんでした", en: "We could not supply this piece" },
    statusExpired: { ja: "キャンセルされました", en: "Cancelled" },
    declinedH1: { ja: "申し訳ございません。お品物をご用意できませんでした", en: "We're sorry — we could not supply this piece" },
    declinedLede: { ja: "このご注文はキャンセルとなりました。お支払いは発生しておりません。", en: "This order is cancelled. Nothing was charged." },
    expiredH1: { ja: "このご注文はキャンセルされました", en: "This order was cancelled" },
    expiredLede: { ja: "72時間以内にお品物の確認ができなかったため、ご注文をキャンセルいたしました。お支払いは発生しておりません。", en: "We could not confirm your piece within 72 hours, so the order was cancelled. Nothing was charged." },
    reason: { ja: "理由", en: "Reason" },
    shop: { ja: "コレクションを見る", en: "Browse the collections" },
    waitingH: { ja: "確認中のご注文", en: "Waiting for confirmation" },
    closedH: { ja: "キャンセルされたご注文", en: "Cancelled before confirmation" },
    view: { ja: "詳細", en: "View" },
    notFound: { ja: "ご注文が見つかりませんでした。", en: "We could not find that order." },
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
    statusReserved: { ja: "ご予約受付 — 確認中", en: "Reserved — confirming your piece" },
    noteReserved: { ja: "商品を確認しております。1営業日以内に、お申込金のお振込先と期限をメールでお送りします。確認後は、こちらにも表示されます。", en: "We're confirming your piece and will email you within one business day with where to send the deposit and by when. Once it's confirmed, they appear here too." },
    scheduleProvisional: { ja: "お支払い日は、商品の確認後にその日から数え直します。", en: "These dates are recounted from the day we confirm your piece." },
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
    readOnlyNote: { ja: "こちらではすべてのご予約をご確認いただけます。こちらのサイトでのご予約は、各ページからお支払いいただけます。当店で直接承ったご予約のお支払いのご報告と延長のお申し出は、カスタマーポータルをご利用ください。", en: "Every plan you have with us is listed here. A plan placed on this site is paid from its own page. For a plan arranged with us directly, payments are reported and extensions asked for in the customer portal." },
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
    errProofType: { ja: "写真（JPEG・PNG・WebP・HEIC）またはPDFを添付してください。", en: "Please attach a photo (JPEG, PNG, WebP or HEIC) or a PDF." },
    errProofUpload: { ja: "画像をアップロードできませんでした。もう一度お試しください。", en: "We could not upload that image. Please try again." },
    errTooMany: { ja: "本日のご報告は上限に達しました。恐れ入りますが、明日以降にお試しください。", en: "That is as many reports as we can take today. Please try again tomorrow." },
    errExceeds: { ja: "残額を超える金額はお受けできません。", en: "That is more than the plan still owes." },
    errNotLive: { ja: "このご予約は終了しているため、お支払いをお受けできません。", en: "This plan is closed, so we cannot take a payment for it." },
    errNotReady: { ja: "まだ商品を確認中のため、お支払いをお受けできません。準備が整いしだい、メールでお知らせします。", en: "We're still confirming this piece, so we can't take a payment yet. We'll email you as soon as it's ready." },
    errFailed: { ja: "送信できませんでした。もう一度お試しください。", en: "We could not send that. Please try again." },
  },
  /** Build step 7 (comp page-comps/legal): the frame around the four legal pages. The documents' own text lives in lib/content/legal.ts and is unchanged. */
  /** Build step 7 is legalPage below; build step 6 (comp page-comps/supporting): search, 404, error, Contact and FAQ. New wording is marked D6 in the PR for the owner's review. */
  support: {
    search: { ja: "検索", en: "Search" },
    inStockNow: { ja: "いま在庫のある作品", en: "In stock now" },
    seeAll: { ja: "すべて見る", en: "See all" },
    all: { ja: "すべて", en: "All" },
    inStock: { ja: "在庫あり", en: "In stock" },
    filters: { ja: "絞り込み", en: "Filters" },
    tileEyebrow: { ja: "お探しの一点が見つからない場合", en: "Looking for something else?" },
    tileLine: { ja: "サイズや素材のご希望を、スタッフにお伝えください。", en: "Tell a person the size and metal you want." },
    tryThese: { ja: "こちらで探してみてください", en: "Try one of these" },
    lookEyebrow: { ja: "スタッフが探します", en: "We can look for it" },
    lookLine: { ja: "一点物が多いため、店頭に出ていない作品もあります。", en: "Most pieces are one of a kind, and not every piece is listed yet." },
    errorH: { ja: "ただいまページを表示できません。", en: "This page could not load." },
    errorP: { ja: "時間をおいて、もう一度お試しください。お急ぎの場合はMessengerでご連絡ください。", en: "Please try again in a moment. If it is urgent, message us on Messenger." },
    retry: { ja: "もう一度読み込む", en: "Try again" },
    fastest: { ja: "いちばん早い連絡方法", en: "Fastest way to reach us" },
    contactLine: { ja: "作品のこと、サイズのこと、お支払いのこと。スタッフが直接お答えします。", en: "About a piece, a size or a payment: a person answers." },
    orNote: { ja: "フォームで送る", en: "Or send a note" },
    askH: { ja: "答えが見つからない場合は、スタッフへ。", en: "Not answered here? Ask a person." },
    questions: { ja: "{n}問", en: "{n} questions" },
  },
  legalPage: {
    pages: { ja: "法的情報のページ", en: "Legal pages" },
    contents: { ja: "目次", en: "Contents" },
    business: { ja: "事業者情報", en: "Business details" },
    print: { ja: "このページを印刷", en: "Print this page" },
    questions: { ja: "内容についてご不明な点は、担当者がお答えします。", en: "Questions about these terms? A person will answer." },
    contact: { ja: "お問い合わせ", en: "Contact" },
  },
  about: { h1: { ja: "私たちについて", en: "About Us" }, logoAlt: { ja: "Cha Jewels ロゴ", en: "Cha Jewels logo" } },
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
    empty: { ja: "サービス依頼はまだありません。ご注文のページから依頼できます。", en: "No service requests yet. You can raise one from an order or a layaway plan." },
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
    myAccount: { ja: "マイアカウント", en: "My account" },
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
  /**
   * "Complete your profile" (2026-09-24). The fields and their order are the
   * Hub's New Customer modal, minus staff-only Notes. Country values stay in
   * English in both languages: they are what the Hub stores.
   */
  // Cart reminders (opt-in, promotional; the Hub's docs/CART-REMINDERS.md).
  // CHANGING label OR help CHANGES THE CONSENT WORDING: bump
  // CART_REMINDER_TEXT_VERSION in lib/cart-reminders.ts in the same commit.
  cartReminders: {
    h: { ja: "カートのお知らせメール", en: "Cart reminder emails" },
    label: { ja: "カートに残した商品や、お手続きが完了しなかったご注文の商品についてのお知らせメール（Cha Jewelsからの販促メール）を受け取る", en: "Email me about pieces I leave in my cart or don't finish ordering (promotional emails from Cha Jewels)" },
    help: { ja: "お知らせは各1回まで、購入可能な商品のみご案内します。ご注文に関するメールやお支払いのご案内とは別のもので、本ページまたはお知らせメールからいつでも停止できます。", en: "At most one reminder each time, only for pieces still available. Separate from your order emails and payment reminders, which you always receive. You can turn this off here or from any of these emails." },
    on: { ja: "カートのお知らせ：オンにしました。", en: "Cart reminders are on." },
    off: { ja: "カートのお知らせ：オフにしました。", en: "Cart reminders are off." },
    stateOn: { ja: "オン", en: "On" },
    stateOff: { ja: "オフ", en: "Off" },
    saving: { ja: "保存しています…", en: "Saving…" },
    failed: { ja: "設定を保存できませんでした。もう一度お試しください。", en: "We couldn't save that. Please try again." },
    unsubscribed: { ja: "カートのお知らせを停止しました。", en: "Cart reminders are stopped." },
    unsubscribedNote: { ja: "ご注文に関するメールやお支払いのご案内は、引き続きお届けします。", en: "Your order emails and payment reminders are not affected." },
  },
  profile: {
    h1: { ja: "お客様情報のご登録", en: "Complete your profile" },
    lede: { ja: "アカウントを作成するため、お客様情報をご入力ください。ご注文やお問い合わせの際に、ご本人様の確認に使用いたします。", en: "Tell us who you are so we can set up your account. We use these details to recognise you when you order or message us." },
    requiredNote: { ja: "* は必須項目です。", en: "* Required." },
    email: { ja: "メールアドレス", en: "Email" },
    emailNote: { ja: "サインインに使用されたメールアドレスです。", en: "The email you signed in with." },
    fullName: { ja: "お名前（フルネーム）", en: "Full name" },
    location: { ja: "お住まいの地域", en: "Location" },
    locJapan: { ja: "日本", en: "Japan" },
    locPhilippines: { ja: "フィリピン", en: "Philippines" },
    locInternational: { ja: "その他の国・地域", en: "International" },
    country: { ja: "国", en: "Country" },
    countryPlaceholder: { ja: "国をお選びください", en: "Select your country" },
    countryHint: { ja: "配送とお支払いのご案内のため、国をお選びください。", en: "Please select your country for delivery and payment coordination." },
    facebookName: { ja: "Facebookのお名前", en: "Facebook name" },
    messengerLink: { ja: "Messengerのリンク", en: "Messenger link" },
    mobile: { ja: "携帯電話番号", en: "Mobile number" },
    optional: { ja: "（任意）", en: "(optional)" },
    submit: { ja: "登録して続ける", en: "Save and continue" },
    submitting: { ja: "登録中…", en: "Saving…" },
    errFullName: { ja: "お名前をご入力ください。", en: "Please enter your full name." },
    errCountry: { ja: "国をお選びください。", en: "Please select your country." },
    errSignedOut: { ja: "セッションの有効期限が切れました。お手数ですが、もう一度サインインしてください。", en: "Your session has ended. Please sign in again." },
    errFailed: { ja: "お客様情報を登録できませんでした。恐れ入りますが、もう一度お試しください。", en: "We could not save your details. Please try again." },
    ref: { ja: "参照番号: {id}", en: "Ref: {id}" },
    // The owner's English wording, verbatim (2026-09-23). Shown when her
    // details match a customer we already hold; nothing was created.
    registeredH: { ja: "ご登録済みです", en: "Already registered" },
    registeredP: { ja: "お客様はすでにご登録いただいております。アカウント情報につきましては、Cha Jewelsまでお問い合わせください。", en: "You are already registered. Please contact Cha Jewels for your account details." },
    registeredSignedOut: { ja: "セキュリティのため、サインアウトいたしました。", en: "For your security, you have been signed out." },
    contactCta: { ja: "Cha Jewelsにお問い合わせ", en: "Contact Cha Jewels" },
  },
  /**
   * Product reviews (PR-R2). The review page is reached only from a personal
   * link staff send on Messenger after a completed order, so its copy speaks to
   * someone who has already bought. No layaway wording anywhere here: the
   * review sections show on the Japanese site too.
   */
  reviews: {
    eyebrow: { ja: "カスタマーレビュー", en: "Customer reviews" },
    h: { ja: "お客様の声", en: "What our customers say" },
    p: { ja: "実際にご購入いただいたお客様からいただいたレビューです。内容を確認のうえ掲載しています。", en: "Reviews from customers who bought from us, checked by our team before they appear." },
    pdpH: { ja: "この商品のレビュー", en: "Reviews of this piece" },
    summary: { ja: "{avg}（{n}件のレビュー）", en: "{avg} ({n} reviews)" },
    summaryOne: { ja: "{avg}（1件のレビュー）", en: "{avg} (1 review)" },
    stars: { ja: "5段階中{n}", en: "{n} out of 5 stars" },
    verified: { ja: "ご購入者", en: "Verified buyer" },
    photoAlt: { ja: "{name}様のお写真 {n}", en: "Photo {n} from {name}" },
    // The review page (/review/[token]).
    pageEyebrow: { ja: "レビューのお願い", en: "Your review" },
    hello: { ja: "{name}様、Cha Jewelsをご利用いただきありがとうございます。", en: "Hi {name}, thank you for shopping with Cha Jewels." },
    helloNoName: { ja: "Cha Jewelsをご利用いただきありがとうございます。", en: "Thank you for shopping with Cha Jewels." },
    ask: { ja: "{piece}の使い心地はいかがですか？", en: "How do you like your {piece}?" },
    askNoPiece: { ja: "お買い上げの商品はいかがですか？", en: "How do you like your piece?" },
    lede: { ja: "率直なご感想をお聞かせください。いただいたレビューは確認後、お名前（名と姓のイニシャル）とともにサイトに掲載されます。", en: "Tell us honestly what you think. We check every review before it appears on our website, with your first name and last initial only." },
    rating: { ja: "評価", en: "Your rating" },
    ratingOption: { ja: "{n}つ星", en: "{n} stars" },
    ratingOptionOne: { ja: "1つ星", en: "1 star" },
    body: { ja: "レビュー", en: "Your review" },
    bodyHint: { ja: "{min}文字以上でご記入ください。", en: "At least {min} characters." },
    count: { ja: "{n} / {max}", en: "{n} / {max}" },
    photos: { ja: "写真（任意・最大{max}枚）", en: "Photos (optional, up to {max})" },
    photosHint: { ja: "JPEG・PNG・WebP。送信前に自動で縮小されます。", en: "JPEG, PNG or WebP. They are made smaller automatically before sending." },
    addPhotos: { ja: "写真を追加", en: "Add photos" },
    removePhoto: { ja: "写真{n}を削除", en: "Remove photo {n}" },
    preparing: { ja: "写真を準備しています…", en: "Preparing photos…" },
    send: { ja: "レビューを送信", en: "Send review" },
    sending: { ja: "送信しています…", en: "Sending…" },
    thanksH: { ja: "ありがとうございました", en: "Thank you!" },
    thanksP: { ja: "レビューを受け付けました。スタッフが確認したのち、サイトに掲載いたします。", en: "We've received your review. It will appear on our website once our team has checked it." },
    browse: { ja: "コレクションを見る", en: "Browse the collection" },
    usedH: { ja: "レビューは送信済みです", en: "You've already sent your review" },
    usedP: { ja: "このリンクからのレビューはすでにお受けしております。ありがとうございました。", en: "This link has already been used to send a review. Thank you!" },
    expiredH: { ja: "リンクの有効期限が切れています", en: "This review link has expired" },
    expiredP: { ja: "お手数ですが、Messengerでご連絡ください。新しいリンクをお送りします。", en: "Please message us on Messenger and we'll send you a new one." },
    notFoundH: { ja: "リンクが見つかりません", en: "We couldn't find this review link" },
    notFoundP: { ja: "リンクをもう一度ご確認いただくか、Messengerでご連絡ください。", en: "Please check the link, or message us on Messenger." },
    unavailableH: { ja: "ただいまページを開けません", en: "We can't open this page right now" },
    unavailableP: { ja: "しばらくしてから、もう一度お試しください。", en: "Please try again in a few minutes." },
    // Errors after Send.
    errRating: { ja: "星の数をお選びください。", en: "Please choose a star rating." },
    errShort: { ja: "レビューを{min}文字以上でご記入ください。", en: "Please write at least {min} characters." },
    errLong: { ja: "レビューは{max}文字以内でご記入ください。", en: "Please keep your review under {max} characters." },
    errPhotoCount: { ja: "写真は{max}枚までです。", en: "You can add up to {max} photos." },
    errPhotoSize: { ja: "写真のサイズが大きすぎます。枚数を減らしてお試しください。", en: "The photos are too large. Please try fewer photos." },
    errPhotoType: { ja: "JPEG・PNG・WebPの写真をお選びください。", en: "Please choose JPEG, PNG or WebP photos." },
    errPhotoRead: { ja: "この写真を読み込めませんでした。別の写真をお選びください。", en: "We couldn't read this photo. Please choose another one." },
    errRate: { ja: "しばらく時間をおいてからお試しください。", en: "Too many attempts. Please try again shortly." },
    errGeneric: { ja: "送信できませんでした。時間をおいてお試しください。", en: "We couldn't send your review. Please try again later." },
  },
  meta: {
    review: { title: { ja: "レビューを書く", en: "Write a review" } },
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
    site: { title: { ja: "Cha Jewels | K18ゴールド・パール・ダイヤモンド", en: "Cha Jewels | K18 gold, pearls and diamonds" }, description: { ja: "日本で真贋確認済みのK18ゴールド、あこや真珠、ダイヤモンド。東京からの卸売、世界中へ配送。", en: "K18 gold, Akoya pearls and diamonds, authenticated in Japan. 0% layaway, wholesale from Tokyo, shipping worldwide." } },
    layaway: { title: { ja: "分割予約", en: "Layaway" } },
    blog: { title: { ja: "ブログ", en: "Blog" }, description: { ja: "K18ゴールド、パール、ジュエリーのお手入れについて、Cha Jewelsからの記事とお知らせ。", en: "Articles and news from Cha Jewels: K18 gold, pearls and how to care for your jewelry." } },
    account: { title: { ja: "アカウント", en: "Account" } },
    orders: { title: { ja: "ご注文履歴", en: "Your orders" } },
    addresses: { title: { ja: "お届け先住所", en: "Your addresses" } },
    order: { title: { ja: "ご注文詳細", en: "Order" } },
    serviceRequests: { title: { ja: "サービス依頼", en: "Service requests" } },
    loyalty: { title: { ja: "会員プログラム", en: "Loyalty" }, description: { ja: "お買い物ごとにポイントが貯まります。最初のレベルGlimmerで1%、上のレベルでは倍率がかかります。1ポイント＝¥1として次回のお買い物にご利用いただけます。", en: "Earn points on every purchase: 1% at Glimmer, multiplied at the higher levels. One point is worth ¥1 on your next piece." } },
    join: { title: { ja: "入会", en: "Join" } },
    goldGuide: { title: { ja: "ゴールドの基礎知識", en: "Gold guide" }, description: { ja: "K18の意味、刻印の読み方、ゴールドとパールのお手入れ方法。", en: "What K18 means, how to read a hallmark, and how to care for gold and pearls." } },
    checkout: { title: { ja: "ご注文手続き", en: "Checkout" } },
    complete: { title: { ja: "ご注文ありがとうございます", en: "Thank you" } },
    wholesale: { title: { ja: "卸売", en: "Wholesale" }, description: { ja: "日本とフィリピンのライブ販売者、ブティック、ファミリー経営の宝飾店に、K18ゴールドを卸価格で。", en: "K18 gold at trade prices for live sellers, boutiques and family jewelry businesses in Japan and the Philippines." } },
    cart: { title: { ja: "カート", en: "Cart" } },
    login: { title: { ja: "サインイン", en: "Sign in" } },
    completeProfile: { title: { ja: "お客様情報のご登録", en: "Complete your profile" } },
    registered: { title: { ja: "ご登録済みです", en: "Already registered" } },
    about: { title: { ja: "私たちについて", en: "About Us" }, description: { ja: "チャジュエルズは2021年、フィリピン人コミュニティ向けのライブ販売から始まり、現在は東京・葛飾区立石を拠点とする会社です。", en: "Cha Jewels began in 2021 as live selling for the Filipino community and is now a company based in Tateishi, Katsushika-ku, Tokyo." } },
    why: { title: { ja: "Cha Jewelsが選ばれる理由", en: "Why Cha Jewels" }, description: { ja: "心を込めて選んだジュエリー、明確な情報、お一人おひとりへの丁寧な対応。東京を拠点とするCha Jewelsが選ばれる理由。", en: "Thoughtfully chosen jewelry, clear details and personal care — why customers choose Tokyo-based Cha Jewels." } },
    contact: { title: { ja: "お問い合わせ", en: "Contact" }, description: { ja: "Cha Jewelsの所在地とご連絡先。メールおよびSNSからお問い合わせいただけます。", en: "How to reach Cha Jewels: our registered address, email and social channels." } },
    affiliations: { title: { ja: "所属団体", en: "Affiliations" }, description: { ja: "Cha Jewelsが所属している東京の経済団体。東京商工会議所および東京葛飾中央ロータリークラブ。", en: "The business organisations Cha Jewels belongs to in Tokyo: the Tokyo Chamber of Commerce and Industry and the Tokyo Katsushika Central Rotary Club." } },
    faq: { title: { ja: "よくある質問", en: "FAQ" }, description: { ja: "海外への配送、ご家族へのご購入、ライブからの予約、買取、卸売の最低数量について。", en: "Layaway, worldwide shipping, buying for family, claims from Live, buy-back and wholesale minimums." } },
    collections: { title: { ja: "コレクション", en: "Collections" } },
    terms: { title: { ja: "利用規約", en: "Terms of Service" }, description: { ja: "ご注文と契約の成立、価格と通貨、お支払い、配送、返品、サービス、ポイント、責任、準拠法。", en: "Orders and contract formation, prices and currency, payment, layaway, shipping, returns, services, loyalty points, liability and governing law." } },
    privacy: { title: { ja: "プライバシーポリシー", en: "Privacy policy" }, description: { ja: "Cha Jewelsが収集する情報、その目的、第三者への提供、開示・削除のご請求方法。", en: "What Cha Jewels collects, why, who else sees it, and how to ask for a copy or a deletion." } },
    tokusho: { title: { ja: "特定商取引法に基づく表記", en: "Legal notice (Specified Commercial Transactions Act)" } },
    returns: { title: { ja: "返品・キャンセル・返金ポリシー", en: "Return, Cancellation and Refund Policy" }, description: { ja: "返品をお受けする場合と条件、キャンセル料、ストアクレジットの有効期限、返品のお申し出の手続。", en: "When we accept a return and on what terms, cancellation charges, layaway down payments, how long store credit lasts, and how to make a request." } },
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

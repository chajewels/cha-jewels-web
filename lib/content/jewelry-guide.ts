import type { Lang } from "@/lib/i18n";

/**
 * THE JEWELRY GUIDE (/jewelry-guide; owner decisions 2026-10-27). Page copy,
 * EN + JA, in the order the page shows it. The section order follows the
 * structure of a jewelry-guide page the owner pointed to; every word here is
 * written for Cha Jewels and every illustration is original
 * (components/editorial/jewelry-guide-art.tsx).
 *
 * The Gold Guide (/gold-guide, now a permanent redirect to #metals) is merged
 * in: its "What K18 means" and "How to read the stamp" steps are `metalSteps`
 * below and its care step is `careStep` — copy unchanged, so its plates and
 * illustrations (components/editorial/guide-plate.tsx) come with it.
 *
 * Terminology (CLAUDE.md): gold by purity only, no origin claim anywhere on
 * this page, nothing layaway-related. Guarded by check:terms / check:i18n.
 */
type L = Record<Lang, string>;

export const guideIntro = {
  eyebrow: { ja: "ガイド", en: "Guide" },
  h1: { ja: "ジュエリーガイド", en: "Jewelry guide" },
  lede: {
    ja: "リングサイズ、チェーンの長さ、留め具、地金、ダイヤモンド、お手入れ。ご予約の前に確かめておきたいことを、ひとつにまとめました。",
    en: "Ring sizes, chain lengths, clasps, metals, diamonds and care. The things worth checking before you reserve, in one place.",
  },
  contents: { ja: "このページの内容", en: "On this page" },
  askTitle: { ja: "迷ったら、スタッフにお尋ねください。", en: "Not sure? Ask a person." },
  askBody: {
    ja: "サイズや長さ、刻印について、お写真や採寸のご相談も承ります。",
    en: "Send us a photo or a measurement and we will help you check the size, the length or the stamp.",
  },
} satisfies Record<string, L>;

/** The seven sections, in page order. `id` is the anchor (/jewelry-guide#metals). */
export const GUIDE_SECTIONS = [
  { id: "ring-size", title: { ja: "リングサイズ", en: "Ring size" } },
  { id: "necklace-length", title: { ja: "ネックレスの長さ", en: "Necklace length" } },
  { id: "size-notes", title: { ja: "アイテム別のサイズ", en: "Size notes" } },
  { id: "clasps", title: { ja: "留め具", en: "Clasps" } },
  { id: "metals", title: { ja: "地金と刻印", en: "Metals and stamps" } },
  { id: "diamond-4c", title: { ja: "ダイヤモンドの4C", en: "Diamond 4C" } },
  { id: "care", title: { ja: "お手入れ", en: "Care" } },
] as const satisfies readonly { id: string; title: L }[];
export type GuideSectionId = (typeof GUIDE_SECTIONS)[number]["id"];

// ------------------------------------------------------------------ 1. RING SIZE

/**
 * JAPANESE RING SIZES, JCS SCALE (1号–28号), inner diameter and inner
 * circumference in mm. SOURCE: シーフォース株式会社, "指輪サイズと板の直径"
 * (https://www.seaforce.co.jp/howto/ring/, read 2026-10-27), which states its
 * table follows "the JCS standard widely used in the Japanese jewelry
 * industry" — not JIS S 4700, which numbers sizes by circumference (41号…).
 * Owner decision 2026-10-27: show the JCS scale. Checked row by row against
 * MAVERICK STORE's and Jewelry Craft's tables (all agree but Jewelry Craft's
 * 16号 = 56.6, which π × 18.0 = 56.55 → 56.5 settles) and against the source's
 * own rule: diameter rises 1/3 mm a size from 13.0, circumference = π × the
 * unrounded diameter, rounded to 0.1 mm. Copied, never computed at runtime.
 */
export const RING_SIZES: readonly (readonly [size: number, diameterMm: string, circumferenceMm: string])[] = [
  [1, "13.0", "40.8"], [2, "13.33", "41.9"], [3, "13.66", "42.9"], [4, "14.0", "44.0"],
  [5, "14.33", "45.0"], [6, "14.66", "46.1"], [7, "15.0", "47.1"], [8, "15.33", "48.2"],
  [9, "15.66", "49.2"], [10, "16.0", "50.3"], [11, "16.33", "51.3"], [12, "16.66", "52.4"],
  [13, "17.0", "53.4"], [14, "17.33", "54.5"], [15, "17.66", "55.5"], [16, "18.0", "56.5"],
  [17, "18.33", "57.6"], [18, "18.66", "58.6"], [19, "19.0", "59.7"], [20, "19.33", "60.7"],
  [21, "19.66", "61.8"], [22, "20.0", "62.8"], [23, "20.33", "63.9"], [24, "20.66", "64.9"],
  [25, "21.0", "66.0"], [26, "21.33", "67.0"], [27, "21.66", "68.1"], [28, "22.0", "69.1"],
];

export const ringSize = {
  intro: {
    ja: "日本のリングサイズは「号」で表し、1号から28号ほどまであります。1号上がるごとに、内径は約0.33mm、内周は約1mm大きくなります。",
    en: "Japanese jewelers size rings in 号 (gō), from 1 up to about 28. Each size adds about a third of a millimetre to the inside diameter, and about 1 mm to the inside circumference.",
  },
  guideOnly: {
    ja: "サイズ表はあくまで目安です。リングの幅や形、測る時間帯によっても着け心地は変わります。2つのサイズで迷われたら、ご予約の前にお気軽にご相談ください。",
    en: "This table is a guide only. The width and shape of a band, and the time of day you measure, all change how a ring fits. If you are between two sizes, message us before you reserve.",
  },
  scale: {
    ja: "表は日本の多くのジュエリー店が使うJCS規格の号数です。単位はmmです。",
    en: "Sizes follow the JCS scale most Japanese jewelers use. Figures in millimetres.",
  },
  caption: { ja: "リングサイズ表（JCS規格）", en: "Ring sizes (JCS scale)" },
  colSize: { ja: "号数", en: "Size (号)" },
  colDiameter: { ja: "内径", en: "Inside diameter" },
  colCircumference: { ja: "内周", en: "Inside circumference" },
  unit: { ja: "mm", en: "mm" },
  measureH: { ja: "測り方", en: "How to measure" },
  measure: [
    {
      h: { ja: "紙やひもで測る", en: "With a strip of paper or thread" },
      body: {
        ja: "細く切った紙かひもを指の付け根に巻きます。きつすぎず、ゆるすぎない位置で重なる所に印を付け、平らにして長さをmmで測ります。これが内周です。表のいちばん近い数字をご覧ください。関節を通るかも確かめてください。",
        en: "Wrap a thin strip of paper or a piece of thread around the base of the finger, snug but not tight. Mark where it overlaps, lay it flat and measure the length in millimetres. That is the inside circumference: find the closest figure in the table. Check it would still pass over the knuckle.",
      },
    },
    {
      h: { ja: "合っている指輪で測る", en: "With a ring that already fits" },
      body: {
        ja: "同じ指に合っている指輪を定規の上に置き、内側の端から端までをまっすぐ測ります。これが内径です。表のいちばん近い数字をご覧ください。",
        en: "Lay a ring that fits the same finger on a ruler and measure straight across the inside, edge to edge. That is the inside diameter: find the closest figure in the table.",
      },
    },
  ],
  tipsH: { ja: "決める前に", en: "Before you decide" },
  tips: [
    { ja: "指がいちばん太くなる、一日の終わりに測ってください。", en: "Measure at the end of the day, when fingers are at their largest." },
    { ja: "指は暑いとむくみ、寒いと細くなります。入浴直後や冷え込んだ朝は避けましょう。", en: "Fingers swell in the heat and shrink in the cold. Avoid measuring straight after a bath or on a cold morning." },
    { ja: "2〜3回測り、いちばん多く出た数字を選んでください。", en: "Measure two or three times and go with the figure that comes up most." },
  ],
  /**
   * The on-screen ring sizer (components/editorial/ring-sizer.tsx). It reads
   * RING_SIZES only. `valueText` is the slider's aria-valuetext; {n} and {d}
   * are replaced with the size and its inside diameter. The ring is an
   * owner-approved AI image (2026-10-27), captioned as an illustration.
   */
  sizer: {
    h: { ja: "画面で確かめる", en: "Check it on screen" },
    instruction: {
      ja: "合っている指輪を、画面の金色のリングの上に平らに置きます。スライダーを動かし、金色のリングの内側の縁が、お手持ちの指輪の内側とぴったり重なる号数を探してください。",
      en: "Lay a ring that fits flat on the screen, over the gold ring. Move the slider until the gold ring's inside edge lines up with the inside of yours.",
    },
    screens: {
      ja: "画面によって表示される大きさは異なります。先に下の「画面の調整」を行ってください。結果はあくまで目安です。",
      en: "Every screen shows sizes a little differently, so calibrate yours first (below). The result is a guide only.",
    },
    slider: { ja: "リングサイズ（号）", en: "Ring size (号)" },
    valueText: { ja: "{n}号, 内径 {d} mm", en: "Size {n}, inside diameter {d} mm" },
    size: { ja: "号数", en: "Size" },
    sizeUnit: { ja: "号", en: "号" },
    diameter: { ja: "内径", en: "Inside diameter" },
    circumference: { ja: "内周", en: "Inside circumference" },
    smaller: { ja: "1号小さく", en: "One size smaller" },
    larger: { ja: "1号大きく", en: "One size larger" },
    calibrateH: { ja: "画面の調整", en: "Calibrate your screen" },
    calibrateLede: {
      ja: "どちらかの方法で、画面上の長さを実物に合わせます。",
      en: "Match lengths on screen to real life, by either method.",
    },
    ruler: { ja: "定規で", en: "With a ruler" },
    card: { ja: "カードで", en: "With a card" },
    rulerHow: {
      ja: "定規を画面に当て、画面の目盛りが定規のmmと重なるまで「縮小」「拡大」で調整してください。",
      en: "Hold a ruler against the screen and use Shrink and Enlarge until the marks on screen match its millimetres.",
    },
    cardHow: {
      ja: "ICカードやポイントカードなど、標準サイズのカード（85.60 × 53.98 mm）を画面に当て、枠がカードとぴったり同じ大きさになるまで調整してください。",
      en: "Hold any standard-size card (85.60 × 53.98 mm), such as an IC or point card, against the screen and adjust until the outline is exactly the size of the card.",
    },
    shrink: { ja: "縮小", en: "Shrink" },
    enlarge: { ja: "拡大", en: "Enlarge" },
    reset: { ja: "元に戻す", en: "Reset" },
    scale: { ja: "表示の倍率", en: "Display scale" },
    alt: {
      ja: "イメージ図：真上から見た、磨き仕上げのK18イエローゴールドのリング。内側の縁が、選んだ号数の内径と同じ大きさで表示されます。",
      en: "Illustration: a polished K18 yellow gold band seen from above. Its inside edge is shown at the inside diameter of the chosen size.",
    },
    notCalibrated: { ja: "未調整", en: "not yet calibrated" },
    calibratedAt: { ja: "倍率 {p}%", en: "{p}%" },
    saved: {
      ja: "調整した倍率は、このブラウザに保存されます（ブラウザの設定によっては保存されません）。",
      en: "Your setting is saved in this browser, if it allows it.",
    },
  },
} as const;

// ------------------------------------------------------------ 2. NECKLACE LENGTH

/**
 * TYPICAL NECKLACE LENGTHS. There is no standard: retailers draw the lines
 * differently. Ranges rounded to cm from Blue Nile's necklace length chart
 * (https://www.bluenile.com/blog/fashion/necklace-length-chart, read
 * 2026-10-27: choker 14–16", princess 18", matinee 20–24", opera 24–30",
 * rope 30"+) and the ranges other retailer charts give (princess 17–19",
 * opera up to 34", rope from 35"); owner decision 2026-10-27: show typical
 * ranges, say they vary.
 */
export const necklaceLength = {
  intro: {
    ja: "同じチェーンでも、着ける人によって下がる位置は変わります。長さごとの呼び名と、おおよその位置をまとめました。",
    en: "The same chain sits differently on every neck. These are the usual names for each length, and roughly where each one falls.",
  },
  note: {
    ja: "一般的な目安です。区切りはお店によって少しずつ異なり、身長や体型によっても位置は変わります。",
    en: "Typical ranges. Jewelers draw the lines a little differently, and your height and build change where a chain sits.",
  },
  tip: {
    ja: "迷ったら、お手持ちのネックレスを平らに置き、留め具を含めて端から端まで測って比べてみてください。",
    en: "Not sure? Lay a necklace you already own flat, measure it end to end with the clasp, and compare.",
  },
  caption: { ja: "ネックレスの長さの目安", en: "Typical necklace lengths" },
  /**
   * The length slider (components/editorial/necklace-sizer.tsx); {name} and
   * {cm} come from `lengths`; `shorter` / `longer` label the step buttons.
   * Its five pictures are owner-approved AI images (2026-10-27, replacing an
   * earlier strapless set that cut off the long lengths): one woman in a
   * cream silk blouse, chin to waist, identical framing, one chain length
   * each (public/images/jewelry-guide/neckline-<key>.webp).
   */
  sizer: {
    slider: { ja: "ネックレスの長さ", en: "Necklace length" },
    valueText: { ja: "{name}, {cm}", en: "{name}, {cm}" },
    alt: {
      ja: "イメージ図：{name}（{cm}）の長さの細いゴールドチェーンを、クリーム色のブラウスの上に着けた姿。",
      en: "Illustration: a fine gold chain at {name} length ({cm}), worn over a cream blouse.",
    },
    shorter: { ja: "短く：{name}", en: "Shorter: {name}" },
    longer: { ja: "長く：{name}", en: "Longer: {name}" },
    note: {
      ja: "それぞれの長さが、体のどのあたりに来るかを示したイメージです。実寸ではありません。",
      en: "Shows roughly where each length sits on the body. Not drawn to real size.",
    },
  },
  lengths: [
    { key: "choker", name: { ja: "チョーカー", en: "Choker" }, cm: { ja: "約35〜40cm", en: "about 35–40 cm" }, where: { ja: "首の付け根に沿う長さ。", en: "Close around the base of the neck." } },
    { key: "princess", name: { ja: "プリンセス", en: "Princess" }, cm: { ja: "約43〜48cm", en: "about 43–48 cm" }, where: { ja: "鎖骨の上か、すぐ下に収まる長さ。最初の一本に選ばれることの多い長さです。", en: "On or just below the collarbone. The length most people choose first." } },
    { key: "matinee", name: { ja: "マチネ", en: "Matinee" }, cm: { ja: "約50〜60cm", en: "about 50–60 cm" }, where: { ja: "鎖骨と胸の間に下がる長さ。", en: "Between the collarbone and the bust." } },
    { key: "opera", name: { ja: "オペラ", en: "Opera" }, cm: { ja: "約70〜85cm", en: "about 70–85 cm" }, where: { ja: "胸元か、それより下に届く長さ。", en: "At the bust or below it." } },
    { key: "rope", name: { ja: "ロープ", en: "Rope" }, cm: { ja: "約90cm以上", en: "about 90 cm and over" }, where: { ja: "二重に巻いたり、結んだりして着けられる長さ。", en: "Long enough to wear doubled or knotted." } },
  ],
} as const;

// ----------------------------------------------------------------- 3. SIZE NOTES

export const sizeNotes = {
  intro: {
    ja: "アイテムごとに、ご予約の前に確かめておきたいポイントです。",
    en: "What to check for each kind of piece before you reserve.",
  },
  items: [
    {
      key: "rings", name: { ja: "リング", en: "Rings" },
      body: {
        ja: "サイズがわかるリングは、号数で表示しています。多くのリングはご購入後のサイズ直しができますが、できるかどうか、どこまで直せるかはデザインによります。ご予約の前にご相談ください。",
        en: "Where we know a ring's size, the listing shows it in 号. Many rings can be resized after purchase, but whether a piece can, and by how much, depends on its design. Ask us before you reserve.",
      },
    },
    {
      key: "necklaces", name: { ja: "ネックレス", en: "Necklaces" },
      body: {
        ja: "長さの記載があるものは、上の目安と比べてください。アジャスターや予備の輪が付いたチェーンは、少し短めにも着けられます。",
        en: "Where a length is given, compare it with the chart above. A chain with an adjuster or a spare ring can also be worn a little shorter.",
      },
    },
    {
      key: "pendants", name: { ja: "ペンダント", en: "Pendants" },
      body: {
        ja: "バチカン（チェーンを通す輪）の大きさをご確認ください。お使いになりたいチェーンが通る幅が必要です。太いチェーンは小さなバチカンを通りません。",
        en: "Check the bail, the loop the chain passes through. It has to be wide enough for the chain you plan to wear; a thick chain will not pass through a small bail.",
      },
    },
    {
      key: "bracelets", name: { ja: "ブレスレット", en: "Bracelets" },
      body: {
        ja: "紙で手首まわりをぴったり測り、少しゆとりを持たせてください。留め具のないバングルは、手のいちばん広い部分を通る必要があります。",
        en: "Measure your wrist snugly with a strip of paper, then allow a little room. A bangle has no clasp, so it must pass over the widest part of your hand.",
      },
    },
    {
      key: "anklets", name: { ja: "アンクレット", en: "Anklets" },
      body: {
        ja: "着けたい位置で足首まわりを測り、少しゆとりを持たせてください。",
        en: "Measure around the ankle where it will sit, and allow a little room.",
      },
    },
    {
      key: "earrings", name: { ja: "ピアス・イヤリング", en: "Earrings" },
      body: {
        ja: "ピアスは耳の穴に通して着けるもの、イヤリングは挟んで留めるもので、穴は要りません。ご予約の前に、どちらかをご確認ください。",
        en: "Pierced earrings go through the ear; clip-on earrings hold by gentle pressure and need no piercing. In Japanese listings, ピアス means pierced and イヤリング means clip-on. Check which one a piece is before you reserve.",
      },
    },
  ],
} as const;

// --------------------------------------------------------------------- 4. CLASPS

/**
 * Each clasp's picture: the owner's own photographs (2026-10-27), 800 × 800
 * WebP on white in public/images/jewelry-guide/ — real photos, so no
 * illustration caption. The alt text says what the clasp is
 * and how it looks; it names no maker and claims no origin.
 */
export const clasps = {
  intro: {
    ja: "留め具の多くは、指先ひとつで開け閉めできます。よく見かける5つの留め具と、その扱い方です。",
    en: "Most clasps open with a fingertip. Here are the five you will meet most often, and how each one works.",
  },
  items: [
    {
      key: "spring", name: { ja: "引き輪", en: "Spring ring" },
      img: { src: "/images/jewelry-guide/clasp-spring-ring.webp", alt: { ja: "引き輪：丸い輪の横に、輪を開けるための小さなつまみが付いています。", en: "Spring ring clasp: a round ring with a small lever on its side that opens it." } },
      how: {
        ja: "小さな丸い輪に、つまみが付いた留め具です。つまみを爪で引いて輪を開き、もう一方の輪を掛けて指を離すと、自然に閉じます。",
        en: "A small round ring with a tiny lever. Pull the lever back with a fingernail, slip the end ring in and let go: the ring closes by itself.",
      },
    },
    {
      key: "lobster", name: { ja: "カニカン", en: "Lobster clasp" },
      img: { src: "/images/jewelry-guide/clasp-lobster.webp", alt: { ja: "カニカン：細長いはさみ形の本体に、押して開けるレバーと小さな丸カンが付いています。", en: "Lobster clasp: a long claw-shaped body with a lever that opens the gate, and a small jump ring." } },
      how: {
        ja: "カニのはさみのような形の留め具です。レバーを押して開け、輪に掛けてから離します。引き輪よりつまみやすいのが特長です。",
        en: "Shaped like a claw. Press the lever to open the gate, hook it onto the end ring, then release. Easier to hold than a spring ring.",
      },
    },
    {
      key: "box", name: { ja: "差し込み式（ボックスクラスプ）", en: "Box clasp" },
      img: { src: "/images/jewelry-guide/clasp-box-safety-catch.webp", alt: { ja: "差し込み式（ボックスクラスプ）：平たい差し込み部分が箱形の本体に収まり、横にワイヤーの安全金具が掛かっています。", en: "Box clasp: a flat tongue sits inside a box-shaped case, with a wire safety catch hooked over the side." } },
      how: {
        ja: "平たい差し込み部分を箱に入れ、カチッと音がするまで押し込みます。外すときは、差し込み部分を押さえながら引き抜きます。横に安全金具が付いているものは、それも閉じてください。",
        en: "A flat tongue slides into a small box until it clicks. To open, press the tongue down and pull it out. If there is a safety catch on the side, close that too.",
      },
    },
    {
      key: "magnetic", name: { ja: "マグネット", en: "Magnetic clasp" },
      img: { src: "/images/jewelry-guide/clasp-magnetic-capsule.webp", alt: { ja: "マグネット：カプセル形の留め具。上は二つに分けた状態、下は留めた状態です。", en: "Magnetic clasp: a capsule-shaped clasp, shown apart (top) and closed (bottom)." } },
      how: {
        ja: "磁石で留める留め具です。近づけると自然にくっつきます。外すときは、まっすぐ引かずに横へずらしてください。",
        en: "The two ends hold together by magnet. Bring them close and they find each other. To open, slide them apart sideways rather than pulling straight.",
      },
    },
    {
      key: "hook", name: { ja: "フック", en: "Hook clasp" },
      img: { src: "/images/jewelry-guide/clasp-s-hook.webp", alt: { ja: "フック：両端が丸く仕上げられた、S字形のフックです。", en: "Hook clasp: an S-shaped hook with rounded ends." } },
      how: {
        ja: "S字やJ字のフックを、輪に掛けるだけの留め具です。フックを曲げずに、角度を変えて掛け外ししてください。",
        en: "An S- or J-shaped hook that passes through a ring. Hook and unhook it by changing the angle, never by bending the hook.",
      },
    },
  ],
} as const;

// --------------------------------------------------------------------- 5. METALS

/** The two Gold Guide steps merged here (copy unchanged from lib/content/gold-guide.ts) and the care step (section 7). */
export type GuideStep = { h: L; body: L; facts: { k: L; v: L }[] };

export const metalSteps: GuideStep[] = [
  {
    h: { ja: "K18とは", en: "What K18 means" },
    body: {
      ja: "K18は金の含有率75%を表します。残りの25%は銀や銅などの合金で、硬さと色を決める部分です。K24（純金）は柔らかすぎて日常使いのジュエリーには向きません。K18は日本のファインジュエリーの標準です。ヨーロッパでは同じ規格を「750」または「Au750」、英語圏では「18K」と表記します。K18・750・18K・Au750はすべて同じ75%の純度を指します。刻印はそのまま表示します。",
      en: "K18 is 75% gold. The remaining 25% is alloy — usually silver and copper — and it is what sets the hardness and the colour. K24 is pure gold and too soft for jewelry you actually wear. K18 is the fine-jewelry standard in Japan. In Europe the same standard is marked 750 or Au750, and in English-speaking markets 18K: K18, 750, 18K and Au750 all denote the same 75% purity. We show the stamp as it appears on the piece.",
    },
    facts: [
      { k: { ja: "金の含有率", en: "Gold content" }, v: { ja: "75%", en: "75%" } },
      { k: { ja: "同等の刻印", en: "Same standard" }, v: { ja: "750 / 18K / Au750", en: "750 / 18K / Au750" } },
      { k: { ja: "日常使い", en: "Daily wear" }, v: { ja: "適する", en: "Suitable" } },
    ],
  },
  {
    h: { ja: "刻印の読み方", en: "How to read the stamp" },
    body: {
      ja: "ゴールドにはK18または750の刻印と、製造元のマークが入ります。プラチナはPT900またはPT950です。刻印は目立たない場所にあります。ネックレスは留め具の平たい部分、リングは内側、ピアスはポスト（軸）をご覧ください。",
      en: "Gold carries a K18 or 750 stamp plus a maker's mark. Platinum is marked PT900 or PT950. The stamp sits somewhere discreet: look at the flat tab on a necklace clasp, the inside of a ring band, or the post of an earring.",
    },
    facts: [
      { k: { ja: "ゴールド", en: "Gold" }, v: { ja: "K18 / 750", en: "K18 / 750" } },
      { k: { ja: "プラチナ", en: "Platinum" }, v: { ja: "PT900 / PT950", en: "PT900 / PT950" } },
      { k: { ja: "探す場所", en: "Where to look" }, v: { ja: "留め具・リング内側・ピアスのポスト", en: "Clasp tab, ring inside, earring post" } },
    ],
  },
];

/**
 * EVERY STAMP THE CATALOGUE SHOWS (lib/metals.ts METALS, same order), with
 * what it means. Gold is given as its karat (parts of 24); platinum and silver
 * as thousandths, which is what the number in the stamp is. PM / PM900: an
 * older platinum mark whose purity the stamp alone does not establish —
 * stated as such, nothing claimed beyond it.
 */
export const metals = {
  intro: {
    ja: "掲載している品の刻印は、打たれているとおりに表示しています。それぞれの意味をまとめました。",
    en: "Every listing shows the stamp exactly as it is struck. Here is what each one means.",
  },
  tableH: { ja: "刻印の一覧", en: "Every stamp we list" },
  colStamp: { ja: "刻印", en: "Stamp" },
  colMeaning: { ja: "意味", en: "What it means" },
  rows: [
    { stamp: "K24", metal: { ja: "金", en: "Gold" }, means: { ja: "純金（24分の24）。日常使いのジュエリーには柔らかすぎます。", en: "Pure gold, 24 parts in 24. Too soft for everyday jewelry." } },
    { stamp: "K18", metal: { ja: "金", en: "Gold" }, means: { ja: "金75%（24分の18）。日本のファインジュエリーの標準です。", en: "75% gold, 18 parts in 24. The fine-jewelry standard in Japan." } },
    { stamp: "750", metal: { ja: "金", en: "Gold" }, means: { ja: "金75%。K18と同じ純度を、1000分率で表したものです。", en: "75% gold. The same purity as K18, written in thousandths." } },
    { stamp: "18K", metal: { ja: "金", en: "Gold" }, means: { ja: "金75%。K18と同じ純度の、英語圏での表記です。", en: "75% gold. The same purity as K18, as English-speaking markets write it." } },
    { stamp: "K14", metal: { ja: "金", en: "Gold" }, means: { ja: "金約58%（24分の14）。K18より割金が多く、硬めです。", en: "About 58% gold, 14 parts in 24. More alloy than K18, so harder." } },
    { stamp: "K10", metal: { ja: "金", en: "Gold" }, means: { ja: "金約42%（24分の10）。", en: "About 42% gold, 10 parts in 24." } },
    { stamp: "PT1000", metal: { ja: "プラチナ", en: "Platinum" }, means: { ja: "純プラチナ（1000分の1000）。", en: "Pure platinum, 1000 parts in 1000." } },
    { stamp: "PT950", metal: { ja: "プラチナ", en: "Platinum" }, means: { ja: "プラチナ95%（1000分の950）。", en: "95% platinum, 950 parts in 1000." } },
    { stamp: "PT900", metal: { ja: "プラチナ", en: "Platinum" }, means: { ja: "プラチナ90%（1000分の900）。日本のプラチナジュエリーで、いちばん多い純度です。", en: "90% platinum, 900 parts in 1000. The most common platinum for jewelry in Japan." } },
    { stamp: "PT850", metal: { ja: "プラチナ", en: "Platinum" }, means: { ja: "プラチナ85%（1000分の850）。", en: "85% platinum, 850 parts in 1000." } },
    { stamp: "PM", metal: { ja: "プラチナ", en: "Platinum" }, means: { ja: "古いプラチナの刻印で、昔のジュエリーに見られます。数字がないことが多く、刻印だけでは純度はわかりません。", en: "An older way of marking platinum, seen on vintage pieces. It often carries no number, so the stamp alone does not tell you the purity." } },
    { stamp: "PM900", metal: { ja: "プラチナ", en: "Platinum" }, means: { ja: "数字の入った、古いプラチナの刻印です。気になる品があれば、お気軽にお問い合わせください。", en: "The older platinum mark, with a number added. If you would like to know more about a particular piece, ask us." } },
    { stamp: "SILVER925", metal: { ja: "シルバー", en: "Silver" }, means: { ja: "銀92.5%（1000分の925）。スターリングシルバーです。", en: "92.5% silver, 925 parts in 1000: sterling silver." } },
  ],
  note: {
    ja: "刻印は、作り手が打った表示です。プレラブドとブランド品は、掲載の前に日本で刻印を確認しています。",
    en: "A stamp records what the maker marked. Our preloved and branded pieces are hallmark checked in Japan before we list them.",
  },
};

/**
 * The stamp step's illustrations (owner-supplied AI images, 2026-09-24),
 * moved here from lib/content/gold-guide.ts unchanged. Server-only copy, kept
 * out of lib/i18n.ts so it never ships in the client bundle. Described as
 * illustrations of a stamped clasp — never as a Cha Jewels piece or a
 * certified item, and naming no assay office. The short "Illustration"
 * caption itself is in lib/i18n.ts (gold.illustration).
 */
export const stampIllustrations = {
  k18Alt: {
    ja: "イメージ図：K18イエローゴールドのチェーンの留め具。留め具のプレートにK18の刻印とホールマークが打たれています。",
    en: "Illustration of a K18 yellow gold chain clasp, with a K18 stamp and a hallmark struck into the clasp plate.",
  },
  pt900Alt: {
    ja: "イメージ図：同じ形のプラチナの留め具。Pt900の刻印が打たれています。",
    en: "Illustration of the same style of clasp in platinum, stamped Pt900.",
  },
  pt900Compare: {
    ja: "プラチナは同じ方式で「Pt900」などと刻印されます。",
    en: "Platinum is marked the same way, e.g. “Pt900”.",
  },
} satisfies Record<string, L>;

// ----------------------------------------------------------------- 6. DIAMOND 4C

/**
 * THE 4C, as GIA defines the scales (4cs.gia.edu, read 2026-10-27): colour
 * D (colourless) to Z (light yellow or brown); clarity FL to I3 in 11 grades;
 * cut graded Excellent to Poor for standard round brilliants; 1 carat = 0.2 g.
 */
export const diamond4c = {
  intro: {
    ja: "ダイヤモンドは、頭文字がCの4つの基準で評価されます。鑑定書にも使われるこの基準を、わかりやすくまとめました。",
    en: "Diamonds are described by four qualities that all start with C. Grading reports use them; here they are in plain words.",
  },
  items: [
    {
      key: "cut", term: "Cut", name: { ja: "カット", en: "Cut" },
      body: {
        ja: "形と研磨の出来ばえで、光をどれだけ返すかが決まります。ラウンドブリリアントは、ExcellentからPoorまでで評価されます。ダイヤモンドの輝きを決めるのが、カットです。",
        en: "How well the stone is shaped and polished, which decides how much light it sends back. Round brilliants are graded from Excellent to Poor. The cut is what makes a diamond sparkle.",
      },
    },
    {
      key: "carat", term: "Carat", name: { ja: "カラット", en: "Carat" },
      body: {
        ja: "大きさではなく、重さの単位です。1カラットは0.2gです。同じカラットでも、カットによって見た目の大きさは変わります。",
        en: "Weight, not size: one carat is 0.2 g. Two stones of the same carat can look different in size, depending on how they are cut.",
      },
    },
    {
      key: "clarity", term: "Clarity", name: { ja: "クラリティ", en: "Clarity" },
      body: {
        ja: "内包物（内部の小さな印）や、表面の傷の少なさです。10倍に拡大しても内包物が見えないFL（フローレス）から、IF、VVS、VS、SIを経て、肉眼でも見えることの多いIまであります。",
        en: "How free the stone is of tiny marks inside it (inclusions) and on its surface. The scale runs from FL, flawless under 10× magnification, through IF, VVS, VS and SI, to I, where marks are often visible to the eye.",
      },
    },
    {
      key: "color", term: "Colour", name: { ja: "カラー", en: "Colour" },
      body: {
        ja: "無色にどれだけ近いかです。D（無色）からZ（薄い黄色や褐色）まであり、隣り合うグレードの差は、肉眼ではほとんどわかりません。",
        en: "How close the stone is to colourless, from D (colourless) to Z (light yellow or brown). The difference between neighbouring grades is very hard to see with the eye alone.",
      },
    },
  ],
  note: {
    ja: "鑑定書の付いた品については、お問い合わせいただければ内容をお伝えします。",
    en: "If a piece comes with a grading report, ask us and we will tell you what it says.",
  },
  /**
   * The infographic (components/editorial/jewelry-guide-art.tsx Diamond4CScale).
   * The stone is an owner-approved AI image (2026-10-27), side view on white,
   * captioned as an illustration; every word around it is page text. Grade
   * names are GIA's.
   */
  image: {
    src: "/images/jewelry-guide/diamond-round-brilliant.webp",
    alt: { ja: "イメージ図：ラウンドブリリアントカットのダイヤモンドを、横から見たところ。", en: "Illustration: a round brilliant diamond, seen from the side." },
  },
  scales: {
    color: {
      from: { ja: "無色", en: "Colourless" },
      to: { ja: "薄い黄色", en: "Light yellow" },
      sr: { ja: "D（無色）からZ（薄い黄色）までの23段階。", en: "23 grades from D (colourless) to Z (light yellow)." },
    },
    clarity: {
      from: { ja: "10倍で内包物なし", en: "Flawless at 10×" },
      to: { ja: "肉眼で見えることも", en: "Often visible to the eye" },
      sr: { ja: "クラリティの11段階、良い順に", en: "The 11 clarity grades, best first" },
    },
    cut: {
      from: { ja: "最も良い", en: "Best" },
      to: { ja: "最も低い", en: "Lowest" },
      sr: { ja: "カットの5段階、良い順に", en: "The 5 cut grades, best first" },
    },
    carat: {
      unit: { ja: "1ct = 0.2g", en: "1 ct = 0.2 g" },
      note: {
        ja: "同じカットのラウンドを、重さに合わせた大きさで並べた比較です。",
        en: "Round stones of the same cut, drawn to scale with each other by weight.",
      },
      sr: { ja: "0.5・1.0・1.5・2.0カラットのラウンドの大きさの比較。", en: "Round stones of 0.5, 1.0, 1.5 and 2.0 carats, compared in size." },
    },
  },
} as const;

// ----------------------------------------------------------------------- 7. CARE

/** Merged from the Gold Guide's care step, copy unchanged. */
export const careStep: GuideStep = {
  h: { ja: "お手入れ", en: "Care" },
  body: {
    ja: "ぬるま湯と中性洗剤で洗い、柔らかい布で拭いてください。他のジュエリーと擦れないよう個別に保管します。温泉と塩素は変色の原因になるため避けてください。パールは着用後に必ず拭き、数年ごとに糸替えをおすすめします。",
    en: "Warm water, a mild soap and a soft cloth. Store pieces separately so they do not rub against each other, and keep them away from hot springs and chlorine, which discolour the metal. Pearls need wiping after every wear and restringing every few years.",
  },
  facts: [
    { k: { ja: "洗浄", en: "Cleaning" }, v: { ja: "ぬるま湯と中性洗剤", en: "Warm water, mild soap" } },
    { k: { ja: "避けるもの", en: "Avoid" }, v: { ja: "温泉・塩素", en: "Hot springs, chlorine" } },
    { k: { ja: "パール", en: "Pearls" }, v: { ja: "着用後に拭く・数年ごとに糸替え", en: "Wipe after wear, restring every few years" } },
  ],
};

/**
 * THE LUMIÈRE HOME'S COPY AND SLOTS (P2; docs/tasks/lumiere-p0-report.md §13
 * copy-fit table and §14 short category names, both APPROVED 2026-11-01).
 *
 * Every line below is one of the rows the owner approved, drawn from existing
 * site copy (`lib/i18n.ts`, `lib/content/about.ts`, `lib/content/frame.ts`)
 * and shortened only where the table marks ✂. Line breaks are the table's:
 * the engine sets a heading one line per entry, never wrapping, so the breaks
 * are stated here rather than arrived at. Italic runs are the reference's
 * typography (an italic capital opening a word) and exist in English only —
 * `runsFor` strips them for Japanese (§5.2), and `LINES` below writes none.
 *
 * Photographs, models and the featured names are Lumière's own placeholders
 * (lib/lumiere/placeholders.ts, D-16) until the Hub swap; the data shape is the
 * one a Hub payload will fill. Business text is never a placeholder.
 *
 * Changing a string here is a content change, not a design change (§13).
 */
import type { Lang } from "@/lib/i18n";
import { dict } from "@/lib/i18n";
import { CATEGORY_BLURB } from "@/lib/content/frame";
import { aboutCopy } from "@/lib/content/about";
import type { TextRun } from "@/lib/lumiere/text-runs";
import {
  COLLECTION_PHOTOS,
  FEATURED_PIECES,
  HERO_CARDS,
  PENDANT,
  PHILOSOPHY,
  type PlaceholderAsset,
  type PlaceholderPiece,
} from "@/lib/lumiere/placeholders";
import type { HomeHubSlots } from "@/lib/lumiere/home-hub";

const plain = (text: string): TextRun[] => [{ text }];
/** "Timeless" → an italic "T" and the rest roman, as the reference opens its lines. */
const cap = (text: string): TextRun[] => [{ text: text.charAt(0), italic: true }, { text: text.slice(1) }];
/** Several words, each opening on an italic capital ("explore collections" in the reference). */
const caps = (...words: string[]): TextRun[] =>
  words.flatMap((word, i) => [
    { text: word.charAt(0), italic: true },
    { text: word.slice(1) + (i < words.length - 1 ? " " : "") },
  ]);

/* ---------------------------------------------------------------- categories (§14) */

export interface LumiereCategory {
  slug: string;
  /** Pill label in the hero index (≤ 65 u). */
  pill: string;
  /** Card title in the collections block (with its full stop). */
  title: TextRun[];
  /** The card's index line: the existing eyebrow, never a number (D-24, secondhand-dealer rule). */
  index: string;
  /** The card note, `CATEGORY_BLURB`, as the two lines the table measured. */
  note: string[];
}

const EYEBROW: Record<string, keyof typeof dict.home> = {
  "fine-jewelry": "heroCallerFine",
  "preloved-jewelry": "heroPrelovedEyebrow",
  "preloved-branded-jewelry": "heroCallerBranded",
  "preloved-watches": "heroCallerWatches",
  "preloved-designer-accessories": "heroCallerAccessories",
};

export const CATEGORY_SHORT_NAME: Record<string, Record<Lang, { pill: string; title: string }>> = {
  "fine-jewelry": { en: { pill: "New", title: "New Jewelry." }, ja: { pill: "新品", title: "新品ジュエリー。" } },
  "preloved-jewelry": { en: { pill: "Preloved", title: "Preloved Jewelry." }, ja: { pill: "プレラブド", title: "プレラブド。" } },
  "preloved-branded-jewelry": { en: { pill: "Branded", title: "Branded Jewelry." }, ja: { pill: "ブランド", title: "ブランド品。" } },
  "preloved-watches": { en: { pill: "Watches", title: "Watches." }, ja: { pill: "ウォッチ", title: "ウォッチ。" } },
  "preloved-designer-accessories": { en: { pill: "Accessories", title: "Designer Accessories." }, ja: { pill: "小物", title: "デザイナー小物。" } },
};

/** The note's two lines, as §13 row 11 measured them. */
const NOTE_LINES: Record<string, Record<Lang, string[]>> = {
  "fine-jewelry": { en: ["New gold, pearl", "and diamond"], ja: ["新作のゴールド・", "パール・ダイヤモンド"] },
  "preloved-jewelry": { en: ["Unbranded gold", "and platinum"], ja: ["ノンブランドの", "ゴールド・プラチナ"] },
  "preloved-branded-jewelry": { en: ["Signature pieces", "from jewelry houses"], ja: ["ジュエリーハウスの", "シグネチャー"] },
  "preloved-watches": { en: ["Selected branded", "watches"], ja: ["厳選したブランド", "ウォッチ"] },
  "preloved-designer-accessories": { en: ["Wallets, card", "cases, belts"], ja: ["財布、カード", "ケース、ベルト"] },
};

/** The five Hub categories in the hero's and the collections' order. */
export const CATEGORY_ORDER = [
  "fine-jewelry",
  "preloved-jewelry",
  "preloved-branded-jewelry",
  "preloved-watches",
  "preloved-designer-accessories",
] as const;

export const lumiereCategories = (lang: Lang): LumiereCategory[] =>
  CATEGORY_ORDER.map((slug) => {
    const short = CATEGORY_SHORT_NAME[slug][lang];
    const noteLines = NOTE_LINES[slug][lang];
    // The two-line split is a measured break; the joined text must still be
    // CATEGORY_BLURB, so a blurb edit cannot drift from its lines unnoticed.
    const joined = noteLines.join(lang === "ja" ? "" : " ");
    const blurb = CATEGORY_BLURB[slug][lang];
    return {
      slug,
      pill: short.pill,
      title: lang === "en" ? cap(short.title) : plain(short.title),
      index: dict.home[EYEBROW[slug]][lang],
      note: joined === blurb ? noteLines : [blurb],
    };
  });

/* ---------------------------------------------------------------- hero (§13 rows 1–7) */

/**
 * AN IMAGE IN A HOME SLOT (P5): a registered placeholder (width and height known) or a Hub photograph
 * (`lib/lumiere/home-hub.ts`; the slots draw it with `fill`, so no dimensions are needed). Never both
 * shapes' extras are required: a component reads `src` and `alt`.
 */
export interface HomeImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** true only for a registered placeholder; a Hub photograph omits it. */
  readonly placeholder?: true;
}

export interface HeroCardSlot {
  position: number;
  image: HomeImage;
  /** Object-position for the cover crop (the reference's). */
  objectPosition?: string;
}

export interface LumiereHeroContent {
  /** The headline as plain text — `hero.h1a` exactly — for the page's one <h1>; the engine's letters are aria-hidden copies beside it. */
  headlineText: string;
  headline: TextRun[][];
  headlinePhoto: TextRun[][];
  /** The standfirst: one line that wraps in English (`wrap` mode); named lines in Japanese (§5.3). */
  tagline: TextRun[][];
  taglinePhoto: TextRun[][];
  /** Whether the standfirst may wrap in the engine's row (EN only). */
  taglineWraps: boolean;
  cta: { runs: TextRun[]; href: string };
  scrollLabel: string;
  categories: { label: string; href: string }[];
  /** The category strip's width in design units: 85 for EN, 100 for JA (row 7). */
  categoryStripWidth: number;
  cards: HeroCardSlot[];
  frame3: HomeImage;
  pendant: typeof PENDANT;
}

const HERO: Record<Lang, Pick<LumiereHeroContent, "headline" | "headlinePhoto" | "tagline" | "taglinePhoto" | "taglineWraps" | "scrollLabel">> = {
  en: {
    // hero.h1a / h1b, three named lines each (rows 1–2)
    headline: [cap("Timeless"), plain("beauty"), plain("to wear.")],
    headlinePhoto: [cap("Lasting"), plain("value"), plain("to pass on.")],
    // ✂ hero.lede (row 3) and ✂ home.valuesP (row 4)
    tagline: [plain("Every piece chosen for quality, elegance and enduring worth.")],
    taglinePhoto: [plain("Beauty beyond trends, careful workmanship, quality you can trust.")],
    taglineWraps: true,
    scrollLabel: "scroll",
  },
  ja: {
    headline: [plain("身につける、"), plain("時を超える"), plain("美しさ。")],
    // ✂ the comma after 受け継がれる (row 2)
    headlinePhoto: [plain("受け継がれる"), plain("確かな価値。")],
    tagline: [plain("品質、気品、変わらない価値。"), plain("その基準で選んだジュエリー。")],
    taglinePhoto: [plain("流行を超える美しさ。"), plain("丁寧な仕立て。"), plain("信頼できる品質。")],
    taglineWraps: false,
    scrollLabel: "スクロール",
  },
};

/** The reference's crops for the eight cards (its `heroCards`); card 8 is the frame-3 photograph. */
const CARD_CROPS: Record<number, string> = { 4: "center bottom", 6: "center bottom" };

/** The lines of a heading as the plain sentence they came from (EN lines are space-separated, JA lines run on). */
export const headingText = (lines: readonly TextRun[][], lang: Lang): string =>
  lines.map((line) => line.map((run) => run.text).join("")).join(lang === "en" ? " " : "");

export const lumiereHero = (lang: Lang, categoryHref: (slug: string) => string, collectionsHref: string, hub?: HomeHubSlots): LumiereHeroContent => {
  const cta = dict.hero.cta1[lang];
  return {
    headlineText: headingText(HERO[lang].headline, lang),
    ...HERO[lang],
    // row 5: EN opens two words on italic capitals as the reference's CTA does; JA plain
    cta: { runs: lang === "en" ? caps(...cta.toLowerCase().split(" ")) : plain(cta), href: collectionsHref },
    categories: lumiereCategories(lang).map((c) => ({ label: c.pill, href: categoryHref(c.slug) })),
    categoryStripWidth: lang === "ja" ? 100 : 85,
    // Cards 1–7 take real pieces from the Hub's hero deck (the placeholder only where the Hub has no photo to give);
    // card 8 is the frame-3 hand photograph, which the Hub has no source for (docs/tasks/lumiere-hub-slots.md).
    cards: HERO_CARDS.map((placeholder, i) => {
      const photo = i < 7 ? hub?.heroPhotos[i] : undefined;
      return photo
        ? { position: i + 1, image: photo, objectPosition: "50% 45%" }
        : { position: i + 1, image: placeholder, objectPosition: CARD_CROPS[i + 1] };
    }),
    frame3: HERO_CARDS[7],
    pendant: PENDANT,
  };
};

/* ---------------------------------------------------------------- collections (§13 rows 8–12) */

export interface LumiereCollectionCard {
  category: LumiereCategory;
  href: string;
  image: HomeImage & { position: string; positionMobile: string; scale: number; scaleMobile: number; aimMobile: number };
  /** Figma's measure for the note, in design units: 9 em = 126 u (EN), 10 em = 140 u (JA). */
  noteWidth: number;
  width: "narrow" | "wide" | "full";
}

export interface LumiereCollectionsContent {
  /** The heading as one plain sentence, for the <h2>. */
  headingText: string;
  heading: TextRun[][];
  lead: string;
  cta: TextRun[];
  cards: LumiereCollectionCard[];
}

const COLLECTIONS: Record<Lang, Pick<LumiereCollectionsContent, "heading" | "lead">> = {
  en: {
    // home.colsEyebrow (category wording, FIX 5) + ✂ hero.lede
    heading: [caps("Shop", "by", "Category."), caps("Carefully", "Selected.")],
    // home.colsP, second sentence (FIX 3)
    lead: "Every listing shows weight, purity and stones.",
  },
  ja: {
    heading: [plain("カテゴリーから選ぶ。"), plain("厳選したジュエリー。")],
    lead: "すべての商品に重量・純度・石の情報を表示しています。",
  },
};

/** The reference's four plates and crops, assigned to the five cards; the fifth, full-width card takes the widest plate. */
const COLLECTION_IMAGES = [
  { ...COLLECTION_PHOTOS.rings, position: "50% 100%", positionMobile: "13% 50%", scale: 1, scaleMobile: 1.4, aimMobile: 1 },
  { ...COLLECTION_PHOTOS.necklaces, position: "50% 50%", positionMobile: "30% 50%", scale: 1, scaleMobile: 1.35, aimMobile: -1 },
  { ...COLLECTION_PHOTOS.earrings, position: "0% 34.4%", positionMobile: "0% 50%", scale: 1.02, scaleMobile: 1, aimMobile: 0 },
  { ...COLLECTION_PHOTOS.bracelets, position: "43.8% 97.5%", positionMobile: "100% 50%", scale: 1.029, scaleMobile: 1, aimMobile: 0 },
  { ...COLLECTION_PHOTOS.necklaces, position: "50% 40%", positionMobile: "30% 50%", scale: 1, scaleMobile: 1.2, aimMobile: 0 },
] as const;

const COLLECTION_WIDTHS = ["narrow", "wide", "wide", "narrow", "full"] as const;

export const lumiereCollections = (lang: Lang, categoryHref: (slug: string) => string, hub?: HomeHubSlots): LumiereCollectionsContent => ({
  headingText: headingText(COLLECTIONS[lang].heading, lang),
  ...COLLECTIONS[lang],
  // row 12: home.colsLink
  cta: lang === "en" ? caps(...dict.home.colsLink[lang].toLowerCase().split(" ")) : plain(dict.home.colsLink[lang]),
  cards: lumiereCategories(lang).map((category, i) => ({
    category,
    href: categoryHref(category.slug),
    // The Hub's own category photograph (hero_media) when it has one — cropped centrally; the placeholder, with the reference's crop, otherwise.
    image: hub?.categoryPhotos[category.slug]
      ? { ...hub.categoryPhotos[category.slug], position: "50% 50%", positionMobile: "50% 50%", scale: 1, scaleMobile: 1, aimMobile: 0 }
      : COLLECTION_IMAGES[i],
    noteWidth: lang === "ja" ? 140 : 126,
    width: COLLECTION_WIDTHS[i],
  })),
});

/* ---------------------------------------------------------------- featured (§13 rows 13–16, D-7) */

/** What Add to cart needs for a REAL piece (a Hub variant); absent on a placeholder, whose button stays disabled (D-7). */
export interface FeaturedBuy { variantId: string; slug: string; sku: string }

/**
 * A featured slot (P5). The name, the materials row, the price and the photograph are the Hub's for a real
 * piece; the model and its poster are the registered placeholders either way — the Hub has no 3D source
 * (docs/tasks/lumiere-hub-slots.md). `placeholder: true` keeps D-7's "¥ —" and a disabled pill.
 */
export interface FeaturedPieceContent {
  placeholder: boolean;
  name: string;
  materials: readonly string[];
  model: PlaceholderPiece["model"];
  poster: PlaceholderPiece["poster"];
  photo: HomeImage;
  price: string;
  buy: FeaturedBuy | null;
  nameRuns: TextRun[];
}

export interface LumiereFeaturedContent {
  pieces: FeaturedPieceContent[];
  /** The pill after a successful add, and its aria-live text. */
  added: string;
  viewCart: string;
  lang: Lang;
  cta: string;
  scrollCue: string;
  /** The dots' screen-reader label, with `{n}` and `{total}` to fill (a template, so it can cross into the client). */
  ringLabel: string;
}

const FEATURED: Record<Lang, { scrollCue: string; ring: string }> = {
  en: { scrollCue: "Scroll to explore", ring: "Ring {n} of {total}" },
  ja: { scrollCue: "スクロールして見る", ring: "リング {n} / {total}" },
};

export const lumiereFeatured = (lang: Lang, hub?: HomeHubSlots): LumiereFeaturedContent => ({
  lang,
  added: dict.cart.added[lang],
  viewCart: dict.cart.viewCart[lang],
  // Slot i takes the Hub's i-th featured piece (name, price, metals, photograph, Add to cart); a slot the Hub cannot fill keeps
  // its placeholder (names stay Latin in both languages (row 13); the italic capital is EN only).
  pieces: FEATURED_PIECES.map((piece, i): FeaturedPieceContent => {
    const real = hub?.featured[i];
    if (real) {
      return {
        placeholder: false, name: real.name, materials: real.materials, model: piece.model, poster: piece.poster,
        photo: real.photo, price: real.price, buy: real.buy,
        nameRuns: lang === "en" ? cap(`${real.name}.`) : plain(`${real.name}.`),
      };
    }
    return { ...piece, buy: null, nameRuns: lang === "en" ? cap(`${piece.name}.`) : plain(`${piece.name}.`) };
  }),
  cta: dict.cart.add[lang],
  scrollCue: FEATURED[lang].scrollCue,
  ringLabel: FEATURED[lang].ring,
});

/* ---------------------------------------------------------------- philosophy (§13 rows 17–27) */

export interface LumierePhilosophyContent {
  lines: Record<"jewelry" | "quite" | "shapes" | "longer" | "look" | "keep", TextRun[]>;
  notes: { top: string[]; left: string[]; right: string[]; bottom: string[] };
  cta: { label: string; href: string };
  backdrop: { wide: PlaceholderAsset; narrow: PlaceholderAsset };
  photo: PlaceholderAsset;
}

const PHILOSOPHY_LINES: Record<Lang, LumierePhilosophyContent["lines"]> = {
  en: {
    // the four values of home.valuesP (FIX 4), italic capitals as the reference's rows
    jewelry: caps("Beauty", "Beyond"),
    quite: cap("Trends."),
    shapes: caps("Value", "You", "Can", "Understand."),
    longer: cap("Careful"),
    look: cap("Workmanship."),
    keep: caps("Quality", "You", "Can", "Trust."),
  },
  ja: {
    jewelry: plain("流行を超える"),
    quite: plain("美しさ。"),
    // two runs, so a centred line splits at the 。 — never mid-word (§5.3)
    shapes: [{ text: "分かりやすい" }, { text: "価値。" }],
    longer: plain("丁寧な"),
    look: plain("仕立て。"),
    keep: [{ text: "信頼できる" }, { text: "品質。" }],
  },
};

const PHILOSOPHY_NOTES: Record<Lang, LumierePhilosophyContent["notes"]> = {
  en: {
    top: ["Real materials.", "Clear details."],
    left: ["authenticated", "in Japan"],
    right: ["every listing", "shows weight"],
    bottom: ["selected for authenticity,", "quality and lasting value"],
  },
  ja: {
    top: ["確かな素材。", "明確な情報。"],
    left: ["日本で", "真贋鑑定済み"],
    right: ["すべての商品に", "重量を表示"],
    bottom: ["真贋と品質、永く続く価値に", "目を配って選んでいます。"],
  },
};

export const lumierePhilosophy = (lang: Lang, aboutHref: string): LumierePhilosophyContent => ({
  lines: PHILOSOPHY_LINES[lang],
  notes: PHILOSOPHY_NOTES[lang],
  // row 27: navMenu.about → /about
  cta: { label: dict.navMenu.about[lang], href: aboutHref },
  backdrop: { wide: PHILOSOPHY.backdrop, narrow: PHILOSOPHY.backdropNarrow },
  photo: PHILOSOPHY.hand,
});

/** The sources every philosophy row is drawn from, for the tests: rows 23 and 26 are ✂ about.closing. */
export const PHILOSOPHY_SOURCES = (lang: Lang) => ({
  closing: aboutCopy[lang].closing,
  valuesP: dict.home.valuesP[lang],
  eyebrow: dict.home.heroPrelovedEyebrow[lang],
  colsP: dict.home.colsP[lang],
});

/* ---------------------------------------------------------------- chrome strings on home */

export const LUMIERE_HOME_STRINGS: Record<Lang, { loading: string; collectionsIndex: string; menuTitle: string; accountTitle: string; corporateNo: string; legalNotice: string }> = {
  en: { loading: "Loading", collectionsIndex: "Collections", menuTitle: "Menu", accountTitle: "Account", corporateNo: "Corporate number", legalNotice: "Legal notice" },
  // §13 row 29: the Japanese footer label fits in full (特定商取引法に基づく表記, 168 u); only the English is shortened.
  ja: { loading: "読み込み中", collectionsIndex: "コレクション", menuTitle: "メニュー", accountTitle: "マイアカウント", corporateNo: "法人番号", legalNotice: "特定商取引法に基づく表記" },
};

/* ---------------------------------------------------------------- part B: the existing home's sections (report §7 home row, §8) */

/**
 * WHY COLUMNS — the Colonnade reference (docs/design-refs/colonnade). The four
 * values of the old home's bento (`home.value*H/P`, FIX 4 kept their names in
 * the philosophy block) fold here as the four chapters; the pill goes to
 * /why-cha-jewels (`navMenu.why`). Nothing is new copy.
 */
export interface LumiereWhyColumn {
  index: string;
  /** The panel's photograph — a registered placeholder until the values get their own (D-16). */
  image: PlaceholderAsset;
  /** `home.value*H` — the chapter's name on the column. */
  name: string;
  /** `home.value*P` — the chapter's line in the swapping headline. */
  title: string;
}
export interface LumiereWhyContent {
  eyebrow: string;
  heading: string;
  columns: LumiereWhyColumn[];
  cta: { label: string; href: string };
  tablistLabel: string;
}
const WHY_VALUES = ["Timeless", "Worth", "Craft", "Quality"] as const;
/** One panel photograph per value: the collections placeholders, in their registry order. */
const WHY_IMAGES = [COLLECTION_PHOTOS.rings, COLLECTION_PHOTOS.necklaces, COLLECTION_PHOTOS.earrings, COLLECTION_PHOTOS.bracelets] as const;
export const lumiereWhy = (lang: Lang, whyHref: string): LumiereWhyContent => ({
  eyebrow: dict.home.valuesEyebrow[lang],
  heading: dict.home.valuesH[lang],
  columns: WHY_VALUES.map((value, i) => ({
    index: `0${i + 1}`,
    image: WHY_IMAGES[i],
    name: dict.home[`value${value}H`][lang],
    title: dict.home[`value${value}P`][lang],
  })),
  cta: { label: dict.navMenu.why[lang], href: whyHref },
  tablistLabel: dict.home.valuesH[lang],
});

/**
 * NEW ARRIVALS — the Carousel Spotlight reference (docs/design-refs/
 * carousel-spotlight). The pieces are the Hub's (`hub.featured`, filtered by
 * `isShowableArrival` as before); the chrome strings are the old section's
 * (`home.newEyebrow`, `newH`, `viewAll`, `newDetail`, `trust1H`). The
 * carousel's own controls need five labels the site never had — listed as
 * new strings in the P2 report.
 */
export interface LumiereArrivalsStrings {
  eyebrow: string;
  heading: string;
  viewAll: string;
  detail: string;
  checked: string;
  /** Carousel controls (new strings). */
  region: string;
  prev: string;
  next: string;
  /** `{name}` filled per dot. */
  goTo: string;
  /** `{n}` / `{total}`, the live counter's screen-reader text. */
  count: string;
  hint: string;
}
const ARRIVALS_NEW: Record<Lang, Pick<LumiereArrivalsStrings, "region" | "prev" | "next" | "goTo" | "count" | "hint">> = {
  en: {
    region: "New arrivals — a turning gallery. Use the left and right arrow keys to move between pieces.",
    prev: "Previous piece",
    next: "Next piece",
    goTo: "Go to {name}",
    count: "Piece {n} of {total}",
    hint: "Drag · swipe · arrow keys",
  },
  ja: {
    region: "新着ギャラリー。左右の矢印キーで商品を切り替えられます。",
    prev: "前の商品",
    next: "次の商品",
    goTo: "{name} へ",
    count: "{total} 点中 {n} 点目",
    hint: "ドラッグ · スワイプ · 矢印キー",
  },
};
export const lumiereArrivals = (lang: Lang): LumiereArrivalsStrings => ({
  eyebrow: dict.home.newEyebrow[lang],
  heading: dict.home.newH[lang],
  viewAll: dict.home.viewAll[lang],
  detail: dict.home.newDetail[lang],
  checked: dict.home.trust1H[lang],
  ...ARRIVALS_NEW[lang],
});

/**
 * CUSTOMER STORIES — the Cards Almanac reference (docs/design-refs/
 * cards-almanac). The stories are lib/stories.ts's (testimonials + approved
 * reviews, newest first; a layaway story only where layaway is offered). The
 * heading block is the old section's (`home.testi*`); "Verified buyer" is
 * `reviews.verified`. The stack shows EVERY published story (P3 item 4; it
 * showed a fixed six before).
 */
export interface LumiereStoriesStrings {
  eyebrow: string;
  heading: string;
  lead: string;
  verified: string;
  /** `{n}` / `{total}`, the live announcement (new string). */
  count: string;
  /** The belt's region label (the keyboard hint), the drag hint, the list and dialog labels (new strings, P4). */
  region: string;
  hint: string;
  seeAll: string;
  allTitle: string;
  close: string;
  next: string;
  previous: string;
  open: string;
}
const STORIES_NEW: Record<Lang, string> = { en: "Story {n} of {total}", ja: "{total} 件中 {n} 件目" };
const STORIES_BELT: Record<Lang, Omit<LumiereStoriesStrings, "eyebrow" | "heading" | "lead" | "verified" | "count">> = {
  en: {
    region: "Customer stories, a draggable 3D belt of cards. Use the left and right arrow keys to move and Enter to read the story in front.",
    hint: "Drag to explore",
    seeAll: "See all stories",
    allTitle: "All customer stories",
    close: "Close",
    next: "Next story",
    previous: "Previous story",
    open: "Read the full story",
  },
  ja: {
    region: "お客様の声。ドラッグで動かせる立体のカードです。左右の矢印キーで動かし、Enterキーで手前のカードの全文を読めます。",
    hint: "ドラッグして見る",
    seeAll: "お客様の声をすべて見る",
    allTitle: "お客様の声（すべて）",
    close: "閉じる",
    next: "次のお客様の声",
    previous: "前のお客様の声",
    open: "全文を読む",
  },
};
export const lumiereStories = (lang: Lang): LumiereStoriesStrings => ({
  eyebrow: dict.home.testiEyebrow[lang],
  heading: dict.home.testiH[lang],
  lead: dict.home.testiP[lang],
  verified: dict.reviews.verified[lang],
  count: STORIES_NEW[lang],
  ...STORIES_BELT[lang],
});

/**
 * THE LAYAWAY BAND (English only, `layawayOffered`): the three steps as a
 * Cards Almanac stack beside the existing calculator (LayawayCalculator,
 * logic untouched; its figures roll in with the Brewns digit roll). Every
 * string is the old band's (`home.lay*`).
 */
export interface LumiereLayawayContent {
  pill: string;
  heading: string;
  lead: string;
  steps: { index: string; title: string; body: string }[];
  calculator: { title: string; sub: string; chip: string };
  cta: { label: string; href: string };
  /** `{n}` / `{total}` (new string, shared with the stories' announcement). */
  count: string;
}
export const lumiereLayaway = (lang: Lang, collectionsHref: string): LumiereLayawayContent => ({
  pill: dict.home.layPill[lang],
  heading: dict.home.layH[lang],
  lead: dict.home.layP[lang],
  steps: ([1, 2, 3] as const).map((n) => ({
    index: `0${n}`,
    title: dict.home[`layStep${n}H`][lang],
    body: dict.home[`layStep${n}P`][lang],
  })),
  calculator: { title: dict.home.layCalcH[lang], sub: dict.home.layCalcP[lang], chip: dict.home.layCalcChip[lang] },
  // NEVER /layaway (components/commerce/layaway-band.tsx): a layaway starts from a piece.
  cta: { label: dict.home.layCta[lang], href: collectionsHref },
  count: STEPS_NEW[lang],
});
const STEPS_NEW: Record<Lang, string> = { en: "Step {n} of {total}", ja: "{total} ステップ中 {n}" };

/**
 * THE LOYALTY BAND (new, D-21) → /loyalty. Every line exists already: the
 * programme page's own h1 and its two-cell ledger (`loyalty.h1`, `baseRate`,
 * `pointValue`, `onNextPiece`, `join`), the nav label as the eyebrow, and the
 * page's one-sentence summary (`seo.loyalty.description`) as the lead. The
 * figures are the lede's own words set as figures — not computed.
 */
export interface LumiereLoyaltyContent {
  eyebrow: string;
  heading: string;
  lead: string;
  cells: { label: string; value: string }[];
  note: string;
  cta: { label: string; href: string };
}
export const lumiereLoyalty = (lang: Lang, loyaltyHref: string): LumiereLoyaltyContent => ({
  eyebrow: dict.nav.loyalty[lang],
  heading: dict.loyalty.h1[lang],
  lead: dict.meta.loyalty.description[lang],
  cells: [
    { label: dict.loyalty.baseRate[lang], value: dict.loyalty.baseRateValue[lang] },
    { label: dict.loyalty.pointValue[lang], value: dict.loyalty.pointValueValue[lang] },
  ],
  note: dict.loyalty.onNextPiece[lang],
  cta: { label: dict.loyalty.join[lang], href: loyaltyHref },
});

/** The recently-viewed strip keeps its component; only the heading is the site's string. */
export const lumiereRecentlyViewedTitle = (lang: Lang): string => dict.pdp.recentlyViewed[lang];

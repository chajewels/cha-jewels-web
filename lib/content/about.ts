import type { Lang } from "@/lib/i18n";

/**
 * About page copy, both languages. The page picks by the language cookie.
 *
 * The `facts` block that used to sit in the right column was replaced by
 * `listHeading` + `list` (owner decision, 2026-09-14): the products-and-services
 * list carries that column now, and the two never coexist. The 30% / 0% layaway
 * figure the facts block used to carry still appears on the layaway page, the
 * FAQ and the legal page, so nothing was lost by dropping it here.
 */
/** A headed section of prose. Mission and Vision today; the shape takes more. */
export type AboutSection = { heading: string; body: string };

export type AboutCopy = {
  h1: string;
  /** Founding story. 2021 sole proprietorship -> 2024 incorporation. */
  intro: string;
  /** Lead-in to the two questions below. */
  questionsLead: string;
  questions: [string, string];
  /** Body paragraphs, rendered in order after the questions. */
  body: string[];
  listHeading: string;
  /** Products and services. Replaces the former `facts` pairs. */
  list: string[];
  /**
   * Mission and Vision, rendered after the body paragraphs and before the
   * closing. See the PR for why this beat placing them before `body[1]`.
   */
  sections: AboutSection[];
  /** Closing paragraph then the closing line, rendered in order. */
  closing: [string, string];
  cta: string;
};

export const aboutCopy: Record<Lang, AboutCopy> = {
  ja: {
    h1: "チャジュエルズについて",
    intro: "チャジュエルズは2021年、フィリピン人コミュニティ向けのライブ販売から始まりました。事業の成長にともない、2024年に株式会社チャジュエルズとして法人化し、東京・葛飾区立石に拠点を構えています。",
    questionsLead: "私たちの歩みは、お客様から繰り返し寄せられた二つの質問とともにありました。",
    questions: ["これは本物ですか。", "将来、どれくらいの価値になりますか。"],
    body: [
      "この二つの質問が、私たちの事業の土台になりました。透明であること、真贋が確かであること、納得したうえでお選びいただけること。",
      "厳選したK18ゴールド、あこや真珠、鑑定書付きダイヤモンド、天然石ジュエリー、そして日本国内で仕入れた状態の良いプレラブドをお取り扱いしています。選び抜いた天然石を使ったハンドメイドのブレスレットも、一点ずつお作りしています。",
      "商品ページには、可能な限り、金属の純度、刻印、グラム重量、石の情報、コンディション、鑑定書の有無を明記しています。ジュエリーは見た目だけで選ぶものではありません。何をお求めになるのかを、正確に知っていただきたいと考えています。",
      "現在は日本のお客様、日本とフィリピンで暮らすフィリピン人のご家族、そして世界各国のお客様へ、小売と卸売の両方でお届けしています。普段使いの一点でも、大切な節目のお品でも、コレクションを育てるためでも、贈り物でも、資産としての貴金属でも、ご提供するものは変わりません。正直な商品情報と、確かなサービスです。",
    ],
    listHeading: "取り扱い商品・サービス",
    list: [
      "ジュエリーの小売・卸売",
      "K18ゴールド・プラチナのジュエリー",
      "あこや真珠のジュエリー",
      "鑑定書付きダイヤモンドジュエリー",
      "天然石ジュエリー",
      "ハンドメイドの天然石ブレスレット",
      "厳選したプレラブドジュエリー",
      "サイズ直し・研磨・鑑定書取得のサポート",
      "無利息の分割予約",
      "国内・海外への配送",
    ],
    sections: [
      {
        heading: "私たちのミッション",
        body: "日本の確かなジュエリーを、より多くの方へ。透明な商品情報、無利息の分割予約、そして頼れるサポートを通じて、その入口を広げていきます。K18ゴールド、プラチナ、あこや真珠、鑑定書付きダイヤモンド、天然石、ハンドメイドの天然石ブレスレット、そして厳選したプレラブドジュエリー。安心してお選びいただけるものだけをお届けします。",
      },
      {
        heading: "私たちのビジョン",
        body: "日本のものづくりと、日本・フィリピン・世界各国のお客様をつなぐ、信頼される国際的なジュエリーカンパニーを目指します。普段使いの一点でも、人生の節目のお品でも、大切に育てるコレクションでも、次の世代へ受け継ぐものでも、気持ちの面でも資産の面でも永く価値の続くジュエリー選びを、お手伝いしてまいります。",
      },
    ],
    closing: [
      "日本の工房で仕上げられた一点も、丁寧に検品したプレラブドも、手仕事の天然石ジュエリーも、真贋と品質、そして永く続く価値に目を配って選んでいます。",
      "確かな素材。明確な情報。自信を持ってお選びいただけるジュエリーです。",
    ],
    cta: "コレクションを見る",
  },
  en: {
    h1: "About Cha Jewels",
    intro: "Cha Jewels began in 2021 as a sole proprietorship serving the Filipino community through live selling. As the business continued to grow, it was officially incorporated as Cha Jewels Co., Ltd. in 2024, with its base in Tateishi, Katsushika-ku, Tokyo.",
    questionsLead: "Our journey was built around two questions customers asked again and again:",
    questions: ["Is it authentic?", "What could it be worth in the future?"],
    body: [
      "Those questions shaped the foundation of our business: transparency, authenticity, and informed buying.",
      "We offer carefully selected K18 gold jewelry, Akoya pearls, certified diamonds, natural gemstone jewelry, and quality preloved pieces sourced in Japan. We also create handmade gemstone bracelets, thoughtfully designed and assembled using selected natural stones.",
      "Whenever applicable, our listings clearly show important product details such as metal purity, hallmarks, gram weight, gemstone information, condition, and certification. Jewelry should not be purchased based on appearance alone—customers deserve to understand exactly what they are buying.",
      "Today, Cha Jewels serves Japanese customers, Filipino families in Japan and the Philippines, and clients worldwide through both retail and wholesale. Whether you are choosing jewelry for everyday wear, celebrating an important milestone, building a collection, giving a meaningful gift, or considering precious metals as part of your personal assets, you receive the same commitment to honest product information and dependable service.",
    ],
    listHeading: "Our products and services include:",
    list: [
      "Retail and wholesale jewelry",
      "K18 gold and platinum jewelry",
      "Akoya pearl jewelry",
      "Certified diamond jewelry",
      "Natural gemstone jewelry",
      "Handmade gemstone bracelets",
      "Carefully selected preloved jewelry",
      "Jewelry resizing, polishing, and certification assistance",
      "Flexible interest-free layaway options",
      "Domestic and international shipping",
    ],
    sections: [
      {
        heading: "Our Mission",
        // "jewelry from Japan" is the same class of phrase as the closing
        // paragraph's workshops line: a site-wide origin statement where origin
        // is per-product data. Left as written; flagged in the PR with it.
        body: "To make authentic, high-quality jewelry from Japan accessible to more people through transparent product information, flexible interest-free layaway options, and dependable customer service. We are committed to offering K18 gold, platinum, Akoya pearls, certified diamonds, natural gemstones, handmade gemstone bracelets, and carefully selected preloved jewelry that customers can purchase with confidence.",
      },
      {
        heading: "Our Vision",
        body: "To become a trusted international jewelry company connecting Japanese craftsmanship with customers in Japan, the Philippines, and around the world. We aim to help individuals and families choose jewelry with lasting personal and material value—whether for everyday wear, meaningful milestones, treasured collections, or future generations.",
      },
    ],
    closing: [
      // "From jewelry made by Japanese workshops" in the supplied copy. Origin is
      // per-product data rendered only by OriginBadge, and many preloved pieces
      // are branded European, so a site-wide phrasing was avoided here.
      "From pieces made in Japanese workshops to carefully inspected preloved treasures and handmade gemstone creations, every Cha Jewels item is selected with close attention to authenticity, quality, and lasting value.",
      "Real materials. Clear details. Jewelry you can choose with confidence.",
    ],
    cta: "Shop the collections",
  },
};

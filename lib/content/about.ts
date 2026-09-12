import type { Lang } from "@/lib/i18n";

/** About page copy, both languages. The page picks by the language cookie. */
export const aboutCopy: Record<Lang, { h1: string; p1: string; p2: string; p3: string; facts: [string, string][]; cta: string }> = {
  ja: {
    h1: "私たちについて",
    p1: "株式会社チャジュエルズは2024年、東京・葛飾区立石で生まれました。K18ゴールド、あこや真珠、鑑定書付きダイヤモンドを、一点ずつ東京で真贋を確認し、重量と純度をそのまま表示して販売しています。",
    p2: "始まりはフィリピン人コミュニティ向けのライブ販売でした。「これは本物ですか」「後で売るといくらになりますか」。毎回のライブで聞かれるこの二つの質問に、刻印と重量で答えるのが私たちの仕事です。",
    p3: "今は日本のお客様、日本に住むフィリピン人ファミリー、フィリピン本国、そして世界中に届けています。小売、卸売、そして資産としてのゴールド。どの入口から来ても、同じ真贋確認、同じ刻印です。",
    facts: [["2024年4月", "東京・葛飾区で設立"], ["K18", "すべてのゴールドの純度"], ["30% / 0%", "分割予約の予約金と金利"], ["日本・フィリピン・世界", "配送先"]],
    cta: "コレクションを見る",
  },
  en: {
    h1: "About Us",
    p1: "Cha Jewels Co., Ltd. was founded in 2024 in Tateishi, Katsushika-ku, Tokyo. We sell K18 gold, Akoya pearls and certified diamonds, each piece hallmark checked in Tokyo, with the weight and purity printed on every listing.",
    p2: "It started as live selling for the Filipino community. Two questions came up on every Live: is this real, and what is it worth if I sell it later. Answering both with a hallmark and a gram weight is the whole business.",
    p3: "Today we serve Japanese customers, Filipino families in Japan, the Philippines and everywhere else. Retail, wholesale, and gold as an asset. Whichever door you come through, it is the same hallmark check and the same stamps.",
    facts: [["April 2024", "Founded in Katsushika-ku, Tokyo"], ["K18", "Purity of every gold piece"], ["30% / 0%", "Layaway deposit and interest"], ["Japan, Philippines, worldwide", "Where we ship"]],
    cta: "Shop the collections",
  },
};

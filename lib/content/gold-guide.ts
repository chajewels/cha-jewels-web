import type { Lang } from "@/lib/i18n";

export type GuideSection = { h: Record<Lang, string>; body: Record<Lang, string>; facts: { k: Record<Lang, string>; v: Record<Lang, string> }[] };

export const guideSections: GuideSection[] = [
  {
    h: { ja: "K18とは", en: "What K18 means" },
    body: {
      ja: "K18は金の含有率75%を表します。残りの25%は銀や銅などの合金で、硬さと色を決める部分です。K24（純金）は柔らかすぎて日常使いのジュエリーには向きません。K18は日本のファインジュエリーの標準です。ヨーロッパでは同じ規格を「750」または「Au750」と表記します。K18・750・Au750はすべて同じ意味です。",
      en: "K18 is 75% gold. The remaining 25% is alloy — usually silver and copper — and it is what sets the hardness and the colour. K24 is pure gold and too soft for jewelry you actually wear. K18 is the fine-jewelry standard in Japan. In Europe the same standard is marked 750 or Au750: K18, 750 and Au750 all mean the same thing.",
    },
    facts: [
      { k: { ja: "金の含有率", en: "Gold content" }, v: { ja: "75%", en: "75%" } },
      { k: { ja: "同等の刻印", en: "Same standard" }, v: { ja: "750 / Au750", en: "750 / Au750" } },
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
  {
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
  },
];

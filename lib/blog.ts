import type { Lang } from "./i18n";
/** Editorial posts. Move to the CMS (Sanity/Payload) in Phase 4; until then, add posts here. */
export type Post = { slug: string; date: string; title: Record<Lang, string>; excerpt: Record<Lang, string>; body: Record<Lang, string[]> };
export const posts: Post[] = [
  {
    slug: "what-k18-means", date: "2026-09-01",
    title: { ja: "K18とは何か、なぜ日本の基準なのか", en: "What K18 means, and why it is the Japanese standard" },
    excerpt: { ja: "純度75%の意味、刻印の読み方、なぜK24ではなくK18が毎日身につけるジュエリーに選ばれるのか。", en: "What 75% purity means, how to read the stamp, and why K18 rather than K24 is chosen for jewelry worn every day." },
    body: {
      ja: ["K18は金の含有率が75%であることを示します。残りの25%は銀や銅などの合金で、これが硬さと色を決めます。", "純度の高いK24は柔らかく、指輪やチェーンとしては曲がりやすく傷つきやすい。K18は資産価値と耐久性の両立点として、日本の高級ジュエリーの標準になっています。", "刻印はK18またはAU750。メーカーの刻印が入ることもあります。東京でもマニラでも、どの宝石店でも読み取れます。"],
      en: ["K18 means the metal is 75% gold. The other 25% is an alloy of silver and copper that sets hardness and color.", "K24 is purer but soft; as a ring or chain it bends and scratches. K18 is the balance point between asset value and durability, and the standard for fine jewelry in Japan.", "The stamp reads K18 or AU750, often with a maker's mark beside it. Any jeweler in Tokyo or Manila can read it."],
    },
  },
  {
    slug: "layaway-explained", date: "2026-08-20",
    title: { ja: "分割予約のしくみ：30%、無利息、最長8か月", en: "Layaway explained: 30%, 0% interest, up to 8 months" },
    excerpt: { ja: "予約金、支払いスケジュール、リマインダー、そして支払いが遅れたときにどうなるか。", en: "The deposit, the schedule, the reminders, and what happens if a payment is late." },
    body: {
      ja: ["30%をお支払いいただいた時点で商品は確保され、他のお客様には販売されません。", "残額は3〜6か月の均等払い。¥300,000以上のご注文は8か月まで延長できます。金利はかかりません。", "各支払日の3日前にMessenger、SMS、またはメールでお知らせします。遅延時の扱いは契約書に明記しています。"],
      en: ["Once 30% is paid the piece is reserved and not sold to anyone else.", "The balance is split evenly over 3 to 6 months. Orders of ¥300,000 and above can extend to 8 months. There is no interest.", "You get a reminder three days before each due date by Messenger, SMS or email. Late-payment handling is written into your agreement."],
    },
  },
];
export const getPost = (slug: string) => posts.find((p) => p.slug === slug) ?? null;

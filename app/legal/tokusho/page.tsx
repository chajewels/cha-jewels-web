import type { Metadata } from "next";
export const metadata: Metadata = { title: "特定商取引法に基づく表記" };
// Required by Japanese law for online sales. Confirm every line with a JP compliance review before launch.
const rows: [string, string][] = [
  ["販売業者", "株式会社チャジュエルズ（Cha Jewels Co., Ltd.）"],
  ["代表者", "Cynthia Largo"],
  ["所在地", "〒124-0012 東京都葛飾区立石6-5-1 タイムマンション301"],
  ["登録番号", "T7011801044120"],
  ["販売価格", "各商品ページに表示（税込）"],
  ["商品代金以外の必要料金", "送料、銀行振込手数料、コンビニ決済手数料"],
  ["支払方法", "クレジットカード、銀行振込、コンビニ決済、分割予約（レイアウェイ）"],
  ["支払時期", "注文時。分割予約の場合は契約書記載の期日"],
  ["引渡時期", "入金確認後5営業日以内に発送。分割予約は完済後"],
  ["返品・交換", "商品到着後7日以内、未使用に限り。オーダー品・サイズ直し品は不可"],
];
export default function Tokusho() {
  return (
    <section lang="ja" className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[820px]">
        <h1 className="text-[clamp(32px,4vw,56px)]">特定商取引法に基づく表記</h1>
        <dl className="mt-10 divide-y divide-[rgba(201,162,39,.32)] border-y border-rule">
          {rows.map(([k, v]) => (<div key={k} className="grid gap-2 py-4 sm:grid-cols-[200px_1fr]"><dt className="text-champagne/60">{k}</dt><dd>{v}</dd></div>))}
        </dl>
      </div>
    </section>
  );
}

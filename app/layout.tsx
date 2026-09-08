import type { Metadata } from "next";
import { Bodoni_Moda, Archivo, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { getRegion } from "@/lib/region";
import { getLang } from "@/lib/i18n-server";

const display = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const sans = Archivo({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const jp = Noto_Serif_JP({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jp", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.chajewelsjapan.com"),
  title: { default: "Cha Jewels | 日本製K18ゴールド・パール・ダイヤモンド", template: "%s | Cha Jewels" },
  description: "日本の工房で作られたK18ゴールド、あこや真珠、鑑定書付きダイヤモンド。無利息の分割予約、東京からの卸売、日本・フィリピン・海外への配送。",
  openGraph: { type: "website", siteName: "Cha Jewels", locale: "ja_JP", alternateLocale: ["en_US"] },
  alternates: { canonical: "/", languages: { ja: "/", en: "/?lang=en" } },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [region, lang] = await Promise.all([getRegion(), getLang()]);
  return (
    <html lang={lang} className={`${display.variable} ${sans.variable} ${jp.variable}`}>
      <body>
        <a href="#main" className="absolute -left-[999px] top-2 z-50 bg-gold px-3 py-2 text-ink focus:left-2">{lang === "ja" ? "本文へ" : "Skip to content"}</a>
        <Header region={region} lang={lang} />
        <main id="main">{children}</main>
        <Footer lang={lang} />
      </body>
    </html>
  );
}

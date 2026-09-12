import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { Bodoni_Moda, Archivo, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { getLang } from "@/lib/i18n-server";
import { dict, tr } from "@/lib/i18n";

const display = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const sans = Archivo({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans", display: "swap" });
const jp = Noto_Serif_JP({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jp", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: dict.meta.site.title[lang], template: "%s | Cha Jewels" },
    description: dict.meta.site.description[lang],
    openGraph: { type: "website", siteName: "Cha Jewels", locale: lang === "ja" ? "ja_JP" : "en_US", alternateLocale: [lang === "ja" ? "en_US" : "ja_JP"] },
    alternates: { canonical: "/", languages: { ja: "/", en: "/?lang=en" } },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const t = tr(lang);
  return (
    <html lang={lang} className={`${display.variable} ${sans.variable} ${jp.variable}`}>
      <body>
        <a href="#main" className="absolute -left-[999px] top-2 z-50 bg-gold px-3 py-2 text-ink focus:left-2">{t("nav", "skip")}</a>
        <Header lang={lang} />
        <main id="main">{children}</main>
        <Footer lang={lang} />
      </body>
    </html>
  );
}

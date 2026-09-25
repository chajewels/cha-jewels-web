import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { Playfair_Display, Inter, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { FlashNotice } from "@/components/site/flash-notice";
import { Suspense } from "react";
import { getLang } from "@/lib/i18n-server";
import { SeoLinks } from "@/lib/page-meta";
import { dict, tr, PATH_HEADER } from "@/lib/i18n";
import { headers } from "next/headers";
import { announcement, follow } from "@/lib/settings";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { MessengerButton } from "@/components/site/messenger-button";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { SpeedInsightsProvider } from "@/components/analytics/speed-insights-provider";
import { BootMarker } from "@/components/fx/boot-marker";
import { PageEnter } from "@/components/fx/page-enter";

/**
 * ONLY THE FACES THAT ACTUALLY RENDER.
 *
 * Inventoried by walking the computed styles of every element that holds text
 * across /, /collections, a category, a product, /faq, /blog and /about, in
 * both languages. What came back:
 *
 *   Playfair   400, 500, 600 normal. NO ITALIC ANYWHERE — the one `italic`
 *              class on the site is on a testimonial <p>, which is font-sans,
 *              so the italic cut was downloaded on behalf of text that does
 *              not exist. (It also asks for 700 on the collection-card
 *              heading, which is not loaded and never was; see the note in
 *              collection-cards.tsx.)
 *   Inter      400, 500, 600 and 700 all appear. All four stay.
 *   Noto Serif JP  500 only, and only on :lang(ja) h1/h2/h3 — the one rule
 *              in globals.css that uses font-jp. 400 rendered nowhere in
 *              either language.
 */
const display = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-display", display: "swap" });
const sans = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans", display: "swap" });
const jp = Noto_Serif_JP({ subsets: ["latin"], weight: ["500"], variable: "--font-jp", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: dict.meta.site.title[lang], template: "%s | Cha Jewels" },
    description: dict.meta.site.description[lang],
    openGraph: { type: "website", siteName: "Cha Jewels", locale: lang === "ja" ? "ja_JP" : "en_US", alternateLocale: [lang === "ja" ? "en_US" : "ja_JP"] },
    // NO `alternates` here. A literal one is inherited by every page in the
    // app, which is how every URL on this site came to declare itself the home
    // page. The canonical and hreflang links are rendered per request by
    // <SeoLinks /> below — see lib/page-meta.tsx for why they cannot go here.
  };
}

/**
 * NO BANNER ON /legal/*. The tokusho page is a statutory disclosure: the
 * Specified Commercial Transactions Act requires the required matters to be
 * displayed plainly and without anything competing for the reader, and the
 * neighbouring policy pages are read on the same terms. A marketing strip over
 * the top of one is exactly what that forbids.
 *
 * The path comes from the header the middleware sets, because a layout is never
 * told the pathname. NO HEADER MEANS NO BAR: a path the middleware did not
 * match is a path we cannot classify, and the safe answer to "is this the legal
 * notice?" is the one that cannot put a banner on it.
 */
const bannerAllowed = (path: string | null) =>
  !!path && path.startsWith("/") && path !== "/legal" && !path.startsWith("/legal/");

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, h] = await Promise.all([getLang(), headers()]);
  const t = tr(lang);
  // `announcement()` answers null for inactive, empty-in-this-language and
  // expired alike. CAUGHT, because the bar is chrome and this is the root
  // layout: an unreachable Hub must cost the strip, not every page on the site.
  // A page whose own content comes from the Hub still throws on its own read.
  const notice = bannerAllowed(h.get(PATH_HEADER)) ? await announcement(lang).catch(() => null) : null;
  // The Messenger button's link is the `messenger` row of the Hub's social row,
  // the same read the footer makes (lib/settings.ts caches it per request). No
  // row, or no Hub, means no button — chrome again, so the failure is caught.
  const messenger = await follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null);
  return (
    <html lang={lang} className={`${display.variable} ${sans.variable} ${jp.variable}`}>
      {/* The announcement bar's pre-paint script sets a data attribute here
          before React hydrates (components/site/announcement-bar.tsx), which is
          a mismatch React reports. Suppressed on <body> precisely because it
          carries nothing else: the same line on <html> would also silence a
          wrong `lang`. It covers this element's own attributes, not the tree. */}
      <body suppressHydrationWarning>
        {/* FIRST IN THE TREE, DELIBERATELY. React runs effects in tree order,
            and this component's effect is what creates `window.va` — the queue
            that `track()` needs to exist before it will record anything. Mounted
            after {children}, as it was until 2026-09-15, a page that reports an
            event from its own mount effect fired into an undefined `window.va`
            and the event was silently dropped: `product_view` never once
            appeared in production while `add_to_cart`, which fires from a click,
            always did. It renders nothing, so its position is free.
            lib/analytics.ts also waits for the queue, so this ordering is the
            fast path rather than the only defence. */}
        {/* Canonical + hreflang for THIS path. React hoists these into <head>.
            Rendered rather than returned as metadata because Next's resolver
            strips the query from any "/" URL — lib/page-meta.tsx explains. */}
        <SeoLinks />
        <AnalyticsProvider />
        {/* Web Vitals, behind the same gate and URL redaction as Analytics. */}
        <SpeedInsightsProvider />
        <a href="#main" className="absolute -left-[999px] top-2 z-50 bg-orange px-3 py-2 text-charcoal-deep focus:left-2">{t("nav", "skip")}</a>
        {/* Above the header and in normal flow, so it scrolls away and the
            sticky header takes the top once it has. */}
        {notice && <AnnouncementBar text={notice.text} href={notice.href} lang={lang} />}
        {/* Tells an entrance whether this render is the first page load or a
            client navigation (components/fx/boot-marker.tsx). Renders nothing. */}
        <BootMarker />
        <PageEnter />
        <Header lang={lang} />
        <Suspense fallback={null}><FlashNotice messages={{ signed_out: t("accountMenu", "signedOut") }} /></Suspense>
        <main id="main">{children}</main>
        <Footer lang={lang} />
        {messenger && <MessengerButton href={messenger} label={t("social", "messengerButton")} />}
      </body>
    </html>
  );
}

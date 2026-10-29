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
import { indexingFor } from "@/lib/seo-policy";
import { localePath, localizeAuthoredHref } from "@/lib/locale";
import { switchTargets } from "@/lib/locale-nav";
import { dict, tr, PATH_HEADER } from "@/lib/i18n";
import { headers } from "next/headers";
import { announcement, follow } from "@/lib/settings";
import { AnnouncementBar } from "@/components/site/announcement-bar";
import { MessengerButton } from "@/components/site/messenger-button";
import { MobileTabBar, type Tab } from "@/components/site/mobile-tab-bar";
import { layawayOffered } from "@/lib/layaway-availability";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { SpeedInsightsProvider } from "@/components/analytics/speed-insights-provider";
import { MetricoolTracker } from "@/components/analytics/metricool-tracker";
import { AdsTags } from "@/components/analytics/ads-tags";
import { ConsentBanner } from "@/components/site/consent-banner";
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
  const [lang, h] = await Promise.all([getLang(), headers()]);
  // Private and utility pages say so in the page itself (lib/seo-policy.ts).
  // A page that sets its own `robots` replaces this whole field, which is fine:
  // /search, /review and the unsubscribe pages already say noindex.
  const path = h.get(PATH_HEADER);
  const robots = path ? indexingFor(path) : null;
  return {
    ...(robots ? { robots } : {}),
    metadataBase: new URL(siteUrl()),
    title: { default: dict.meta.site.title[lang], template: "%s | Cha Jewels" },
    description: dict.meta.site.description[lang],
    openGraph: { type: "website", siteName: "Cha Jewels", locale: lang === "ja" ? "ja_JP" : "en_US", alternateLocale: [lang === "ja" ? "en_US" : "ja_JP"] },
    // NO `alternates` here. A literal one is inherited by every page in the
    // app, which is how every URL on this site came to declare itself the home
    // page. The canonical and hreflang links are rendered per request by
    // <SeoLinks /> below — see lib/page-meta.tsx for why they cannot go here.
    other: { google: "notranslate" },
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
 *
 * The rule itself is `announcementBarAllowed` in lib/statutory-path.ts, shared
 * with the cookie banner so the two cannot drift. It also recognises a locale
 * prefix (/en/legal/..., /ja/legal/...). Since 2026-10-28 the bar applies it to
 * the path on screen, which covers client-side navigation; the layout no longer
 * gates the read.
 */

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [lang, h] = await Promise.all([getLang(), headers()]);
  const t = tr(lang);
  // `announcement()` answers null for inactive, empty-in-this-language and
  // expired alike. CAUGHT, because the bar is chrome and this is the root
  // layout: an unreachable Hub must cost the strip, not every page on the site.
  // A page whose own content comes from the Hub still throws on its own read.
  //
  // READ ON EVERY PAGE, legal ones included, and shown by the bar itself only
  // where `announcementBarAllowed` says so for the path ON SCREEN: the root layout is not
  // re-rendered by a client-side navigation, so the decision has to travel with
  // the bar (components/site/announcement-bar.tsx). A legal page's server render
  // still holds no bar; a click from it back to the shop brings the bar back.
  const notice = await announcement(lang).catch(() => null);
  // Language-switcher destinations for this path (OD-7, lib/locale-nav.ts):
  // real links to the sibling page or the destination home; null keeps the
  // cookie toggle (private routes). Caught like the chrome reads around it —
  // a Hub hiccup on a blog post must cost the switcher's link, not the page.
  const targets = await switchTargets(h.get(PATH_HEADER)).catch(() => ({ en: null, ja: null } as const));
  // The Messenger button's link is the `messenger` row of the Hub's social row,
  // the same read the footer makes (lib/settings.ts caches it per request). No
  // row, or no Hub, means no button — chrome again, so the failure is caught.
  const messenger = await follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null);
  // The phone tab bar, on every page (site frame). Layaway is offered in
  // English only (lib/layaway-availability): the Japanese bar has four tabs.
  const tabs: Tab[] = [
    { href: localePath("/", lang), label: t("home", "tabHome"), icon: "home" },
    { href: localePath("/collections", lang), label: t("home", "tabPieces"), icon: "pieces" },
    // Phase 3: the English layaway page lives at /en/layaway (localePath; the
    // family is English-only, so this can never mint a Japanese layaway URL).
    ...(layawayOffered(lang) ? [{ href: localePath("/layaway", lang), label: t("home", "tabLayaway"), icon: "layaway" as const }] : []),
    { href: localePath("/loyalty", lang), label: t("home", "tabLoyalty"), icon: "loyalty" },
    { href: "/account", label: t("home", "tabAccount"), icon: "account" },
  ];
  // NO BROWSER TRANSLATION (owner decision 2026-10-16). Chrome's Translate
  // swaps React's text nodes for <font> elements; React then fails to find its
  // own nodes (removeChild NotFoundError) and the visitor gets Next's bare
  // "Application error" page. The site ships EN/JA itself, so the translate
  // attribute here and the `google` meta in generateMetadata() opt out.
  return (
    <html lang={lang} translate="no" className={`${display.variable} ${sans.variable} ${jp.variable}`}>
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
        {/* Meta Pixel + Google Ads tag: NOTHING loads until the visitor presses
            Accept on <ConsentBanner /> below, and never on a preview, in
            fixture mode, on localhost or on /account/* (the component's gates). */}
        <AdsTags />
        {/* Web Vitals, behind the same gate and URL redaction as Analytics. */}
        <SpeedInsightsProvider />
        {/* Metricool traffic statistics, production deployments only: local
            dev, fixture mode and every Vercel preview (develop included) never
            render it, so the script is not even requested there. The browser
            half of the gate and the URL rules are in the component. */}
        {process.env.NEXT_PUBLIC_VERCEL_ENV === "production" && process.env.NEXT_PUBLIC_PREVIEW_FIXTURES !== "1" && <MetricoolTracker />}
        <a href="#main" className="absolute -left-[999px] top-2 z-50 bg-orange px-3 py-2 text-charcoal-deep focus:left-2">{t("nav", "skip")}</a>
        {/* Above the header and in normal flow, so it scrolls away and the
            sticky header takes the top once it has. */}
        {notice && <AnnouncementBar text={notice.text} href={notice.href && localizeAuthoredHref(notice.href, lang)} lang={lang} nonce={h.get("x-nonce") ?? undefined} />}
        {/* Tells an entrance whether this render is the first page load or a
            client navigation (components/fx/boot-marker.tsx). Renders nothing. */}
        <BootMarker />
        <PageEnter />
        <Header lang={lang} switchTargets={targets} />
        <Suspense fallback={null}><FlashNotice messages={{ signed_out: t("accountMenu", "signedOut") }} /></Suspense>
        {/* data-messenger: the Hub's Messenger link, for app/error.tsx — a client
            error boundary that cannot read the Hub itself. */}
        <main id="main" data-messenger={messenger ?? undefined}>{children}</main>
        <Footer lang={lang} switchTargets={targets} />
        <MobileTabBar tabs={tabs} label={t("nav", "tabBar")} />
        {/* Last in the document, so no page chrome paints over it. */}
        {/* The cookie banner: asks once, and again from "Cookie settings" in the footer. */}
        <ConsentBanner privacyHref={localePath("/legal/privacy", lang)} copy={{ region: t("consent", "region"), title: t("consent", "title"), body: t("consent", "body"), accept: t("consent", "accept"), necessary: t("consent", "necessary"), privacy: t("consent", "privacy") }} />
        {messenger && <MessengerButton href={messenger} label={t("social", "messengerButton")} />}
      </body>
    </html>
  );
}

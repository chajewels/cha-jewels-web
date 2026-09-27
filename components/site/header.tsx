import Link from "next/link";
import { Info, Gem, CircleHelp, BookOpen, Megaphone, MessageCircle, Landmark, ArrowRight, User } from "lucide-react";
import { Suspense } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { getCollections } from "@/lib/queries/products";
import { hub } from "@/lib/hub-api";
import { collectionName, categoryName } from "@/lib/catalog-i18n";
import { COLLECTION_PLACEHOLDER } from "@/lib/collection-placeholders";
import { categoryMenu } from "@/lib/category-thumbs";
import { collectionCounts, pieceOfMonth, type PieceOfMonth } from "@/lib/frame-menu";
import { categoryBlurb } from "@/lib/content/frame";
import { COMPANY_PHONE, SECONDHAND_PERMIT_NO } from "@/lib/content/legal";
import { contactEmail, follow } from "@/lib/settings";
import { layawayOffered } from "@/lib/layaway-availability";
import { readSession, customerFirstName } from "@/lib/session";
import { formatMoney, formatYenPeso } from "@/lib/utils";
import { HubImage } from "@/components/media/hub-image";
import { SocialGlyph } from "./social-icons";
import { CategoryThumb } from "./category-thumb";
import { NavMenu, NavMenuItem, NavMenuTile } from "./nav-menu";
import { LangSwitcher } from "./lang-switcher";
import { SearchBox } from "./search-box";
import { MobileNav, type DrawerGroup } from "./mobile-nav";
import { CartButton } from "./cart-button";
import { AccountMenu } from "./account-menu";
import { HeaderShell } from "./header-shell";
import { NavUnderline } from "./nav-underline";

/**
 * THE SITE FRAME'S HEADER (build step 1, 2026-09-27; comps in
 * page-comps/site-frame). One chalk row, 64px on phones and 72px from `lg`.
 *
 *   left    badge + wordmark: the logo is the home link, so there is no
 *           "Home" item in the desktop nav (D1-3; the phone tab bar keeps Home)
 *   nav     Collections ▾, Company ▾, Layaway (English only), Loyalty,
 *           Wholesale — from `xl`, where it fits; below it the drawer carries
 *           the same list
 *   tools   search (a field from `lg`, a magnifier below), the JA/EN
 *           toggle (from `sm`; in the drawer below), Account (from `xl`; the
 *           tab bar and the drawer below), Cart, and the menu trigger below `xl`
 *
 * Below `sm` the row keeps four controls — logo, search, cart, menu — which is
 * what fits 360px without sideways scroll.
 *
 * Signed out, Account is a link to /account (which sends to sign-in itself).
 * Signed in, the customer's given name opens the account menu; the name
 * streams in through its own Suspense boundary, so no page waits on /me.
 * Signed-in state comes from the auth cookie only (lib/session.ts).
 *
 * THE MENUS ARE CHROME, SO THEY DEGRADE. Every Hub read is caught and bounded
 * (lib/frame-menu.ts, lib/category-thumbs.ts): a slow Hub costs a count, a
 * thumbnail or the feature tile, never the header.
 */
export async function Header({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const layaway = layawayOffered(lang);
  const [session, collections, categories, followLinks, email, featured] = await Promise.all([
    readSession(),
    getCollections().catch(() => []),
    hub.categories().catch(() => []),
    follow().catch(() => []),
    contactEmail().catch(() => null),
    pieceOfMonth(lang).catch(() => null),
  ]);
  const [counts, catMenu] = await Promise.all([
    collectionCounts(collections).catch(() => ({} as Record<string, number>)),
    categoryMenu(categories, lang).catch(() => ({} as Awaited<ReturnType<typeof categoryMenu>>)),
  ]);
  const messenger = followLinks.find((l) => l.key === "messenger")?.href ?? null;

  const fallbackName = t("accountMenu", "fallback");
  const name: React.ReactNode = session
    ? <Suspense fallback={fallbackName}><AccountName session={session} fallback={fallbackName} /></Suspense>
    : null;

  /** "3 pieces" in the page language, or null for none: an empty collection states nothing (D1-6). */
  const countText = (n: number | undefined) => (n && n > 0 ? t("navMenu", "count", { n: String(n) }) : null);
  const countLabel = (n: number | undefined) => (n && n > 0 ? t("navMenu", "countLabel", { n: String(n) }) : undefined);

  // Blog and News are the same route with different `type` filters. The key
  // is explicit because the two hrefs share a path and differ only by query.
  const companyItems = [
    { key: "about", href: "/about", label: t("navMenu", "about"), desc: t("navMenu", "aboutDesc"), icon: Info },
    { key: "why", href: "/why-cha-jewels", label: t("navMenu", "why"), desc: t("navMenu", "whyDesc"), icon: Gem },
    { key: "faq", href: "/faq", label: t("navMenu", "faq"), desc: t("navMenu", "faqDesc"), icon: CircleHelp },
    { key: "blog", href: "/blog", label: t("navMenu", "blog"), desc: t("navMenu", "blogDesc"), icon: BookOpen },
    { key: "news", href: "/blog?type=news", label: t("navMenu", "news"), desc: t("navMenu", "newsDesc"), icon: Megaphone },
    { key: "contact", href: "/contact", label: t("navMenu", "contact"), desc: t("navMenu", "contactDesc"), icon: MessageCircle },
    { key: "affiliations", href: "/affiliations", label: t("navMenu", "affiliations"), desc: t("navMenu", "affiliationsDesc"), icon: Landmark },
  ];

  // The Hub's own photo wins; the placeholder map covers a slug it has none
  // for; a slug in neither has no photo and the tile keeps its name.
  const typeItems = collections.map((c) => ({
    key: c.slug,
    href: `/collections/${c.slug}`,
    label: collectionName(c, lang),
    thumb: c.hero_media ?? COLLECTION_PLACEHOLDER[c.slug] ?? null,
    count: countText(counts[c.slug]),
    countLabel: countLabel(counts[c.slug]),
  }));
  // Every category has a thumbnail: the owner's Hub photo, else one real
  // in-stock piece, else a line icon (lib/category-thumbs.ts). Never a bundled
  // photo and never a brand logo (owner rule 2026-09-26).
  const categoryItems = categories.map((c) => {
    const entry = catMenu[c.slug];
    return {
      key: c.slug,
      href: `/categories/${c.slug}`,
      label: categoryName(c, lang),
      blurb: categoryBlurb(c.slug, lang),
      thumb: entry?.thumb ?? { kind: "icon" as const },
      count: countText(entry?.count),
      countLabel: countLabel(entry?.count),
    };
  });

  // The drawer: the same destinations, as disclosures and plain rows.
  const groups: DrawerGroup[] = [
    {
      key: "collections",
      label: t("navMenu", "collections"),
      tiles: typeItems.map(({ key, href, label, thumb }) => ({ key, href, label, thumb })),
      tilesHeading: t("navMenu", "shopByType"),
      rows: categoryItems.map(({ key, href, label, thumb, count, countLabel: cl }) => ({ key, href, label, media: <CategoryThumb slug={key} thumb={thumb} size={44} />, count, countLabel: cl })),
      rowsHeading: t("navMenu", "categories"),
      footer: { href: "/collections", label: t("navMenu", "viewAll") },
    },
    {
      key: "company",
      label: t("navMenu", "company"),
      rows: companyItems.map(({ key, href, label, icon: Icon }) => ({ key, href, label, media: <Icon aria-hidden="true" className="h-5 w-5 text-gold-dark" /> })),
    },
  ];

  const links: { href: string; label: string }[] = [
    // Layaway is offered in English only (owner decision 2026-09-15) — one
    // rule, in lib/layaway-availability; nothing layaway-related is visible on
    // the Japanese site.
    ...(layaway ? [{ href: "/layaway", label: t("nav", "layaway") }] : []),
    { href: "/loyalty", label: t("nav", "loyalty") },
    { href: "/wholesale", label: t("nav", "wholesale") },
  ];

  const accountItems = [
    { href: "/account", label: t("accountMenu", "myAccount") },
    { href: "/account/orders", label: t("accountMenu", "orders") },
    ...(layaway ? [{ href: "/account/layaway", label: t("accountMenu", "layaway") }] : []),
    { href: "/account/addresses", label: t("accountMenu", "addresses") },
    { href: "/account/service-requests", label: t("accountMenu", "service") },
    { href: "/account#loyalty", label: t("accountMenu", "points") },
  ];
  const account = session ? { name, menuLabel: t("accountMenu", "menu"), items: accountItems, signOut: t("accountMenu", "signOut") } : null;

  return (
    // HeaderShell (client) adds the scroll behaviour: flat chalk at the top,
    // frosted past 24px, hidden on the way down and back on the way up —
    // never while a menu is open or focus is inside. It is `sticky`, so it is
    // the containing block the full-width menu panels hang from.
    <HeaderShell className="sticky top-0 z-40 border-b border-hairline bg-chalk text-charcoal">
      <div className="wrap flex h-16 items-center justify-between gap-3 lg:h-[72px] xl:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap sm:gap-3" aria-label="Cha Jewels">
          <img src="/images/brand/logo-badge-96.webp" srcSet="/images/brand/logo-badge-96.webp 1x, /images/brand/logo-badge-192.webp 2x" width={44} height={44} alt="" className="h-10 w-10 shrink-0 lg:h-11 lg:w-11" />
          <span className="gilt font-display text-[22px] font-medium tracking-wide sm:text-[26px]">Cha Jewels</span>
        </Link>
        <nav aria-label={t("nav", "primary")} className="hidden h-full xl:block">
          <ul className="flex h-full items-stretch gap-7 whitespace-nowrap text-sm 2xl:gap-8">
            <li className="flex" data-match="/collections /categories /products">
              <NavMenu label={t("navMenu", "collections")} menuLabel={t("navMenu", "collectionsMenu")}>
                <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_minmax(0,0.95fr)] gap-10">
                  <div className="min-w-0">
                    <p className={eyebrow(lang)}>{t("navMenu", "shopByType")}</p>
                    <div className="mt-4 grid grid-cols-4 gap-x-3 gap-y-5">
                      {typeItems.map((it) => <NavMenuTile key={it.key} href={it.href} title={it.label} thumb={it.thumb} count={it.count} countLabel={it.countLabel} />)}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className={eyebrow(lang)}>{t("navMenu", "categories")}</p>
                    <div className="mt-4 border-t border-hairline">
                      {categoryItems.map((it) => (
                        <NavMenuItem key={it.key} href={it.href} title={it.label} description={it.blurb} media={<CategoryThumb slug={it.key} thumb={it.thumb} size={52} />} count={it.count} countLabel={it.countLabel} />
                      ))}
                    </div>
                    <Link role="menuitem" tabIndex={-1} href="/collections" className="mt-6 inline-flex min-h-11 items-center gap-2 border-b border-gold-dark text-sm font-medium text-gold-dark hover:text-charcoal-deep">
                      {t("navMenu", "viewAll")}<ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </div>
                  {featured ? <FeatureTile piece={featured} lang={lang} showReserve={layaway} /> : <div aria-hidden="true" />}
                </div>
              </NavMenu>
            </li>
            <li className="flex" data-match={companyItems.map((it) => it.href.split("?")[0]).join(" ")}>
              <NavMenu label={t("navMenu", "company")} menuLabel={t("navMenu", "companyMenu")}>
                <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-10">
                  <div className="min-w-0">
                    <p className={eyebrow(lang)}>{t("navMenu", "company")}</p>
                    <div className="mt-4 grid grid-cols-2 gap-x-8 border-t border-hairline">
                      {companyItems.map(({ key, href, label, desc, icon: Icon }) => (
                        <NavMenuItem key={key} href={href} title={label} description={desc} icon={<Icon className="h-5 w-5" />} />
                      ))}
                    </div>
                  </div>
                  <ContactCard lang={lang} email={email} messenger={messenger} />
                </div>
              </NavMenu>
            </li>
            {links.map((l) => (
              <li key={l.href} className="flex items-center" data-match={l.href}>
                <Link href={l.href} className="inline-flex min-h-11 items-center font-medium text-charcoal-deep hover:text-gold-dark">{l.label}</Link>
              </li>
            ))}
          </ul>
          <NavUnderline />
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          <SearchBox lang={lang} />
          <div className="hidden sm:block"><LangSwitcher lang={lang} /></div>
          <div className="hidden xl:block">
            {account
              ? <AccountMenu name={account.name} items={account.items} signOut={account.signOut} menuLabel={account.menuLabel} />
              : (
                <Link href="/account" className="inline-flex h-11 items-center gap-2 whitespace-nowrap px-1.5 text-sm font-medium text-charcoal-deep hover:text-gold-dark">
                  <User aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />{t("nav", "account")}
                </Link>
              )}
          </div>
          <CartButton lang={lang} />
          <MobileNav
            lang={lang}
            links={links}
            groups={groups}
            menuLabel={t("nav", "menu")}
            openLabel={t("nav", "openMenu")}
            closeLabel={t("nav", "closeMenu")}
            account={account}
            accountLink={{ href: "/account", label: t("nav", "account") }}
            messenger={messenger ? { href: messenger, label: t("social", "messengerButton") } : null}
            since={t("navMenu", "since")}
          />
        </div>
      </div>
    </HeaderShell>
  );
}

/** Menu eyebrow: Label size in gold-dark (4.59:1 on chalk); uppercase-tracked in English only. */
function eyebrow(lang: Lang) {
  return `text-[11px] font-semibold text-gold-dark ${lang === "en" ? "uppercase tracking-[0.14em]" : "tracking-[0.05em]"}`;
}

/**
 * THE PIECE OF THE MONTH (lib/frame-menu.ts decides which). One real piece on
 * the hero v3 stage: charcoal-deep, a warm light from above, the gold floor
 * line. Its exact name, its yen price in Pale Gilt with lining figures, and —
 * English only — the Hub's own down payment, both figures or none. The link
 * is gold, not orange: a menu is navigation.
 */
function FeatureTile({ piece, lang, showReserve }: { piece: PieceOfMonth; lang: Lang; showReserve: boolean }) {
  const t = tr(lang);
  const src = piece.photo.cutout?.url ?? piece.photo.url;
  return (
    <Link role="menuitem" tabIndex={-1} href={`/products/${piece.slug}`} data-surface="dark" className="group flex min-w-0 flex-col self-start bg-charcoal-deep p-6 text-chalk focus-visible:outline-offset-2">
      <span className={`flex items-center gap-3 text-[11px] font-semibold text-gold-pale ${lang === "en" ? "uppercase tracking-[0.14em]" : "tracking-[0.05em]"}`}>
        <span aria-hidden="true" className="h-px w-7 bg-gold" />{t("navMenu", "pieceOfMonth")}
      </span>
      <span className="relative mt-4 block aspect-[4/3] bg-[radial-gradient(90%_80%_at_50%_10%,#3a3226_0%,#222222_70%)]">
        <span className={`absolute inset-0 ${piece.photo.cutout ? "p-6" : "p-3"}`}>
          <HubImage src={src} alt="" width={320} height={240} sizes="320px" className="h-full w-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]" />
        </span>
        <span aria-hidden="true" className="absolute inset-x-[8%] bottom-[6%] h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
      </span>
      <span className="mt-4 block text-[13px] leading-snug text-chalk/85">{piece.name}</span>
      <span className="mt-2 block font-display text-[28px] leading-none text-gold-pale [font-variant-numeric:lining-nums_tabular-nums]">{formatMoney(piece.priceJpy)}</span>
      {showReserve && piece.downPayment && (
        <span className="mt-2 block text-xs text-chalk/75 [font-variant-numeric:lining-nums_tabular-nums]">{t("navMenu", "reserveFrom", { dp: formatYenPeso(piece.downPayment.jpy, piece.downPayment.php) })}</span>
      )}
      <span className="mt-4 inline-flex w-fit items-center gap-2 border-b border-gold-pale/70 pb-0.5 text-sm font-medium text-gold-pale group-hover:border-gold-pale">
        {t("navMenu", "viewPiece")}
      </span>
    </Link>
  );
}

/**
 * The Company menu's contact card: a dark ledger of the facts a customer
 * needs to reach a person — the Hub's contact email, the office phone, the
 * secondhand-dealer permit number — and a chalk-outline Messenger action (not orange: the
 * floating button already is the site's Messenger action, and neither is a
 * buy action). A missing Hub setting drops its row, never invents one.
 */
function ContactCard({ lang, email, messenger }: { lang: Lang; email: string | null; messenger: string | null }) {
  const t = tr(lang);
  const row = "flex items-baseline justify-between gap-4 border-b border-rule py-3 text-sm";
  return (
    <div data-surface="dark" className="band-dark min-w-0 bg-charcoal-deep p-6 text-chalk">
      <p className={`flex items-center gap-3 text-[11px] font-semibold text-gold-pale ${lang === "en" ? "uppercase tracking-[0.14em]" : "tracking-[0.05em]"}`}>
        <span aria-hidden="true" className="h-px w-7 bg-gold" />{t("navMenu", "since")}
      </p>
      <p className={`mt-3 text-[26px] leading-snug text-gold-pale ${lang === "ja" ? "font-jp font-medium" : "font-display"}`}>{t("navMenu", "contactHeading")}</p>
      <dl className="mt-5 border-t border-rule">
        {email && (
          <div className={row}>
            <dt className="text-chalk/75">{t("navMenu", "email")}</dt>
            <dd><a role="menuitem" tabIndex={-1} href={`mailto:${email}`} className="text-chalk hover:text-gold-pale">{email}</a></dd>
          </div>
        )}
        <div className={row}>
          <dt className="text-chalk/75">{t("navMenu", "phoneOffice")}</dt>
          <dd><a role="menuitem" tabIndex={-1} href={`tel:${COMPANY_PHONE.office.replaceAll("-", "")}`} className="text-chalk [font-variant-numeric:lining-nums_tabular-nums] hover:text-gold-pale">{COMPANY_PHONE.office}</a></dd>
        </div>
        <div className={row}>
          <dt className="text-chalk/75">{t("navMenu", "permit")}</dt>
          <dd className="text-chalk [font-variant-numeric:lining-nums_tabular-nums]">{t("navMenu", "permitNo", { n: SECONDHAND_PERMIT_NO })}</dd>
        </div>
      </dl>
      {messenger && (
        <a role="menuitem" tabIndex={-1} href={messenger} target="_blank" rel="noopener noreferrer" className="mt-5 flex min-h-12 items-center justify-center gap-2.5 rounded-sm border border-chalk/70 px-4 text-[15px] font-medium text-chalk hover:border-gold-pale hover:text-gold-pale">
          <SocialGlyph name="messenger" size={20} />{t("navMenu", "messengerAsk")}
        </a>
      )}
    </div>
  );
}

/** The customer's given name, resolved on its own clock (see the header comment). */
async function AccountName({ session, fallback }: { session: NonNullable<Awaited<ReturnType<typeof readSession>>>; fallback: string }) {
  const name = await customerFirstName(session).catch(() => null);
  return <>{name ?? fallback}</>;
}

import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { layawayOffered } from "@/lib/layaway-availability";
import { tr, type Lang } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hubMe } from "@/lib/session";
import { isNotLinked, profileUrl, withQuery } from "@/lib/profile";
import type { HubDraft, HubMe, HubOrder, HubTier } from "@/lib/types";
import { hub } from "@/lib/hub-api";
import { draftCompletePath } from "@/lib/drafts";
import { draftPieces, orderPieces, type PieceSummary } from "@/lib/account-pieces";
import { isClosedOrder, orderStatusLabel } from "@/lib/order-status";
import { isAwaitingConfirmation, isReadyForPayment } from "@/lib/reservation";
import { formatDeadline } from "@/lib/site-time";
import { formatMoney } from "@/lib/utils";
import { MemberGroups } from "@/components/loyalty/member-groups";
import { loyaltyGroups } from "@/lib/settings";
import { alertLight } from "@/lib/form-classes";
import { AccountShell, AccountTile } from "@/components/account/account-shell";
import { StatusBadge } from "@/components/account/status-badge";
import { PieceWell } from "@/components/commerce/commerce-ui";
import { Button } from "@/components/ui/button";
import type { Tone } from "@/lib/order-status";

export const generateMetadata = () => pageMeta("account");
// Customer data is per-request by definition; never cache this page.
export const dynamic = "force-dynamic";

/**
 * ACCOUNT HOME (build step 4; comp page-comps/account-signin "Account home").
 * In this order:
 *
 *   1. the CURRENT RESERVATION(S): open website orders staff have not
 *      confirmed (drafts), and orders reserved or waiting for a transfer —
 *      status, the exact Hub name, what happens next, an outline "View"
 *   2. LEVEL AND POINTS on the dark stage (id="loyalty", the menu's "Points &
 *      level"): the Hub's tier, multiplier and balance, read-only (D4-3), and
 *      the Hub's level ladder. No progress rule: that needs lifetime
 *      purchases and the next threshold from the Hub (D4-2, an API item) and
 *      is never worked out here.
 *   3. the customer's details and addresses
 *   4. the customer portal, with the live copy that says what it is for
 *
 * No orange on this page: nothing is bought here.
 */
export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [lang, sp, groups] = await Promise.all([getLang(), searchParams, loyaltyGroups()]);
  const t = tr(lang);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account");
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let me: HubMe | null = null;
  let failure: string | null = sp.link === "failed" ? "link" : null;
  let notLinked = false;
  if (jwt) {
    try { me = await hubMe(jwt); } catch (e) {
      // 404 not_linked = signed in, but no customer record yet. The profile
      // step can fix that; an "unavailable" notice here would be a dead end.
      if (isNotLinked(e)) notLinked = true;
      else failure = failure ?? "hub";
    }
  } else {
    failure = failure ?? "session";
  }
  // redirect() throws, so it stays outside the catch above.
  // `link` is dropped from `next`: it is the callback's "linking failed" flag,
  // and carrying it through would show that notice after the link succeeded.
  if (notLinked) {
    const rest = { ...sp };
    delete rest.link;
    redirect(profileUrl(withQuery("/account", rest)));
  }

  // What is happening now. Open drafts (the layaway ones only where layaway
  // is offered) and orders still reserved or waiting for a transfer. A failed
  // read only hides them.
  const [openDrafts, liveOrders, tiers] = jwt && me
    ? await Promise.all([
        hub.drafts(jwt).then(
          (ds) => ds.filter((d) => d.status === "to_confirm" && (d.mode === "full" || layawayOffered(lang))),
          () => [] as HubDraft[],
        ),
        hub.orders(jwt).then(
          (os) => os.filter((o) => !isClosedOrder(o) && (isAwaitingConfirmation(o) || payDue(o))),
          () => [] as HubOrder[],
        ),
        hub.loyaltyTiers().catch(() => [] as HubTier[]),
      ])
    : [[] as HubDraft[], [] as HubOrder[], [] as HubTier[]];
  const [draftLines, orderLines] = jwt
    ? await Promise.all([draftPieces(jwt, openDrafts, lang, 3), orderPieces(jwt, liveOrders, lang, 3)])
    : [new Map<string, PieceSummary>(), new Map<string, PieceSummary>()];

  const current: CurrentCard[] = [
    ...openDrafts.map((d): CurrentCard => ({
      key: d.id,
      href: draftCompletePath(d.id),
      reference: d.web_reference,
      status: { tone: "pending", text: t("draft", "statusWaiting") },
      note: d.mode === "layaway" ? t("draft", "layawayLede") : t("draft", "lede"),
      piece: draftLines.get(d.id) ?? null,
    })),
    ...liveOrders.map((o): CurrentCard => ({
      key: o.id,
      href: `/account/orders/${o.id}`,
      reference: o.web_reference ?? o.invoice_number ?? "—",
      status: orderStatusLabel(o, lang),
      note: isAwaitingConfirmation(o)
        ? t("orders", "reservedNote")
        : o.transfer_due_at ? `${t("account", "payBy")}: ${formatDeadline(o.transfer_due_at, lang)}` : null,
      piece: orderLines.get(o.id) ?? null,
    })),
  ].slice(0, 3);

  const name = me?.customer.full_name?.trim();
  const defaultAddress = me?.addresses.find((a) => a.is_default) ?? me?.addresses[0] ?? null;

  return (
    <AccountShell
      lang={lang}
      current="home"
      eyebrow={t("accountMenu", "myAccount")}
      title={name ? t("account", "welcome", { name }) : t("account", "h1")}
    >
      {failure && <p className={`mb-6 ${alertLight} p-5 text-sm`}>{t("account", "unavailable")}</p>}

      {me && (
        <div className="grid gap-4 sm:grid-cols-2">
          {current.length > 0 && (
            <section aria-labelledby="current-h" className="grid gap-3 sm:col-span-2">
              <h2 id="current-h" className="sr-only">{t("account", "currentH")}</h2>
              {current.map((c) => <CurrentReservation key={c.key} card={c} lang={lang} />)}
            </section>
          )}

          <div className="sm:col-span-2">
            <LevelCard me={me} tiers={tiers} lang={lang} />
          </div>

          {me.loyalty.enrolled && groups.length > 0 && (
            <AccountTile label={t("loyalty", "groupH")} className="sm:col-span-2">
              <MemberGroups items={groups} lang={lang} className="[&>h3]:sr-only" />
            </AccountTile>
          )}

          <AccountTile label={t("account", "profile")}>
            <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-5 gap-y-2 text-sm">
              <dt className="text-charcoal/75">{t("account", "name")}</dt><dd className="text-charcoal-deep">{me.customer.full_name ?? "—"}</dd>
              <dt className="text-charcoal/75">{t("account", "email")}</dt><dd className="break-all text-charcoal-deep">{me.customer.email ?? "—"}</dd>
              <dt className="text-charcoal/75">{t("account", "code")}</dt><dd className="cj-fig font-mono text-charcoal-deep">{me.customer.customer_code ?? "—"}</dd>
            </dl>
          </AccountTile>

          <AccountTile label={t("account", "addresses")}>
            {defaultAddress ? (
              <div className="text-sm text-charcoal-deep">
                {defaultAddress.is_default && <span className="mb-1.5 inline-block border border-gold-dark px-2 py-0.5 text-[11px] text-gold-dark">{t("account", "default")}</span>}
                <p>{defaultAddress.recipient_name ?? me.customer.full_name}</p>
                <p className="text-charcoal/80">{[defaultAddress.city, defaultAddress.region, defaultAddress.country].filter(Boolean).join(", ")}</p>
                {me.addresses.length > 1 && <p className="mt-1 text-[13px] text-charcoal/75">{t("account", "addressCount", { n: String(me.addresses.length) })}</p>}
              </div>
            ) : (
              <p className="text-sm text-charcoal/80">{t("account", "noAddresses")}</p>
            )}
            <Link href="/account/addresses" className="mt-auto inline-flex min-h-11 items-center self-start text-sm font-medium text-gold-dark underline-offset-4 hover:underline">{t("account", "seeAddresses")} →</Link>
          </AccountTile>

          {/*
            A SIGN-IN THAT FINDS NOTHING SAYS SO (2026-09-15). `records` counts
            this customer's orders and plans in the Hub. Zero has two different
            causes: a new customer, or history on a second record carrying the
            same email. The Hub also raises a staff notification for the second.
          */}
          {me.records && me.records.layaway === 0 && me.records.orders === 0 && (me.records.drafts ?? 0) === 0 && (
            <p className="border border-hairline bg-white p-5 text-sm leading-relaxed text-charcoal-deep sm:col-span-2">
              {me.shares_email ? t("account", "noRecordsShared") : t("account", "noRecords")}
            </p>
          )}

          {/* What the other surface is for. The link is the Hub's own builder,
              so a legacy customer gets their token and everyone else the bare URL. */}
          {me.portal_url && (
            <article className="band-dark flex flex-col gap-3 border border-charcoal-deep bg-charcoal-deep p-5 text-chalk sm:col-span-2 sm:p-[22px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-pale [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{t("account", "portalH")}</p>
              <p className="max-w-[70ch] text-sm leading-relaxed text-chalk/85">{t("account", "portalP")}</p>
              <Button asChild variant="outline" className="self-start border-chalk bg-chalk text-charcoal-deep hover:border-white hover:bg-white">
                <a href={me.portal_url} target="_blank" rel="noopener noreferrer">{t("plans", "portalCta")}</a>
              </Button>
              <p className="text-xs text-chalk/75">{t("plans", "portalFallback")}</p>
            </article>
          )}
        </div>
      )}
    </AccountShell>
  );
}

/** A transfer order the Hub says can be paid: payment details are showing on its page. */
const payDue = (o: HubOrder) => o.payment_status === "pending_transfer" && isReadyForPayment(o);

type CurrentCard = {
  key: string;
  href: string;
  reference: string;
  status: { tone: Tone; text: string };
  note: string | null;
  piece: PieceSummary | null;
};

function CurrentReservation({ card, lang }: { card: CurrentCard; lang: Lang }) {
  const t = tr(lang);
  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border border-hairline bg-white p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:gap-x-[18px] sm:p-5">
      <PieceWell image={card.piece?.image ?? null} alt={card.piece?.name ?? card.reference} className="w-[72px] sm:w-24" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <StatusBadge tone={card.status.tone} text={card.status.text} />
          <span className="cj-fig font-mono text-xs text-charcoal/75">{card.reference}</span>
        </div>
        {card.piece && (
          <p className="mt-2 font-display text-[16px] leading-snug text-charcoal-deep [font-variant-numeric:lining-nums] sm:text-[17px]">
            {card.piece.name}{card.piece.more > 0 ? ` +${card.piece.more}` : ""}
          </p>
        )}
        {card.note && <p className="mt-1 text-[13px] leading-relaxed text-charcoal/80">{card.note}</p>}
      </div>
      <Button asChild variant="outline" className="col-span-2 sm:col-span-1">
        <Link href={card.href}>{t("account", "viewOrder")}</Link>
      </Button>
    </article>
  );
}

/**
 * The level card (comp `.tier-card`): the Hub's tier, multiplier and points,
 * as sent — nothing computed — and the Hub's ladder with this level lit.
 */
function LevelCard({ me, tiers, lang }: { me: HubMe; tiers: HubTier[]; lang: Lang }) {
  const t = tr(lang);
  const L = me.loyalty;
  const label = "text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-pale [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]";
  const on = (tier: HubTier) => !!L.tier && tier.name.trim().toLowerCase() === L.tier.trim().toLowerCase();
  return (
    <section id="loyalty" aria-label={t("accountMenu", "points")} className="band-dark relative scroll-mt-24 bg-charcoal-deep p-5 text-chalk outline outline-1 -outline-offset-1 outline-gold/35 sm:p-[26px]">
      <span aria-hidden="true" className="cj-slab-rule" />
      {L.enrolled ? (
        <>
          <div className="flex flex-wrap justify-between gap-x-6 gap-y-5">
            <div>
              <p className={label}>{t("account", "yourLevel")}</p>
              <p className="mb-1 mt-2 font-display text-[32px] leading-none text-gold-pale sm:text-[40px]">{L.tier ?? "—"}</p>
              {L.multiplier !== null && (
                <p className="text-[13px] text-chalk/80">{t("account", "pointsRate", { n: t("loyalty", "times", { n: String(L.multiplier) }) })}</p>
              )}
            </div>
            <div className="sm:text-right">
              <p className={label}>{t("account", "points")}</p>
              <p className="cj-fig mb-1 mt-2 font-display text-[32px] leading-none text-gold-pale sm:text-[40px]">{L.points.toLocaleString("en-US")}</p>
              <p className="text-[13px] text-chalk/80">{t("account", "pointsYen")}</p>
            </div>
          </div>

          {/* LIFETIME PURCHASES AND THE NEXT LEVEL (D4-2). Every figure is
              the Hub's — lifetime_jpy and to_next_jpy come worked out; no bar is
              drawn, because its width would be a percentage computed here. */}
          {typeof L.lifetime_jpy === "number" && (
            <p className="cj-fig mt-5 flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-chalk/20 pt-3 text-[13px] text-chalk/85">
              <span>{t("loyalty", "threshold")} {formatMoney(L.lifetime_jpy, "JP")}</span>
              {L.next_tier && typeof L.to_next_jpy === "number" ? (
                <span className="text-gold-pale">{t("account", "toNext", { tier: L.next_tier, amount: formatMoney(L.to_next_jpy, "JP") })}</span>
              ) : L.next_tier === null && L.tier && L.reduced !== true ? (
                <span className="text-gold-pale">{t("account", "topLevel")}</span>
              ) : null}
            </p>
          )}

          {L.reduced === true && (
            <div className="mt-5 border border-gold/45 p-4 text-sm" data-testid="level-reduced">
              <p className="font-medium text-gold-pale">{t("account", "levelReduced")}</p>
              <p className="mt-1 leading-relaxed text-chalk/85">{t("account", "levelReducedP")}</p>
              <dl className="mt-3 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-5 gap-y-1.5">
                {L.earned_tier && <><dt className="text-chalk/75">{t("account", "earnedLevel")}</dt><dd>{L.earned_tier}</dd></>}
                {typeof L.regain_jpy === "number" && <><dt className="text-chalk/75">{t("account", "regain")}</dt><dd className="cj-fig">{formatMoney(L.regain_jpy, "JP")}</dd></>}
              </dl>
            </div>
          )}

          {tiers.length > 0 && (
            <ol className="mt-6 grid grid-cols-2 gap-y-4 border-t border-chalk/20 sm:grid-cols-4">
              {tiers.map((tier) => (
                <li key={tier.slug} aria-current={on(tier) ? "true" : undefined} className="relative pr-3 pt-3.5 text-[12.5px] leading-relaxed text-chalk/75">
                  <span aria-hidden="true" className={`absolute -top-[5px] left-0 h-[9px] w-[9px] rounded-full border ${on(tier) ? "border-gold-pale bg-gold-pale" : "border-gold bg-[#17140f]"}`} />
                  <b className={`block font-display text-[17px] font-normal leading-tight ${on(tier) ? "text-gold-pale" : "text-chalk"}`}>{tier.name}</b>
                  <span className="cj-fig">{tier.threshold_jpy === 0 ? t("loyalty", "onJoining") : `${formatMoney(tier.threshold_jpy, "JP")}+`}</span>
                  {tier.multiplier !== null && <><br />{t("account", "points")} {t("loyalty", "times", { n: String(tier.multiplier) })}</>}
                </li>
              ))}
            </ol>
          )}

          <p className="mt-5 text-[13px] leading-relaxed text-chalk/80">
            {t("account", "levelRule")} {t("account", "pointsSpend")}{" "}
            <Link href="/loyalty" className="text-gold-pale underline underline-offset-4">{t("nav", "loyalty")}</Link>
          </p>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={label}>{t("account", "loyalty")}</p>
            <p className="mt-2 text-[15px] text-chalk/90">{t("account", "notEnrolled")}</p>
          </div>
          <Button asChild variant="outline" className="border-chalk/70 text-chalk hover:border-chalk hover:text-chalk">
            <Link href="/loyalty">{t("nav", "loyalty")}</Link>
          </Button>
        </div>
      )}
    </section>
  );
}

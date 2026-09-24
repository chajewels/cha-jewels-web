import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { REGISTERED_PATH, isAlreadyRegistered, isProfileRequired, profileUrl } from "@/lib/profile";
import { readCart, hydrateCart, cartSubtotal } from "@/lib/cart";
import { CheckoutFlow } from "@/components/commerce/checkout-flow";
import { Button } from "@/components/ui/button";
import { agreementStatusAction } from "@/lib/checkout-actions";
import type { HubAddress, HubMe, HubQuote } from "@/lib/types";

export const generateMetadata = () => pageMeta("checkout");
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: {
  searchParams: Promise<{ mode?: string; quote?: string }>;
}) {
  // The rate is read here so the Delivery step can show peso figures at once.
  // null when the Hub has no rate — the flow then keeps dashes; it never guesses.
  const [lang, lines, params, fx] = await Promise.all([getLang(), readCart(), searchParams, hub.fx().catch(() => null)]);
  // Reserve on a product page lands here with ?mode=layaway pre-selected. It is
  // only the step's starting position — the shopper can still switch, and the
  // Hub prices whichever they end on.
  const initialMode = params.mode === "layaway" ? "layaway" : "full";
  // COMING BACK FROM SIGNING THE AGREEMENT.
  //
  // The signing page is another site, so a customer who follows it in the same
  // tab loses the whole step machine — step, term, currency and quote live in
  // React state and nothing else. `?quote=` is how they get back to Review
  // instead of Step 1, and it is read HERE, server-side, the same way `?mode=`
  // already is. `middleware.ts` keeps the query string across a sign-in bounce,
  // so it survives a session that lapsed while they were away.
  //
  // The common path never needs this: the signing link opens in a new tab, so
  // the checkout tab is still sitting on Review untouched. This is the recovery.
  const returningQuoteId = typeof params.quote === "string" ? params.quote.trim() : "";
  const t = tr(lang);

  // middleware also gates /checkout, but a page that reads customer data must
  // not depend on it: the gate decides what to render, the Hub decides what is
  // allowed.
  const supabase = await supabaseServer();
  // Both read the same cookies; getUser also asks GoTrue. Neither needs the other.
  const [{ data: auth }, { data: sessionData }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
  if (!auth?.user) redirect("/login?next=/checkout");
  const jwt = sessionData.session?.access_token;

  // EVERYTHING BELOW IS INDEPENDENT, SO IT RUNS AT ONCE. Until 2026-09-18 these
  // were five awaits in a row — cart, link, /me, quote, signing record — and the
  // ?quote= return from the signing page paid for each one in turn. The only
  // real dependency is /me after authCustomer (the link must exist before /me
  // can read it), and that pair stays chained inside its own slot.
  //
  // A customer who has never opened /account has no customers row yet, so link
  // first. authCustomer is idempotent. This is also what guarantees the loyalty
  // box has a customer record to attach to — by the time it renders, the row
  // exists and carries this customer's verified email.
  //
  // REHYDRATION. The quote is fetched by id, not re-taken: the signature the
  // customer just gave is keyed on THIS quote id, so a fresh quote would orphan
  // it. A quote that is gone (spent, expired, or never theirs) yields null and
  // the flow simply starts at Step 1, which is the honest outcome — the cart is
  // still in the cookie, so nothing they chose is lost except the pricing.
  //
  // The agreement status is read in the same pass so Review can say "signed",
  // with the version and date, without a client round trip on first paint. It
  // is NOT the gate: payLayawayAction re-checks before the plan is created.
  //
  // THE LINK HAS TWO ANSWERS THAT STOP CHECKOUT (2026-09-24): no customer holds
  // her email (422 profile_required → the profile step, then back here) and her
  // details match an existing customer (409 already_registered → the notice).
  // Any other link failure is today's behaviour: /me below reports it.
  type LinkOutcome = "ok" | "profile" | "registered";
  const linked: Promise<LinkOutcome> = jwt
    ? hub.authCustomer(jwt).then(
        (): LinkOutcome => "ok",
        (e): LinkOutcome => (isProfileRequired(e) ? "profile" : isAlreadyRegistered(e) ? "registered" : "ok"),
      )
    : Promise.resolve("ok");
  const [{ items }, [link, me], initialQuote, agreementResult] = await Promise.all([
    hydrateCart(lines),
    linked.then(async (l): Promise<[LinkOutcome, HubMe | null]> =>
      [l, jwt && l === "ok" ? await hub.me(jwt).catch(() => null) : null]),
    jwt && returningQuoteId ? hub.quoteById(jwt, returningQuoteId).catch(() => null) : Promise.resolve(null),
    jwt && returningQuoteId ? agreementStatusAction(returningQuoteId) : Promise.resolve(null),
  ]);

  // redirect() throws, so these sit outside every catch above. `next` keeps the
  // query string (?mode=, ?quote=) the same way middleware's sign-in bounce does.
  if (link === "profile") {
    const qs = new URLSearchParams();
    if (params.mode) qs.set("mode", params.mode);
    if (params.quote) qs.set("quote", params.quote);
    const q = qs.toString();
    redirect(profileUrl(`/checkout${q ? `?${q}` : ""}`));
  }
  if (link === "registered") redirect(REGISTERED_PATH);

  if (items.length === 0) {
    return (
      <section className="py-[clamp(48px,7vw,96px)]">
        <div className="wrap max-w-[720px]">
          <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("checkout", "h1")}</h1>
          <p className="mt-8 text-charcoal">{t("checkout", "emptyCart")}</p>
          <Button asChild variant="ghost" className="mt-6"><Link href="/collections">{t("cart", "browse")}</Link></Button>
        </div>
      </section>
    );
  }

  // Whether to offer the loyalty box. A member must see nothing at all, so the
  // default is "do not offer": if /me cannot be read we cannot tell a member
  // from a non-member, and showing the box to someone already enrolled is the
  // worse of the two mistakes.
  const addresses: HubAddress[] = me?.addresses ?? [];
  const offerLoyalty = me?.loyalty?.enrolled === false;

  // A failed lookup leaves this null: Review then shows the signing step again
  // rather than claiming a signature nobody could confirm. Only meaningful when
  // the quote itself was found.
  const initialAgreement: { signed: boolean; version: string | null; signed_at: string | null } | null =
    initialQuote && agreementResult && agreementResult.ok ? agreementResult.data : null;

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("checkout", "h1")}</h1>
        <div className="mt-10">
          <CheckoutFlow lang={lang} items={items} subtotal={cartSubtotal(items)} initialAddresses={addresses} initialMode={initialMode} offerLoyalty={offerLoyalty} initialQuote={initialQuote} initialAgreement={initialAgreement} jpyPhp={fx?.jpy_php ?? null} />
        </div>
      </div>
    </section>
  );
}

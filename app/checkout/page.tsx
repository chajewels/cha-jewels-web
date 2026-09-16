import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { readCart, hydrateCart, cartSubtotal } from "@/lib/cart";
import { CheckoutFlow } from "@/components/commerce/checkout-flow";
import { Button } from "@/components/ui/button";
import type { HubAddress } from "@/lib/types";

export const generateMetadata = () => pageMeta("checkout");
export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const [lang, lines, params] = await Promise.all([getLang(), readCart(), searchParams]);
  // Reserve on a product page lands here with ?mode=layaway pre-selected. It is
  // only the step's starting position — the shopper can still switch, and the
  // Hub prices whichever they end on.
  const initialMode = params.mode === "layaway" ? "layaway" : "full";
  const t = tr(lang);

  // middleware also gates /checkout, but a page that reads customer data must
  // not depend on it: the gate decides what to render, the Hub decides what is
  // allowed.
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/checkout");

  const { items } = await hydrateCart(lines);
  if (items.length === 0) {
    return (
      <section className="py-[clamp(48px,7vw,96px)]">
        <div className="wrap max-w-[720px]">
          <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("checkout", "h1")}</h1>
          <p className="mt-8 text-champagne/75">{t("checkout", "emptyCart")}</p>
          <Button asChild variant="ghost" className="mt-6"><Link href="/collections">{t("cart", "browse")}</Link></Button>
        </div>
      </section>
    );
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;
  let addresses: HubAddress[] = [];
  // Whether to offer the loyalty box. A member must see nothing at all, so the
  // default is "do not offer": if /me cannot be read we cannot tell a member
  // from a non-member, and showing the box to someone already enrolled is the
  // worse of the two mistakes.
  let offerLoyalty = false;
  if (jwt) {
    // A customer who has never opened /account has no customers row yet, so
    // link first. authCustomer is idempotent. This is also what guarantees the
    // loyalty box has a customer record to attach to — by the time it renders,
    // the row exists and carries this customer's verified email.
    try { await hub.authCustomer(jwt); } catch { /* /me below reports the failure */ }
    try {
      const me = await hub.me(jwt);
      addresses = me.addresses;
      offerLoyalty = me.loyalty?.enrolled === false;
    } catch { addresses = []; }
  }

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("checkout", "h1")}</h1>
        <div className="mt-10">
          <CheckoutFlow lang={lang} items={items} subtotal={cartSubtotal(items)} initialAddresses={addresses} initialMode={initialMode} offerLoyalty={offerLoyalty} />
        </div>
      </div>
    </section>
  );
}

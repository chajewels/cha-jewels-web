import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";

export const generateMetadata = () => pageMeta("layaway");
export const dynamic = "force-dynamic";

/**
 * Placeholder until Phase 2 step 4 (layaway checkout + plans from the Hub).
 * Exists so the account menu never points at a 404; gated like every
 * /account page.
 */
export default async function AccountLayawayPage() {
  const lang = await getLang();
  const t = tr(lang);
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account/layaway");

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[900px]">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("account", "layawayH")}</h1>
          <Link href="/account" className="text-sm text-champagne/60 underline underline-offset-4">{t("account", "h1")}</Link>
        </div>
        <p className="mt-8 max-w-[58ch] border border-rule bg-velvet-deep p-5 text-sm text-champagne/85">{t("account", "layawaySoon")}</p>
        <Link href="/layaway" className="mt-8 inline-block text-gold-pale underline underline-offset-4">{t("account", "layawayLearn")}</Link>
      </div>
    </section>
  );
}

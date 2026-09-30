import { redirect } from "next/navigation";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { ConfirmSignIn } from "@/components/account/confirm-sign-in";
import { AboutLogoVideo } from "@/components/fx/about-logo-video";

export const generateMetadata = () => pageMeta("login");
export const dynamic = "force-dynamic";

/**
 * Where the sign-in email now lands. Shows one button; the token is exchanged
 * only when it is pressed (lib/auth-actions.ts). Rendering this page spends
 * nothing, so a mail scanner that follows the link changes nothing.
 *
 * Older emails still carry GoTrue's verify URL and arrive at /auth/callback,
 * which keeps working as before.
 */
export default async function ConfirmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [lang, q] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const tokenHash = one(q.token_hash).trim();
  const type = one(q.type).trim();
  const rawNext = one(q.next) || "/account";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";
  if (!tokenHash || !type) redirect(`/login?error=missing_code&next=${encodeURIComponent(next)}`);

  // The logo film heads this page too (owner decision 2026-10-01): the sign
  // turns to face the customer as she arrives, then holds; the button is
  // hers to press whenever she likes — the film never delays the sign-in.
  return (
    <section className="py-[clamp(40px,6vw,88px)]">
      <div className="wrap grid max-w-[880px] items-center gap-8 sm:grid-cols-[minmax(0,300px)_minmax(0,1fr)] sm:gap-12">
        <AboutLogoVideo alt={t("about", "logoAlt")} sizes="(min-width: 640px) 300px, 100vw" className="w-full max-w-[300px] rounded-sm" />
        <div className="max-w-[46ch]">
          <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("account", "confirmH")}</h1>
          <p className="mt-4 text-charcoal">{t("account", "confirmP")}</p>
          <ConfirmSignIn tokenHash={tokenHash} type={type} next={next} lang={lang} />
        </div>
      </div>
    </section>
  );
}

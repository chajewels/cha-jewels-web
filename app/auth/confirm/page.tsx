import { redirect } from "next/navigation";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { safeNext } from "@/lib/safe-next";
import { ConfirmSignIn } from "@/components/account/confirm-sign-in";
import { AboutLogoVideo } from "@/components/fx/about-logo-video";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";

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
  const next = safeNext(rawNext);
  if (!tokenHash || !type) redirect(`/login?error=missing_code&next=${encodeURIComponent(next)}`);

  // The logo film heads this page too (owner decision 2026-10-01): the sign
  // turns to face the customer as she arrives, then holds; the button is
  // hers to press whenever she likes — the film never delays the sign-in.
  return (
    <div className="iac-shell">
      <PageHead title={t("account", "confirmH")} lead={t("account", "confirmP")} />
      <PageSection>
        <div className="iac-plate iac-sheet lm-rise grid max-w-[880px] items-center gap-8 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] sm:gap-12">
          <AboutLogoVideo alt={t("about", "logoAlt")} sizes="(min-width: 640px) 260px, 100vw" className="w-full max-w-[260px] rounded-[22px]" />
          <ConfirmSignIn tokenHash={tokenHash} type={type} next={next} lang={lang} />
        </div>
      </PageSection>
    </div>
  );
}

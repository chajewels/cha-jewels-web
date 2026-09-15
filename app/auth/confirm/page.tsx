import { redirect } from "next/navigation";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { ConfirmSignIn } from "@/components/account/confirm-sign-in";

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

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[46ch]">
        <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("account", "confirmH")}</h1>
        <p className="mt-4 text-champagne/75">{t("account", "confirmP")}</p>
        <ConfirmSignIn tokenHash={tokenHash} type={type} next={next} lang={lang} />
      </div>
    </section>
  );
}

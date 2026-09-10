import type { Metadata } from "next";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { LoginForm } from "@/components/account/login-form";

export const metadata: Metadata = { title: "サインイン / Sign in" };

export default async function LoginPage() {
  const lang = await getLang();
  const t = tr(lang);
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[46ch]">
        <h1 className="text-[clamp(32px,4.4vw,56px)]">{t("account", "loginH")}</h1>
        <p className="mt-4 text-champagne/75">{t("account", "loginP")}</p>
        <div className="mt-8"><LoginForm lang={lang} /></div>
      </div>
    </section>
  );
}

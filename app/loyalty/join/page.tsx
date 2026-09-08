import type { Metadata } from "next";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { JoinForm } from "@/components/loyalty/join-form";
export const metadata: Metadata = { title: "入会 / Join" };
export default async function JoinPage() {
  const lang = await getLang();
  const t = tr(lang);
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap grid gap-12 md:grid-cols-2">
        <div><h1 className="text-[clamp(36px,5.5vw,80px)]">{t("loyalty", "joinH")}</h1><p className="mt-5 max-w-[48ch] text-champagne/80">{t("loyalty", "joinP")}</p><p className="mt-4 max-w-[48ch] text-champagne/60">{t("loyalty", "lede")}</p></div>
        <JoinForm lang={lang} />
      </div>
    </section>
  );
}

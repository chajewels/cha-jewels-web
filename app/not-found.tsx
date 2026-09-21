import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
export default async function NotFound() {
  const t = tr(await getLang());
  return <section className="py-32"><div className="wrap"><h1 className="text-5xl">{t("notFound", "h1")}</h1><p className="mt-4 text-charcoal">{t("notFound", "p")} <Link className="text-gold-dark underline" href="/">{t("notFound", "back")}</Link>.</p></div></section>;
}

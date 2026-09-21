import type { Metadata } from "next";
import Link from "next/link";
import { hub } from "@/lib/hub-api";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

/**
 * noindex: this URL is only ever reached from a link in an email, it carries a
 * token, and there is nothing here for a crawler to find.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Unsubscribe, on load.
 *
 * The Hub answers `unsubscribed` whatever the token was — live, spent or
 * nonsense — and this page says the same thing in every case, including when
 * the call itself fails. The page exists to end the relationship; making
 * someone who clicked "unsubscribe" read an error and wonder whether it worked
 * is the one outcome worth designing out.
 */
export default async function UnsubscribePage({
  searchParams,
}: { searchParams: Promise<{ token?: string | string[] }> }) {
  const [lang, sp] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);
  const raw = sp.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  // Fire and forget the outcome: nothing below it branches on the answer.
  if (token) { try { await hub.unsubscribe(token); } catch { /* see the note above */ } }

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[52ch]">
        <h1 className="text-[clamp(28px,3.6vw,44px)]">{t("newsletter", "unsubscribed")}</h1>
        <Link href="/" className="mt-6 inline-block text-gold-dark underline underline-offset-4">
          {t("nav", "home")}
        </Link>
      </div>
    </section>
  );
}

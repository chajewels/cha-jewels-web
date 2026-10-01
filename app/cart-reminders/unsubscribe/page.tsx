import type { Metadata } from "next";
import Link from "next/link";
import { hub } from "@/lib/hub-api";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

/** noindex: reached only from the link in a cart reminder email; it carries a token. */
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Stop cart reminders, on load — the same shape as /newsletter/unsubscribe.
 *
 * The Hub answers `unsubscribed` whatever the token was, and this page says
 * the same thing in every case, including when the call itself fails. It
 * touches ONLY the cart-reminder consent: order emails and payment reminders
 * continue, and the page says so.
 */
export default async function CartRemindersUnsubscribePage({
  searchParams,
}: { searchParams: Promise<{ token?: string | string[] }> }) {
  const [lang, sp] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);
  const raw = sp.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  if (token) { try { await hub.cartRemindersUnsubscribe(token); } catch { /* see the note above */ } }

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[52ch]">
        <h1 className="text-[clamp(28px,3.6vw,44px)]">{t("cartReminders", "unsubscribed")}</h1>
        <p className="mt-4 text-charcoal-deep">{t("cartReminders", "unsubscribedNote")}</p>
        <Link href="/" className="mt-6 inline-block text-gold-dark underline underline-offset-4">
          {t("nav", "home")}
        </Link>
      </div>
    </section>
  );
}

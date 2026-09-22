import { tr, type Lang } from "@/lib/i18n";
import type { SocialLink } from "@/lib/types";
import { SocialIcons } from "@/components/site/social-icons";

/**
 * "Join the member group": the three member-only chat groups.
 *
 * Rendered ONLY for a customer GET /me reports as `loyalty.enrolled` — the
 * callers decide that; this block never checks anything itself, so it can sit
 * inside a server page or the client JoinButton alike. Light tone: every
 * surface it appears on is a white card.
 *
 * The links are a PROP rather than a module import, because they are now read
 * from the Hub (lib/settings.ts, which is server-only) and one of the callers
 * is a client component. Every caller resolves them on the server and hands
 * them down, so there is still exactly one place the list comes from.
 */
export function MemberGroups({ items, lang, className = "" }: { items: SocialLink[]; lang: Lang; className?: string }) {
  const t = tr(lang);
  // No groups in the Hub is no block at all — a heading and an invitation over
  // an empty row is worse than saying nothing.
  if (items.length === 0) return null;
  return (
    <div className={className}>
      <h3 className="font-display text-lg text-charcoal-deep">{t("loyalty", "groupH")}</h3>
      <p className="mt-1 text-sm text-charcoal/70">{t("loyalty", "groupP")}</p>
      <SocialIcons items={items} tone="light" lang={lang} className="mt-3" />
    </div>
  );
}

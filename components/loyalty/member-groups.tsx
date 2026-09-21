import { tr, type Lang } from "@/lib/i18n";
import { LOYALTY_GROUPS } from "@/lib/social";
import { SocialIcons } from "@/components/site/social-icons";

/**
 * "Join the member group": the three member-only chat groups.
 *
 * Rendered ONLY for a customer GET /me reports as `loyalty.enrolled` — the
 * callers decide that; this block never checks anything itself, so it can sit
 * inside a server page or the client JoinButton alike. Light tone: every
 * surface it appears on is a white card.
 */
export function MemberGroups({ lang, className = "" }: { lang: Lang; className?: string }) {
  const t = tr(lang);
  return (
    <div className={className}>
      <h3 className="font-display text-lg text-charcoal-deep">{t("loyalty", "groupH")}</h3>
      <p className="mt-1 text-sm text-charcoal/70">{t("loyalty", "groupP")}</p>
      <SocialIcons items={LOYALTY_GROUPS} tone="light" lang={lang} className="mt-3" />
    </div>
  );
}

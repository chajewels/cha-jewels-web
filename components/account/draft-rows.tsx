import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";
import { draftCompletePath } from "@/lib/drafts";
import { StatusBadge } from "@/components/account/status-badge";
import { siteDay } from "@/lib/site-time";
import type { HubDraft } from "@/lib/types";

/**
 * WEBSITE ORDERS (storefront PR 7): the customer's drafts — checkouts staff
 * have not confirmed yet, and ones that ended without an order — as rows in the
 * account lists. Each opens the draft page. The caller filters (listableDraft,
 * the layaway gate); this only renders. Nothing when there are none.
 */
export function DraftRows({ drafts, lang }: { drafts: HubDraft[]; lang: Lang }) {
  if (drafts.length === 0) return null;
  // Waiting and closed drafts get their own headings: a declined or lapsed
  // one listed under "Waiting for confirmation" read as still pending
  // (owner acceptance test, 2026-09-30).
  const waiting = drafts.filter((d) => d.status === "to_confirm");
  const closed = drafts.filter((d) => d.status !== "to_confirm");
  return (
    <>
      <DraftGroup drafts={waiting} lang={lang} heading="waitingH" />
      <DraftGroup drafts={closed} lang={lang} heading="closedH" />
    </>
  );
}

function DraftGroup({ drafts, lang, heading }: { drafts: HubDraft[]; lang: Lang; heading: "waitingH" | "closedH" }) {
  if (drafts.length === 0) return null;
  const t = tr(lang);
  return (
    <div className="mt-10">
      <h2 className="mb-3 text-xs uppercase tracking-[0.14em] text-charcoal/70">{t("draft", heading)}</h2>
      <ul className="rule-grid grid gap-px" data-testid="draft-rows">
        {drafts.map((d) => {
          const badge = d.status === "to_confirm"
            ? { tone: "pending" as const, text: t("draft", "statusWaiting") }
            : d.status === "declined"
            ? { tone: "dead" as const, text: t("draft", "statusDeclined") }
            : { tone: "dead" as const, text: t("draft", "statusExpired") };
          return (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-4 bg-white p-5">
              <div>
                <p className="font-mono text-gold-dark">{d.web_reference}</p>
                <p className="mt-1 text-xs text-charcoal/70">{t("orders", "placed")} {siteDay(d.created_at)}</p>
              </div>
              <StatusBadge tone={badge.tone} text={badge.text} />
              {/* Provisional, and never gold once closed (the list's own rule). */}
              <p className={`font-display text-xl ${badge.tone === "dead" ? "text-charcoal/70" : "text-gold-dark"}`}>
                {formatMoney(Number(d.total_after_points ?? d.total), d.currency)}
              </p>
              <Link href={draftCompletePath(d.id)} className="text-sm text-gold-dark underline underline-offset-4">
                {t("draft", "view")}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

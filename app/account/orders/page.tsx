import { pageMeta } from "@/lib/page-meta";
import { siteDay } from "@/lib/site-time";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isNotLinked, profileUrl, withQuery } from "@/lib/profile";
import { getLang } from "@/lib/i18n-server";
import { tr, type Lang } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase/server";
import { hub } from "@/lib/hub-api";
import { formatMoney } from "@/lib/utils";
import { isClosedOrder, refundLabel, type Tone } from "@/lib/order-status";
import { orderRowStatus } from "@/lib/order-display";
import { StatusBadge } from "@/components/account/status-badge";
import type { HubDraft, HubOrder } from "@/lib/types";
import { draftCompletePath, listableDraft } from "@/lib/drafts";
import { draftPieces, orderPieces, type PieceSummary } from "@/lib/account-pieces";
import { AccountShell } from "@/components/account/account-shell";
import { PieceWell } from "@/components/commerce/commerce-ui";
import { alertLight } from "@/lib/form-classes";

export const generateMetadata = () => pageMeta("orders");
export const dynamic = "force-dynamic";

/**
 * ORDERS (build step 4; comp page-comps/account-signin "Orders"): one ledger
 * — thumbnail, the exact Hub name, reference, date, status, total — with the
 * website orders staff have not confirmed yet (drafts) first. Stacked rows on
 * phones. Orders arranged with us directly are listed too, as before; theirs
 * carry no lines, so the row shows the reference alone.
 *
 * Every figure is the Hub's, in the order's own currency. A closed row is
 * never gold (the badge's tone decides), and a cancelled one keeps its reason
 * and refund decision under the badge.
 */
export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [lang, query] = await Promise.all([getLang(), searchParams]);
  const t = tr(lang);

  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account/orders");
  const { data: sessionData } = await supabase.auth.getSession();
  const jwt = sessionData.session?.access_token;

  let orders: HubOrder[] = [];
  let drafts: HubDraft[] = [];
  let failed = false;
  if (jwt) {
    // Website orders still waiting for confirmation (storefront PR 7). A failed
    // read only hides them; the orders themselves still show.
    drafts = (await hub.drafts(jwt).catch(() => [] as HubDraft[])).filter((d) => d.mode === "full" && listableDraft(d));
    try { orders = await hub.orders(jwt); } catch (e) {
      // Signed in, no customer record yet: the profile step, not an error.
      if (isNotLinked(e)) redirect(profileUrl(withQuery("/account/orders", query)));
      failed = true;
    }
  } else {
    failed = true;
  }

  const [draftLines, orderLines] = jwt
    ? await Promise.all([draftPieces(jwt, drafts, lang), orderPieces(jwt, orders, lang)])
    : [new Map<string, PieceSummary>(), new Map<string, PieceSummary>()];

  const rows: Row[] = [
    ...drafts.map((d): Row => {
      const status = d.status === "to_confirm"
        ? { tone: "pending" as const, text: t("draft", "statusWaiting") }
        : d.status === "declined"
        ? { tone: "dead" as const, text: t("draft", "statusDeclined") }
        : { tone: "dead" as const, text: t("draft", "statusExpired") };
      return {
        key: `d-${d.id}`, href: draftCompletePath(d.id), reference: d.web_reference,
        date: siteDay(d.created_at), status, note: null,
        total: formatMoney(Number(d.total), d.currency), piece: draftLines.get(d.id) ?? null,
        fallback: t("orders", "orderRef", { ref: d.web_reference }),
      };
    }),
    ...orders.map((o): Row => {
      // S3: the method she chose, and "being checked" while a payment is (the Hub's list fields).
      const status = orderRowStatus(o, lang);
      return {
        key: o.id, href: `/account/orders/${o.id}`, reference: o.web_reference ?? o.invoice_number ?? "—",
        date: siteDay(o.order_date ?? o.created_at), status,
        // A cancelled or expired order stays in the list; the reason and the
        // refund decision sit under its badge so the customer need not open it.
        note: isClosedOrder(o) ? [o.cancellation_reason, refundLabel(o.refund_status, lang)].filter(Boolean).join(" · ") || null : null,
        total: formatMoney(Number(o.total_amount), o.currency), piece: orderLines.get(o.id) ?? null,
        fallback: o.source_channel === "hub_manual" ? t("orders", "arrangedShort") : t("orders", "orderRef", { ref: o.web_reference ?? o.invoice_number ?? "—" }),
      };
    }),
  ];

  return (
    <AccountShell lang={lang} current="orders" eyebrow={t("accountMenu", "orders")} title={t("orders", "h1")}>
      {failed && <p className={`mb-6 ${alertLight} p-5 text-sm`}>{t("account", "unavailable")}</p>}

      {!failed && rows.length === 0 && (
        <p className="border border-hairline bg-white p-5 text-charcoal-deep">
          {t("orders", "empty")}{" "}
          <Link href="/collections" className="text-gold-dark underline underline-offset-4">{t("draft", "shop")}</Link>
        </p>
      )}

      {rows.length > 0 && <Ledger rows={rows} lang={lang} />}

      {!failed && <p className="mt-4 text-[13px] leading-relaxed text-charcoal/80">{t("orders", "directToo")}</p>}
    </AccountShell>
  );
}

type Row = {
  key: string; href: string; reference: string; date: string;
  status: { tone: Tone; text: string }; note: string | null; total: string; piece: PieceSummary | null;
  /** What the row says when there is no piece to name. */
  fallback: string;
};

function Ledger({ rows, lang }: { rows: Row[]; lang: Lang }) {
  const t = tr(lang);
  const th = "px-[18px] py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]";
  return (
    <table className="w-full border-collapse border border-hairline bg-white text-sm">
      <thead className="max-sm:hidden">
        <tr className="border-b border-hairline">
          <th className={th}><span className="sr-only">{t("orders", "items")}</span></th>
          <th className={th}>{t("orders", "items")}</th>
          <th className={th}>{t("orders", "reference")}</th>
          <th className={th}>{t("orders", "placed")}</th>
          <th className={th}>{t("orders", "status")}</th>
          <th className={`${th} text-right`}>{t("orders", "total")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const dead = r.status.tone === "dead";
          return (
            <tr key={r.key} className="relative border-b border-hairline last:border-b-0 max-sm:grid max-sm:grid-cols-[56px_minmax(0,1fr)] max-sm:gap-x-3.5 max-sm:gap-y-1 max-sm:p-3.5">
              <td className="w-[88px] py-[18px] pl-[18px] align-middle max-sm:row-span-4 max-sm:w-auto max-sm:p-0">
                <PieceWell image={r.piece?.image ?? null} alt={r.piece?.name ?? r.reference} className="w-14" />
              </td>
              <td className="px-[18px] py-[18px] align-middle max-sm:p-0">
                {/* The whole row opens the order; the name is the link a screen reader lands on. */}
                <Link href={r.href} className="block max-w-[44ch] leading-normal text-charcoal-deep [font-variant-numeric:lining-nums] after:absolute after:inset-0 hover:underline">
                  {r.piece ? <>{r.piece.name}{r.piece.more > 0 ? ` +${r.piece.more}` : ""}</> : <span className="text-charcoal/80">{r.fallback}</span>}
                </Link>
              </td>
              <td className="cj-fig whitespace-nowrap px-[18px] py-[18px] align-middle font-mono text-[13px] text-charcoal-deep max-sm:p-0 max-sm:text-xs max-sm:text-charcoal/75">
                {r.reference}<span className="sm:hidden"> · {r.date}</span>
              </td>
              <td className="cj-fig whitespace-nowrap px-[18px] py-[18px] align-middle text-charcoal-deep max-sm:hidden">{r.date}</td>
              <td className="px-[18px] py-[18px] align-middle max-sm:p-0">
                <StatusBadge tone={r.status.tone} text={r.status.text} />
                {r.note && <p className="mt-1 max-w-[32ch] text-xs text-charcoal/75">{r.note}</p>}
              </td>
              <td className={`cj-fig whitespace-nowrap px-[18px] py-[18px] text-right align-middle font-display text-[18px] max-sm:col-start-2 max-sm:p-0 max-sm:text-left ${dead ? "text-charcoal/70" : "text-charcoal-deep"}`}>
                {r.total}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

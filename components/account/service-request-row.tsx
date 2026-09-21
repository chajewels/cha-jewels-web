import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { serviceKindLabel, serviceRequestHref, serviceStatusLabel } from "@/lib/service-requests";
import type { ServiceRequest } from "@/lib/types";
import { StatusBadge } from "@/components/account/status-badge";

/**
 * One request as a list row. Shared by the form's own list under an order or
 * plan and by the all-requests page; `showTarget` adds the link back to the
 * order or plan, which the page under that very order does not need.
 *
 * The date is the ISO day, not a locale string: this renders inside a client
 * component too, and a locale/time-zone render on the server that differs from
 * the browser's is a hydration mismatch. The orders list does the same.
 */
export function ServiceRequestRow({ request, lang, showTarget = false }: { request: ServiceRequest; lang: Lang; showTarget?: boolean }) {
  const t = tr(lang);
  const status = serviceStatusLabel(request.status, lang);
  const target = showTarget ? serviceRequestHref(request) : null;
  return (
    <li className="bg-white p-5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-charcoal-deep">
            {serviceKindLabel(request.kind, lang)}
            {request.item_title ? <span className="text-charcoal/70"> · {request.item_title}</span> : null}
          </p>
          <p className="mt-1 text-xs text-charcoal/70">
            {t("service", "requestedOn", { date: request.created_at.slice(0, 10) })}
            {request.ring_size ? ` · ${t("service", "ringSize")} ${request.ring_size}` : ""}
          </p>
        </div>
        <StatusBadge tone={status.tone} text={status.text} />
      </div>
      {request.details && <p className="mt-3 whitespace-pre-line text-charcoal">{request.details}</p>}
      {/* Staff's answer, set apart so it reads as a reply rather than as more of the request. */}
      {request.customer_note && (
        <div className="mt-3 border-l-2 border-gold-dark pl-3">
          <p className="text-xs uppercase tracking-[0.14em] text-charcoal/70">{t("service", "noteFrom")}</p>
          <p className="mt-1 whitespace-pre-line text-charcoal-deep">{request.customer_note}</p>
        </div>
      )}
      {target && (
        <Link href={target.href} className="mt-3 inline-block text-gold-dark underline underline-offset-4">
          {t("service", target.kind === "order" ? "viewOrder" : "viewPlan")}
        </Link>
      )}
    </li>
  );
}

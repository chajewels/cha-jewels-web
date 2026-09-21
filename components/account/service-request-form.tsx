"use client";

import { useRef, useState, useTransition } from "react";
import { createServiceRequestAction } from "@/lib/service-actions";
import { tr, type Lang } from "@/lib/i18n";
import { DETAILS_MAX, RING_SIZE_MAX, SERVICE_KINDS, needsRingSize, serviceKindLabel } from "@/lib/service-requests";
import { trackServiceRequest } from "@/lib/analytics";
import type { ServiceRequest, ServiceRequestKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ServiceRequestRow } from "@/components/account/service-request-row";

/** The order or the plan the request is raised against — exactly one. */
export type ServiceTarget = { cash_order_id: string } | { layaway_plan_id: string };

/**
 * "Request a service" under an order's or a plan's items, with the requests
 * already raised there listed beneath it.
 *
 * The form asks for the kind, optionally which line it concerns, the ring size
 * (a resize only), and the details. Submission goes through a Server Action so
 * the customer JWT stays on the server; the Hub decides whether the order is
 * theirs. On success the stored row is put at the top of the list at once and
 * the page is revalidated behind it, so a reload shows the same thing.
 *
 * `canRequest` is false on a closed order or plan — cancelled, expired,
 * forfeited — where asking for work on the piece makes no sense. Requests
 * already raised are still listed; with none, the section renders nothing.
 */
export function ServiceRequestForm({ lang, target, items, initial, canRequest }: {
  lang: Lang;
  target: ServiceTarget;
  /** The order's lines: `value` is the English title the Hub stores, `label` the title in the page's language. */
  items: { value: string; label: string }[];
  initial: ServiceRequest[];
  canRequest: boolean;
}) {
  const t = tr(lang);
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState<ServiceRequestKind | "">("");
  const [requests, setRequests] = useState<ServiceRequest[]>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (!canRequest && requests.length === 0) return null;

  const errorCopy = (code: string, requestId?: string | null) => {
    const base =
      code === "details_required" || code === "details_too_long" ? t("service", "errDetails")
      : code === "ring_size_required" || code === "ring_size_too_long" ? t("service", "errRingSize")
      : code === "signed_out" ? t("service", "errSignedOut")
      : t("service", "errFailed");
    // The Hub's request id, so a failure on screen can be matched to its log line.
    return requestId && !["details_required", "details_too_long", "ring_size_required", "ring_size_too_long", "signed_out"].includes(code)
      ? `${base} ${t("service", "ref", { id: requestId })}`
      : base;
  };

  function submit(form: FormData) {
    setError(null);
    setSent(false);
    start(async () => {
      const res = await createServiceRequestAction(form);
      if (!res.ok) { setError(errorCopy(res.code, res.requestId)); return; }
      setRequests((rows) => [res.data, ...rows.filter((r) => r.id !== res.data.id)]);
      setSent(true);
      formRef.current?.reset();
      setKind("");
      // Counted only once the request has actually been stored — never from the click.
      trackServiceRequest(res.data.kind, lang);
    });
  }

  const field = "mt-1 w-full border border-hairline bg-charcoal-deep px-3 py-2 text-charcoal-deep";

  return (
    <section className="mt-12" aria-labelledby="service-request-h">
      <h2 id="service-request-h" className="font-display text-xl text-gold-pale">{t("service", canRequest ? "formH" : "listH")}</h2>

      {canRequest && (
        <>
          <p className="mt-2 max-w-[60ch] text-sm text-charcoal/70">{t("service", "formP")}</p>

          {error && (
            <p role="alert" className="mt-4 border border-garnet/60 bg-charcoal-deep p-4 text-sm text-charcoal-deep">{error}</p>
          )}
          {sent && !error && (
            <p role="status" className="mt-4 border border-gold px-4 py-3 text-sm text-gold-pale">{t("service", "success")}</p>
          )}

          {/* An action, not a record: the print stylesheet (app/globals.css) drops
              .print-hide, so the statement keeps the requests list below without
              the form that creates them. */}
          <form ref={formRef} action={submit} className="print-hide mt-6 grid gap-4 border border-hairline p-5 sm:grid-cols-2">
            {"cash_order_id" in target
              ? <input type="hidden" name="cash_order_id" value={target.cash_order_id} />
              : <input type="hidden" name="layaway_plan_id" value={target.layaway_plan_id} />}

            <label className="text-sm text-charcoal/70">
              {t("service", "kind")} <span className="text-gold-pale">*</span>
              <select
                name="kind" required value={kind}
                onChange={(e) => setKind(e.target.value as ServiceRequestKind | "")}
                className={field}
              >
                <option value="" disabled>—</option>
                {SERVICE_KINDS.map((k) => <option key={k} value={k}>{serviceKindLabel(k, lang)}</option>)}
              </select>
            </label>

            {/* Only when the order carries lines; a Hub-arranged order usually does not. */}
            {items.length > 0 && (
              <label className="text-sm text-charcoal/70">
                {t("service", "item")}
                <select name="item_title" defaultValue="" className={field}>
                  <option value="">{t("service", "itemAny")}</option>
                  {items.map((it, i) => <option key={`${it.value}-${i}`} value={it.value}>{it.label}</option>)}
                </select>
              </label>
            )}

            {kind !== "" && needsRingSize(kind) && (
              <label className="text-sm text-charcoal/70">
                {t("service", "ringSize")} <span className="text-gold-pale">*</span>
                <input name="ring_size" required maxLength={RING_SIZE_MAX} autoComplete="off" className={field} />
                <span className="mt-1 block text-[11px] text-charcoal/70">{t("service", "ringSizeHint")}</span>
              </label>
            )}

            <label className="text-sm text-charcoal/70 sm:col-span-2">
              {t("service", "details")} <span className="text-gold-pale">*</span>
              <textarea name="details" required rows={4} maxLength={DETAILS_MAX} className={field} />
              <span className="mt-1 block text-[11px] text-charcoal/70">{t("service", "detailsHint")}</span>
            </label>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? t("service", "submitting") : t("service", "submit")}
              </Button>
            </div>
          </form>
        </>
      )}

      {canRequest && <h3 className="mt-8 text-xs uppercase tracking-[0.14em] text-charcoal/70">{t("service", "listH")}</h3>}
      {requests.length === 0 ? (
        <p className="mt-3 text-sm text-charcoal/70">{t("service", "emptyHere")}</p>
      ) : (
        <ul className="rule-grid mt-3 grid gap-px">
          {requests.map((r) => <ServiceRequestRow key={r.id} request={r} lang={lang} />)}
        </ul>
      )}
    </section>
  );
}

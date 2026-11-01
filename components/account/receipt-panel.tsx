"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FileDown } from "lucide-react";
import { type Lang } from "@/lib/i18n-core";
import { trOf } from "@/lib/i18n-client";
import { receipts as receiptsDict } from "@/lib/i18n/sections/receipts";
import { ADDRESSEE_MAX, PURPOSE_MAX, receiptErrorKey, receiptPdfHref, type HubReceipt, type ReceiptLang } from "@/lib/receipts";
import { updateReceiptDetailsAction } from "@/lib/receipt-actions";
import { alertLight, inputLight } from "@/lib/form-classes";
import { Button } from "@/components/ui/button";

/**
 * ONE RECEIPT — on the order or plan page and on /account/receipts.
 *
 * Shows the Hub's receipt number, issue date and amount; lets her set the
 * addressee and purpose line and pick the PDF's language;
 * Download fetches the PDF through this site's server. The Hub marks every
 * download after the first REISSUED, so the page says so before she
 * presses it, and asks her to save unsaved changes first. A cancelled receipt
 * is explained and cannot be downloaded. Every figure is the Hub's,
 * preformatted by the server page.
 */
export function ReceiptPanel({ lang, receipt, issuedLabel, totalLabel, orderHref, orderPath, headingLevel = 2 }: {
  lang: Lang;
  receipt: HubReceipt;
  issuedLabel: string;
  totalLabel: string;
  /** "View order" link — on the receipts list only. */
  orderHref?: { href: string; label: string } | null;
  /** The page to refresh after saving (the order or plan page). */
  orderPath?: string;
  headingLevel?: 2 | 3;
}) {
  const t = trOf({ receipts: receiptsDict }, lang);
  const [saved, setSaved] = useState({ addressee: receipt.addressee ?? "", purpose: receipt.purpose ?? "" });
  const [addressee, setAddressee] = useState(saved.addressee);
  const [purpose, setPurpose] = useState(saved.purpose);
  const [pdfLang, setPdfLang] = useState<ReceiptLang>("ja");
  const [downloads, setDownloads] = useState(receipt.downloads);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const issued = receipt.status === "issued";
  const dirty = addressee.trim() !== saved.addressee.trim() || purpose.trim() !== saved.purpose.trim();
  const H = headingLevel === 2 ? "h2" : "h3";
  const field = `mt-1 w-full px-3 py-2 text-sm ${inputLight}`;

  function save(form: FormData) {
    setError(null);
    setDone(false);
    start(async () => {
      const res = await updateReceiptDetailsAction(form);
      if (!res.ok) {
        const key = receiptErrorKey(res.code);
        setError(t("receipts", key, { max: String(key === "errTooLongPurpose" ? PURPOSE_MAX : ADDRESSEE_MAX) }));
        return;
      }
      const next = { addressee: res.data.addressee ?? "", purpose: res.data.purpose ?? "" };
      setSaved(next);
      setAddressee(next.addressee);
      setPurpose(next.purpose);
      setDone(true);
    });
  }

  return (
    <section className="print-hide mt-6 border border-hairline bg-white p-5 sm:p-6" aria-labelledby={`receipt-${receipt.id}`} data-testid="receipt-panel">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <H id={`receipt-${receipt.id}`} className="font-display text-[22px] text-charcoal-deep">{t("receipts", "panelH")}</H>
        <span className={`inline-flex items-center gap-2 border px-3 py-1 text-xs ${issued ? "border-gold-dark text-gold-dark" : "border-charcoal/40 text-charcoal/75"}`} data-testid="receipt-status">
          {t("receipts", issued ? "statusIssued" : "statusCancelled")}
        </span>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <Kv k={t("receipts", "number")}><span className="cj-fig font-mono text-[13px]">{receipt.receipt_number}</span></Kv>
        <Kv k={t("receipts", "issued")}><span className="cj-fig">{issuedLabel}</span></Kv>
        <Kv k={t("receipts", "order")}><span className="cj-fig font-mono text-[13px]">{receipt.order_number}</span></Kv>
        <Kv k={t("receipts", "total")}><span className="cj-fig font-display text-[19px]">{totalLabel}</span></Kv>
      </dl>

      {orderHref && (
        <p className="mt-3 text-[13px]">
          <Link href={orderHref.href} className="inline-flex min-h-11 items-center font-medium text-gold-dark underline underline-offset-4">{orderHref.label} →</Link>
        </p>
      )}

      {!issued ? (
        <p className="mt-4 text-sm text-charcoal/80" data-testid="receipt-cancelled-note">{t("receipts", "cancelledNote")}</p>
      ) : (
        <>
          {error && <p role="alert" className={`mt-4 ${alertLight} p-3 text-sm`}>{error}</p>}
          {done && !error && <p role="status" className="mt-4 border border-gold-dark px-3 py-2 text-sm text-gold-dark">{t("receipts", "saved")}</p>}

          <form action={save} className="mt-5 grid gap-4 border-t border-hairline pt-5 sm:grid-cols-2">
            <input type="hidden" name="receipt_id" value={receipt.id} />
            {orderPath && <input type="hidden" name="order_path" value={orderPath} />}
            <label className="text-sm text-charcoal/70">
              {t("receipts", "addressee")}
              <input name="addressee" value={addressee} onChange={(e) => setAddressee(e.target.value)} maxLength={ADDRESSEE_MAX} autoComplete="organization" className={field} data-testid="receipt-addressee" />
              <span className="mt-1 block text-[12px] text-charcoal/70">{t("receipts", "addresseeHelp", { max: String(ADDRESSEE_MAX) })}</span>
            </label>
            <label className="text-sm text-charcoal/70">
              {t("receipts", "purpose")}
              <input name="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={PURPOSE_MAX} autoComplete="off" className={field} data-testid="receipt-purpose" />
              <span className="mt-1 block text-[12px] text-charcoal/70">{t("receipts", "purposeHelp", { max: String(PURPOSE_MAX) })}</span>
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" variant="outline" disabled={pending || !dirty} className="min-h-11">
                {pending ? t("receipts", "saving") : t("receipts", "save")}
              </Button>
            </div>
          </form>

          <div className="mt-5 border-t border-hairline pt-5">
            <fieldset>
              <legend className="text-sm text-charcoal/70">{t("receipts", "language")}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["ja", "en"] as const).map((l) => (
                  <label key={l} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 border px-4 text-sm ${pdfLang === l ? "border-gold-dark text-charcoal-deep" : "border-charcoal/30 text-charcoal/80"}`}>
                    <input type="radio" name={`pdf-lang-${receipt.id}`} value={l} checked={pdfLang === l} onChange={() => setPdfLang(l)} className="accent-[#8A6B12]" />
                    {t("receipts", l === "ja" ? "langJa" : "langEn")}
                  </label>
                ))}
              </div>
            </fieldset>

            <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-charcoal/80" data-testid="receipt-reissue-note">
              {downloads > 0 ? t("receipts", "reissueNote", { n: String(downloads) }) : t("receipts", "firstNote")}
            </p>

            {dirty ? (
              <p className="mt-3 text-[13px] text-charcoal-deep" data-testid="receipt-save-first">{t("receipts", "saveFirst")}</p>
            ) : (
              // A plain link to this site's route: the browser saves the file and the page stays.
              <a
                href={receiptPdfHref(receipt.id, pdfLang)}
                onClick={() => setDownloads((n) => n + 1)}
                className="mt-3 inline-flex h-11 items-center justify-center gap-2 bg-charcoal-deep px-5 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-charcoal [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]"
                data-testid="receipt-download"
              >
                <FileDown aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                {t("receipts", "download")}
              </a>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Kv({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{k}</dt>
      <dd className="mt-1 text-charcoal-deep">{children}</dd>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { paidyProfileAction } from "@/lib/paidy-actions";
import type { PaidyRequirements } from "@/lib/types";

/**
 * P05 (owner 2026-10-08): what Paidy still needs from the buyer herself,
 * shown on her order page when she chose Paidy and the Hub reports a
 * requirement missing. Names and the Japanese mobile are saved through the
 * Hub (`PUT /me/paidy-profile`, which validates and 400-names the field); a
 * Japanese billing address is set in her address book (default entry). The
 * Hub decides whether Paidy is then offered — this form only collects.
 */
export function PaidyProfileForm({ orderId, requirements, lang }: { orderId: string; requirements: PaidyRequirements; lang: Lang }) {
  const t = tr(lang);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // QA 2026-10-08: her input survives a refusal (the form used to reset), and
  // the mobile she already has is pre-filled when it is the Japanese one.
  const [familyName, setFamilyName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [mobile, setMobile] = useState(requirements.jp_mobile ? (requirements.mobile_number ?? "") : "");
  const [busy, startTransition] = useTransition();
  const needsFields = !requirements.family_name || !requirements.given_name || !requirements.jp_mobile;
  const needsAddress = !requirements.jp_billing_address;
  const field = "mt-1 block h-11 w-full border border-hairline bg-white px-3 text-[15px] text-charcoal-deep focus:border-gold-dark focus:outline-none";
  const label = "block text-xs uppercase tracking-[0.14em] text-charcoal/70 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]";
  const errorText = (code: string) =>
    code === "family_name_required" ? t("paidy", "errFamilyName")
    : code === "given_name_required" ? t("paidy", "errGivenName")
    : code === "jp_mobile_required" ? t("paidy", "errJpMobile")
    : t("paidy", "errSaveFailed");

  const submit = (form: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await paidyProfileAction(form);
      if (r.ok) { router.refresh(); return; }
      setError(errorText(r.code));
    });
  };

  return (
    <div className="mb-6 border border-gold-dark bg-white p-5" data-testid="paidy-profile">
      <h2 className="font-display text-lg text-charcoal-deep">{t("paidy", "needsTitle")}</h2>
      <p className="mt-2 text-sm text-charcoal/80">{t("paidy", "needsBody")}</p>
      <ul className="mt-3 space-y-1 text-sm text-charcoal-deep" data-testid="paidy-requirements">
        <li data-ok={requirements.jp_billing_address}>{requirements.jp_billing_address ? "✓" : "–"} {t("paidy", "reqAddress")}</li>
        <li data-ok={requirements.jp_mobile}>{requirements.jp_mobile ? "✓" : "–"} {t("paidy", "reqMobile")}</li>
        <li data-ok={requirements.family_name && requirements.given_name}>{requirements.family_name && requirements.given_name ? "✓" : "–"} {t("paidy", "reqNames")}</li>
      </ul>
      {needsAddress && (
        <p className="mt-4 text-sm">
          <Link href="/account/addresses" className="text-gold-dark underline underline-offset-4 hover:text-charcoal-deep">{t("paidy", "setAddress")}</Link>
        </p>
      )}
      {needsFields && (
        <form action={submit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="hidden" name="order_id" value={orderId} />
          <label className={label}>{t("paidy", "familyName")}
            <input name="family_name" required maxLength={60} autoComplete="family-name" className={field} value={familyName} onChange={(e) => setFamilyName(e.target.value)} />
          </label>
          <label className={label}>{t("paidy", "givenName")}
            <input name="given_name" required maxLength={60} autoComplete="given-name" className={field} value={givenName} onChange={(e) => setGivenName(e.target.value)} />
          </label>
          <label className={`${label} sm:col-span-2`}>{t("paidy", "jpMobile")}
            <input name="mobile_number" type="tel" required inputMode="tel" placeholder="090-1234-5678" autoComplete="tel" className={field} value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </label>
          {error && <p role="alert" className="text-sm text-[#9b2c2c] sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center bg-charcoal-deep px-5 text-[13px] font-medium uppercase tracking-[0.12em] text-white transition hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-50 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">
              {busy ? t("paidy", "saving") : t("paidy", "save")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

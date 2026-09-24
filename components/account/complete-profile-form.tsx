"use client";

import { useState, useTransition } from "react";
import { completeProfileAction } from "@/lib/profile-actions";
import { COUNTRIES, type LocationType } from "@/lib/countries";
import { tr, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { alertLight, errorLight, inputLight, labelLight } from "@/lib/form-classes";

/**
 * "Complete your profile": the Hub New Customer modal's fields, in its order,
 * minus staff-only Notes. Email is the signed-in address, shown read-only —
 * the Hub takes it from the verified JWT, never from this form.
 *
 * Validation is the Hub's: full name required; country required (and shown)
 * only when the location is International. It runs here for the message and
 * again in completeProfileAction, which is the authority.
 *
 * The inputs are controlled and the form is never reset, so a failed submit
 * keeps everything she typed.
 * Success and "already registered" are redirects from the action.
 */
export function CompleteProfileForm({ lang, email, next }: { lang: Lang; email: string; next: string }) {
  const t = tr(lang);
  const [pending, start] = useTransition();
  const [fullName, setFullName] = useState("");
  const [locationType, setLocationType] = useState<LocationType>("japan");
  const [country, setCountry] = useState("");
  const [facebookName, setFacebookName] = useState("");
  const [messengerLink, setMessengerLink] = useState("");
  const [mobile, setMobile] = useState("");
  const [fieldError, setFieldError] = useState<{ fullName?: string; country?: string }>({});
  const [error, setError] = useState<string | null>(null);

  const errorCopy = (code: string, requestId?: string | null) => {
    if (code === "signed_out") return t("profile", "errSignedOut");
    const base = t("profile", "errFailed");
    return requestId ? `${base} ${t("profile", "ref", { id: requestId })}` : base;
  };

  // onSubmit, NOT <form action>: React resets a form after every action, which
  // put the DOM back to Japan / the first country while state still said
  // International — so the screen and the next submit disagreed (seen in local
  // testing 2026-09-24). Her input must survive a failed submit untouched.
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    const errs: { fullName?: string; country?: string } = {};
    if (!fullName.trim()) errs.fullName = t("profile", "errFullName");
    if (locationType === "international" && !country) errs.country = t("profile", "errCountry");
    setFieldError(errs);
    if (errs.fullName || errs.country) return;
    start(async () => {
      const res = await completeProfileAction(form);
      // Reached only on failure: success and already-registered redirect.
      if (res && !res.ok) {
        if (res.code === "full_name_required") setFieldError({ fullName: t("profile", "errFullName") });
        else if (res.code === "country_required") setFieldError({ country: t("profile", "errCountry") });
        else setError(errorCopy(res.code, res.requestId));
      }
    });
  }

  const field = `mt-1 w-full px-3 py-2 ${inputLight}`;
  const label = `text-sm ${labelLight}`;
  const req = <span className="text-gold-dark" aria-hidden="true">*</span>;
  const opt = <span className="text-[11px]">{t("profile", "optional")}</span>;

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-5 border border-hairline bg-white p-5 sm:grid-cols-2 sm:p-6">
      <input type="hidden" name="next" value={next} />
      <p className="text-xs text-charcoal/70 sm:col-span-2">{t("profile", "requiredNote")}</p>

      {error && <p role="alert" className={`${alertLight} p-4 text-sm sm:col-span-2`}>{error}</p>}

      <label className={`${label} sm:col-span-2`}>
        {t("profile", "fullName")} {req}
        <input
          name="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)}
          required aria-required="true" autoComplete="name" maxLength={120}
          aria-invalid={!!fieldError.fullName} aria-describedby={fieldError.fullName ? "cp-name-err" : undefined}
          className={field}
        />
        {fieldError.fullName && <span id="cp-name-err" className={`mt-1 block text-xs ${errorLight}`}>{fieldError.fullName}</span>}
      </label>

      <label className={label}>
        {t("profile", "location")} {req}
        <select
          name="location_type" value={locationType}
          onChange={(e) => {
            const v = e.target.value as LocationType;
            setLocationType(v);
            if (v !== "international") setCountry("");
          }}
          className={field}
        >
          <option value="japan">{t("profile", "locJapan")}</option>
          <option value="philippines">{t("profile", "locPhilippines")}</option>
          <option value="international">{t("profile", "locInternational")}</option>
        </select>
      </label>

      {locationType === "international" && (
        <label className={label}>
          {t("profile", "country")} {req}
          <select
            name="country" value={country} onChange={(e) => setCountry(e.target.value)}
            required aria-required="true"
            aria-invalid={!!fieldError.country} aria-describedby={fieldError.country ? "cp-country-err cp-country-hint" : "cp-country-hint"}
            className={field}
          >
            <option value="" disabled>{t("profile", "countryPlaceholder")}</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span id="cp-country-hint" className="mt-1 block text-[11px] text-charcoal/70">{t("profile", "countryHint")}</span>
          {fieldError.country && <span id="cp-country-err" className={`mt-1 block text-xs ${errorLight}`}>{fieldError.country}</span>}
        </label>
      )}

      <label className={label}>
        {t("profile", "facebookName")} {opt}
        <input name="facebook_name" value={facebookName} onChange={(e) => setFacebookName(e.target.value)} maxLength={120} className={field} />
      </label>

      <label className={label}>
        {t("profile", "messengerLink")} {opt}
        <input name="messenger_link" value={messengerLink} onChange={(e) => setMessengerLink(e.target.value)} placeholder="m.me/username" maxLength={200} className={field} />
      </label>

      <label className={label}>
        {t("profile", "mobile")} {opt}
        <input name="mobile_number" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel" maxLength={40} className={field} />
      </label>

      <label className={label}>
        {t("profile", "email")}
        <input value={email} readOnly aria-readonly="true" aria-describedby="cp-email-note" className="mt-1 w-full border border-charcoal/60 bg-chalk px-3 py-2 text-charcoal-deep" />
        <span id="cp-email-note" className="mt-1 block text-[11px] text-charcoal/70">{t("profile", "emailNote")}</span>
      </label>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("profile", "submitting") : t("profile", "submit")}
        </Button>
      </div>
    </form>
  );
}

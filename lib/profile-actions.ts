"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { hub, HubError } from "@/lib/hub-api";
import { COUNTRIES, toLocationString, type LocationType } from "@/lib/countries";
import { REGISTERED_PATH, isAlreadyRegistered, profileNext } from "@/lib/profile";
import type { ActionResult } from "@/lib/checkout-actions";
import type { HubProfileInput } from "@/lib/types";

/**
 * Submits the "Complete your profile" step to the Hub (POST /auth/customer).
 *
 * A Server Action like every other customer write: the JWT is paired with
 * HUB_API_KEY here and never travels with a browser fetch.
 *
 * Validation is the Hub New Customer modal's, repeated here because the
 * browser is not the authority: full name required; country required when the
 * location is International. The country must be one from the list — the
 * select can produce nothing else, so anything else is a tampered form.
 *
 *   200                     → `next` (validated like /auth/callback's).
 *   409 already_registered  → the notice page, which signs her out.
 *   anything else           → an error code (+ the Hub's request id) for the
 *                             form to show; her input stays in the form.
 */
const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const LOCATION_TYPES: readonly LocationType[] = ["japan", "philippines", "international"];

export async function completeProfileAction(form: FormData): Promise<ActionResult<never>> {
  // A throw here (missing env, Auth unreachable) would reject the action and
  // take the form — and everything she typed — with it. Answer with a code.
  let jwt: string | undefined;
  try {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getSession();
    jwt = data.session?.access_token;
  } catch {
    return { ok: false, code: "session_unavailable" };
  }
  if (!jwt) return { ok: false, code: "signed_out" };

  const fullName = str(form, "full_name");
  if (!fullName) return { ok: false, code: "full_name_required" };

  const locationType = str(form, "location_type") as LocationType;
  if (!LOCATION_TYPES.includes(locationType)) return { ok: false, code: "bad_location" };
  const country = str(form, "country");
  if (locationType === "international" && !COUNTRIES.includes(country)) return { ok: false, code: "country_required" };
  const location = toLocationString(locationType, country);
  if (!location) return { ok: false, code: "country_required" };

  const facebookName = str(form, "facebook_name");
  const messengerLink = str(form, "messenger_link");
  const mobileNumber = str(form, "mobile_number");
  const profile: HubProfileInput = {
    full_name: fullName,
    location,
    ...(facebookName ? { facebook_name: facebookName } : {}),
    ...(messengerLink ? { messenger_link: messengerLink } : {}),
    ...(mobileNumber ? { mobile_number: mobileNumber } : {}),
  };

  let registered = false;
  try {
    await hub.authCustomer(jwt, profile);
  } catch (e) {
    if (isAlreadyRegistered(e)) registered = true;
    else if (e instanceof HubError) return { ok: false, code: e.code ?? `http_${e.status}`, requestId: e.requestId };
    else return { ok: false, code: "failed" };
  }
  // redirect() throws, so both stay outside the try/catch above.
  if (registered) redirect(REGISTERED_PATH);
  redirect(profileNext(str(form, "next")));
}

/**
 * Ends the session behind the already-registered notice. She holds a login
 * but no customer record until staff attach one, so she must not be left half
 * signed in. No redirect: the notice stays on screen. Same scope fallback as
 * signOutAction — if the global revoke fails, the local cookies still go.
 */
export async function endSessionAction(): Promise<void> {
  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signOut();
    if (error) await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Nothing to clear, or Auth unreachable: nothing more to do.
  }
}

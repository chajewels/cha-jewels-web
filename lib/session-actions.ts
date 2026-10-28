"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";
import { localePath } from "@/lib/locale";

/**
 * Sign out from the header menu, the drawer, or the account page. A Server
 * Action so the cookies are cleared in the same response that redirects — the
 * old browser-side signOut + router.refresh left the shell one render behind.
 *
 * Global scope revokes the refresh token at GoTrue as well; if that call fails
 * (network, an already-dead session) the local cookies still go, so the
 * customer is never left looking signed in after pressing Sign out.
 */
export async function signOutAction() {
  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signOut();
    if (error) await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Nothing to clear, or Auth unreachable: fall through to the redirect.
  }
  // Locale-aware landing (Phase 2C): the signed-out notice shows on the home
  // page of the language the customer was using.
  redirect(`${localePath("/", await getLang())}?notice=signed_out`);
}

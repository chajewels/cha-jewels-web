import { getLang } from "@/lib/i18n-server";
import { gateLang } from "@/lib/i18n-core";
import { layawayOffered } from "@/lib/layaway-availability";

/**
 * The same rule, on the server. Server actions and server components use this;
 * client components are passed `lang` and call `layawayOffered` directly.
 *
 * `explicitLang` (OD-15, Phase 2C) is the language of the page the customer was
 * shown, passed by the caller so a stale cookie in another tab cannot refuse an
 * English page's layaway. It is validated (`gateLang`): anything that is not
 * exactly "en" or "ja" falls back to the cookie resolution, which is the
 * pre-2C behaviour, so every existing zero-argument caller is unchanged. An
 * explicit "ja" is still a refusal. Not a security boundary — the rule's own
 * documentation in lib/layaway-availability.ts explains why — and nothing
 * about authentication, agreements, terms or money passes through here.
 */
export async function layawayOfferedNow(explicitLang?: unknown): Promise<boolean> {
  return layawayOffered(gateLang(explicitLang, await getLang()));
}

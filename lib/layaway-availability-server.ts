import { getLang } from "@/lib/i18n-server";
import { layawayOffered } from "@/lib/layaway-availability";

/**
 * The same rule, read from the language cookie on the server. Server actions
 * and server components use this; client components are passed `lang` and call
 * `layawayOffered` directly.
 */
export async function layawayOfferedNow(): Promise<boolean> {
  return layawayOffered(await getLang());
}

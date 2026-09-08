import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, type Lang } from "./i18n";
/** Language: cookie first, default Japanese. Server-only. */
export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  return c === "en" ? "en" : DEFAULT_LANG;
}

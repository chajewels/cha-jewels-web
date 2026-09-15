import type { Metadata } from "next";
import { dict, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";

type MetaEntry = { title: Record<Lang, string>; description?: Record<Lang, string> };

/**
 * <title> and description follow the language cookie like everything else.
 * Pages export `generateMetadata = () => pageMeta("key")`; the strings live in
 * dict.meta so no page carries a literal title in either language.
 */
export async function pageMeta(key: Exclude<keyof typeof dict.meta, "site">): Promise<Metadata> {
  const lang = await getLang();
  const m = dict.meta[key] as MetaEntry;
  return { title: m.title[lang], ...(m.description ? { description: m.description[lang] } : {}) };
}

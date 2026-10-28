import { headers } from "next/headers";
import { siteUrl } from "@/lib/site";
import { PATH_HEADER } from "@/lib/i18n";
import { localeOf } from "@/lib/locale";
import { buildJsonLd, type JsonLdProps } from "@/lib/json-ld";

/**
 * Renders the page's JSON-LD. The data itself comes from the pure builder in
 * lib/json-ld.ts (unit-tested there); this component only decides the locale
 * prefix from the request path — "" on a legacy page, "/en" or "/ja" on a
 * locale page — so every URL in the data equals the page's own canonical
 * (Phase 2B design H). No page passes the prefix by hand: the one source is
 * the middleware's path header, and a legacy page therefore emits exactly the
 * bytes it always has (C0/H0).
 */
export async function JsonLd(props: JsonLdProps) {
  const path = (await headers()).get(PATH_HEADER);
  const locale = path ? localeOf(path) : null;
  const data = buildJsonLd(props, siteUrl(), locale ? (`/${locale}` as "/en" | "/ja") : "");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

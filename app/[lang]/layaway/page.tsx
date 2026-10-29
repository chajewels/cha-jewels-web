// PHASE 3 (master plan §12 / PHASE 3; map §6): /en/layaway is the crawlable,
// self-canonical English layaway page. Same thin-wrapper pattern as every other
// locale route (map §18.2): the legacy page serves this URL — getLang() is
// URL-authoritative — and localizedMeta adds canonical, hreflang and x-default.
//
// ENGLISH ONLY. The eligibility is LAYAWAY_ELIGIBILITY ({ en: true, ja: false },
// derived from layawayOffered), so the metadata names an `en` alternate and an
// English x-default and never a `ja` one; /ja/layaway gets empty metadata here
// and the legacy page itself answers notFound() for Japanese. There is no
// Japanese layaway page and this file cannot create one.
//
// The bare /layaway is untouched by this file (its legacy behaviour is OD-6,
// a separate decision).
import Page, { generateMetadata as ownMeta } from "@/app/layaway/page";
import { localizedMeta } from "@/lib/locale-meta";
import { LAYAWAY_ELIGIBILITY } from "@/lib/layaway-availability";

export default Page;
export const generateMetadata = localizedMeta(() => "/layaway", ownMeta, () => LAYAWAY_ELIGIBILITY);

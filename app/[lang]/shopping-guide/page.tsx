// Phase 2B locale wrapper (map §18.2): the legacy page serves this locale URL —
// getLang() is URL-authoritative — and localizedMeta adds canonical, hreflang
// and x-default. The legacy route itself is untouched (C0/H0).
import Page, { generateMetadata as ownMeta } from "@/app/shopping-guide/page";
import { localizedMeta } from "@/lib/locale-meta";

export default Page;
export const generateMetadata = localizedMeta(() => "/shopping-guide", ownMeta);

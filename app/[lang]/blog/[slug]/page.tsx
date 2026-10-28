// Phase 2B locale wrapper (map §18.2): the legacy page serves this locale URL —
// getLang() is URL-authoritative — and localizedMeta adds canonical, hreflang
// and x-default. The legacy route itself is untouched (C0/H0).
// Eligibility is per post and per language (finding F2): hreflang names only a
// language the post has a title AND body in, and the layaway rule applies, so
// an alternate can never point at a 404. The page itself already refuses an
// ineligible language (getPost returns null -> notFound).
import Page, { generateMetadata as ownMeta } from "@/app/blog/[slug]/page";
import { localizedMeta } from "@/lib/locale-meta";
import { postLanguages } from "@/lib/posts";

export default Page;
export const generateMetadata = localizedMeta((p) => `/blog/${p.slug}`, ownMeta, (p) => postLanguages(p.slug));

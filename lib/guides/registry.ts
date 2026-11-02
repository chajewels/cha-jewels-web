/**
 * THE GUIDE REGISTRY and its PUBLICATION GUARD (Phases 6-8; owner-approved 2026-11-02).
 *
 * A guide is routable, listed in the sitemap and linkable ONLY when it is `published` AND passes `guideProblems`:
 * approved by a named person on a date, every factual claim with a recorded evidence note, and metadata within
 * limits. The two drafts below are registered as DRAFT with NO copy: their text lives in docs/seo/phase-7 and
 * phase-8 and is not published (editorial approval and fact support are still missing). Publishing a guide means
 * adding a `PublishedGuide` here AND setting the `guides` family live in lib/locale.ts, in one reviewed change.
 */
export type GuideSection = { h2: string; paragraphs: string[] };
export type DraftGuide = { slug: string; status: "draft"; draftFile: string };
export type PublishedGuide = {
  slug: string; status: "published";
  title: string;        // the full <title> (<= 70)
  description: string;  // meta description (<= 160)
  h1: string; intro: string;
  sections: GuideSection[];
  faq: { q: string; a: string }[];   // rendered visibly; FAQ JSON-LD only from these
  approval: { by: string; date: string };
  evidence: string[];   // one note per factual claim group: the source or document behind it
  updated: string;      // ISO date of the last content change (the sitemap lastmod)
};
export type Guide = DraftGuide | PublishedGuide;

export const GUIDES: readonly Guide[] = [
  { slug: "kihei", status: "draft", draftFile: "docs/seo/phase-7/KIHEI-PILLAR-DRAFT.md" },
  { slug: "k18-gold-japan", status: "draft", draftFile: "docs/seo/phase-8/K18-PILLAR-DRAFT.md" },
];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** What stops a guide from being published. Empty = publishable. */
export function guideProblems(g: Guide): string[] {
  if (g.status !== "published") return [];
  const out: string[] = [];
  if (!SLUG.test(g.slug)) out.push("slug is not a lowercase-hyphen slug");
  if (!g.title?.trim() || g.title.length > 70) out.push("title missing or over 70 characters");
  if (!g.description?.trim() || g.description.length > 160) out.push("description missing or over 160 characters");
  if (!g.h1?.trim() || !g.intro?.trim()) out.push("h1 or intro missing");
  if (!Array.isArray(g.sections) || g.sections.length === 0 || g.sections.some((s) => !s.h2?.trim() || !s.paragraphs?.length || s.paragraphs.some((p) => !p?.trim()))) out.push("sections missing or empty");
  if (!g.approval?.by?.trim() || !ISO.test(g.approval?.date ?? "")) out.push("no named approval with a date");
  if (!Array.isArray(g.evidence) || g.evidence.length === 0 || g.evidence.some((e) => !e?.trim())) out.push("no evidence notes for the factual claims");
  if (!ISO.test(g.updated ?? "")) out.push("updated date missing");
  if (g.faq?.some((f) => !f.q?.trim() || !f.a?.trim())) out.push("a FAQ entry is incomplete");
  return out;
}

/** Published AND valid guides only; an invalid published entry is treated as unpublished (never routable). */
export function publishedGuides(all: readonly Guide[] = GUIDES): PublishedGuide[] {
  return all.filter((g): g is PublishedGuide => g.status === "published" && guideProblems(g).length === 0);
}
export const publishedGuide = (slug: string, all: readonly Guide[] = GUIDES) => publishedGuides(all).find((g) => g.slug === slug);

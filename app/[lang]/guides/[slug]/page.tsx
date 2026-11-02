// Phases 6-8 guides (owner-approved 2026-11-02): ENGLISH ONLY, and routable only for a PUBLISHED, valid guide
// (lib/guides/registry.ts). Everything else, including every Japanese URL and every draft, is a plain 404 that says
// nothing (no canonical, no hreflang). Alternates name `en` and `x-default` only: there is no Japanese sibling.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GuideArticle } from "@/components/guides/guide-article";
import { publishedGuide } from "@/lib/guides/registry";
import { localizedMeta } from "@/lib/locale-meta";
import { getLang } from "@/lib/i18n-server";

// No static-generation exports, exactly like every other [lang] page: the root layout renders per request
// (language cookie/headers), so a static attempt would fail at runtime with DYNAMIC_SERVER_USAGE.

const ownMeta = async ({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> => {
  const g = publishedGuide((await params).slug);
  return g ? { title: { absolute: g.title }, description: g.description } : {};
};
export const generateMetadata = localizedMeta((p: { slug: string }) => `/guides/${p.slug}`, ownMeta, (p) => ({ en: !!publishedGuide(p.slug), ja: false }));

export default async function GuidePage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  // Like every locale page, read the request language first: the root layout renders per request (cookies/headers), so a
  // page that skipped this would be attempted as static and fail at runtime with DYNAMIC_SERVER_USAGE on the 404 path.
  const [{ lang, slug }] = await Promise.all([params, getLang()]);
  if (lang !== "en") notFound();
  const guide = publishedGuide(slug);
  if (!guide) notFound();
  return <GuideArticle guide={guide} />;
}

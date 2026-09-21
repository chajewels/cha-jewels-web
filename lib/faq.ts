import "server-only";
import { cache } from "react";
import { hub } from "@/lib/hub-api";
import { faqSections } from "@/lib/content/faq";
import { blocksToMarkdown, sectionSlug } from "@/lib/content/faq-markdown";
import { layawayOffered } from "@/lib/layaway-availability";
import { markdownToText, renderMarkdown } from "@/lib/markdown";
import type { Lang } from "@/lib/i18n";
import type { HubFaqSection } from "@/lib/types";

/**
 * THE FAQ, FROM THE HUB IF IT HAS ONE AND FROM THIS REPO IF IT DOES NOT.
 *
 * ALL OR NOTHING, AND NEVER MIXED — the rule that matters here and the reason
 * this is not written like lib/posts.ts. Posts are independent articles, so
 * merging two sources by slug is harmless. The FAQ is a DOCUMENT: thirty-nine
 * answers that cross-reference each other, were reviewed together, and are
 * authoritative over the rest of the site. Half from the Hub and half from here
 * is a document nobody has read, in which the store-credit answer can contradict
 * the cancellation answer because they came from different drafts.
 *
 * So: one section from the Hub is enough to say the migration has happened, and
 * everything comes from the Hub. None, or a Hub that cannot answer, and
 * everything comes from lib/content/faq.ts. There is no third case.
 *
 * BOTH SOURCES RENDER THROUGH lib/markdown.ts. The static answers are converted
 * by the same lib/content/faq-markdown.ts that generated docs/faq-seed.sql, so
 * the page cannot look one way before the seed is run and another way after —
 * and `npm run check:faq` is what proves that conversion changes no words.
 *
 * NOTHING HERE THROWS. /faq is public.
 */
export type FaqSource = "hub" | "static";

export type ViewFaqItem = {
  /** Stable within a render; used as a React key, never rendered. */
  key: string;
  question: string;
  /** Rendered HTML, from markdown either way. */
  answerHtml: string;
  /** The same answer as plain text, for the FAQPage structured data. */
  answerText: string;
};

export type ViewFaqSection = { key: string; heading: string; items: ViewFaqItem[] };
export type Faq = { source: FaqSource; sections: ViewFaqSection[] };

const hubFaq = cache(async (): Promise<HubFaqSection[]> => {
  try {
    const rows = await hub.faq();
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
});

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const byOrder = <T extends { sort_order?: number }>(a: T, b: T) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

/** One answer, rendered once and flattened once, from the same markdown. */
function answer(markdown: string, key: string, question: string): ViewFaqItem {
  return { key, question, answerHtml: renderMarkdown(markdown), answerText: markdownToText(markdown) };
}

function fromHub(rows: HubFaqSection[], lang: Lang): ViewFaqSection[] {
  const offered = layawayOffered(lang);
  return [...rows]
    .sort(byOrder)
    .map((section) => {
      const heading = text(lang === "ja" ? section.title_ja : section.title_en);
      const items = [...(section.items ?? [])]
        .sort(byOrder)
        // The layaway rule, and the language rule, in that order. An item with
        // no words in this language is absent rather than an empty <details>:
        // a question with nothing under it reads as a broken page, not as a
        // translation someone has not finished.
        .filter((i) => offered || i.layaway_only !== true)
        .flatMap((item) => {
          const q = text(lang === "ja" ? item.question_ja : item.question_en);
          const a = text(lang === "ja" ? item.answer_ja : item.answer_en);
          return q && a ? [answer(a, item.id, q)] : [];
        });
      // A heading with nothing under it is the same broken page one level up.
      return heading && items.length ? [{ key: section.id || section.slug, heading, items }] : [];
    })
    .flat();
}

/** The repo's own answers, through the same conversion and the same renderer. */
function fromStatic(lang: Lang): ViewFaqSection[] {
  return faqSections.map((section) => {
    const slug = sectionSlug(section.h.en);
    return {
      key: slug,
      heading: section.h[lang],
      items: section.items.map((item, i) => answer(blocksToMarkdown(item.a, lang), `${slug}-${i}`, item.q[lang])),
    };
  });
}

/**
 * The FAQ for this language, and which source it came from.
 *
 * `source` is returned rather than kept private because it is the one thing a
 * reviewer needs to know when the page looks wrong: the same answers rendered
 * the same way from two places, and "which one am I looking at?" is otherwise
 * unanswerable from the page.
 */
export async function getFaq(lang: Lang): Promise<Faq> {
  const rows = await hubFaq();
  if (rows.length >= 1) {
    const sections = fromHub(rows, lang);
    // A Hub that answered, but with nothing this language can read, still means
    // the migration has happened. Falling back here would put the repo's
    // Japanese beside the Hub's English and call it one document.
    return { source: "hub", sections };
  }
  return { source: "static", sections: fromStatic(lang) };
}

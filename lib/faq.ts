import "server-only";
import { cache } from "react";
import { hub } from "@/lib/hub-api";
import { layawayOffered } from "@/lib/layaway-availability";
import { markdownToText, renderMarkdown } from "@/lib/markdown";
import type { Lang } from "@/lib/i18n";
import type { HubFaqSection } from "@/lib/types";

/**
 * THE FAQ, FROM THE HUB. There is no second source any more.
 *
 * Until 2026-09-22 this chose between the Hub's FAQ and a hand-authored copy in
 * lib/content/faq.ts — all of one or all of the other, never mixed, because the
 * FAQ is a document whose answers cross-reference each other rather than a list
 * of independent posts. All 8 sections and 39 items are now in the Hub
 * (owner-verified), docs/faq-seed.sql is the record of how they got there, and
 * the runtime fallback is gone.
 *
 * WHAT REPLACES IT IS NOT A THIRD SOURCE. A Hub that cannot answer is an ERROR
 * — see the header of lib/hub-api.ts. Next then keeps serving the last page it
 * rendered successfully, which is the whole FAQ, rather than caching an empty
 * one for the next hour. An empty 200 is still empty: a Hub with no rows means
 * there are no rows.
 *
 * lib/content/faq.ts SURVIVES, and only as the preview fixture's source
 * (lib/fixtures.ts). Nothing on a production path reads it.
 */
export type ViewFaqItem = {
  /** Stable within a render; used as a React key, never rendered. */
  key: string;
  question: string;
  /** Rendered HTML, from the Hub's markdown. */
  answerHtml: string;
  /** The same answer as plain text, for the FAQPage structured data. */
  answerText: string;
};

export type ViewFaqSection = {
  key: string;
  /**
   * The Hub's slug, rendered as the section's DOM id so it can be LINKED TO.
   * The footer's "Layaway terms" points at /faq#payments-and-layaway, and
   * before this the page emitted no ids at all — the link would have landed at
   * the top of a thirty-nine-question page and left the reader to find it.
   *
   * Falls back to the row id, which is stable if unlovely, so a section without
   * a slug is still addressable rather than silently unlinkable.
   */
  slug: string;
  heading: string;
  items: ViewFaqItem[];
};

const hubFaq = cache(async (): Promise<HubFaqSection[]> => {
  const rows = await hub.faq();
  return Array.isArray(rows) ? rows : [];
});

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

/**
 * THE FAIL-SAFE FOR HUB ROWS (owner decision 2026-09-25: nothing
 * layaway-related is visible on the Japanese site). The FAQ is owner-editable
 * in the Hub, and a row that talks about layaway without its `layaway_only`
 * flag set would otherwise publish it in Japanese. Where layaway is not
 * offered, an item whose question or answer still names it is dropped whole —
 * the conservative choice: a Japanese sentence cannot be safely trimmed here.
 * The fix for a dropped item is in the Hub (set the flag, or trim the Japanese).
 */
const LAYAWAY_WORDS = /分割予約|レイアウェイ|分割払い/;

/**
 * A section heading is the Hub's too. "お支払いと分割予約" heads real
 * non-layaway payment questions, so it is renamed rather than dropped; any
 * other heading that still names layaway drops its section.
 */
const JA_HEADING_WITHOUT_LAYAWAY: Record<string, string> = { "payments-and-layaway": "お支払い" };

const byOrder = <T extends { sort_order?: number }>(a: T, b: T) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

/** One answer, rendered once and flattened once, from the same markdown. */
function answer(markdown: string, key: string, question: string): ViewFaqItem {
  return { key, question, answerHtml: renderMarkdown(markdown), answerText: markdownToText(markdown) };
}

/** The FAQ for this language, sections in order with their questions inside. */
export async function getFaq(lang: Lang): Promise<ViewFaqSection[]> {
  const offered = layawayOffered(lang);
  return [...(await hubFaq())]
    .sort(byOrder)
    .flatMap((section) => {
      const hubHeading = text(lang === "ja" ? section.title_ja : section.title_en);
      const heading = offered || !hubHeading || !LAYAWAY_WORDS.test(hubHeading)
        ? hubHeading
        : JA_HEADING_WITHOUT_LAYAWAY[text(section.slug) ?? ""] ?? null;
      const items = [...(section.items ?? [])]
        .sort(byOrder)
        // The layaway rule, then the language rule. An item with no words in
        // this language is absent rather than an empty <details>: a question
        // with nothing under it reads as a broken page, not as a translation
        // someone has not finished.
        .filter((i) => offered || i.layaway_only !== true)
        .flatMap((item) => {
          const q = text(lang === "ja" ? item.question_ja : item.question_en);
          const a = text(lang === "ja" ? item.answer_ja : item.answer_en);
          if (!offered && q && a && (LAYAWAY_WORDS.test(q) || LAYAWAY_WORDS.test(a))) return [];
          return q && a ? [answer(a, item.id, q)] : [];
        });
      // A heading with nothing under it is the same broken page one level up.
      const key = section.id || section.slug;
      return heading && items.length ? [{ key, slug: text(section.slug) ?? key, heading, items }] : [];
    });
}

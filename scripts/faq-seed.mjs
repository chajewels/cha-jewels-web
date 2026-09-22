// Generates docs/faq-seed.sql from lib/content/faq.ts.
//
// Run it (`node scripts/faq-seed.mjs`) to write the file; import `buildSeed`
// to get the same string without writing, which is what scripts/check-faq.mjs
// does to prove the committed file is not stale.
//
// THIS SCRIPT NEVER TOUCHES A DATABASE, and neither does anything else in this
// repo (CLAUDE.md: Claude Code may draft SQL, Cynthia runs it). It writes a
// file for a person to read, review and paste into the Supabase SQL editor.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { faqSections } = await import(join(root, "lib/content/faq.ts"));
const { blocksToMarkdown, sectionSlug } = await import(join(root, "lib/content/faq-markdown.ts"));

/**
 * Postgres literal quoting: double the single quotes, and nothing else.
 *
 * NO E'' STRINGS AND NO BACKSLASH HANDLING. With standard_conforming_strings on
 * — the default since 9.1 and not something this file may assume is off — a
 * backslash in an ordinary '…' literal is just a backslash, which is exactly
 * what the markdown needs: a hard break IS a trailing backslash, and an escape
 * IS a backslash. Switching to E'' would silently eat both.
 */
const lit = (value) => `'${String(value).replace(/'/g, "''")}'`;

/** 10, 20, 30 … so a row can be moved between two others without renumbering. */
const order = (index) => (index + 1) * 10;

export function buildSeed() {
  const out = [];
  let items = 0;

  out.push(
    "-- Cha Jewels FAQ seed — GENERATED, do not hand-edit.",
    "--   source:    lib/content/faq.ts",
    "--   generator: node scripts/faq-seed.mjs",
    "--   gate:      npm run check:faq (regenerates and compares to this file)",
    "--",
    "-- Answers are markdown, converted from the LegalBlock[] the site renders",
    "-- today: paragraphs, ### sub-headings, \"- \" bullets, hard breaks (a",
    "-- trailing backslash) and [text](href) links. npm run check:faq renders",
    "-- both the blocks and this markdown to plain text and asserts they are",
    "-- identical — the FAQ is authoritative and much of it is terms, so not one",
    "-- word may change on the way in.",
    "--",
    "-- IDEMPOTENT. Every insert is guarded, so running it twice inserts nothing",
    "-- the second time: sections on their slug, items on their section's slug",
    "-- plus their sort_order. It will NOT update a row that already exists —",
    "-- this is a seed, not a sync, and silently overwriting an answer an owner",
    "-- has since edited in the Hub is the one thing it must never do.",
    "--",
    "-- layaway_only is false on every row. Nothing in lib/content/faq.ts carries",
    "-- that flag today; the column is seeded so the Hub can set it on a future",
    "-- answer, and the site already hides such an answer on Japanese.",
    "--",
    "-- RUN BY: Cynthia, in the Supabase SQL editor. Nothing in this repo runs it.",
    "",
    "BEGIN;",
    "",
  );

  faqSections.forEach((section, si) => {
    const slug = sectionSlug(section.h.en);
    out.push(
      `-- ${si + 1}. ${section.h.en} (${section.items.length} ${section.items.length === 1 ? "item" : "items"})`,
      "INSERT INTO public.website_faq_sections (slug, title_en, title_ja, sort_order)",
      `SELECT ${lit(slug)}, ${lit(section.h.en)}, ${lit(section.h.ja)}, ${order(si)}`,
      `WHERE NOT EXISTS (SELECT 1 FROM public.website_faq_sections WHERE slug = ${lit(slug)});`,
      "",
    );

    section.items.forEach((item, ii) => {
      items++;
      out.push(
        "INSERT INTO public.website_faq_items (section_id, question_en, question_ja, answer_en, answer_ja, layaway_only, sort_order)",
        `SELECT s.id, ${lit(item.q.en)}, ${lit(item.q.ja)},`,
        `       ${lit(blocksToMarkdown(item.a, "en"))},`,
        `       ${lit(blocksToMarkdown(item.a, "ja"))},`,
        `       false, ${order(ii)}`,
        `  FROM public.website_faq_sections s`,
        ` WHERE s.slug = ${lit(slug)}`,
        `   AND NOT EXISTS (`,
        `         SELECT 1 FROM public.website_faq_items i`,
        `          WHERE i.section_id = s.id AND i.sort_order = ${order(ii)});`,
        "",
      );
    });
  });

  out.push("COMMIT;", "");
  return { sql: out.join("\n"), sections: faqSections.length, items };
}

// Written only when this file is the entry point, so importing it from the gate
// cannot rewrite the artifact the gate exists to check.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { sql, sections, items } = buildSeed();
  writeFileSync(join(root, "docs/faq-seed.sql"), sql);
  console.log(`docs/faq-seed.sql written: ${sections} sections, ${items} items.`);
}

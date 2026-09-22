// Generates docs/posts-seed.sql from lib/blog.ts.
//
// Run it (`npm run posts:seed`) to write the file; import `buildSeed` to get
// the same string without writing, which is what scripts/check-posts.mjs does
// to prove the committed file is not stale.
//
// THIS SCRIPT NEVER TOUCHES A DATABASE, and neither does anything else in this
// repo (CLAUDE.md: Claude Code may draft SQL, Cynthia runs it). It writes a
// file for a person to read, review and paste into the Supabase SQL editor.
//
// The same shape as scripts/faq-seed.mjs on purpose. These are two halves of
// one migration — the editorial this repo hardcodes, moving into the Hub — and
// a reviewer who has read one should not have to learn a second idiom.
import "./ts-resolve.mjs";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { posts } = await import(join(root, "lib/blog.ts"));

/**
 * Postgres literal quoting: double the single quotes, and nothing else.
 *
 * NO E'' STRINGS AND NO BACKSLASH HANDLING. With standard_conforming_strings on
 * — the default since 9.1 and not something this file may assume is off — a
 * backslash in an ordinary '…' literal is just a backslash, which is what the
 * markdown needs if an escape ever appears in it.
 */
const lit = (value) => `'${String(value).replace(/'/g, "''")}'`;

/**
 * ESCAPING, KEPT AS SMALL AS IT CAN BE — the same rule as the FAQ converter,
 * and for the same reason: this markdown is what an owner will EDIT in the Hub,
 * so an escaper that turned "Yes. We inspect" into "Yes\. We inspect" would be
 * making the field unreadable to protect against nothing.
 *
 * Six characters mean something anywhere in a line; list, heading and quote
 * markers mean something only where a line begins. NOTHING IN lib/blog.ts NEEDS
 * EITHER today — all 20 strings are clean — so this is here to make the
 * converter total rather than correct-by-luck.
 */
const escapeInline = (text) => text.replace(/([\\`*_[\]])/g, "\\$1");
const escapeLine = (text) =>
  escapeInline(text).replace(/^(\s*)([#\-+>]|\d+[.)])/, (_, space, marker) => `${space}\\${marker}`);

/**
 * A static post's body — `string[]`, one plain paragraph per entry — as
 * markdown. A blank line between paragraphs is all a paragraph break is, so
 * this conversion adds nothing and removes nothing; scripts/check-posts.mjs
 * proves that by rendering both and comparing the HTML byte for byte.
 */
export const bodyToMarkdown = (paragraphs) => paragraphs.map(escapeLine).join("\n\n");

export function buildSeed() {
  const out = [];
  const rows = [];

  out.push(
    "-- Cha Jewels posts seed — GENERATED, do not hand-edit.",
    "--   source:    lib/blog.ts",
    "--   generator: npm run posts:seed",
    "--   gate:      npm run check:posts (regenerates and compares to this file)",
    "--",
    "-- The two editorial posts this repo has carried since before there was a",
    "-- Hub. Bodies are markdown: each paragraph of the string[] separated by a",
    "-- blank line, which is all a paragraph break is. npm run check:posts",
    "-- renders the static body and this markdown through the site's OWN two",
    "-- renderers and asserts the HTML is byte-identical, so the conversion",
    "-- cannot quietly reword, reflow or drop a paragraph.",
    "--",
    "-- IDEMPOTENT. Each insert is guarded on the slug, so running it twice",
    "-- inserts nothing the second time. It will NOT update a row that already",
    "-- exists — this is a seed, not a sync, and silently overwriting a post an",
    "-- owner has since edited in the Hub is the one thing it must never do.",
    "--",
    "-- layaway_only is carried across from lib/blog.ts unchanged: such a post is",
    "-- listed and readable on English only (lib/layaway-availability.ts, owner",
    "-- decision 2026-09-15), and the site already applies that rule to Hub rows.",
    "--",
    "-- RUN BY: Cynthia, in the Supabase SQL editor. Nothing in this repo runs it.",
    "",
    "BEGIN;",
    "",
  );

  posts.forEach((post, i) => {
    const row = {
      slug: post.slug,
      type: "article",
      title_en: post.title.en,
      title_ja: post.title.ja,
      excerpt_en: post.excerpt.en,
      excerpt_ja: post.excerpt.ja,
      body_en: bodyToMarkdown(post.body.en),
      body_ja: bodyToMarkdown(post.body.ja),
      published: true,
      published_at: post.date,
      layaway_only: post.layawayOnly === true,
    };
    rows.push(row);

    out.push(
      `-- ${i + 1}. ${post.slug} — ${post.date}${row.layaway_only ? ", layaway only (English)" : ""}`,
      "INSERT INTO public.website_posts (slug, type, title_en, title_ja, excerpt_en, excerpt_ja, body_en, body_ja, published, published_at, layaway_only)",
      `SELECT ${lit(row.slug)}, ${lit(row.type)},`,
      `       ${lit(row.title_en)},`,
      `       ${lit(row.title_ja)},`,
      `       ${lit(row.excerpt_en)},`,
      `       ${lit(row.excerpt_ja)},`,
      `       ${lit(row.body_en)},`,
      `       ${lit(row.body_ja)},`,
      `       true, ${lit(row.published_at)}, ${row.layaway_only}`,
      `WHERE NOT EXISTS (SELECT 1 FROM public.website_posts WHERE slug = ${lit(row.slug)});`,
      "",
    );
  });

  out.push("COMMIT;", "");
  return { sql: out.join("\n"), rows };
}

// Written only when this file is the entry point, so importing it from the gate
// cannot rewrite the artifact the gate exists to check.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { sql, rows } = buildSeed();
  writeFileSync(join(root, "docs/posts-seed.sql"), sql);
  console.log(`docs/posts-seed.sql written: ${rows.length} posts (${rows.map((r) => r.slug).join(", ")}).`);
}

// The two editorial posts this repo hardcodes are moving into the Hub, and the
// one thing that move may not do is change what a reader sees.
//
// So this does not check that the conversion "looks right". It renders each
// body BOTH ways — the static string[] through renderParagraphs, the markdown
// through renderMarkdown — and asserts the HTML is byte-identical. Those are
// the site's own two renderers, the same functions lib/posts.ts calls for a
// static post and a Hub post respectively, so an identical result is the whole
// claim: a reader cannot tell which source the page came from.
//
// The plain text is asserted too, against the paragraphs joined directly. That
// is a SECOND, INDEPENDENT derivation rather than the same stripper run twice:
// if both agree, the conversion is not merely self-consistent.
//
// It also regenerates docs/posts-seed.sql and compares it to the committed
// file. The seed is run once, by hand, by Cynthia — there is no deploy that
// would catch a stale one.
import "./ts-resolve.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { posts } = await import(join(root, "lib/blog.ts"));
const { renderMarkdown, renderParagraphs, markdownToText } = await import(join(root, "lib/markdown.ts"));
const { buildSeed, bodyToMarkdown } = await import(join(root, "scripts/posts-seed.mjs"));

let failed = 0;
const fail = (msg) => { failed++; console.error(`✗ ${msg}`); };

// A difference is useless as "these two long strings differ". Name the place.
function firstDifference(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : n;
}
const around = (s, i) => JSON.stringify(s.slice(Math.max(0, i - 40), i + 40));

function same(label, before, after) {
  if (before === after) return true;
  const i = firstDifference(before, after);
  fail(`${label}: differs at character ${i}\n    static:   …${around(before, i)}\n    markdown: …${around(after, i)}`);
  return false;
}

let bodiesChecked = 0;
for (const post of posts) {
  for (const lang of ["ja", "en"]) {
    const markdown = bodyToMarkdown(post.body[lang]);
    bodiesChecked++;
    // What the page renders today, and what it will render from the Hub.
    same(`${post.slug} [${lang}] HTML`, renderParagraphs(post.body[lang]), renderMarkdown(markdown));
    // The same claim in plain text, derived a second way.
    same(`${post.slug} [${lang}] text`, post.body[lang].map((p) => p.trim()).filter(Boolean).join(" "), markdownToText(markdown));
  }
}

// Every other column is a straight copy, so it is worth one assertion each
// rather than a comment claiming they are safe. A seed that reworded a title
// would pass every body check above.
const { sql, rows } = buildSeed();
if (rows.length !== posts.length) fail(`seed has ${rows.length} rows for ${posts.length} posts`);
for (const post of posts) {
  const row = rows.find((r) => r.slug === post.slug);
  if (!row) { fail(`no seed row for ${post.slug}`); continue; }
  same(`${post.slug} title [en]`, post.title.en, row.title_en);
  same(`${post.slug} title [ja]`, post.title.ja, row.title_ja);
  same(`${post.slug} excerpt [en]`, post.excerpt.en, row.excerpt_en);
  same(`${post.slug} excerpt [ja]`, post.excerpt.ja, row.excerpt_ja);
  same(`${post.slug} published_at`, post.date, row.published_at);
  if (row.type !== "article") fail(`${post.slug}: type is ${row.type}, not "article"`);
  if (row.published !== true) fail(`${post.slug}: published is not true`);
  if (row.layaway_only !== (post.layawayOnly === true)) fail(`${post.slug}: layaway_only is ${row.layaway_only}, lib/blog.ts says ${post.layawayOnly === true}`);
}

// Every value in the file has to come back out of it. A literal whose quoting
// went wrong is a row that fails in the SQL editor, an hour after the review.
for (const row of rows) {
  for (const [column, value] of Object.entries(row)) {
    if (typeof value !== "string") continue;
    if (!sql.includes(`'${value.replace(/'/g, "''")}'`)) fail(`${row.slug}: ${column} is not in docs/posts-seed.sql as a quoted literal`);
  }
}

const committed = readFileSync(join(root, "docs/posts-seed.sql"), "utf8");
if (committed !== sql) fail("docs/posts-seed.sql is stale. Regenerate it: npm run posts:seed");

if (failed) { console.error(`\n${failed} post conversion problem(s).`); process.exit(1); }
console.log(`Posts check passed: ${bodiesChecked} bodies identical as HTML and as text, seed in sync (${rows.length} posts: ${rows.map((r) => r.slug).join(", ")}).`);

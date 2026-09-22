// THE FAQ IS TERMS. Cancellation charges, store-credit expiry, layaway
// schedules, what a claim holds for — the file it lives in says it is
// authoritative, and three other pages were corrected to match it. It is now
// being converted from hand-authored LegalBlock[] into the markdown the Hub
// will hold, and the one thing that conversion may not do is change a word.
//
// So this does not check that the conversion "looks right". It renders the
// answer BOTH ways — the blocks through answerText, the markdown through the
// real renderer — and asserts the two plain texts are byte-identical. A
// dropped bullet, a swallowed link label, a paragraph joined without its space:
// all of them move a character, and all of them fail here.
//
// It also regenerates docs/faq-seed.sql and compares it to the committed file,
// so the seed cannot drift away from the content it was generated from. The
// seed is run once, by hand, by Cynthia — there is no deploy that would catch
// a stale one.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { faqSections, answerText } = await import(join(root, "lib/content/faq.ts"));
const { blocksToMarkdown } = await import(join(root, "lib/content/faq-markdown.ts"));
const { markdownToText } = await import(join(root, "lib/markdown.ts"));
const { buildSeed } = await import(join(root, "scripts/faq-seed.mjs"));

let failed = 0;
const fail = (msg) => { failed++; console.error(`✗ ${msg}`); };

// A difference is useless as "these two long strings differ". Name the place.
function firstDifference(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : n;
}

let answersChecked = 0;
for (const section of faqSections) {
  for (const item of section.items) {
    for (const lang of ["ja", "en"]) {
      const before = answerText(item.a, lang);
      const after = markdownToText(blocksToMarkdown(item.a, lang));
      answersChecked++;
      if (before === after) continue;
      const i = firstDifference(before, after);
      fail(
        `${section.h.en} / "${item.q.en}" [${lang}]: the answer changed at character ${i}\n` +
        `    blocks:   …${JSON.stringify(before.slice(Math.max(0, i - 40), i + 40))}\n` +
        `    markdown: …${JSON.stringify(after.slice(Math.max(0, i - 40), i + 40))}`,
      );
    }
  }
}

// Questions and headings are plain strings and are copied, not converted — but
// they are copied by the generator, so they are worth one assertion each rather
// than a comment claiming they are safe.
for (const section of faqSections) {
  for (const lang of ["ja", "en"]) {
    if (!section.h[lang]?.trim()) fail(`section heading is empty [${lang}]`);
    for (const item of section.items) if (!item.q[lang]?.trim()) fail(`question is empty under "${section.h.en}" [${lang}]`);
  }
}

// The committed seed must be what this content produces today.
const { sql, sections, items } = buildSeed();
const committed = readFileSync(join(root, "docs/faq-seed.sql"), "utf8");
if (committed !== sql) {
  fail("docs/faq-seed.sql is stale. Regenerate it: node scripts/faq-seed.mjs");
}

if (failed) { console.error(`\n${failed} FAQ conversion problem(s).`); process.exit(1); }
console.log(`FAQ check passed: ${answersChecked} answers identical before and after conversion, seed in sync (${sections} sections, ${items} items).`);

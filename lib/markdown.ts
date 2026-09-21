/**
 * A SMALL MARKDOWN RENDERER FOR POST BODIES, AND NOTHING ELSE.
 *
 * WHY NOT A LIBRARY: the input is one editor, writing prose, in a field the
 * owner controls — and the output goes through dangerouslySetInnerHTML. A full
 * CommonMark implementation plus a sanitiser is two dependencies and two
 * upgrade paths for a feature that needs six constructs. This is the six.
 *
 * WHAT IT SUPPORTS: paragraphs, `## h2`, `### h3`, unordered and ordered
 * lists, `[text](href)`, `**bold**`, `*italic*` and `_italic_`.
 *
 * NO RAW HTML, AND THAT IS A GUARANTEE RATHER THAN A FILTER. The source is
 * HTML-escaped as the FIRST step, before anything is parsed, so every `<` in
 * the input is already `&lt;` by the time a tag could be recognised. There is
 * no branch that lets a tag through, so there is no list of dangerous tags to
 * keep up to date — which is the failure mode of every sanitiser that has ever
 * been bypassed. A post that wants a table gets the words for one.
 *
 * The only HTML in the output is the tags this file writes, and the only
 * attribute is `href`, whose value is scheme-checked below.
 *
 * NOT A GENERAL-PURPOSE RENDERER. It is deliberately strict and deliberately
 * small: unsupported syntax renders as the literal characters the author typed,
 * which is visible in review, rather than being silently dropped.
 */

/** `&` first, or the escapes escape each other. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Hrefs a post is allowed to point at: this site, or an absolute http(s) or
 * mailto URL. Anything else — `javascript:`, `data:`, a protocol-relative
 * `//host` — is refused, and the link renders as its own text so the reader
 * still gets the sentence.
 *
 * The value arrives ALREADY ESCAPED, so `&` is `&amp;` and it is safe to place
 * inside a double-quoted attribute as-is. The test runs against the unescaped
 * form because `&amp;` in a scheme is not a thing.
 */
function safeHref(href: string): string | null {
  const value = href.trim();
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return /^(https?:|mailto:)/i.test(value.replace(/&amp;/g, "&")) ? value : null;
}

/**
 * Inline formatting, applied to one already-escaped line.
 *
 * LINKS ARE LIFTED OUT FIRST and put back last. Emphasis run over a finished
 * `<a href="…">` would eat the underscores in a URL — `/a_b_c` is an ordinary
 * path and `_b_` is an ordinary italic — and there is no ordering of the two
 * rules that avoids it. A placeholder that cannot occur in the input is the
 * only way both rules can be simple.
 */
function inline(text: string): string {
  const links: string[] = [];
  // U+0000 cannot survive escapeHtml's input in practice, and is stripped from
  // the source below regardless, so it is free to use as a marker.
  // The href pattern allows ONE level of balanced parentheses, so a Wikipedia
  // URL survives and `javascript:alert(1)` is captured whole and refused whole
  // rather than leaving its closing bracket stranded in the sentence.
  let out = text.replace(/\[([^\]\n]*)\]\(([^()\s]*(?:\([^()\s]*\)[^()\s]*)*)\)/g, (whole, label: string, href: string) => {
    const safe = safeHref(href);
    if (!safe) return label.trim() || whole;
    // An empty label would be a link with no accessible name, which axe reports
    // and a screen reader announces as the URL anyway. Showing the URL is the
    // same information, said out loud.
    const i = links.push(`<a href="${safe}" class="underline underline-offset-4 hover:text-gold-dark">${emphasis(label.trim() || safe)}</a>`) - 1;
    return `\u0000${i}\u0000`;
  });
  out = emphasis(out);
  return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => links[Number(i)]);
}

/**
 * Bold before italic, because after `**x**` is consumed no `**` remains and the
 * italic rule can be a plain single-asterisk match. The `_` form is guarded on
 * both sides so snake_case in prose is not turned into emphasis.
 */
function emphasis(text: string): string {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/(?<![\p{L}\p{N}_])_([^_\n]+)_(?![\p{L}\p{N}_])/gu, "<em>$1</em>");
}

const UL = /^\s*[-*]\s+/;
const OL = /^\s*\d+\.\s+/;

/** One blank-line-separated block → one element. */
function block(lines: string[]): string {
  const h3 = lines[0].match(/^###\s+(.*)$/);
  if (h3) return `<h3>${inline(h3[1])}</h3>`;
  const h2 = lines[0].match(/^##\s+(.*)$/);
  if (h2) return `<h2>${inline(h2[1])}</h2>`;

  // A list only when EVERY line is an item. A block that is half prose and half
  // dashes is prose with dashes in it, and guessing which half was meant is how
  // a renderer starts producing surprises.
  if (lines.every((l) => UL.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(UL, ""))}</li>`).join("")}</ul>`;
  if (lines.every((l) => OL.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(OL, ""))}</li>`).join("")}</ol>`;

  // Single newlines inside a paragraph are a wrapped line, not a break — the
  // same reading every markdown implementation has. A real break is a blank line.
  return `<p>${inline(lines.join(" "))}</p>`;
}

/** Markdown → HTML. Empty in, empty out; never throws. */
export function renderMarkdown(source: string): string {
  const escaped = escapeHtml(source.replace(/\u0000/g, "").replace(/\r\n?/g, "\n"));
  return escaped
    .split(/\n{2,}/)
    .map((chunk) => chunk.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim() !== ""))
    .filter((lines) => lines.length > 0)
    .map(block)
    .join("");
}

/**
 * The static posts' bodies (lib/blog.ts) are `string[]` — one plain paragraph
 * per entry, authored before any of this existed. They PASS THROUGH as
 * paragraphs rather than being re-parsed: an asterisk someone typed in 2026 was
 * an asterisk, and a renderer that retroactively turns it into emphasis is
 * changing published copy nobody asked it to change.
 */
export function renderParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
}

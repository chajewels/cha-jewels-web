/**
 * A SMALL MARKDOWN RENDERER FOR POST BODIES, AND NOTHING ELSE.
 *
 * WHY NOT A LIBRARY: the input is one editor, writing prose, in a field the
 * owner controls — and the output goes through dangerouslySetInnerHTML. A full
 * CommonMark implementation plus a sanitiser is two dependencies and two
 * upgrade paths for a feature that needs six constructs. This is the six.
 *
 * WHAT IT SUPPORTS: paragraphs, `## h2`, `### h3`, unordered and ordered
 * lists, `[text](href)`, `**bold**`, `*italic*`, `_italic_`, a HARD BREAK (a
 * line ending in a backslash or two spaces) and a BACKSLASH ESCAPE before
 * punctuation.
 *
 * The last two came from lib/content/faq-markdown.ts, which converted the
 * hand-authored FAQ into the markdown the Hub now holds. A `lines` block was a
 * set of contact lines whose breaks carry meaning; the escape is what let that
 * converter be total. Both stay because the Hub's own answers use them — the
 * seeded markdown in docs/faq-seed.sql contains hard breaks today.
 *
 * NO RAW HTML, AND THAT IS A GUARANTEE RATHER THAN A FILTER. The source is
 * HTML-escaped as the FIRST step, before anything is parsed, so every `<` in
 * the input is already `&lt;` by the time a tag could be recognised. There is
 * no branch that lets a tag through, so there is no list of dangerous tags to
 * keep up to date — which is the failure mode of every sanitiser that has ever
 * been bypassed. A post that wants a table gets the words for one.
 *
 * The only HTML in the output is the tags this file writes, and `href` is the
 * ONLY attribute it ever emits — scheme-checked below. No classes either: how a
 * post looks is `.post-body` in globals.css, not a decision this file makes, so
 * a restyle never means touching the thing that produces the markup.
 *
 * NOT A GENERAL-PURPOSE RENDERER. It is deliberately strict and deliberately
 * small: unsupported syntax renders as the literal characters the author typed,
 * which is visible in review, rather than being silently dropped.
 */

/**
 * Sentinels for things that must survive parsing intact. Neither can appear in
 * the input: both are stripped from the source before anything else happens.
 *
 *   BREAK   a hard line break, recognised before blocks are split so the two
 *           lines stay one paragraph
 *   SLOT    a link or an escaped character, lifted out so emphasis cannot chew
 *           on a URL or on the very character that was escaped to hide it
 */
const BREAK = "\u0001";
const SLOT = "\u0000";

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
  const slots: string[] = [];
  const hold = (html: string) => `${SLOT}${slots.push(html) - 1}${SLOT}`;

  // A BACKSLASH ESCAPE IS HELD FIRST, before any rule can read the character it
  // was written to hide: `\*` must reach the page as an asterisk no emphasis
  // rule ever saw, and `\[` as a bracket no link rule ever saw.
  let out = text.replace(/\\([\\`*_[\]()#+\-.!>])/g, (_, ch: string) => hold(escapeHtml(ch)));

  // The href pattern allows ONE level of balanced parentheses, so a Wikipedia
  // URL survives and `javascript:alert(1)` is captured whole and refused whole
  // rather than leaving its closing bracket stranded in the sentence.
  out = out.replace(/\[([^\]\n]*)\]\(([^()\s]*(?:\([^()\s]*\)[^()\s]*)*)\)/g, (whole, label: string, href: string) => {
    const safe = safeHref(href);
    if (!safe) return label.trim() || whole;
    // An empty label would be a link with no accessible name, which axe reports
    // and a screen reader announces as the URL anyway. Showing the URL is the
    // same information, said out loud.
    return hold(`<a href="${safe}">${emphasis(label.trim() || safe)}</a>`);
  });

  out = emphasis(out);
  // Hard breaks last, so nothing above had to step around a <br />.
  out = out.split(BREAK).join("<br />");
  return out.replace(new RegExp(`${SLOT}(\\d+)${SLOT}`, "g"), (_, i: string) => slots[Number(i)]);
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
  const normalised = source
    .replace(/[\u0000\u0001]/g, "")
    .replace(/\r\n?/g, "\n")
    // A HARD BREAK — a line ending in a backslash or in two or more spaces —
    // becomes a sentinel that EATS its newline, so the two lines stay one
    // paragraph through the block split below. Not before a blank line: that
    // is a paragraph break, and the author meant the paragraph.
    .replace(/(?:\\|[ \t]{2,})\n(?!\n)/g, BREAK);
  const escaped = escapeHtml(normalised);
  const html = escaped
    .split(/\n{2,}/)
    .map((chunk) => chunk.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim() !== ""))
    .filter((lines) => lines.length > 0)
    .map(block)
    .join("");
  // ADJACENT LISTS OF THE SAME KIND ARE ONE LIST. An author who puts a blank
  // line between bullets means one list — CommonMark reads it that way too —
  // and block-at-a-time parsing would otherwise emit three lists of one item,
  // which a screen reader announces as "list, 1 item" three times over. The
  // seam is the only thing that has to go; the items are already correct.
  return html.replace(/<\/ul><ul>/g, "").replace(/<\/ol><ol>/g, "");
}

/**
 * Rendered markdown, flattened to plain text.
 *
 * WHY IT GOES THROUGH THE RENDERER rather than stripping the markdown directly:
 * the question it answers is "what does a reader see on this page?", and the
 * only thing that knows that is the thing that builds the page. A second
 * stripper would be a second opinion, and the two would disagree the first time
 * either was changed — which matters here because the answer this returns is
 * what /faq hands Google as FAQPage structured data. Showing a search engine an
 * answer a reader cannot find on the page is the failure to design out.
 *
 * Every element boundary becomes a single space, so two list items do not run
 * together into one word, and runs of whitespace collapse: the HTML has
 * newlines and indentation that a reader never sees either.
 */
export function markdownToText(source: string): string {
  return renderMarkdown(source)
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<\/(?:p|h2|h3|li|ul|ol)>/g, " ")
    .replace(/<[^>]*>/g, "")
    // Reverse of escapeHtml, and `&amp;` LAST for the same reason it was first.
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

#!/usr/bin/env node
// Step 4 (H1) live verification — the checks promised in docs/seo/STEP-4-H1-OWNER-PUBLISHING-CHECKLIST.md §8,
// run against the live site after the OWNER has saved the records in the Hub. Read-only: GET requests only;
// nothing is written anywhere. Usage:
//   node scripts/check-step4-live.mjs [--base https://www.chajewelsjp.com] [--json <out.json>] [--baseline <counts.json>]
//
// THE SOURCE OF TRUTH is the checklist itself: the approved wording is parsed from that file (copied there character
// for character from STEP-4-OWNER-APPROVAL-RECORD.md), never retyped here. If the owner changes a word in the Hub
// without changing the record, this check FAILS — by design (the checklist: "if you change any word, tell me").
//
// DEFAULT RUN = the twelve SEO listing pages only. The article (BUG-03) is a CONTENT task: it runs only with --article and
// never decides the default exit status. Exit: 0 fully verified, 1 a page failed/old/other/has a problem, 2 bad usage or a
// refused baseline, 3 all applied but preservation NOT VERIFIED (no --baseline). --capture-baseline <file> writes the schema-
// versioned pre-publication snapshot (membership by href, images, unrelated links, title, H1).
// Per listing record (four collections, two categories), per language, the §8 checks:
//   - HTTP 200 and no redirect;
//   - the approved text is the meta description AND appears in the page body; the old text is gone;
//   - canonical = the page's own public URL; hreflang en, ja and x-default present (unchanged);
//   - the number of product links on the page (membership) — reported, and compared with --baseline when given;
//   - no origin or country-branded-metal claim in the live description (the same rule as scripts/check-terminology.mjs).
// The article (§1) is a CONTENT task, not an SEO status item (PR #450): it passes only when BOTH language bodies
// carry the four approved paragraphs; the English body must no longer contain the removed phrase. The Japanese
// removed word cannot be written in this repository (terminology guard), so for Japanese the presence of the exact
// approved paragraph is the evidence (the deletion is inside that paragraph).
// Verdicts per page: APPLIED (approved live), OLD (still the previous text), OTHER (neither — tell the owner),
// or FAIL with the reason. Nothing is estimated; a page that cannot be read is FAIL.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const CHECKLIST = "docs/seo/STEP-4-H1-OWNER-PUBLISHING-CHECKLIST.md";
export const DEFAULT_BASE = "https://www.chajewelsjp.com";
const REQUEST_TIMEOUT_MS = 30000;

// Mirror of the claim rules in scripts/check-terminology.mjs (that file keeps them private; change both together).
const CLAIM_RULES = [
  /\b(?:japan(?:ese)?|saudi|italian|italy|dubai|hk|hong kong|chinese|thai|korean|philippine|filipino)\s+gold\b/i,
  /(?:日本|サウジ|イタリア|ドバイ|香港|中国|タイ|韓国)の?ゴールド/, /日本金/,
  /\bmade in japan\b/i, /日本製/, /\bcrafted in japan\b/i, /\bjapanese (?:workshops?|craftsmanship|artisans?)\b/i, /\bjewelry from japan\b/i, /日本で仕立て/, /日本の工房/, /日本のものづくり/,
];

export const norm = (t) => String(t ?? "").replace(/’/g, "'").replace(/\s+/g, " ").trim();
const unesc = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");

/**
 * Parse the checklist. Listing records (§2–§7): `{ name, urls: {en, ja}, existing: {en, ja}, approved: {en, ja} }`.
 * The article (§1): `{ name, urls, approvedParagraphs: {en: [...], ja: [...]}, removedEn: [...] }`.
 * Fails loudly when a record lacks a field: the check never guesses wording.
 */
export function parseChecklist(md) {
  const sections = md.split(/\n(?=## )/);
  const urlsOf = (s) => { const out = {}; for (const m of s.matchAll(/https:\/\/www\.chajewelsjp\.com\/(en|ja)\/[^\s`,)]+/g)) out[m[1]] ??= m[0]; return out; };
  const field = (s, label) => { const m = s.match(new RegExp(`\\*\\*${label}:\\*\\* (.+)`)); return m ? norm(m[1]) : null; };
  const listings = [];
  let article = null;
  for (const s of sections) {
    const h = s.match(/^## (\d+)\. (.+)$/m);
    if (!h) continue;
    const n = Number(h[1]), name = h[2].replace(/ — .*$/, "").trim();
    if (n === 1) {
      const rows = [...s.matchAll(/^\| (EN|JA), [^|]+\| ([^|]+)\| ([^|]+)\| ([^|]+)\|$/gm)];
      const approvedParagraphs = { en: [], ja: [] }, removedEn = [];
      for (const r of rows) {
        const lang = r[1].toLowerCase();
        const result = norm(r[4]).replace(/^["「]|["」]$/g, "");
        approvedParagraphs[lang].push(result);
        if (lang === "en") { const d = norm(r[3]).match(/the words "([^"]+)"/); if (d) removedEn.push(d[1]); }
      }
      if (approvedParagraphs.en.length < 2 || approvedParagraphs.ja.length < 2) throw new Error(`${CHECKLIST} §1: expected two approved paragraphs per language, got en=${approvedParagraphs.en.length} ja=${approvedParagraphs.ja.length}`);
      article = { name, urls: urlsOf(s), approvedParagraphs, removedEn: [...new Set(removedEn)] };
      continue;
    }
    if (n >= 2 && n <= 7) {
      const rec = { name, urls: urlsOf(s), existing: { en: field(s, "Existing EN"), ja: field(s, "Existing JA") }, approved: { en: field(s, "Approved EN"), ja: field(s, "Approved JA") } };
      for (const l of ["en", "ja"]) for (const k of ["existing", "approved"]) if (!rec[k][l]) throw new Error(`${CHECKLIST} §${n} ${name}: missing ${k} ${l.toUpperCase()} text`);
      for (const l of ["en", "ja"]) if (!rec.urls[l]) throw new Error(`${CHECKLIST} §${n} ${name}: missing the ${l.toUpperCase()} live URL`);
      listings.push(rec);
    }
  }
  if (listings.length !== 6) throw new Error(`${CHECKLIST}: expected 6 listing records (§2–§7), found ${listings.length}`);
  if (!article) throw new Error(`${CHECKLIST}: §1 article not found`);
  return { listings, article };
}

/** Strip scripts, styles and comments; the visible document only. */
const visible = (h) => String(h ?? "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, " ").replace(/<!--[\s\S]*?-->/g, " ");
const textOf = (frag) => norm(unesc(String(frag).replace(/<[^>]+>/g, " ")));
const section = (h, tag) => { const s = visible(h); const i = s.search(new RegExp(`<${tag}\\b`)); const e = s.lastIndexOf(`</${tag}>`); return i >= 0 && e > i ? s.slice(i, e) : null; };
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`)); return m ? unesc(m[1]) : null; };
/** The image identity behind a Next image URL (`/_next/image?url=<encoded>&w=…`) or the plain src. */
export const imageIdentity = (src) => { if (!src) return null; const m = src.match(/[?&]url=([^&]+)/); try { return m ? decodeURIComponent(m[1]) : src; } catch { return src; } };

/** Pull what the checks need from one HTML document (raw HTML, no DOM). The page is read in SECTIONS: head, <main>, the listing description block, the <article>. */
export function readHtml(html) {
  const h = String(html ?? "");
  const content = (re) => { const m = h.match(re); return m ? norm(unesc(m[1])) : null; };
  const metaDesc = content(/<meta name="description" content="([^"]*)"/);
  const ogDesc = content(/<meta property="og:description" content="([^"]*)"/);
  const twDesc = content(/<meta name="twitter:description" content="([^"]*)"/);
  const canonical = [...h.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]);
  const hreflang = [...h.matchAll(/<link rel="alternate" hrefLang="([^"]*)" href="([^"]*)"/g)].map((m) => ({ lang: m[1], href: m[2] }));
  const main = section(h, "main");
  const descBlocks = main ? [...main.matchAll(/<p class="cs-desc[^"]*"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => textOf(m[1])) : [];
  const articleHtml = section(h, "article");
  const hrefs = main ? [...main.matchAll(/<a\b[^>]*>/g)].map((m) => attr(m[0], "href")).filter(Boolean) : [];
  const members = [...new Set(hrefs.map((x) => x.split(/[?#]/)[0]).filter((x) => /^\/(?:en|ja)\/products\/[^/]+$/.test(x)))].sort();
  const otherLinks = [...new Set(hrefs.filter((x) => !/^\/(?:en|ja)\/products\/[^/?#]+(?:[?#]|$)/.test(x)))].sort();
  const images = main ? [...new Set([...main.matchAll(/<img\b[^>]*>/g)].map((m) => imageIdentity(attr(m[0], "src"))).filter(Boolean))].sort() : [];
  const title = content(/<title>([^<]*)<\/title>/);
  const h1 = main ? (() => { const m = main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/); return m ? textOf(m[1]) : null; })() : null;
  return { metaDesc, ogDesc, twDesc, canonical, hreflang, descBlocks, mainText: main ? textOf(main) : "", articleParagraphs: articleHtml ? [...articleHtml.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) => textOf(m[1])) : null, members, otherLinks, images, title, h1, productLinks: members.length };
}

/** APPLIED / OLD / OTHER for one text against the record's wording. */
export const classify = (text, existing, approved) => (text == null ? "NONE" : norm(text) === norm(approved) ? "APPLIED" : norm(text) === norm(existing) ? "OLD" : "OTHER");

// ---------------------------------------------------------------- the baseline (recorded BEFORE publication)
export const BASELINE_SCHEMA = "cha-step4-baseline/1";
/** Snapshot of one listing page for the preservation checks. */
export const snapshotOf = (html) => { const d = readHtml(html); return { title: d.title, h1: d.h1, members: d.members, images: d.images, otherLinks: d.otherLinks, canonical: d.canonical[0] ?? null }; };
/**
 * Validate a baseline object against the schema and the checklist's listing URLs. Returns { ok, errors }.
 * The old count-only file (`{ counts: {...} }`) is REFUSED, not silently ignored.
 */
export function validateBaseline(b, listings) {
  const errors = [];
  if (!b || typeof b !== "object" || Array.isArray(b)) return { ok: false, errors: ["baseline is not a JSON object"] };
  if (b.schema !== BASELINE_SCHEMA) errors.push(`baseline schema is ${JSON.stringify(b.schema)}, expected ${JSON.stringify(BASELINE_SCHEMA)}${b.counts ? " (this looks like the retired counts-only file)" : ""}`);
  if (!b.pages || typeof b.pages !== "object") errors.push("baseline has no `pages` object");
  else for (const rec of listings) for (const l of ["en", "ja"]) {
    const p = b.pages[rec.urls[l]];
    if (!p) { errors.push(`baseline lacks ${rec.urls[l]}`); continue; }
    for (const k of ["members", "images", "otherLinks"]) if (!Array.isArray(p[k]) || !p[k].every((x) => typeof x === "string")) errors.push(`${rec.urls[l]}: \`${k}\` must be an array of strings`);
    if (Array.isArray(p.members) && p.members.length === 0) errors.push(`${rec.urls[l]}: baseline has no members (an empty listing cannot baseline membership)`);
  }
  return { ok: errors.length === 0, errors };
}
const setDiff = (a, b) => a.filter((x) => !b.includes(x));

/** One listing page: `{ verdict, problems, notVerified, facts }`. `res` = { status, redirected, location, html }. */
export function evaluateListing(res, rec, lang, { baselinePage = null } = {}) {
  const problems = [], notVerified = [];
  if (res.status !== 200) return { verdict: "FAIL", problems: [`status ${res.status}${res.location ? ` → ${res.location}` : ""}`], notVerified, facts: {} };
  if (res.redirected) problems.push(`redirected to ${res.location ?? "?"}`);
  const d = readHtml(res.html);
  const approved = rec.approved[lang], existing = rec.existing[lang];
  // Every place the description appears must agree: meta, og, twitter, and THE description block of the page (never header/footer/product cards).
  const states = { meta: classify(d.metaDesc, existing, approved), og: classify(d.ogDesc, existing, approved), twitter: classify(d.twDesc, existing, approved) };
  if (d.descBlocks.length !== 1) problems.push(`${d.descBlocks.length} description block(s) in <main>, expected exactly 1`);
  states.visible = d.descBlocks.length === 1 ? classify(d.descBlocks[0], existing, approved) : "NONE";
  const own = rec.urls[lang], other = rec.urls[lang === "en" ? "ja" : "en"], en = rec.urls.en;
  if (d.canonical.length !== 1 || d.canonical[0] !== own) problems.push(`canonical ${d.canonical.join("|") || "missing"} ≠ ${own}`);
  const hl = Object.fromEntries(d.hreflang.map((x) => [x.lang, x.href]));
  const hlOk = d.hreflang.length === 3 && hl.en === rec.urls.en && hl.ja === rec.urls.ja && hl["x-default"] === en;
  if (!hlOk) problems.push(`hreflang destinations ${d.hreflang.map((x) => `${x.lang}=${x.href}`).join(" ") || "missing"} ≠ en=${rec.urls.en} ja=${rec.urls.ja} x-default=${en}`);
  for (const [name, text] of [["meta", d.metaDesc], ["og", d.ogDesc], ["visible", d.descBlocks[0]]]) { const claim = text != null && CLAIM_RULES.find((r) => r.test(text)); if (claim) problems.push(`${name} description carries an origin or country-branded-metal claim (${claim})`); }
  // Preservation against the pre-publication snapshot, by identity — or NOT VERIFIED.
  if (!baselinePage) notVerified.push("membership identities, images, unrelated links, title and H1 preservation (no baseline)");
  else {
    const gone = setDiff(baselinePage.members, d.members), added = setDiff(d.members, baselinePage.members);
    if (gone.length || added.length) problems.push(`membership changed: ${gone.length} removed${gone.length ? ` (e.g. ${gone.slice(0, 2).join(", ")})` : ""}, ${added.length} added${added.length ? ` (e.g. ${added.slice(0, 2).join(", ")})` : ""}`);
    const imgGone = setDiff(baselinePage.images, d.images); if (imgGone.length) problems.push(`${imgGone.length} image(s) gone (e.g. ${imgGone[0]})`);
    const imgNew = setDiff(d.images, baselinePage.images); if (imgNew.length) problems.push(`${imgNew.length} image(s) added (e.g. ${imgNew[0]})`);
    const lkGone = setDiff(baselinePage.otherLinks, d.otherLinks); if (lkGone.length) problems.push(`${lkGone.length} unrelated link(s) gone (e.g. ${lkGone[0]})`);
    const lkNew = setDiff(d.otherLinks, baselinePage.otherLinks); if (lkNew.length) problems.push(`${lkNew.length} unrelated link(s) added (e.g. ${lkNew[0]})`);
    if (baselinePage.title !== d.title) problems.push(`title changed: ${JSON.stringify(baselinePage.title)} → ${JSON.stringify(d.title)}`);
    if (baselinePage.h1 !== d.h1) problems.push(`H1 changed: ${JSON.stringify(baselinePage.h1)} → ${JSON.stringify(d.h1)}`);
  }
  const all = Object.values(states);
  let verdict;
  if (all.every((x) => x === "APPLIED")) verdict = "APPLIED";
  else if (all.every((x) => x === "OLD")) verdict = "OLD";
  else { verdict = "OTHER"; problems.push(`descriptions disagree or are neither approved nor previous: ${Object.entries(states).map(([k, v]) => `${k}=${v}`).join(" ")}${states.visible === "OTHER" ? ` — visible text: ${JSON.stringify(d.descBlocks[0])}` : ""}${states.meta === "OTHER" ? ` — meta text: ${JSON.stringify(d.metaDesc)}` : ""}`); }
  if (problems.length && verdict !== "OTHER") verdict = `${verdict} WITH PROBLEMS`;
  return { verdict, problems, notVerified, facts: { states, productLinks: d.productLinks, canonical: d.canonical[0] ?? null, hreflang: d.hreflang.map((x) => x.lang) } };
}

/**
 * The article (a CONTENT task, never part of the default SEO run): scoped to the <article> body only — header, footer and
 * the approved footer clarifier are outside it. APPLIED when every approved paragraph is present as a whole paragraph and,
 * in English, no paragraph of the article still contains the removed phrase.
 */
export function evaluateArticle(res, article, lang) {
  if (res.status !== 200) return { verdict: "FAIL", problems: [`status ${res.status}`], notVerified: [], facts: {} };
  const d = readHtml(res.html);
  if (!d.articleParagraphs) return { verdict: "FAIL", problems: ["no <article> element: the article body cannot be scoped"], notVerified: [], facts: {} };
  const paras = d.articleParagraphs.map(norm);
  const missing = article.approvedParagraphs[lang].filter((p) => !paras.includes(norm(p)));
  const leftovers = lang === "en" ? paras.filter((p) => article.removedEn.some((w) => p.includes(norm(w)))) : [];
  const problems = [...missing.map((p) => `approved paragraph not found in the article body: ${p.slice(0, 60)}…`), ...leftovers.map((p) => `article paragraph still carries a removed phrase: ${p.slice(0, 60)}…`)];
  if (res.redirected) problems.push(`redirected to ${res.location ?? "?"}`);
  return { verdict: problems.length ? "NOT APPLIED" : "APPLIED", problems, notVerified: [], facts: { paragraphsFound: article.approvedParagraphs[lang].length - missing.length, of: article.approvedParagraphs[lang].length } };
}

export async function fetchPage(url) {
  try {
    const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { "user-agent": "cha-step4-check/1", "cache-control": "no-cache" } });
    const redirected = r.status >= 300 && r.status < 400;
    return { status: r.status, redirected, location: r.headers.get("location"), html: redirected ? "" : await r.text() };
  } catch (e) { return { status: 0, redirected: false, location: null, html: "", error: e instanceof Error ? e.message : String(e) }; }
}

/** Run the SEO listing checks against `base` (the live URLs in the checklist are rewritten onto it). The article only when `article: true`. */
export async function runLive({ listings, article }, { base = DEFAULT_BASE, baseline = null, withArticle = false } = {}) {
  const onBase = (u) => u.replace(DEFAULT_BASE, base.replace(/\/$/, ""));
  const rows = [];
  for (const rec of listings) for (const lang of ["en", "ja"]) {
    const res = await fetchPage(onBase(rec.urls[lang]));
    rows.push({ kind: "SEO", record: rec.name, lang, url: rec.urls[lang], ...evaluateListing(res, rec, lang, { baselinePage: baseline?.pages?.[rec.urls[lang]] ?? null }) });
  }
  if (withArticle) for (const lang of ["en", "ja"]) {
    const res = await fetchPage(onBase(article.urls[lang]));
    rows.push({ kind: "CONTENT (BUG-03; not an SEO status item)", record: article.name, lang, url: article.urls[lang], ...evaluateArticle(res, article, lang) });
  }
  return rows;
}

/** Capture the pre-publication baseline (schema `cha-step4-baseline/1`) from the live pages. Read-only. */
export async function captureBaseline({ listings }, { base = DEFAULT_BASE } = {}) {
  const onBase = (u) => u.replace(DEFAULT_BASE, base.replace(/\/$/, ""));
  const pages = {};
  for (const rec of listings) for (const lang of ["en", "ja"]) {
    const res = await fetchPage(onBase(rec.urls[lang]));
    if (res.status !== 200) throw new Error(`cannot baseline ${rec.urls[lang]}: status ${res.status}`);
    pages[rec.urls[lang]] = snapshotOf(res.html);
  }
  return { schema: BASELINE_SCHEMA, capturedAt: new Date().toISOString(), base, note: "Snapshot of the twelve Step 4 listing pages BEFORE the owner publishes: product membership by href, image identities, unrelated links, title and H1. Compared by scripts/check-step4-live.mjs --baseline.", pages };
}

/** Exit status of a run: 1 = a FAIL / OTHER / OLD / problem; 3 = every listing APPLIED but some preservation is NOT VERIFIED; 0 = fully verified. */
export function exitStatus(rows) {
  if (rows.some((r) => r.verdict !== "APPLIED")) return 1;
  if (rows.some((r) => r.notVerified?.length)) return 3;
  return 0;
}

export function renderReport(rows, { base, when }) {
  const L = [`# Step 4 live check — ${when} — ${base}`, "", "| Kind | Record | Lang | Verdict | Problems | NOT VERIFIED | Members |", "|---|---|---|---|---|---|---|"];
  for (const r of rows) L.push(`| ${r.kind} | ${r.record} | ${r.lang.toUpperCase()} | **${r.verdict}** | ${r.problems.join("; ") || "—"} | ${r.notVerified?.join("; ") || "—"} | ${r.facts.productLinks ?? "—"} |`);
  const seo = rows.filter((r) => r.kind === "SEO"), applied = seo.filter((r) => r.verdict === "APPLIED").length;
  L.push("", `Listing texts applied: ${applied} of ${seo.length}.`);
  const art = rows.filter((r) => r.kind !== "SEO");
  L.push(art.length ? `Article (content task, run only because --article was given): ${art.map((r) => `${r.lang.toUpperCase()} ${r.verdict}`).join(", ")}; BUG-03 closes only when both languages are APPLIED.` : "Article: not run (a separate content task; select it with --article).");
  return L.join("\n") + "\n";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const base = opt("--base") ?? DEFAULT_BASE;
  const parsed = parseChecklist(readFileSync(join(process.cwd(), CHECKLIST), "utf8"));
  if (args.includes("--capture-baseline")) {
    const out = opt("--capture-baseline");
    if (!out || out.startsWith("--")) { console.error("usage: --capture-baseline <file.json>"); process.exit(2); }
    const b = await captureBaseline(parsed, { base });
    writeFileSync(out, JSON.stringify(b, null, 1));
    console.log(`baseline written: ${out} (${Object.keys(b.pages).length} pages, ${Object.values(b.pages).reduce((a, p) => a + p.members.length, 0)} member links)`);
    process.exit(0);
  }
  let baseline = null;
  if (opt("--baseline")) {
    let raw;
    try { raw = JSON.parse(readFileSync(opt("--baseline"), "utf8")); } catch (e) { console.error(`baseline unreadable: ${e instanceof Error ? e.message : e}`); process.exit(2); }
    const v = validateBaseline(raw, parsed.listings);
    if (!v.ok) { console.error(`baseline REFUSED:\n- ${v.errors.slice(0, 8).join("\n- ")}`); process.exit(2); }
    baseline = raw;
  }
  const rows = await runLive(parsed, { base, baseline, withArticle: args.includes("--article") });
  const when = new Date().toISOString();
  process.stdout.write(renderReport(rows, { base, when }));
  if (opt("--json")) writeFileSync(opt("--json"), JSON.stringify({ when, base, rows }, null, 1));
  process.exitCode = exitStatus(rows);
}

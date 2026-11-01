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

/** Pull what the checks need from one HTML document (raw HTML, no DOM). */
export function readHtml(html) {
  const h = String(html ?? "");
  const metaDesc = (h.match(/<meta name="description" content="([^"]*)"/) ?? [])[1] ?? null;
  const ogDesc = (h.match(/<meta property="og:description" content="([^"]*)"/) ?? [])[1] ?? null;
  const canonical = [...h.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]);
  const hreflang = [...h.matchAll(/<link rel="alternate" hrefLang="([^"]*)" href="([^"]*)"/g)].map((m) => m[1]).sort();
  const body = norm(unesc(h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")));
  const productLinks = new Set([...h.matchAll(/href="(\/(?:en|ja)\/products\/[^"/?#]+)"/g)].map((m) => m[1])).size;
  return { metaDesc: metaDesc == null ? null : norm(unesc(metaDesc)), ogDesc: ogDesc == null ? null : norm(unesc(ogDesc)), canonical, hreflang, body, productLinks };
}

/** APPLIED / OLD / OTHER for one text against the record's wording. */
export const classify = (text, existing, approved) => (text == null ? "NONE" : norm(text) === norm(approved) ? "APPLIED" : norm(text) === norm(existing) ? "OLD" : "OTHER");

/** One listing page: `{ verdict, problems, facts }`. `res` = { status, redirected, location, html }. */
export function evaluateListing(res, rec, lang, { baselineCount = null } = {}) {
  const problems = [];
  if (res.status !== 200) return { verdict: "FAIL", problems: [`status ${res.status}${res.location ? ` → ${res.location}` : ""}`], facts: {} };
  if (res.redirected) problems.push(`redirected to ${res.location ?? "?"}`);
  const d = readHtml(res.html);
  const approved = rec.approved[lang], existing = rec.existing[lang];
  const meta = classify(d.metaDesc, existing, approved);
  const bodyHasApproved = d.body.includes(norm(approved)), bodyHasOld = d.body.includes(norm(existing));
  const own = rec.urls[lang];
  if (d.canonical.length !== 1 || d.canonical[0] !== own) problems.push(`canonical ${d.canonical.join("|") || "missing"} ≠ ${own}`);
  if (d.hreflang.join(",") !== "en,ja,x-default") problems.push(`hreflang ${d.hreflang.join(",") || "missing"}`);
  const claim = d.metaDesc != null && CLAIM_RULES.find((r) => r.test(d.metaDesc));
  if (claim) problems.push(`live description carries an origin or country-branded-metal claim (${claim})`);
  if (baselineCount != null && d.productLinks !== baselineCount) problems.push(`product links ${d.productLinks} ≠ baseline ${baselineCount} (membership changed?)`);
  let verdict;
  if (meta === "APPLIED" && bodyHasApproved && !bodyHasOld) verdict = "APPLIED";
  else if (meta === "OLD" && bodyHasOld && !bodyHasApproved) verdict = "OLD";
  else verdict = "OTHER";
  if (meta === "NONE") problems.push("no meta description");
  if (verdict === "OTHER") problems.push(`meta=${meta}, body has approved=${bodyHasApproved}, body has old=${bodyHasOld}${meta === "OTHER" ? `, meta text: ${JSON.stringify(d.metaDesc)}` : ""}`);
  if (problems.length && verdict !== "OTHER") verdict = `${verdict} WITH PROBLEMS`;
  return { verdict, problems, facts: { metaDesc: d.metaDesc, ogDesc: d.ogDesc, productLinks: d.productLinks, canonical: d.canonical[0] ?? null, hreflang: d.hreflang } };
}

/** The article page in one language: APPLIED when every approved paragraph is present (and, for English, the removed phrase is gone). */
export function evaluateArticle(res, article, lang) {
  if (res.status !== 200) return { verdict: "FAIL", problems: [`status ${res.status}`], facts: {} };
  const d = readHtml(res.html);
  const missing = article.approvedParagraphs[lang].filter((p) => !d.body.includes(norm(p)));
  const leftovers = lang === "en" ? article.removedEn.filter((w) => d.body.includes(norm(w))) : [];
  const problems = [...missing.map((p) => `approved paragraph not found: ${p.slice(0, 60)}…`), ...leftovers.map((w) => `removed phrase still present: ${JSON.stringify(w)}`)];
  if (res.redirected) problems.push(`redirected to ${res.location ?? "?"}`);
  return { verdict: problems.length ? "NOT APPLIED" : "APPLIED", problems, facts: { paragraphsFound: article.approvedParagraphs[lang].length - missing.length, of: article.approvedParagraphs[lang].length } };
}

export async function fetchPage(url) {
  try {
    const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { "user-agent": "cha-step4-check/1", "cache-control": "no-cache" } });
    const redirected = r.status >= 300 && r.status < 400;
    return { status: r.status, redirected, location: r.headers.get("location"), html: redirected ? "" : await r.text() };
  } catch (e) { return { status: 0, redirected: false, location: null, html: "", error: e instanceof Error ? e.message : String(e) }; }
}

/** Run every check against `base` (the live URLs in the checklist are rewritten onto it). */
export async function runLive({ listings, article }, { base = DEFAULT_BASE, baseline = null } = {}) {
  const onBase = (u) => u.replace(DEFAULT_BASE, base.replace(/\/$/, ""));
  const rows = [];
  for (const rec of listings) for (const lang of ["en", "ja"]) {
    const res = await fetchPage(onBase(rec.urls[lang]));
    const r = evaluateListing(res, rec, lang, { baselineCount: baseline?.[rec.urls[lang]] ?? null });
    rows.push({ kind: "SEO", record: rec.name, lang, url: rec.urls[lang], ...r });
  }
  for (const lang of ["en", "ja"]) {
    const res = await fetchPage(onBase(article.urls[lang]));
    rows.push({ kind: "CONTENT (not an SEO status item)", record: article.name, lang, url: article.urls[lang], ...evaluateArticle(res, article, lang) });
  }
  return rows;
}

export function renderReport(rows, { base, when }) {
  const L = [`# Step 4 live check — ${when} — ${base}`, "", "| Kind | Record | Lang | Verdict | Problems | Product links |", "|---|---|---|---|---|---|"];
  for (const r of rows) L.push(`| ${r.kind} | ${r.record} | ${r.lang.toUpperCase()} | **${r.verdict}** | ${r.problems.join("; ") || "—"} | ${r.facts.productLinks ?? "—"} |`);
  const applied = rows.filter((r) => r.kind === "SEO" && r.verdict === "APPLIED").length, seo = rows.filter((r) => r.kind === "SEO").length;
  L.push("", `Listing texts applied: ${applied} of ${seo}. Article: ${rows.filter((r) => r.kind !== "SEO").map((r) => `${r.lang.toUpperCase()} ${r.verdict}`).join(", ")}. BUG-03 closes only when both article languages are APPLIED (content task).`);
  return L.join("\n") + "\n";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const base = opt("--base") ?? DEFAULT_BASE;
  const baseline = opt("--baseline") ? JSON.parse(readFileSync(opt("--baseline"), "utf8")) : null;
  const parsed = parseChecklist(readFileSync(join(process.cwd(), CHECKLIST), "utf8"));
  const rows = await runLive(parsed, { base, baseline });
  const when = new Date().toISOString();
  process.stdout.write(renderReport(rows, { base, when }));
  if (opt("--json")) writeFileSync(opt("--json"), JSON.stringify({ when, base, rows }, null, 1));
  process.exitCode = rows.every((r) => r.verdict === "APPLIED") ? 0 : 1;
}

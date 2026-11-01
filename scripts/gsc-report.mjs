#!/usr/bin/env node
// Search Console weekly report from CSV exports (Phase 12, docs/seo/phase-12/SEARCH-CONSOLE-OPERATIONS.md §7).
// Usage: node scripts/gsc-report.mjs <export-dir> [previous-export-dir] [--out <file.md>]
//
// THE ONE RULE: no metric is filled in without an export. Every cell comes from a row of a CSV file that Search
// Console itself wrote; a missing file yields NO EXPORT in that section; a missing previous period yields
// NO PREVIOUS EXPORT. Nothing is estimated, remembered or fetched: no network, no credentials, read-only.
//
// WHAT AN EXPORT CAN AND CANNOT SAY (kept apart everywhere below):
//  - ABSENT IS NOT ZERO. The Queries export lists DISCLOSED rows only: anonymised queries and rows beyond the
//    export limit are not in it. A term that does not appear has UNKNOWN impressions, not zero; sums over the
//    query rows are sums of DISCLOSED rows, not property totals. Property totals come from Chart.csv alone.
//  - MALFORMED IS REJECTED, NOT ZEROED. A metric cell that is not a number of the expected kind, a row with the
//    wrong number of fields, an empty key, clicks above impressions, a CTR outside 0–100 %, a position below 1,
//    a date that is not YYYY-MM-DD, a repeated key: the file is refused with the row number. Nothing becomes 0.
//  - HOSTS ARE CLASSIFIED, NOT ASSUMED. A Domain property reports every host and scheme of the domain. A page
//    URL is a site page only on the canonical host over https; any other host or scheme is reported as such,
//    and a value that is not an absolute URL is reported as unparseable, never as a locale segment.
//  - COMPARISONS NEED A CONTEXT. A period-over-period change is printed only when both periods are known
//    (from each folder's Chart.csv), of equal length, and the previous one ends before the current one starts;
//    otherwise the change column says why not. The same folder as both periods is refused.
//  - NOTHING UNOBSERVED. Every rule fires on export rows only; no "expected" trend, no prefilled "none".
//
// INPUT. A directory of Search Console "Download CSV" files. Search Console names them Queries.csv, Pages.csv,
// Countries.csv, Devices.csv, Chart.csv (the ops document's convention YYYY-MM-DD-queries.csv … is accepted too);
// matched on the base name, case-insensitively; two files of one kind in a folder are refused. Headers are read
// as written (Top queries / Top pages / Country / Device / Date, Clicks, Impressions, CTR, Position); an unknown
// header FAILS loudly. The exact header names Search Console writes are UNVERIFIED until the first real export
// (SEARCH-CONSOLE-OPERATIONS.md §10); that is why they are checked, not guessed. UTF-8 with or without BOM.
//
// SAFETY. The inputs are downloaded files: cell text is DATA (pipes and angle brackets are escaped in the Markdown,
// nothing from a cell is executed or used as a path), and the script reads only files named like the exports.
//
// OUTPUT. The §6 report shape as Markdown on stdout, optionally written to --out. Rules R1–R10 use the thresholds
// below (OD-SC-4 tunes them after 8 weeks); the regexes mirror §4 so the subset files are optional.
import { readdirSync, readFileSync, writeFileSync, statSync, realpathSync } from "node:fs";
import { basename, join, resolve } from "node:path";

/** The one host on which a page URL is a site page (Search Console Domain property `chajewelsjp.com`). */
export const CANONICAL_HOST = "www.chajewelsjp.com";
export const THRESHOLDS = Object.freeze({
  R1: { impressions: 200, ctr: 0.01, position: 10 },
  R2: { posMin: 5, posMax: 20, impressions: 50 },
  R3: { impressions: 100 },
  R4: { dropRatio: 0.3 },
  R8: { impressions: 30 },
});
/** §4 regexes (RE2-compatible in Search Console; JS here). */
export const RX = Object.freeze({
  question: /^(what|where|why|which|how|can|does|do|is|are|who|when|should)\b|^(ano|saan|paano|bakit|magkano|pwede|puwede|kailan|sino)\b|(とは|何|なに|どこ|どう|いくら|なぜ|方法)/i,
  filipino: /\b(saan|paano|ano|magkano|bakit|pwede|puwede|tunay|peke|legit|hulugan|hulog|alahas|bili|bumili|makakabili|padala|pilipinas|pinoy|pinay|kabayan|para sa|mura|presyo)\b/i,
  brand: /cha ?jewels|chajewels|チャジュエルズ|チャ ?ジュエルズ/i,
  territory: /\b(kihei|k18|18k|750|layaway|preloved|hallmark|katsushika|tateishi)\b|喜平/i, // `\b` has no meaning beside CJK text, so the Japanese term stands alone
});
/** Target terms for the R5 row (§4.4). Absence from the disclosed rows is recorded as ABSENT, never as zero. */
export const TARGET_TERMS = Object.freeze(["kihei", "k18", "layaway", "preloved", "hallmark"]);
const KINDS = { queries: /^(?:(\d{4}-\d{2}-\d{2})-)?queries\.csv$/i, pages: /^(?:(\d{4}-\d{2}-\d{2})-)?pages\.csv$/i, countries: /^(?:(\d{4}-\d{2}-\d{2})-)?countries\.csv$/i, devices: /^(?:(\d{4}-\d{2}-\d{2})-)?devices\.csv$/i, chart: /^(?:(\d{4}-\d{2}-\d{2})-)?chart\.csv$/i };
const LABEL = { queries: "Top queries", pages: "Top pages", countries: "Country", devices: "Device", chart: "Date" };
const METRICS = ["Clicks", "Impressions", "CTR", "Position"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** RFC-4180-ish CSV: quoted fields, doubled quotes, CRLF, BOM. Returns rows of strings. */
export function parseCsv(text) {
  const s = text.replace(/^\uFEFF/, "");
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c; continue; }
    if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

const bad = (name, n, what, v) => new Error(`${name} row ${n}: ${what}: ${JSON.stringify(String(v))}`);
/** A non-negative integer as Search Console writes it (thousands separators allowed). Throws on anything else. */
const count = (v, name, n, col) => { const t = String(v ?? "").replace(/,/g, "").trim(); if (!/^\d+$/.test(t)) throw bad(name, n, `${col} is not a non-negative integer`, v); return Number(t); };
/** "1.23%" → 0.0123. Throws on a missing percent sign or a value above 100 %. */
const pct = (v, name, n) => { const m = String(v ?? "").trim().match(/^(\d+(?:\.\d+)?)%$/); if (!m) throw bad(name, n, "CTR is not a percentage", v); const x = Number(m[1]) / 100; if (x > 1) throw bad(name, n, "CTR above 100%", v); return x; };
/** A position ≥ 1 (Search Console never reports below 1). Throws otherwise. */
const pos = (v, name, n) => { const t = String(v ?? "").trim(); if (!/^\d+(?:\.\d+)?$/.test(t) || Number(t) < 1) throw bad(name, n, "Position is not a number ≥ 1", v); return Number(t); };

/** One export table: `{ kind, label, rows: [{ key, clicks, impressions, ctr, position }] }`. Fails loudly on an unknown header or a malformed row. */
export function parseExport(kind, text, name = kind) {
  const rows = parseCsv(text);
  if (rows.length === 0) throw new Error(`${name}: empty file`);
  const header = rows[0].map((h) => h.trim());
  const keyIdx = header.findIndex((h) => h === LABEL[kind]);
  if (keyIdx < 0) throw new Error(`${name}: unknown header ${JSON.stringify(header)}; expected a "${LABEL[kind]}" column as Search Console writes it`);
  const idx = Object.fromEntries(METRICS.map((m) => [m, header.indexOf(m)]));
  for (const m of METRICS) if (idx[m] < 0) throw new Error(`${name}: missing the "${m}" column; header ${JSON.stringify(header)}`);
  const out = rows.slice(1).map((r, i) => {
    const n = i + 2;
    if (r.length !== header.length) throw bad(name, n, `expected ${header.length} fields, got ${r.length}`, r.join(","));
    const key = r[keyIdx].trim();
    if (!key) throw bad(name, n, `empty "${LABEL[kind]}" cell`, r[keyIdx]);
    if (kind === "chart" && !DATE.test(key)) throw bad(name, n, "Date is not YYYY-MM-DD", key);
    const clicks = count(r[idx.Clicks], name, n, "Clicks"), impressions = count(r[idx.Impressions], name, n, "Impressions");
    if (clicks > impressions) throw bad(name, n, "Clicks exceed Impressions", `${clicks}>${impressions}`);
    return { key, clicks, impressions, ctr: pct(r[idx.CTR], name, n), position: pos(r[idx.Position], name, n) };
  });
  const seen = new Set();
  for (const [i, r] of out.entries()) { if (seen.has(r.key)) throw bad(name, i + 2, `duplicate "${LABEL[kind]}" row`, r.key); seen.add(r.key); }
  return { kind, label: LABEL[kind], rows: out };
}

/** The period an export covers, from its Chart rows: `{ start, end, days }` (inclusive calendar days), or null without a Chart export. */
export function periodOf(exports) {
  const dates = exports.chart?.rows.map((r) => r.key).sort() ?? [];
  if (!dates.length) return null;
  const start = dates[0], end = dates[dates.length - 1];
  return { start, end, days: Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1 };
}

/** Read the recognised export files of a directory. Unknown files are ignored; two files of one kind, or mixed date prefixes, are refused. */
export function readExports(dir) {
  const out = { dir, files: [], datePrefix: null, period: null };
  for (const name of readdirSync(dir).sort()) {
    const kind = Object.keys(KINDS).find((k) => KINDS[k].test(basename(name)));
    if (!kind || !statSync(join(dir, name)).isFile()) continue;
    if (out[kind]) throw new Error(`${dir}: two "${kind}" exports (${out.files.find((f) => KINDS[kind].test(f))} and ${name}); keep one per folder`);
    const prefix = basename(name).match(KINDS[kind])[1] ?? null;
    if (prefix && out.datePrefix && prefix !== out.datePrefix) throw new Error(`${dir}: files carry different date prefixes (${out.datePrefix} and ${prefix}); one export per folder`);
    if (prefix) out.datePrefix = prefix;
    out[kind] = parseExport(kind, readFileSync(join(dir, name), "utf8"), name);
    out.files.push(name);
  }
  out.period = periodOf(out);
  return out;
}

/**
 * How the two folders relate: `{ state: "none" | "comparable" | "not-comparable" | "unknown", reason }`.
 * Changes are printed only for "comparable". The same folder as both periods is refused outright.
 */
export function comparison(cur, prev) {
  if (!prev) return { state: "none", reason: "NO PREVIOUS EXPORT" };
  const same = (a, b) => { try { return realpathSync(a) === realpathSync(b); } catch { return resolve(a) === resolve(b); } };
  if (same(cur.dir, prev.dir)) throw new Error("the previous export folder is the current one");
  if (cur.datePrefix && prev.datePrefix && prev.datePrefix >= cur.datePrefix) throw new Error(`the previous export (${prev.datePrefix}) is not dated before the current one (${cur.datePrefix})`);
  if (!cur.period || !prev.period) return { state: "unknown", reason: `period unknown: no Chart export in ${!cur.period ? "the current" : "the previous"} folder` };
  if (prev.period.end >= cur.period.start) return { state: "not-comparable", reason: `periods overlap (previous ends ${prev.period.end}, current starts ${cur.period.start})` };
  if (prev.period.days !== cur.period.days) return { state: "not-comparable", reason: `periods differ in length (${prev.period.days} vs ${cur.period.days} days)` };
  return { state: "comparable", reason: `${prev.period.days} day(s) each, previous ends ${prev.period.end}` };
}

/**
 * Where a Pages-export URL belongs: `{ segment, host, scheme }` with segment one of
 * "root" | "/en/" | "/ja/" | "legacy" (a bare path on the canonical host) | "other-host" (another host or scheme of the
 * Domain property) | "unparseable" (not an absolute URL). Only the canonical host over https yields a locale segment.
 */
export function classifyPage(url, host = CANONICAL_HOST) {
  let u;
  try { u = new URL(String(url)); } catch { return { segment: "unparseable", host: null, scheme: null }; }
  const where = { host: u.host, scheme: u.protocol.replace(":", "") };
  if (u.host !== host || u.protocol !== "https:") return { segment: "other-host", ...where };
  const p = u.pathname;
  // The root `/` is a listed page in its own right (sitemap policy OD-3), not a legacy bare URL, so it is its own segment.
  return { segment: p === "/" ? "root" : /^\/en(\/|$)/.test(p) ? "/en/" : /^\/ja(\/|$)/.test(p) ? "/ja/" : "legacy", ...where };
}
const isSitePage = (r, host) => { const s = classifyPage(r.key, host).segment; return s !== "other-host" && s !== "unparseable"; };

/** Rules R1–R10 over the current (and, where comparable, previous) exports. Each opportunity names its rule, row and action, nothing more. */
export function opportunities(cur, prev, { host = CANONICAL_HOST, cmp = comparison(cur, prev) } = {}) {
  const T = THRESHOLDS, out = [];
  const q = cur.queries?.rows ?? [], p = (cur.pages?.rows ?? []).filter((r) => isSitePage(r, host));
  for (const r of q) if (r.impressions >= T.R1.impressions && r.ctr < T.R1.ctr && r.position <= T.R1.position) out.push({ rule: "R1", key: r.key, ...r, action: "rewrite title/meta of the landing page" });
  for (const r of p) if (r.impressions >= T.R1.impressions && r.ctr < T.R1.ctr && r.position <= T.R1.position) out.push({ rule: "R1", key: r.key, ...r, action: "rewrite title/meta" });
  for (const r of q) if (r.position >= T.R2.posMin && r.position <= T.R2.posMax && r.impressions >= T.R2.impressions) out.push({ rule: "R2", key: r.key, ...r, action: "improve the page + 2–3 internal links" });
  for (const r of q) if (r.impressions >= T.R3.impressions && !RX.brand.test(r.key)) out.push({ rule: "R3", key: r.key, ...r, action: "check whether a dedicated page exists; brief one if not (route changes need approval)" });
  if (cmp.state === "comparable" && prev?.pages) {
    const before = new Map(prev.pages.rows.map((r) => [r.key, r]));
    for (const r of p) { const b = before.get(r.key); if (b && b.clicks > 0 && r.clicks <= b.clicks * (1 - T.R4.dropRatio) && r.impressions >= b.impressions) out.push({ rule: "R4", key: r.key, ...r, action: `refresh the page (clicks ${b.clicks} → ${r.clicks}, impressions stable or up)` }); }
  }
  for (const r of p) if (classifyPage(r.key, host).segment === "legacy" && r.impressions > 0) out.push({ rule: "R6", key: r.key, ...r, action: "legacy (unprefixed) URL received impressions in this export; check its redirect target and the Pages report" });
  for (const r of q) if (RX.question.test(r.key) && r.impressions >= T.R8.impressions) out.push({ rule: "R8", key: r.key, ...r, action: "answer page: FAQ item (Hub) or a post" });
  for (const r of q) if (RX.filipino.test(r.key) && r.impressions > 0) out.push({ rule: "R9", key: r.key, ...r, action: "evidence for Phase 9; map to a brief" });
  return out;
}

const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);
const wpos = (rows) => { const w = sum(rows, "impressions"); return w ? rows.reduce((a, r) => a + r.position * r.impressions, 0) / w : null; };
const esc = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/</g, "&lt;").replace(/\r?\n/g, " ");
const f = (n, d = 0) => n == null ? "NO EXPORT" : Number(n).toFixed(d);
const fp = (n) => n == null ? "NO EXPORT" : `${(n * 100).toFixed(2)}%`;
const change = (a, b, cmp) => cmp.state !== "comparable" ? "—" : (a == null || b == null) ? "—" : b === 0 ? (a === 0 ? "0%" : "new") : `${(((a - b) / b) * 100).toFixed(0)}%`;
const periodText = (x) => x.period ? `period: ${x.period.start} → ${x.period.end}, ${x.period.days} day(s)` : "period UNKNOWN (no Chart export)";
const delta = (a, b, cmp) => cmp.state !== "comparable" || a == null || b == null ? "—" : `${a - b >= 0 ? "+" : ""}${(a - b).toFixed(1)} positions`;

export function report(cur, prev, { date = new Date().toISOString().slice(0, 10), property = "sc-domain:chajewelsjp.com", host = CANONICAL_HOST } = {}) {
  const cmp = comparison(cur, prev);
  const prevCell = (v) => prev ? v : "NO PREVIOUS EXPORT";
  const chartC = cur.chart?.rows ?? null, chartP = prev?.chart?.rows ?? null;
  const qC = cur.queries?.rows ?? null, qP = prev?.queries?.rows ?? null;
  const ops = opportunities(cur, prev, { host, cmp });
  const q = qC ?? [];
  const questions = q.filter((r) => RX.question.test(r.key)).sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  const fil = q.filter((r) => RX.filipino.test(r.key));
  const brandNow = qC ? sum(q.filter((r) => RX.brand.test(r.key)), "impressions") : null;
  const brandPrev = qP ? sum(qP.filter((r) => RX.brand.test(r.key)), "impressions") : null;
  const absent = TARGET_TERMS.filter((t) => !q.some((r) => new RegExp(`\\b${t}\\b`, "i").test(r.key)));
  const L = [];
  L.push(`# SEO weekly report — ${date} (export folder: ${esc(basename(resolve(cur.dir)))}; ${periodText(cur)}) vs ${prev ? `${esc(basename(resolve(prev.dir)))}; ${periodText(prev)}` : "NO PREVIOUS EXPORT"}`, "");
  L.push(`Exports used: ${cur.files.length ? cur.files.map(esc).join(", ") : "NO EXPORT — report not produced"}${prev ? `; previous: ${prev.files.map(esc).join(", ")}` : ""}`);
  L.push(`Comparison: ${cmp.state === "comparable" ? `comparable (${cmp.reason})` : cmp.state === "none" ? "NO PREVIOUS EXPORT" : `NOT COMPARABLE — ${cmp.reason}; change columns left blank`}`);
  L.push(`Property: ${property}  Prepared by: scripts/gsc-report.mjs (every cell is a CSV row; nothing is estimated; absence from an export is UNKNOWN, not zero)`, "");
  L.push("## Totals", "| Metric | Source | This period | Previous | Change |", "|---|---|---|---|---|");
  const row = (metric, source, a, b, fmt = f, ch = change) => L.push(`| ${metric} | ${source} | ${fmt(a)} | ${prevCell(fmt(b))} | ${ch(a, b, cmp)} |`);
  row("Clicks", "property total (Chart export)", chartC ? sum(chartC, "clicks") : null, chartP ? sum(chartP, "clicks") : null);
  row("Impressions", "property total (Chart export)", chartC ? sum(chartC, "impressions") : null, chartP ? sum(chartP, "impressions") : null);
  row("CTR", "property total (Chart export)", chartC && sum(chartC, "impressions") ? sum(chartC, "clicks") / sum(chartC, "impressions") : null, chartP && sum(chartP, "impressions") ? sum(chartP, "clicks") / sum(chartP, "impressions") : null, fp);
  row("Avg position (≈ impression-weighted over the daily rows)", "property (Chart export)", chartC ? wpos(chartC) : null, chartP ? wpos(chartP) : null, (n) => f(n, 1), delta);
  row("Clicks", "DISCLOSED query rows only (Queries export; not a property total)", qC ? sum(qC, "clicks") : null, qP ? sum(qP, "clicks") : null);
  row("Impressions", "DISCLOSED query rows only (Queries export; not a property total)", qC ? sum(qC, "impressions") : null, qP ? sum(qP, "impressions") : null);
  row("Avg position (impression-weighted over the disclosed query rows)", "disclosed rows", qC ? wpos(qC) : null, qP ? wpos(qP) : null, (n) => f(n, 1), delta);
  const undisclosed = () => { const i = sum(chartC, "impressions") - sum(qC, "impressions"), c = sum(chartC, "clicks") - sum(qC, "clicks"); return i < 0 || c < 0 ? `INCONSISTENT — the disclosed query rows exceed the property total (${-Math.min(i, 0)} impression(s), ${-Math.min(c, 0)} click(s) over); the Chart and Queries files are not from one download or one period` : `${i} impression(s) and ${c} click(s) of the property total are not in any disclosed query row`; };
  L.push("", `Undisclosed share: ${chartC && qC ? undisclosed() : "NO EXPORT (needs both Chart and Queries)"}.`);
  L.push("", `## Locale split (Pages export; site pages = https://${host} only)`, "| Segment | Clicks | Impressions | Note |", "|---|---|---|---|");
  const segs = ["root", "/en/", "/ja/", "legacy", "other-host", "unparseable"];
  const note = { root: "the root page (OD-3)", legacy: "R6", "other-host": "other host or scheme of the Domain property — not a site page", unparseable: "not an absolute URL — check the export" };
  if (cur.pages) {
    const m = Object.fromEntries(segs.map((s) => [s, { clicks: 0, impressions: 0, hosts: new Set() }]));
    for (const r of cur.pages.rows) { const c = classifyPage(r.key, host); const s = m[c.segment]; s.clicks += r.clicks; s.impressions += r.impressions; if (c.segment === "other-host") s.hosts.add(`${c.scheme}://${c.host}`); }
    for (const s of segs) L.push(`| ${s} | ${m[s].clicks} | ${m[s].impressions} | ${note[s] ?? ""}${s === "other-host" && m[s].hosts.size ? `: ${[...m[s].hosts].map(esc).join(", ")}` : ""} |`);
  } else for (const s of segs) L.push(`| ${s} | NO EXPORT | NO EXPORT | ${note[s] ?? ""} |`);
  L.push("", "## Opportunities (rules R1–R10)", "| Rule | Query / page | Clicks | Impr. | CTR | Pos. | Proposed action | Status |", "|---|---|---|---|---|---|---|---|");
  if (!cur.queries && !cur.pages) L.push("| — | NO EXPORT | | | | | | |");
  else if (ops.length === 0) L.push("| — | none met the thresholds | | | | | | |");
  for (const o of ops) L.push(`| ${o.rule} | ${esc(o.key)} | ${o.clicks} | ${o.impressions} | ${fp(o.ctr)} | ${f(o.position, 1)} | ${esc(o.action)} | NOT STARTED |`);
  if (cmp.state !== "comparable") L.push(`| R4 | not evaluated: ${cmp.state === "none" ? "NO PREVIOUS EXPORT" : esc(cmp.reason)} | | | | | | — |`);
  L.push(`| R5 | target terms ABSENT from the disclosed query rows: ${!cur.queries ? "NO EXPORT" : absent.length ? absent.join(", ") : "none"} | | | | | absence is not zero impressions (undisclosed queries are not exported); do not assume demand or its lack; record only | — |`);
  L.push("", "## Question queries (§4.1) — top 10 by impressions", "| Query | Impr. | Pos. | Has answer page? |", "|---|---|---|---|");
  if (!cur.queries) L.push("| NO EXPORT | | | |"); else if (!questions.length) L.push("| none in export | | | |");
  for (const r of questions) L.push(`| ${esc(r.key)} | ${r.impressions} | ${f(r.position, 1)} | (check) |`);
  L.push("", "## Filipino queries (§4.2)", !cur.queries ? "NO EXPORT" : fil.length ? fil.map((r) => `- ${esc(r.key)} — ${r.impressions} impr., pos. ${f(r.position, 1)}`).join("\n") : "none in export");
  L.push("", "## Branded (§4.3, disclosed rows)", `| Impressions this period | previous | change |`, "|---|---|---|", `| ${qC ? brandNow : "NO EXPORT"} | ${qP ? brandPrev : prev ? "NO EXPORT" : "NO PREVIOUS EXPORT"} | ${change(brandNow, brandPrev, cmp)} |`);
  L.push("", "## Checked in the Search Console UI (no export; fill in by hand after looking, never leave as assumed)", "- Indexing → Pages: (new reasons, or \"nothing new\" after looking)", "- Enhancements: (counts, or \"nothing new\" after looking)", "- Security / manual actions: (what the report shows)", "- Merchant Center (Phase 5): (not applicable until a feed is live — state it)");
  L.push("", "## Actions carried forward", "| Item | Owner | Status (vocabulary) |", "|---|---|---|", "");
  L.push("Nothing in this report is marked indexed, ranking or rich-result eligible except as the exports show; a term or page absent from an export has unknown figures, not zero.");
  return L.join("\n") + "\n";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf("--out");
  const outFile = outIdx >= 0 ? args.splice(outIdx, 2)[1] : null;
  const [dir, prevDir] = args;
  if (!dir) { console.error("usage: node scripts/gsc-report.mjs <export-dir> [previous-export-dir] [--out report.md]"); process.exit(2); }
  try {
    const cur = readExports(dir), prev = prevDir ? readExports(prevDir) : null;
    const md = report(cur, prev);
    if (outFile) writeFileSync(outFile, md);
    process.stdout.write(md);
  } catch (e) {
    console.error(`gsc-report: refused — ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}

#!/usr/bin/env node
// Search Console weekly report from CSV exports (Phase 12, docs/seo/phase-12/SEARCH-CONSOLE-OPERATIONS.md §7).
// Usage: node scripts/gsc-report.mjs <export-dir> [previous-export-dir] [--out <file.md>]
//
// THE ONE RULE: no metric is filled in without an export. Every cell comes from a row of a CSV file that Search
// Console itself wrote; a missing file yields NO EXPORT in that section; a missing previous period yields
// NO PREVIOUS EXPORT. Nothing is estimated, remembered or fetched: no network, no credentials, read-only.
//
// INPUT. A directory of Search Console "Download CSV" files. Search Console names them Queries.csv, Pages.csv,
// Countries.csv, Devices.csv, Chart.csv (and the ops document's convention is YYYY-MM-DD-queries.csv …); both are
// accepted, matched on the base name, case-insensitively. Headers are read from the file as written
// (Top queries / Top pages / Country / Device, Clicks, Impressions, CTR, Position); an unknown header FAILS loudly
// instead of guessing. CTR arrives as "1.23%"; Position as a decimal. UTF-8 with or without BOM; quoted fields.
//
// SAFETY. The inputs are downloaded files: cell text is DATA (pipes and angle brackets are escaped in the Markdown,
// nothing from a cell is executed or used as a path), and the script reads only files named like the exports.
//
// OUTPUT. The §6 report shape as Markdown on stdout, optionally written to --out. Rules R1–R10 use the thresholds
// below (OD-SC-4 tunes them after 8 weeks); the regexes mirror §4 so the subset files are optional.
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

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
const KINDS = { queries: /^(?:\d{4}-\d{2}-\d{2}-)?queries\.csv$/i, pages: /^(?:\d{4}-\d{2}-\d{2}-)?pages\.csv$/i, countries: /^(?:\d{4}-\d{2}-\d{2}-)?countries\.csv$/i, devices: /^(?:\d{4}-\d{2}-\d{2}-)?devices\.csv$/i, chart: /^(?:\d{4}-\d{2}-\d{2}-)?chart\.csv$/i };
const LABEL = { queries: "Top queries", pages: "Top pages", countries: "Country", devices: "Device", chart: "Date" };
const METRICS = ["Clicks", "Impressions", "CTR", "Position"];

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
const num = (v) => { const n = Number(String(v).replace(/,/g, "").trim()); return Number.isFinite(n) ? n : null; };
const pct = (v) => { const m = String(v).trim().match(/^(-?[\d.]+)%$/); return m ? Number(m[1]) / 100 : num(v); };

/** One export table: `{ kind, label, rows: [{ key, clicks, impressions, ctr, position }] }`. Fails loudly on an unknown header. */
export function parseExport(kind, text, name = kind) {
  const rows = parseCsv(text);
  if (rows.length === 0) throw new Error(`${name}: empty file`);
  const header = rows[0].map((h) => h.trim());
  const keyIdx = header.findIndex((h) => h === LABEL[kind]);
  if (keyIdx < 0) throw new Error(`${name}: unknown header ${JSON.stringify(header)}; expected a "${LABEL[kind]}" column as Search Console writes it`);
  const idx = Object.fromEntries(METRICS.map((m) => [m, header.indexOf(m)]));
  for (const m of METRICS) if (idx[m] < 0) throw new Error(`${name}: missing the "${m}" column; header ${JSON.stringify(header)}`);
  return { kind, label: LABEL[kind], rows: rows.slice(1).map((r) => ({ key: r[keyIdx] ?? "", clicks: num(r[idx.Clicks]) ?? 0, impressions: num(r[idx.Impressions]) ?? 0, ctr: pct(r[idx.CTR]) ?? 0, position: num(r[idx.Position]) ?? 0 })) };
}

/** Read the recognised export files of a directory. Unknown files are ignored; nothing is executed. */
export function readExports(dir) {
  const out = { dir, files: [] };
  for (const name of readdirSync(dir)) {
    const kind = Object.keys(KINDS).find((k) => KINDS[k].test(basename(name)));
    if (!kind || !statSync(join(dir, name)).isFile()) continue;
    out[kind] = parseExport(kind, readFileSync(join(dir, name), "utf8"), name);
    out.files.push(name);
  }
  return out;
}

const totals = (t) => t ? t.rows.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }), { clicks: 0, impressions: 0 }) : null;
const esc = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/</g, "&lt;").replace(/\r?\n/g, " ");
const f = (n, d = 0) => n == null ? "NO EXPORT" : Number(n).toFixed(d);
const fp = (n) => n == null ? "NO EXPORT" : `${(n * 100).toFixed(2)}%`;
const change = (a, b) => (a == null || b == null) ? "—" : b === 0 ? (a === 0 ? "0%" : "new") : `${(((a - b) / b) * 100).toFixed(0)}%`;
// The root `/` is a listed page in its own right (sitemap policy OD-3), not a legacy bare URL, so it is its own segment.
const localeOf = (url) => { let path = url; try { path = new URL(url).pathname; } catch { /* a bare path */ } return path === "/" ? "root" : /^\/en(\/|$)/.test(path) ? "/en/" : /^\/ja(\/|$)/.test(path) ? "/ja/" : "legacy"; };

/** Rules R1–R10 over the current (and, where present, previous) exports. Each opportunity names its rule, row and action. */
export function opportunities(cur, prev) {
  const T = THRESHOLDS, out = [];
  const q = cur.queries?.rows ?? [], p = cur.pages?.rows ?? [];
  for (const r of q) if (r.impressions >= T.R1.impressions && r.ctr < T.R1.ctr && r.position <= T.R1.position) out.push({ rule: "R1", key: r.key, ...r, action: "rewrite title/meta of the landing page" });
  for (const r of p) if (r.impressions >= T.R1.impressions && r.ctr < T.R1.ctr && r.position <= T.R1.position) out.push({ rule: "R1", key: r.key, ...r, action: "rewrite title/meta" });
  for (const r of q) if (r.position >= T.R2.posMin && r.position <= T.R2.posMax && r.impressions >= T.R2.impressions) out.push({ rule: "R2", key: r.key, ...r, action: "improve the page + 2–3 internal links" });
  for (const r of q) if (r.impressions >= T.R3.impressions && !RX.brand.test(r.key)) out.push({ rule: "R3", key: r.key, ...r, action: "check whether a dedicated page exists; brief one if not (route changes need approval)" });
  if (prev?.pages) {
    const before = new Map(prev.pages.rows.map((r) => [r.key, r]));
    for (const r of p) { const b = before.get(r.key); if (b && b.clicks > 0 && r.clicks <= b.clicks * (1 - T.R4.dropRatio) && r.impressions >= b.impressions) out.push({ rule: "R4", key: r.key, ...r, action: `refresh the page (clicks ${b.clicks} → ${r.clicks}, impressions stable or up)` }); }
  }
  for (const r of p) if (localeOf(r.key) === "legacy" && r.impressions > 0) out.push({ rule: "R6", key: r.key, ...r, action: "legacy URL still receiving impressions; expected to decay after Phase 2E" });
  for (const r of q) if (RX.question.test(r.key) && r.impressions >= T.R8.impressions) out.push({ rule: "R8", key: r.key, ...r, action: "answer page: FAQ item (Hub) or a post" });
  for (const r of q) if (RX.filipino.test(r.key) && r.impressions > 0) out.push({ rule: "R9", key: r.key, ...r, action: "evidence for Phase 9; map to a brief" });
  return out;
}

export function report(cur, prev, { date = new Date().toISOString().slice(0, 10), property = "sc-domain:chajewelsjp.com" } = {}) {
  const tc = totals(cur.queries), tp = prev ? totals(prev.queries) : null;
  const chart = cur.chart?.rows ?? [];
  const avgPos = (t) => { if (!t?.rows.length) return null; const w = t.rows.reduce((a, r) => a + r.impressions, 0); return w ? t.rows.reduce((a, r) => a + r.position * r.impressions, 0) / w : null; };
  const seg = (rows) => { const m = { root: { clicks: 0, impressions: 0 }, "/en/": { clicks: 0, impressions: 0 }, "/ja/": { clicks: 0, impressions: 0 }, legacy: { clicks: 0, impressions: 0 } }; for (const r of rows) { const s = m[localeOf(r.key)]; s.clicks += r.clicks; s.impressions += r.impressions; } return m; };
  const ops = opportunities(cur, prev);
  const q = cur.queries?.rows ?? [];
  const questions = q.filter((r) => RX.question.test(r.key)).sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  const fil = q.filter((r) => RX.filipino.test(r.key));
  const brandNow = q.filter((r) => RX.brand.test(r.key)).reduce((a, r) => a + r.impressions, 0);
  const brandPrev = prev?.queries ? prev.queries.rows.filter((r) => RX.brand.test(r.key)).reduce((a, r) => a + r.impressions, 0) : null;
  const zero = ["kihei", "k18", "layaway", "preloved", "hallmark"].filter((t) => !q.some((r) => new RegExp(`\\b${t}\\b`, "i").test(r.key)));
  const L = [];
  L.push(`# SEO weekly report — ${date} (Search Console export: ${basename(resolve(cur.dir))}) vs ${prev ? basename(resolve(prev.dir)) : "NO PREVIOUS EXPORT"}`, "");
  L.push(`Exports used: ${cur.files.length ? cur.files.map(esc).join(", ") : "NO EXPORT — report not produced"}${prev ? `; previous: ${prev.files.map(esc).join(", ")}` : ""}`);
  L.push(`Property: ${property}  Prepared by: scripts/gsc-report.mjs (every cell is a CSV row; nothing is estimated)`, "");
  L.push("## Totals (Queries export)", "| Metric | This period | Previous | Change |", "|---|---|---|---|");
  L.push(`| Clicks | ${f(tc?.clicks)} | ${prev ? f(tp?.clicks) : "NO PREVIOUS EXPORT"} | ${change(tc?.clicks, tp?.clicks)} |`);
  L.push(`| Impressions | ${f(tc?.impressions)} | ${prev ? f(tp?.impressions) : "NO PREVIOUS EXPORT"} | ${change(tc?.impressions, tp?.impressions)} |`);
  L.push(`| CTR | ${tc && tc.impressions ? fp(tc.clicks / tc.impressions) : "NO EXPORT"} | ${tp && tp.impressions ? fp(tp.clicks / tp.impressions) : prev ? "NO EXPORT" : "NO PREVIOUS EXPORT"} | — |`);
  L.push(`| Avg position (impression-weighted over the disclosed query rows) | ${f(avgPos(cur.queries), 1)} | ${prev ? f(avgPos(prev.queries), 1) : "NO PREVIOUS EXPORT"} | — |`);
  if (chart.length) L.push("", `Chart export: ${chart.length} date row(s), ${chart.reduce((a, r) => a + r.clicks, 0)} clicks, ${chart.reduce((a, r) => a + r.impressions, 0)} impressions (property totals; the query rows above cover disclosed queries only and may not add up to these).`);
  L.push("", "## Locale split (Pages export)", "| Segment | Clicks | Impressions | Note |", "|---|---|---|---|");
  if (cur.pages) { const s = seg(cur.pages.rows); for (const k of ["root", "/en/", "/ja/", "legacy"]) L.push(`| ${k} | ${s[k].clicks} | ${s[k].impressions} | ${k === "legacy" ? "R6" : k === "root" ? "the root page (OD-3)" : ""} |`); } else L.push("| root | NO EXPORT | NO EXPORT | |", "| /en/ | NO EXPORT | NO EXPORT | |", "| /ja/ | NO EXPORT | NO EXPORT | |", "| legacy | NO EXPORT | NO EXPORT | R6 |");
  L.push("", "## Opportunities (rules R1–R10)", "| Rule | Query / page | Clicks | Impr. | CTR | Pos. | Proposed action | Status |", "|---|---|---|---|---|---|---|---|");
  if (!cur.queries && !cur.pages) L.push("| — | NO EXPORT | | | | | | |");
  else if (ops.length === 0) L.push("| — | none met the thresholds | | | | | | |");
  for (const o of ops) L.push(`| ${o.rule} | ${esc(o.key)} | ${o.clicks} | ${o.impressions} | ${fp(o.ctr)} | ${f(o.position, 1)} | ${esc(o.action)} | NOT STARTED |`);
  L.push(`| R5 | zero impressions for target terms: ${zero.length ? zero.join(", ") : "none"} | | | | | do not assume demand; record only | — |`);
  L.push("", "## Question queries (§4.1) — top 10 by impressions", "| Query | Impr. | Pos. | Has answer page? |", "|---|---|---|---|");
  if (!cur.queries) L.push("| NO EXPORT | | | |"); else if (!questions.length) L.push("| none in export | | | |");
  for (const r of questions) L.push(`| ${esc(r.key)} | ${r.impressions} | ${f(r.position, 1)} | (check) |`);
  L.push("", "## Filipino queries (§4.2)", !cur.queries ? "NO EXPORT" : fil.length ? fil.map((r) => `- ${esc(r.key)} — ${r.impressions} impr., pos. ${f(r.position, 1)}`).join("\n") : "none in export");
  L.push("", "## Branded (§4.3)", `| Impressions this period | previous | change |`, "|---|---|---|", `| ${cur.queries ? brandNow : "NO EXPORT"} | ${prev?.queries ? brandPrev : prev ? "NO EXPORT" : "NO PREVIOUS EXPORT"} | ${change(cur.queries ? brandNow : null, brandPrev)} |`);
  L.push("", "## Checked, no export needed", "- Indexing → Pages: (fill in by hand: new reasons or \"nothing new\")", "- Enhancements: (counts or \"nothing new\")", "- Security / manual actions: (none)", "- Merchant Center (Phase 5): N/A until live");
  L.push("", "## Actions carried forward", "| Item | Owner | Status (vocabulary) |", "|---|---|---|", "");
  L.push("Nothing in this report is marked indexed, ranking or rich-result eligible except as the exports show.");
  return L.join("\n") + "\n";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf("--out");
  const outFile = outIdx >= 0 ? args.splice(outIdx, 2)[1] : null;
  const [dir, prevDir] = args;
  if (!dir) { console.error("usage: node scripts/gsc-report.mjs <export-dir> [previous-export-dir] [--out report.md]"); process.exit(2); }
  const cur = readExports(dir), prev = prevDir ? readExports(prevDir) : null;
  const md = report(cur, prev);
  if (outFile) writeFileSync(outFile, md);
  process.stdout.write(md);
}

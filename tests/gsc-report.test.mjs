// scripts/gsc-report.mjs (Phase 12 helper): CSV parsing as Search Console writes it, the R1–R10 rules, the §4 regexes,
// host and locale classification, export selection, comparison context, missing-file handling, and the rules
// "absent is not zero" and "malformed is refused, not zeroed". Fixtures are synthetic (tests/fixtures/gsc) and prove
// behaviour only; nothing in them is an observation. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const { parseCsv, parseExport, readExports, opportunities, report, comparison, classifyPage, periodOf, RX, THRESHOLDS, TARGET_TERMS, CANONICAL_HOST } = await import("../scripts/gsc-report.mjs");
const CUR = join(process.cwd(), "tests/fixtures/gsc/2026-10-31"), PREV = join(process.cwd(), "tests/fixtures/gsc/2026-10-03");
const H = "Top queries,Clicks,Impressions,CTR,Position\n";
const tmp = (files) => { const d = mkdtempSync(join(tmpdir(), "gsc-")); for (const [n, t] of Object.entries(files)) writeFileSync(join(d, n), t); return d; };

test("parseCsv: BOM, CRLF, quoted fields with commas and doubled quotes; blank lines dropped", () => {
  assert.deepEqual(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n\r\n'), [["a", "b"], ["x, y", 'say "hi"']]);
});

test("parseExport: Search Console headers are read as written; CTR percentages and positions become numbers; an unknown header fails loudly", () => {
  const t = parseExport("queries", `${H}q,1,"1,250",0.08%,6.2\n`);
  assert.deepEqual(t.rows, [{ key: "q", clicks: 1, impressions: 1250, ctr: 0.0008, position: 6.2 }]);
  assert.throws(() => parseExport("queries", "Query,Clicks,Impressions,CTR,Position\nq,1,1,1%,1\n"), /unknown header/);
  assert.throws(() => parseExport("pages", "Top pages,Clicks,Impressions\np,1,1\n"), /missing the "CTR" column/);
  assert.throws(() => parseExport("queries", ""), /empty file/);
});

test("malformed metrics and rows are REFUSED with the row number, never coerced to 0 (reproduced: a blank or non-numeric cell used to become 0)", () => {
  assert.throws(() => parseExport("queries", `${H}q,,5,0%,3\n`), /row 2: Clicks is not a non-negative integer: ""/);
  assert.throws(() => parseExport("queries", `${H}q,n/a,5,0%,3\n`), /row 2: Clicks is not a non-negative integer: "n\/a"/);
  assert.throws(() => parseExport("queries", `${H}q,1,5,0.2,3\n`), /row 2: CTR is not a percentage/);
  assert.throws(() => parseExport("queries", `${H}q,1,5,120%,3\n`), /CTR above 100%/);
  assert.throws(() => parseExport("queries", `${H}q,1,5,20%,0.4\n`), /Position is not a number ≥ 1/);
  assert.throws(() => parseExport("queries", `${H}q,1,5,20%,abc\n`), /Position is not a number/);
  assert.throws(() => parseExport("queries", `${H}q,6,5,100%,1\n`), /Clicks exceed Impressions/);
  assert.throws(() => parseExport("queries", `${H}q,1,5,20%\n`), /row 2: expected 5 fields, got 4/);
  assert.throws(() => parseExport("queries", `${H}q,1,5,20%,3,extra\n`), /expected 5 fields, got 6/);
  assert.throws(() => parseExport("queries", `${H} ,1,5,20%,3\n`), /empty "Top queries" cell/);
  assert.throws(() => parseExport("queries", `${H}q,1,5,20%,3\nq,1,5,20%,3\n`), /row 3: duplicate "Top queries" row/);
  assert.throws(() => parseExport("chart", "Date,Clicks,Impressions,CTR,Position\n28/10/2026,1,5,20%,3\n"), /Date is not YYYY-MM-DD/);
  assert.throws(() => parseExport("queries", `${H}q,-1,5,0%,3\n`), /not a non-negative integer/);
  assert.equal(parseExport("queries", `${H}q,0,0,0%,1\n`).rows[0].impressions, 0, "a genuine 0 in the file is a 0");
});

test("readExports: both file-name conventions are recognised; unrelated files are ignored; the period comes from the Chart rows", () => {
  const cur = readExports(CUR), prev = readExports(PREV);
  assert.deepEqual(cur.files.sort(), ["Chart.csv", "Countries.csv", "Devices.csv", "Pages.csv", "Queries.csv"]);
  assert.deepEqual(prev.files.sort(), ["2026-10-03-chart.csv", "2026-10-03-pages.csv", "2026-10-03-queries.csv"]);
  assert.equal(cur.queries.rows.length, 5);
  assert.equal(cur.queries.rows[2].key, "what is kihei, really", "a quoted key with a comma survives");
  assert.deepEqual(cur.period, { start: "2026-10-28", end: "2026-10-28", days: 1 });
  assert.equal(cur.datePrefix, null);
  assert.equal(prev.datePrefix, "2026-10-03");
  assert.equal(periodOf({}), null);
  assert.deepEqual(periodOf({ chart: { rows: [{ key: "2026-10-05" }, { key: "2026-10-01" }, { key: "2026-10-28" }] } }), { start: "2026-10-01", end: "2026-10-28", days: 28 });
});

test("export selection is validated: two files of one kind in a folder, or mixed date prefixes, are refused (reproduced: the later file silently won)", () => {
  assert.throws(() => readExports(tmp({ "Queries.csv": `${H}a,1,2,50%,1\n`, "2026-10-31-queries.csv": `${H}b,1,2,50%,1\n` })), /two "queries" exports/);
  assert.throws(() => readExports(tmp({ "2026-10-31-queries.csv": `${H}a,1,2,50%,1\n`, "2026-10-24-pages.csv": "Top pages,Clicks,Impressions,CTR,Position\nhttps://www.chajewelsjp.com/,1,2,50%,1\n" })), /different date prefixes/);
  const d = tmp({ "Queries.csv": `${H}a,1,2,50%,1\n`, "notes.txt": "ignored" });
  mkdirSync(join(d, "Pages.csv")); // a directory named like an export is not a file
  assert.deepEqual(readExports(d).files, ["Queries.csv"]);
});

test("comparison context: changes only between known, equal-length, non-overlapping periods; the same folder or a later 'previous' is refused", () => {
  const cur = readExports(CUR), prev = readExports(PREV);
  assert.equal(comparison(cur, null).state, "none");
  assert.equal(comparison(cur, prev).state, "comparable", "1 day each, 2026-10-01 before 2026-10-28");
  assert.throws(() => comparison(cur, readExports(CUR)), /the previous export folder is the current one/);
  const at = (dir, period, datePrefix = null) => ({ dir, period, datePrefix });
  assert.equal(comparison(at("a", null), at("b", { start: "2026-10-01", end: "2026-10-28", days: 28 })).state, "unknown");
  assert.match(comparison(at("a", null), at("b", { start: "2026-10-01", end: "2026-10-28", days: 28 })).reason, /no Chart export in the current folder/);
  assert.match(comparison(at("a", { start: "2026-10-20", end: "2026-11-16", days: 28 }), at("b", { start: "2026-10-01", end: "2026-10-28", days: 28 })).reason, /periods overlap/);
  assert.match(comparison(at("a", { start: "2026-11-01", end: "2026-11-07", days: 7 }), at("b", { start: "2026-10-01", end: "2026-10-28", days: 28 })).reason, /differ in length \(28 vs 7 days\)/);
  assert.throws(() => comparison(at("a", null, "2026-10-03"), at("b", null, "2026-10-31")), /not dated before the current one/);
});

test("hosts are classified, not assumed (reproduced: agreement.chajewelsjp.com/en/… and http://… counted as /en/): only https on the canonical host is a site page", () => {
  assert.equal(CANONICAL_HOST, "www.chajewelsjp.com");
  assert.equal(classifyPage("https://www.chajewelsjp.com/").segment, "root");
  assert.equal(classifyPage("https://www.chajewelsjp.com/en").segment, "/en/");
  assert.equal(classifyPage("https://www.chajewelsjp.com/ja/faq").segment, "/ja/");
  assert.equal(classifyPage("https://www.chajewelsjp.com/products/x").segment, "legacy");
  assert.deepEqual(classifyPage("https://agreement.chajewelsjp.com/en/x"), { segment: "other-host", host: "agreement.chajewelsjp.com", scheme: "https" });
  assert.deepEqual(classifyPage("http://www.chajewelsjp.com/en/faq"), { segment: "other-host", host: "www.chajewelsjp.com", scheme: "http" });
  assert.equal(classifyPage("https://chajewelsjp.com/").segment, "other-host", "the bare apex is not the canonical host");
  assert.equal(classifyPage("https://portal.chajewelsjp.com/").segment, "other-host");
  assert.deepEqual(classifyPage("/en/faq"), { segment: "unparseable", host: null, scheme: null }, "a bare path is not a locale segment");
  assert.equal(classifyPage("not a url").segment, "unparseable");
});

test("regexes mirror SEARCH-CONSOLE-OPERATIONS.md §4: question, Filipino, brand, territory", () => {
  assert.ok(RX.question.test("what is kihei") && RX.question.test("saan bumili") && RX.question.test("喜平とは") && !RX.question.test("kihei chain"));
  assert.ok(RX.filipino.test("saan bumili ng k18 sa japan") && !RX.filipino.test("k18 necklace japan"));
  assert.ok(RX.brand.test("cha jewels japan") && RX.brand.test("チャジュエルズ") && !RX.brand.test("k18 kihei"));
  assert.ok(RX.territory.test("k18 ring") && RX.territory.test("喜平") && !RX.territory.test("gold ring"));
});

test("rules: R1 (high impressions, low CTR, top 10), R2 (position 5–20), R3 (non-brand demand), R4 (falling clicks vs a comparable previous period), R6 (legacy URL on the canonical host only), R8 (question), R9 (Filipino) — from the fixture rows only", () => {
  const cur = readExports(CUR), prev = readExports(PREV);
  const ops = opportunities(cur, prev);
  const by = (rule) => ops.filter((o) => o.rule === rule).map((o) => o.key);
  assert.deepEqual(by("R1"), ["k18 necklace japan"], `R1 needs ≥${THRESHOLDS.R1.impressions} impressions, CTR < 1%, position ≤ 10`);
  assert.deepEqual(by("R2"), ["k18 necklace japan"], `R2 needs position ${THRESHOLDS.R2.posMin}–${THRESHOLDS.R2.posMax} AND ≥${THRESHOLDS.R2.impressions} impressions (the question query has 40)`);
  assert.deepEqual(by("R3"), ["k18 necklace japan"], "branded queries never trigger R3");
  assert.deepEqual(by("R4"), ["https://www.chajewelsjp.com/"], "clicks 4 → 1 with impressions stable");
  assert.deepEqual(by("R6"), ["https://www.chajewelsjp.com/products/old-slug"], "the root is not a legacy URL; an other-host URL is never a legacy URL");
  assert.deepEqual(by("R8"), ["what is kihei, really"]);
  assert.deepEqual(by("R9"), ["saan bumili ng k18 sa japan"]);
  assert.deepEqual(opportunities(cur, null).filter((o) => o.rule === "R4"), [], "R4 needs a previous export");
  const unknown = { ...prev, period: null, datePrefix: null };
  assert.deepEqual(opportunities(cur, unknown).filter((o) => o.rule === "R4"), [], "R4 needs a COMPARABLE previous period, not merely a file");
  assert.ok(ops.every((o) => !/expected to|will /.test(o.action)), "no action predicts a trend");
});

test("report: property totals come from the Chart export and disclosed-row sums are labelled as such; absent target terms are ABSENT, not zero (reproduced: 'zero impressions for target terms'); a missing file says NO EXPORT; cell text is escaped", () => {
  const cur = readExports(CUR);
  const md = report(cur, null, { date: "2026-11-01" });
  assert.match(md, /period: 2026-10-28 → 2026-10-28, 1 day\(s\)\) vs NO PREVIOUS EXPORT/);
  assert.match(md, /\| Clicks \| property total \(Chart export\) \| 3 \| NO PREVIOUS EXPORT \| — \|/);
  assert.match(md, /\| Impressions \| property total \(Chart export\) \| 300 \| NO PREVIOUS EXPORT \| — \|/);
  assert.match(md, /\| Clicks \| DISCLOSED query rows only \(Queries export; not a property total\) \| 3 \|/);
  assert.match(md, /\| Impressions \| DISCLOSED query rows only \(Queries export; not a property total\) \| 295 \|/);
  assert.match(md, /Undisclosed share: 5 impression\(s\) and 0 click\(s\) of the property total are not in any disclosed query row/);
  const inconsistent = report({ ...cur, chart: { kind: "chart", label: "Date", rows: [{ key: "2026-10-28", clicks: 1, impressions: 5, ctr: 0.2, position: 3.4 }] } }, null, { date: "2026-11-01" });
  assert.match(inconsistent, /Undisclosed share: INCONSISTENT — the disclosed query rows exceed the property total \(290 impression\(s\), 2 click\(s\) over\)/, "disclosed rows above the property total are flagged, never silently subtracted");
  assert.match(md, /\| root \| 1 \| 4 \| the root page \(OD-3\) \|/);
  assert.match(md, /\| \/en\/ \| 0 \| 1 \|/);
  assert.match(md, /\| legacy \| 0 \| 2 \| R6 \|/);
  assert.match(md, /\| other-host \| 0 \| 4 \| other host or scheme of the Domain property — not a site page: https:\/\/agreement\.chajewelsjp\.com, http:\/\/www\.chajewelsjp\.com \|/);
  assert.match(md, /\| unparseable \| 0 \| 0 \|/);
  assert.match(md, /\| R5 \| target terms ABSENT from the disclosed query rows: layaway, preloved, hallmark \|.*absence is not zero impressions/);
  assert.doesNotMatch(md, /zero impressions for/);
  assert.match(md, /\| R4 \| not evaluated: NO PREVIOUS EXPORT \|/);
  assert.match(md, /\| 2 \| NO PREVIOUS EXPORT \| — \|/, "branded impressions this period = 2");
  assert.doesNotMatch(md, /\(none\)|N\/A until live|expected to decay/, "nothing unobserved is prefilled");
  assert.deepEqual(TARGET_TERMS, ["kihei", "k18", "layaway", "preloved", "hallmark"]);
  const partial = report({ dir: "x", files: [], period: null, datePrefix: null }, null, { date: "2026-11-01" });
  assert.match(partial, /Exports used: NO EXPORT — report not produced/);
  assert.match(partial, /\| Clicks \| property total \(Chart export\) \| NO EXPORT \|/);
  assert.match(partial, /\| — \| NO EXPORT \|/);
  assert.match(partial, /\| R5 \| target terms ABSENT from the disclosed query rows: NO EXPORT \|/);
  const withPrev = report(cur, readExports(PREV), { date: "2026-11-01" });
  assert.match(withPrev, /Comparison: comparable \(1 day\(s\) each, previous ends 2026-10-01\)/);
  assert.match(withPrev, /\| Clicks \| property total \(Chart export\) \| 3 \| 1 \| 200% \|/);
  assert.match(withPrev, /\| Avg position \(≈ impression-weighted over the daily rows\) \| property \(Chart export\) \| 6\.5 \| 4\.2 \| \+2\.3 positions \|/, "positions change by difference, never by percentage");
  assert.match(withPrev, /\| Clicks \| DISCLOSED query rows only \(Queries export; not a property total\) \| 3 \| 1 \| 200% \|/);
  assert.match(withPrev, /\| 2 \| 3 \| -33% \|/, "branded: 2 now vs 3 before");
  const noChart = report(cur, { ...readExports(PREV), chart: undefined, period: null }, { date: "2026-11-01" });
  assert.match(noChart, /Comparison: NOT COMPARABLE — period unknown: no Chart export in the previous folder; change columns left blank/);
  assert.match(noChart, /\| Clicks \| DISCLOSED query rows only \(Queries export; not a property total\) \| 3 \| 1 \| — \|/, "a previous file without a known period yields no change figure");
  const hostile = { dir: "h", files: ["Queries.csv"], period: null, datePrefix: null, queries: { kind: "queries", label: "Top queries", rows: [{ key: "a|b <script>", clicks: 0, impressions: 500, ctr: 0, position: 3 }] } };
  const h = report(hostile, null);
  assert.match(h, /a\\\|b &lt;script>/);
  assert.doesNotMatch(h, /<script>/);
});

test("CLI: read-only, prints the report, exits 2 without a directory and 1 on a refused export", () => {
  const out = execFileSync(process.execPath, ["scripts/gsc-report.mjs", CUR, PREV], { encoding: "utf8" });
  assert.match(out, /^# SEO weekly report — \d{4}-\d{2}-\d{2} \(export folder: 2026-10-31; period: 2026-10-28 → 2026-10-28, 1 day\(s\)\) vs 2026-10-03; period: 2026-10-01 → 2026-10-01, 1 day\(s\)/);
  assert.throws(() => execFileSync(process.execPath, ["scripts/gsc-report.mjs"], { encoding: "utf8", stdio: "pipe" }), /status 2|usage/);
  const badDir = tmp({ "Queries.csv": `${H}q,,5,0%,3\n` });
  assert.throws(() => execFileSync(process.execPath, ["scripts/gsc-report.mjs", badDir], { encoding: "utf8", stdio: "pipe" }), (e) => e.status === 1 && /refused — Queries\.csv row 2: Clicks is not a non-negative integer/.test(e.stderr));
  assert.throws(() => execFileSync(process.execPath, ["scripts/gsc-report.mjs", CUR, CUR], { encoding: "utf8", stdio: "pipe" }), (e) => e.status === 1 && /the previous export folder is the current one/.test(e.stderr));
});

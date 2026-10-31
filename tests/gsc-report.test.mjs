// scripts/gsc-report.mjs (Phase 12 helper): CSV parsing as Search Console writes it, the R1–R10 rules, the §4 regexes,
// locale classification, missing-file handling, and the "no number without an export" rule. Fixtures are synthetic
// (tests/fixtures/gsc). Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const { parseCsv, parseExport, readExports, opportunities, report, RX, THRESHOLDS } = await import("../scripts/gsc-report.mjs");
const CUR = join(process.cwd(), "tests/fixtures/gsc/2026-10-31"), PREV = join(process.cwd(), "tests/fixtures/gsc/2026-10-03");

test("parseCsv: BOM, CRLF, quoted fields with commas and doubled quotes; blank lines dropped", () => {
  assert.deepEqual(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n\r\n'), [["a", "b"], ["x, y", 'say "hi"']]);
});

test("parseExport: Search Console headers are read as written; CTR percentages and positions become numbers; an unknown header fails loudly", () => {
  const t = parseExport("queries", "Top queries,Clicks,Impressions,CTR,Position\nq,1,\"1,250\",0.08%,6.2\n");
  assert.deepEqual(t.rows, [{ key: "q", clicks: 1, impressions: 1250, ctr: 0.0008, position: 6.2 }]);
  assert.throws(() => parseExport("queries", "Query,Clicks,Impressions,CTR,Position\nq,1,1,1%,1\n"), /unknown header/);
  assert.throws(() => parseExport("pages", "Top pages,Clicks,Impressions\np,1,1\n"), /missing the "CTR" column/);
  assert.throws(() => parseExport("queries", ""), /empty file/);
});

test("readExports: both file-name conventions are recognised; unrelated files are ignored", () => {
  const cur = readExports(CUR), prev = readExports(PREV);
  assert.deepEqual(cur.files.sort(), ["Chart.csv", "Countries.csv", "Devices.csv", "Pages.csv", "Queries.csv"]);
  assert.deepEqual(prev.files.sort(), ["2026-10-03-pages.csv", "2026-10-03-queries.csv"]);
  assert.equal(cur.queries.rows.length, 5);
  assert.equal(cur.queries.rows[2].key, "what is kihei, really", "a quoted key with a comma survives");
});

test("regexes mirror SEARCH-CONSOLE-OPERATIONS.md §4: question, Filipino, brand, territory", () => {
  assert.ok(RX.question.test("what is kihei") && RX.question.test("saan bumili") && RX.question.test("喜平とは") && !RX.question.test("kihei chain"));
  assert.ok(RX.filipino.test("saan bumili ng k18 sa japan") && !RX.filipino.test("k18 necklace japan"));
  assert.ok(RX.brand.test("cha jewels japan") && RX.brand.test("チャジュエルズ") && !RX.brand.test("k18 kihei"));
  assert.ok(RX.territory.test("k18 ring") && RX.territory.test("喜平") && !RX.territory.test("gold ring"));
});

test("rules: R1 (high impressions, low CTR, top 10), R2 (position 5–20), R3 (non-brand demand), R4 (falling clicks vs previous), R6 (legacy URL), R8 (question), R9 (Filipino) — from the fixture rows only", () => {
  const cur = readExports(CUR), prev = readExports(PREV);
  const ops = opportunities(cur, prev);
  const by = (rule) => ops.filter((o) => o.rule === rule).map((o) => o.key);
  assert.deepEqual(by("R1"), ["k18 necklace japan"], `R1 needs ≥${THRESHOLDS.R1.impressions} impressions, CTR < 1%, position ≤ 10`);
  assert.deepEqual(by("R2"), ["k18 necklace japan"], `R2 needs position ${THRESHOLDS.R2.posMin}–${THRESHOLDS.R2.posMax} AND ≥${THRESHOLDS.R2.impressions} impressions (the question query has 40)`);
  assert.deepEqual(by("R3"), ["k18 necklace japan"], "branded queries never trigger R3");
  assert.deepEqual(by("R4"), ["https://www.chajewelsjp.com/"], "clicks 4 → 1 with impressions stable");
  assert.deepEqual(by("R6"), ["https://www.chajewelsjp.com/products/old-slug"], "the root is not a legacy URL");
  assert.deepEqual(by("R8"), ["what is kihei, really"]);
  assert.deepEqual(by("R9"), ["saan bumili ng k18 sa japan"]);
  assert.deepEqual(opportunities(cur, null).filter((o) => o.rule === "R4"), [], "R4 needs a previous export");
});

test("report: every cell comes from a row; a missing file says NO EXPORT; a missing previous period says NO PREVIOUS EXPORT; cell text is escaped", () => {
  const cur = readExports(CUR);
  const md = report(cur, null, { date: "2026-11-01" });
  assert.match(md, /\| Clicks \| 3 \| NO PREVIOUS EXPORT \| — \|/);
  assert.match(md, /\| Impressions \| 295 \| NO PREVIOUS EXPORT \| — \|/);
  assert.match(md, /\| root \| 1 \| 4 \| the root page \(OD-3\) \|/);
  assert.match(md, /\| \/en\/ \| 0 \| 1 \|/);
  assert.match(md, /\| legacy \| 0 \| 2 \| R6 \|/);
  assert.match(md, /Chart export: 1 date row\(s\), 1 clicks, 5 impressions/);
  assert.match(md, /\| R5 \| zero impressions for target terms: layaway, preloved, hallmark \|/);
  assert.match(md, /\| 2 \| NO PREVIOUS EXPORT \| — \|/, "branded impressions this period = 2");
  const partial = report({ dir: "x", files: [] }, null, { date: "2026-11-01" });
  assert.match(partial, /Exports used: NO EXPORT — report not produced/);
  assert.match(partial, /\| Clicks \| NO EXPORT \|/);
  assert.match(partial, /\| — \| NO EXPORT \|/);
  const withPrev = report(cur, readExports(PREV), { date: "2026-11-01" });
  assert.match(withPrev, /\| Clicks \| 3 \| 1 \| 200% \|/);
  assert.match(withPrev, /\| 2 \| 3 \| -33% \|/, "branded: 2 now vs 3 before");
  const hostile = { dir: "h", files: ["Queries.csv"], queries: { kind: "queries", label: "Top queries", rows: [{ key: "a|b <script>", clicks: 0, impressions: 500, ctr: 0, position: 3 }] } };
  const h = report(hostile, null);
  assert.match(h, /a\\\|b &lt;script>/);
  assert.doesNotMatch(h, /<script>/);
});

test("CLI: read-only, prints the report, exits 2 without a directory", () => {
  const out = execFileSync(process.execPath, ["scripts/gsc-report.mjs", CUR, PREV], { encoding: "utf8" });
  assert.match(out, /^# SEO weekly report — \d{4}-\d{2}-\d{2} \(Search Console export: 2026-10-31\) vs 2026-10-03/);
  assert.throws(() => execFileSync(process.execPath, ["scripts/gsc-report.mjs"], { encoding: "utf8", stdio: "pipe" }), /status 2|usage/);
});

// Lumière P1 — the Japanese path of the letter engine
// (docs/tasks/lumiere-p0-report.md §5): no italics on JA, letters counted as
// graphemes (a surrogate pair stays one letter), a centred JA line splits at a
// run boundary, and the design-unit helper never emits an exponent.
import { test } from "node:test";
import assert from "node:assert/strict";

const { runsFor, letterUnits, runLength, isSimple, isAstral, engineLetters, graphemeCount, centreSplitIndex } = await import("@/lib/lumiere/text-runs");
const { cssNumber, designUnit } = await import("@/lib/lumiere/design-unit");

test("runsFor strips italic from every Japanese run and leaves English as given", () => {
  const lines = [[{ text: "B", italic: true }, { text: "eauty Beyond" }], [{ text: "Trends." }]];
  const ja = runsFor(lines, "ja");
  assert.deepEqual(ja, [[{ text: "B" }, { text: "eauty Beyond" }], [{ text: "Trends." }]]);
  const en = runsFor(lines, "en");
  assert.deepEqual(en, lines);
  assert.notEqual(en[0], lines[0], "a copy, not the caller's arrays");
});

test("letters are counted as the engine counts them; a grapheme beyond the BMP travels as an uncounted node", () => {
  assert.equal(runLength({ text: "身につける、" }), 6);
  assert.equal(runLength({ text: "to wear." }), 8, "spaces count");
  assert.deepEqual(letterUnits("𠮷野家"), ["𠮷", "野", "家"], "graphemes, not code units");
  assert.equal("𠮷野家".length, 4, "the engine's split('') would have made four letters, two of them broken halves");
  assert.equal(isAstral("𠮷"), true);
  assert.equal(isAstral("野"), false);
  assert.equal(engineLetters("𠮷"), 0, "a node token: present, not revealed, not counted");
  assert.equal(engineLetters("野"), 1);
  assert.equal(runLength({ text: "𠮷野家" }), 2, "the engine will count the two BMP letters");
  assert.equal(graphemeCount({ text: "𠮷野家" }), 3);
  assert.equal(isSimple("Timeless"), true);
  assert.equal(isSimple("身につける"), true, "BMP kana and kanji: the engine's split is exact, one span");
  assert.equal(isSimple("𠮷野家"), false);
  // a combining mark is a letter of its own, exactly as in the reference
  assert.equal(runLength({ text: "e\u0301" }), 2);
});

test("a centred English line splits at the letter midpoint, as the reference does", () => {
  const runs = [{ text: "V", italic: true }, { text: "alue You Can Understand." }];
  const letters = "Value You Can Understand.".length; // 25, spaces included
  assert.equal(centreSplitIndex(runs, "en"), Math.floor(letters / 2));
  assert.equal(centreSplitIndex(runs, "en"), 12);
});

test("a centred Japanese line splits at the run boundary nearest the middle, never mid-word", () => {
  // 確かな素材。(6) + 明確な情報。(6) → 12 letters, middle 6 = the boundary
  assert.equal(centreSplitIndex([{ text: "確かな素材。" }, { text: "明確な情報。" }], "ja"), 6);
  // uneven runs: the boundary nearest the midpoint wins over the midpoint itself
  assert.equal(centreSplitIndex([{ text: "分かりやすい" }, { text: "価値。" }], "ja"), 6, "midpoint 4, boundary 6");
  assert.equal(centreSplitIndex([{ text: "流行を" }, { text: "超える" }, { text: "美しさ。" }], "ja"), 6, "boundaries 3 and 6; middle 5 → 6");
  // one run: nothing to split on, the midpoint stands
  assert.equal(centreSplitIndex([{ text: "美しさ。" }], "ja"), 2);
});

test("designUnit emits a fixed decimal, never an exponent (calc() would drop the declaration)", () => {
  assert.equal(cssNumber(Math.cos(Math.PI / 2)), "0.0000");
  assert.equal(designUnit(40), "calc(40.0000 * var(--raw-unit-design))");
  assert.equal(designUnit(-29.2), "calc(-29.2000 * var(--raw-unit-design))");
  // 6.1e-17 is cos(π/2) as JavaScript computes it — the case that collapsed a card in the reference.
  assert.equal(designUnit(6.1e-17), "calc(0.0000 * var(--raw-unit-design))");
});

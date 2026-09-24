import type { Lang } from "@/lib/i18n";

/**
 * Splitting a heading into animation units, for components/fx/split-text.tsx.
 * A .ts module rather than part of the component because the kinsoku sets
 * below are Japanese PUNCTUATION, not copy — and scripts/check-i18n.mjs rightly
 * refuses any CJK character in a .tsx file.
 *
 * Kinsoku: closing marks and the long-vowel mark may not start a line, and
 * opening brackets may not end one, so they travel with their neighbour.
 */
const CLOSE = /^[、。，．,.・：；？！ー〜…‥)）」』】〕〉》］｝!?%％]+$/;
const OPEN = /^[(（「『【〔〈《［｛]+$/;

export type Unit = { text: string; space: boolean };

export function segment(text: string, lang: Lang): Unit[] {
  const granularity = lang === "ja" ? "grapheme" : "word";
  const parts: string[] = typeof Intl !== "undefined" && "Segmenter" in Intl
    ? Array.from(new Intl.Segmenter(lang, { granularity }).segment(text), (s) => s.segment)
    : lang === "ja" ? Array.from(text) : text.split(/(\s+)/).filter(Boolean);
  const units: Unit[] = [];
  let carry = "";
  for (const p of parts) {
    if (/^\s+$/.test(p)) { units.push({ text: p, space: true }); continue; }
    const prev = units[units.length - 1];
    // Punctuation after a word (EN) or a closing mark (JA) joins the unit before.
    const closes = lang === "ja" ? CLOSE.test(p) : /^[^\p{L}\p{N}]+$/u.test(p);
    if (closes && prev && !prev.space) { prev.text += p; continue; }
    if (lang === "ja" && OPEN.test(p)) { carry += p; continue; }
    units.push({ text: carry + p, space: false });
    carry = "";
  }
  if (carry) units.push({ text: carry, space: false });
  return units;
}


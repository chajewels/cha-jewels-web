/**
 * The query normalizer, on its own so the browser can share it: lib/search.ts
 * is `server-only` (it holds the catalog index), but the analytics `search`
 * event must report the same normalized term the index matches against, or
 * the two cannot be compared. lib/search re-exports it; nothing else changes.
 */
/**
 * Fold a string to the form both sides of a comparison are measured in.
 *
 * NFKC does the width work: it maps full-width Latin and digits down to ASCII
 * ("Ｋ１８" → "K18") and half-width katakana up to full-width, so a query typed
 * on a Japanese IME and a SKU typed on an English one meet in the middle. It
 * also folds the ideographic space to U+0020, which the whitespace strip then
 * removes.
 *
 * Kana are folded katakana → hiragana afterwards, so "ネックレス", "ねっくれす"
 * and half-width "ﾈｯｸﾚｽ" are one string by the time they are compared. The
 * range stops at U+30F6: U+30FB (・) and U+30FC (ー) are punctuation shared by
 * both kana, and shifting them would corrupt rather than fold.
 *
 * Spaces are stripped entirely, not collapsed — Japanese is written without
 * them, so "ダイヤ モンド" and "ダイヤモンド" must be the same needle.
 */
export function normalize(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[ァ-ヶ]/g, (c) => String.fromCodePoint((c.codePointAt(0) as number) - 0x60));
}

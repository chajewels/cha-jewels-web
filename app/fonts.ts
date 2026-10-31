import localFont from "next/font/local";

/**
 * THE LUMIÈRE FACES (D-14): Instrument Serif (roman + italic), Manrope Medium
 * and Inter Tight Regular, self-hosted from public/lumiere/shared/fonts/ and
 * exposed as CSS variables only. Nothing on the existing pages uses them
 * until P3 replaces Playfair Display + Inter; until then the Playfair / Inter /
 * Noto Serif JP loaders in app/layout.tsx stay exactly as they were.
 *
 * `preload: false` on all three, on purpose: a preloaded face is a
 * high-priority request ahead of every page's LCP image, and in P1 no page
 * renders a glyph in them. P3 turns preload on for the faces the header and
 * the home use above the fold. The browser fetches a face only when a rendered
 * element asks for it, so these cost the existing pages nothing.
 *
 * Inter Tight is the reference's TTF subset to Latin (Google Fonts' latin
 * range + ¥ and •), 105 → 22 KB (docs/tasks/lumiere-p0-report.md §5.6). The
 * other three are the reference's own WOFF2 files, every glyph kept.
 * `adjustFontFallback: false`: the metric-compatible fallback is built per
 * face by next/font; the reference's layout measures against the real face
 * only, and the override descriptors it would add changed line boxes on the
 * phone headline in a quick check — the copy-fit table (§13) was measured
 * without them.
 */
export const instrumentSerif = localFont({
  src: [
    { path: "../public/lumiere/shared/fonts/InstrumentSerif-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/lumiere/shared/fonts/InstrumentSerif-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

export const manrope = localFont({
  src: [{ path: "../public/lumiere/shared/fonts/Manrope-Medium.woff2", weight: "500", style: "normal" }],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

export const interTight = localFont({
  src: [{ path: "../public/lumiere/shared/fonts/InterTight-Regular.woff2", weight: "400", style: "normal" }],
  variable: "--font-inter-tight",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

/** The three variables, for the `<html>` class list. */
export const lumiereFontVariables = `${instrumentSerif.variable} ${manrope.variable} ${interTight.variable}`;

import localFont from "next/font/local";

/**
 * THE LUMIÈRE FACES (D-14): Instrument Serif (roman + italic), Manrope and
 * Inter Tight Regular, self-hosted from public/lumiere/shared/fonts/ and
 * exposed as CSS variables. SINCE P3 THEY ARE THE SITE'S FACES: Playfair
 * Display and Inter are gone from app/layout.tsx, `--font-display` is
 * Instrument Serif and `--font-sans` is Manrope (app/lumiere/tokens.css), so
 * every page's chrome and base type set in them; Noto Serif JP stays the
 * Japanese heading face.
 *
 * Manrope is the VARIABLE face (Manrope-Variable.woff2: Google Fonts' Latin
 * subset of the OFL family, weights 200–800) rather than the reference's
 * Medium cut alone, because the site's UI sets Manrope at 400, 500, 600 and
 * 700 (buttons, labels, the cart count) and a single 500 cut would have been
 * faux-bolded everywhere else. The Lumière home's `font-manrope` resolves to
 * the same file at 500.
 *
 * `preload: false` on all three, still on purpose: next/font would preload
 * every file of a family on every page (the italic included). The faces the
 * chrome draws above the fold are preloaded by lib/lumiere/font-urls.ts +
 * components/lumiere/common/font-preload.tsx instead — the serif and Manrope
 * on every page (app/layout.tsx), the italic as well on the English home.
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
  src: [{ path: "../public/lumiere/shared/fonts/Manrope-Variable.woff2", weight: "200 800", style: "normal" }],
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

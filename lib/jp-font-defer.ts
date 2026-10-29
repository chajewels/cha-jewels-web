/**
 * Which pages defer the Japanese heading font until after window load
 * (components/site/jp-font-gate.tsx, app/globals.css "JAPANESE HEADING FONT").
 *
 * ONLY THE JAPANESE HOME PAGE. Measured on production (docs/seo/PERF-STEP3-FINDINGS.md):
 * with 37 Noto Serif JP slices (568 kB) fetched during load, the home page's hero
 * poster finishes at 6.1 s instead of 3.4 s on a throttled phone, and its
 * fallback headings wrap like the final font (0 of 52 differ at 1440 px). On
 * listing pages the deferral bought no LCP (3.1 s against 3.0 s on Rings) and,
 * because the fallback's Latin letters and digits are about 10% wider, about 9%
 * of product titles wrapped differently once Noto arrived, moving the caption
 * below by 22 px.
 *
 * The path is the one the middleware forwards (`x-cj-path`); the bare "/"
 * answers a 307 to "/ja" before any render, so it never reaches here.
 */
export function deferJpFont(lang: string, path: string | null | undefined): boolean {
  return lang === "ja" && /^\/ja\/?$/.test(path ?? "");
}

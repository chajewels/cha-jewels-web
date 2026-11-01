/**
 * THE LUMIÈRE FACES' BUILT URLS, for a home-only preload (P2; report §10
 * step 4 / the P2 rule "home-only preload of the hero fonts").
 *
 * `next/font/local` (app/fonts.ts) copies each file to
 * `/_next/static/media/<hash>.woff2`, where `<hash>` is loader-utils'
 * `[hash]` of the FILE CONTENT — xxhash64, hex, as `next-font-loader` names
 * it (no `-s` suffix: `adjustFontFallback` is off; no `.p`: `preload` is off).
 * The three files are committed and never change without a commit, so the
 * hashes are constants here, and two guards keep them honest:
 *   - tests/lumiere-font-urls.test.mjs recomputes every hash from the file
 *     with Next's own loader-utils and fails if one drifts;
 *   - `npm run check:fonts` (scripts/check-font-urls.mjs; also `postbuild`, so a
 *     production build fails on a drift) reads the built
 *     stylesheet after `next build` and fails if a URL is not the one
 *     `@font-face` actually declares.
 *
 * The home renders `FontPreload` (components/lumiere/common/font-preload.tsx,
 * from components/lumiere/home/home-view.tsx) with `heroFontKeys`; since P3
 * every other page renders it from app/layout.tsx with `chromeFontKeys` — the
 * two faces the Lumière header draws above the fold on every page.
 */
export const LUMIERE_FONT_FILES = {
  instrumentSerif: { file: "InstrumentSerif-Regular.woff2", hash: "29dc5d7306ed60a6" },
  instrumentSerifItalic: { file: "InstrumentSerif-Italic.woff2", hash: "cf354b1b8581a22c" },
  manrope: { file: "Manrope-Variable.woff2", hash: "8760c4774489e4ba" },
  interTight: { file: "InterTight-Regular.woff2", hash: "65a890f4ad2d42b9" },
} as const;

export type LumiereFontKey = keyof typeof LUMIERE_FONT_FILES;

/** The directory app/fonts.ts loads the files from (relative to the repo root). */
export const LUMIERE_FONT_DIR = "public/lumiere/shared/fonts";

export const lumiereFontUrl = (key: LumiereFontKey): string =>
  `/_next/static/media/${LUMIERE_FONT_FILES[key].hash}.woff2`;

/**
 * The faces the hero draws before anything else on each language's home:
 * the serif for the headline, wordmark, pills and CTA (its italic opens the
 * English headline's words), Manrope for the nav and tagline. Inter Tight is
 * first used below the fold (the collections lead) and is not preloaded.
 */
export const heroFontKeys = (lang: "en" | "ja"): LumiereFontKey[] =>
  lang === "en" ? ["instrumentSerif", "instrumentSerifItalic", "manrope"] : ["instrumentSerif", "manrope"];

/** The faces the site header draws on every page (P3): the serif wordmark and the Manrope labels. */
export const chromeFontKeys = (): LumiereFontKey[] => ["instrumentSerif", "manrope"];

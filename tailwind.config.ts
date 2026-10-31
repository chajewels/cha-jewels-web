import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { MOTION_CSS_VARS } from "./lib/motion";

/**
 * LUMIÈRE DESIGN-UNIT SPACING (docs/tasks/lumiere-p0-report.md §2). The
 * reference rebinds Tailwind 4's global step to one design unit
 * (`--spacing: var(--step)`), so `left-40` means 40 Figma pixels at 1440. The
 * global step cannot move here without re-laying every existing page, so the
 * unit scale is PREFIXED: `left-u-40`, `w-u-350`, `gap-u-48`, `-top-u-29` …
 * = `calc(N * var(--raw-unit-design))`. Integers 0–1500 cover every value the
 * reference's markup uses (its largest is 350); a fractional value goes in
 * `LUMIERE_UNIT_FRACTIONS` when a port needs one. JIT emits only what is used.
 */
const LUMIERE_UNIT_MAX = 1500;
const LUMIERE_UNIT_FRACTIONS = [0.5, 0.7, 1.5, 21.3333, 29.2, 38.5, 79.07] as const;
const lumiereUnits = (): Record<string, string> => {
  const scale: Record<string, string> = {};
  for (let n = 0; n <= LUMIERE_UNIT_MAX; n++) scale[`u-${n}`] = `calc(${n} * var(--raw-unit-design))`;
  for (const f of LUMIERE_UNIT_FRACTIONS) scale[`u-${f}`] = `calc(${f} * var(--raw-unit-design))`;
  return scale;
};

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: { DEFAULT: "#333333", deep: "#222222", mid: "#444444" },
        chalk: "#F5F5F2",
        gold: { DEFAULT: "#C9A227", pale: "#E8D28A", dark: "#8A6B12", deep: "#6F5510" },  // `deep` is `dark` taken one step down for the homepage's TINTED
        // surfaces: gold-dark is 4.59 on chalk and 5.01 on white, but only
        // 4.35 on bg-hairline/40 and 4.19 behind the mobile tab bar's
        // chalk/95. #7A5E10 is the smallest step that clears 4.5 (5.12
        // worst case); this one is 5.89, for headroom against a new tint.
        orange: { DEFAULT: "#FFA500", hover: "#FFB733" },
        teal: "#1ABC9C",
        garnet: { DEFAULT: "#7A1E2B", light: "#F28B94" },
        hairline: "#E5E5E0",
        // LUMIÈRE ROLES (app/lumiere/tokens.css Tier 2; the reference's
        // `@theme inline` bindings, report §2). Read at runtime through the
        // tokens, so the responsive bands in tokens.css reach every utility.
        // Nothing on the existing pages uses these names (checked 2026-11-01).
        surface: "var(--surface)",
        content: { DEFAULT: "var(--content)", inverse: "var(--content-inverse)" },
        "border-muted": "var(--border-muted)",
        "index-active": { DEFAULT: "var(--index-active)", inverse: "var(--index-active-inverse)" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        jp: ["var(--font-jp)", "Hiragino Mincho ProN", "serif"],
        sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "sans-serif"],
        // LUMIÈRE FACES (D-14; app/fonts.ts). `font-sans` stays Inter until P3,
        // so the reference's `font-sans` (Manrope) ports as `font-manrope`;
        // `font-serif` was unused on this site, so it takes Instrument Serif
        // as in the reference; `font-tight` is Inter Tight, as in the reference.
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
        manrope: ["var(--font-manrope)", "Helvetica Neue", "Arial", "sans-serif"],
        tight: ["var(--font-inter-tight)", "Helvetica Neue", "Arial", "sans-serif"],
      },
      // Paired size + leading, as the reference's `--text-x--line-height`:
      // `text-display` sets both. Values are the Tier 2 tokens of tokens.css.
      fontSize: {
        display: ["var(--type-display)", "var(--type-display-leading)"],
        wordmark: ["var(--type-wordmark)", "var(--type-wordmark-leading)"],
        body: ["var(--type-body)", "var(--type-body-leading)"],
        utility: ["var(--type-utility)", "var(--type-utility-leading)"],
        nav: ["var(--type-nav)", "var(--type-nav-leading)"],
        caption: ["var(--type-caption)", "var(--type-caption-leading)"],
        micro: ["var(--type-micro)", "var(--type-micro-leading)"],
        "collections-heading": ["var(--type-collections-heading)", "var(--type-collections-heading-leading)"],
        "collections-lead": ["var(--type-collections-lead)", "var(--type-collections-lead-leading)"],
        "card-label": ["var(--type-card-label)", "var(--type-card-label-leading)"],
        "card-title": ["var(--type-card-title)", "var(--type-card-title-leading)"],
        "card-index": ["var(--type-card-index)", "var(--type-card-index-leading)"],
        "card-note": ["var(--type-card-note)", "var(--type-card-note-leading)"],
        "card-cta": ["var(--type-card-cta)", "var(--type-card-cta-leading)"],
      },
      borderRadius: { card: "var(--corner-card)", panel: "var(--corner-panel)", pill: "var(--corner-pill)" },
      letterSpacing: { micro: "var(--track-micro)", utility: "var(--track-utility)", "card-cta": "var(--track-card-cta)" },
      transitionTimingFunction: { hover: "var(--ease-hover-role)", entrance: "cubic-bezier(0.2, 0, 0, 1)" },
      // Leading floor for clipped text-engine reveals (the reference's text-engine.md).
      lineHeight: { display: "1.1" },
      spacing: lumiereUnits(),
      borderColor: { rule: "rgba(201,162,39,.32)", "rule-soft": "rgba(201,162,39,.16)" },
      maxWidth: { site: "1240px" },
    },
  },
  // The motion tokens (lib/motion.ts) as custom properties on :root, so CSS
  // transitions and keyframes time themselves from the same file the
  // components read — in the stylesheet, not inlined into every page's HTML.
  // The motion tokens, and the few palette tokens that component-owned styles
  // (components/fx/*-style.ts) paint with, as custom properties on :root —
  // so those styles read the colours from this file rather than copies.
  plugins: [plugin(({ addBase, theme }) => addBase({ ":root": {
    ...(MOTION_CSS_VARS as Record<string, string>),
    "--c-gold": theme("colors.gold.DEFAULT"),
    "--c-gold-pale": theme("colors.gold.pale"),
    "--c-gold-dark": theme("colors.gold.dark"),
    "--c-charcoal-deep": theme("colors.charcoal.deep"),
    "--c-chalk": theme("colors.chalk"),
  } }))],
} satisfies Config;

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
        // LUMIÈRE PALETTE (D-4, P4): the existing names are kept so ~100 files
        // retarget in one place; the VALUES are the redesign's. charcoal is ink
        // (black, #1c1c1c, #2b2b2b), chalk is the page (bone-100), gold is no
        // longer a gold: `dark` is warm ink for labels and links on paper,
        // `pale` is the soft white for labels on black, `DEFAULT` the warm grey
        // of a rule or a dot, `deep` black. Gold survives only where it is
        // material — the pieces, the tier medallions (their own artwork).
        charcoal: { DEFAULT: "#1c1c1c", deep: "#000000", mid: "#2b2b2b" },
        chalk: "#f4f0ec",
        gold: { DEFAULT: "#a39d94", pale: "#d9d3ca", dark: "#2a2724", deep: "#000000" },
        teal: "#1ABC9C",
        garnet: { DEFAULT: "#7A1E2B", light: "#F28B94" },
        hairline: "#dad6d0",
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
        // D-14 (P3): `--font-display` is Instrument Serif and `--font-sans` is
        // Manrope on every page (app/lumiere/tokens.css); Playfair and Inter
        // are gone. `font-serif` and `font-display` both resolve through
        // `--lm-font-display`, which on `html:lang(ja)` adds the Mincho after
        // the serif — Latin glyphs from Instrument Serif, Japanese from Noto
        // Serif JP — so no display line can fall to a Gothic face (P3 item 1).
        display: ["var(--lm-font-display)"],
        jp: ["var(--font-jp)", "Hiragino Mincho ProN", "serif"],
        sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["var(--lm-font-display)"],
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
      // `pill` is a true pill (P4): the buttons and chips of the redesign; `rounded-sm`
      // (the old 2px square) is softened site-wide so every existing card, field
      // and chip takes the Lumière radius without a rename.
      borderRadius: { card: "var(--corner-card)", panel: "var(--corner-panel)", pill: "999px", sm: "10px" },
      letterSpacing: { micro: "var(--track-micro)", utility: "var(--track-utility)", "card-cta": "var(--track-card-cta)" },
      transitionTimingFunction: { hover: "var(--ease-hover-role)", entrance: "cubic-bezier(0.2, 0, 0, 1)" },
      // Leading floor for clipped text-engine reveals (the reference's text-engine.md).
      lineHeight: { display: "1.1" },
      spacing: lumiereUnits(),
      borderColor: { rule: "rgba(255,255,255,.2)", "rule-soft": "rgba(255,255,255,.1)" },
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

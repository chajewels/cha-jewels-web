import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { MOTION_CSS_VARS } from "./lib/motion";
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
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        jp: ["var(--font-jp)", "Hiragino Mincho ProN", "serif"],
        sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "sans-serif"],
      },
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
  } }))],
} satisfies Config;

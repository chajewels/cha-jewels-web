import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: { DEFAULT: "#333333", deep: "#222222", mid: "#444444" },
        chalk: "#F5F5F2",
        gold: { DEFAULT: "#C9A227", pale: "#E8D28A", dark: "#8A6B12" },
        orange: { DEFAULT: "#FFA500", hover: "#FFB733" },
        teal: "#1ABC9C",
        garnet: { DEFAULT: "#7A1E2B", light: "#F28B94" },
        // TRANSITIONAL ALIASES — Phase 3 Group A. The 44 files of Group C still
        // reference velvet / champagne / ink; these resolve them to the charcoal
        // palette so the whole site turns charcoal with this PR and nothing
        // renders unstyled in between. Group C renames every use and DELETES
        // these three lines. Do not add new uses.
        velvet: { DEFAULT: "#333333", deep: "#222222" },
        champagne: "#F5F5F2",
        ink: "#222222",
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
  plugins: [],
} satisfies Config;

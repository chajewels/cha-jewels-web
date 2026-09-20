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
  plugins: [],
} satisfies Config;

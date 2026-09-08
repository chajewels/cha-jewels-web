import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        velvet: { DEFAULT: "#0F2A22", deep: "#0A1D17", soft: "#143A2F" },
        gold: { DEFAULT: "#C9A227", pale: "#E8D28A", dark: "#8A6B12" },
        champagne: "#F3EBDB",
        ink: "#17130E",
        garnet: "#7A1E2B",
      },
      fontFamily: {
        display: ["var(--font-display)", "Didot", "serif"],
        jp: ["var(--font-jp)", "Hiragino Mincho ProN", "serif"],
        sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "sans-serif"],
      },
      borderColor: { rule: "rgba(201,162,39,.32)", "rule-soft": "rgba(201,162,39,.16)" },
      maxWidth: { site: "1240px" },
    },
  },
  plugins: [],
} satisfies Config;

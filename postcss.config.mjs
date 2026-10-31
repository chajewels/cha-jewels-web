// postcss-import first: it inlines the `@import "./lumiere/*.css"` files at
// the top of app/globals.css before Tailwind runs, which is what lets those
// files use `@layer components` / `@layer utilities` (Tailwind 3 can only
// layer rules it sees in the same stylesheet as its `@tailwind` directives).
export default { plugins: { "postcss-import": {}, tailwindcss: {}, autoprefixer: {} } };

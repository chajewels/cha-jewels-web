"use client";
import { useEffect } from "react";

/**
 * Lets the Japanese heading font (Noto Serif JP) download AFTER the page has
 * loaded rather than during it (app/globals.css, "JAPANESE HEADING FONT").
 *
 * Noto Serif JP reaches the browser as unicode-range slices, one request per
 * block of kanji the page uses. The Japanese home page asks for 37 of them
 * (568 kB) while the hero image, stylesheets and scripts are still arriving;
 * on a throttled phone that contention cost about 1.8 s of first paint and
 * 1.7 s of LCP (docs/perf-baseline.md, SEO Step 3). Until `data-jp-font` is
 * on <html>, the font variable names the system serif the stack already
 * falls back to, so the slices are not requested; once it is, the headings
 * switch to Noto Serif JP exactly as before.
 *
 * Without script the headings stay in the system serif. That is the font-stack
 * fallback they have always had, so nothing breaks.
 */
export function JpFontGate() {
  useEffect(() => {
    const root = document.documentElement;
    const on = () => root.setAttribute("data-jp-font", "");
    if (document.readyState === "complete") { on(); return; }
    window.addEventListener("load", on, { once: true });
    return () => window.removeEventListener("load", on);
  }, []);
  return null;
}

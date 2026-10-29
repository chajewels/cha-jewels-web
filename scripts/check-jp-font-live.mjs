// SEO Step 3a: real-browser check of the Japanese heading-font deferral.
// Usage: node scripts/check-jp-font-live.mjs [baseUrl]   (default http://localhost:3000)
// Needs a Chromium that Playwright can launch (npx playwright install chromium).
// Not part of CI. Reads public pages only.
import { chromium } from "@playwright/test";

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`); };

const INIT = () => {
  window.__cls = 0; window.__fam = {};
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  const f = (k) => { const h = document.querySelector("h1,h2"); if (h) window.__fam[k] = getComputedStyle(h).fontFamily; };
  document.addEventListener("DOMContentLoaded", () => f("dcl")); window.addEventListener("load", () => f("load"));
};

async function visit(browser, path, { width, height, reducedMotion } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, ...(reducedMotion ? { reducedMotion: "reduce" } : {}) });
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  await page.goto(base + path, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0];
    const fonts = performance.getEntriesByType("resource").filter((x) => /\.woff2/.test(x.name));
    const h = document.querySelector("h1,h2");
    return {
      defer: document.documentElement.hasAttribute("data-jp-defer"),
      gate: document.documentElement.hasAttribute("data-jp-font"),
      fontsBeforeLoad: fonts.filter((x) => x.startTime < n.loadEventStart).length,
      famDcl: window.__fam.dcl || "", famLoad: window.__fam.load || "", famFinal: getComputedStyle(h).fontFamily,
      cls: window.__cls, hscroll: document.documentElement.scrollWidth > innerWidth,
    };
  });
  await ctx.close();
  return r;
}
const noto = (f) => /^"Noto Serif JP",/.test(f);
const fallback = (f) => /^"Noto Serif JP Fallback"/.test(f);

const browser = await chromium.launch();
try {
  for (const [w, h] of [[390, 812], [1440, 900], [1920, 1080]]) {
    const home = await visit(browser, "/ja", { width: w, height: h });
    check(`/ja @${w}: deferring page (data-jp-defer on <html>)`, home.defer);
    check(`/ja @${w}: heading is the fallback at DOMContentLoaded and at load`, fallback(home.famDcl) && fallback(home.famLoad), `${home.famDcl.slice(0, 22)} | ${home.famLoad.slice(0, 22)}`);
    check(`/ja @${w}: Noto Serif JP applies after load`, home.gate && noto(home.famFinal));
    check(`/ja @${w}: only the Latin fonts start before load`, home.fontsBeforeLoad <= 4, `${home.fontsBeforeLoad} before load`);
    check(`/ja @${w}: no layout shift, no horizontal scroll`, home.cls < 0.0001 && !home.hscroll, `CLS ${home.cls.toFixed(5)}`);
  }
  for (const path of ["/ja/collections/rings", "/ja/categories/fine-jewelry", "/ja/about"]) {
    for (const [w, h] of [[390, 812], [1440, 900], [1920, 1080]]) {
      const r = await visit(browser, path, { width: w, height: h });
      check(`${path} @${w}: not deferred (no data-jp-defer), Noto Serif JP from first layout`, !r.defer && noto(r.famDcl) && noto(r.famFinal), `${r.famDcl.slice(0, 22)}`);
      check(`${path} @${w}: no font-induced layout shift (the 22 px card re-wrap)`, r.cls < 0.0001, `CLS ${r.cls.toFixed(5)}`);
    }
  }
  const en = await visit(browser, "/en", { width: 390, height: 812 });
  check("/en: not deferred, no Japanese font requests", !en.defer && !en.gate && en.fontsBeforeLoad <= 4, `${en.fontsBeforeLoad} fonts`);
  const rm = await visit(browser, "/ja", { width: 390, height: 812, reducedMotion: true });
  check("/ja with reduced motion: font still applies after load", rm.gate && noto(rm.famFinal));
} finally { await browser.close(); }

const failed = results.filter((x) => !x).length;
console.log(`\n${results.length - failed} pass, ${failed} fail`);
process.exit(failed ? 1 : 0);

// The account navigation is always fully visible and readable: every page of the account at every width and browser zoom the owner
// reported (P4b, finding A2) — the side list at lg and up, the wrapped chip row below it, EN and JA.
//
//   BASE_URL=http://localhost:3300 ACCOUNT_NAV_COOKIE='<cookie-name>=<value>' node scripts/check-account-nav.mjs
//
// Needs a signed-in session cookie (a real one from the preview, or the local fake-auth stand-in that is deliberately not in the
// repo). Not part of CI — a signed-in page cannot be reached there. Exit 1 on any failure; prints one line per failing page.
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://localhost:3300";
const raw = process.env.ACCOUNT_NAV_COOKIE;
if (!raw || !raw.includes("=")) { console.error("check-account-nav: set ACCOUNT_NAV_COOKIE='<name>=<value>' (a signed-in session cookie) — see the header of this file"); process.exit(2); }
const [cookieName, ...rest] = raw.split("="); const cookieValue = rest.join("=");
// widths 1024–1366 as reported; browser zoom 100/110/125/150 % on a 1440 window = effective 1440/1309/1152/960 CSS px; 1023 and 768/375 are the rail → stacked breakpoint and the phones.
const CASES = [[1024, 1], [1084, 1], [1100, 1], [1180, 1], [1280, 1], [1366, 1], [1440, 1], [1440, 1.1], [1440, 1.25], [1440, 1.5], [1023, 1], [768, 1], [375, 1]];
const PAGES = ["/account", "/account/orders", "/account/layaway", "/account/receipts", "/account/addresses", "/account/service-requests"];

const browser = await chromium.launch(); let checked = 0; const failures = [];
for (const [width, zoom] of CASES) for (const lang of ["en", "ja"]) {
  const css = Math.round(width / zoom);
  const ctx = await browser.newContext({ viewport: { width: css, height: Math.round(900 / zoom) }, deviceScaleFactor: zoom });
  await ctx.addCookies([{ name: cookieName, value: cookieValue, url: base }, { name: "cj-lang", value: lang, url: base }]);
  const page = await ctx.newPage();
  for (const path of PAGES) {
    if (lang === "ja" && path === "/account/layaway") continue; // layaway is English only
    await page.goto(base + path, { waitUntil: "networkidle" });
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const links = [...document.querySelectorAll(".iac-side__link, .lm-chip")].filter((a) => { const b = a.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
      const kind = links[0]?.matches(".lm-chip") ? "chips" : links.length ? "side" : "none";
      const entries = links.map((a) => {
        const range = document.createRange(); range.selectNodeContents(a); const boxes = [...range.getClientRects()].filter((b) => b.width > 0);
        const cs = getComputedStyle(a);
        return { text: (a.textContent || "").trim().slice(0, 24), left: boxes.length ? Math.min(...boxes.map((b) => b.left)) : null, right: boxes.length ? Math.max(...boxes.map((b) => b.right)) : null, visible: cs.visibility === "visible" && +cs.opacity >= 0.9 };
      });
      return { vw, kind, entries, overflow: document.documentElement.scrollWidth > vw + 1 };
    });
    const problems = [];
    if (r.kind === "none") problems.push("no account navigation");
    if (r.kind === "side" && css < 1024) problems.push("side list below the lg breakpoint");
    if (r.kind === "chips" && css >= 1024) problems.push("chip row at lg and up");
    for (const e of r.entries) if (e.left === null || e.left < 6 || e.right > r.vw + 1 || e.right - e.left < 20 || !e.visible) problems.push(`"${e.text}" ${e.left?.toFixed(0)}..${e.right?.toFixed(0)} of ${r.vw}`);
    if (r.overflow) problems.push("the page scrolls sideways");
    checked += 1; if (problems.length) failures.push(`${lang} ${width}px @${Math.round(zoom * 100)}% (css ${css}) ${path}: ${problems.slice(0, 3).join("; ")}`);
  }
  await ctx.close();
}
await browser.close();
console.log(`account navigation: ${checked - failures.length}/${checked} pass`); for (const f of failures) console.log("FAIL", f);
process.exit(failures.length ? 1 : 0);

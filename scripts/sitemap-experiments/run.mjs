// DP-15 bounded local experiments (matrix §S.7). Usage: node scripts/sitemap-experiments/run.mjs [E1,E2,E3,R]
// Starts a stub Hub on 3141 and (for R/V) `next start` on 3140; always stops both in `finally`.
// Whole run is bounded at 15 minutes. Expected URLs are derived from the stub's own lists (no hard-coded count).
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync, rmSync } from "node:fs";
import { DATA } from "./stub-hub.mjs";

const T0 = Date.now(), BUDGET = 15 * 60_000;
const left = () => BUDGET - (Date.now() - T0);
const HUB = "http://127.0.0.1:3141", SITE = "http://127.0.0.1:3140";
const env = { ...process.env, HUB_API_URL: HUB, HUB_API_KEY: "experiment", NEXT_TELEMETRY_DISABLED: "1" };
delete env.VERCEL_ENV; env.NEXT_PUBLIC_PREVIEW_FIXTURES = "0"; // .env.local sets it to 1; a defined process value wins
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const setHub = async (q) => { await ensureStub(); return fetch(`${HUB}/__set?${q}`).then((r) => r.json()); };
const expected = () => [
  ...DATA.collections.map((c) => `/collections/${c.slug}`), ...DATA.categories.map((c) => `/categories/${c.slug}`),
  ...DATA.products.map((p) => `/products/${p.slug}`), ...DATA.posts.map((p) => `/blog/${p.slug}`),
];
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const complete = (xml) => { const have = new Set(locs(xml)); return expected().every((p) => have.has(`/ja${p}`) && have.has(`/en${p}`) || (p.startsWith("/blog/") ? have.has(`/ja${p}`) || have.has(`/en${p}`) : false)); };
// A cold build: Next keeps a Data Cache of fetch responses in .next/cache/fetch-cache; a warm one can answer a failing Hub with the last good rows.
const build = (cold = true) => { if (cold) rmSync(".next/cache/fetch-cache", { recursive: true, force: true }); const r = spawnSync("npx", ["next", "build"], { env, encoding: "utf8", timeout: Math.max(60_000, left()), maxBuffer: 1 << 28 }); lastBuildOut = (r.stdout ?? "") + (r.stderr ?? ""); return { code: r.status, out: lastBuildOut }; };
const builtSitemap = () => (existsSync(".next/server/app/sitemap.xml.body") ? readFileSync(".next/server/app/sitemap.xml.body", "utf8") : null);
const results = [];
let lastBuildOut = "";
const rec = (id, ok, note) => { results.push({ id, ok, note }); console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${note}`); if (!ok && lastBuildOut) console.log(lastBuildOut.split("\n").filter((l) => /error|Error|SitemapUnavailable|Failed/.test(l)).slice(0, 8).join("\n")); };
const want = (process.argv[2] ?? "E1,E2,E3,R").split(",");

// The stub MUST be its own process: spawnSync(next build) blocks this one's event loop.
let stub;
const ensureStub = async () => {
  try { await fetch(`${HUB}/__get`); return; } catch {}
  stub = spawn("node", ["scripts/sitemap-experiments/stub-hub.mjs", "3141"], { stdio: "ignore" });
  for (let i = 0; i < 40; i++) { try { await fetch(`${HUB}/__get`); return; } catch { await sleep(250); } }
  throw new Error("stub hub did not start");
};
await ensureStub();
let srv;
try {
  if (want.includes("E1")) {
    await setHub("fail=");
    const b = build(); const x = builtSitemap();
    rec("E1 build healthy", b.code === 0 && !!x && complete(x), `exit ${b.code}; ${x ? locs(x).length : 0} URLs; complete=${x ? complete(x) : false}`);
  }
  if (want.includes("E2") && left() > 60_000) {
    for (const fam of ["collections", "categories", "product-slugs", "posts"]) {
      if (left() < 60_000) break;
      await setHub(`fail=${fam}`);
      const b = build();
      // A failing posts list also stops /blog/[slug] static generation first (existing, fail-closed behaviour); either way the build fails.
      const named = (b.out.includes("SitemapUnavailable") && b.out.includes(fam)) || (fam === "posts" && b.out.includes("Failed to collect page data for /blog/[slug]"));
      rec(`E2 build with ${fam} failing`, b.code !== 0 && named, `exit ${b.code}; SitemapUnavailable naming "${fam}": ${named}`);
    }
  }
  if (want.includes("E2") && left() > 120_000) {
    await setHub("fail="); build(true); // warm the Data Cache with a healthy build
    await setHub("fail=collections");
    const b = build(false); const x = builtSitemap();
    rec("E2w OBSERVATION build with a WARM Data Cache and collections failing", true, `exit ${b.code}; sitemap complete=${x ? complete(x) : false} (the cached last-good Hub rows answered; not a truncated sitemap)`);
  }
  if (want.includes("E3") && left() > 60_000) {
    await setHub("fail=images");
    const b = build(); const x = builtSitemap();
    rec("E3 build with only the optional image read failing", b.code === 0 && !!x && complete(x) && !x.includes("<image:"), `exit ${b.code}; complete=${x ? complete(x) : false}; image tags=${x ? x.includes("<image:") : "n/a"}`);
  }
  if (want.includes("R") && left() > 8 * 60_000) {
    await setHub("fail=");
    const b = build(); if (b.code !== 0) throw new Error("R: baseline build failed");
    srv = spawn("npx", ["next", "start", "-p", "3140"], { env, stdio: "ignore" });
    for (let i = 0; i < 30; i++) { try { if ((await fetch(`${SITE}/sitemap.xml`)).ok) break; } catch {} await sleep(1000); }
    const get = async () => { const r = await fetch(`${SITE}/sitemap.xml`); const t = await r.text(); return { status: r.status, cc: r.headers.get("cache-control"), cache: r.headers.get("x-nextjs-cache"), n: locs(t).length, complete: r.status === 200 && complete(t) }; };
    const g0 = await get(); rec("R0 healthy start", g0.complete, JSON.stringify(g0));
    await setHub("fail=collections,categories,product-slugs,posts");
    await sleep(75_000);
    const seen = [];
    for (let i = 0; i < 3; i++) { seen.push(await get()); if (i < 2) await sleep(10_000); }
    const kept = seen.every((s) => s.status === 200 && s.complete);
    const truncated = seen.some((s) => s.status === 200 && !s.complete);
    const errored = seen.some((s) => s.status >= 500);
    rec("R runtime failure", !truncated && !errored, `${kept ? "R1: last good output kept" : truncated ? "TRUNCATED 200 served" : errored ? "R2: error served" : "mixed"}; ${JSON.stringify(seen)}`);
    // V — recovery
    await setHub("fail=");
    const tV = Date.now(); let rec_ms = null;
    while (Date.now() - tV < 5 * 60_000 && left() > 15_000) { const g = await get(); if (g.complete && g.cache !== "STALE") { rec_ms = Date.now() - tV; } if (rec_ms !== null) break; await sleep(10_000); }
    // a complete result may simply be the retained good output; confirm with one more fresh read after >60s of healthy Hub
    await sleep(Math.min(65_000, Math.max(0, left() - 20_000))); const gf = await get();
    rec("V recovery", gf.complete, `healthy Hub restored; complete read after ${rec_ms === null ? "NOT within 5 min (unrecovered)" : Math.round(rec_ms / 1000) + " s"}; final ${JSON.stringify(gf)}`);
  }
} catch (e) {
  rec("EXPERIMENT ERROR", false, String(e?.message ?? e));
} finally {
  try { srv?.kill("SIGTERM"); spawnSync("pkill", ["-f", "next start -p 3140"]); } catch {}
  stub?.kill("SIGTERM");
  writeFileSync(process.env.SITEMAP_EXP_OUT ?? "/tmp/sitemap-experiments.json", JSON.stringify({ at: new Date().toISOString(), elapsed_s: Math.round((Date.now() - T0) / 1000), results }, null, 2));
}
process.exit(results.some((r) => !r.ok) ? 1 : 0);

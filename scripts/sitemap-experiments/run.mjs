// DP-15 bounded local experiments (matrix §S.10). Usage: node scripts/sitemap-experiments/run.mjs
// Runs EVERY required experiment; a missing or skipped one is a failure (exit 1). Starts a stub Hub on 3141 and
// `next start` on 3140 ONLY if both ports are free (an occupied port is refused, never reused, never killed)
// and stops only the processes it created. Every HTTP call has a 10 s bound. Whole run bounded at 25 minutes.
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync, rmSync } from "node:fs";
import net from "node:net";
import { expectedPaths } from "./stub-hub.mjs";

const T0 = Date.now(), BUDGET = 25 * 60_000, HTTP_MS = 10_000, RECOVERY_WINDOW_MS = 90_000;
const left = () => BUDGET - (Date.now() - T0);
const HUB = "http://127.0.0.1:3141", SITE = "http://127.0.0.1:3140";
const env = { ...process.env, HUB_API_URL: HUB, HUB_API_KEY: "experiment", NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_PREVIEW_FIXTURES: "0" /* .env.local sets it to 1; a defined process value wins */ };
delete env.VERCEL_ENV;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// connection: close — builds block this process for minutes (spawnSync), so a pooled keep-alive socket would be dead on the next call ("fetch failed").
const get = (url) => fetch(url, { signal: AbortSignal.timeout(HTTP_MS), headers: { connection: "close" } });
const portFree = (port) => new Promise((res) => { const s = net.createServer(); s.once("error", () => res(false)); s.listen(port, "127.0.0.1", () => s.close(() => res(true))); });
const REQUIRED = ["E1", "E2:collections", "E2:categories", "E2:product-slugs", "E2:posts", "E2w", "E3", "E4", "R0", "R:failure-reached", "R:continuity", "V:recovery"];
const results = new Map();
let lastBuildOut = "";
const rec = (id, ok, note) => { results.set(id, { ok, note }); console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${note}`); if (!ok && lastBuildOut) console.log(lastBuildOut.split("\n").filter((l) => /rror|SitemapUnavailable|Failed/.test(l) && !/errorLight/.test(l)).slice(0, 6).join("\n")); };
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const dynamic = (xml) => locs(xml).filter((p) => /^\/(ja|en)\/(collections|categories|products|blog)\/[^/]+$/.test(p)).sort();
const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const diff = (got, want) => `missing ${JSON.stringify(want.filter((x) => !got.includes(x)))} extra ${JSON.stringify(got.filter((x) => !want.includes(x)))}`;
const build = () => { rmSync(".next/cache/fetch-cache", { recursive: true, force: true }); return buildKeepCache(); };
const buildKeepCache = () => { const r = spawnSync("npx", ["next", "build"], { env, encoding: "utf8", timeout: Math.max(60_000, left()), maxBuffer: 1 << 28 }); lastBuildOut = (r.stdout ?? "") + (r.stderr ?? ""); return { code: r.status, out: lastBuildOut }; };
const builtSitemap = () => (existsSync(".next/server/app/sitemap.xml.body") ? readFileSync(".next/server/app/sitemap.xml.body", "utf8") : null);

const children = [];
// env: the stub Hub + fixtures off (otherwise `next start` would read the project .env.local)
const spawnOwned = (cmd, args, opts = {}) => { const c = spawn(cmd, args, { stdio: "ignore", detached: true, env, ...opts }); children.push(c); return c; };
const stopOwned = () => { for (const c of children) { try { process.kill(-c.pid, "SIGTERM"); } catch {} } };
const setHub = async (q) => (await get(`${HUB}/__set?${q}`)).json();
const stubState = async () => (await get(`${HUB}/__get`)).json();

let aborted = null;
try {
  for (const port of [3141, 3140]) if (!(await portFree(port))) throw new Error(`port ${port} is already in use by a process this harness did not create; refusing to continue`);
  spawnOwned("node", ["scripts/sitemap-experiments/stub-hub.mjs", "3141"]);
  for (let i = 0; i < 40; i++) { try { const r = await get(`${HUB}/__get`); if (r.headers.get("x-sitemap-exp-stub") === "1") break; } catch {} await sleep(250); if (i === 39) throw new Error("stub hub did not start"); }
  const want1 = expectedPaths("v1"), want2 = expectedPaths("v2");
  const IMG = "https://img.example.com/exp-ring-1.jpg";

  // E1 — cold build, healthy: EXACT eligible set + the image tag
  await setHub("fail=&bad=&dataset=v1");
  let b = build(), x = builtSitemap(), got = x ? dynamic(x) : [];
  rec("E1", b.code === 0 && sameSet(got, want1) && x.includes(IMG), `exit ${b.code}; exact set ${sameSet(got, want1) ? "equal" : diff(got, want1)}; image tag ${!!x?.includes(IMG)}`);

  // E2 — cold build, each essential family failing
  for (const fam of ["collections", "categories", "product-slugs", "posts"]) {
    await setHub(`fail=${fam}`);
    b = build();
    const st = await stubState(); const reached = (st.counters[fam]?.served503 ?? 0) > 0;
    // A failing posts list also stops /blog/[slug] static generation first (existing fail-closed behaviour); either way the build fails.
    const named = (b.out.includes("SitemapUnavailable") && b.out.includes(fam)) || (fam === "posts" && b.out.includes("Failed to collect page data for /blog/[slug]"));
    rec(`E2:${fam}`, b.code !== 0 && named && reached, `exit ${b.code}; named ${named}; upstream 503 reached ${st.counters[fam]?.served503 ?? 0}x`);
  }
  // E2w — OBSERVATION: warm Data Cache masks a failing Hub with the last good rows
  await setHub("fail=&bad=&dataset=v1"); build();
  await setHub("fail=collections"); b = buildKeepCache(); x = builtSitemap(); got = x ? dynamic(x) : [];
  rec("E2w", b.code === 0 && sameSet(got, want1), `OBSERVATION warm cache: exit ${b.code}; sitemap = last good rows (exact set ${sameSet(got, want1) ? "equal to v1" : diff(got, want1)})`);

  // E3 — optional image read failing
  await setHub("fail=images&bad=&dataset=v1"); b = build(); x = builtSitemap(); got = x ? dynamic(x) : [];
  const st3 = await stubState();
  rec("E3", b.code === 0 && sameSet(got, want1) && !x.includes("<image:") && (st3.counters.images?.served503 ?? 0) > 0, `exit ${b.code}; exact set ${sameSet(got, want1) ? "equal" : diff(got, want1)}; image tags ${!!x?.includes("<image:")}; image 503 reached ${st3.counters.images?.served503 ?? 0}x`);

  // E4 — malformed row (200, wrong shape) fails the build
  await setHub("fail=&bad=collections&dataset=v1"); b = build();
  // The malformed collections list also stops /collections/[slug] static generation first (existing, fail-closed); the sitemap's own row validation is covered by unit tests.
  const e4named = (b.out.includes("SitemapUnavailable") && b.out.includes("collections")) || b.out.includes("Failed to collect page data for /collections/[slug]");
  rec("E4", b.code !== 0 && e4named, `exit ${b.code}; build failed on the malformed 200: ${e4named} (sitemap-named: ${b.out.includes("SitemapUnavailable")})`);

  // R — runtime. Healthy build, start, then fail upstream, then restore a CHANGED valid dataset.
  await setHub("fail=&bad=&dataset=v1");
  b = build(); if (b.code !== 0) throw new Error("R: baseline build failed");
  spawnOwned("npx", ["next", "start", "-p", "3140"]);
  for (let i = 0; i < 40; i++) { try { if ((await get(`${SITE}/sitemap.xml`)).ok) break; } catch {} await sleep(1000); if (i === 39) throw new Error("next start did not come up"); }
  const read = async () => { const r = await get(`${SITE}/sitemap.xml`); const t = await r.text(); return { status: r.status, cache: r.headers.get("x-nextjs-cache"), set: dynamic(t), image: t.includes(IMG) }; };
  const g0 = await read();
  rec("R0", g0.status === 200 && sameSet(g0.set, want1) && g0.image, `status ${g0.status}; exact set ${sameSet(g0.set, want1) ? "equal to v1" : diff(g0.set, want1)}; image ${g0.image}`);
  const before = (await stubState()).counters;
  await setHub("fail=collections,categories,product-slugs,posts");
  await sleep(75_000);
  const seen = []; for (let i = 0; i < 3; i++) { seen.push(await read()); if (i < 2) await sleep(10_000); }
  const after = (await stubState()).counters;
  const fams = ["collections", "categories", "product-slugs", "posts"];
  const reached = Object.fromEntries(fams.map((f) => [f, (after[f]?.served503 ?? 0) - (before[f]?.served503 ?? 0)]));
  rec("R:failure-reached", fams.every((f) => reached[f] > 0), `upstream 503s served during the failure window: ${JSON.stringify(reached)} (an intended failure that was not reached would make the next check meaningless)`);
  rec("R:continuity", seen.every((s) => s.status === 200 && sameSet(s.set, want1)), `CONTINUITY evidence only (retained old output, not recovery): ${JSON.stringify(seen.map((s) => [s.status, s.cache, s.set.length]))}`);
  // V — recovery: restore the Hub with a CHANGED valid dataset; the sitemap must show the change within the window.
  await setHub("fail=&bad=&dataset=v2");
  const tV = Date.now(); let ok = false, lastSet = [];
  while (Date.now() - tV < 300_000 && left() > 20_000) {
    const g = await read(); lastSet = g.set;
    if (g.status === 200 && sameSet(g.set, want2)) { ok = true; break; }
    await sleep(5_000);
  }
  const ms = Date.now() - tV;
  rec("V:recovery", ok && ms <= RECOVERY_WINDOW_MS, ok ? `sitemap reflected the CHANGED dataset (added exp-new-col, exp-new-4; removed exp-chain-2) after ${Math.round(ms / 1000)} s; agreed window ${RECOVERY_WINDOW_MS / 1000} s` : `NOT reflected within 300 s: ${diff(lastSet, want2)}`);
} catch (e) {
  aborted = String(e?.message ?? e); console.log(`ABORT: ${aborted}`);
} finally {
  stopOwned();
  const missing = REQUIRED.filter((id) => !results.has(id));
  for (const id of missing) console.log(`FAIL ${id}: NOT RUN (missing or skipped required experiment)`);
  const failed = REQUIRED.filter((id) => results.get(id) && !results.get(id).ok);
  writeFileSync(process.env.SITEMAP_EXP_OUT ?? "/tmp/sitemap-experiments.json", JSON.stringify({ at: new Date().toISOString(), elapsed_s: Math.round((Date.now() - T0) / 1000), aborted, missing, failed, results: Object.fromEntries(results) }, null, 2));
  process.exitCode = aborted || missing.length || failed.length ? 1 : 0;
}

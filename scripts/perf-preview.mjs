// THE PERFORMANCE GATE ON A DEPLOYED PREVIEW (P5, docs/perf-baseline.md "How to run on the preview").
//
//   node scripts/perf-preview.mjs <label> [BASE_URL] [paths,comma,separated]
//   node scripts/perf-preview.mjs preview https://cha-jewels-web-git-redesign-lumiere-cha-jewels.vercel.app /ja,/en,/en/collections/rings,/en/products/<slug>,/cart
//   LH_BASE=https://www.chajewelsjp.com node scripts/perf-preview.mjs production …          (the same methods on production)
//
// A Vercel preview sits behind Deployment Protection. This script never asks for credentials in chat: it reads the project's
// "Protection Bypass for Automation" secret from the environment (VERCEL_AUTOMATION_BYPASS_SECRET) or from the untracked
// `.env.perf.local` at the repo root (one line: VERCEL_AUTOMATION_BYPASS_SECRET=…; `.env*.local` is git-ignored), writes it to a
// private temporary header file for Lighthouse (--extra-headers takes a file path, so the secret is never on a command line) and
// deletes the file afterwards. Nothing is printed. With no secret and a protected URL, the first run fails with the sign-in page
// and the script stops with the instruction instead of reporting a number.
//
// Methods (docs/perf-baseline.md): Lighthouse 13.6, normal Chrome UA, 3 runs, median (range); mobile = simulated Slow 4G / 4x CPU,
// desktop = the desktop preset, and "applied" = --throttling-method=devtools on mobile. Output: a markdown table on stdout.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [label, baseArg, pathsArg] = process.argv.slice(2);
if (!label) { console.error("usage: node scripts/perf-preview.mjs <label> [BASE_URL] [paths]"); process.exit(2); }
const BASE = (process.env.LH_BASE || baseArg || "http://localhost:3300").replace(/\/$/, "");
const PATHS = (pathsArg || "/ja,/en").split(",");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

let secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "";
if (!secret && existsSync(".env.perf.local")) {
  const line = readFileSync(".env.perf.local", "utf8").split("\n").find((l) => l.startsWith("VERCEL_AUTOMATION_BYPASS_SECRET="));
  if (line) secret = line.slice("VERCEL_AUTOMATION_BYPASS_SECRET=".length).trim().replace(/^["']|["']$/g, "");
}
const dir = mkdtempSync(join(tmpdir(), "perf-"));
const headersFile = join(dir, "headers.json");
if (secret) writeFileSync(headersFile, JSON.stringify({ "x-vercel-protection-bypass": secret, "x-vercel-set-bypass-cookie": "true" }), { mode: 0o600 });
process.on("exit", () => rmSync(dir, { recursive: true, force: true }));

const FORMS = {
  "mobile (lab)": ["--form-factor=mobile", "--screenEmulation.mobile", "--throttling-method=simulate"],
  "desktop (lab)": ["--preset=desktop"],
  "mobile (applied)": ["--form-factor=mobile", "--screenEmulation.mobile", "--throttling-method=devtools"],
};
const metric = (j, k) => j.audits.metrics.details.items[0][k];
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const fmt = (xs, f) => `${f(median(xs))} (${f(Math.min(...xs))}–${f(Math.max(...xs))})`;
const sec = (v) => `${(v / 1000).toFixed(2)} s`, ms = (v) => `${Math.round(v)} ms`;

const rows = [];
for (const path of PATHS) for (const [form, flags] of Object.entries(FORMS)) {
  const runs = [];
  for (let i = 1; i <= 3; i++) {
    const out = join(dir, `${path.replace(/[^a-z0-9]+/gi, "-")}-${form.replace(/\W+/g, "")}-${i}.json`);
    execFileSync("npx", ["-y", "lighthouse@13.6.0", `${BASE}${path}`, "--only-categories=performance", ...flags, "--quiet", `--emulated-user-agent=${UA}`, ...(secret ? [`--extra-headers=${headersFile}`] : []), "--output=json", `--output-path=${out}`, `--chrome-flags=--headless=new --no-sandbox`], { env: { ...process.env, CHROME_PATH: CHROME }, stdio: ["ignore", "ignore", "inherit"] });
    const j = JSON.parse(readFileSync(out, "utf8"));
    const finalUrl = j.finalDisplayedUrl || j.finalUrl || "";
    if (/vercel\.com\/(sso-api|login)|vercel\.com\/.*sso/.test(finalUrl)) { console.error(`\nBLOCKED: ${BASE}${path} redirected to Vercel's sign-in (${finalUrl.slice(0, 60)}…). Enable Protection Bypass for Automation (see this file's header) and put the secret in .env.perf.local.`); process.exit(3); }
    runs.push({ perf: Math.round(j.categories.performance.score * 100), lcp: metric(j, "largestContentfulPaint"), tbt: metric(j, "totalBlockingTime"), cls: metric(j, "cumulativeLayoutShift"), fcp: metric(j, "firstContentfulPaint") });
    console.error(`${label} ${path} ${form} run ${i}: perf ${runs.at(-1).perf} LCP ${runs.at(-1).lcp}`);
  }
  const col = (k) => runs.map((r) => r[k]);
  rows.push(`| \`${path}\` ${form} | ${fmt(col("perf"), String)} | ${fmt(col("lcp"), sec)} | ${fmt(col("fcp"), sec)} | ${fmt(col("tbt"), ms)} | ${fmt(col("cls"), (v) => v.toFixed(3))} |`);
}
console.log(`### ${label} — ${BASE}\n\n| Page | Perf | LCP | FCP | TBT | CLS |\n|---|---|---|---|---|---|\n${rows.join("\n")}`);

// SECURITY BATCH 2 (website), 2026-11-01 — W-04, W-05, W-06, W-08, W-09,
// W-10, W-11 (docs/security/SECURITY-HARDENING-2026-10-31.md).
//
// The behaviour tests run the REAL server code (Server Actions, route
// handlers, lib/hub-api.ts) in a child process with the network replaced
// (tests/security-batch2/harness.mjs): each scenario needs its own env because
// PREVIEW_FIXTURES is decided when the module loads, and lib/hub-api.ts uses
// TypeScript parameter properties, which need --experimental-transform-types.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

const KEEP = ["PATH", "HOME", "TMPDIR", "SystemRoot"];

function run(scenario, env = {}) {
  const base = Object.fromEntries(KEEP.filter((k) => process.env[k] !== undefined).map((k) => [k, process.env[k]]));
  const r = spawnSync(process.execPath, [
    "--experimental-transform-types", "--no-warnings",
    "--import", "./tests/register-aliases.mjs",
    "--import", "./tests/security-batch2/register.mjs",
    "tests/security-batch2/harness.mjs", scenario,
  ], { encoding: "utf8", env: { ...base, ...env }, timeout: 60000 });
  const marker = (r.stdout ?? "").lastIndexOf("@@SB2@@");
  assert.ok(marker >= 0, `scenario ${scenario} printed no result:\n${r.stdout}\n${r.stderr}`);
  const parsed = JSON.parse(r.stdout.slice(marker + 7).trim());
  assert.equal(parsed.result.threw, undefined, `scenario ${scenario} threw: ${parsed.result.threw}`);
  return parsed;
}

const HUB = { HUB_API_URL: "https://hub.test", HUB_API_KEY: "k" };
const UUID = "8c1e2f3a-1111-4222-8333-944455556666";

// ── W-04 fixtures mode ────────────────────────────────────────────────────────
test("W-04: fixtures flag is IGNORED on a production deployment — Hub reads throw not-configured, agreements are not signed", () => {
  const { result, fetches } = run("fixtures", { NEXT_PUBLIC_PREVIEW_FIXTURES: "1", VERCEL_ENV: "production" });
  assert.equal(result.flag, false);
  assert.equal(result.collections.ok, false);
  assert.match(result.collections.message, /not configured/);
  assert.deepEqual(result.agreement, { ok: false, reason: "not_configured" });
  assert.deepEqual(result.cardAgreement, { ok: false, reason: "not_configured" });
  assert.equal(result.points, null);
  assert.equal(fetches.length, 0);
});

test("W-04: fixtures still work on a preview deployment and locally", () => {
  for (const VERCEL_ENV of ["preview", undefined]) {
    const env = { NEXT_PUBLIC_PREVIEW_FIXTURES: "1", ...(VERCEL_ENV ? { VERCEL_ENV } : {}) };
    const { result } = run("fixtures", env);
    assert.equal(result.flag, true, String(VERCEL_ENV));
    assert.equal(result.collections.ok, true);
    assert.ok(result.collections.n > 0);
    assert.equal(result.agreement.ok, true);
    assert.equal(result.agreement.signed, true);
    assert.equal(result.cardAgreement.signed, true);
    assert.equal(result.points?.kind, "member");
  }
});

test("W-04: every flag that ENABLES fake data or a passing gate reads PREVIEW_FIXTURES; the module is server-only and never in a client component", () => {
  for (const f of ["lib/hub-api.ts", "lib/agreement-lookup.ts", "lib/points-actions.ts"]) {
    const src = readFileSync(f, "utf8");
    assert.ok(src.includes('from "@/lib/fixtures-mode"'), f);
    assert.ok(!/process\.env\.NEXT_PUBLIC_PREVIEW_FIXTURES\s*===\s*"1"/.test(src), `${f} still reads the raw flag`);
  }
  assert.ok(readFileSync("lib/fixtures-mode.ts", "utf8").startsWith('import "server-only";'));
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  for (const f of [...walk("app"), ...walk("components"), ...walk("lib")].filter((f) => /\.tsx?$/.test(f))) {
    const src = readFileSync(f, "utf8");
    if (/^\s*["']use client["']/.test(src)) assert.ok(!src.includes("fixtures-mode"), `${f} is a client component importing fixtures-mode`);
  }
});

// ── W-05 Server Action validation ────────────────────────────────────────────
const ME = {
  customer: {}, loyalty: {},
  addresses: [{ id: "a1", label: "home", recipient_name: "Ana", line1: "Old line", line2: null, city: "Tokyo", region: null, postal_code: "1", country: "JP", phone: null, is_default: true }],
};
const ADDRESS_ROUTES = JSON.stringify({ "GET /me": { body: ME }, "PUT /me/addresses": { body: { ok: true, count: 2 } } });

test("W-05: saveAddressAction ignores a client-sent address list — the Hub receives her /me addresses plus the new one", () => {
  const { result, fetches } = run("address", { ...HUB, SB2_JWT: "J", SB2_ROUTES: ADDRESS_ROUTES });
  assert.equal(result.current.ok, true);
  assert.equal(result.legacy.ok, true, "a page loaded before the deploy still saves");
  const puts = fetches.filter((f) => f.method === "PUT" && f.url.endsWith("/me/addresses"));
  assert.equal(puts.length, 3, "two tampered/current saves plus the any-country save");
  const expected = [
    { ...ME.addresses[0], is_default: false },
    { label: null, recipient_name: "Ana", line1: "1-2-3 Tateishi", line2: null, city: "Katsushika", region: null, postal_code: "124-0012", country: "JP", phone: "090", is_default: true },
  ];
  for (const put of puts.slice(0, 2)) assert.deepEqual(put.body.addresses, expected);
  assert.equal(puts[2].body.addresses[1].country, "ATLANTIS");
  // Each save read her list from the Hub first.
  assert.equal(fetches.filter((f) => f.method === "GET" && f.url.endsWith("/me")).length >= 2, true);
  assert.ok(!JSON.stringify(puts).includes("victim-id") && !JSON.stringify(puts).includes("CHANGED BY CLIENT"));
});

test("W-05: an over-long or mistyped new address is refused before any Hub call; any country text is still accepted", () => {
  const { result } = run("address", { ...HUB, SB2_JWT: "J", SB2_ROUTES: ADDRESS_ROUTES });
  assert.equal(result.anyCountry.ok, true, "no country list is enforced (unchanged acceptance)");
  assert.deepEqual(result.longLine, { ok: false, code: "address_invalid" });
  assert.deepEqual(result.wrongType, { ok: false, code: "address_invalid" });
  assert.deepEqual(result.noLine, { ok: false, code: "address_required" });
  assert.equal(result.fetchesForRefused, 0);
});

test("W-05: quoteAction refuses a bad order_type, an over-long gift note, a bad currency/mode/term before any Hub call", () => {
  const { result, fetches } = run("quote", { ...HUB, SB2_JWT: "J" });
  for (const k of ["badOrderType", "longGift", "badCurrency", "badMode", "fractionTerm"]) {
    assert.deepEqual(result[k], { ok: false, code: "invalid_input" }, k);
  }
  assert.equal(result.fetchesForRefused, 0);
  assert.deepEqual(result.noAddress, { ok: false, code: "address_required" });
  // A valid input (gift note at the cap) passes validation and reaches the cart.
  assert.deepEqual(result.valid, { ok: false, code: "empty_cart" });
  assert.equal(fetches.length, 0);
});

test("W-05: the schemas — caps, enums, no country list, and the existing book passed through untouched", async () => {
  const s = await import("@/lib/action-schemas");
  assert.equal(s.parseNewAddress({ line1: "a", country: "Philippines" }).address.country, "PHILIPPINES");
  assert.equal(s.parseNewAddress({ line1: "a" }).address.country, "JP");
  assert.equal(s.parseNewAddress({ line1: "a", country: "us" }).ok, true);
  assert.equal(s.parseNewAddress({ line1: "a", country: "Atlantis" }).ok, true, "free-text country, as before");
  assert.equal(s.parseNewAddress({ line1: "a", country: "x".repeat(61) }).ok, false);
  assert.equal(s.parseNewAddress({ line1: "a", postal_code: "1".repeat(33) }).ok, false);
  assert.equal(s.parseNewAddress(null).ok, false);
  // An existing address longer than any cap and with an unlisted country still goes back as it is.
  const old = { id: "x", line1: "y".repeat(5000), country: "Somewhere", is_default: true };
  const list = s.addressListWithNew([old], { line1: "new" });
  assert.equal(list[0].line1.length, 5000);
  assert.equal(list[0].country, "Somewhere");
  assert.equal(list[0].is_default, false);
  assert.equal(list[1].is_default, true);
  assert.equal(s.parseQuoteInput({ ship_to_address_id: "a", order_type: "gift" }).ok, false, "enum is exact (the form sends upper case)");
  assert.equal(s.parseQuoteInput({ ship_to_address_id: "a", order_type: "PROXY", recipient_phone: "1".repeat(61) }).ok, false);
  assert.equal(s.ProfileFieldsSchema.safeParse({ full_name: "x".repeat(201), facebook_name: "", mobile_number: "", next: "" }).success, false);
});

test("W-05: the profile action caps its fields; the checkout form sends only the new address", () => {
  const prof = readFileSync("lib/profile-actions.ts", "utf8");
  assert.ok(prof.includes("ProfileFieldsSchema.safeParse("));
  assert.ok(prof.indexOf("ProfileFieldsSchema.safeParse(") < prof.indexOf("hub.authCustomer("));
  const flow = readFileSync("components/commerce/checkout-flow.tsx", "utf8");
  assert.ok(flow.includes("saveAddressAction(draft)"));
  assert.ok(!flow.includes("saveAddressAction(addresses"));
  assert.ok(!flow.includes('from "@/lib/action-schemas"'), "zod stays off the client bundle");
});

// ── W-06 visitor IP ──────────────────────────────────────────────────────────
const IP_ROUTES = JSON.stringify({
  "POST /contact": { body: { status: "received" } },
  "POST /newsletter": { body: { status: "subscribed" } },
  "POST /loyalty/join": { body: { ok: true } },
  "POST /wholesale/inquiry": { body: { ok: true } },
  "POST /functions/v1/join-loyalty-program": { status: 500, body: { error: "down" } },
});
const IP_ENV = { ...HUB, SB2_JWT: "J", NEXT_PUBLIC_SUPABASE_URL: "https://sb.test", NEXT_PUBLIC_SUPABASE_ANON_KEY: "x", SB2_ROUTES: IP_ROUTES };
const HUB_CALLS = ["/contact", "/newsletter", "/loyalty/join", "/wholesale/inquiry"];

test("W-06: contact, newsletter, loyalty join and wholesale send the visitor's IP as x-forwarded-for, and no header when it is unknown", () => {
  const { result, fetches } = run("ip", { ...IP_ENV, SB2_HEADERS: JSON.stringify({ "x-vercel-forwarded-for": "203.0.113.7", "x-forwarded-for": "6.6.6.6, 1.1.1.1" }) });
  assert.equal(result.contact, "success");
  assert.equal(result.newsletter, "success");
  assert.deepEqual(result.loyalty, { state: "recorded" });
  assert.equal(result.wholesale, 200);
  for (const p of HUB_CALLS) {
    const call = fetches.find((f) => f.url === `https://hub.test${p}`);
    assert.ok(call, p);
    assert.equal(call.headers["x-forwarded-for"], "203.0.113.7", p);
  }
  // ...and no header at all when the address is unknown or not an IP literal.
  for (const headers of [{}, { "x-forwarded-for": "not-an-ip" }, { "x-vercel-forwarded-for": "evil.example", "x-real-ip": "" }]) {
    const { fetches } = run("ip", { ...IP_ENV, SB2_HEADERS: JSON.stringify(headers) });
    for (const p of HUB_CALLS) {
      const call = fetches.find((f) => f.url === `https://hub.test${p}`);
      assert.ok(call, p);
      assert.equal("x-forwarded-for" in call.headers, false, `${p} ${JSON.stringify(headers)}`);
    }
  }
});

test("W-06: clientIp — Vercel headers in order, IP literals only", async () => {
  const { clientIp, forwardedFor } = await import("@/lib/client-ip");
  const h = (o) => new Headers(o);
  assert.equal(clientIp(h({ "x-vercel-forwarded-for": "203.0.113.7", "x-real-ip": "198.51.100.1", "x-forwarded-for": "1.1.1.1" })), "203.0.113.7");
  assert.equal(clientIp(h({ "x-real-ip": "198.51.100.1", "x-forwarded-for": "1.1.1.1" })), "198.51.100.1");
  assert.equal(clientIp(h({ "x-forwarded-for": " 2001:db8::1 , 1.1.1.1" })), "2001:db8::1");
  assert.equal(clientIp(h({ "x-vercel-forwarded-for": "junk", "x-forwarded-for": "1.1.1.1" })), "1.1.1.1");
  assert.equal(clientIp(h({ "x-forwarded-for": "<script>" })), undefined);
  assert.equal(clientIp(h({})), undefined);
  assert.equal(clientIp(null), undefined);
  assert.deepEqual(forwardedFor(undefined), {});
  assert.deepEqual(forwardedFor("1.2.3.4"), { "x-forwarded-for": "1.2.3.4" });
  // The review, receipt and card paths use it too (no hand-rolled header split left).
  for (const f of ["app/actions/review.ts", "app/receipts/verify/page.tsx", "lib/card-actions.ts"]) {
    const src = readFileSync(f, "utf8");
    assert.ok(src.includes("clientIp(h)"), f);
    assert.ok(!src.includes('h.get("x-forwarded-for")'), f);
  }
});

// ── W-08 revalidate + lang ───────────────────────────────────────────────────
test("W-08: /api/revalidate refuses an unset, empty or short secret (401, logged once, value never printed)", () => {
  // Unset secret, no header; unset secret, empty header.
  let r = run("revalidate", { SB2_SENT: JSON.stringify([null, ""]) });
  assert.deepEqual(r.result.statuses, [401, 401]);
  assert.deepEqual(r.result.revalidated, []);
  // Empty secret + empty header — the old code's hole.
  r = run("revalidate", { REVALIDATE_SECRET: "", SB2_SENT: JSON.stringify(["", null]) });
  assert.deepEqual(r.result.statuses, [401, 401]);
  assert.deepEqual(r.result.revalidated, []);
  assert.equal(r.result.errors.length, 1, "misconfiguration logged once");
  // A short secret refuses even its own value, and is never printed.
  r = run("revalidate", { REVALIDATE_SECRET: "short-secret", SB2_SENT: JSON.stringify(["short-secret", "short-secret"]) });
  assert.deepEqual(r.result.statuses, [401, 401]);
  assert.equal(r.result.errors.length, 1);
  assert.ok(!r.result.errors[0].includes("short-secret"));
});

test("W-08: /api/revalidate accepts only the exact configured secret; allow-lists unchanged", () => {
  const secret = "a-correct-secret-of-32-characters!";
  const r = run("revalidate", { REVALIDATE_SECRET: secret, SB2_SENT: JSON.stringify([secret, secret.slice(0, -1), secret + "x", "", null]) });
  assert.deepEqual(r.result.statuses, [200, 401, 401, 401, 401]);
  assert.deepEqual(r.result.errors, []);
  assert.ok(r.result.revalidated.some(([k, v]) => k === "tag" && v === "content"));
  const src = readFileSync("app/api/revalidate/route.ts", "utf8");
  assert.ok(src.includes('const TAGS = ["catalog", "content", "paidy", "square", "reviews", "loyalty"] as const;'));
  assert.ok(src.includes('const PATHS = ["/faq"] as const;'));
  assert.ok(src.includes("timingSafeEqual"));
});

test("W-08: /api/lang answers 400 to a body that is not a JSON object; valid input unchanged", () => {
  const { result } = run("lang");
  for (const k of ["notJson", "empty", "nullBody", "array", "badLang"]) assert.equal(result[k].status, 400, k);
  assert.equal(result.en.status, 200);
  assert.match(result.en.cookie, /=en$/);
  assert.equal(result.ja.status, 200);
  assert.match(result.ja.cookie, /=ja$/);
});

// ── W-09 log trimming ────────────────────────────────────────────────────────
test("W-09: card and checkout logs never pass a whole error object", async () => {
  for (const f of ["lib/card-actions.ts", "lib/checkout-actions.ts"]) {
    const src = readFileSync(f, "utf8");
    const calls = src.match(/console\.(error|warn|log|info)\([^;]*\);/g) ?? [];
    for (const c of calls) assert.ok(!/,\s*(err|e|error)\s*\)\s*;$/.test(c), `${f}: ${c}`);
  }
  const { errorTag } = await import("@/lib/log-safe");
  const e = new TypeError("fetch failed https://hub.test/orders?token=SECRET");
  e.cause = { code: "UND_ERR_CONNECT_TIMEOUT", message: "connect to 10.0.0.1" };
  assert.equal(errorTag(e), "TypeError UND_ERR_CONNECT_TIMEOUT");
  assert.equal(errorTag(new DOMException("x", "TimeoutError")), "TimeoutError 23"); // DOMException.code
  assert.equal(errorTag(new Error("boom SECRET")), "Error");
  assert.equal(errorTag("a string with SECRET"), "unknown");
  assert.equal(errorTag({ name: "Bad Name <x>", code: "with spaces SECRET" }), "unknown");
});

// ── W-10 file magic ──────────────────────────────────────────────────────────
const bytes = (...parts) => new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));
const be32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const SAMPLES = {
  jpeg: bytes([0xff, 0xd8, 0xff, 0xe0, 0, 0x10], "JFIF", [0, 1, 1]),
  png: bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d], "IHDR"),
  webp: bytes("RIFF", [0x24, 0, 0, 0], "WEBPVP8 "),
  // An iPhone HEIC header: size 0x18, ftyp, major heic, minor 0, compatible mif1 heic.
  heic: bytes(be32(0x18), "ftypheic", [0, 0, 0, 0], "mif1heic"),
  heif: bytes(be32(0x1c), "ftypmif1", [0, 0, 0, 0], "mif1heicmiaf"),
  pdf: bytes("%PDF-1.7\n%"),
};

test("W-10: real JPEG/PNG/WebP/HEIC/PDF signatures are recognised; HTML, SVG, AVIF and GIF are not", async () => {
  const { sniffFileKind } = await import("@/lib/file-magic");
  assert.equal(sniffFileKind(SAMPLES.jpeg), "jpeg");
  assert.equal(sniffFileKind(SAMPLES.png), "png");
  assert.equal(sniffFileKind(SAMPLES.webp), "webp");
  assert.equal(sniffFileKind(SAMPLES.heic), "heic");
  assert.equal(sniffFileKind(SAMPLES.heif), "heic");
  assert.equal(sniffFileKind(SAMPLES.pdf), "pdf");
  assert.equal(sniffFileKind(bytes("<!doctype html><script>alert(1)</script>")), null);
  assert.equal(sniffFileKind(bytes("<svg xmlns='http://www.w3.org/2000/svg'>")), null);
  assert.equal(sniffFileKind(bytes("GIF89a")), null);
  assert.equal(sniffFileKind(bytes(be32(0x1c), "ftypavif", [0, 0, 0, 0], "avifmif1miaf")), null);
  assert.equal(sniffFileKind(bytes("RIFF", [0, 0, 0, 0], "WAVE")), null);
  assert.equal(sniffFileKind(new Uint8Array()), null);
});

test("W-10: payment proofs — HTML named .png refused, real images and PDFs accepted", async () => {
  const { proofBytesOk, proofTypeOk } = await import("@/lib/proof-file");
  const html = new File([bytes("<html><body>pay here</body></html>")], "slip.png", { type: "image/png" });
  assert.equal(proofTypeOk(html), true, "the label alone passes");
  assert.equal(await proofBytesOk(html), false, "the bytes do not");
  for (const [k, b] of Object.entries(SAMPLES)) assert.equal(await proofBytesOk(new File([b], `x.${k}`)), true, k);
  const src = readFileSync("lib/layaway-actions.ts", "utf8");
  const check = src.indexOf("proofBytesOk(file)");
  assert.ok(check > 0 && check < src.indexOf("uploadProof(jwt"), "bytes checked before upload");
  assert.match(src.slice(check, check + 120), /"proof_bad_type"/);
});

test("W-10: review photos — images only (no PDF, no HEIC), checked by bytes before the Hub call", async () => {
  const { fileKind, REVIEW_PHOTO_KINDS } = await import("@/lib/file-magic");
  for (const k of ["jpeg", "png", "webp"]) assert.ok(REVIEW_PHOTO_KINDS.includes(await fileKind(new Blob([SAMPLES[k]]))), k);
  for (const k of ["pdf", "heic"]) assert.ok(!REVIEW_PHOTO_KINDS.includes(await fileKind(new Blob([SAMPLES[k]]))), k);
  const src = readFileSync("app/actions/review.ts", "utf8");
  const check = src.indexOf("await fileKind(f)");
  assert.ok(check > 0 && check < src.indexOf("submitReview(token"));
  assert.match(src.slice(check, check + 160), /return "photo_type"/);
});

// ── W-11 workflow pins ───────────────────────────────────────────────────────
test("W-11: every workflow `uses:` is pinned to a 40-character commit SHA with a version comment", () => {
  const files = readdirSync(".github/workflows").filter((f) => /\.ya?ml$/.test(f));
  assert.ok(files.length > 0);
  let n = 0;
  for (const f of files) {
    for (const line of readFileSync(`.github/workflows/${f}`, "utf8").split("\n")) {
      const m = line.match(/^\s*(?:-\s*)?uses:\s*(\S+)(.*)$/);
      if (!m) continue;
      n++;
      assert.match(m[1], /^[\w.-]+\/[\w.\/-]+@[0-9a-f]{40}$/, `${f}: ${line.trim()}`);
      assert.match(m[2], /#\s*v\d+\.\d+\.\d+/, `${f}: ${line.trim()}`);
    }
  }
  assert.ok(n >= 6);
  assert.match(readFileSync(".github/workflows/ci.yml", "utf8"), /^ {2}check:$/m, "the required `check` job keeps its name");
});

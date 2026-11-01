// scripts/check-step4-live.mjs: the checklist parser (real file), the page rules on synthetic HTML (positive and NEGATIVE:
// every false pass the review demonstrated), the baseline schema, exact membership identities, section scoping, the article
// as a separate content task, exit statuses, and the REAL CLI path (baseline loading) against a local HTTP server.
// No outside network. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "node:http";
import { execFile } from "node:child_process";

const S = await import("../scripts/check-step4-live.mjs");
const { parseChecklist, evaluateListing, evaluateArticle, readHtml, classify, renderReport, exitStatus, validateBaseline, snapshotOf, imageIdentity, CHECKLIST, DEFAULT_BASE, BASELINE_SCHEMA } = S;
const md = readFileSync(join(process.cwd(), CHECKLIST), "utf8");
const parsed = parseChecklist(md);
const neck = parsed.listings.find((r) => /Necklaces/.test(r.name));

/** A synthetic listing page shaped like the real one: head metas, header (with a decoy), <main> with hero image, description block, product cards, footer (with the approved clarifier). */
const members = ["/en/products/a1", "/en/products/b2", "/en/products/c3"];
function page({ lang = "en", meta, og = meta, tw = meta, visible = meta, canonical, hreflang, memberList = members, imgs = ["/images/collections/necklaces.webp", "https://img.test/a.jpg"], links = ["/en/collections"], header = "", footer = "Our new jewelry is made in Japan, and so are many of our preloved pieces.", title = "Necklaces | Cha Jewels", h1 = "Necklaces", extraDescBlocks = 0 } = {}) {
  const own = neck.urls[lang];
  const hl = hreflang ?? [["en", neck.urls.en], ["ja", neck.urls.ja], ["x-default", neck.urls.en]];
  const img = (u) => `<img alt="" src="/_next/image?url=${encodeURIComponent(u)}&amp;w=3840&amp;q=75"/>`;
  return `<html><head><title>${title}</title><meta name="description" content="${meta}"/><link rel="canonical" href="${canonical ?? own}"/>${hl.map(([l, h]) => `<link rel="alternate" hrefLang="${l}" href="${h}"/>`).join("")}<meta property="og:description" content="${og}"/><meta name="twitter:description" content="${tw}"/><script>var d="${meta}"</script></head><body><header>${header}<a href="/en/about">About</a></header><main>${imgs.map(img).join("")}<h1>${h1}</h1><p class="cs-desc mt">${visible}</p>${Array.from({ length: extraDescBlocks }, () => `<p class="cs-desc">x</p>`).join("")}${links.map((l) => `<a href="${l}">l</a>`).join("")}${memberList.map((m) => `<a href="${m}">p</a>`).join("")}</main><footer><p>${footer}</p></footer></body></html>`;
}
const ok = (html) => ({ status: 200, redirected: false, location: null, html });
const A = neck.approved.en, O = neck.existing.en;
const baselinePage = snapshotOf(page({ meta: O }));

test("parseChecklist reads six listing records and the article from the real checklist file, never retyping a word", () => {
  assert.equal(parsed.listings.length, 6);
  for (const r of parsed.listings) for (const l of ["en", "ja"]) { assert.match(r.urls[l], new RegExp(`^${DEFAULT_BASE}/${l}/`)); assert.notEqual(r.existing[l], r.approved[l]); }
  assert.equal(parsed.article.approvedParagraphs.en.length, 2);
  assert.deepEqual(parsed.article.removedEn, ["Japan-made "]);
  assert.throws(() => parseChecklist(md.replace("**Approved JA:**", "**Approved XX:**")), /missing approved JA/);
  assert.throws(() => parseChecklist(md.replace("## 7. Preloved Jewelry category", "## 9. Preloved Jewelry category")), /expected 6 listing records/);
});

test("readHtml reads by SECTION: description block, members by href, images by identity, unrelated links, hreflang destinations; scripts and header/footer text never leak into the main text", () => {
  const d = readHtml(page({ meta: A, header: "<p class=\"cs-desc\">decoy</p>" }));
  assert.deepEqual(d.descBlocks, [A], "only <main>'s description block; the header decoy is outside");
  assert.deepEqual(d.members, [...members].sort());
  assert.deepEqual(d.images, ["/images/collections/necklaces.webp", "https://img.test/a.jpg"].sort(), "the identity behind /_next/image?url=");
  assert.deepEqual(d.otherLinks, ["/en/collections"]);
  assert.deepEqual(d.hreflang.map((x) => x.lang), ["en", "ja", "x-default"]);
  assert.doesNotMatch(d.mainText, /made in Japan/i, "footer text is not main text");
  assert.equal(imageIdentity("/_next/image?url=https%3A%2F%2Fx.test%2Fa.jpg&amp;w=1"), "https://x.test/a.jpg");
});

test("APPLIED needs meta, og, twitter AND the visible description block to equal the approved text; OLD needs all four old; any mixture is OTHER (reproduced false pass: meta approved, og/body old)", () => {
  const b = { baselinePage };
  assert.equal(evaluateListing(ok(page({ meta: A })), neck, "en", b).verdict, "APPLIED");
  assert.equal(evaluateListing(ok(page({ meta: O })), neck, "en", b).verdict, "OLD");
  for (const [name, over] of [["og old", { og: O }], ["twitter old", { tw: O }], ["visible old", { visible: O }], ["meta old", { og: A, tw: A, visible: A, meta: O }]]) {
    const r = evaluateListing(ok(page({ meta: A, ...over })), neck, "en", b);
    assert.equal(r.verdict, "OTHER", name); assert.match(r.problems.join(";"), /disagree/, name);
  }
  assert.equal(evaluateListing(ok(page({ meta: "Necklaces for everyone." })), neck, "en", b).verdict, "OTHER");
});

test("unapproved text SURROUNDING the approved substring is detected (the visible block must EQUAL the approved text, not contain it)", () => {
  for (const visible of [`${A} Free shipping worldwide!`, `Hot deal. ${A}`, `${A} ${A}`]) {
    const r = evaluateListing(ok(page({ meta: A, visible })), neck, "en", { baselinePage });
    assert.equal(r.verdict, "OTHER", visible.slice(0, 30)); assert.match(r.problems.join(";"), /visible=OTHER/);
  }
});

test("section scoping: the approved text in the footer or header does not make the description APPLIED; a second description block is a problem; the footer clarifier never trips the claim rule", () => {
  const r = evaluateListing(ok(page({ meta: O, footer: A, header: A })), neck, "en", { baselinePage });
  assert.equal(r.verdict, "OLD", "approved text elsewhere on the page is irrelevant");
  const two = evaluateListing(ok(page({ meta: A, extraDescBlocks: 1 })), neck, "en", { baselinePage });
  assert.match(two.problems.join(";"), /2 description block\(s\)/);
  const fine = evaluateListing(ok(page({ meta: A })), neck, "en", { baselinePage });
  assert.deepEqual(fine.problems, [], "the approved footer clarifier (made in Japan) is outside the scanned fields");
  const claim = evaluateListing(ok(page({ meta: A, visible: "Made in Japan chains." , og: A })), neck, "en", { baselinePage });
  assert.match(claim.problems.join(";"), /visible description carries an origin/);
});

test("canonical and the COMPLETE hreflang destinations are verified (en, ja, x-default each to its own URL)", () => {
  const b = { baselinePage };
  const bad = [
    ["canonical with a query", { canonical: `${neck.urls.en}?x=1` }, /canonical/],
    ["ja points at the en URL", { hreflang: [["en", neck.urls.en], ["ja", neck.urls.en], ["x-default", neck.urls.en]] }, /hreflang destinations/],
    ["x-default points at ja", { hreflang: [["en", neck.urls.en], ["ja", neck.urls.ja], ["x-default", neck.urls.ja]] }, /hreflang destinations/],
    ["only en and ja", { hreflang: [["en", neck.urls.en], ["ja", neck.urls.ja]] }, /hreflang destinations/],
    ["extra language", { hreflang: [["en", neck.urls.en], ["ja", neck.urls.ja], ["x-default", neck.urls.en], ["fr", neck.urls.en]] }, /hreflang destinations/],
  ];
  for (const [name, over, re] of bad) { const r = evaluateListing(ok(page({ meta: A, ...over })), neck, "en", b); assert.equal(r.verdict, "APPLIED WITH PROBLEMS", name); assert.match(r.problems.join(";"), re, name); }
});

test("membership by IDENTITY, not count (reproduced: same count, different pieces passed); images, unrelated links, title and H1 preservation", () => {
  const b = { baselinePage };
  const swap = evaluateListing(ok(page({ meta: A, memberList: ["/en/products/a1", "/en/products/b2", "/en/products/zzz"] })), neck, "en", b);
  assert.match(swap.problems.join(";"), /membership changed: 1 removed \(e\.g\. \/en\/products\/c3\), 1 added \(e\.g\. \/en\/products\/zzz\)/);
  assert.match(evaluateListing(ok(page({ meta: A, memberList: members.slice(0, 2) })), neck, "en", b).problems.join(";"), /1 removed/);
  assert.match(evaluateListing(ok(page({ meta: A, imgs: ["/images/collections/necklaces.webp"] })), neck, "en", b).problems.join(";"), /1 image\(s\) gone/);
  assert.match(evaluateListing(ok(page({ meta: A, imgs: ["/images/collections/necklaces.webp", "https://img.test/a.jpg", "https://img.test/new.jpg"] })), neck, "en", b).problems.join(";"), /1 image\(s\) added/);
  assert.match(evaluateListing(ok(page({ meta: A, links: [] })), neck, "en", b).problems.join(";"), /1 unrelated link\(s\) gone/);
  assert.match(evaluateListing(ok(page({ meta: A, links: ["/en/collections", "/en/sale"] })), neck, "en", b).problems.join(";"), /1 unrelated link\(s\) added/);
  assert.match(evaluateListing(ok(page({ meta: A, title: "Changed" })), neck, "en", b).problems.join(";"), /title changed/);
  assert.match(evaluateListing(ok(page({ meta: A, h1: "Chains" })), neck, "en", b).problems.join(";"), /H1 changed/);
  assert.deepEqual(evaluateListing(ok(page({ meta: A })), neck, "en", b).problems, []);
});

test("no baseline = preservation NOT VERIFIED (never silently passed); a redirect, a 500 and a timeout FAIL", () => {
  const r = evaluateListing(ok(page({ meta: A })), neck, "en");
  assert.equal(r.verdict, "APPLIED"); assert.match(r.notVerified.join(";"), /no baseline/);
  assert.equal(exitStatus([{ verdict: "APPLIED", notVerified: r.notVerified }]), 3);
  assert.equal(exitStatus([{ verdict: "APPLIED", notVerified: [] }]), 0);
  assert.equal(exitStatus([{ verdict: "OLD", notVerified: [] }, { verdict: "APPLIED", notVerified: [] }]), 1);
  assert.equal(evaluateListing({ status: 307, redirected: true, location: "/x", html: "" }, neck, "en").verdict, "FAIL");
  assert.equal(evaluateListing({ status: 500, redirected: false, location: null, html: "" }, neck, "en").verdict, "FAIL");
  assert.equal(evaluateListing({ status: 0, redirected: false, location: null, html: "", error: "timeout" }, neck, "en").verdict, "FAIL");
});

test("validateBaseline: the schema is enforced; the retired counts-only file, a missing page, non-array members and an empty listing are REFUSED", () => {
  const good = { schema: BASELINE_SCHEMA, pages: Object.fromEntries(parsed.listings.flatMap((r) => ["en", "ja"].map((l) => [r.urls[l], baselinePage]))) };
  assert.deepEqual(validateBaseline(good, parsed.listings), { ok: true, errors: [] });
  assert.match(validateBaseline({ counts: { x: 1 } }, parsed.listings).errors.join(";"), /retired counts-only file/);
  assert.match(validateBaseline({ ...good, schema: "nope" }, parsed.listings).errors.join(";"), /schema is "nope"/);
  assert.match(validateBaseline({ schema: BASELINE_SCHEMA, pages: {} }, parsed.listings).errors.join(";"), /baseline lacks/);
  const noMembers = structuredClone(good); noMembers.pages[neck.urls.en].members = "x";
  assert.match(validateBaseline(noMembers, parsed.listings).errors.join(";"), /`members` must be an array of strings/);
  const empty = structuredClone(good); empty.pages[neck.urls.en].members = [];
  assert.match(validateBaseline(empty, parsed.listings).errors.join(";"), /no members/);
  assert.equal(validateBaseline(null, parsed.listings).ok, false);
  assert.equal(validateBaseline([], parsed.listings).ok, false);
});

const arti = (paras, { header = "", footer = "Our new jewelry is made in Japan, and so are many of our preloved pieces." } = {}) => `<html><body><header>${header}</header><main><article>${paras.map((p) => `<p>${p}</p>`).join("")}</article></main><footer><p>${footer}</p></footer></body></html>`;
test("the article is scoped to the <article> body: approved paragraphs elsewhere do not count, the footer clarifier never fails it, a leftover phrase inside the article fails, no <article> fails", () => {
  const a = parsed.article;
  assert.equal(evaluateArticle(ok(arti(a.approvedParagraphs.en)), a, "en").verdict, "APPLIED");
  assert.equal(evaluateArticle(ok(arti(["other"], { footer: a.approvedParagraphs.en.join(" "), header: a.approvedParagraphs.en[0] })), a, "en").verdict, "NOT APPLIED", "approved text in header/footer is not the article body");
  assert.equal(evaluateArticle(ok(arti(a.approvedParagraphs.en, { footer: "Cha Jewels: Japan-made everything." })), a, "en").verdict, "APPLIED", "a footer or header phrase never fails the article");
  const left = evaluateArticle(ok(arti([...a.approvedParagraphs.en, "We sell Japan-made K18 gold."])), a, "en");
  assert.equal(left.verdict, "NOT APPLIED"); assert.match(left.problems.join(";"), /still carries a removed phrase/);
  const partial = evaluateArticle(ok(arti([`${a.approvedParagraphs.en[0]} And more.`, a.approvedParagraphs.en[1]])), a, "en");
  assert.equal(partial.verdict, "NOT APPLIED", "a paragraph with extra text around the approved one is not the approved paragraph");
  assert.match(evaluateArticle(ok("<html><body><main>none</main></body></html>"), a, "en").problems.join(";"), /no <article> element/);
  assert.equal(evaluateArticle(ok(arti(a.approvedParagraphs.ja)), a, "ja").verdict, "APPLIED");
});

test("renderReport: the article is absent from the default report; present and labelled only when selected", () => {
  const seo = [{ kind: "SEO", record: "Necklaces collection", lang: "en", verdict: "OLD", problems: [], notVerified: [], facts: { productLinks: 12 } }];
  assert.match(renderReport(seo, { base: DEFAULT_BASE, when: "t" }), /Article: not run \(a separate content task; select it with --article\)/);
  const withArt = [...seo, { kind: "CONTENT (BUG-03; not an SEO status item)", record: "A", lang: "ja", verdict: "NOT APPLIED", problems: [], notVerified: [], facts: {} }];
  assert.match(renderReport(withArt, { base: DEFAULT_BASE, when: "t" }), /Article \(content task, run only because --article was given\): JA NOT APPLIED/);
});

// ---------------------------------------------------------------- the real CLI, end to end, against a local server
function serve(pagesByPath) {
  const srv = createServer((req, res) => { const body = pagesByPath[req.url]; if (body == null) { res.statusCode = 404; res.end("nf"); return; } res.setHeader("content-type", "text/html"); res.end(body); });
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r({ srv, base: `http://127.0.0.1:${srv.address().port}` })));
}
const cli = (args) => new Promise((resolve) => execFile(process.execPath, ["scripts/check-step4-live.mjs", ...args], { cwd: process.cwd(), encoding: "utf8" }, (err, stdout, stderr) => resolve({ code: err ? err.code : 0, stdout, stderr })));
const pathOf = (u) => new URL(u).pathname;
const allPages = (make) => Object.fromEntries(parsed.listings.flatMap((r) => ["en", "ja"].map((l) => [pathOf(r.urls[l]), make(r, l)])));
const mk = (text) => (r, l) => page({ lang: l, meta: text(r, l), canonical: r.urls[l], hreflang: [["en", r.urls.en], ["ja", r.urls.ja], ["x-default", r.urls.en]], title: r.name, h1: r.name });

test("REAL CLI: --capture-baseline writes the schema file; a run against the unchanged site is OLD (exit 1); --baseline loads it; the old counts-only file and a bad schema are REFUSED (exit 2); with the approved text and an unchanged baseline it exits 0; a membership swap exits 1; no --baseline exits 3; --article is separate", async () => {
  const dir = mkdtempSync(join(tmpdir(), "step4-"));
  const old = await serve(allPages(mk((r, l) => r.existing[l])));
  const baseFile = join(dir, "baseline.json");
  try {
    const cap = await cli(["--base", old.base, "--capture-baseline", baseFile]);
    assert.equal(cap.code, 0, cap.stderr); assert.match(cap.stdout, /12 pages/);
    const b = JSON.parse(readFileSync(baseFile, "utf8"));
    assert.equal(b.schema, BASELINE_SCHEMA); assert.equal(Object.keys(b.pages).length, 12); assert.deepEqual(b.pages[neck.urls.en].members, [...members].sort());
    const unchanged = await cli(["--base", old.base, "--baseline", baseFile]);
    assert.equal(unchanged.code, 1, "the site still has the old text"); assert.match(unchanged.stdout, /Listing texts applied: 0 of 12/); assert.doesNotMatch(unchanged.stdout, /NOT APPLIED/, "the article is not part of the default run");
    const retired = join(dir, "counts.json"); writeFileSync(retired, JSON.stringify({ _note: "x", counts: { [neck.urls.en]: 3 } }));
    const r1 = await cli(["--base", old.base, "--baseline", retired]); assert.equal(r1.code, 2); assert.match(r1.stderr, /baseline REFUSED[\s\S]*retired counts-only file/);
    const badSchema = join(dir, "bad.json"); writeFileSync(badSchema, JSON.stringify({ schema: "x", pages: b.pages }));
    assert.equal((await cli(["--base", old.base, "--baseline", badSchema])).code, 2);
    const garbage = join(dir, "g.json"); writeFileSync(garbage, "{ not json");
    const r3 = await cli(["--base", old.base, "--baseline", garbage]); assert.equal(r3.code, 2); assert.match(r3.stderr, /baseline unreadable/);
    assert.equal((await cli(["--base", old.base, "--baseline", join(dir, "missing.json")])).code, 2);
  } finally { old.srv.close(); }
  const applied = await serve(allPages(mk((r, l) => r.approved[l])));
  try {
    const good = await cli(["--base", applied.base, "--baseline", baseFile]);
    assert.equal(good.code, 0, good.stdout + good.stderr); assert.match(good.stdout, /Listing texts applied: 12 of 12/);
    const noBase = await cli(["--base", applied.base]);
    assert.equal(noBase.code, 3); assert.match(noBase.stdout, /no baseline/);
    const withArt = await cli(["--base", applied.base, "--baseline", baseFile, "--article"]);
    assert.equal(withArt.code, 1, "the article pages are not served here: an explicitly selected content check fails on its own, without touching the SEO rows"); assert.match(withArt.stdout, /CONTENT \(BUG-03/);
  } finally { applied.srv.close(); }
  const swapped = await serve(allPages((r, l) => page({ lang: l, meta: r.approved[l], canonical: r.urls[l], hreflang: [["en", r.urls.en], ["ja", r.urls.ja], ["x-default", r.urls.en]], title: r.name, h1: r.name, memberList: ["/en/products/a1", "/en/products/b2", "/en/products/zzz"] })));
  try { const sw = await cli(["--base", swapped.base, "--baseline", baseFile]); assert.equal(sw.code, 1); assert.match(sw.stdout, /membership changed: 1 removed/); } finally { swapped.srv.close(); }
});

test("source guard: the verifier GETs only (no write verb), takes no credential and never loads the retired counts file", () => {
  const src = readFileSync(join(process.cwd(), "scripts/check-step4-live.mjs"), "utf8");
  assert.doesNotMatch(src, /method:\s*["'](?:POST|PUT|PATCH|DELETE)/i);
  assert.doesNotMatch(src, /process\.env|authorization|bypass/i);
  assert.doesNotMatch(src, /baseline\?\.\[/, "no count-indexed baseline lookup");
});

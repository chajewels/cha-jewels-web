// NOTHING LAYAWAY-RELATED ON THE JAPANESE SITE (owner decision 2026-09-25,
// final). Fails if Japanese content that can render on the Japanese site names
// layaway (分割予約 / レイアウェイ).
//
// It checks what the pages RENDER, not the source text: the legal documents go
// through the same legalArticlesFor / tokushoRowsFor the pages call, and the
// FAQ fixture drops the same `layaway: true` entries lib/faq.ts drops. So an
// article marked layaway-only may keep its Japanese (English pages still carry
// it), but a sentence that reaches a Japanese page may not.
//
// lib/i18n.ts is checked by key: a Japanese string may name layaway only if its
// key is in LAYAWAY_GATED_KEYS, i.e. it is rendered only behind
// layawayOffered(lang). Adding a key there is a claim about where it renders;
// check the call site first.
//
// Runs the TypeScript modules directly with Node's type stripping (the npm
// script passes --experimental-strip-types); they import only types.
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const WORDS = /分割予約|レイアウェイ/;
const load = (rel) => import(pathToFileURL(join(process.cwd(), rel)).href);

const LAYAWAY_GATED_KEYS = new Set([
  "nav.layaway", // header: layawayOffered
  "why.s4p", // why-cha-jewels: layaway ? [...]
  "hero.cta2", // hero slide: s.layaway
  "home.layCalcH", // LayawayBand: rendered only when layaway
  "product.reserveCta", // ReserveWithLayaway: product page `layaway &&`
  "product.reserveNote", // same
  "footer.terms", // footer: layawayOffered(lang) &&
  "account.layawayH", // unused
  "account.layawaySoon", // unused
  "account.layawayLearn", // /account/layaway: notFound on ja
  "checkout.agreementHeading", // layaway signing step: mode === "layaway", impossible on ja
  "checkout.agreementIntro", // same
  "checkout.agreementRequired", // same
  "checkout.modeLayaway", // mode fieldset: layawayOk &&
  "plans.h1", // /account/layaway page and links: layawayOffered
  "plans.empty", // /account/layaway: notFound on ja
  "plans.back", // /account/layaway/[id]: notFound on ja
  "service.viewPlan", // service-request row: plan link hidden when !layawayOffered
  "accountMenu.layaway", // header account menu: layawayOffered
  "meta.layaway.title", // pageMeta("layaway") returns {} when !layawayOffered
]);

const hits = [];

/** Every Japanese string under `node`: values of `ja` keys, strings or arrays. */
function jaStrings(node, path, out) {
  if (Array.isArray(node)) { node.forEach((x, i) => jaStrings(x, `${path}[${i}]`, out)); return out; }
  if (!node || typeof node !== "object") return out;
  for (const [k, v] of Object.entries(node)) {
    if (k === "ja") {
      const flat = Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : x?.t ?? "")) : [v];
      flat.forEach((s) => typeof s === "string" && out.push({ path, s }));
    } else jaStrings(v, `${path}.${k}`, out);
  }
  return out;
}
const scan = (label, node) => {
  for (const { path, s } of jaStrings(node, label, [])) if (WORDS.test(s)) hits.push(`${path}: ${s.slice(0, 90)}`);
};

// Legal pages, as the Japanese pages render them.
const legal = await load("lib/content/legal.ts");
scan("legal.returnsIntro", legal.returnsIntro);
scan("legal.returnsArticles", legal.legalArticlesFor(legal.returnsArticles, false));
scan("legal.privacyArticles", legal.legalArticlesFor(legal.privacyArticles, false));
scan("legal.tosArticles", legal.legalArticlesFor(legal.tosArticles, false));
scan("legal.tokusho.rows", legal.tokushoRowsFor(false));
scan("legal.tokusho.title", legal.tokusho.title);
scan("legal.legalTitles", legal.legalTitles);

// FAQ preview content, minus the entries lib/faq.ts drops on ja.
const faq = await load("lib/content/faq.ts");
scan("faq", faq.faqSections.map((s) => ({ ...s, items: s.items.filter((i) => !i.layaway) })));

// Dictionary, by key.
const { dict } = await load("lib/i18n.ts");
(function walk(node, path) {
  if (!node || typeof node !== "object") return;
  if (typeof node.ja === "string" && typeof node.en === "string") {
    if (WORDS.test(node.ja) && !LAYAWAY_GATED_KEYS.has(path)) hits.push(`i18n ${path}: ${node.ja.slice(0, 90)}`);
    return;
  }
  for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
})(dict, "");

if (hits.length) {
  for (const h of hits) console.error(h);
  console.error(`\n${hits.length} Japanese string(s) name layaway where the Japanese site renders them. Remove the layaway part from the ja text, mark the article/row/FAQ entry \`layaway: true\`, or — only if it renders behind layawayOffered(lang) — add the i18n key to LAYAWAY_GATED_KEYS.`);
  process.exit(1);
}
console.log(`layaway-ja check passed: no 分割予約 / レイアウェイ in Japanese legal, FAQ or ungated dictionary strings (${LAYAWAY_GATED_KEYS.size} gated keys).`);

// Per-post language eligibility (lib/posts.ts postLanguages), Phase 2B / F2.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { hub } = await import("@/lib/hub-api");
const { postLanguages } = await import("@/lib/posts");
const row = (over) => ({ slug: "s", type: "article", published_at: "2026-01-01", title_en: "T", body_en: "Body.", title_ja: "タイトル", body_ja: "本文です。", ...over });

test("a post with title and body in both languages exists in both", async () => {
  hub.post = async () => row({});
  assert.deepEqual(await postLanguages("s"), { en: true, ja: true });
});

test("a missing title OR body removes that language (a title alone is a draft)", async () => {
  hub.post = async () => row({ body_ja: null });
  assert.deepEqual(await postLanguages("s"), { en: true, ja: false });
  hub.post = async () => row({ title_en: "  ", body_en: "Body." });
  assert.deepEqual(await postLanguages("s"), { en: false, ja: true });
});

test("a layaway-only post exists in English only, whatever text it carries", async () => {
  hub.post = async () => row({ layaway_only: true });
  assert.deepEqual(await postLanguages("s"), { en: true, ja: false });
});

test("an unknown post, or a Hub failure, exists in no language (never a guessed sibling)", async () => {
  hub.post = async () => null;
  assert.deepEqual(await postLanguages("s"), { en: false, ja: false });
  hub.post = async () => { throw new Error("down"); };
  assert.deepEqual(await postLanguages("s"), { en: false, ja: false });
});

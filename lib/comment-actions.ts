"use server";

import { revalidatePath } from "next/cache";
import { hub } from "@/lib/hub-api";
import { getLang } from "@/lib/i18n-server";
import { readSession } from "@/lib/session";
import { runCommentAction, type CommentResult, type PostComment } from "@/lib/comments";

/**
 * Writing, editing and deleting an article comment (owner plan C1–C8).
 *
 * Server Actions, like every other customer write: the customer's JWT is read
 * from the auth cookie here and paired with HUB_API_KEY on the server, never
 * sent with a browser fetch. The Hub decides everything that matters — that
 * she is verified and linked, that the post takes comments, that the comment
 * is hers and still pending; this side re-checks only the body's bounds.
 *
 * Never throws to the client: every outcome is a CommentResult (codes in
 * lib/comments.ts). The body is never logged. On success the article is
 * revalidated so a reload agrees with what the form shows.
 */
// The Hub does not constrain a slug's characters, so only the shape is checked
// here; every value is URL-encoded on its way to the Hub.
const SLUG = /^[^/?#\s]{1,200}$/;
const ID = /^[^/?#\s]{1,64}$/;

const ok = (v: unknown, re: RegExp): v is string => typeof v === "string" && re.test(v);
const articlePath = (slug: string) => `/blog/${slug}`;
const badTarget = { ok: false as const, code: "not_found" as const, requestId: null };

export async function createCommentAction(slug: string, body: string): Promise<CommentResult<PostComment>> {
  if (!ok(slug, SLUG)) return badTarget;
  const [session, lang] = await Promise.all([readSession(), getLang()]);
  return runCommentAction(
    session, body,
    async (jwt, clean) => (await hub.createComment(jwt, slug, clean, lang)).comment,
    () => revalidatePath(articlePath(slug)),
  );
}

export async function updateCommentAction(slug: string, id: string, body: string): Promise<CommentResult<PostComment>> {
  if (!ok(slug, SLUG) || !ok(id, ID)) return badTarget;
  return runCommentAction(
    await readSession(), body,
    async (jwt, clean) => (await hub.updateComment(jwt, slug, id, clean)).comment,
    () => revalidatePath(articlePath(slug)),
  );
}

export async function deleteCommentAction(slug: string, id: string): Promise<CommentResult<{ id: string }>> {
  if (!ok(slug, SLUG) || !ok(id, ID)) return badTarget;
  return runCommentAction(
    await readSession(), undefined,
    async (jwt) => { await hub.deleteComment(jwt, slug, id); return { id }; },
    () => revalidatePath(articlePath(slug)),
  );
}

/**
 * ARTICLE COMMENTS (owner plan C1–C8, 2026-10-16; Hub contract "Article
 * comments" in the Hub repo's supabase/contracts/api.md).
 *
 * A signed-in, email-verified customer writes a comment under a blog ARTICLE;
 * nothing is public until the owner approves it in the Hub. Bodies are PLAIN
 * TEXT: rendered as text (React escapes it), never as HTML or markdown.
 *
 * The bounds are the Hub's (`_shared/post-comments.ts` cleanCommentBody: 1–1000
 * characters after trimming). Both sides need them: the form shows the counter
 * and refuses an empty body before it is sent, and the Server Action re-checks
 * because the browser is not the authority on anything. A plain module, like
 * lib/reviews.ts, because a "use server" file may export only async functions —
 * and so the action's code mapping can be unit-tested without Next.js.
 */

export const COMMENT_MIN = 1;
export const COMMENT_MAX = 1000;

/** The public shape: never an email, a customer id or a status. */
export type PostComment = {
  id: string;
  /** The first word of the customer's name, shown with "Verified customer". */
  author_first_name: string;
  body: string;
  created_at: string;
  /** The staff reply, shown as "Cha Jewels". */
  reply: { body: string; created_at: string } | null;
};

/** GET /content/posts/:slug/comments */
export type PostComments = {
  /** Whether the form may be offered (a published article dated today or earlier). */
  open: boolean;
  /** Approved, newest first. */
  comments: PostComment[];
  /** The signed-in customer's own pending comments, newest first; [] without a JWT. */
  pending_own: PostComment[];
};

/** The trimmed body, or null when it is not COMMENT_MIN–COMMENT_MAX characters — the Hub's rule. */
export function cleanCommentBody(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const body = raw.trim();
  return body.length < COMMENT_MIN || body.length > COMMENT_MAX ? null : body;
}

/**
 * One word per outcome, for the form to render. The Hub's own codes where one
 * exists, so a failure on screen names its cause; `sign_in` for every "no
 * usable session" (none, expired, or the Hub's 401); `error` for anything else
 * (lang_invalid, a 5xx, a network failure), shown with the Hub's Ref.
 */
export const COMMENT_CODES = [
  "sign_in",
  "email_unverified",
  "email_required_for_account",
  "customer_not_linked",
  "not_found",
  "comments_closed",
  "comment_locked",
  "body_invalid",
  "rate_limited",
  "error",
] as const;
export type CommentCode = (typeof COMMENT_CODES)[number];

export type CommentResult<T> = { ok: true; data: T } | { ok: false; code: CommentCode; requestId: string | null };

/** A HubError, read by shape: this module must not import lib/hub-api (server-only, network). */
type HubErrorLike = { status: number; code: string | null; requestId: string | null };
const isHubErrorLike = (e: unknown): e is HubErrorLike =>
  !!e && typeof e === "object" && typeof (e as { status?: unknown }).status === "number";

/** A thrown Hub call → the result the form shows. Never throws. */
export function commentFailure(e: unknown): { ok: false; code: CommentCode; requestId: string | null } {
  if (!isHubErrorLike(e)) return { ok: false, code: "error", requestId: null };
  const requestId = e.requestId ?? null;
  if (e.status === 401 || e.code === "customer_auth_required") return { ok: false, code: "sign_in", requestId };
  const known = (COMMENT_CODES as readonly string[]).includes(e.code ?? "") && e.code !== "sign_in" && e.code !== "error";
  return { ok: false, code: known ? (e.code as CommentCode) : "error", requestId };
}

/**
 * The body of every comment action, with its two outside dependencies passed
 * in so it can be tested with a mock Hub: no usable session → `sign_in`; a body
 * outside the bounds → `body_invalid` before the Hub is asked (when `rawBody`
 * is given — a delete has none); otherwise the Hub call, its failure mapped.
 */
export async function runCommentAction<T>(
  session: { jwt: string; expired: boolean } | null,
  rawBody: unknown | undefined,
  hubCall: (jwt: string, body: string) => Promise<T>,
  onSuccess?: () => void,
): Promise<CommentResult<T>> {
  if (!session || session.expired) return { ok: false, code: "sign_in", requestId: null };
  let body = "";
  if (rawBody !== undefined) {
    const clean = cleanCommentBody(rawBody);
    if (clean === null) return { ok: false, code: "body_invalid", requestId: null };
    body = clean;
  }
  try {
    const data = await hubCall(session.jwt, body);
    onSuccess?.();
    return { ok: true, data };
  } catch (e) {
    return commentFailure(e);
  }
}

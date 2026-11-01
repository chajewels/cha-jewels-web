import { tr } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";
import { hub } from "@/lib/hub-api";
import { readSession } from "@/lib/session";
import { profileUrl } from "@/lib/profile";
import { formatSiteDate } from "@/lib/site-time";
import type { PostComment } from "@/lib/comments";
import { CommentForm } from "@/components/blog/comment-form";

/**
 * COMMENTS UNDER AN ARTICLE (owner plan C1–C8, 2026-10-16).
 *
 * Approved comments, newest first, each with the author's first name, the
 * "Verified customer" badge and, when staff answered, the Cha Jewels reply.
 * A signed-in customer also sees her own comments still awaiting approval and
 * the form; a visitor sees one line linking to sign-in, which brings her back
 * here (`next=`, the site's existing convention). When the Hub says the post is
 * not `open`, the comments are still listed and nothing invites a new one.
 *
 * Bodies are PLAIN TEXT, rendered as text — React escapes them — with their
 * line breaks kept (`whitespace-pre-line`), never as HTML or markdown.
 *
 * A SECONDARY section: if the Hub cannot answer, it renders nothing and the
 * article still reads. Only the Hub decides what is listed — it answers for the
 * post it already served — so there is no language or layaway filter here.
 */
export async function CommentsSection({ slug, lang }: { slug: string; lang: Lang }) {
  const t = tr(lang);
  const session = await readSession();
  // An expired access token is refreshed only on gated pages (middleware), so
  // here it counts as signed out: the Hub would refuse it anyway.
  const jwt = session && !session.expired ? session.jwt : undefined;
  const data = await hub.postComments(slug, jwt).catch(() => null);
  if (!data) return null;

  const comments = Array.isArray(data.comments) ? data.comments : [];
  const pendingOwn = jwt && Array.isArray(data.pending_own) ? data.pending_own : [];
  const here = `/blog/${slug}`;
  const signInHref = `/login?next=${encodeURIComponent(here)}`;
  const count = comments.length === 1 ? t("comments", "countOne") : t("comments", "count", { n: String(comments.length) });

  return (
    <section id="comments" aria-labelledby="comments-h" className="mt-16 rounded-[22px] bg-chalk p-[clamp(20px,3vw,36px)]">
      <h2 id="comments-h" className="flex flex-wrap items-baseline gap-x-3 font-display text-2xl text-charcoal-deep">
        {t("comments", "h")}
        <span className="font-sans text-sm text-charcoal/70">{count}</span>
      </h2>
      <p className="mt-2 text-sm text-charcoal/70">{t("comments", "lede")}</p>

      {comments.length === 0 ? (
        <p className="mt-6 text-sm text-charcoal/70">{t("comments", "empty")}</p>
      ) : (
        <ol className="mt-6 grid gap-4">
          {comments.map((c) => <li key={c.id}><ApprovedComment comment={c} lang={lang} /></li>)}
        </ol>
      )}

      {jwt ? (
        <CommentForm
          slug={slug}
          lang={lang}
          open={data.open === true}
          initialPending={pendingOwn.map((c) => ({ ...c, when: formatSiteDate(c.created_at, lang) }))}
          signInHref={signInHref}
          profileHref={profileUrl(here)}
        />
      ) : data.open === true ? (
        <p className="mt-8 text-sm">
          <a href={signInHref} className="text-gold-dark underline underline-offset-4">{t("comments", "signIn")}</a>
        </p>
      ) : null}
    </section>
  );
}

function ApprovedComment({ comment, lang }: { comment: PostComment; lang: Lang }) {
  const t = tr(lang);
  return (
    <article className="rounded-[18px] bg-white p-5 sm:p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-semibold text-charcoal-deep">
          {comment.author_first_name}
          <span className="ml-2 text-xs font-normal text-charcoal/70">· {t("comments", "verified")}</span>
        </p>
        <time dateTime={comment.created_at} className="text-xs text-charcoal/70">{formatSiteDate(comment.created_at, lang)}</time>
      </header>
      <p className="mt-3 whitespace-pre-line break-words text-[15px] leading-[1.75] text-charcoal-deep">{comment.body}</p>
      {comment.reply && (
        <div className="mt-4 rounded-[14px] border-l-2 border-gold-dark bg-chalk px-4 py-3">
          <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs">
            <span className="font-semibold text-gold-dark">{t("comments", "reply")}</span>
            <time dateTime={comment.reply.created_at} className="text-charcoal/70">{formatSiteDate(comment.reply.created_at, lang)}</time>
          </p>
          <p className="mt-2 whitespace-pre-line break-words text-sm leading-[1.7] text-charcoal-deep">{comment.reply.body}</p>
        </div>
      )}
    </article>
  );
}

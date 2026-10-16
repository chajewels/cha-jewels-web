"use client";

import { useState, useTransition } from "react";
import { createCommentAction, deleteCommentAction, updateCommentAction } from "@/lib/comment-actions";
import { COMMENT_MAX, cleanCommentBody, type CommentCode, type PostComment } from "@/lib/comments";
import { tr, type Lang } from "@/lib/i18n";
import { formatSiteDate } from "@/lib/site-time";
import { Button } from "@/components/ui/button";
import { alertLight, inputLight, labelLight } from "@/lib/form-classes";

/** A pending comment with its date already formatted (on the server for the first render). */
type Pending = PostComment & { when: string };

type Links = { signInHref: string; profileHref: string };

/**
 * The signed-in half of the comments section: her own comments still awaiting
 * approval (edit inline, delete after a second press) and the form.
 *
 * Every write is a Server Action (lib/comment-actions.ts), so her JWT stays on
 * the server. A new or edited comment goes to the top of her pending list as
 * the Hub returned it; nothing becomes public here — the owner approves in the
 * Hub. `open` false (the Hub's word) hides the form; her pending comments stay
 * listed so she can still edit or delete them until they are reviewed.
 */
export function CommentForm({ slug, lang, open, initialPending, signInHref, profileHref }: {
  slug: string;
  lang: Lang;
  open: boolean;
  initialPending: Pending[];
} & Links) {
  const t = tr(lang);
  const [pending, setPending] = useState<Pending[]>(initialPending);
  const [body, setBody] = useState("");
  const [error, setError] = useState<{ code: CommentCode; requestId: string | null } | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, start] = useTransition();
  const links = { signInHref, profileHref };

  const withDate = (c: PostComment): Pending => ({ ...c, when: formatSiteDate(c.created_at, lang) });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSent(false);
    // The Hub's bound, checked before the round trip; the action checks again.
    if (cleanCommentBody(body) === null) { setError({ code: "body_invalid", requestId: null }); return; }
    start(async () => {
      const res = await createCommentAction(slug, body);
      if (!res.ok) { setError({ code: res.code, requestId: res.requestId }); return; }
      setPending((rows) => [withDate(res.data), ...rows.filter((r) => r.id !== res.data.id)]);
      setBody("");
      setSent(true);
    });
  }

  return (
    <div className="mt-10">
      {pending.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-[0.14em] text-charcoal/70 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{t("comments", "yoursH")}</h3>
          <ul className="mt-3 grid gap-4">
            {pending.map((c) => (
              <li key={c.id}>
                <PendingComment
                  comment={c} slug={slug} lang={lang} links={links}
                  onSaved={(saved) => setPending((rows) => rows.map((r) => (r.id === c.id ? withDate(saved) : r)))}
                  onDeleted={() => setPending((rows) => rows.filter((r) => r.id !== c.id))}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <form onSubmit={submit} className="mt-8 grid gap-3" noValidate>
          <label htmlFor="comment-body" className={`text-sm ${labelLight}`}>{t("comments", "label")}</label>
          <textarea
            id="comment-body" name="body" rows={5} maxLength={COMMENT_MAX} required
            value={body}
            onChange={(e) => { setBody(e.target.value); if (error?.code === "body_invalid") setError(null); }}
            aria-describedby="comment-hint comment-count"
            className={`w-full px-3 py-2 text-[15px] leading-[1.7] ${inputLight}`}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[12px] text-charcoal/70">
            <span id="comment-hint">{t("comments", "hint")}</span>
            <span id="comment-count" aria-live="polite" className="tabular-nums">
              {t("comments", "counter", { n: String(body.length), max: String(COMMENT_MAX) })}
            </span>
          </div>
          {error && <ErrorLine {...error} lang={lang} links={links} />}
          {sent && !error && (
            <p role="status" className="border border-gold-dark px-4 py-3 text-sm text-gold-dark">{t("comments", "sent")}</p>
          )}
          <div>
            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
              {busy ? t("comments", "submitting") : t("comments", "submit")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function PendingComment({ comment, slug, lang, links, onSaved, onDeleted }: {
  comment: Pending;
  slug: string;
  lang: Lang;
  links: Links;
  onSaved: (c: PostComment) => void;
  onDeleted: () => void;
}) {
  const t = tr(lang);
  const [mode, setMode] = useState<"view" | "edit" | "confirmDelete">("view");
  const [draft, setDraft] = useState(comment.body);
  const [error, setError] = useState<{ code: CommentCode; requestId: string | null } | null>(null);
  const [busy, start] = useTransition();
  const fieldId = `comment-edit-${comment.id}`;

  function save() {
    setError(null);
    if (cleanCommentBody(draft) === null) { setError({ code: "body_invalid", requestId: null }); return; }
    start(async () => {
      const res = await updateCommentAction(slug, comment.id, draft);
      if (!res.ok) { setError({ code: res.code, requestId: res.requestId }); return; }
      onSaved(res.data);
      setMode("view");
    });
  }

  function remove() {
    setError(null);
    start(async () => {
      const res = await deleteCommentAction(slug, comment.id);
      if (!res.ok) { setError({ code: res.code, requestId: res.requestId }); setMode("view"); return; }
      onDeleted();
    });
  }

  const small = "min-h-10 w-full px-4 py-2 text-sm sm:w-auto";

  return (
    <article className="border border-dashed border-charcoal/60 bg-white p-5 sm:p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm font-semibold text-charcoal-deep">
          {comment.author_first_name}
          <span className="ml-2 inline-block border border-gold-dark px-2 py-0.5 text-[11px] font-normal text-gold-dark">{t("comments", "pending")}</span>
        </p>
        <time dateTime={comment.created_at} className="text-xs text-charcoal/70">{comment.when}</time>
      </header>

      {mode === "edit" ? (
        <div className="mt-3 grid gap-2">
          <label htmlFor={fieldId} className="sr-only">{t("comments", "edit")}</label>
          <textarea
            id={fieldId} rows={4} maxLength={COMMENT_MAX}
            value={draft} onChange={(e) => setDraft(e.target.value)}
            className={`w-full px-3 py-2 text-[15px] leading-[1.7] ${inputLight}`}
          />
          <p className="text-right text-[12px] tabular-nums text-charcoal/70">
            {t("comments", "counter", { n: String(draft.length), max: String(COMMENT_MAX) })}
          </p>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-line break-words text-[15px] leading-[1.75] text-charcoal-deep">{comment.body}</p>
      )}

      {error && <div className="mt-3"><ErrorLine {...error} lang={lang} links={links} /></div>}

      {mode === "confirmDelete" && (
        <p role="alert" className="mt-4 text-sm text-charcoal-deep">{t("comments", "deleteAsk")}</p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {mode === "view" && (
          <>
            <Button type="button" variant="outline" className={small} onClick={() => { setDraft(comment.body); setError(null); setMode("edit"); }}>{t("comments", "edit")}</Button>
            <Button type="button" variant="outline" className={small} onClick={() => { setError(null); setMode("confirmDelete"); }}>{t("comments", "delete")}</Button>
          </>
        )}
        {mode === "edit" && (
          <>
            <Button type="button" className={small} disabled={busy} onClick={save}>{busy ? t("comments", "saving") : t("comments", "save")}</Button>
            <Button type="button" variant="outline" className={small} disabled={busy} onClick={() => { setError(null); setMode("view"); }}>{t("comments", "cancel")}</Button>
          </>
        )}
        {mode === "confirmDelete" && (
          <>
            <Button type="button" className={small} disabled={busy} onClick={remove}>{busy ? t("comments", "deleting") : t("comments", "deleteYes")}</Button>
            <Button type="button" variant="outline" className={small} disabled={busy} onClick={() => setMode("view")}>{t("comments", "cancel")}</Button>
          </>
        )}
      </div>
    </article>
  );
}

/** One honest line per outcome, with the way forward where there is one. */
function ErrorLine({ code, requestId, lang, links }: { code: CommentCode; requestId: string | null; lang: Lang; links: Links }) {
  const t = tr(lang);
  const line = (() => {
    switch (code) {
      case "sign_in": return { text: t("comments", "errSignIn"), link: { href: links.signInHref, label: t("comments", "errSignInLink") } };
      // Signing in through the email link is what confirms the address.
      case "email_unverified": return { text: t("comments", "errUnverified"), link: { href: links.signInHref, label: t("comments", "errUnverifiedLink") } };
      case "email_required_for_account": return { text: t("comments", "errEmailRequired"), link: { href: links.signInHref, label: t("comments", "errEmailRequiredLink") } };
      case "customer_not_linked": return { text: t("comments", "errNotLinked"), link: { href: links.profileHref, label: t("comments", "errNotLinkedLink") } };
      case "rate_limited": return { text: t("comments", "errRate") };
      case "comments_closed": return { text: t("comments", "errClosed") };
      case "body_invalid": return { text: t("comments", "errBody") };
      case "comment_locked": return { text: t("comments", "errLocked") };
      case "not_found": return { text: t("comments", "errNotFound") };
      default: return { text: t("comments", "errGeneric"), ref: requestId };
    }
  })();
  return (
    <p role="alert" className={`${alertLight} p-4 text-sm`}>
      {line.text}
      {"ref" in line && line.ref ? ` ${t("comments", "ref", { id: line.ref })}` : ""}
      {"link" in line && line.link && (
        <> <a href={line.link.href} className="text-gold-dark underline underline-offset-4">{line.link.label}</a></>
      )}
    </p>
  );
}

"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { reviewAction } from "@/app/actions/review";
import { reviewSentKey } from "@/components/site/review-done";
import { dict, type Lang } from "@/lib/i18n";
import { alertLight, inputLight, labelLight } from "@/lib/form-classes";
import {
  REVIEW_BODY_LIMIT_BYTES, REVIEW_MAX, REVIEW_MAX_PHOTOS, REVIEW_MIN,
  REVIEW_PHOTO_LONG_SIDE, REVIEW_PHOTO_QUALITY, type ReviewState,
} from "@/lib/reviews";

type Photo = { file: File; url: string };

/**
 * Shrinks one photo to a JPEG no longer than REVIEW_PHOTO_LONG_SIDE on its long
 * side (lib/reviews.ts says why it has to happen here). The browser decodes it,
 * so anything the phone can show can be sent, and the camera's rotation is
 * applied before the pixels are redrawn. null = this browser cannot read it.
 */
async function shrink(file: File): Promise<File | null> {
  let source: ImageBitmap | HTMLImageElement | null = null;
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    source = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }
  if (!source) return null;
  const w = "naturalWidth" in source ? source.naturalWidth : source.width;
  const h = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!w || !h) return null;
  const scale = Math.min(1, REVIEW_PHOTO_LONG_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // JPEG has no transparency: a PNG with a clear background would turn black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", REVIEW_PHOTO_QUALITY));
  if (!blob) return null;
  const base = (file.name || "photo").replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

/**
 * THE REVIEW FORM (/review/[token]), in the contact form's format: the same
 * field and label classes, the same live counter, the same honeypot, the same
 * charcoal Send, every outcome inline and the form REPLACED by the thank-you
 * on success, so a blank form never invites a second review.
 *
 * Stars are five radio buttons, so a keyboard or screen reader chooses a rating
 * the ordinary way (arrow keys), and the gold stars are their labels.
 */
export function ReviewForm({ token, lang }: { token: string; lang: Lang }) {
  const r = dict.reviews;
  const t = (k: keyof typeof r, vars?: Record<string, string>) => {
    let v: string = r[k][lang];
    if (vars) for (const [key, val] of Object.entries(vars)) v = v.replace(`{${key}}`, val);
    return v;
  };

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [length, setLength] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [state, setState] = useState<ReviewState>("idle");
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const id = useId();

  // Previews are object URLs; release them when they leave.
  const urls = useRef<string[]>([]);
  useEffect(() => { urls.current = photos.map((p) => p.url); }, [photos]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  if (state === "success") {
    return (
      <div role="status" className="grid gap-4">
        <h2 className="text-[clamp(22px,2.2vw,28px)] text-charcoal-deep">{t("thanksH")}</h2>
        <p className="text-[17px] leading-relaxed text-charcoal-deep">{t("thanksP")}</p>
        <Link href="/collections" className="inline-flex min-h-11 items-center text-sm font-semibold text-gold-dark underline underline-offset-4">{t("browse")} →</Link>
      </div>
    );
  }

  async function addPhotos(list: FileList | null) {
    if (!list || list.length === 0) return;
    setPhotoError(null);
    const room = REVIEW_MAX_PHOTOS - photos.length;
    const picked = Array.from(list).slice(0, Math.max(0, room));
    if (list.length > room) setPhotoError(t("errPhotoCount", { max: String(REVIEW_MAX_PHOTOS) }));
    if (picked.length === 0) return;
    setPreparing(true);
    const out: Photo[] = [];
    for (const f of picked) {
      const small = await shrink(f);
      if (!small) { setPhotoError(t("errPhotoRead")); continue; }
      out.push({ file: small, url: URL.createObjectURL(small) });
    }
    setPreparing(false);
    setPhotos((cur) => [...cur, ...out].slice(0, REVIEW_MAX_PHOTOS));
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(i: number) {
    setPhotos((cur) => {
      const gone = cur[i];
      if (gone) URL.revokeObjectURL(gone.url);
      return cur.filter((_, n) => n !== i);
    });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating < 1) { setState("invalid_rating"); return; }
    const total = photos.reduce((s, p) => s + p.file.size, 0);
    if (total > REVIEW_BODY_LIMIT_BYTES) { setState("photo_too_large"); return; }
    const fd = new FormData(e.currentTarget);
    fd.set("token", token);
    fd.set("rating", String(rating));
    fd.delete("photos");
    for (const p of photos) fd.append("photos", p.file, p.file.name);
    startTransition(async () => {
      try {
        // Remember, in this browser only, that this link's review is being
        // sent: on success the page re-renders as "already used" before this
        // continues, so the flag has to exist first (review-done.tsx). Removed
        // again if the send did not succeed.
        try { window.sessionStorage.setItem(reviewSentKey(token), "1"); } catch { /* storage blocked */ }
        const result = await reviewAction(fd);
        if (result !== "success") {
          try { window.sessionStorage.removeItem(reviewSentKey(token)); } catch { /* storage blocked */ }
        }
        setState(result);
      } catch {
        try { window.sessionStorage.removeItem(reviewSentKey(token)); } catch { /* storage blocked */ }
        // A request the platform refuses before the action runs (too large, a
        // dropped connection) never reaches the action's own error handling.
        setState("error");
      }
    });
  }

  const message =
    state === "invalid_rating" ? t("errRating")
    : state === "body_too_short" ? t("errShort", { min: String(REVIEW_MIN) })
    : state === "body_too_long" ? t("errLong", { max: String(REVIEW_MAX) })
    : state === "too_many_photos" ? t("errPhotoCount", { max: String(REVIEW_MAX_PHOTOS) })
    : state === "photo_too_large" ? t("errPhotoSize")
    : state === "photo_type" ? t("errPhotoType")
    : state === "expired" ? t("expiredP")
    : state === "already_used" ? t("usedP")
    : state === "not_found" ? t("notFoundP")
    : state === "rate_limited" ? t("errRate")
    : state === "error" ? t("errGeneric")
    : null;

  const busy = pending || preparing;
  const field = `min-h-11 w-full rounded-sm px-3 text-sm ${inputLight} disabled:cursor-not-allowed disabled:opacity-60`;
  const label = `block text-xs font-semibold uppercase tracking-[0.14em] ${labelLight}`;
  const shown = hover || rating;

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {/* Honeypot, as on /contact: out of sight and out of the accessibility tree. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden">
        <label htmlFor={`${id}-company`}>Company</label>
        <input id={`${id}-company`} type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset>
        <legend className={label}>{t("rating")}</legend>
        <div className="mt-1.5 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="relative inline-flex h-11 w-11 cursor-pointer items-center justify-center" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name="rating-choice"
                value={n}
                checked={rating === n}
                onChange={() => { setRating(n); if (state === "invalid_rating") setState("idle"); }}
                disabled={busy}
                className="peer sr-only"
              />
              <span className="sr-only">{n === 1 ? t("ratingOptionOne") : t("ratingOption", { n: String(n) })}</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-8 w-8 rounded-sm peer-focus-visible:ring-2 peer-focus-visible:ring-gold-dark ${n <= shown ? "fill-gold text-gold-dark" : "fill-none text-charcoal/60"}`} stroke="currentColor" strokeWidth="1.5">
                <path strokeLinejoin="round" d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9L12 2.8z" />
              </svg>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${id}-body`} className={label}>{t("body")}</label>
        <textarea
          id={`${id}-body`}
          name="body"
          required
          rows={6}
          minLength={REVIEW_MIN}
          maxLength={REVIEW_MAX}
          disabled={busy}
          onChange={(e) => setLength(e.target.value.trim().length)}
          aria-describedby={`${id}-count`}
          className={`mt-1.5 ${field} py-2`}
        />
        {/* Not a live region: it changes on every keystroke. */}
        <p id={`${id}-count`} className="mt-1 flex justify-between gap-3 text-xs text-charcoal/70">
          <span>{t("bodyHint", { min: String(REVIEW_MIN) })}</span>
          <span>{t("count", { n: String(length), max: String(REVIEW_MAX) })}</span>
        </p>
      </div>

      <div>
        <p className={label} id={`${id}-photos`}>{t("photos", { max: String(REVIEW_MAX_PHOTOS) })}</p>
        <p className="mt-1 text-xs text-charcoal/70">{t("photosHint")}</p>
        {photos.length > 0 && (
          <ul className="mt-3 grid grid-cols-4 gap-2" aria-labelledby={`${id}-photos`}>
            {photos.map((p, i) => (
              <li key={p.url} className="relative aspect-square overflow-hidden border border-hairline bg-chalk">
                {/* A local preview (blob: URL), not a remote image: next/image has nothing to optimise. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  disabled={busy}
                  aria-label={t("removePhoto", { n: String(i + 1) })}
                  className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-deep/85 text-chalk focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" strokeWidth="2" fill="none"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        {photos.length < REVIEW_MAX_PHOTOS && (
          <label className={`mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border border-charcoal/60 bg-white px-4 text-sm font-medium text-charcoal-deep focus-within:ring-2 focus-within:ring-gold-dark ${busy ? "pointer-events-none opacity-60" : "hover:border-charcoal-deep"}`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="1.6" fill="none"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            {preparing ? t("preparing") : t("addPhotos")}
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={busy}
              onChange={(e) => addPhotos(e.target.files)}
              className="sr-only"
            />
          </label>
        )}
        {photoError && <p role="alert" className="mt-2 text-sm text-garnet">{photoError}</p>}
      </div>

      {message && (
        <p role="alert" className={`rounded-sm px-3 py-2 text-sm ${alertLight}`}>{message}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-press min-h-12 w-full rounded-sm bg-charcoal-deep px-6 text-[15px] font-medium text-chalk transition-colors hover:bg-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t("sending") : t("send")}
      </button>
    </form>
  );
}

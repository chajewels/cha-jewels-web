"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

import type { Lang } from "@/lib/i18n";
import type { LumiereStoriesStrings } from "@/lib/content/lumiere-home";
import { isOptimizableImage } from "@/lib/image-hosts";
import { focusWithoutScroll, lockScroll } from "@/lib/scroll-lock";

import type { BeltStory } from "./stories-belt";

/**
 * A STORY, OPEN: the customer's words EXACTLY as the Hub holds them
 * (`white-space: pre-wrap`, never trimmed or re-spaced), with the name, the
 * item, the country, the month, the stars, "Verified buyer" on a review and
 * every approved photo. Or, from "See all stories", the whole list the same
 * way. An accessible dialog: `role="dialog"` + `aria-modal`, portalled to
 * <body> with everything else inert, the page locked through the shared lock
 * (Lenis stops with it), Escape closes, Tab stays inside, focus goes in on
 * open and back to where it came from — without scrolling the page
 * (lib/scroll-lock.ts).
 */
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const StoryBody = ({ s, strings, lang }: { s: BeltStory; strings: LumiereStoriesStrings; lang: Lang }) => (
  <article lang={s.qLang} className="slip-dialog__story">
    {s.rating != null && (
      <p className="slip-dialog__stars" role="img" aria-label={`${s.rating} / 5`}>
        {"★".repeat(s.rating)}
        <span aria-hidden="true">{"★".repeat(5 - s.rating)}</span>
      </p>
    )}
    <blockquote className="slip-dialog__quote font-serif">{s.quote}</blockquote>
    <p className="slip-dialog__who font-manrope">
      <strong>{s.name}</strong>
      {s.verified && <span> · {strings.verified}</span>}
      {s.item && <span> · {s.item}</span>}
      {s.location && <span> · {s.location}</span>}
      {s.dateLabel && (
        <span>
          {" · "}
          <time dateTime={s.dateIso ?? undefined}>{s.dateLabel}</time>
        </span>
      )}
    </p>
    {s.photos.length > 0 && (
      <ul className="slip-dialog__photos">
        {s.photos.map((p) => (
          <li key={p.src}>
            <Image src={p.src} alt={p.alt} width={480} height={600} sizes="(max-width: 640px) 80vw, 240px" unoptimized={!isOptimizableImage(p.src)} />
          </li>
        ))}
      </ul>
    )}
  </article>
);

export interface StoryDialogProps {
  view: { mode: "story"; index: number } | { mode: "all" } | null;
  stories: BeltStory[];
  strings: LumiereStoriesStrings;
  lang: Lang;
  onClose: () => void;
  onOpen: (index: number) => void;
  onAll: () => void;
  returnTo: RefObject<HTMLElement | null>;
}

export const StoryDialog = ({ view, stories, strings, lang, onClose, onOpen, onAll, returnTo }: StoryDialogProps) => {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const open = view !== null;

  useEffect(() => {
    if (!open) return;
    const el = document.createElement("div");
    document.body.appendChild(el);
    setHost(el);
    const release = lockScroll();
    const outside = Array.from(document.body.children).filter((c) => c !== el);
    const hadInert = outside.map((c) => c.hasAttribute("inert"));
    outside.forEach((c) => c.setAttribute("inert", ""));
    const trigger = returnTo.current;
    return () => {
      outside.forEach((c, i) => {
        if (!hadInert[i]) c.removeAttribute("inert");
      });
      release();
      el.remove();
      setHost(null);
      focusWithoutScroll(trigger);
    };
  }, [open, returnTo]);

  useEffect(() => {
    if (!host) return;
    const id = requestAnimationFrame(() => focusWithoutScroll(panel.current?.querySelector<HTMLElement>("[data-first]") ?? panel.current));
    return () => cancelAnimationFrame(id);
  }, [host, view]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight" && view?.mode === "story") onOpen((view.index + 1) % stories.length);
      if (e.key === "ArrowLeft" && view?.mode === "story") onOpen((view.index - 1 + stories.length) % stories.length);
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panel.current.contains(active))) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && (active === last || !panel.current.contains(active))) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, view, stories.length, onClose, onOpen]);

  if (!host || !view) return null;
  const title = view.mode === "all" ? strings.allTitle : strings.heading;

  return createPortal(
    <div className="slip-dialog" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} data-lenis-prevent className="slip-dialog__panel">
        <div className="slip-dialog__bar">
          <p className="slip-dialog__title font-manrope">{view.mode === "story" ? `${view.index + 1} / ${stories.length}` : title}</p>
          <button type="button" data-first onClick={onClose} aria-label={strings.close} className="lm-chrome__icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
          </button>
        </div>
        {view.mode === "story" ? (
          <>
            <StoryBody s={stories[view.index]} strings={strings} lang={lang} />
            <div className="slip-dialog__nav">
              <button type="button" className="lm-pill lm-pill--outline" onClick={() => onOpen((view.index - 1 + stories.length) % stories.length)}>← {strings.previous}</button>
              <button type="button" className="lm-pill lm-pill--outline" onClick={onAll}>{strings.seeAll}</button>
              <button type="button" className="lm-pill lm-pill--outline" onClick={() => onOpen((view.index + 1) % stories.length)}>{strings.next} →</button>
            </div>
          </>
        ) : (
          <ol className="slip-dialog__list">
            {stories.map((s, i) => (
              <li key={s.id}>
                <StoryBody s={s} strings={strings} lang={lang} />
                <button type="button" className="slip-dialog__link font-manrope" onClick={() => onOpen(i)}>{strings.open}</button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>,
    host,
  );
};

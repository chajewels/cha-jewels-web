"use client";

import Link from "next/link";
import { localePath } from "@/lib/locale";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LayawayCalculator } from "@/components/commerce/layaway-calculator";
import { HubImage } from "@/components/media/hub-image";
import { Eyebrow } from "@/components/site/support-stage";
import { StageBand } from "@/components/site/stage-band";
import { tr, type Lang } from "@/lib/i18n";
import { filterPieces, type PickerPiece } from "@/lib/layaway-picker";
import { formatMoney } from "@/lib/utils";

/**
 * /layaway CHOSEN PIECE + PICKER (owner decisions 2026-10-18).
 *
 * The server page renders this with its default piece already chosen, so the
 * first paint is the same as before. "Choose another piece" opens a dialog
 * listing the page's own reservable pool (photo, name, price — no down
 * payment, owner decision); choosing a row swaps the panel, the CTA and the
 * calculator in place.
 *
 * The calculator is KEYED ON THE SLUG. Its price lives in its own state,
 * seeded once from `initialPrice`, so a new prop alone would not re-quote; a
 * new key mounts a fresh calculator that asks the Hub for a quote on the new
 * price. No quote is ever carried from one piece to another, and the
 * calculator's money logic is untouched.
 *
 * The choice is mirrored in the URL (?piece=<slug>, replaceState, no
 * navigation) so a shared link opens on the same piece; the server falls back
 * to the default piece when the slug is not in the pool.
 */
export function LayawayPiecePicker({ lang, pieces, initialSlug }: { lang: Lang; pieces: PickerPiece[]; initialSlug: string }) {
  const t = tr(lang);
  const [slug, setSlug] = useState(initialSlug);
  const [open, setOpen] = useState(false);
  const piece = pieces.find((p) => p.slug === slug) ?? pieces[0];

  function choose(next: string) {
    setOpen(false);
    if (next === slug) return;
    setSlug(next);
    const url = new URL(window.location.href);
    url.searchParams.set("piece", next);
    window.history.replaceState(window.history.state, "", url);
  }

  const href = localePath(`/products/${piece.slug}`, lang);
  return (
    <div className="grid border border-hairline bg-white lg:grid-cols-[1fr_1.1fr]">
      <StageBand as="div" className="flex flex-col">
        <div className="flex h-full flex-col gap-2.5 p-[26px]">
          <Eyebrow dark>{t("layawayPage", "chosenPiece")}</Eyebrow>
          <Link href={href} className="relative block h-[300px] lg:h-[380px]" aria-label={piece.name}>
            {piece.image && (
              piece.image.kind === "cut" ? (
                <span className="absolute inset-x-0 bottom-3 top-2 block [filter:drop-shadow(0_18px_18px_rgb(0_0_0/.55))]">
                  <HubImage src={piece.image.src} alt="" fill sizes="(min-width:1024px) 520px, 90vw" className="object-contain object-bottom" />
                </span>
              ) : (
                // The framed photo fills its square: no inner padding, so a
                // portrait photo with its own background is no longer tiny.
                // object-contain keeps every piece whole; max-w-full keeps the
                // square inside the panel at 375px.
                <span className="absolute bottom-3 left-1/2 top-2 block aspect-square max-w-full -translate-x-1/2 border border-gold/45 bg-[#121110] shadow-[0_18px_30px_rgb(0_0_0/.5)]">
                  <span className="relative block h-full"><HubImage src={piece.image.src} alt="" fill sizes="(min-width:1024px) 370px, 85vw" className="object-contain" /></span>
                </span>
              )
            )}
          </Link>
          <p className="text-[13.5px] leading-normal text-chalk/85">{piece.name}</p>
          <p className="lining-nums font-display text-[28px] leading-tight text-gold-pale">{formatMoney(piece.price_jpy)}</p>
          <PickerButton lang={lang} pieces={pieces} chosen={piece.slug} open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)} onChoose={choose} />
        </div>
      </StageBand>
      <LayawayCalculator
        key={piece.slug}
        lang={lang}
        fixedPiece
        initialPrice={piece.price_jpy}
        cta={{ label: t("layawayPage", "reserveThis"), href }}
        className="gap-5 rounded-none border-0 p-6 shadow-none sm:p-7"
      />
    </div>
  );
}

/**
 * The button and its dialog. Same mechanics as the search sheet
 * (components/site/search-box.tsx): its own container in <body>, everything
 * else inert, the page locked, focus into the search on open and back to the
 * button on close; Escape and the backdrop close it.
 */
function PickerButton({ lang, pieces, chosen, open, onOpen, onClose, onChoose }: {
  lang: Lang;
  pieces: PickerPiece[];
  chosen: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onChoose: (slug: string) => void;
}) {
  const t = tr(lang);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [q, setQ] = useState("");
  const titleId = useId();
  const searchId = useId();
  const shown = useMemo(() => filterPieces(pieces, q), [pieces, q]);

  useEffect(() => {
    if (!open) return;
    const el = document.createElement("div");
    document.body.appendChild(el);
    setHost(el);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const outside = Array.from(document.body.children).filter((c) => c !== el);
    const hadInert = outside.map((c) => c.hasAttribute("inert"));
    outside.forEach((c) => c.setAttribute("inert", ""));
    const trigger = triggerRef.current;
    return () => {
      outside.forEach((c, i) => { if (!hadInert[i]) c.removeAttribute("inert"); });
      document.body.style.overflow = previous;
      el.remove();
      setHost(null);
      setQ("");
      trigger?.focus();
    };
  }, [open]);
  useEffect(() => { if (host) searchRef.current?.focus(); }, [host]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        onClick={onOpen}
        className="inline-flex min-h-11 items-center self-start text-sm text-gold-pale underline decoration-gold-pale/50 underline-offset-4 hover:decoration-gold-pale"
      >
        {t("layawayPage", "choosePiece")}
      </button>
      {host && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal-deep/70 sm:items-center sm:p-6"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="drawer-in flex max-h-[88vh] w-full flex-col bg-chalk text-charcoal-deep shadow-[0_24px_48px_rgba(35,29,18,0.28)] sm:max-h-[80vh] sm:max-w-lg">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-4 py-3">
              <h2 id={titleId} className="font-display text-[22px] leading-tight">{t("layawayPage", "pickerTitle")}</h2>
              <button type="button" aria-label={t("layawayPage", "pickerClose")} onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-charcoal/60 text-charcoal-deep hover:border-gold-dark hover:text-gold-dark">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="shrink-0 px-4 py-3">
              <label htmlFor={searchId} className="sr-only">{t("layawayPage", "pickerSearch")}</label>
              <input
                ref={searchRef}
                id={searchId}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("layawayPage", "pickerSearch")}
                autoComplete="off"
                className="min-h-11 w-full rounded-sm border border-charcoal/60 bg-white px-3 text-base text-charcoal-deep placeholder:text-charcoal/70 focus-visible:border-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-dark"
              />
            </div>
            {/* Always mounted, so the empty message is announced when it appears. */}
            <div aria-live="polite">{shown.length === 0 && <p className="px-4 pb-6 pt-2 text-sm text-charcoal">{t("layawayPage", "pickerNone")}</p>}</div>
            {shown.length > 0 && (
              <ul className="min-h-0 flex-1 overflow-y-auto border-t border-hairline pb-2">
                {shown.map((p) => (
                  <li key={p.slug} className="border-b border-hairline last:border-b-0">
                    <button
                      type="button"
                      aria-current={p.slug === chosen ? "true" : undefined}
                      onClick={() => onChoose(p.slug)}
                      className={`flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left hover:bg-white focus-visible:bg-white ${p.slug === chosen ? "bg-white" : ""}`}
                    >
                      <span className="relative block h-14 w-14 shrink-0 overflow-hidden border border-hairline bg-white">
                        {p.image && <HubImage src={p.image.src} alt="" fill sizes="56px" className="object-contain" />}
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-snug text-charcoal-deep">{p.name}</span>
                      <span className="lining-nums shrink-0 text-sm font-semibold text-gold-dark">{formatMoney(p.price_jpy)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>,
        host,
      )}
    </>
  );
}

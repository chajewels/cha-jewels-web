"use client";

import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { animated, useSpring } from "@react-spring/web";

import { localePath } from "@/lib/locale";
import { type Lang } from "@/lib/i18n-core";
import { trOf } from "@/lib/i18n-client";
import { product as productDict } from "@/lib/i18n/sections/product";
import { search as searchDict } from "@/lib/i18n/sections/search";
import { SalePrice } from "@/components/commerce/sale-price";
import { markSearchFromBox } from "@/lib/search-origin";
import { HubImage } from "@/components/media/hub-image";
import { focusWithoutScroll, lockScroll } from "@/lib/scroll-lock";
import { useReduced } from "@/components/fx/media";

type Suggestion = { slug: string; sku: string; name: string; price: number | null; full?: number | null; on_sale?: boolean; image: string | null; cutout: string | null; sold: boolean };
type CollectionHit = { slug: string; name: string };

const DEBOUNCE_MS = 200;
const MAX_RESULTS = 8;
/** How long the panel takes to travel back up before it is parked (no tab stops, no clicks). */
const PARK_MS = 600;

export interface SearchOverlayProps {
  lang: Lang;
  open: boolean;
  onClose: () => void;
  /** The control focus returns to on close (the header's magnifier). */
  returnTo?: RefObject<HTMLElement | null>;
}

/**
 * FULL-SCREEN SEARCH — the Halden search overlay (docs/design-refs/halden/
 * search-overlay.tsx: one oversized line to type on and the results as plates
 * under it, dropped over the whole page on a spring) on THIS SITE'S search
 * logic (components/site/search-box.tsx: `/api/search`, the debounced lookup
 * that cancels its predecessor, the combobox with Up/Down/Enter/Escape,
 * Enter and "See all" landing on `/search` — the single emitter of the
 * `search` event, `markSearchFromBox`). Nothing here is authoritative about
 * price or stock: the figures are the cached catalogue's and the product page
 * re-reads the Hub.
 *
 * A dialog: portalled to <body> (the sticky header's backdrop filter would be
 * its containing block), everything else `inert` while it is up, the page
 * locked through the shared lock, focus into the line on open and back to the
 * magnifier on close — without scrolling (lib/scroll-lock.ts). Reduced motion
 * shows it at once.
 */
export const SearchOverlay = ({ lang, open, onClose, returnTo }: SearchOverlayProps) => {
  const t = trOf({ product: productDict, search: searchDict }, lang);
  const router = useRouter();
  const reduced = useReduced();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [parked, setParked] = useState(!open);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [collections, setCollections] = useState<CollectionHit[]>([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState<"idle" | "pending" | "ready" | "error">("idle");
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

  // The drop: a spring with weight (Halden's), or at rest under reduced motion.
  const style = useSpring({
    y: open ? 0 : -100,
    immediate: reduced === true,
    config: { mass: 1.2, tension: 190, friction: 30 },
  });

  // Unpark before the focus effect runs; park again once the panel has left.
  useEffect(() => {
    if (open) {
      setParked(false);
      return;
    }
    const timer = window.setTimeout(() => setParked(true), PARK_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  // The portal host exists while the panel is on screen or on its way out.
  useEffect(() => {
    if (parked) return;
    const el = document.createElement("div");
    document.body.appendChild(el);
    setHost(el);
    return () => {
      el.remove();
      setHost(null);
    };
  }, [parked]);

  // While open: the page locked, everything else inert, focus in; on close
  // the lock released, focus back to the magnifier — neither moving the page.
  useEffect(() => {
    if (!open || !host) return;
    const releaseScroll = lockScroll();
    const outside = Array.from(document.body.children).filter((c) => c !== host);
    const hadInert = outside.map((c) => c.hasAttribute("inert"));
    outside.forEach((c) => c.setAttribute("inert", ""));
    const trigger = returnTo?.current ?? null;
    const id = requestAnimationFrame(() => focusWithoutScroll(input.current));
    return () => {
      cancelAnimationFrame(id);
      outside.forEach((c, i) => { if (!hadInert[i]) c.removeAttribute("inert"); });
      releaseScroll();
      focusWithoutScroll(trigger);
      // Reopening starts clean, not on the last dead end.
      setQ("");
    };
  }, [open, host, returnTo]);

  // Escape closes; Tab stays inside.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (current === first || !panel.current.contains(current))) { e.preventDefault(); last.focus({ preventScroll: true }); }
      else if (!e.shiftKey && (current === last || !panel.current.contains(current))) { e.preventDefault(); first.focus({ preventScroll: true }); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Debounced lookup. Each run cancels the last timer and aborts its request,
  // so an older, slower answer can never overwrite a newer one.
  useEffect(() => {
    const term = q.trim();
    if (term === "") { setItems([]); setCollections([]); setTotal(0); setActive(-1); setStatus("idle"); return; }
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("pending");
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&lang=${lang}`, { signal: ctl.signal });
        if (!res.ok) { setItems([]); setCollections([]); setTotal(0); setStatus("error"); return; }
        const data = (await res.json()) as { products: Suggestion[]; total: number; collections?: CollectionHit[] };
        setItems(data.products.slice(0, MAX_RESULTS));
        setCollections(data.collections ?? []);
        setTotal(data.total);
        setStatus("ready");
        setActive(-1);
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") return;
        setItems([]); setCollections([]); setTotal(0); setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [q, lang]);

  const go = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  /** Enter on the raw text, or "See all n results": both land on /search, the single emitter of the `search` event. */
  const submit = () => {
    const term = q.trim();
    if (term === "") return;
    markSearchFromBox(term);
    go(`/search?q=${encodeURIComponent(term)}`);
  };

  const rowCount = items.length + (total > items.length ? 1 : 0);
  const hasListbox = status === "ready" && items.length > 0;
  const liveMessage =
    status === "pending" ? t("search", "searching")
    : status === "error" ? t("search", "failed")
    : status === "ready" ? (items.length > 0 ? (total === 1 ? t("search", "countOne") : t("search", "count", { n: String(total) })) : t("search", "noneShort"))
    : "";

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && active < items.length) go(localePath(`/products/${items[active].slug}`, lang));
      else submit();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (rowCount === 0) return;
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => { const next = i + step; if (next < 0) return rowCount - 1; if (next >= rowCount) return 0; return next; });
    }
  };

  if (parked || !host) return null;

  return createPortal(
    <animated.div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={t("search", "placeholder")}
      aria-hidden={!open}
      className="lm-search fixed inset-0 z-[80] flex flex-col bg-surface text-content"
      style={{ transform: style.y.to((v) => `translateY(${v}%)`), pointerEvents: open ? "auto" : "none" }}
    >
      <div className="lm-search__top flex shrink-0 items-center justify-between font-manrope text-nav font-medium uppercase">
        <span className="font-serif text-wordmark normal-case">Cha Jewels</span>
        <button type="button" onClick={onClose} aria-label={t("search", "close")} className="lm-chrome__icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
        </button>
      </div>

      <form role="search" onSubmit={(e) => { e.preventDefault(); submit(); }} className="lm-search__form shrink-0">
        <label className="sr-only" htmlFor={`${listId}-input`}>{t("search", "placeholder")}</label>
        <input
          ref={input}
          id={`${listId}-input`}
          type="search"
          role="combobox"
          autoComplete="off"
          aria-expanded={status !== "idle"}
          aria-controls={hasListbox ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={hasListbox && active >= 0 ? optionId(active) : undefined}
          placeholder={t("search", "placeholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          className="lm-search__input font-serif"
        />
      </form>

      <p role="status" aria-live="polite" className="lm-search__status font-manrope">{liveMessage || t("search", "hint")}</p>

      <div data-lenis-prevent className="lm-search__results min-h-0 flex-1 overflow-y-auto">
        {status === "error" && <p className="font-tight text-body">{t("search", "failed")}</p>}
        {status === "ready" && items.length === 0 && collections.length === 0 && (
          <div>
            <p className="font-tight text-body">{t("search", "noneShort")}</p>
            <Link href={localePath("/collections", lang)} onClick={(e) => { e.preventDefault(); go(localePath("/collections", lang)); }} className="lm-pill lm-pill--outline mt-4">
              {t("search", "browseAll")}
            </Link>
          </div>
        )}
        {hasListbox && (
          <>
            <p className="lm-search__eyebrow font-manrope">{t("search", "pieces")} · <span className="[font-variant-numeric:lining-nums_tabular-nums]">{total}</span></p>
            <ul id={listId} role="listbox" aria-label={t("search", "placeholder")} className="lm-search__grid">
              {items.map((s, i) => (
                <li
                  key={s.slug}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); go(localePath(`/products/${s.slug}`, lang)); }}
                  className={`lm-search__plate${i === active ? " -active" : ""}`}
                >
                  <span className="lm-search__photo">
                    {(s.cutout ?? s.image) && <HubImage src={(s.cutout ?? s.image)!} alt="" width={320} height={400} className={`h-full w-full object-contain ${s.cutout ? "p-3" : ""}`} />}
                  </span>
                  <span className="lm-search__name font-serif">
                    {s.name}
                    {s.sold && <span className="lm-search__sold font-manrope">{t("product", "sold")}</span>}
                  </span>
                  {s.price != null && (
                    <span className={`lm-search__price font-manrope ${s.sold ? "opacity-60" : ""}`}>
                      <SalePrice price={s.price} full={s.full} onSale={s.on_sale} sold={s.sold} lang={lang} tone="light" size="sm" />
                    </span>
                  )}
                </li>
              ))}
              {total > items.length && (
                <li id={optionId(items.length)} role="option" aria-selected={active === items.length} onMouseEnter={() => setActive(items.length)} onMouseDown={(e) => { e.preventDefault(); submit(); }} className="sr-only">
                  {t("search", "seeAll", { n: String(total) })}
                </li>
              )}
            </ul>
          </>
        )}
        {status === "ready" && collections.length > 0 && (
          <div className="lm-search__collections">
            <p className="lm-search__eyebrow font-manrope">{t("search", "collections")}</p>
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => (
                <Link key={c.slug} href={localePath(`/collections/${c.slug}`, lang)} onClick={(e) => { e.preventDefault(); go(localePath(`/collections/${c.slug}`, lang)); }} className="lm-pill lm-pill--outline">
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        {status === "ready" && total > 0 && (
          <div className="lm-search__all">
            <button type="button" onClick={submit} className={`lm-pill${active === items.length ? " -active" : ""}`}>
              {t("search", "seeAll", { n: String(total) })} <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </animated.div>,
    host,
  );
};

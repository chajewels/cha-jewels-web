"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tr, type Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";
import { markSearchFromBox } from "@/lib/search-origin";
import { HubImage } from "@/components/media/hub-image";

type Suggestion = { slug: string; sku: string; name: string; price: number | null; image: string | null; cutout: string | null; sold: boolean };
type CollectionHit = { slug: string; name: string };

const DEBOUNCE_MS = 200;
const MAX_SUGGESTIONS = 6;

/**
 * Header search with instant suggestions (site frame, 2026-09-27).
 *
 * THREE SHAPES, one component:
 *
 *   header, from `lg`   a field in the header row with a `/` shortcut hint.
 *                       Suggestions open in a wide panel under the header,
 *                       right-aligned to the field.
 *   header, below `lg`  a magnifier. It opens a FULL-SCREEN SHEET (a dialog,
 *                       portalled to <body>, the page behind made inert),
 *                       with the field and a close button on top and the
 *                       suggestions below.
 *   drawer              the field inside the phone drawer, suggestions in
 *                       flow beneath it; `onNavigate` closes the drawer.
 *
 * `/` anywhere outside a text field focuses the search (from `lg`) or opens
 * the sheet (below it).
 *
 * THE PANEL. Pieces first — the cut-out, or the whole photo contained and
 * never cropped; the Hub's exact name with the typed text marked in gold-dark;
 * the yen price; "Sold" (product.sold) on a sold piece — then matching collections
 * as chips, then "See all n results" and the keyboard hint.
 *
 * It is a combobox: `role="combobox"` on the input with `aria-expanded` and
 * `aria-controls`, `role="listbox"` on the pieces, `role="option"` with
 * `aria-selected`, the active row named by `aria-activedescendant`. Up/Down
 * move, Enter opens the highlighted row or submits the raw query, Escape
 * closes. The collection chips are ordinary links.
 *
 * Suggestions are advisory: nothing here is authoritative about price or stock.
 * The figures come from the same cached catalog the cards read, and the product
 * page re-reads the Hub.
 */
export function SearchBox({ lang, variant = "header", onNavigate }: { lang: Lang; variant?: "header" | "drawer"; onNavigate?: () => void }) {
  const t = tr(lang);
  const router = useRouter();
  const inDrawer = variant === "drawer";

  const [sheet, setSheet] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [collections, setCollections] = useState<CollectionHit[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  /** What the panel is showing — not the same question as how many rows there are. */
  const [status, setStatus] = useState<"idle" | "pending" | "ready" | "error">("idle");

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const close = useCallback(() => { setOpen(false); setActive(-1); }, []);

  const go = useCallback((href: string) => {
    close();
    setSheet(false);
    inputRef.current?.blur();
    onNavigate?.();
    router.push(href);
  }, [close, onNavigate, router]);

  // Debounced lookup. Each run cancels the last timer and aborts its request,
  // so an older, slower answer can never overwrite a newer one.
  useEffect(() => {
    const term = q.trim();
    if (term === "") { setItems([]); setCollections([]); setTotal(0); setOpen(false); setActive(-1); setStatus("idle"); return; }

    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("pending");
      setOpen(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&lang=${lang}`, { signal: ctl.signal });
        if (!res.ok) { setItems([]); setCollections([]); setTotal(0); setStatus("error"); setOpen(true); return; }
        const data = (await res.json()) as { products: Suggestion[]; total: number; collections?: CollectionHit[] };
        setItems(data.products.slice(0, MAX_SUGGESTIONS));
        setCollections(data.collections ?? []);
        setTotal(data.total);
        setStatus("ready");
        setOpen(true);
        setActive(-1);
      } catch (e) {
        // An abort means a newer keystroke replaced this request: not a failure.
        if ((e as { name?: string })?.name === "AbortError") return;
        setItems([]); setCollections([]); setTotal(0); setStatus("error"); setOpen(true);
      }
    }, DEBOUNCE_MS);

    return () => { clearTimeout(timer); ctl.abort(); };
  }, [q, lang]);

  // A click anywhere else dismisses the desktop panel.
  useEffect(() => {
    if (!open || sheet || inDrawer) return;
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, sheet, inDrawer, close]);

  // `/` focuses the search, unless the reader is already typing somewhere.
  useEffect(() => {
    if (inDrawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault();
      if (window.matchMedia("(min-width: 1024px)").matches) inputRef.current?.focus();
      else setSheet(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [inDrawer]);

  // THE PHONE SHEET is a dialog: its own container in <body>, everything else
  // inert, the page locked, focus in on open and back to the magnifier after.
  useEffect(() => {
    if (!sheet) return;
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
      trigger?.focus();
    };
  }, [sheet]);
  useEffect(() => { if (host) sheetInputRef.current?.focus(); }, [host]);

  /** Enter on the raw text, or "See all n results": both land on /search, the single emitter of the `search` event. */
  function submit() {
    const term = q.trim();
    if (term === "") return;
    markSearchFromBox(term);
    go(`/search?q=${encodeURIComponent(term)}`);
  }

  const rowCount = items.length + (total > items.length ? 1 : 0);
  const hasListbox = open && status === "ready" && items.length > 0;
  const liveMessage =
    status === "pending" ? t("search", "searching")
    : status === "error" ? t("search", "failed")
    : status === "ready" ? (items.length > 0 ? (total === 1 ? t("search", "countOne") : t("search", "count", { n: String(total) })) : t("search", "noneShort"))
    : "";

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (open) close();
      else if (sheet) setSheet(false);
      else inputRef.current?.blur();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && active >= 0 && active < items.length) go(`/products/${items[active].slug}`);
      else submit();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!open || rowCount === 0) return;
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => {
        const next = i + step;
        if (next < 0) return rowCount - 1;
        if (next >= rowCount) return 0;
        return next;
      });
    }
  }

  const field = (ref: React.RefObject<HTMLInputElement | null>, big: boolean) => (
    <div className={`group flex items-center gap-2.5 rounded-sm border bg-white px-3 text-charcoal-deep focus-within:border-gold-dark focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold-dark ${big ? "min-h-12 border-charcoal/60" : "min-h-11 border-charcoal/60"}`}>
      <span aria-hidden="true" className="shrink-0 text-charcoal/70"><MagnifierIcon /></span>
      <input
        ref={ref}
        type="search"
        role="combobox"
        aria-expanded={open && status !== "idle"}
        aria-controls={hasListbox ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={hasListbox && active >= 0 ? optionId(active) : undefined}
        aria-label={t("search", "placeholder")}
        placeholder={t("search", "placeholder")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => { if (items.length > 0 || status === "ready") setOpen(true); }}
        // The ring is on the field's box (focus-within above); the bare input
        // draws none of its own inside it.
        className={`min-w-0 flex-1 bg-transparent text-charcoal-deep outline-none placeholder:text-charcoal/70 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden ${big ? "min-h-11 text-base" : "min-h-10 text-sm"}`}
      />
      {!big && !inDrawer && q === "" && (
        <kbd aria-hidden="true" className="hidden shrink-0 rounded-sm border border-charcoal/60 px-1.5 font-sans text-[11px] leading-5 text-charcoal/75 group-focus-within:hidden lg:inline">/</kbd>
      )}
    </div>
  );

  const results = (layout: "panel" | "sheet" | "flow") => (
    <div className={layout === "panel" ? "max-h-[70vh] overflow-y-auto" : ""}>
      {status === "pending" && <p className="px-5 py-4 text-sm text-charcoal/75">{t("search", "searching")}</p>}
      {status === "error" && <p className="px-5 py-4 text-sm text-charcoal-deep">{t("search", "failed")}</p>}
      {status === "ready" && items.length === 0 && collections.length === 0 && (
        <div className={layout === "panel" ? "px-5 py-4" : "py-4"}>
          <p className="text-sm text-charcoal-deep">{t("search", "noneShort")}</p>
          <Link href="/collections" onMouseDown={(e) => { e.preventDefault(); go("/collections"); }} onClick={(e) => { e.preventDefault(); go("/collections"); }} className="mt-1 inline-flex min-h-11 items-center text-sm text-gold-dark underline underline-offset-4">
            {t("search", "browseAll")}
          </Link>
        </div>
      )}
      {status === "ready" && items.length > 0 && (
        <div className={layout === "panel" ? "px-5 pt-4" : "pt-4"}>
          <p className={eyebrow(lang)}>{t("search", "pieces")} · <span className="[font-variant-numeric:lining-nums_tabular-nums]">{total}</span></p>
          <ul id={listId} role="listbox" aria-label={t("search", "placeholder")} className="mt-2">
            {items.map((s, i) => (
              <li
                key={s.slug}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); go(`/products/${s.slug}`); }}
                className={`flex cursor-pointer items-center gap-4 border-l-2 px-3 py-2.5 ${layout === "panel" ? "" : "border-b border-b-hairline"} ${i === active ? "border-l-gold-dark bg-chalk" : "border-l-transparent"}`}
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-sm bg-white">
                  {(s.cutout ?? s.image) && <HubImage src={(s.cutout ?? s.image)!} alt="" width={56} height={56} className={`h-full w-full object-contain ${s.cutout ? "p-1" : ""}`} />}
                </span>
                <span className="min-w-0 flex-1 text-sm leading-snug text-charcoal-deep">
                  {highlight(s.name, q)}
                  {s.sold && <span className="ml-2 inline-block whitespace-nowrap border border-hairline bg-chalk px-1.5 text-[11px] font-semibold text-charcoal/75">{t("product", "sold")}</span>}
                </span>
                {s.price != null && <span className={`shrink-0 text-sm [font-variant-numeric:lining-nums_tabular-nums] ${s.sold ? "text-charcoal/75" : "text-charcoal-deep"}`}>{formatMoney(s.price)}</span>}
              </li>
            ))}
            {total > items.length && (
              <li
                id={optionId(items.length)}
                role="option"
                aria-selected={active === items.length}
                onMouseEnter={() => setActive(items.length)}
                onMouseDown={(e) => { e.preventDefault(); submit(); }}
                className="sr-only"
              >
                {t("search", "seeAll", { n: String(total) })}
              </li>
            )}
          </ul>
        </div>
      )}
      {status === "ready" && collections.length > 0 && (
        <div className={`${layout === "panel" ? "mx-0 mt-4 border-t border-hairline px-5 pt-4" : "mt-6"}`}>
          <p className={eyebrow(lang)}>{t("search", "collections")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {collections.map((c) => (
              <Link key={c.slug} href={`/collections/${c.slug}`} onClick={(e) => { e.preventDefault(); go(`/collections/${c.slug}`); }} className="inline-flex min-h-11 items-center rounded-sm border border-charcoal/60 bg-white px-4 text-sm text-charcoal-deep hover:border-gold-dark hover:text-gold-dark">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {status === "ready" && total > 0 && (
        layout === "panel" ? (
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-hairline px-5 py-3">
            <span className="text-xs text-charcoal/75">{t("search", "hint")}</span>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); submit(); }} onClick={submit} className={`inline-flex min-h-11 items-center border-b text-sm font-medium text-gold-dark ${active === items.length ? "border-gold-dark" : "border-gold-dark/50"}`}>
              {t("search", "seeAll", { n: String(total) })}
            </button>
          </div>
        ) : (
          <button type="button" onClick={submit} className="mt-6 flex min-h-12 w-full items-center justify-center rounded-sm border border-charcoal/60 text-[15px] font-medium text-charcoal-deep hover:border-gold-dark hover:text-gold-dark">
            {t("search", "seeAll", { n: String(total) })}
          </button>
        )
      )}
    </div>
  );

  const live = <p role="status" aria-live="polite" className="sr-only">{liveMessage}</p>;

  if (inDrawer) {
    return (
      <div ref={rootRef} className="w-full">
        {field(inputRef, true)}
        {live}
        {open && status !== "idle" && results("flow")}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="flex items-center lg:relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("search", "open")}
        aria-haspopup="dialog"
        onClick={() => setSheet(true)}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-charcoal-deep hover:text-gold-dark lg:hidden"
      >
        <MagnifierIcon big />
      </button>

      {/* One width per breakpoint: focus changes the border colour, never the
          width, so the nav beside it never shifts under the pointer. */}
      <div className="hidden lg:block lg:w-52 xl:w-[216px] 2xl:w-[240px]">
        {!sheet && field(inputRef, false)}
        {!sheet && live}
        {!sheet && open && status !== "idle" && (
          <div className="absolute right-0 top-[calc(100%+14px)] z-50 w-[min(40rem,calc(100vw-2rem))] border border-hairline bg-white shadow-[0_24px_48px_rgba(35,29,18,0.14)] menu-in">
            {results("panel")}
          </div>
        )}
      </div>

      {host && createPortal(
        <div role="dialog" aria-modal="true" aria-label={t("search", "placeholder")} className="drawer-in fixed inset-0 z-50 flex flex-col bg-chalk text-charcoal-deep">
          <div className="wrap flex w-full shrink-0 items-center gap-3 border-b border-hairline py-3">
            <div className="min-w-0 flex-1">{field(sheetInputRef, true)}</div>
            <button type="button" aria-label={t("search", "close")} onClick={() => { close(); setSheet(false); }} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-charcoal/60 text-charcoal-deep hover:border-gold-dark hover:text-gold-dark">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
            </button>
          </div>
          {live}
          <div className="wrap min-h-0 w-full flex-1 overflow-y-auto pb-10">
            {open && status !== "idle" && results("sheet")}
          </div>
        </div>,
        host,
      )}
    </div>
  );
}

function eyebrow(lang: Lang) {
  return `text-[11px] font-semibold text-gold-dark ${lang === "en" ? "uppercase tracking-[0.14em]" : "tracking-[0.05em]"}`;
}

/** The Hub's exact name, with the first occurrence of what was typed marked in gold-dark. Nothing is rewritten. */
function highlight(name: string, q: string) {
  const term = q.trim();
  const i = term ? name.toLowerCase().indexOf(term.toLowerCase()) : -1;
  if (i < 0) return name;
  return (
    <>
      {name.slice(0, i)}
      <mark className="bg-transparent font-semibold text-gold-dark">{name.slice(i, i + term.length)}</mark>
      {name.slice(i + term.length)}
    </>
  );
}

function MagnifierIcon({ big = false }: { big?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={big ? "h-5 w-5" : "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" strokeLinecap="round" />
    </svg>
  );
}

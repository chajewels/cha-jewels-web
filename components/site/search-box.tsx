"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { tr, type Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";
import { markSearchFromBox } from "@/lib/search-origin";

type Suggestion = { slug: string; sku: string; name: string; price: number | null; image: string | null };

const DEBOUNCE_MS = 200;
const MAX_SUGGESTIONS = 6;

/**
 * Header search with instant suggestions.
 *
 * Shape: from `lg` up the input is always visible, like the rest of the header
 * controls. Below `lg` a magnifier button expands it over the row, which has no
 * space for a permanent field. Below `sm` the magnifier is one of the four
 * controls the row keeps (badge + wordmark, magnifier, cart, menu); the
 * language toggle is the one that moves into the drawer at that width. In the
 * drawer (`variant="drawer"`) the box is always expanded — the drawer has the
 * room and a collapsed magnifier inside an open menu is a riddle.
 *
 * The expanded field is positioned against the HEADER, not against this
 * component. Anchoring it to the component (`absolute right-0`) pinned it to
 * whatever x the control happens to sit at once the language toggle, cart and
 * menu trigger are laid out — at 375px that put its left edge 30px off-screen.
 * The header's `backdrop-blur` makes the header itself the containing block for
 * a fixed child (the same property mobile-nav.tsx documents), so `fixed` with
 * the wrap's own gutters lands it inside the header row at any width and in
 * any signed-in state. `top-[14px]` centres a 40px control in the 68px row.
 *
 * It is a combobox, so it is wired as one: `role="combobox"` on the input with
 * `aria-expanded` and `aria-controls`, `role="listbox"` on the dropdown,
 * `role="option"` with `aria-selected` on each row, and the active row named by
 * `aria-activedescendant` so a screen reader follows the arrow keys. Up/Down
 * move, Enter opens the highlighted row or submits the raw query, Escape closes
 * without navigating.
 *
 * Suggestions are advisory: nothing here is authoritative about price or stock.
 * The figures come from the same cached catalog the cards read, and the product
 * page re-reads the Hub when the shopper lands on it.
 */
export function SearchBox({ lang, variant = "header" }: { lang: Lang; variant?: "header" | "drawer" }) {
  const t = tr(lang);
  const router = useRouter();
  const inDrawer = variant === "drawer";

  const [expanded, setExpanded] = useState(inDrawer);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-opt-${i}`;

  const close = useCallback(() => { setOpen(false); setActive(-1); }, []);

  const go = useCallback((href: string) => {
    close();
    if (!inDrawer) setExpanded(false);
    router.push(href);
  }, [close, inDrawer, router]);

  // Debounced lookup. Every render of this effect cancels the timer and aborts
  // the request it started, so a fast typist leaves exactly one in flight and
  // an older, slower answer can never overwrite a newer one.
  useEffect(() => {
    const term = q.trim();
    if (term === "") { setItems([]); setTotal(0); setOpen(false); setActive(-1); return; }

    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&lang=${lang}`, { signal: ctl.signal });
        if (!res.ok) { setItems([]); setTotal(0); setOpen(false); return; }
        const data = (await res.json()) as { products: Suggestion[]; total: number };
        setItems(data.products.slice(0, MAX_SUGGESTIONS));
        setTotal(data.total);
        setOpen(true);
        setActive(-1);
      } catch {
        // Aborted, offline, or a malformed answer. The box stays usable and
        // Enter still reaches /search — it just offers nothing on the way.
      }
    }, DEBOUNCE_MS);

    return () => { clearTimeout(timer); ctl.abort(); };
  }, [q, lang]);

  // A click anywhere else dismisses the dropdown (and re-collapses the field in
  // the header, where it overlays the nav).
  useEffect(() => {
    if (!open && !expanded) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
        if (!inDrawer) setExpanded(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, expanded, close, inDrawer]);

  /**
   * Enter on the raw text, or "See all N results". Both land on /search, which
   * is the single emitter of the `search` event — this no longer reports one
   * of its own, because doing so counted every search typed here twice while a
   * pasted link counted once. It leaves a one-shot marker instead, so the page
   * it navigates to can still tell a typed search from a pasted link.
   *
   * Enter on a highlighted suggestion does not come through here: it opens the
   * product directly and reports nothing, exactly as before.
   */
  function submit() {
    const term = q.trim();
    if (term === "") return;
    markSearchFromBox(term);
    go(`/search?q=${encodeURIComponent(term)}`);
  }

  const rowCount = items.length + (total > items.length ? 1 : 0);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      if (open) close();
      else if (!inDrawer) { setExpanded(false); inputRef.current?.blur(); }
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

  return (
    <div ref={rootRef} className={`relative ${inDrawer ? "w-full" : "flex items-center"}`}>
      {!inDrawer && (
        <button
          type="button"
          aria-label={expanded ? t("search", "close") : t("search", "open")}
          aria-expanded={expanded}
          onClick={() => {
            const next = !expanded;
            setExpanded(next);
            if (next) window.setTimeout(() => inputRef.current?.focus(), 0);
            else close();
          }}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-charcoal/30 text-charcoal hover:border-gold-dark hover:text-gold-dark lg:hidden"
        >
          <MagnifierIcon />
        </button>
      )}

      <div
        className={
          inDrawer
            ? "w-full"
            : `${expanded ? "fixed inset-x-[clamp(18px,4vw,48px)] top-[14px] z-50" : "hidden"} lg:static lg:inset-x-auto lg:top-auto lg:block lg:w-36 lg:transition-[width] lg:duration-200 lg:max-xl:focus-within:w-52 2xl:w-[240px]`
        }
      >
        <div className="flex min-h-10 items-center gap-2 rounded-sm border border-charcoal/30 bg-chalk px-3 text-charcoal focus-within:border-gold-dark">
          <span aria-hidden="true" className="shrink-0 text-charcoal/60"><MagnifierIcon /></span>
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
            aria-label={t("search", "placeholder")}
            placeholder={t("search", "placeholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => { if (items.length > 0) setOpen(true); }}
            className="min-h-9 w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-charcoal/50"
          />
        </div>

        {/* No `expanded` in this condition. From `lg` up the field is shown by
            CSS while `expanded` stays false — gating the dropdown on that state
            hid it on exactly the widest screens. The wrapper above is `hidden`
            below `lg` when collapsed, so CSS already governs both together. */}
        {open && rowCount > 0 && (
          <ul
            id={listId}
            role="listbox"
            aria-label={t("search", "placeholder")}
            className="absolute left-0 right-0 z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-sm border border-hairline bg-chalk py-1 shadow-lg"
          >
            {items.map((s, i) => (
              <li
                key={s.slug}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); go(`/products/${s.slug}`); }}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${i === active ? "bg-hairline" : ""}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-sm bg-hairline">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {s.image ? <img src={s.image} alt="" width={40} height={40} className="h-10 w-10 object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-charcoal">{s.name}</span>
                  <span className="block truncate text-[11px] text-charcoal/60">{s.sku}</span>
                </span>
                {s.price != null && <span className="shrink-0 text-xs text-charcoal/75">{formatMoney(s.price)}</span>}
              </li>
            ))}
            {total > items.length && (
              <li
                id={optionId(items.length)}
                role="option"
                aria-selected={active === items.length}
                onMouseEnter={() => setActive(items.length)}
                onMouseDown={(e) => { e.preventDefault(); submit(); }}
                className={`cursor-pointer border-t border-hairline px-3 py-2 text-sm text-gold-dark ${active === items.length ? "bg-hairline" : ""}`}
              >
                {t("search", "seeAll", { n: String(total) })}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function MagnifierIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" strokeLinecap="round" />
    </svg>
  );
}

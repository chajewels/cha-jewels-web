"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tr, type Lang } from "@/lib/i18n";
import { formatMoney } from "@/lib/utils";
import { markSearchFromBox } from "@/lib/search-origin";
import { HubImage } from "@/components/media/hub-image";

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
  /**
   * WHAT THE PANEL IS SHOWING, which is not the same question as how many rows
   * there are. An empty `items` used to mean all three of "nothing typed yet",
   * "still asking" and "asked, and the answer was none" — so the panel simply
   * did not open, and a shopper who searched for something we do not stock got
   * no answer at all. A failed request was quieter still: the catch swallowed
   * it and the box looked like it had not been used.
   */
  const [status, setStatus] = useState<"idle" | "pending" | "ready" | "error">("idle");

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
    if (term === "") { setItems([]); setTotal(0); setOpen(false); setActive(-1); setStatus("idle"); return; }

    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("pending");
      setOpen(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&lang=${lang}`, { signal: ctl.signal });
        if (!res.ok) { setItems([]); setTotal(0); setStatus("error"); setOpen(true); return; }
        const data = (await res.json()) as { products: Suggestion[]; total: number };
        setItems(data.products.slice(0, MAX_SUGGESTIONS));
        setTotal(data.total);
        setStatus("ready");
        setOpen(true);
        setActive(-1);
      } catch (e) {
        // AN ABORT IS NOT A FAILURE. It means a newer keystroke has already
        // replaced this request, and its own effect is mid-flight — saying
        // "unavailable" here would flash an error over a search that is
        // working. Everything else (offline, a malformed answer) is real and
        // the reader is told. Enter still reaches /search either way.
        if ((e as { name?: string })?.name === "AbortError") return;
        setItems([]); setTotal(0); setStatus("error"); setOpen(true);
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
  /** The listbox exists only in this one state; aria-controls must not name a node that is not there. */
  const hasListbox = open && status === "ready" && rowCount > 0;
  const liveMessage =
    status === "pending" ? t("search", "searching")
    : status === "error" ? t("search", "failed")
    : status === "ready" ? (rowCount > 0 ? (total === 1 ? t("search", "countOne") : t("search", "count", { n: String(total) })) : t("search", "noneShort"))
    : "";

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
            // lg:w-36 was 144px, which left 94px inside the icon and padding
            // and clipped the 98px "Search jewelry" placeholder at 1280 and
            // 1440. Widened so the placeholder fits without focus.
            //
            // THE WIDTH DOES NOT CHANGE ON FOCUS ANY MORE. Between lg and xl
            // this grew from w-48 to w-56 on focus-within over 200ms, and the
            // 32px it took came out of the nav beside it: clicking into the
            // search box shoved Wholesale, Loyalty and the rest leftwards,
            // and a link someone was about to click moved out from under the
            // pointer. The box reserves one width per breakpoint now, so
            // focus changes the border colour and nothing else.
            : `${expanded ? "fixed inset-x-[clamp(18px,4vw,48px)] top-[14px] z-50" : "hidden"} lg:static lg:inset-x-auto lg:top-auto lg:block lg:w-48 xl:w-56 2xl:w-[240px]`
        }
      >
        <div className="flex min-h-10 items-center gap-2 rounded-sm border border-charcoal/30 bg-chalk px-3 text-charcoal focus-within:border-gold-dark">
          <span aria-hidden="true" className="shrink-0 text-charcoal/60"><MagnifierIcon /></span>
          <input
            ref={inputRef}
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
            onFocus={() => { if (items.length > 0) setOpen(true); }}
            className="min-h-9 w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-charcoal/70"
          />
        </div>

        {/* THE LIVE REGION IS ALWAYS MOUNTED, and empty when there is nothing
            to say. A role="status" that appears at the same moment as its text
            is frequently not announced at all — the assistive technology has
            to be watching the node before the text lands in it. So this one
            never unmounts, and the panel below renders the same words for
            people who are reading rather than listening. */}
        <p role="status" aria-live="polite" className="sr-only">{liveMessage}</p>

        {/* No `expanded` in this condition. From `lg` up the field is shown by
            CSS while `expanded` stays false — gating the dropdown on that state
            hid it on exactly the widest screens. The wrapper above is `hidden`
            below `lg` when collapsed, so CSS already governs both together. */}
        {open && status !== "idle" && (
          <div className="absolute left-0 right-0 z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-sm border border-hairline bg-chalk shadow-lg">
            {status === "pending" && (
              <p className="px-3 py-3 text-sm text-charcoal/70">{t("search", "searching")}</p>
            )}
            {status === "error" && (
              <p className="px-3 py-3 text-sm text-charcoal">{t("search", "failed")}</p>
            )}
            {status === "ready" && rowCount === 0 && (
              <div className="px-3 py-3">
                <p className="text-sm text-charcoal">{t("search", "noneShort")}</p>
                {/* Somewhere to go, rather than a dead end. onMouseDown for the
                    same reason the rows use it: the blur that a click starts
                    would unmount this link before the click landed on it. */}
                <Link
                  href="/collections"
                  onMouseDown={(e) => { e.preventDefault(); go("/collections"); }}
                  className="mt-1 inline-block text-sm text-gold-dark underline underline-offset-4"
                >
                  {t("search", "browseAll")}
                </Link>
              </div>
            )}
            {status === "ready" && rowCount > 0 && (
          <ul
            id={listId}
            role="listbox"
            aria-label={t("search", "placeholder")}
            className="py-1"
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
                  {/* A 40px box, so next/image asks for 48 at 1x and 80 at 2x
                      (the 80 comes from images.imageSizes in next.config) —
                      rather than the full product photo the Hub stores. */}
                  {s.image ? <HubImage src={s.image} alt="" width={40} height={40} className="h-10 w-10 object-cover" /> : null}
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

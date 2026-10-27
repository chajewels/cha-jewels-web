"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { ComponentStyle } from "@/components/fx/component-style";
import { catalogFiltersToSearch, parseCatalogFilters } from "@/lib/catalog-filters";
import type { ItemType } from "@/lib/types";

/**
 * THE COLLECTION / CATEGORY GRID WITH ITS TOOLBAR (step 2 build; comp
 * page-comps/product-collection "Grids"). The cards are rendered on the
 * server (ProductCard) and handed in as nodes with the facts to filter on, so
 * the page stays ISR-cached and filtering is instant, with no Hub call.
 *
 *   condition   All / New / Preloved / Sale (the existing labels). Sale is
 *               the cards that show the Sale tag: on sale AND not sold
 *               (lib/sale.ts struckFullPrice, decided in CatalogSection).
 *   type        Jewelry / Watch / Accessory — the Hub's `item_type` (D2-1).
 *               Not sent yet: the group appears only once a piece on the page
 *               carries one. Nothing is inferred from a SKU or a name.
 *   kind        the Hub's collections the pieces belong to (`collection_slugs`,
 *               owner 2026-10-27), named in the Hub's words and order
 *               (CatalogSection), when the page has more than one
 *   brand       every `brand` on the page exactly as the Hub writes it — no
 *               merging of spellings — when there is more than one; a piece
 *               with no brand is in no chip
 *   metal       every stamp on the page, exactly as the Hub writes it (K18,
 *               750, Silver…), when there is more than one
 *   available   "Available only". Sold pieces show by default (D2-7).
 *   sort        Newest (the Hub's own order), Oldest (that order reversed —
 *               no dates read), price low to high, high to low — comparisons
 *               of the Hub's yen prices, never arithmetic.
 *
 * The filters live in the address bar (lib/catalog-filters.ts; owner
 * report 2026-10-17), so a shared link opens on the chosen group. They are
 * read after mount and written with history.replaceState — no navigation, no
 * refetch, and the page stays ISR (no searchParams, no useSearchParams).
 *
 * An option with no pieces shows 0 and is dashed, not hidden. Below `md` the
 * groups move into a bottom sheet (a modal dialog) behind a Filter button.
 *
 * FILLING THE LAST ROW (DESIGN.md: an empty cell is a defect). The "ask a
 * person" tile fills what is left of the last row at each column count
 * (2 / 3 / 4), one cell or more; from two cells it adds the dealer permit.
 */
export type GridItem = {
  key: string;
  node: React.ReactNode;
  preloved: boolean;
  /** The card shows the Sale tag (lib/sale.ts struckFullPrice): on sale and not sold. */
  sale: boolean;
  type: ItemType | null;
  /** The Hub's `collection_slugs` for the piece ([] when none). */
  kinds: string[];
  /** The Hub's `brand`, exactly as written; null when none. */
  brand: string | null;
  /** `key` is the Hub stamp (filter, count, URL); `label` is what the chip shows. */
  metals: { key: string; label: string }[];
  sold: boolean;
  price: number | null;
};

export type GridLabels = {
  condition: string; all: string; new: string; preloved: string; sale: string;
  type: string; types: Record<ItemType, string>;
  kind: string; brand: string;
  metal: string; availableOnly: string;
  sort: string; sortLabel: string; sorts: Record<Sort, string>;
  filter: string; filters: string; clear: string; show: string; close: string;
  count: string; countOne: string; includingSold: string; emptyFiltered: string;
};

type Sort = "newest" | "oldest" | "low" | "high";
const SORTS: Sort[] = ["newest", "oldest", "low", "high"];
const TYPES: ItemType[] = ["Jewelry", "Watch", "Accessory"];
const has = (x: GridItem, key: string) => x.metals.some((m) => m.key === key);

const CSS = `
.cg-bar { position: sticky; top: var(--hdr-h, 0px); z-index: 20; background: rgb(245 245 242 / .97); border-bottom: 1px solid #E5E5E0; transition: top var(--dur-reveal) var(--ease-lux); }
.cg-chip { display: inline-flex; align-items: center; gap: 6px; min-height: 38px; padding: 0 14px; border: 1px solid #E5E5E0; background: #fff; font-size: 13px; border-radius: 2px; white-space: nowrap; }
.cg-chip[aria-pressed="true"] { background: #222; color: #F5F5F2; border-color: #222; }
.cg-chip[aria-disabled="true"] { color: rgb(34 34 34 / .7); border-style: dashed; background: transparent; cursor: default; }
.cg-n { font-size: 11.5px; color: rgb(34 34 34 / .7); font-variant-numeric: lining-nums tabular-nums; }
.cg-chip[aria-pressed="true"] .cg-n { color: #E8D28A; }
.cg-grp + .cg-grp { padding-left: 12px; border-left: 1px solid #E5E5E0; }
.cg-switch { position: relative; width: 34px; height: 20px; border-radius: 9999px; background: rgb(34 34 34 / .45); flex: none; transition: background-color var(--dur-micro) var(--ease-lux); }
.cg-switch::after { content: ""; position: absolute; left: 3px; top: 3px; width: 14px; height: 14px; border-radius: 9999px; background: #fff; transition: transform var(--dur-micro) var(--ease-lux); }
[aria-checked="true"] > .cg-switch { background: #222; }
[aria-checked="true"] > .cg-switch::after { transform: translateX(14px); background: #E8D28A; }
.cg-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 12px; }
@media (min-width: 834px) { .cg-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px 24px; } }
@media (min-width: 1024px) { .cg-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.cg-tile { display: none; grid-column: span var(--span); }
.cg-tile .cg-permit { display: none; }
@media (max-width: 833.98px) { .cg-tile[data-r2] { display: flex; --span: var(--r2); } .cg-tile[data-p2] .cg-permit { display: flex; } }
@media (min-width: 834px) and (max-width: 1023.98px) { .cg-tile[data-r3] { display: flex; --span: var(--r3); } .cg-tile[data-p3] .cg-permit { display: flex; } }
@media (min-width: 1024px) { .cg-tile[data-r4] { display: flex; --span: var(--r4); } .cg-tile[data-p4] .cg-permit { display: flex; } }
.cg-sheet { position: fixed; inset: 0; z-index: 60; background: rgb(15 13 10 / .45); display: flex; align-items: flex-end; }
.cg-panel { width: 100%; max-height: 86vh; background: #F5F5F2; display: flex; flex-direction: column; animation: cg-in var(--dur-reveal) var(--ease-lux) both; padding-bottom: env(safe-area-inset-bottom); }
@keyframes cg-in { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .cg-panel { animation: none; } .cg-bar, .cg-switch, .cg-switch::after { transition: none; } }`;

export function CatalogGrid({ items, kinds, labels, tile }: {
  items: GridItem[];
  /** The page's collections, in the Hub's order, with their names in the current language (CatalogSection). */
  kinds: { key: string; label: string }[];
  labels: GridLabels;
  /** The "ask a person" tile's content; `.cg-permit` inside it shows from two cells. */
  tile: React.ReactNode;
}) {
  const [cond, setCond] = useState<"all" | "new" | "preloved" | "sale">("all");
  const [type, setType] = useState<ItemType | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [metal, setMetal] = useState<string | null>(null);
  const [availOnly, setAvailOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [sheet, setSheet] = useState(false);

  const hasTypes = items.some((x) => x.type);
  // One chip per stamp, in the order the stamps first appear on the page.
  const metals = useMemo(() => [...new Map(items.flatMap((x) => x.metals).map((m) => [m.key, m] as const)).values()], [items]);
  // Shown only when a piece carries collection_slugs and the page has more than one kind.
  const hasKinds = items.some((x) => x.kinds.length > 0) && kinds.length > 1;
  // One chip per brand, in the order the brands first appear on the page.
  const brands = useMemo(() => [...new Set(items.flatMap((x) => (x.brand ? [x.brand] : [])))], [items]);
  const n = {
    new: items.filter((x) => !x.preloved).length,
    preloved: items.filter((x) => x.preloved).length,
    sale: items.filter((x) => x.sale).length,
    type: (k: ItemType) => items.filter((x) => x.type === k).length,
    metal: (m: string) => items.filter((x) => has(x, m)).length,
    kind: (k: string) => items.filter((x) => x.kinds.includes(k)).length,
    brand: (b: string) => items.filter((x) => x.brand === b).length,
  };

  // The URL: restored once after mount (the first render stays at the
  // defaults, matching the server HTML), then kept in step with replaceState.
  // The first run and the run the restore triggers are skipped, so the URL is
  // never rewritten before it has been read.
  const ready = useRef(false);
  const skip = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || !ready.current) return;
    if (skip.current) { skip.current = false; return; }
    const search = catalogFiltersToSearch(window.location.search, { cond, type, kind, brand, metal, availOnly, sort });
    if (search === window.location.search) return;
    window.history.replaceState(window.history.state, "", window.location.pathname + search + window.location.hash);
  }, [cond, type, kind, brand, metal, availOnly, sort]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const f = parseCatalogFilters(window.location.search, {
      types: hasTypes ? TYPES.filter((k) => items.some((x) => x.type === k)) : [],
      metals: metals.map((m) => m.key),
      kinds: hasKinds ? kinds.map((k) => k.key) : [],
      brands: brands.length > 1 ? brands : [],
    });
    ready.current = true;
    if (f.cond === "all" && !f.type && !f.kind && !f.brand && !f.metal && !f.availOnly && f.sort === "newest") return;
    skip.current = true;
    setCond(f.cond); setType(f.type); setKind(f.kind); setBrand(f.brand); setMetal(f.metal); setAvailOnly(f.availOnly); setSort(f.sort);
    // Once, on mount: the page's own list is what the link is checked against.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = useMemo(() => {
    const list = items.filter((x) =>
      (cond === "all" || (cond === "sale" ? x.sale : (cond === "preloved") === x.preloved)) &&
      (!type || x.type === type) &&
      (!kind || x.kinds.includes(kind)) &&
      (!brand || x.brand === brand) &&
      (!metal || has(x, metal)) &&
      (!availOnly || !x.sold));
    if (sort === "newest") return list;
    // The Hub's own order, read backwards: no date is read or compared.
    if (sort === "oldest") return [...list].reverse();
    // A comparison of the Hub's yen prices; a piece without one goes last.
    return [...list].sort((a, b) => (a.price == null ? 1 : b.price == null ? -1 : sort === "low" ? a.price - b.price : b.price - a.price));
  }, [items, cond, type, kind, brand, metal, availOnly, sort]);

  const clear = () => { setCond("all"); setType(null); setKind(null); setBrand(null); setMetal(null); setAvailOnly(false); setSort("newest"); };
  const anySold = items.some((x) => x.sold);
  const count = (shown.length === 1 ? labels.countOne : labels.count).replace("{n}", String(shown.length)) + (anySold && !availOnly && shown.some((x) => x.sold) ? labels.includingSold : "");

  // The filler: what is left of the last row at 2, 3 and 4 columns.
  const rem = (c: number) => (c - (shown.length % c)) % c;
  const [r2, r3, r4] = [rem(2), rem(3), rem(4)];

  const groups = (inSheet: boolean) => (
    <>
      <Group label={labels.condition} inSheet={inSheet}>
        <Chip on={cond === "all"} onClick={() => setCond("all")}>{labels.all}</Chip>
        <Chip on={cond === "new"} n={n.new} onClick={() => setCond(cond === "new" ? "all" : "new")}>{labels.new}</Chip>
        <Chip on={cond === "preloved"} n={n.preloved} onClick={() => setCond(cond === "preloved" ? "all" : "preloved")}>{labels.preloved}</Chip>
        <Chip on={cond === "sale"} n={n.sale} onClick={() => setCond(cond === "sale" ? "all" : "sale")}>{labels.sale}</Chip>
      </Group>
      {hasTypes && (
        <Group label={labels.type} inSheet={inSheet}>
          {TYPES.map((k) => <Chip key={k} on={type === k} n={n.type(k)} onClick={() => setType(type === k ? null : k)}>{labels.types[k]}</Chip>)}
        </Group>
      )}
      {hasKinds && (
        <Group label={labels.kind} inSheet={inSheet}>
          {kinds.map((k) => <Chip key={k.key} on={kind === k.key} n={n.kind(k.key)} onClick={() => setKind(kind === k.key ? null : k.key)}>{k.label}</Chip>)}
        </Group>
      )}
      {brands.length > 1 && (
        <Group label={labels.brand} inSheet={inSheet}>
          {brands.map((b) => <Chip key={b} on={brand === b} n={n.brand(b)} onClick={() => setBrand(brand === b ? null : b)}>{b}</Chip>)}
        </Group>
      )}
      {metals.length > 1 && (
        <Group label={labels.metal} inSheet={inSheet}>
          {metals.map((m) => <Chip key={m.key} on={metal === m.key} n={n.metal(m.key)} onClick={() => setMetal(metal === m.key ? null : m.key)}>{m.label}</Chip>)}
        </Group>
      )}
    </>
  );
  const toggle = (
    <button type="button" role="switch" aria-checked={availOnly} onClick={() => setAvailOnly(!availOnly)}
      className="inline-flex min-h-11 items-center gap-2 text-[13px]">
      <span aria-hidden="true" className="cg-switch" />{labels.availableOnly}
    </button>
  );
  const sortSelect = (
    <label className="relative inline-flex h-[38px] items-center rounded-sm border border-charcoal/30 bg-white text-[13px]">
      <span className="sr-only">{labels.sort}</span>
      <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-full appearance-none bg-transparent pl-3 pr-8 text-[13px] outline-none">
        {SORTS.map((k) => <option key={k} value={k}>{labels.sortLabel.replace("{s}", labels.sorts[k])}</option>)}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 h-4 w-4" strokeWidth={1.6} />
    </label>
  );

  return (
    <>
      <ComponentStyle id="fx-catalog-grid" css={CSS} />
      <div className="cg-bar">
        <div className="wrap flex min-h-[58px] items-center gap-2 md:min-h-16 md:flex-wrap md:gap-2.5 md:py-2">
          <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog"
            className="inline-flex h-[38px] shrink-0 items-center gap-1.5 rounded-sm border border-charcoal-deep px-3 text-[13px] font-medium md:hidden">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />{labels.filter}
          </button>
          <div className="hidden flex-wrap items-center gap-2.5 md:flex">{groups(false)}</div>
          <div className="hidden md:block">{toggle}</div>
          <div className="ml-auto shrink-0">{sortSelect}</div>
        </div>
      </div>

      <div className="wrap pb-28 pt-5 sm:pt-7 lg:pb-24">
        <p aria-live="polite" className="mb-4 text-[13px] text-charcoal/70 sm:mb-[18px]">{count}</p>
        {shown.length === 0 ? (
          <div className="border border-hairline p-6">
            <p className="text-charcoal">{labels.emptyFiltered}</p>
            <button type="button" onClick={clear} className="mt-4 inline-flex min-h-11 items-center rounded-sm border border-charcoal/60 px-5 text-sm">{labels.clear}</button>
          </div>
        ) : (
          <div className="cg-grid">
            {shown.map((x) => <div key={x.key} className="min-w-0">{x.node}</div>)}
            {(r2 || r3 || r4) ? (
              <aside
                className="cg-tile band-dark relative min-w-0 flex-col justify-between gap-[18px] bg-charcoal-deep p-5 text-chalk sm:p-[26px]"
                style={{ ["--r2" as string]: r2, ["--r3" as string]: r3, ["--r4" as string]: r4 }}
                data-r2={r2 ? "" : undefined} data-r3={r3 ? "" : undefined} data-r4={r4 ? "" : undefined}
                data-p2={r2 >= 2 ? "" : undefined} data-p3={r3 >= 2 ? "" : undefined} data-p4={r4 >= 2 ? "" : undefined}
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgb(201_162_39/0),#C9A227_30%,#E8D28A_50%,#C9A227_70%,rgb(201_162_39/0))]" />
                {tile}
              </aside>
            ) : null}
          </div>
        )}
      </div>

      {sheet && <Sheet labels={labels} count={shown.length} onClose={() => setSheet(false)} onClear={clear} toggle={toggle}>
        {groups(true)}
        <div className="grid gap-2.5 border-b border-hairline py-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark [:lang(ja)_&]:text-xs [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{labels.sort}</span>
          <div className="flex flex-wrap gap-2">
            {SORTS.map((k) => <Chip key={k} on={sort === k} onClick={() => setSort(k)}>{labels.sorts[k]}</Chip>)}
          </div>
        </div>
      </Sheet>}
    </>
  );
}

function Group({ label, inSheet, children }: { label: string; inSheet: boolean; children: React.ReactNode }) {
  return inSheet ? (
    <div role="group" aria-label={label} className="grid gap-2.5 border-b border-hairline py-3.5">
      <span aria-hidden="true" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark [:lang(ja)_&]:text-xs [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  ) : (
    <div role="group" aria-label={label} className="cg-grp flex items-center gap-1.5">
      <span aria-hidden="true" className="mr-1 text-xs text-charcoal/70">{label}</span>{children}
    </div>
  );
}

function Chip({ on, n, onClick, children }: { on: boolean; n?: number; onClick: () => void; children: React.ReactNode }) {
  const dead = n === 0 && !on;
  return (
    <button type="button" className="cg-chip" aria-pressed={on} aria-disabled={dead || undefined} onClick={dead ? undefined : onClick}>
      {children}{n !== undefined && <span className="cg-n">{n}</span>}
    </button>
  );
}

/** The phone filter sheet: a modal dialog; Esc and the backdrop close it, focus is held inside and returned. */
function Sheet({ labels, count, onClose, onClear, toggle, children }: {
  labels: GridLabels; count: number; onClose: () => void; onClear: () => void; toggle: React.ReactNode; children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  // Read through a ref: the effect below must run once per opening, not on
  // every render the chips cause (it would pull focus back to the top).
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const el = panel.current;
    el?.querySelector<HTMLElement>("button")?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close.current(); return; }
      if (e.key !== "Tab" || !el) return;
      const f = [...el.querySelectorAll<HTMLElement>("button, select, [href]")].filter((x) => !x.hasAttribute("disabled"));
      if (!f.length) return;
      const [first, last] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = prev; back?.focus({ preventScroll: true }); };
  }, []);
  return (
    <div className="cg-sheet" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={labels.filters} className="cg-panel">
        <div className="flex items-center justify-between border-b border-hairline px-[clamp(18px,4vw,48px)] py-3">
          <b className="text-base">{labels.filter}</b>
          <button type="button" onClick={onClose} aria-label={labels.close} className="grid h-11 w-11 place-items-center rounded-full border border-charcoal/45">
            <X aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
        </div>
        <div className="overflow-auto px-[clamp(18px,4vw,48px)] pb-4 pt-2">
          {children}
          <div className="border-b border-hairline py-2">{toggle}</div>
        </div>
        <div className="flex gap-2.5 border-t border-hairline px-[clamp(18px,4vw,48px)] py-3">
          <button type="button" onClick={onClear} className="min-h-12 flex-1 rounded-sm border border-charcoal/60 text-[15px] font-medium">{labels.clear}</button>
          <button type="button" onClick={onClose} className="min-h-12 flex-[2] rounded-sm bg-charcoal-deep text-[15px] font-medium text-chalk">{labels.show.replace("{n}", String(count))}</button>
        </div>
      </div>
    </div>
  );
}

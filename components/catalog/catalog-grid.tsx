"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { ComponentStyle } from "@/components/fx/component-style";
import { DEFAULT_FILTERS, catalogFiltersToSearch, parseCatalogFilters, type CatalogFilters } from "@/lib/catalog-filters";
import { lockScroll } from "@/lib/scroll-lock";

/**
 * THE COLLECTION / CATEGORY GRID WITH ITS TOOLBAR (step 2 build; comp
 * page-comps/product-collection "Grids"). The cards are rendered on the
 * server (ProductCard) and handed in as nodes with the facts to filter on, so
 * the page stays ISR-cached and filtering is instant, with no Hub call.
 *
 *   condition   All / New / Preloved / Sale (the existing labels). Sale is
 *               the cards that show the Sale tag: on sale AND not sold
 *               (lib/sale.ts struckFullPrice, decided in CatalogSection).
 *   type        the Hub's collections the pieces belong to (`collection_slugs`:
 *               necklaces, rings, pendants…), named in the Hub's words and
 *               order (CatalogSection), when the page has more than one. Owner
 *               2026-10-27: "kind is type … don't make it complicated" — the
 *               one Type group; the old one built from `item_type`
 *               (Jewelry / Watch / Accessory) is gone. Nothing is inferred
 *               from a SKU or a name.
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
 * COMPACT TOOLBAR (owner-approved mockup, 2026-10-27). From `lg` the bar is
 * one control row: a dropdown button per group (Condition, Type, Brand,
 * Metal — "Brand · 2" when two are ticked) opening a short panel of
 * tick boxes, then "Available only" and Sort. Below the bar, one removable
 * tag per ticked option and "Clear all". Below `lg` the bar keeps Filter and
 * Sort — also one row: from 768 to 1023 px the group buttons, the switch and
 * Sort measure wider than the bar, so tablets get the sheet rather
 * than clipped controls. The bottom sheet (a modal dialog) holds the tags, then each group as
 * a section, closed by default, then Sort.
 *
 * MULTI-SELECT: OR within a group, AND across groups; nothing ticked in a
 * group is no constraint (Condition's "All"). COUNTS ARE FACETED: an option's
 * count is the pieces that pass every OTHER group's ticks and "Available
 * only", and carry that option — what the grid would add if it were ticked.
 * An option at 0 stays listed, dashed and disabled (unless it is ticked, so
 * it can always be unticked). Brands are listed A–Z (one collator, so EN and
 * JA agree), with a search box above 8.
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
  /** The Hub's `collection_slugs` for the piece ([] when none): the Type group. */
  types: string[];
  /** The Hub's `brand`, exactly as written; null when none. */
  brand: string | null;
  /** `key` is the Hub stamp (filter, count, URL); `label` is what the chip shows. */
  metals: { key: string; label: string }[];
  sold: boolean;
  price: number | null;
};

export type GridLabels = {
  condition: string; all: string; new: string; preloved: string; sale: string;
  type: string; brand: string;
  metal: string; availableOnly: string;
  sort: string; sortLabel: string; sorts: Record<Sort, string>;
  filter: string; filters: string; clear: string; show: string; close: string;
  /** removeFilter is a template: "{x}" is the option's label. */
  activeFilters: string; removeFilter: string; clearAll: string; brandSearch: string; brandNone: string;
  count: string; countOne: string; includingSold: string; emptyFiltered: string;
};

type Sort = CatalogFilters["sort"];
const SORTS: Sort[] = ["newest", "oldest", "low", "high"];
type GroupId = "cond" | "type" | "brand" | "metal";
type Opt = { key: string; label: string };
type GroupDef = { id: GroupId; label: string; options: Opt[]; search: boolean };

/** Does the piece pass one group's ticks (OR within the group)? */
const PASS: Record<GroupId, (x: GridItem, sel: string[]) => boolean> = {
  cond: (x, sel) => sel.some((c) => (c === "sale" ? x.sale : (c === "preloved") === x.preloved)),
  type: (x, sel) => x.types.some((k) => sel.includes(k)),
  brand: (x, sel) => !!x.brand && sel.includes(x.brand),
  metal: (x, sel) => x.metals.some((m) => sel.includes(m.key)),
};
const GROUPS: GroupId[] = ["cond", "type", "brand", "metal"];
// One collator for both languages, so the brand list reads in the same order on EN and JA.
const AZ = new Intl.Collator("en", { sensitivity: "base", numeric: true });
// The brand search ignores case and accents ("hermes" finds Hermès).
const fold = (s: string) => s.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

const CSS = `
.cg-bar { position: sticky; top: var(--hdr-h, 0px); z-index: 20; background: rgb(245 245 242 / .97); border-bottom: 1px solid #E5E5E0; transition: top var(--dur-reveal) var(--ease-lux); }
.cg-chip { display: inline-flex; align-items: center; gap: 6px; min-height: 38px; padding: 0 14px; border: 1px solid #E5E5E0; background: #fff; font-size: 13px; border-radius: 2px; white-space: nowrap; }
.cg-chip[aria-pressed="true"] { background: #222; color: #F5F5F2; border-color: #222; }
.cg-chip[aria-disabled="true"] { color: rgb(34 34 34 / .7); border-style: dashed; background: transparent; cursor: default; }
.cg-n { font-size: 11.5px; color: rgb(34 34 34 / .7); font-variant-numeric: lining-nums tabular-nums; }
.cg-chip[aria-pressed="true"] .cg-n { color: #d9d3ca; }
.cg-drop { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 10px 0 12px; border: 1px solid #E5E5E0; background: #fff; font-size: 13px; border-radius: 2px; white-space: nowrap; }
.cg-drop[data-ticked] { border-color: #222; }
.cg-drop svg { transition: transform var(--dur-micro) var(--ease-lux); }
.cg-drop[aria-expanded="true"] svg { transform: rotate(180deg); }
.cg-pop { position: absolute; left: 0; top: calc(100% + 6px); z-index: 30; min-width: 232px; max-width: 300px; background: #fff; border: 1px solid #E5E5E0; border-radius: 2px; box-shadow: 0 1px 2px rgb(35 29 18 / 6%), 0 5px 14px rgb(35 29 18 / 7%), 0 16px 32px rgb(35 29 18 / 5%); animation: cg-pop var(--dur-micro) var(--ease-lux) both; }
@keyframes cg-pop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.cg-opt { display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 0 10px; border: 1px solid transparent; border-radius: 2px; font-size: 13px; cursor: pointer; }
.cg-opt:hover { background: #F5F5F2; }
.cg-opt input { width: 16px; height: 16px; flex: none; accent-color: #222; cursor: inherit; }
.cg-opt[data-dead] { color: rgb(34 34 34 / .7); border-color: #E5E5E0; border-style: dashed; cursor: default; }
.cg-opt[data-dead]:hover { background: transparent; }
.cg-opt .cg-n { margin-left: auto; padding-left: 12px; }
.cg-tag { display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 8px 0 10px; border: 1px solid #222; background: #fff; font-size: 13px; border-radius: 2px; }
.cg-switch { position: relative; width: 34px; height: 20px; border-radius: 9999px; background: rgb(34 34 34 / .45); flex: none; transition: background-color var(--dur-micro) var(--ease-lux); }
.cg-switch::after { content: ""; position: absolute; left: 3px; top: 3px; width: 14px; height: 14px; border-radius: 9999px; background: #fff; transition: transform var(--dur-micro) var(--ease-lux); }
[aria-checked="true"] > .cg-switch { background: #222; }
[aria-checked="true"] > .cg-switch::after { transform: translateX(14px); background: #d9d3ca; }
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
@media (prefers-reduced-motion: reduce) { .cg-panel, .cg-pop { animation: none; } .cg-bar, .cg-switch, .cg-switch::after, .cg-drop svg { transition: none; } }`;

export function CatalogGrid({ items, types, labels, tile }: {
  items: GridItem[];
  /** The Type options: the page's collections, in the Hub's order, named in the current language (CatalogSection). */
  types: { key: string; label: string }[];
  labels: GridLabels;
  /** The "ask a person" tile's content; `.cg-permit` inside it shows from two cells. */
  tile: React.ReactNode;
}) {
  const [f, setF] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [sheet, setSheet] = useState(false);
  const [open, setOpen] = useState<GroupId | null>(null);
  const tagsRef = useRef<HTMLUListElement>(null);
  const sheetTagsRef = useRef<HTMLUListElement>(null);
  const resultsRef = useRef<HTMLParagraphElement>(null);

  // One option per stamp, in the order the stamps first appear on the page.
  const metals = useMemo(() => [...new Map(items.flatMap((x) => x.metals).map((m) => [m.key, m] as const)).values()], [items]);
  // Shown only when a piece carries collection_slugs and the page has more than one type.
  const hasTypes = items.some((x) => x.types.length > 0) && types.length > 1;
  // One option per brand, exactly as the Hub writes it, A–Z (ties keep the page's order).
  const brands = useMemo(() => [...new Set(items.flatMap((x) => (x.brand ? [x.brand] : [])))].sort((a, b) => AZ.compare(a, b)), [items]);

  // The groups the page shows, in the toolbar's order.
  const groups: GroupDef[] = [
    { id: "cond" as const, label: labels.condition, options: [{ key: "new", label: labels.new }, { key: "preloved", label: labels.preloved }, { key: "sale", label: labels.sale }], search: false },
    ...(hasTypes ? [{ id: "type" as const, label: labels.type, options: types, search: false }] : []),
    ...(brands.length > 1 ? [{ id: "brand" as const, label: labels.brand, options: brands.map((b) => ({ key: b, label: b })), search: brands.length > 8 }] : []),
    ...(metals.length > 1 ? [{ id: "metal" as const, label: labels.metal, options: metals, search: false }] : []),
  ];
  const sel = (g: GroupId) => f[g] as string[];

  // Every group's ticks and "Available only", leaving one group out (null: none).
  const passes = (x: GridItem, except: GroupId | null) =>
    (!f.availOnly || !x.sold) && GROUPS.every((g) => g === except || !sel(g).length || PASS[g](x, sel(g)));
  // FACETED COUNT: pieces passing every other group (and Available only) that carry this option.
  const count = (g: GroupId, key: string) => items.filter((x) => passes(x, g) && PASS[g](x, [key])).length;

  // The URL: restored once after mount (the first render stays at the
  // defaults, matching the server HTML), then kept in step with replaceState.
  // The first run and the run the restore triggers are skipped, so the URL is
  // never rewritten before it has been read.
  const ready = useRef(false);
  const skip = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined" || !ready.current) return;
    if (skip.current) { skip.current = false; return; }
    const search = catalogFiltersToSearch(window.location.search, f);
    if (search === window.location.search) return;
    window.history.replaceState(window.history.state, "", window.location.pathname + search + window.location.hash);
  }, [f]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const r = parseCatalogFilters(window.location.search, {
      types: hasTypes ? types.map((k) => k.key) : [],
      metals: metals.length > 1 ? metals.map((m) => m.key) : [],
      brands: brands.length > 1 ? brands : [],
    });
    ready.current = true;
    if (GROUPS.every((g) => !r[g].length) && !r.availOnly && r.sort === "newest") return;
    skip.current = true;
    setF(r);
    // Once, on mount: the page's own list is what the link is checked against.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = useMemo(() => {
    const list = items.filter((x) => passes(x, null));
    if (f.sort === "newest") return list;
    // The Hub's own order, read backwards: no date is read or compared.
    if (f.sort === "oldest") return [...list].reverse();
    // A comparison of the Hub's yen prices; a piece without one goes last.
    return [...list].sort((a, b) => (a.price == null ? 1 : b.price == null ? -1 : f.sort === "low" ? a.price - b.price : b.price - a.price));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, f]);

  /** Tick or untick one option; a group's ticks stay in the group's own option order. */
  const tick = (g: GroupDef, key: string) => setF((p) => {
    const cur = p[g.id] as string[];
    const next = cur.includes(key) ? cur.filter((k) => k !== key) : g.options.map((o) => o.key).filter((k) => k === key || cur.includes(k));
    return { ...p, [g.id]: next };
  });
  const setSort = (sort: Sort) => setF((p) => ({ ...p, sort }));
  const setAvail = (availOnly: boolean) => setF((p) => ({ ...p, availOnly }));
  /** The sheet's Clear and the empty state's: everything back to the page as it opened, sort included (as before). */
  const clear = () => setF(DEFAULT_FILTERS);
  /** "Clear all" beside the tags: what the tags show — the ticks and Available only. Sort is not a filter and stays. */
  const clearTags = () => { setF((p) => ({ ...DEFAULT_FILTERS, sort: p.sort })); resultsRef.current?.focus(); };

  const anySold = items.some((x) => x.sold);
  const countLine = (shown.length === 1 ? labels.countOne : labels.count).replace("{n}", String(shown.length)) + (anySold && !f.availOnly && shown.some((x) => x.sold) ? labels.includingSold : "");

  // The filler: what is left of the last row at 2, 3 and 4 columns.
  const rem = (c: number) => (c - (shown.length % c)) % c;
  const [r2, r3, r4] = [rem(2), rem(3), rem(4)];

  // One tag per ticked option, in the toolbar's order, then Available only.
  const tags: { id: string; label: string; remove: () => void }[] = [
    ...groups.flatMap((g) => g.options.filter((o) => sel(g.id).includes(o.key)).map((o) => ({ id: `${g.id}:${o.key}`, label: o.label, remove: () => tick(g, o.key) }))),
    ...(f.availOnly ? [{ id: "stock", label: labels.availableOnly, remove: () => setAvail(false) }] : []),
  ];
  const ticked = tags.length;
  /**
   * Removing a tag moves focus to the tag now in its place (or the one before); with none left, to the
   * result count (or, in the sheet, the sheet's first control), so the keyboard never loses its place.
   */
  const removeTag = (i: number, remove: () => void, inSheet: boolean) => {
    remove();
    requestAnimationFrame(() => {
      const list = (inSheet ? sheetTagsRef : tagsRef).current;
      const left = list ? [...list.querySelectorAll<HTMLElement>("button")] : [];
      const fallback = inSheet ? document.querySelector<HTMLElement>('[role="dialog"] button') : resultsRef.current;
      (left[Math.min(i, left.length - 2)] ?? fallback)?.focus();
    });
  };
  const tagList = (inSheet: boolean) => ticked > 0 && (
    <ul ref={inSheet ? sheetTagsRef : tagsRef} aria-label={labels.activeFilters} className={`flex flex-wrap items-center gap-2 ${inSheet ? "border-b border-hairline py-3.5" : "mb-4"}`}>
      {tags.map((t, i) => (
        <li key={t.id}>
          <button type="button" className="cg-tag" aria-label={labels.removeFilter.replace("{x}", t.label)} onClick={() => removeTag(i, t.remove, inSheet)}>
            {t.label}<X aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
          </button>
        </li>
      ))}
      <li>
        <button type="button" onClick={inSheet ? () => setF((p) => ({ ...DEFAULT_FILTERS, sort: p.sort })) : clearTags}
          className="inline-flex min-h-8 items-center px-1.5 text-[13px] underline decoration-charcoal/40 underline-offset-4 hover:decoration-charcoal">{labels.clearAll}</button>
      </li>
    </ul>
  );

  const ticks = (g: GroupDef) => <Ticks group={g} selected={sel(g.id)} count={(k) => count(g.id, k)} onTick={(k) => tick(g, k)} labels={labels} />;
  const toggle = (
    <button type="button" role="switch" aria-checked={f.availOnly} onClick={() => setAvail(!f.availOnly)}
      className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-[13px]">
      <span aria-hidden="true" className="cg-switch" />{labels.availableOnly}
    </button>
  );
  const sortSelect = (
    <label className="relative inline-flex h-[38px] items-center rounded-sm border border-charcoal/30 bg-white text-[13px]">
      <span className="sr-only">{labels.sort}</span>
      <select value={f.sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-full appearance-none bg-transparent pl-3 pr-8 text-[13px] outline-none">
        {SORTS.map((k) => <option key={k} value={k}>{labels.sortLabel.replace("{s}", labels.sorts[k])}</option>)}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 h-4 w-4" strokeWidth={1.6} />
    </label>
  );

  return (
    <>
      <ComponentStyle id="fx-catalog-grid" css={CSS} />
      <div className="cg-bar">
        <div className="wrap flex min-h-[58px] items-center gap-2 lg:min-h-[60px] lg:gap-2.5">
          <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog"
            className="inline-flex h-[38px] shrink-0 items-center gap-1.5 rounded-sm border border-charcoal-deep px-3 text-[13px] font-medium lg:hidden">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />{labels.filter}
            {ticked > 0 && <span className="cg-n">· {ticked}</span>}
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            {groups.map((g) => (
              <Drop key={g.id} label={g.label} ticked={sel(g.id).length} open={open === g.id}
                onOpen={() => setOpen(g.id)} onClose={() => setOpen((o) => (o === g.id ? null : o))}>
                {ticks(g)}
              </Drop>
            ))}
          </div>
          <div className="hidden lg:block">{toggle}</div>
          <div className="ml-auto shrink-0">{sortSelect}</div>
        </div>
      </div>

      <div className="wrap pb-28 pt-5 sm:pt-7 lg:pb-24">
        {tagList(false)}
        <p ref={resultsRef} tabIndex={-1} aria-live="polite" className="mb-4 text-[13px] text-charcoal/70 outline-none sm:mb-[18px]">{countLine}</p>
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
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgb(163_157_148/0),#a39d94_30%,#d9d3ca_50%,#a39d94_70%,rgb(163_157_148/0))]" />
                {tile}
              </aside>
            ) : null}
          </div>
        )}
      </div>

      {sheet && <Sheet labels={labels} count={shown.length} onClose={() => setSheet(false)} onClear={clear} toggle={toggle}>
        {tagList(true)}
        {groups.map((g) => <Section key={g.id} label={g.label} note={sel(g.id).length ? `· ${sel(g.id).length}` : null}>{ticks(g)}</Section>)}
        <Section label={labels.sort} note={labels.sorts[f.sort]}>
          <div className="flex flex-wrap gap-2">
            {SORTS.map((k) => <Chip key={k} on={f.sort === k} onClick={() => setSort(k)}>{labels.sorts[k]}</Chip>)}
          </div>
        </Section>
      </Sheet>}
    </>
  );
}

/**
 * One group's tick boxes: real checkboxes with their labels and counts. An
 * option at 0 is dashed and disabled unless ticked. With `search`, a box
 * above the list narrows it (the Brand panel above 8 brands).
 */
function Ticks({ group, selected, count, onTick, labels }: {
  group: GroupDef; selected: string[]; count: (key: string) => number; onTick: (key: string) => void; labels: GridLabels;
}) {
  const [q, setQ] = useState("");
  const id = useId();
  const list = group.search && q.trim() ? group.options.filter((o) => fold(o.label).includes(fold(q.trim()))) : group.options;
  return (
    <div className="grid gap-1">
      {group.search && (
        <div className="pb-1">
          <label htmlFor={`${id}-q`} className="sr-only">{labels.brandSearch}</label>
          <input id={`${id}-q`} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={labels.brandSearch} autoComplete="off"
            className="h-10 w-full rounded-sm border border-charcoal/30 bg-white px-3 text-[13px] placeholder:text-charcoal/60" />
        </div>
      )}
      {list.length === 0 && <p className="px-2.5 py-2 text-[13px] text-charcoal/70">{labels.brandNone}</p>}
      {list.map((o) => {
        const on = selected.includes(o.key);
        const n = count(o.key);
        const dead = n === 0 && !on;
        return (
          <label key={o.key} className="cg-opt" data-dead={dead || undefined}>
            <input type="checkbox" checked={on} disabled={dead} onChange={() => onTick(o.key)} />
            <span className="min-w-0">{o.label}</span>
            <span className="cg-n">{n}</span>
          </label>
        );
      })}
    </div>
  );
}

/**
 * A desktop group: the button and its panel (disclosure). Esc closes and
 * returns focus to the button; a click outside or focus leaving closes it;
 * opening another group closes it (one `open` in CatalogGrid). On opening,
 * focus moves to the panel's first control.
 */
function Drop({ label, ticked, open, onOpen, onClose, children }: {
  label: string; ticked: number; open: boolean; onOpen: () => void; onClose: () => void; children: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const el = box.current;
    pop.current?.querySelector<HTMLElement>("input:not(:disabled)")?.focus();
    const down = (e: PointerEvent) => { if (el && !el.contains(e.target as Node)) close.current(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close.current(); btn.current?.focus(); } };
    const out = (e: FocusEvent) => { const to = e.relatedTarget as Node | null; if (el && to && !el.contains(to)) close.current(); };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    el?.addEventListener("focusout", out);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); el?.removeEventListener("focusout", out); };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button ref={btn} type="button" className="cg-drop" aria-expanded={open} aria-controls={panelId} data-ticked={ticked ? "" : undefined}
        onClick={() => (open ? onClose() : onOpen())}>
        {label}{ticked > 0 && <span className="cg-n">· {ticked}</span>}
        <ChevronDown aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
      </button>
      {open && (
        <div ref={pop} id={panelId} role="group" aria-label={label} data-lenis-prevent className="cg-pop max-h-[min(60vh,360px)] overflow-auto p-1.5">{children}</div>
      )}
    </div>
  );
}

/** A phone-sheet group: a section header that opens and closes (closed by default), "· n" when ticked. */
function Section({ label, note, children }: { label: string; note: string | null; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="border-b border-hairline">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}
        className="flex min-h-12 w-full items-center gap-2 text-left">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark [:lang(ja)_&]:text-xs [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{label}</span>
        {note && <span className="cg-n">{note}</span>}
        <ChevronDown aria-hidden="true" className={`ml-auto h-4 w-4 transition-transform duration-[var(--dur-micro)] motion-reduce:transition-none ${open ? "rotate-180" : ""}`} strokeWidth={1.6} />
      </button>
      {open && <div id={id} role="group" aria-label={label} className="pb-3.5">{children}</div>}
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
    // The shared lock: body overflow + Lenis stopped (lib/scroll-lock.ts).
    const releaseScroll = lockScroll();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close.current(); return; }
      if (e.key !== "Tab" || !el) return;
      const f = [...el.querySelectorAll<HTMLElement>("button, select, input, [href]")].filter((x) => !x.hasAttribute("disabled"));
      if (!f.length) return;
      const [first, last] = [f[0], f[f.length - 1]];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); releaseScroll(); back?.focus({ preventScroll: true }); };
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
        <div data-lenis-prevent className="overflow-auto px-[clamp(18px,4vw,48px)] pb-4 pt-2">
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

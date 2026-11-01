"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";

import { Hover } from "@/components/common/robot-hover";
import { PRODUCTS } from "@/data/mocks/home";
import type { ProductCardData } from "@/data/mocks/home";

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/**
 * A result plate. Same 326×438 window and same per-item Figma crop as the
 * product card, so a piece is framed here exactly as it is framed in block 4 —
 * and it answers to the pointer the same way, with the brand-red `color-burn`
 * tint riding up from the bottom edge.
 */
const SearchResult = ({ product }: { product: ProductCardData }) => {
  const plate = useRef<HTMLDivElement>(null);

  return (
    <li className="flex flex-col gap-[1.25rem] at768:gap-[0.875rem] at390:gap-[0.625rem]">
      <div
        ref={plate}
        data-frame-cursor="light"
        className="relative isolate aspect-[326/438] w-full cursor-none overflow-hidden rounded-image"
      >
        <Image
          src={product.image}
          alt={product.alt}
          width={326}
          height={438}
          sizes="(max-width: 548px) 90vw, (max-width: 768px) 78vw, 40vw"
          className="absolute max-w-none object-cover"
          style={{
            width: product.crop.width,
            height: product.crop.height,
            left: product.crop.left,
            top: product.crop.top,
          }}
        />
        <Hover
          tag="span"
          trigger={plate}
          from={{ clipPath: "inset(100% 0 0 0)" }}
          to={{ clipPath: "inset(0% 0 0 0)" }}
          config={{ tension: 240, friction: 30 }}
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-surface-accent mix-blend-color-burn"
        />
      </div>

      <div className="flex flex-col gap-[0.5rem] font-serif whitespace-nowrap at390:whitespace-normal at390:gap-[0.25rem]">
        <h3 className="text-title font-normal leading-[1.1538] at768:text-[1.125rem] at390:text-[0.9375rem]">
          {product.name}
        </h3>
        <p className="text-label leading-normal opacity-60 at390:text-caption [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
          {product.spec}
        </p>
      </div>

      <p className="font-serif text-body leading-normal tracking-[0.02em] at390:text-caption [font-variant-numeric:tabular-nums] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
        {product.price}
      </p>
    </li>
  );
};

/**
 * Full-screen search — variant S2.
 *
 * SEARCH drops a brand-red panel over the whole page: one oversized line to
 * type on and the collection underneath as full product plates. Making it a
 * screen of its own rather than a field in the corner is the point — searching
 * becomes a gesture the size of the decision it serves.
 *
 * The plates are the ones from block 4, geometry and type scale included, so
 * the panel reads as the same shop rather than as a separate results screen.
 *
 * Before anything is typed the panel already shows the collection, so it never
 * opens as an empty red wall; typing narrows it in place.
 *
 * The drop is physical, so it is a spring (ADR-0014). Escape closes it, the
 * page underneath cannot scroll while it is up, and focus goes into the line on
 * open and back to the SEARCH button on close.
 */
export const SearchOverlay = ({ open, onClose }: SearchOverlayProps) => {
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  /** True while the panel is fully off-screen: no clicks, no tab stops. */
  const [parked, setParked] = useState(true);

  const style = useSpring({
    y: open ? 0 : -100,
    config: { mass: 1.2, tension: 190, friction: 30 },
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCTS;
    return PRODUCTS.filter((product) =>
      `${product.name} ${product.spec}`.toLowerCase().includes(q),
    );
  }, [query]);

  // Unpark before the focus effect below runs, and park again only once the
  // panel has finished travelling back up.
  useEffect(() => {
    if (open) {
      setParked(false);
      return;
    }
    const timer = window.setTimeout(() => setParked(true), 700);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open || parked) return;
    // Focusing a `visibility: hidden` field is a no-op, so this waits for the
    // commit that makes the panel visible.
    input.current?.focus();
  }, [open, parked]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Reopening starts on the collection, not on the last dead end.
      setQuery("");
    };
  }, [open, onClose]);

  return (
    <animated.div
      role="dialog"
      aria-modal="true"
      aria-label="Search the collection"
      aria-hidden={!open}
      className={`fixed inset-0 z-[90] flex flex-col bg-surface-accent px-[2rem] pb-[2rem] pt-[1.5rem] text-foreground-on-accent at768:px-[1.5rem] at768:pb-[1.5rem] at390:px-[1rem] at390:pb-[1rem] ${
        parked ? "invisible" : "visible"
      }`}
      style={{ transform: style.y.to((v) => `translateY(${v}%)`) }}
    >
      <div className="flex shrink-0 items-baseline justify-between font-display text-body font-bold uppercase tracking-[0.14em]">
        <span className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
          Halden
        </span>
        <button
          type="button"
          onClick={onClose}
          className="transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-70 [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
        >
          Close
        </button>
      </div>

      <form
        role="search"
        onSubmit={(event) => event.preventDefault()}
        className="mt-[2rem] shrink-0 border-b-[0.09375rem] border-solid border-foreground-on-accent pb-[0.875rem]"
      >
        <label className="sr-only" htmlFor="search-overlay-input">
          Search the collection
        </label>
        <input
          ref={input}
          id="search-overlay-input"
          type="search"
          autoComplete="off"
          placeholder="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent font-display text-manifesto font-bold uppercase leading-none tracking-[0.02em] at1024:text-[3.75rem] at768:text-[3rem] at390:text-[2rem] caret-current outline-none placeholder:opacity-40 [appearance:textfield] [&::-webkit-search-cancel-button]:appearance-none"
        />
      </form>

      <p
        aria-live="polite"
        className="mt-[1rem] shrink-0 font-serif text-body uppercase leading-normal tracking-[0.08em] opacity-70 [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
      >
        {query.trim()
          ? `${results.length} ${results.length === 1 ? "piece" : "pieces"}`
          : "The collection"}
      </p>

      <div className="mt-[1.25rem] min-h-0 flex-1 overflow-y-auto">
        {results.length ? (
          <ul className="grid grid-cols-4 gap-x-[1.5rem] gap-y-[2.5rem] at768:grid-cols-2 at768:gap-x-[1rem] at768:gap-y-[2rem] at390:grid-cols-2 at390:gap-x-[0.75rem] at390:gap-y-[1.5rem]">
            {results.map((product) => (
              <SearchResult key={product.name} product={product} />
            ))}
          </ul>
        ) : (
          <p className="font-serif text-title leading-normal opacity-70">
            Nothing under that name. Try a material — oak, ash, walnut.
          </p>
        )}
      </div>
    </animated.div>
  );
};

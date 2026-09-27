"use client";
import { useEffect, useState } from "react";
import { AddToCart } from "@/components/commerce/add-to-cart";
import { ComponentStyle } from "@/components/fx/component-style";
import type { Lang } from "@/lib/i18n";

/**
 * THE STICKY BUY BAR (phone and tablet product page; DESIGN.md "Sticky Buy
 * Bar", comp page-comps/product-collection). A 64px charcoal-deep bar with the
 * gold rule on top: the yen price in Pale Gilt, the exact Hub name truncated
 * under it, and the orange Add to cart.
 *
 *   when      it slides up once the page's own Add to cart (`watch`, an id)
 *             has scrolled up out of view, and back down when it returns — so
 *             there is only ever one orange action on screen. 0.9s on
 *             ease-lux; reduced motion: it simply appears.
 *   where     below `lg` only. On product pages it takes the tab bar's place
 *             (D2-6: MobileTabBar steps aside on /products/*), and the
 *             Messenger button sits above it (`data-buy-bar`, app/globals.css).
 *   never     for a Sold piece: the page does not render it at all.
 *
 * Hidden, it is `inert` and out of the accessibility tree; nothing in it can
 * be tabbed to.
 */
const CSS = `
.buybar { position: fixed; inset: auto 0 0 0; z-index: 40; transform: translateY(100%); visibility: hidden; transition: transform var(--dur-reveal) var(--ease-lux), visibility 0s linear var(--dur-reveal); }
.buybar[data-show] { transform: none; visibility: visible; transition: transform var(--dur-reveal) var(--ease-lux), visibility 0s; }
.buybar::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 1px; background: linear-gradient(90deg, rgb(201 162 39 / 0), #C9A227 25%, #E8D28A 50%, #C9A227 75%, rgb(201 162 39 / 0)); }
.buybar-price { font-variant-numeric: lining-nums tabular-nums; font-feature-settings: "lnum" 1, "tnum" 1; }
@media (min-width: 1024px) { .buybar { display: none; } }
@media (prefers-reduced-motion: reduce) { .buybar, .buybar[data-show] { transition: none; } }`;

export function BuyBar({ watch, price, name, label, variantId, slug, sku, lang }: {
  watch: string; price: string; name: string; label: string;
  variantId: string; slug: string; sku: string; lang: Lang;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(watch);
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Shown only once the button has gone ABOVE the screen: before the
    // reader reaches it, the page's own button is still ahead of them.
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.bottom < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);
  return (
    <div
      data-buy-bar
      data-show={show ? "" : undefined}
      role="region"
      aria-label={label}
      aria-hidden={show ? undefined : true}
      inert={!show}
      className="buybar band-dark flex h-[calc(64px+env(safe-area-inset-bottom))] items-start justify-between gap-3 bg-charcoal-deep pb-[env(safe-area-inset-bottom)] pl-4 pr-3 text-gold-pale"
    >
      <ComponentStyle id="fx-buybar" css={CSS} />
      <div className="grid h-16 min-w-0 content-center leading-tight">
        <b className="buybar-price font-display text-[22px] font-normal">{price}</b>
        <small className="truncate text-[11px] text-chalk/75">{name}</small>
      </div>
      <div className="flex h-16 shrink-0 items-center">
        <AddToCart variantId={variantId} slug={slug} sku={sku} availability="available" lang={lang} compact />
      </div>
    </div>
  );
}

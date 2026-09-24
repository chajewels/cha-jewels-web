"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReduced } from "@/components/fx/media";
import { ComponentStyle, mix } from "@/components/fx/component-style";

/**
 * The FAQ's category navigation: plain in-page links to each section's
 * existing id (so /faq#payments-and-layaway and every other anchor keep
 * working, and the links work before hydration). The category being read is
 * marked aria-current="location", turns gold, and a gold indicator slides to
 * it — down the side of the list from lg up, under the chip in the phone bar.
 *
 * "Being read" is the section crossing a band a third of the way down the
 * screen (IntersectionObserver). A tap marks its target at once, before the
 * scroll arrives. On phones the bar scrolls sideways to keep the current
 * chip in view — the bar only, never the page.
 *
 * Layout and colours are the page's (app/faq/page.tsx, component CSS).
 * Reduced motion: the indicator moves without sliding.
 */
export function FaqNav({ label, items }: { label: string; items: { slug: string; heading: string }[] }) {
  const [active, setActive] = useState(items[0]?.slug ?? "");
  const list = useRef<HTMLUListElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const reduced = useReduced();

  useEffect(() => {
    const sections = items.map((i) => document.getElementById(i.slug)).filter((x): x is HTMLElement => !!x);
    if (!sections.length) return;
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, { rootMargin: "-33% 0px -60% 0px" });
    sections.forEach((s) => io.observe(s));
    // Arriving on /faq#some-section marks it straight away.
    const fromHash = () => { const h = decodeURIComponent(location.hash.slice(1)); if (items.some((i) => i.slug === h)) setActive(h); };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => { io.disconnect(); window.removeEventListener("hashchange", fromHash); };
  }, [items]);

  // The indicator, and (phone bar) the current chip scrolled into view.
  useLayoutEffect(() => {
    const ul = list.current, bar = ind.current;
    const a = ul?.querySelector<HTMLElement>(`a[href="#${CSS.escape(active)}"]`);
    if (!ul || !bar || !a) return;
    const place = () => {
      bar.style.setProperty("--x", `${a.offsetLeft}px`);
      bar.style.setProperty("--w", `${a.offsetWidth}px`);
      bar.style.setProperty("--y", `${a.offsetTop}px`);
      bar.style.setProperty("--h", `${a.offsetHeight}px`);
      if (ul.scrollWidth > ul.clientWidth) {
        const left = a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2;
        ul.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
      }
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [active, reduced]);

  return (
    <nav aria-label={label} className="fx-faq-nav">
      <ul ref={list} className="fx-faq-list">
        {items.map((i) => (
          <li key={i.slug}>
            <a href={`#${i.slug}`} aria-current={i.slug === active ? "location" : undefined} onClick={() => setActive(i.slug)}>
              {i.heading}
            </a>
          </li>
        ))}
        <li aria-hidden="true" className="fx-faq-ind-li"><span ref={ind} className="fx-faq-ind" /></li>
      </ul>
    </nav>
  );
}

/**
 * THE FAQ PAGE'S LAYOUT (app/faq/page.tsx), in component CSS — and in THIS
 * client module on purpose: a stylesheet rendered by a server component is
 * sent twice, in the <head> and again in the RSC payload, and on a slow
 * phone those bytes delay the stylesheets the first paint waits for
 * (measured, docs/perf-baseline.md). Rendered from here, the page carries it
 * once; the text itself travels in this component's cached JS chunk.
 *
 * Below lg: one column — emblem, title and lede; then the category bar, sticky
 * under the site header (`--hdr-h`: the header's visible height, 0 while it
 * is hidden — components/site/header-shell.tsx); then the questions. The
 * side wrapper is `display: contents` there, so the bar is a child of the
 * whole grid and stays stuck for the length of the questions.
 *
 * lg and up: two columns. The side column (emblem, title, lede, the category
 * list) is sticky under the header and scrolls within itself if a short
 * screen cannot hold it; the questions sit beside it, unchanged.
 *
 * Sections keep their ids; scroll-margin clears the header (and the phone
 * category bar), so a jump lands on the heading, not under the chrome.
 */
const FAQ_CSS = `
.fx-faq { display: grid; grid-template-columns: minmax(0, 1fr); }
.fx-faq-side { display: contents; }
.fx-faq-head { padding-bottom: clamp(28px, 5vw, 48px); }
.fx-faq-head .fx-emblem { margin-bottom: 1.5rem; }
.fx-faq-nav { position: sticky; top: var(--hdr-h, 68px); z-index: 20; margin: 0 calc(-1 * clamp(18px, 4vw, 48px));
  background: color-mix(in srgb, var(--c-chalk) 96%, transparent); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
  transition: top var(--dur-hdr-show) var(--ease-lux); }
.fx-faq-list { position: relative; display: flex; gap: .25rem; overflow-x: auto; scrollbar-width: none; padding: 0 clamp(18px, 4vw, 48px); list-style: none; margin: 0; }
.fx-faq-list::-webkit-scrollbar { display: none; }
.fx-faq-list a { display: block; white-space: nowrap; padding: 14px 10px; font-size: .875rem; color: color-mix(in srgb, var(--c-charcoal-deep) 80%, transparent); transition: color var(--dur-micro) var(--ease-lux); }
.fx-faq-list a:hover, .fx-faq-list a[aria-current] { color: var(--c-gold-dark); }
.fx-faq-list a:focus-visible { outline: 2px solid var(--c-gold-dark); outline-offset: -2px; }
.fx-faq-ind { position: absolute; left: 0; bottom: 0; height: 2px; width: var(--w, 0px); transform: translateX(var(--x, 0px));
  background: var(--c-gold); box-shadow: 0 0 8px ${mix("gold", 55)}; pointer-events: none;
  transition: transform var(--dur-reveal) var(--ease-lux), width var(--dur-reveal) var(--ease-lux), height var(--dur-reveal) var(--ease-lux); }
.fx-faq-main { padding-top: clamp(32px, 5vw, 56px); }
.fx-faq-main > section { scroll-margin-top: 132px; }
@media (min-width: 1024px) {
  .fx-faq { grid-template-columns: minmax(0, 4fr) minmax(0, 7fr); gap: clamp(40px, 5vw, 88px); }
  .fx-faq-side { display: block; position: sticky; align-self: start; top: calc(var(--hdr-h, 68px) + 32px);
    max-height: calc(100vh - var(--hdr-h, 68px) - 56px); overflow-y: auto; scrollbar-width: thin;
    transition: top var(--dur-hdr-show) var(--ease-lux), max-height var(--dur-hdr-show) var(--ease-lux); }
  .fx-faq-head { padding-bottom: 0; }
  .fx-faq-head h1 { font-size: clamp(36px, 3.4vw, 54px); }
  .fx-faq-nav { position: static; margin: 2rem 0 0; background: none; -webkit-backdrop-filter: none; backdrop-filter: none; border: 0; }
  .fx-faq-list { display: block; padding: 0 0 0 1rem; overflow: visible; border-left: 1px solid var(--rule); }
  .fx-faq-list a { white-space: normal; padding: 7px 0; font-size: .9375rem; }
  .fx-faq-ind { left: -1px; top: 0; bottom: auto; width: 2px; height: var(--h, 0px); transform: translateY(var(--y, 0px)); }
  .fx-faq-main { padding-top: 0; }
  .fx-faq-main > section { scroll-margin-top: 92px; }
}
@media (prefers-reduced-motion: reduce) { .fx-faq-nav, .fx-faq-side, .fx-faq-ind, .fx-faq-list a { transition: none; } }`;

export function FaqStyle() {
  return <ComponentStyle id="fx-faq" css={FAQ_CSS} />;
}

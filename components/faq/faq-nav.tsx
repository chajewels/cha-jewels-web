"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReduced } from "@/components/fx/media";
import { ComponentStyle } from "@/components/fx/component-style";

/**
 * The FAQ's section index (build step 6): plain in-page links to each
 * section's existing id (so /faq#payments-and-layaway and every other anchor
 * keep working, and the links work before hydration), each with its number of
 * questions from lg up. The section being read is marked
 * aria-current="location": gold with a gold bar in the desktop list, a filled
 * chip in the phone bar.
 *
 * "Being read" is the section crossing a band a third of the way down the
 * screen (IntersectionObserver). A tap marks its target at once, before the
 * scroll arrives. On phones the bar scrolls sideways to keep the current
 * chip in view — the bar only, never the page.
 *
 * Layout and colours are the page's (app/faq/page.tsx, component CSS).
 * Reduced motion: the indicator moves without sliding.
 */
export function FaqNav({ label, items }: { label: string; items: { slug: string; heading: string; count: number; countLabel: string }[] }) {
  const [active, setActive] = useState(items[0]?.slug ?? "");
  const list = useRef<HTMLUListElement>(null);
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

  // Phone bar: keep the current chip in view (the bar scrolls, never the page).
  useLayoutEffect(() => {
    const ul = list.current;
    const a = ul?.querySelector<HTMLElement>(`a[href="#${CSS.escape(active)}"]`);
    if (!ul || !a || ul.scrollWidth <= ul.clientWidth) return;
    const left = a.offsetLeft - (ul.clientWidth - a.offsetWidth) / 2;
    ul.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
  }, [active, reduced]);

  return (
    <nav aria-label={label} className="fx-faq-nav">
      <ul ref={list} className="fx-faq-list">
        {items.map((i) => (
          <li key={i.slug}>
            <a href={`#${i.slug}`} aria-current={i.slug === active ? "location" : undefined} onClick={() => setActive(i.slug)}>
              <span>{i.heading}</span>
              <span className="fx-faq-n cj-fig" aria-label={i.countLabel}>{i.count}</span>
            </a>
          </li>
        ))}
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
.fx-faq-nav { position: sticky; top: var(--hdr-h, 68px); z-index: 20; margin: 0 calc(-1 * clamp(18px, 4vw, 48px));
  background: color-mix(in srgb, var(--c-chalk) 96%, transparent); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--rule); transition: top var(--dur-hdr-show) var(--ease-lux); }
.fx-faq-list { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding: 10px clamp(18px, 4vw, 48px); list-style: none; margin: 0; }
.fx-faq-list::-webkit-scrollbar { display: none; }
.fx-faq-list a { display: flex; align-items: center; min-height: 40px; white-space: nowrap; padding: 0 12px; font-size: .875rem; border: 1px solid #E5E5E0; border-radius: 2px; background: #fff;
  color: var(--c-charcoal-deep); transition: color var(--dur-micro) var(--ease-lux), background-color var(--dur-micro) var(--ease-lux); }
.fx-faq-list a[aria-current] { background: var(--c-charcoal-deep); border-color: var(--c-charcoal-deep); color: var(--c-chalk); }
.fx-faq-list a:focus-visible { outline: 2px solid var(--c-gold-dark); outline-offset: 2px; }
.fx-faq-n { display: none; }
.fx-faq-main { padding-top: clamp(28px, 5vw, 48px); }
.fx-faq-main > section { scroll-margin-top: 132px; }
@media (min-width: 1024px) {
  .fx-faq { grid-template-columns: 280px minmax(0, 1fr); gap: 56px; }
  .fx-faq-side { display: block; position: sticky; align-self: start; top: calc(var(--hdr-h, 68px) + 24px);
    max-height: calc(100vh - var(--hdr-h, 68px) - 48px); overflow-y: auto; scrollbar-width: thin;
    transition: top var(--dur-hdr-show) var(--ease-lux), max-height var(--dur-hdr-show) var(--ease-lux); }
  .fx-faq-nav { position: static; margin: 0; background: none; -webkit-backdrop-filter: none; backdrop-filter: none; border: 0; }
  .fx-faq-list { display: block; padding: 0; overflow: visible; border-top: 1px solid #E5E5E0; }
  .fx-faq-list a { justify-content: space-between; gap: 12px; min-height: 48px; white-space: normal; padding: 8px 4px; border: 0; border-bottom: 1px solid #E5E5E0; border-radius: 0; background: none; font-size: .875rem; line-height: 1.4; }
  .fx-faq-list a[aria-current] { background: none; color: var(--c-gold-dark); font-weight: 600; box-shadow: inset 2px 0 0 var(--c-gold-dark); padding-left: 12px; border-color: #E5E5E0; }
  .fx-faq-n { display: inline; flex: none; font-size: 12px; font-weight: 400; color: color-mix(in srgb, var(--c-charcoal) 70%, transparent); }
  .fx-faq-main { padding-top: 0; }
  .fx-faq-main > section { scroll-margin-top: 92px; }
}
@media (prefers-reduced-motion: reduce) { .fx-faq-nav, .fx-faq-side, .fx-faq-list a { transition: none; } }`;

export function FaqStyle() {
  return <ComponentStyle id="fx-faq" css={FAQ_CSS} />;
}

"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { HubImage } from "@/components/media/hub-image";
import { useHeroMotion } from "@/components/home/hero";
import { trackHeroSlideCta } from "@/lib/analytics";
import { formatMoney } from "@/lib/utils";
import type { HeroCategorySlide, HeroPiece, HeroSlide } from "@/lib/hero-deck";

/**
 * The six hero layouts (hero slider v2, owner approvals 2026-09-26; the comps
 * are ~/Code/reference/hero-comps/slider-after-v2). Each reads only what
 * lib/hero-deck.ts resolved on the server: Hub names, Hub figures, Hub photos.
 *
 *   film     the gold film, the headline, the origin clarifier, and one piece
 *            with its details stacked under it in the right-hand panel
 *   ledger   Fine Jewelry: the category photo whole, a ledger card in its sand
 *   loupe    Preloved: the photo is the hero; the piece is a loupe medallion
 *   vitrine  Branded: three lit arches, one per available piece
 *   clock    Watches: the gold ruler as a live Japan-time clock
 *   index    Accessories: a numbered index stepping with a cross-fading stage
 *
 * AT MOST ONE ORANGE ACTION PER SLIDE, and it buys or contacts: "Reserve this
 * piece" where the slide shows a piece, "Ask about availability" where it does
 * not. "Explore" is navigation, so it is the outline button.
 *
 * `mounted` gates every photo except the film slide's piece (see
 * hero-slides.tsx): a slide's images do not exist until the deck comes to it.
 */
type ViewProps = { slide: HeroSlide; index: number; lang: Lang; active: boolean; mounted: boolean };

export function HeroSlideView(props: ViewProps) {
  const s = props.slide;
  if (s.kind === "film") return <FilmView {...props} piece={s.piece} />;
  switch (s.layout) {
    case "loupe": return <LoupeView {...props} slide={s} />;
    case "vitrine": return <VitrineView {...props} slide={s} />;
    case "clock": return <ClockView {...props} slide={s} />;
    case "index": return <IndexView {...props} slide={s} />;
    default: return <LedgerView {...props} slide={s} />;
  }
}

const d = (s: number) => ({ ["--d" as string]: s }) as React.CSSProperties;
const pad = (n: number) => String(n).padStart(2, "0");

/** "K18 · 2.65g · AL3" — the Hub's facts, in the order DESIGN.md gives them. */
function specLine(p: HeroPiece, parts: ("purity" | "weight" | "stone" | "size" | "sku")[]) {
  return parts.map((k) => p[k]).filter(Boolean).join(" · ");
}

function Reserve({ piece, lang, className = "" }: { piece: HeroPiece; lang: Lang; className?: string }) {
  return <Button asChild className={`hd-btn ${className}`}><Link href={`/products/${piece.slug}`}>{tr(lang)("home", "heroReserve")}</Link></Button>;
}
function Ask({ lang, className = "" }: { lang: Lang; className?: string }) {
  return <Button asChild className={`hd-btn ${className}`}><Link href="/contact">{tr(lang)("home", "heroAsk")}</Link></Button>;
}
function Explore({ slide, dark = true }: { slide: HeroCategorySlide; dark?: boolean }) {
  return (
    <Button asChild variant="outline" className={`hd-btn ${dark ? "border-chalk/55 text-chalk hover:border-chalk hover:text-chalk" : ""}`}>
      <Link href={`/categories/${slide.slug}`} onClick={() => trackHeroSlideCta(slide.slug)}>{slide.cta}</Link>
    </Button>
  );
}
function Eyebrow({ index, text, lang }: { index: number; text?: string; lang: Lang }) {
  return <p className="hd-eyebrow hd-rise"><span className="hd-num">{pad(index + 1)}</span>{text ?? tr(lang)("home", "slideEyebrow")}</p>;
}
function Photo({ src, sizes, className }: { src: string; sizes: string; className: string }) {
  return <HubImage src={src} alt="" fill sizes={sizes} className={className} />;
}

/* ---------------- 1 · Film + piece ---------------- */
function FilmView({ lang, piece }: ViewProps & { piece: HeroPiece | null }) {
  const t = tr(lang);
  return (
    <div className="hd-view hd-film" data-nopiece={piece ? undefined : ""}>
      <div aria-hidden="true" className="hd-film-scrim" />
      <div className="hd-in">
        <div className="hd-copy">
          <p className="hd-eyebrow hd-rise">{t("home", "heroSince")}</p>
          <h1 className="hd-title">
            <span className="hd-line hd-rise" style={d(0.12)}>{t("hero", "h1a")}</span>
            <span className="hd-line hd-rise" style={d(0.24)}><span className="hd-gilt">{t("hero", "h1b")}</span></span>
          </h1>
          <p className="hd-origin hd-rise" style={d(0.36)}>{t("brand", "originNote")}</p>
        </div>
        {piece && (
          <div className="hd-panel hd-rise" style={d(0.3)}>
            <Link href={`/products/${piece.slug}`} className="hd-pimg" tabIndex={-1} aria-hidden="true">
              {piece.image && <Photo src={piece.image.url} sizes="(min-width:1024px) 340px, 100vw" className="object-contain" />}
            </Link>
            <div className="hd-pdet">
              <p className="hd-name">{piece.name}</p>
              <p className="hd-spec">{specLine(piece, ["purity", "weight", "sku"])}</p>
              <dl className="hd-cells">
                <div><dt className="hd-cellk">{t("home", "heroPurity")}</dt><dd className="hd-cellv">{piece.purity ?? "—"}</dd></div>
                <div><dt className="hd-cellk">{t("home", "heroWeight")}</dt><dd className="hd-cellv">{piece.weight ?? "—"}</dd></div>
                <div><dt className="hd-cellk">{t("home", "heroSku")}</dt><dd className="hd-cellv">{piece.sku}</dd></div>
              </dl>
              <p className="hd-price">{formatMoney(piece.priceJpy)}</p>
              <Reserve piece={piece} lang={lang} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- 2 · Ledger ---------------- */
function LedgerView({ slide, index, lang, mounted }: ViewProps & { slide: HeroCategorySlide }) {
  const lead = slide.pieces[0];
  return (
    <div className="hd-view hd-ledger" style={{ background: "#d8c9b7" }}>
      {mounted && slide.image && <div className="hd-photo-top hd-settle"><Photo src={slide.image} sizes="100vw" className="object-contain object-top" /></div>}
      <div className="hd-card hd-rise">
        <div className="hd-card-in">
          <Eyebrow index={index} lang={lang} />
          <h2 className="hd-title"><span className="hd-line hd-gilt">{slide.name}</span></h2>
          {slide.description && <p className="hd-desc">{slide.description}</p>}
          {slide.pieces.length > 0 && (
            <ul className="hd-rows">
              {slide.pieces.map((p) => (
                <li key={p.slug}>
                  <Link href={`/products/${p.slug}`} className="hd-row">
                    <span className="hd-thumb">{mounted && p.image && <Photo src={p.image.url} sizes="60px" className="object-cover" />}</span>
                    <span className="min-w-0"><span className="hd-name block truncate">{p.name}</span><span className="hd-spec block">{specLine(p, ["purity", "weight", "size"])}</span></span>
                    <span className="hd-price">{formatMoney(p.priceJpy)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="hd-acts">
            {lead ? <Reserve piece={lead} lang={lang} /> : <Ask lang={lang} />}
            <Explore slide={slide} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 3 · Loupe ---------------- */
const TICKS = Array.from({ length: 60 }, (_, i) => {
  // Rounded: Node and the browser disagree in the last digit of cos/sin, and
  // an unrounded attribute is a hydration mismatch.
  const a = (i / 60) * 2 * Math.PI, l = i % 5 ? 22 : 44, r = 297, q = (n: number) => Math.round(n * 100) / 100;
  return { x1: q(300 + r * Math.cos(a)), y1: q(300 + r * Math.sin(a)), x2: q(300 + (r - l) * Math.cos(a)), y2: q(300 + (r - l) * Math.sin(a)) };
});
function Loupe({ piece, mounted }: { piece: HeroPiece; mounted: boolean }) {
  return (
    <span className="hd-lens-wrap" aria-hidden="true">
      <span className="hd-lens">{mounted && piece.image && <Photo src={piece.image.url} sizes="150px" className="scale-[1.38] object-cover" />}</span>
      <svg viewBox="0 0 600 600" fill="none" stroke="rgb(138 107 18 / .75)" strokeWidth="5">
        <circle cx="300" cy="300" r="297" stroke="rgb(138 107 18 / .55)" strokeWidth="4" />
        {TICKS.map((k, i) => <line key={i} {...k} />)}
      </svg>
    </span>
  );
}
function LoupeView({ slide, index, lang, mounted }: ViewProps & { slide: HeroCategorySlide }) {
  const t = tr(lang);
  const p = slide.pieces[0];
  return (
    <div className="hd-view hd-loupe" style={{ background: "#cbbfb0" }}>
      {mounted && slide.image && <div className="hd-photo-top hd-settle"><Photo src={slide.image} sizes="100vw" className="object-contain object-top" /></div>}
      <div aria-hidden="true" className="hd-loupe-page" />
      <div className="hd-copy hd-pad hd-lt">
        <Eyebrow index={index} text={t("home", "heroPrelovedEyebrow")} lang={lang} />
        <h2 className="hd-title hd-rise" style={d(0.1)}><span className="hd-line hd-gilt-dk">{slide.name}</span></h2>
        {slide.description && <p className="hd-desc hd-rise" style={d(0.2)}>{slide.description}</p>}
        {p ? (
          <>
            <div className="hd-medal hd-rise" style={d(0.3)}>
              <Link href={`/products/${p.slug}`} tabIndex={-1} aria-hidden="true"><Loupe piece={p} mounted={mounted} /></Link>
              <div className="min-w-0">
                <div className="hd-top">{p.preloved && <span className="hd-badge">{t("home", "heroPrelovedBadge")}</span>}<span className="hd-name">{p.name}</span></div>
                <p className="hd-spec">{specLine(p, ["purity", "weight", "stone", "size"])}</p>
                <div className="hd-buy"><span className="hd-price">{formatMoney(p.priceJpy)}</span><Reserve piece={p} lang={lang} className="hd-medal-btn" /></div>
                <Link href={`/categories/${slide.slug}`} className="hd-tlink" onClick={() => trackHeroSlideCta(slide.slug)}>{slide.cta} →</Link>
              </div>
            </div>
            <div className="hd-bbtn hd-rise" style={d(0.4)}><Reserve piece={p} lang={lang} /></div>
          </>
        ) : (
          <div className="hd-acts hd-rise mt-6" style={d(0.3)}><Ask lang={lang} /><Explore slide={slide} dark={false} /></div>
        )}
      </div>
    </div>
  );
}

/* ---------------- 4 · Vitrine ---------------- */
function VitrineView({ slide, index, lang, mounted }: ViewProps & { slide: HeroCategorySlide }) {
  const niches = [0, 1, 2].map((i) => ({ piece: slide.pieces[i] ?? null, photo: slide.pieces[i] ? null : slide.gallery[i] ?? null }));
  return (
    <div className="hd-view hd-vitrine">
      <div aria-hidden="true" className="hd-ground" />
      <div className="hd-in">
        <div className="hd-v-copy">
          <Eyebrow index={index} lang={lang} />
          <h2 className="hd-title hd-rise" style={d(0.1)}><span className="hd-line hd-gilt">{slide.name}</span></h2>
          {slide.description && <p className="hd-desc hd-rise" style={d(0.2)}>{slide.description}</p>}
        </div>
        <div className="hd-vit hd-rise" style={d(0.2)}>
          {niches.map(({ piece, photo }, i) => {
            const img = piece?.image?.url ?? photo;
            const arch = (
              <span className="hd-arch block"><span className="hd-arch-in hd-stone block">{mounted && img && <Photo src={img} sizes="(min-width:1024px) 200px, 30vw" className="object-cover" />}</span></span>
            );
            return (
              <div key={i} className="hd-niche" data-mid={i === 1 ? "" : undefined}>
                {piece ? (
                  <Link href={`/products/${piece.slug}`} className="block">
                    {arch}
                    <span className="hd-ncap block"><span className="block truncate">{piece.name}</span><em className="hd-num">{[piece.brand, formatMoney(piece.priceJpy)].filter(Boolean).join(" · ")}</em></span>
                  </Link>
                ) : (
                  <div aria-hidden="true">{arch}<span className="hd-ncap block">&nbsp;</span></div>
                )}
              </div>
            );
          })}
          <span aria-hidden="true" className="hd-shelf" />
        </div>
        <div className="hd-acts hd-v-acts hd-rise" style={d(0.3)}><Ask lang={lang} /><Explore slide={slide} /></div>
      </div>
    </div>
  );
}

/* ---------------- 5 · Clock ---------------- */
const RULER = Array.from({ length: 121 }, (_, i) => ({ x: (i / 120) * 1000, h: i % 10 === 0 ? 26 : i % 5 === 0 ? 16 : 8 }));
function Ruler({ stroke }: { stroke: string }) {
  return (
    <svg viewBox="0 0 1000 26" preserveAspectRatio="none" stroke={stroke} strokeWidth="1" aria-hidden="true">
      {RULER.map((r, i) => <line key={i} x1={r.x} x2={r.x} y1={26 - r.h} y2={26} vectorEffect="non-scaling-stroke" />)}
      <line x1="0" x2="1000" y1="25.5" y2="25.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
const TOKYO = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * THE LIVE JAPAN-TIME RULER. The readout is Tokyo's hour and minute
 * (Asia/Tokyo), set once a minute on the minute. The gold hand sweeps the
 * 120-tick ruler once a minute and the ticks it has passed brighten: a
 * transform on the hand and a two-layer reveal for the lit trail, so no
 * layout work per frame. The frame loop runs only while this slide is up and
 * the hero may move (on screen, tab visible, not paused, no reduced motion).
 * Under reduced motion the hand and trail are not drawn at all and only the
 * readout changes, once a minute. The server renders "--:--": the page is
 * cached for 60 s, so a server time would be wrong by the time it is read.
 */
function HeroClock({ lang, run, still }: { lang: Lang; run: boolean; still: boolean }) {
  const t = tr(lang);
  const [hm, setHm] = useState<string | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const hand = useRef<HTMLDivElement>(null);
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const now = new Date();
      setHm(TOKYO.format(now));
      timer = window.setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 20);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!run || still) return;
    let frame = 0;
    const paint = () => {
      const now = new Date();
      const p = (now.getSeconds() + now.getMilliseconds() / 1000) / 60;
      const w = track.current?.clientWidth ?? 0;
      if (hand.current) hand.current.style.transform = `translateX(${p * w}px)`;
      if (outer.current) outer.current.style.transform = `translateX(${(p - 1) * 100}%)`;
      if (inner.current) inner.current.style.transform = `translateX(${(1 - p) * 100}%)`;
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [run, still]);

  return (
    <>
      <p className="hd-readout hd-rise" style={d(0.4)} aria-label={`${t("home", "heroClockLabel")} ${hm ?? ""}`}>
        <span aria-hidden="true">{t("home", "heroClockCity")}</span>
        <b className="hd-num" aria-hidden="true"><time>{hm ?? "--:--"}</time></b>
        <span aria-hidden="true">{t("home", "heroClockZone")}</span>
      </p>
      <div ref={track} className="hd-track hd-rise" style={d(0.4)} data-still={still ? "" : undefined} aria-hidden="true">
        <Ruler stroke="rgb(232 210 138 / .32)" />
        <div ref={outer} className="hd-trail"><div ref={inner}><Ruler stroke="rgb(232 210 138 / .9)" /></div></div>
        <div ref={hand} className="hd-hand" />
      </div>
    </>
  );
}
function ClockView({ slide, index, lang, active, mounted }: ViewProps & { slide: HeroCategorySlide }) {
  const { rotateOn, reduced } = useHeroMotion();
  return (
    <div className="hd-view hd-clock">
      <div aria-hidden="true" className="hd-ground" />
      <div className="hd-clock-photo hd-stone hd-settle">{mounted && slide.image && <Photo src={slide.image} sizes="(min-width:1024px) 58vw, 100vw" className="object-cover" />}</div>
      <div className="hd-copy hd-pad">
        <Eyebrow index={index} lang={lang} />
        <h2 className="hd-title hd-rise" style={d(0.1)}><span className="hd-line hd-gilt">{slide.name}</span></h2>
        {slide.description && <p className="hd-desc hd-rise" style={d(0.2)}>{slide.description}</p>}
        <div className="hd-acts hd-rise" style={d(0.3)}><Ask lang={lang} /><Explore slide={slide} /></div>
      </div>
      <div className="hd-layer"><div className="hd-in">{mounted && <HeroClock lang={lang} run={active && rotateOn} still={reduced} />}</div></div>
    </div>
  );
}

/* ---------------- 6 · Index ---------------- */
const INDEX_EVERY_MS = 1800;
function IndexView({ slide, index, lang, active, mounted }: ViewProps & { slide: HeroCategorySlide }) {
  const t = tr(lang);
  const { rotateOn } = useHeroMotion();
  const labels = [t("home", "heroAcc1"), t("home", "heroAcc2"), t("home", "heroAcc3"), t("home", "heroAcc4")];
  const [k, setK] = useState(0);
  // Steps only while this slide is up and the hero may move; under reduced
  // motion (rotateOn is false) it holds on 01.
  useEffect(() => {
    if (!active || !rotateOn) return;
    const id = setInterval(() => setK((x) => (x + 1) % labels.length), INDEX_EVERY_MS);
    return () => clearInterval(id);
  }, [active, rotateOn, labels.length]);
  useEffect(() => { if (!active) setK(0); }, [active]);
  return (
    <div className="hd-view hd-index">
      <div aria-hidden="true" className="hd-ground" />
      <div className="hd-layer"><div className="hd-in">
        <div className="hd-stage hd-settle" aria-hidden="true">
          {labels.map((l, i) => {
            const img = slide.gallery[i] ?? slide.image;
            return (
              <div key={l} className="hd-sph hd-stone" data-on={i === k ? "" : undefined}>
                {mounted && img && <Photo src={img} sizes="(min-width:1024px) 540px, 100vw" className="object-cover" />}
                <p className="hd-stage-cap"><em className="hd-num">{pad(i + 1)}</em>{l}</p>
              </div>
            );
          })}
        </div>
      </div></div>
      <div className="hd-copy hd-pad">
        <Eyebrow index={index} lang={lang} />
        <h2 className="hd-title hd-rise" style={d(0.1)}><span className="hd-line hd-gilt">{slide.name}</span></h2>
        {slide.description && <p className="hd-desc hd-rise" style={d(0.2)}>{slide.description}</p>}
        <ol className="hd-idx hd-rise" style={d(0.25)}>
          {labels.map((l, i) => <li key={l} data-on={i === k ? "" : undefined}><span className="hd-n hd-num">{pad(i + 1)}</span><span className="hd-t">{l}</span><span className="hd-a" aria-hidden="true" /></li>)}
        </ol>
        <div className="hd-acts hd-rise" style={d(0.35)}><Ask lang={lang} /><Explore slide={slide} /></div>
      </div>
    </div>
  );
}

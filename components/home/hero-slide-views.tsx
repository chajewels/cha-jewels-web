"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { HubImage } from "@/components/media/hub-image";
import { useHeroMotion } from "@/components/home/hero";
import { trackHeroSlideCta } from "@/lib/analytics";
import { formatMoney } from "@/lib/utils";
import { HERO_TURN } from "@/lib/motion";
import type { HeroCategorySlide, HeroPiece, HeroSlide } from "@/lib/hero-deck";

/**
 * THE HERO SLIDES (hero v3, owner approvals 2026-09-26; the comps are
 * ~/Code/reference/hero-comps/slider-v3). Each reads only what lib/hero-deck.ts
 * resolved on the server: Hub names, Hub prices, Hub photos and cut-outs.
 *
 *   film   the gold film alone: the founding line, the headline and the origin
 *          clarifier. No piece and no panel.
 *   stage  every category: a dark stage with a warm pool of light and a gold
 *          floor, and up to three pieces standing on it. Watches stand on the
 *          live Tokyo ruler instead of the floor; accessories add the Index.
 *
 * THE PIECES. A trio stands featured-in-the-centre with the other two set
 * back (smaller, raised, dimmer); a duo and a single stand on their own. There
 * is never an empty place. Each piece is its cut-out when the Hub has one fit
 * to show, else its whole photo in a framed well, never cropped. Under each
 * piece, the Hub name and price on one small line, linking to its page; on a
 * phone only the featured piece's line shows, under the stage.
 *
 * THE TRIO TURNS every HERO_TURN s while the slide is up and the hero may
 * move: each piece takes the next place to the right, and the one leaving the
 * right edge fades out and back in on the left. The orange "Reserve" follows
 * the featured piece. Float, the light crossing each cut-out, the reflection
 * and the turn are app/globals.css "HERO v3"; all of it stops under reduced
 * motion and with the pause button.
 *
 * TEXT SIDES ALTERNATE: left on slides 1, 3, 5, right on 2, 4, 6 (`side`, from
 * the slide's place in the deck). Phones always stack the stage above the text.
 *
 * AT MOST ONE ORANGE ACTION PER SLIDE, and it reserves or asks: "Reserve this
 * piece" for the featured piece where the deck says so, "Ask about
 * availability" everywhere else. "Explore" is navigation: the outline button.
 *
 * `mounted` gates every photo (see hero-slides.tsx): a slide's images do not
 * exist until the deck comes to it, so nothing here competes with the film's
 * poster for the first paint.
 */
type ViewProps = {
  slide: HeroSlide;
  index: number;
  lang: Lang;
  active: boolean;
  mounted: boolean;
  side: "left" | "right";
  /** The trio may turn now: this slide is up, the hero may move, and nobody is holding the deck. */
  turning: boolean;
};

export function HeroSlideView(props: ViewProps) {
  const s = props.slide;
  if (s.kind === "film") return <FilmView lang={props.lang} />;
  return <StageView {...props} slide={s} />;
}

const d = (s: number) => ({ ["--d" as string]: s }) as React.CSSProperties;
const pad = (n: number) => String(n).padStart(2, "0");

function Reserve({ piece, lang }: { piece: HeroPiece; lang: Lang }) {
  return <Button asChild className="hd-btn"><Link href={`/products/${piece.slug}`}>{tr(lang)("home", "heroReserve")}</Link></Button>;
}
function Ask({ lang }: { lang: Lang }) {
  return <Button asChild className="hd-btn"><Link href="/contact">{tr(lang)("home", "heroAsk")}</Link></Button>;
}
function Explore({ slide }: { slide: HeroCategorySlide }) {
  return (
    <Button asChild variant="outline" className="hd-btn border-chalk/55 text-chalk hover:border-chalk hover:text-chalk">
      <Link href={`/categories/${slide.slug}`} onClick={() => trackHeroSlideCta(slide.slug)}>{slide.cta}</Link>
    </Button>
  );
}

/* ---------------- 1 · The film, alone ---------------- */
function FilmView({ lang }: { lang: Lang }) {
  const t = tr(lang);
  return (
    <div className="hd-view hd-film">
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
      </div>
    </div>
  );
}

/* ---------------- 2–6 · The stage ---------------- */

/**
 * The place piece `j` of `n` stands in after `k` turns. Places run left to
 * right (0, 1, 2); in a trio the centre (1) is featured and the first piece
 * starts there, so the Hub's first piece is the first one featured.
 */
function placeOf(j: number, n: number, k: number): number {
  return n === 3 ? (j + 1 + k) % 3 : j;
}
function isFeatured(place: number, n: number): boolean {
  return n === 3 ? place === 1 : place === 0;
}

/** The sizes hint for a piece's photo: a trio's place is about a third of the stage, a single piece's about 60%. */
const PIECE_SIZES = "(min-width:1024px) 400px, 60vw";

function PiecePhoto({ piece, mounted }: { piece: HeroPiece; mounted: boolean }) {
  if (piece.cutout) {
    const src = piece.cutout.url;
    return (
      <>
        <span className="hd-cut">{mounted && <HubImage src={src} alt="" fill sizes={PIECE_SIZES} className="object-contain object-bottom" />}</span>
        {/* The light: the same image again (same URL, same sizes, so the
            browser fetches it once), brightened, seen only through a band
            that crosses the piece. Where the cut-out is transparent there is
            nothing to brighten, so the light touches the metal only. */}
        <span className="hd-swc" aria-hidden="true"><span className="hd-sw"><span className="hd-sw-in">
          {mounted && <HubImage src={src} alt="" fill sizes={PIECE_SIZES} className="object-contain object-bottom" />}
        </span></span></span>
      </>
    );
  }
  // No cut-out fit to show: the WHOLE photo, contained in a framed well.
  return (
    <span className="hd-well"><span>
      {mounted && piece.photo && <HubImage src={piece.photo.url} alt="" fill sizes={PIECE_SIZES} className="object-contain" />}
    </span></span>
  );
}

function StageView({ slide, index, lang, active, mounted, side, turning }: ViewProps & { slide: HeroCategorySlide }) {
  const t = tr(lang);
  const { rotateOn, reduced } = useHeroMotion();
  const pieces = slide.pieces;
  const n = pieces.length;
  // Turns taken since this slide came up. Only a trio turns.
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!turning || n !== 3) return;
    const id = setInterval(() => setK((x) => x + 1), HERO_TURN * 1000);
    return () => clearInterval(id);
  }, [turning, n]);
  // Every visit starts from the Hub's first piece in the centre.
  useEffect(() => { if (!active) setK(0); }, [active]);

  const places = pieces.map((_, j) => placeOf(j, n, k));
  const featured = pieces[places.findIndex((p) => isFeatured(p, n))] ?? null;
  // The piece that has just crossed from the right edge to the left: it fades
  // out and in rather than sliding back across the others.
  const wraps = (j: number) => n === 3 && k > 0 && places[j] === 0;

  const labels = [t("home", "heroAcc1"), t("home", "heroAcc2"), t("home", "heroAcc3"), t("home", "heroAcc4")];
  const index0 = slide.layout === "index" && n === 0;
  const priceOf = (p: HeroPiece) => formatMoney(p.priceJpy);

  return (
    <div className="hd-view hd-v3" data-side={side} data-layout={slide.layout} data-count={n}>
      <div aria-hidden="true" className="hd-pool" />

      <div className="hd-stage hd-settle" data-count={n}>
        {slide.layout === "clock"
          ? mounted && <HeroClock lang={lang} run={active && rotateOn} still={reduced} />
          : n > 0 && <span aria-hidden="true" className="hd-floor" />}

        {pieces.map((p, j) => (
          <div
            key={p.slug}
            className="hd-pc"
            data-place={places[j]}
            data-feat={isFeatured(places[j], n) ? "" : undefined}
            data-wrap={wraps(j) ? "" : undefined}
            style={{ ["--i" as string]: j }}
          >
            {/* The picture is a pointer target; the caption below is the
                piece's link for the keyboard and screen readers. */}
            <Link href={`/products/${p.slug}`} className="hd-body" tabIndex={-1} aria-hidden="true">
              <span className="hd-shadow" />
              <span className="hd-fl"><PiecePhoto piece={p} mounted={mounted} /></span>
              {p.cutout && (
                <span className="hd-refl">
                  <span>{mounted && <HubImage src={p.cutout.url} alt="" fill sizes={PIECE_SIZES} className="object-contain object-bottom" />}</span>
                </span>
              )}
            </Link>
          </div>
        ))}

        {pieces.map((p, j) => (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            className="hd-cap"
            data-place={places[j]}
            data-feat={isFeatured(places[j], n) ? "" : undefined}
            data-wrap={wraps(j) ? "" : undefined}
          >
            <span className="hd-cap-nm">{p.name}</span>
            <span className="hd-cap-pr">{priceOf(p)}</span>
          </Link>
        ))}

        {/* Phone: the featured piece's line alone, under the stage; it
            cross-fades (a new key) each time the trio turns. */}
        {featured && (
          <Link key={featured.slug} href={`/products/${featured.slug}`} className="hd-pcap" tabIndex={-1} aria-hidden="true">
            <span className="hd-cap-nm">{featured.name}</span>
            <span className="hd-cap-pr">{priceOf(featured)}</span>
          </Link>
        )}

        {/* Accessories with nothing in stock: the Index IS the stage, every
            row marked coming soon (home.heroComingSoon). No empty stage, no stand-in. */}
        {index0 && (
          <ol className="hd-bigidx">
            {labels.map((l, i) => (
              <li key={l}><span className="hd-bn hd-num" aria-hidden="true">{pad(i + 1)}</span><b>{l}</b><em>{t("home", "heroComingSoon")}</em></li>
            ))}
          </ol>
        )}
      </div>

      <div className="hd-copy3">
        <p className="hd-eyebrow hd-rise"><span className="hd-num">{pad(index + 1)}</span>{slide.caller}</p>
        <h2 className="hd-title hd-rise" style={d(0.1)}><span className="hd-line hd-gilt">{slide.name}</span></h2>
        {slide.description && <p className="hd-desc hd-rise" style={d(0.2)}>{slide.description}</p>}
        {/* The approved Index as the legend for the pieces: stock per type,
            the featured piece's row lit. */}
        {slide.layout === "index" && n > 0 && slide.counts && (
          <ol className="hd-idx hd-rise" style={d(0.25)}>
            {labels.map((l, i) => (
              <li key={l} data-on={featured?.type === i ? "" : undefined}>
                <span className="hd-n hd-num" aria-hidden="true">{pad(i + 1)}</span>
                <span className="hd-t">{l}</span>
                <em className="hd-num">{slide.counts![i] ? t("home", "heroAccCount", { n: String(slide.counts![i]) }) : t("home", "heroComingSoon")}</em>
              </li>
            ))}
          </ol>
        )}
        <div className="hd-acts hd-rise" style={d(0.3)}>
          {slide.action === "reserve" && featured ? <Reserve piece={featured} lang={lang} /> : <Ask lang={lang} />}
          <Explore slide={slide} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- 5 · The live Tokyo ruler ---------------- */
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
 * THE LIVE JAPAN-TIME RULER, which is the watches' floor. The readout is
 * Tokyo's hour and minute (Asia/Tokyo), set once a minute on the minute. The
 * gold hand sweeps the 120-tick ruler once a minute and the ticks it has
 * passed brighten: a transform on the hand and a two-layer reveal for the lit
 * trail, so no layout work per frame. The frame loop runs only while this
 * slide is up and the hero may move. Under reduced motion the hand and trail
 * are not drawn at all and only the readout changes, once a minute. The
 * server renders "--:--": the page is cached for 60 s, so a server time would
 * be wrong by the time it is read.
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
      <p className="hd-readout" aria-label={`${t("home", "heroClockLabel")} ${hm ?? ""}`}>
        <span aria-hidden="true">{t("home", "heroClockCity")}</span>
        <b className="hd-num" aria-hidden="true"><time>{hm ?? "--:--"}</time></b>
        <span aria-hidden="true">{t("home", "heroClockZone")}</span>
      </p>
      <div ref={track} className="hd-track" data-still={still ? "" : undefined} aria-hidden="true">
        <Ruler stroke="rgb(232 210 138 / .38)" />
        <div ref={outer} className="hd-trail"><div ref={inner}><Ruler stroke="rgb(232 210 138 / .9)" /></div></div>
        <div ref={hand} className="hd-hand" />
      </div>
    </>
  );
}

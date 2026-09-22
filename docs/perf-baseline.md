# Performance baseline — 2026-09-22

Attempted for the UI performance audit (`perf/ui-audit-a`), against **production**
(`https://www.chajewelsjp.com`), before any change on that branch.

## What ran, and what did not

**The full matrix did not run.** The intent was Lighthouse 12.8.2, mobile and
desktop, three runs each, on `/`, one collection and one product — median and
range. Headless Chrome is present and Lighthouse works **as a standalone
command**, but every attempt to run it inside a shell loop in this environment
produced no report file: the nested `npx` spawn fails silently under the
sandbox this repo's tooling runs in. Two shapes were tried (a background
`nohup` script and a foreground loop) and both failed the same way; a single
direct invocation succeeded every time.

So the numbers below are **one run, not a median**, and they are recorded as
that. They are a reference point, not a baseline to test a hypothesis against.

| preset | path | runs | Performance | LCP | notes |
|---|---|---|---|---|---|
| desktop | `/` | **1** | 95 | 1115 ms | single verified run |
| desktop | `/collections/bracelets` | 0 | — | — | not captured |
| desktop | product page | 0 | — | — | not captured |
| mobile | all three | 0 | — | — | not captured |

## How to complete it

Run each of these on its own, one command per invocation — the loop is what
fails, not Lighthouse:

```
npx lighthouse@12 <url> --only-categories=performance \
  --output=json --output-path=<file> --quiet \
  --chrome-flags="--headless=new --no-sandbox"          # mobile is the DEFAULT
npx lighthouse@12 <url> --preset=desktop  …             # desktop
```

There is no `--preset=mobile`; mobile is the default emulation and passing that
value is rejected outright. That mistake cost the first two attempts here and is
worth writing down.

## What the branch changed, and what to watch

The four commits on `perf/ui-audit-a` target bytes and main-thread work on the
homepage specifically:

- the hero clip is no longer fetched at all unless something decides to play it
  — watch **total byte weight** and **LCP** on `/` on a cold mobile load;
- the homepage streams its shell and hero without waiting on FX, testimonials
  or arrivals — watch **TTFB** and **FCP** on `/`;
- hero, collection and search images go through `next/image` with real `sizes`
  — watch **total byte weight** on `/` and on a collection;
- the hero rotation and the testimonial marquee stop when off screen — watch
  **TBT** and long-task count while scrolled down the homepage.

A rerun on the preview deployment with the same three URLs would make the
before/after comparison the audit asked for. It is not in this PR.

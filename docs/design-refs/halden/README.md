# halden — fetched sources (GetLayers MCP, 2026-11-01, `getlayers_source`, per file; the template zip was not spent)

Template `halden` (same family as Lumière: Instrument Serif, spring-text-engine, cream paper, no WebGL).
Used for P3 (docs/tasks/lumiere-redesign.md §7): the recolouring fixed header, the full-screen search
overlay and the giant footer wordmark. Files, verbatim from `templates/halden/`:

| file | used for |
|---|---|
| `site-header.tsx` | the fixed bar sampling `[data-header-accent]` panels under its midline and flipping tone — ported as `components/lumiere/site/site-header.tsx` (`data-chrome-tone` panels) |
| `search-overlay.tsx` | the spring-dropped full-screen search (one oversized line, results under it, Escape, focus in/out, scroll held) — ported as `components/lumiere/site/search-overlay.tsx` on the existing `/api/search` combobox logic |
| `footer-section.tsx` | the letter-spaced wordmark filling the footer's base (`LetterReveal`), columns arriving by `Inview` — the wordmark joins `components/lumiere/footer/footer-section.tsx` |
| `nav-item.tsx` | the N5 nav item: a bar wiping in behind the word and the type flipping tone — the hover for the fixed header's labels |

Contract (as the template's AGENTS/ADR-0014 states it): the colour flip is a discrete two-state swap on
token timing (a CSS transition, the one allowed exception); the search drop and the nav bar are springs;
composition and motion preserved, skin (tokens, copy, type) ours. Preview: https://www.getlayers.ai/?layer=halden

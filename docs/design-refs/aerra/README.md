# aerra — fetched sources (GetLayers MCP, 2026-11-01, `getlayers_source`, per file; the template zip was not spent)

Used for P4 (docs/tasks/lumiere-redesign.md §7): "Numbers resolving out of blur as they finish counting" on About / why-cha-jewels.

| file | what it is |
|---|---|
| `numbers-section.tsx.txt` | the section: eyebrow, a word-staggered heading, a subtitle and three stats, each rising in (`Inview`, `fadeUp`) |
| `counter-value.tsx.txt` | the count-up whose blur is derived from the SAME spring as the number (`filter: blur((1 - p) × 0.75rem)`), so the digits sharpen exactly as they stop |

Port: `components/lumiere/common/resolve-number.tsx` + `.lm-fig` in `app/lumiere/pages.css` — the blur-resolve and the rise on a CSS view timeline. The count-up itself is NOT used: the figures on About (the record's years) and Why (the ordinals) are final values, and nothing here pretends a year was ever another number. Colonnade (the other reference named for these pages) is the home's own `components/lumiere/why/why-section.tsx`, mounted on `/why-cha-jewels`.

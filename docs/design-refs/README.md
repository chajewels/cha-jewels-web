# Design references (GetLayers, fetched 2026-11-01 via the GetLayers MCP)

Reference sources for the sections Lumière does not cover (docs/tasks/lumiere-redesign.md §7).
Each folder holds the materialized source verbatim plus `CONTRACT.md` with the asset's
`contract.preserve` notes. Preserve = motion and composition; mutable = skin. The port lives in
`components/lumiere/**`, re-skinned to the Lumière tokens, with the dev control panels,
`localStorage` and Google Fonts stripped.

| id | type | used for |
|---|---|---|
| `carousel-spotlight` | section (single HTML master, `target: next`) | New arrivals ring |
| `cards-almanac` | section | Testimonials stack; EN layaway steps |
| `colonnade` | section | Why/services columns (values fold) |
| `brewns` | template — `src/components/ui/digit-roll.tsx` + its `Inview` only | Calculator digit roll |

| `halden` | template — header, search overlay, footer, nav item only | P3: the recolouring header, the full-screen search, the giant footer wordmark |
| `halcyon-gate` | scene (`target: next`) | P3: the layaway band's scene, tinted through CONFIG (`TINT.md`) |
| `slider-slipstream` | the owner's prompt (`owner-prompt.md`) | P4: the customer-stories belt |
| `aerra` | template — numbers section, counter only | P4: numbers resolving out of blur (About, Why) |
| `herbier-blanc` | template — stack block (contract), envelope | P4: the product page's sheets and the gated certificate envelope |

`lumiere-master-prompt.md` is the owner-supplied single-file recreation of Lumière: the fidelity
checklist for the home (P2) — the Next source wins for the port, the prompt is what we check against.
The Brewns template zip was not spent (3/day cap); only the two files were fetched.

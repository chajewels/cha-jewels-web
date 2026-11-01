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

`lumiere-master-prompt.md` is the owner-supplied single-file recreation of Lumière: the fidelity
checklist for the home (P2) — the Next source wins for the port, the prompt is what we check against.
The Brewns template zip was not spent (3/day cap); only the two files were fetched.

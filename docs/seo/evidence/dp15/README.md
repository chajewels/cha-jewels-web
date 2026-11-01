# DP-15 local experiment evidence (2026-11-01)

| File | Status | What it is |
|---|---|---|
| `run4.json` / `run4.log` | **AUTHORITATIVE** (harness `scripts/sitemap-experiments/run.mjs` at the commit of this folder) | all 12 required experiments, 278 s, exit 0 |
| `run3.json` / `run3.log` | HISTORICAL, invalid for R/V | R ran without the stub's environment (`next start` read `.env.local`, whose Hub variables are empty, so the tolerant path ran); E4 expectation was too narrow |
| `run2.log` | HISTORICAL, aborted | the harness aborted after E1 on a stale keep-alive socket and correctly reported every later experiment as NOT RUN |
| `run1-*-HISTORICAL.json` | HISTORICAL | first harness: no exact-set comparison, no proof the upstream failure was reached, recovery measured as retained output |
Original failed observations are kept as they were.

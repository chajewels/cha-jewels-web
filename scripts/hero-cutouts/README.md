# Hero cut-outs — the original tool, on a schedule

Hero auto cut-out PR 4 of 5. Plan: `~/Code/reference/hero-comps/AUTO-HERO-CUTOUT.md`.

**Owner rule 2026-09-28:**
- The storefront **hero** shows only cut-outs made by this tool.
- **Product** pages and cards use the Hub's Photoroom cut-outs or the normal photo.
- The two never mix (`scripts/check-cutouts.mjs`).

| File | What |
|---|---|
| `pipeline.py` | `cut()` = the approved 2026-09-26 `process.py`, line for line: BiRefNet-general via rembg, CPU, `post_process_mask=True`, extra objects / edge fade / coverage, trim, ≤ 900 px, WebP q86 |
| `qa.py` | the checks added 2026-09-28. Each can only **hold** a photo. See the table below |
| `run.py` | one run: every in-stock piece of every hero category, ≤ 4 photos, Hub order → cut what the Hub does not have yet → POST to the hero-only record |
| `selftest.py` | before every run: model sha256, and AL112 re-cut vs the approved file |
| `requirements.txt` | every package pinned (the proven environment) |
| `tests/` | the checks on real photos (no model needed): `python -m unittest discover -s scripts/hero-cutouts/tests` |

## The added checks (`qa.py`)

| Flag | Rule | Real case |
|---|---|---|
| `low_res:WxH` | long side < 1200 px | N3940, W1451 (~440 px): held once, never re-cut |
| `interior_hole:x` | a hole inside the piece where the original shows the piece: (a) colour the backdrop does not have, or (b) a small hole whose colour continues its rim over a surface ≥ 40× the hole | C0853 photo 2: a dial bite. Real openings pass: ring centres, the open heart, the cross, strap gaps |
| `relative_coverage:x` | a photo after the first keeps < 25 % of the main photo's coverage | W2527 photo 2: a sliver |

Calibration covered 54 real photos:
- the 22 approved bundled cut-outs;
- the 28 photos of the test run;
- W1282's 4 photos.

It holds exactly the known defects and no approved or good photo. The one owner-approved exception is R3110, which is under 1200 px.

The margin on rule (b) is about 2× each way: the largest real opening scores 18.8, and C0853 scores 84. That is one reason the Hub ships **approval-first**.

## Once per source

The Hub's record is keyed by the photo URL and its sha256.
- An unchanged photo is never cut again, whatever its status. A held photo stays held, and an owner decision stands.
- A replaced photo is a new job.

## Running it

The workflow `.github/workflows/hero-cutouts.yml` runs every 30 minutes, and on demand (Actions → Hero cut-outs → Run workflow, with an optional dry run).

Secrets: repo → Settings → Secrets and variables → Actions.
- `HUB_API_URL` and `HUB_API_KEY`: the Website API, as the site uses it.
- `HERO_CUTOUT_KEY`: the same value as the Hub's edge secret.

If a secret is missing, the run stops with a message and does nothing. If the Hub endpoint is not deployed yet (404), the run stops before cutting anything.

Local proof, read-only (no secrets):
```
python run.py --dry-run --catalog-json stock.json --out DIR
```

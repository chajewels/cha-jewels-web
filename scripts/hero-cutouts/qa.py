"""The checks ADDED to the original tool on 2026-09-28 (owner decision; plan
AUTO-HERO-CUTOUT.md §2 "What this means for automation").

The original checks (pipeline.py, verbatim from process.py) let two bad photos
through on the 2026-09-28 test run: a hole through C0853's dial (photo 2) and
W2527's interior shot cut down to a sliver (photo 2). These three are added on
top; each can only HOLD a photo (needs_review), never pass one, and none of
them changes a pixel:

  1. low_res            the source's long side is under 1200 px (README rule 4,
                        applied by hand until now). N3940 and W1451 (~440 px)
                        are held by it — for good: they have no larger photo.
  2. interior_hole      part of the piece erased from INSIDE its outline. A hole
                        the mask leaves inside the piece is an erasure when the
                        ORIGINAL photo shows the piece there: (a) colour the
                        backdrop does not have, or (b) a small hole whose colour
                        continues its rim over a surface far larger than it (a
                        white dial on a white backdrop). A real opening (a
                        ring's centre, an open heart, a cross's cut-outs, a
                        gap between strap and case) shows the backdrop, maybe
                        in shadow, inside a thin rim. The same two rules as
                        the Hub's Photoroom check (la-tracking
                        docs/MEDIA-CUTOUTS.md §5), recalibrated for BiRefNet.
  3. relative_coverage  a photo after the first keeps far less of the piece
                        than the main photo (coverage < 25 % of photo 1's).

Every threshold below was calibrated on all 54 real photos (the 22 approved
bundled cut-outs, the 28 of the 2026-09-28 test run, W1282's 4): see
tests/test_qa.py and ~/Code/reference/hero-comps/pr4/calib/.
"""
from __future__ import annotations

import numpy as np
from PIL import Image
from scipy import ndimage

LOW_RES_LONG_SIDE = 1200
RELATIVE_COVERAGE_MIN = 0.25

GRID = 256  # the hole check runs on this grid (long side), whatever the photo's size
HOLE_MIN_CELLS = 4  # smaller holes are anti-aliasing / JPEG specks
# (a) the original shows COLOUR there that the backdrop does not have (the piece),
#     not just a brightness change (a shadowed gap, W1282 photo 3).
CHROMA_DE = 12.0
CHROMA_SHARE = 0.5
# (b) the cut ran through ONE surface: a small hole whose colour continues its rim
#     over a surface far larger than the hole — a dial (C0853 photo 2: rim 0.48,
#     surface 84× the hole). Real openings stay far below (largest seen: 18.8×,
#     C1395 photo 4's link gap, approved).
SMALL_HOLE = 0.02  # of the piece; bigger holes are openings (ring centres, open hearts)
RIM_DE = 10.0
RIM_MATCH = 0.4
SURFACE_RATIO = 40.0
ERASED_MIN_SHARE_OF_PIECE = 0.001  # erasures adding up to at least 0.1 % of the piece → held

HELD_PREFIXES = ("extra", "coverage", "low_res", "interior_hole", "relative_coverage", "api_error")


def verdict(flags: list[str]) -> str:
    """process.py:38, with the added flags holding too."""
    if any(f.startswith("api_error") for f in flags):
        return "failed"
    if any(f.startswith(HELD_PREFIXES) for f in flags):
        return "needs_review"
    return "auto_fixed" if flags else "ok"


# --------------------------------------------------------------------------- 1
def low_res_flag(width: int, height: int) -> str | None:
    return f"low_res:{width}x{height}" if max(width, height) < LOW_RES_LONG_SIDE else None


# --------------------------------------------------------------------------- 3
def relative_coverage_flag(coverage: float, main_coverage: float | None) -> str | None:
    """Coverage is a share of the frame, so the ratio is independent of the source size."""
    if main_coverage is None or main_coverage <= 0:
        return None
    r = coverage / main_coverage
    return f"relative_coverage:{r:.2f}" if r < RELATIVE_COVERAGE_MIN else None


# --------------------------------------------------------------------------- 2
def qa_grid(source: Image.Image, kept_alpha: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """The original's colours and the kept alpha on the QA grid (long side GRID, box-averaged)."""
    src = source.convert("RGB")
    W, H = src.size
    k = GRID / max(W, H)
    size = (max(1, round(W * k)), max(1, round(H * k)))
    rgb = np.array(src.resize(size, Image.BOX))
    alpha = np.array(Image.fromarray(np.asarray(kept_alpha).clip(0, 255).astype(np.uint8)).resize(size, Image.BOX))
    return rgb, alpha


def _lab(rgb: np.ndarray) -> np.ndarray:
    c = rgb.astype(float) / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    xyz = c @ np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]).T
    xyz /= np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def interior_holes(rgb: np.ndarray, alpha: np.ndarray) -> dict:
    """On the QA grid: every enclosed hole in the kept piece, and which of them are erasures."""
    piece = alpha > 128
    n_piece = int(piece.sum())
    lab, n = ndimage.label(~piece)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]).tolist())) - {0}
    outside = np.isin(lab, list(border)) if border else np.zeros_like(piece)
    bg_cells = outside & (alpha < 16)  # the backdrop: clearly empty and reachable from the frame
    if bg_cells.sum() < 20 or n_piece == 0:
        return {"piece": n_piece, "holes": [], "erased": 0}
    L = _lab(rgb)
    bg = np.median(L[bg_cells], axis=0)
    holes = []
    for i in range(1, n + 1):
        if i in border:
            continue
        cells = lab == i
        size = int(cells.sum())
        if size < HOLE_MIN_CELLS:
            continue
        d = L[cells] - bg
        chroma = float((np.sqrt(d[:, 1] ** 2 + d[:, 2] ** 2) > CHROMA_DE).mean())
        mean = L[cells].mean(axis=0)
        rim = ndimage.binary_dilation(cells) & piece
        rim_match = float((np.sqrt(((L[rim] - mean) ** 2).sum(-1)) < RIM_DE).mean()) if rim.any() else 0.0
        same = piece & (np.sqrt(((L - mean) ** 2).sum(-1)) < RIM_DE)
        slab, _ = ndimage.label(same)
        touching = set(np.unique(slab[rim & same]).tolist()) - {0}
        surface = int(np.isin(slab, list(touching)).sum()) if touching else 0
        share = size / n_piece
        erased = chroma >= CHROMA_SHARE or (share < SMALL_HOLE and rim_match >= RIM_MATCH and surface >= SURFACE_RATIO * size)
        holes.append({"cells": size, "piece_share": round(share, 4), "chroma": round(chroma, 3), "rim_match": round(rim_match, 3),
                      "surface_ratio": round(surface / size, 1), "erased": bool(erased)})
    erased = sum(h["cells"] for h in holes if h["erased"])
    return {"piece": n_piece, "holes": holes, "erased": erased}


def interior_hole_flag(rgb: np.ndarray, alpha: np.ndarray) -> str | None:
    r = interior_holes(rgb, alpha)
    if r["piece"] and r["erased"] / r["piece"] >= ERASED_MIN_SHARE_OF_PIECE:
        return f"interior_hole:{r['erased'] / r['piece']:.4f}"
    return None

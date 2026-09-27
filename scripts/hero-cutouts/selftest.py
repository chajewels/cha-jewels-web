"""Runs before every workflow run: is this still the original tool?

1. The model weights are the ones the owner's approved cut-outs were made with
   (BiRefNet-general-epoch_244.onnx, sha256 below). rembg downloads them on
   first use into $REMBG_HOME (the workflow caches that folder).
2. AL112, re-cut here, matches the owner-approved AL112 cut-out bundled with
   the site (public/fixtures/cutouts/al112.webp; alpha is stored losslessly).
   On the Mac it was made on this is byte-identical (max diff 0). A different
   CPU may round differently, so the run passes at IoU >= 0.995 and a mean
   alpha difference <= 1.0 and FAILS otherwise — a drifted toolchain stops
   the run before anything is recorded.
"""
from __future__ import annotations

import hashlib
import io
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import pipeline  # noqa: E402

MODEL_SHA256 = "58f621f00f5d756097615970a88a791584600dcf7c45b18a0a6267535a1ebd3c"
AL112_SOURCE = "https://pfoicalpzdcmyxzvwyhz.supabase.co/storage/v1/object/public/promotions/website/page365/81333344/462264810-1773219921.jpeg"
AL112_APPROVED = HERE.parents[1] / "public" / "fixtures" / "cutouts" / "al112.webp"
MIN_IOU, MAX_MEAN_DIFF = 0.995, 1.0


def fail(msg: str) -> None:
    print(f"::error::selftest: {msg}" if os.getenv("GITHUB_ACTIONS") else f"SELFTEST FAILED: {msg}", file=sys.stderr)
    sys.exit(3)


def model_path() -> Path:
    home = os.getenv("U2NET_HOME") or os.getenv("REMBG_HOME") or os.path.expanduser("~/.rembg")
    for p in (Path(home) / "models" / "birefnet-general" / "birefnet-general.onnx", Path(home) / "birefnet-general.onnx"):
        if p.exists():
            return p
    fail(f"model file not found under {home}")


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    import requests

    session = pipeline.new_session()  # downloads the weights if they are not cached
    got = sha256(model_path())
    if got != MODEL_SHA256:
        fail(f"model weights sha256 {got} != {MODEL_SHA256}")
    src = Image.open(io.BytesIO(requests.get(AL112_SOURCE, timeout=60).content)); src.load()
    c = pipeline.cut(src, session)
    fresh = np.array(Image.open(io.BytesIO(c.webp())).convert("RGBA"))[:, :, 3].astype(int)
    ref = np.array(Image.open(AL112_APPROVED).convert("RGBA"))[:, :, 3].astype(int)
    if fresh.shape != ref.shape:
        fail(f"AL112 size {fresh.shape[::-1]} != approved {ref.shape[::-1]}")
    a, b = fresh > 128, ref > 128
    iou = (a & b).sum() / max(1, (a | b).sum())
    mean = float(np.abs(fresh - ref).mean())
    print(f"selftest: model sha256 ok; AL112 IoU {iou:.5f}, mean alpha diff {mean:.3f}, max {int(np.abs(fresh - ref).max())}")
    if iou < MIN_IOU or mean > MAX_MEAN_DIFF:
        fail(f"AL112 no longer matches the approved cut-out (IoU {iou:.4f}, mean diff {mean:.2f})")


if __name__ == "__main__":
    main()

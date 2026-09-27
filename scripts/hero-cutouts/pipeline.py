"""The ORIGINAL hero cut-out tool (owner rule 2026-09-28: the hero uses its cut-outs only).

`cut()` is ~/Code/reference/hero-comps/auto-check/process.py lines 9-38 — the
script that made the owner-approved hero cut-outs on 2026-09-26 — turned into a
function and nothing else: same model (rembg `birefnet-general` =
BiRefNet-general-epoch_244.onnx), same call (`post_process_mask=True`, no alpha
matting), same post-processing in the same order (extra objects over 2 % of the
largest region → keep the largest, dilated 6 px; edge touch within 3 px → fade
14 % of the short side with linspace**1.4; coverage outside 3–85 %; trim to the
alpha box, long side ≤ 900 px LANCZOS; WebP quality 86 method 6).

The line-by-line correspondence is kept in the comments (`# process.py:N`). Do
not "improve" anything here: the self-test (selftest.py) re-cuts AL112 and
compares it with the approved file.

The checks ADDED on 2026-09-28 (interior holes, relative coverage, < 1200 px)
live in qa.py and run on the values returned here; they never change a pixel.
"""
from __future__ import annotations

import io
from dataclasses import dataclass, field

import numpy as np
from PIL import Image
from scipy import ndimage

MODEL = "birefnet-general"


def new_session():
    from rembg import new_session as _new  # imported late: tests of qa.py need no model

    return _new(MODEL)  # process.py:6


@dataclass
class Cut:
    source_size: tuple[int, int]
    coverage: float
    flags: list[str] = field(default_factory=list)
    status: str = "ok"
    image: Image.Image | None = None  # trimmed RGBA, long side <= 900
    kept_alpha: np.ndarray | None = None  # full-frame alpha after the extra-object step, before the fade (for qa.py)

    def webp(self) -> bytes:
        buf = io.BytesIO()
        self.image.save(buf, format="WEBP", quality=86, method=6)  # process.py:36
        return buf.getvalue()

    def png(self) -> bytes:
        buf = io.BytesIO()
        self.image.save(buf, format="PNG", optimize=True)  # process.py:35
        return buf.getvalue()


def cut(source: Image.Image, session) -> Cut:
    from rembg import remove

    src = source.convert("RGB"); W, H = src.size  # process.py:9
    cut_ = remove(src, session=session, post_process_mask=True)  # process.py:10  uncropped RGBA
    a = np.array(cut_)[:, :, 3].astype(float)  # process.py:11
    m = a > 128  # process.py:12
    lab, n = ndimage.label(m); sizes = ndimage.sum(m, lab, range(1, n + 1))  # process.py:13
    big = [i + 1 for i, v in enumerate(sizes) if v > 0.02 * sizes.max()] if n else []  # process.py:14
    flags: list[str] = []  # process.py:15
    if len(big) > 1:  # process.py:16
        flags.append(f"extra_objects:{len(big) - 1}")  # process.py:17
        keep = lab == (int(np.argmax(sizes)) + 1)  # process.py:18
        keep = ndimage.binary_dilation(keep, iterations=6)  # process.py:19
        a = a * keep  # process.py:20
    kept_alpha = a.copy()
    tol = 3  # process.py:21
    edges = [e for e, cond in [("top", m[:tol].any()), ("bottom", m[-tol:].any()), ("left", m[:, :tol].any()), ("right", m[:, -tol:].any())] if cond]  # process.py:22
    if edges:  # process.py:23
        flags.append("edge_touch:" + ",".join(edges))  # process.py:24
        ramp = int(0.14 * min(W, H))  # process.py:25
        g = np.linspace(0, 1, ramp) ** 1.4  # process.py:26
        if "bottom" in edges: a[-ramp:] *= g[::-1][:, None]  # process.py:27
        if "top" in edges: a[:ramp] *= g[:, None]  # process.py:28
        if "left" in edges: a[:, :ramp] *= g[None, :]  # process.py:29
        if "right" in edges: a[:, -ramp:] *= g[::-1][None, :]  # process.py:30
    cov = float((a > 128).mean())  # process.py:31
    if cov < 0.03 or cov > 0.85: flags.append(f"coverage:{cov:.2f}")  # process.py:32
    rgba = np.array(cut_); rgba[:, :, 3] = a.clip(0, 255).astype(np.uint8)  # process.py:33
    im = Image.fromarray(rgba); box = im.getbbox()
    if box is None:  # nothing kept at all: no file (not in process.py, which never met an empty mask)
        return Cut((W, H), round(cov, 3), flags + ["api_error:empty_mask"], "failed", None, kept_alpha)
    im = im.crop(box); im.thumbnail((900, 900), Image.LANCZOS)  # process.py:34
    status = "needs_review" if any(x.startswith(("extra", "coverage")) for x in flags) else ("auto_fixed" if flags else "ok")  # process.py:38
    return Cut((W, H), round(cov, 3), flags, status, im, kept_alpha)  # process.py:37 (coverage rounded to 3)

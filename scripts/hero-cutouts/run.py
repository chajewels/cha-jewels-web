"""Hero cut-outs — one scheduled run (hero auto cut-out PR 4; .github/workflows/hero-cutouts.yml).

For every category the hero shows (GET /catalog/categories, all of them, in
sort_order — lib/hero-deck.ts buildHeroDeck), every IN-STOCK piece in the Hub's
order (lib/hero-deck.ts inStockVariant: status active, a variant with
stock_qty > 0 and a price), its first HERO_PHOTOS photos in the Hub's order
(lib/queries/products.ts allImages):

  1. download the photo, sha256 it
  2. the Hub already has a hero record for this URL with the same sha256 →
     skip. Once per unchanged source, WHATEVER its status: a held photo
     (N3940, W1451) is never cut again; an owner decision is never redone.
  3. otherwise cut it with the original tool (pipeline.py, verbatim
     process.py), add the 2026-09-28 checks (qa.py), and POST the result to
     the Hub's hero-only record (EDGE-FUNCTION-SPEC.md §2b). The Hub decides
     go-live (approval-first unless the owner switched it).

This covers the pieces ON the slides and the ones next in line, so a sale
swaps in a piece that is already cut. Nothing here reads or writes the
Photoroom record.

Secrets (env): HUB_API_URL, HUB_API_KEY (catalogue read, x-api-key),
HERO_CUTOUT_KEY (the hero record, x-hero-cutout-key). A missing one stops the
run with a clear message before anything is read.

  python run.py                         the scheduled run
  python run.py --dry-run               read + cut + check, write NOTHING to the Hub
  python run.py --dry-run --catalog-json stock.json --out DIR
                                        the same, with the catalogue from a file
                                        (the local proof; no secrets needed)
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import os
import re
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import qa  # noqa: E402

HERO_PHOTOS = 4  # lib/hero-deck.ts HERO_PHOTOS
SOURCE_OK = re.compile(r"^https://[^/]+/storage/v1/object/public/promotions/website/(?!derived/)")
TOOLCHAIN_FILE = HERE / "requirements.txt"
HTTP_TIMEOUT = 60


def fail(msg: str, code: int = 2) -> None:
    print(f"::error::{msg}" if os.getenv("GITHUB_ACTIONS") else f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


# --------------------------------------------------------------------------- pure (tested)
def in_stock_variant(p: dict) -> dict | None:
    if p.get("status") != "active":
        return None
    best = None
    for v in p.get("product_variants") or []:
        q, price = v.get("stock_qty"), v.get("price_jpy")
        if not isinstance(q, (int, float)) or not math.isfinite(q) or q <= 0:
            continue
        if not isinstance(price, (int, float)) or not math.isfinite(price):
            continue
        if best is None or price < best["price_jpy"]:
            best = v
    return best


def all_images(p: dict) -> list[str]:
    media = [m for v in p.get("product_variants") or [] for m in (v.get("product_media") or [])]
    media.sort(key=lambda m: m.get("sort", 0))  # stable, as Array.prototype.sort
    out: list[str] = []
    for m in media:
        u = m.get("url")
        if isinstance(u, str) and u and u not in out:
            out.append(u)
    return out


def in_stock_pieces(category: dict) -> list[dict]:
    pieces = []
    for p in category.get("products") or []:
        if in_stock_variant(p) is None:
            continue
        photos = all_images(p)[:HERO_PHOTOS]
        if photos:
            pieces.append({"sku": p.get("sku"), "slug": p.get("slug"), "photos": photos})
    return pieces


def decide(url: str, sha: str, known: dict) -> str:
    k = known.get(url)
    return "skip" if k and k.get("source_sha256") == sha else "cut"


# --------------------------------------------------------------------------- Hub I/O
class Hub:
    def __init__(self, base: str, api_key: str, hero_key: str | None, dry_run: bool):
        import requests

        self.s = requests.Session()
        self.base = base.rstrip("/")
        self.api_key, self.hero_key, self.dry_run = api_key, hero_key, dry_run

    def get(self, path: str, hero: bool = False):
        h = {"x-api-key": self.api_key}
        if hero:
            h["x-hero-cutout-key"] = self.hero_key
        return self.s.get(self.base + path, headers=h, timeout=HTTP_TIMEOUT)

    def catalogue(self) -> list[dict]:
        r = self.get("/catalog/categories")
        r.raise_for_status()
        cats = sorted(r.json(), key=lambda c: c.get("sort_order", 0))
        out = []
        for c in cats:
            rr = self.get(f"/catalog/categories/{c['slug']}")
            if rr.status_code == 404:
                continue
            rr.raise_for_status()
            out.append({"slug": c["slug"], **rr.json()})
        return out

    def known(self) -> dict:
        r = self.get("/hero-cutouts", hero=True)
        if r.status_code in (401, 403):
            fail("The Hub refused HERO_CUTOUT_KEY (GET /hero-cutouts answered %d). Check the secret matches the Hub's." % r.status_code)
        if r.status_code == 404:
            fail("The Hub's hero cut-out endpoint is not deployed yet (GET /hero-cutouts answered 404; EDGE-FUNCTION-SPEC.md). Nothing was cut.")
        r.raise_for_status()
        return {i["source_url"]: i for i in r.json().get("items", [])}

    def record(self, meta: dict, webp: bytes | None) -> dict:
        files = {"meta": (None, json.dumps(meta), "application/json")}
        if webp is not None:
            files["file"] = ("cutout.webp", webp, "image/webp")
        r = self.s.post(self.base + "/hero-cutouts", files=files, timeout=HTTP_TIMEOUT,
                        headers={"x-api-key": self.api_key, "x-hero-cutout-key": self.hero_key})
        if r.status_code >= 400:
            raise RuntimeError(f"POST /hero-cutouts {r.status_code}: {r.text[:200]}")
        return r.json()


def download(url: str) -> bytes:
    import requests

    r = requests.get(url, timeout=HTTP_TIMEOUT)
    r.raise_for_status()
    return r.content


def toolchain() -> dict:
    pins = dict(l.strip().split("==") for l in TOOLCHAIN_FILE.read_text().splitlines() if "==" in l and not l.startswith("#"))
    return {k: pins[k] for k in ("rembg", "onnxruntime", "pillow", "numpy", "scipy") if k in pins} | {"python": sys.version.split()[0]}


# --------------------------------------------------------------------------- run
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="write nothing to the Hub")
    ap.add_argument("--catalog-json", help="read the catalogue from this file instead of the Website API")
    ap.add_argument("--known-json", help="(dry run) the Hub's known list from this file")
    ap.add_argument("--out", default="hero-cutouts-out", help="report and cut-outs are written here")
    ap.add_argument("--limit", type=int, default=0, help="stop after cutting this many photos (0 = all)")
    args = ap.parse_args()

    env = {k: os.getenv(k, "").strip() for k in ("HUB_API_URL", "HUB_API_KEY", "HERO_CUTOUT_KEY")}
    need = [] if args.catalog_json else ["HUB_API_URL", "HUB_API_KEY"]
    if not args.dry_run:
        need = ["HUB_API_URL", "HUB_API_KEY", "HERO_CUTOUT_KEY"]
        if args.catalog_json:
            fail("--catalog-json is for dry runs only: a real run reads the Hub.")
    missing = [k for k in need if not env[k]]
    if missing:
        fail("Missing secret(s): " + ", ".join(missing) + ". Add them in GitHub: repo → Settings → Secrets and variables → Actions → New repository secret. Nothing was read or written.")

    hub = Hub(env["HUB_API_URL"], env["HUB_API_KEY"], env["HERO_CUTOUT_KEY"] or None, args.dry_run) if env["HUB_API_URL"] else None
    categories = json.loads(Path(args.catalog_json).read_text()) if args.catalog_json else hub.catalogue()
    if args.known_json:
        known = {i["source_url"]: i for i in json.loads(Path(args.known_json).read_text()).get("items", [])}
    elif hub and env["HERO_CUTOUT_KEY"]:
        known = hub.known()
    else:
        known = {}

    out = Path(args.out); (out / "cutouts").mkdir(parents=True, exist_ok=True)
    import pipeline
    from PIL import Image

    session = None
    results, cut_count, errors = [], 0, 0
    tc = toolchain()
    for cat in categories:
        for piece in in_stock_pieces(cat):
            main_cov = None
            for i, url in enumerate(piece["photos"]):
                row = {"category": cat["slug"], "sku": piece["sku"], "photo": i + 1, "source_url": url}
                if not SOURCE_OK.match(url):
                    results.append(row | {"action": "skipped", "why": "not a Hub website photo"}); continue
                try:
                    data = download(url)
                except Exception as e:  # a hiccup: nothing recorded, the next run retries
                    errors += 1; results.append(row | {"action": "error", "why": f"download: {e}"}); continue
                sha = hashlib.sha256(data).hexdigest()
                if decide(url, sha, known) == "skip":
                    k = known[url]
                    if i == 0: main_cov = k.get("coverage")
                    results.append(row | {"action": "skipped", "why": "unchanged source, already recorded", "status": k.get("status")}); continue
                if args.limit and cut_count >= args.limit:
                    results.append(row | {"action": "deferred", "why": "--limit"}); continue
                t = time.time()
                session = session or pipeline.new_session()
                src = Image.open(io.BytesIO(data)); src.load()
                c = pipeline.cut(src, session)
                flags = list(c.flags)
                W, H = c.source_size
                for f in (qa.low_res_flag(W, H),
                          qa.interior_hole_flag(*qa.qa_grid(src, c.kept_alpha)) if c.image is not None else None,
                          qa.relative_coverage_flag(c.coverage, main_cov) if i > 0 else None):
                    if f: flags.append(f)
                status = qa.verdict(flags)
                if i == 0: main_cov = c.coverage
                cut_count += 1
                webp = c.webp() if c.image is not None else None
                name = f"{piece['sku']}-{i + 1}".lower()
                if webp: (out / "cutouts" / f"{name}.webp").write_bytes(webp)
                meta = {"source_url": url, "source_sha256": sha, "source_width": W, "source_height": H, "status": status,
                        "flags": flags, "coverage": c.coverage, "width": c.image.width if c.image else None,
                        "height": c.image.height if c.image else None, "model": "birefnet-general@epoch_244", "toolchain": tc}
                row |= {"action": "cut", "status": status, "flags": flags, "coverage": c.coverage, "source_px": [W, H],
                        "seconds": round(time.time() - t, 1), "file": f"cutouts/{name}.webp" if webp else None}
                if not args.dry_run:
                    try:
                        row["hub"] = hub.record(meta, webp)
                    except Exception as e:
                        errors += 1; row["hub_error"] = str(e)
                results.append(row)
                print(json.dumps({k: row[k] for k in ("sku", "photo", "status", "flags") if k in row}), flush=True)

    report = {"dry_run": args.dry_run, "toolchain": tc, "cut": cut_count, "errors": errors, "photos": results}
    (out / "report.json").write_text(json.dumps(report, indent=1))
    summary = summarize(results, args.dry_run)
    (out / "summary.md").write_text(summary)
    if os.getenv("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as f: f.write(summary)
    print(summary)
    if errors:
        fail(f"{errors} photo(s) could not be downloaded or recorded; they are retried on the next run.", 1)


def summarize(results: list[dict], dry_run: bool) -> str:
    lines = [f"## Hero cut-outs — {'DRY RUN (nothing written)' if dry_run else 'run'}", "",
             "| Category | Piece | Photo | Result | Why |", "|---|---|---|---|---|"]
    for r in results:
        res = r.get("status") if r["action"] == "cut" else r["action"]
        why = ", ".join(r.get("flags", [])) if r["action"] == "cut" else r.get("why", "")
        lines.append(f"| {r['category']} | {r['sku']} | {r['photo']} | {res} | {why} |")
    cut = [r for r in results if r["action"] == "cut"]
    held = [r for r in cut if r["status"] in ("needs_review", "failed")]
    lines += ["", f"Cut: {len(cut)} · passed (waiting for the owner): {len(cut) - len(held)} · held: {len(held)} · "
              f"skipped: {sum(r['action'] == 'skipped' for r in results)}", ""]
    return "\n".join(lines)


if __name__ == "__main__":
    main()

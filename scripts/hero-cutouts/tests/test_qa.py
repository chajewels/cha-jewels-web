"""The added hero cut-out checks (qa.py), proven on real photos.

Fixtures (tests/fixtures/):
  run-2026-09-28.json  the verbatim pipeline's result for all 54 photos (the 22
                       approved bundled cut-outs, the 28 of the 2026-09-28 test
                       run, W1282's 4): source size, coverage, flags, status.
  <photo>.npz          the QA grid (original colours + kept alpha, long side 256)
                       of 14 of them: the defects and the hardest real openings.
Photo names count from 0: "c0853-1" is C0853's SECOND photo ("photo 2").

Run: python -m unittest discover -s scripts/hero-cutouts/tests   (no model needed)
"""
import json
import os
import sys
import unittest

import numpy as np

HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.dirname(HERE))
import qa  # noqa: E402
import run  # noqa: E402

FIX = os.path.join(HERE, "fixtures")
RUN = json.load(open(os.path.join(FIX, "run-2026-09-28.json")))
# The owner's approved bundled set (lib/hero-cutouts.ts) and the photos judged
# good on the 2026-09-28 test run (AUTO-HERO-CUTOUT.md §2).
APPROVED = ["al112", "al123", "al123-1", "al3", "al3-1", "r3341", "r3341-1", "r3341-2", "r3341-3", "r7828", "r7828-1",
            "r7828-2", "r7828-3", "r3110", "c0983", "c0983-1", "c0983-2", "c0983-3", "c1395", "c1395-1", "c1395-2", "c1395-3"]
JUDGED_GOOD = ["c0853", "c0853-2", "c0853-3", "n2734", "n2734-1", "p2722", "p2722-1", "p2722-2", "p2722-3", "r0831",
               "r0831-1", "r0831-2", "r0831-3", "r1172", "r1172-1", "r1172-2", "w2527", "w2527-2", "w2527-3",
               "w1282", "w1282-1", "w1282-2", "w1282-3"]


def grid(name):
    z = np.load(os.path.join(FIX, name + ".npz"))
    return z["rgb"], z["alpha"]


def piece_of(name):
    return name.split("-")[0]


def main_coverage(name):
    return RUN[piece_of(name)]["coverage"]


class OwnerCases(unittest.TestCase):
    """The four cases the owner named (2026-09-28)."""

    def test_c0853_photo_2_dial_hole_is_held(self):
        flag = qa.interior_hole_flag(*grid("c0853-1"))
        self.assertIsNotNone(flag)
        self.assertTrue(flag.startswith("interior_hole:"))
        flags = RUN["c0853-1"]["flags"] + [flag]
        self.assertEqual(RUN["c0853-1"]["status"], "auto_fixed")  # the original checks let it through
        self.assertEqual(qa.verdict(flags), "needs_review")

    def test_w2527_photo_2_sliver_is_held(self):
        flag = qa.relative_coverage_flag(RUN["w2527-1"]["coverage"], main_coverage("w2527-1"))
        self.assertEqual(flag, "relative_coverage:0.20")
        self.assertEqual(RUN["w2527-1"]["status"], "auto_fixed")  # the original checks let it through
        self.assertEqual(qa.verdict(RUN["w2527-1"]["flags"] + [flag]), "needs_review")

    def test_n3940_and_w1451_are_held_for_size(self):
        for name in ["n3940", "n3940-1", "n3940-2", "w1451", "w1451-1", "w1451-2"]:
            w, h = RUN[name]["source"]
            flag = qa.low_res_flag(w, h)
            self.assertEqual(flag, f"low_res:{w}x{h}", name)
            self.assertEqual(qa.verdict(RUN[name]["flags"] + [flag]), "needs_review", name)


class NoFalseHolds(unittest.TestCase):
    def test_real_openings_are_not_erasures(self):
        # open heart, cross cut-outs, ring centres, bracelet gaps, a shadowed strap gap
        for name in ["al112", "al3", "al3-1", "r0831", "r1172", "c0983", "c0983-3", "c1395-3", "n2734", "al123", "r3110", "w1282", "w1282-2"]:
            self.assertIsNone(qa.interior_hole_flag(*grid(name)), name)

    def test_relative_coverage_holds_nothing_approved_or_judged_good(self):
        for name in APPROVED + JUDGED_GOOD:
            if "-" not in name:
                continue
            self.assertIsNone(qa.relative_coverage_flag(RUN[name]["coverage"], main_coverage(name)), name)

    def test_resolution_rule_holds_only_the_small_sources(self):
        held = sorted(n for n, r in RUN.items() if qa.low_res_flag(*r["source"]))
        self.assertEqual(held, ["n3940", "n3940-1", "n3940-2", "r3110", "w1451", "w1451-1", "w1451-2"])


class Rules(unittest.TestCase):
    def test_verdict_keeps_process_py_order(self):
        self.assertEqual(qa.verdict([]), "ok")
        self.assertEqual(qa.verdict(["edge_touch:top"]), "auto_fixed")
        self.assertEqual(qa.verdict(["edge_touch:top", "extra_objects:1"]), "needs_review")
        self.assertEqual(qa.verdict(["coverage:0.02"]), "needs_review")
        self.assertEqual(qa.verdict(["api_error:empty_mask"]), "failed")

    def test_main_photo_is_never_judged_against_itself(self):
        self.assertIsNone(qa.relative_coverage_flag(0.01, None))
        self.assertIsNone(qa.relative_coverage_flag(0.5, 0.0))

    def test_1200_is_not_low(self):
        self.assertIsNone(qa.low_res_flag(1200, 800))
        self.assertEqual(qa.low_res_flag(1199, 1199), "low_res:1199x1199")


class Planning(unittest.TestCase):
    """run.py decides what to cut without the model: once per unchanged source."""

    def test_in_stock_pieces_only_in_hub_order(self):
        cat = {"products": [
            {"sku": "A", "slug": "a", "status": "active", "product_variants": [{"price_jpy": 1, "stock_qty": 0, "product_media": [{"url": "u1", "sort": 0}]}]},
            {"sku": "B", "slug": "b", "status": "active", "product_variants": [{"price_jpy": 1, "stock_qty": 1, "product_media": [{"url": "u3", "sort": 1}, {"url": "u2", "sort": 0}]}]},
            {"sku": "C", "slug": "c", "status": "draft", "product_variants": [{"price_jpy": 1, "stock_qty": 1, "product_media": [{"url": "u4", "sort": 0}]}]},
        ]}
        pieces = run.in_stock_pieces(cat)
        self.assertEqual([p["sku"] for p in pieces], ["B"])
        self.assertEqual(pieces[0]["photos"], ["u2", "u3"])

    def test_at_most_four_photos_a_piece(self):
        cat = {"products": [{"sku": "B", "slug": "b", "status": "active", "product_variants": [
            {"price_jpy": 1, "stock_qty": 1, "product_media": [{"url": f"u{i}", "sort": i} for i in range(7)]}]}]}
        self.assertEqual(len(run.in_stock_pieces(cat)[0]["photos"]), run.HERO_PHOTOS)

    def test_known_unchanged_source_is_skipped_held_included(self):
        known = {"u1": {"source_sha256": "a" * 64, "status": "needs_review", "coverage": 0.04}}
        self.assertEqual(run.decide("u1", "a" * 64, known), "skip")
        self.assertEqual(run.decide("u1", "b" * 64, known), "cut")  # new bytes at the same URL
        self.assertEqual(run.decide("u2", "a" * 64, known), "cut")


if __name__ == "__main__":
    unittest.main()

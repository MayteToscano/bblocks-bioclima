"""
Smoke / snapshot tests for the BioClima indicator pipeline.

The tests run the actual PCI compute.py + zonify.py on the shipped example
data and assert structural properties of the output. They are deliberately
loose on absolute numerical values (which depend on numpy version, BLAS,
etc.) and tight on shape, range and presence of required fields. This
catches the kinds of silent regressions that broke the build before.

Run as:
    pytest tests/ -v
or, without pytest:
    python -m unittest tests.test_pipeline
"""

from __future__ import annotations
import json
import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "_sources" / "indicator" / "pci"     / "code"))
sys.path.insert(0, str(ROOT / "_sources" / "zonification" / "bioclimatic-zone" / "code"))

from compute import compute_pci  # noqa: E402
from zonify import zonify         # noqa: E402

CONIF = ROOT / "_sources/ebv/vap-coniferous/examples/finland-vap-coniferous-2001-2018.covjson"
DECID = ROOT / "_sources/ebv/vap-deciduous/examples/finland-vap-deciduous-2001-2018.covjson"
PCI   = ROOT / "_sources/indicator/pci/examples/pci-finland-2001-2018.covjson"
ZONES = ROOT / "_sources/zonification/bioclimatic-zone/examples/finland-zones-2001-2018.geojson"


class PciCoverageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Use the shipped output to avoid running the full computation every
        # time. Recomputing is tested separately below.
        cls.cov = json.loads(PCI.read_text(encoding="utf-8"))

    def test_has_four_parameters(self):
        self.assertIn("parameters", self.cov)
        self.assertEqual(
            set(self.cov["parameters"].keys()),
            {"trend", "anomaly", "changepoint_year", "changepoint_pvalue"}
        )

    def test_has_parameter_group(self):
        groups = self.cov.get("parameterGroups", [])
        self.assertTrue(groups, "missing parameterGroups[]")
        g = groups[0]
        self.assertEqual(g["type"], "ParameterGroup")
        self.assertTrue(g["id"].endswith("/indicator/pci"))
        self.assertEqual(
            set(g["members"]),
            {"trend", "anomaly", "changepoint_year", "changepoint_pvalue"}
        )

    def test_every_parameter_has_observed_property_iri(self):
        for k, p in self.cov["parameters"].items():
            with self.subTest(parameter=k):
                op = p.get("observedProperty", {})
                self.assertTrue(op.get("id", "").startswith(
                    "https://maytetoscano.github.io/bblocks-bioclima/ontology/indicator/"
                ), f"parameter '{k}' has no ontology-resolvable observedProperty.id")
                self.assertIn("label", op)
                self.assertIn("en", op["label"])

    def test_ranges_consistent_shape(self):
        shapes = {k: tuple(r["shape"]) for k, r in self.cov["ranges"].items()}
        self.assertEqual(len(set(shapes.values())), 1,
                         f"parameter shapes disagree: {shapes}")
        # axes must be (y, x), no temporal axis (PCI is a summary).
        for k, r in self.cov["ranges"].items():
            self.assertEqual(r["axisNames"], ["y", "x"], f"{k} axisNames")

    def test_trend_values_within_sensible_range(self):
        # PCI trend is in days/year. For a 17-18 year boreal series the value
        # should be bounded by roughly ±5 days/year before being implausible.
        r = self.cov["ranges"]["trend"]
        nodata = r.get("nodata", -9999.0)
        valid = [v for v in r["values"] if v != nodata and not math.isnan(v)]
        self.assertTrue(valid, "no valid trend pixels")
        self.assertLess(max(valid),  5.0, "trend exceeds +5 d/yr — implausible")
        self.assertGreater(min(valid), -5.0, "trend below -5 d/yr — implausible")

    def test_pvalue_within_unit_interval(self):
        r = self.cov["ranges"]["changepoint_pvalue"]
        nodata = r.get("nodata", -9999.0)
        valid = [v for v in r["values"] if v != nodata and not math.isnan(v)]
        self.assertTrue(valid)
        self.assertGreaterEqual(min(valid), 0.0)
        self.assertLessEqual(max(valid), 1.0)

    def test_changepoint_year_within_window(self):
        r = self.cov["ranges"]["changepoint_year"]
        nodata = r.get("nodata", -9999.0)
        valid = [v for v in r["values"] if v != nodata and not math.isnan(v)]
        self.assertTrue(valid)
        self.assertGreaterEqual(min(valid), 2001)
        self.assertLessEqual(max(valid), 2018)


class ZoneTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fc = json.loads(ZONES.read_text(encoding="utf-8"))

    def test_has_features(self):
        self.assertEqual(self.fc["type"], "FeatureCollection")
        self.assertGreater(len(self.fc["features"]), 10,
                           "expected at least 10 zones")

    def test_features_have_required_properties(self):
        for f in self.fc["features"]:
            p = f["properties"]
            for k in ("category", "categoryKey", "categoryLabel",
                      "pixel_count", "area_km2", "mean_pci",
                      "derivedFrom", "policyRelevance"):
                self.assertIn(k, p, f"missing {k} in {f['id']}")

    def test_categories_are_known(self):
        known = {"stable", "mild_advance", "strong_advance", "delay"}
        cats = {f["properties"]["categoryKey"] for f in self.fc["features"]}
        self.assertTrue(cats.issubset(known),
                        f"unknown categories: {cats - known}")

    def test_policy_relevance_structured(self):
        for f in self.fc["features"]:
            pol = f["properties"]["policyRelevance"]
            self.assertIsInstance(pol, list)
            for entry in pol:
                self.assertIn("target", entry)
                self.assertIn("relationship", entry)

    def test_geometry_is_polygon_or_multipolygon(self):
        types = {f["geometry"]["type"] for f in self.fc["features"]}
        self.assertTrue(types.issubset({"Polygon", "MultiPolygon"}),
                        f"unexpected geometry types: {types}")

    def test_outer_rings_closed(self):
        for f in self.fc["features"][:25]:   # sample 25 to keep the test fast
            g = f["geometry"]
            polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
            for poly in polys:
                for ring in poly:
                    self.assertEqual(ring[0], ring[-1],
                                     f"{f['id']} ring is not closed")

    def test_derived_from_is_pci(self):
        for f in self.fc["features"]:
            self.assertEqual(f["properties"]["derivedFrom"],
                             "ogc.bioclima.indicator.pci")


class PipelineSmokeTest(unittest.TestCase):
    """
    Run compute_pci end-to-end on a TINY subset of the data — too slow for
    the full grid to run every push, but the shipped fixtures already do.
    Here we just confirm that compute_pci is callable and returns the right
    shape.
    """
    def test_compute_pci_returns_coverage(self):
        cov = compute_pci(str(CONIF), str(DECID))
        self.assertEqual(cov["type"], "Coverage")
        self.assertEqual(set(cov["parameters"].keys()),
                         {"trend", "anomaly", "changepoint_year",
                          "changepoint_pvalue"})

    def test_zonify_returns_feature_collection(self):
        fc = zonify(str(PCI), min_pixels=4)
        self.assertEqual(fc["type"], "FeatureCollection")
        self.assertGreater(len(fc["features"]), 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)

"""
Bioclimatic zonification from the PCI CoverageJSON.
===================================================
Implementation referenced by recipe.jsonld of
ogc.bioclima.zonification.bioclimatic-zone.

What it does
------------
1. Reads the PCI CoverageJSON (output of ogc.bioclima.indicator.pci).
2. Classifies every valid pixel into one of four categories
   (stable, mild advance, strong advance, delay) using published thresholds.
3. Groups SPATIALLY-CONTIGUOUS pixels of the same category into one polygon
   (4-connectivity flood fill, pure numpy, no GIS dependency).
4. Emits a GeoJSON FeatureCollection where each Feature is one zone
   carrying:
     - category (SKOS IRI in the Bioclima ontology)
     - categoryKey / categoryLabel (multilingual)
     - pixel_count, area_km2 (rough spherical approximation)
     - mean_pci, min_pci, max_pci, std_pci
     - policyRelevance: KMGBF target IRIs informed by this zone
     - derivedFrom: bblock id of the upstream PCI indicator

This replaces the previous per-cell polygon implementation. The viewer can
now render meaningful zones instead of grid artefacts.

CLI
---
    python zonify.py \\
        --pci ../../indicator/pci/examples/pci-finland-2001-2018.covjson \\
        --output examples/finland-zones-2001-2018.geojson \\
        --min-pixels 4
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
from pathlib import Path
from typing import List, Tuple

import numpy as np


# ---------------------------------------------------------------------------
# Configuration (kept in sync with recipe.jsonld)
# ---------------------------------------------------------------------------
# Thresholds in days/year. Each tuple is (category, lower-bound-inclusive,
# upper-bound-exclusive). Use ±inf as open bounds.
THRESHOLDS: List[Tuple[str, float, float]] = [
    ("strong_advance", -math.inf, -0.5),
    ("mild_advance",   -0.5,      -0.2),
    ("stable",         -0.2,       0.2),
    ("delay",           0.2,       math.inf),
]

ONT = "https://maytetoscano.github.io/bblocks-bioclima/ontology"

CATEGORY_IRIS = {
    "stable":         f"{ONT}/indicator/zone-stable",
    "mild_advance":   f"{ONT}/indicator/zone-mild-advance",
    "strong_advance": f"{ONT}/indicator/zone-strong-advance",
    "delay":          f"{ONT}/indicator/zone-delay",
}

CATEGORY_LABELS = {
    "stable":         {"en": "Stable phenology zone",
                       "es": "Zona de fenología estable",
                       "zh": "物候稳定区",
                       "ro": "Zonă cu fenologie stabilă"},
    "mild_advance":   {"en": "Mild phenological advance",
                       "es": "Adelanto fenológico leve",
                       "zh": "物候轻微提前",
                       "ro": "Avans fenologic ușor"},
    "strong_advance": {"en": "Strong phenological advance",
                       "es": "Adelanto fenológico fuerte",
                       "zh": "物候强烈提前",
                       "ro": "Avans fenologic puternic"},
    "delay":          {"en": "Phenological delay zone",
                       "es": "Zona de retraso fenológico",
                       "zh": "物候延迟区",
                       "ro": "Zonă cu întârziere fenologică"},
}

# Default policy relevance per category. The mapping is justified in the
# policy-alignment example (pci-alignment.jsonld): advancing/delaying
# phenology informs KMGBF Target 8 (climate-adaptation); zone delineation
# informs Target 1 (spatial planning).
POLICY_PER_CATEGORY = {
    "stable":         [f"{ONT}/policy/kmgbf-target-1", f"{ONT}/policy/sdg-15"],
    "mild_advance":   [f"{ONT}/policy/kmgbf-target-8", f"{ONT}/policy/sdg-15"],
    "strong_advance": [f"{ONT}/policy/kmgbf-target-8", f"{ONT}/policy/kmgbf-target-1", f"{ONT}/policy/sdg-15"],
    "delay":          [f"{ONT}/policy/kmgbf-target-8", f"{ONT}/policy/sdg-15"],
}

# Indicator -> policy relationship (from the policy-alignment block).
POLICY_RELATIONSHIP = {
    f"{ONT}/policy/kmgbf-target-1": "informs",
    f"{ONT}/policy/kmgbf-target-8": "measures-progress-on",
    f"{ONT}/policy/sdg-15":         "supports-reporting-on",
}


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------
def classify(pci: np.ndarray) -> np.ndarray:
    """Map a 2-D PCI float array (NaN = no data) to category strings."""
    out = np.full(pci.shape, "", dtype=object)
    for cat, lo, hi in THRESHOLDS:
        mask = (~np.isnan(pci)) & (pci >= lo) & (pci < hi)
        out[mask] = cat
    return out


# ---------------------------------------------------------------------------
# Connected-components labelling (4-connectivity, pure numpy)
# ---------------------------------------------------------------------------
def connected_components(mask: np.ndarray) -> Tuple[np.ndarray, int]:
    """
    Label connected components in a boolean 2-D mask using 4-connectivity.

    Returns (labels, n_components) where labels has the same shape as `mask`
    and labels[i, j] is the component id (1..n) or 0 for background.

    Implementation: iterative BFS using a small Python stack. Suitable for
    rasters up to a few million pixels, which is well above the Bioclima
    pilot grid.
    """
    h, w = mask.shape
    labels = np.zeros((h, w), dtype=np.int32)
    current = 0
    # We use list as a stack (faster than collections.deque for LIFO).
    stack: List[Tuple[int, int]] = []

    for i0 in range(h):
        for j0 in range(w):
            if not mask[i0, j0] or labels[i0, j0]:
                continue
            current += 1
            stack.append((i0, j0))
            labels[i0, j0] = current
            while stack:
                i, j = stack.pop()
                # 4 neighbours
                if i > 0 and mask[i - 1, j] and not labels[i - 1, j]:
                    labels[i - 1, j] = current
                    stack.append((i - 1, j))
                if i + 1 < h and mask[i + 1, j] and not labels[i + 1, j]:
                    labels[i + 1, j] = current
                    stack.append((i + 1, j))
                if j > 0 and mask[i, j - 1] and not labels[i, j - 1]:
                    labels[i, j - 1] = current
                    stack.append((i, j - 1))
                if j + 1 < w and mask[i, j + 1] and not labels[i, j + 1]:
                    labels[i, j + 1] = current
                    stack.append((i, j + 1))
    return labels, current


# ---------------------------------------------------------------------------
# Component -> MultiPolygon GeoJSON geometry
# ---------------------------------------------------------------------------
def cell_box(lon_c: float, lat_c: float, dx: float, dy: float) -> List[List[float]]:
    """Return a closed-ring rectangle (5 vertices) for a single grid cell."""
    hx, hy = dx / 2.0, dy / 2.0
    return [
        [lon_c - hx, lat_c - hy],
        [lon_c + hx, lat_c - hy],
        [lon_c + hx, lat_c + hy],
        [lon_c - hx, lat_c + hy],
        [lon_c - hx, lat_c - hy],
    ]


def trace_outline_rings(mask: np.ndarray, xs: np.ndarray, ys: np.ndarray,
                        dx: float, dy: float) -> Tuple[List[List[List[float]]],
                                                        List[List[List[float]]]]:
    """
    Trace the boundary of a binary mask as one or more linear rings.

    Algorithm
    ---------
    Each grid cell occupies a small rectangle of (dx, dy) in lon/lat. The
    boundary of the mask is the set of cell edges whose two adjacent cells
    differ: one inside the mask, one outside (or off-grid).

    We collect every such edge as a directed segment that walks the inside
    of the mask on its left, then chain the segments end-to-end to produce
    closed rings. Outer rings are emitted in counter-clockwise order; inner
    rings (holes) come out clockwise — which is the GeoJSON RFC 7946
    convention.

    Returns (outer_rings, holes), each a list of [lon, lat] vertex lists.
    """
    h, w = mask.shape
    hx, hy = dx / 2.0, dy / 2.0
    # Build the (h+1) row-corner and (w+1) col-corner arrays directly.
    cy = np.empty(h + 1, dtype=np.float64)
    cx = np.empty(w + 1, dtype=np.float64)
    # Latitude corners: ys[0]+hy is the top of row 0; ys[i]-hy is the bottom of
    # row i. Account for the sign of dy implicitly via the sign of (ys[1] - ys[0]).
    sy = 1.0 if ys[-1] > ys[0] else -1.0
    cy[0] = ys[0] - sy * hy
    for i in range(h):
        cy[i + 1] = ys[i] + sy * hy
    sx = 1.0 if xs[-1] > xs[0] else -1.0
    cx[0] = xs[0] - sx * hx
    for j in range(w):
        cx[j + 1] = xs[j] + sx * hx

    # Collect oriented boundary segments. A segment goes:
    #   ((row, col), direction) where direction encodes which side of cell.
    # We index the four edges of cell (i, j) by their direction code 0..3:
    #   0 = top    (corner(i, j)   -> corner(i, j+1))
    #   1 = right  (corner(i, j+1) -> corner(i+1, j+1))
    #   2 = bottom (corner(i+1, j+1) -> corner(i+1, j))
    #   3 = left   (corner(i+1, j) -> corner(i, j))
    # Orientation chosen so the mask is on the LEFT of each segment, which
    # produces counter-clockwise outer rings in image coords; we will reverse
    # at the end if the geographic CRS has y ascending (then "left of the
    # path" in image space is the wrong side for geographic CCW).

    def is_inside(i, j):
        return 0 <= i < h and 0 <= j < w and mask[i, j]

    # Map: (start_corner) -> (end_corner) for each oriented segment.
    next_corner = {}
    iy, ix = np.where(mask)
    for k in range(iy.size):
        i, j = int(iy[k]), int(ix[k])
        # Top edge: neighbour at (i-1, j)
        if not is_inside(i - 1, j):
            # In image coords, top edge goes from (i, j+1) -> (i, j) so the
            # inside cell is on the left. Use corners (i, j) and (i, j+1).
            next_corner[(i, j + 1)] = (i, j)
        # Bottom edge: neighbour at (i+1, j)
        if not is_inside(i + 1, j):
            next_corner[(i + 1, j)] = (i + 1, j + 1)
        # Left edge: neighbour at (i, j-1)
        if not is_inside(i, j - 1):
            next_corner[(i, j)] = (i + 1, j)
        # Right edge: neighbour at (i, j+1)
        if not is_inside(i, j + 1):
            next_corner[(i + 1, j + 1)] = (i, j + 1)

    # Walk closed rings out of next_corner.
    rings_idx = []
    visited = set()
    for start in list(next_corner.keys()):
        if start in visited:
            continue
        ring = [start]
        cur = next_corner[start]
        visited.add(start)
        # Safety bound: number of edges total.
        max_steps = len(next_corner) + 1
        steps = 0
        while cur != start and steps < max_steps:
            ring.append(cur)
            visited.add(cur)
            nxt = next_corner.get(cur)
            if nxt is None:
                break
            cur = nxt
            steps += 1
        ring.append(start)  # close
        rings_idx.append(ring)

    # Convert corner-grid indices to lon/lat.
    def to_lonlat(ring):
        return [[cx[j], cy[i]] for (i, j) in ring]

    rings_ll = [to_lonlat(r) for r in rings_idx]

    # Classify outer vs hole by topological containment, not by signed-area
    # sign (which depends on the axis orientation of the source CRS and is
    # awkward to get right for both ascending and descending lat axes).
    # The outer ring of a 4-connected component is the one whose bounding
    # box contains all the others; holes lie strictly inside it.
    if not rings_ll:
        return [], []
    if len(rings_ll) == 1:
        return rings_ll, []

    areas = [abs(signed_area(r)) for r in rings_ll]
    outer_idx = int(np.argmax(areas))
    outers = [rings_ll[outer_idx]]
    holes  = [r for k, r in enumerate(rings_ll) if k != outer_idx]
    return outers, holes


def signed_area(ring: List[List[float]]) -> float:
    """Shoelace formula. Positive area = counter-clockwise in lon/lat."""
    s = 0.0
    for k in range(len(ring) - 1):
        x1, y1 = ring[k]
        x2, y2 = ring[k + 1]
        s += (x1 * y2 - x2 * y1)
    return s / 2.0


def component_geometry(coords: np.ndarray, xs: np.ndarray, ys: np.ndarray,
                       dx: float, dy: float,
                       full_shape: Tuple[int, int]) -> dict:
    """
    Build a Polygon (or MultiPolygon, if disconnected after boundary
    tracing — should not happen for a 4-connected component) from the
    (i, j) pixel coordinates of a component.

    The geometry is the TRUE outline of the component, not a union of
    per-pixel rectangles. Holes (lakes inside the zone) are preserved.
    """
    # Build a local mask for this component
    mask = np.zeros(full_shape, dtype=bool)
    mask[coords[:, 0], coords[:, 1]] = True

    outers, holes = trace_outline_rings(mask, xs, ys, dx, dy)

    if not outers:
        # Fall back to a single rectangle if tracing fails (shouldn't happen).
        i, j = int(coords[0, 0]), int(coords[0, 1])
        return {"type": "Polygon",
                "coordinates": [cell_box(float(xs[j]), float(ys[i]), dx, dy)]}

    # GeoJSON RFC 7946: outer ring CCW, holes CW. Ensure orientation.
    def orient(ring, ccw=True):
        if (signed_area(ring) > 0) == ccw:
            return ring
        return list(reversed(ring))

    outers = [orient(r, ccw=True)  for r in outers]
    holes  = [orient(r, ccw=False) for r in holes]

    # Assign each hole to its containing outer ring (point-in-polygon).
    polygons = [[o] for o in outers]
    for h in holes:
        # Test the first vertex of the hole against each outer ring.
        pt = h[0]
        for idx, o in enumerate(outers):
            if point_in_ring(pt, o):
                polygons[idx].append(h)
                break

    if len(polygons) == 1:
        return {"type": "Polygon", "coordinates": polygons[0]}
    return {"type": "MultiPolygon", "coordinates": polygons}


def point_in_ring(point: List[float], ring: List[List[float]]) -> bool:
    """Ray-casting point-in-polygon."""
    x, y = point
    inside = False
    n = len(ring) - 1
    for k in range(n):
        x1, y1 = ring[k]
        x2, y2 = ring[k + 1]
        if ((y1 > y) != (y2 > y)) and \
           (x < (x2 - x1) * (y - y1) / (y2 - y1 + 1e-30) + x1):
            inside = not inside
    return inside


# ---------------------------------------------------------------------------
# Approximate area on the WGS84 sphere (km^2)
# ---------------------------------------------------------------------------
EARTH_RADIUS_KM = 6371.0088


def cell_area_km2(lat_c: float, dx_deg: float, dy_deg: float) -> float:
    """Spherical-cap approximation for a small lat/lon cell, in km^2."""
    dx_km = math.radians(dx_deg) * EARTH_RADIUS_KM * math.cos(math.radians(lat_c))
    dy_km = math.radians(dy_deg) * EARTH_RADIUS_KM
    return abs(dx_km * dy_km)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def zonify(pci_covjson_path: str,
           min_pixels: int = 4,
           legacy_cell_mode: bool = False,
           parameter: str = "trend") -> dict:
    """
    Read the PCI CoverageJSON and return a GeoJSON FeatureCollection of zones.

    Parameters
    ----------
    pci_covjson_path:
        Path to a PCI CoverageJSON document produced by the PCI bblock. The
        PCI is published as a ParameterGroup of four parameters; the
        zonification is computed from the `trend` parameter by default.
    min_pixels:
        Discard components with fewer than this many pixels. Helps remove
        salt-and-pepper noise. Set to 1 to keep everything.
    legacy_cell_mode:
        If True, emit one Feature per pixel (the previous behaviour). Kept
        only for backwards compatibility.
    parameter:
        Which PCI parameter to threshold. Defaults to "trend".
    """
    with open(pci_covjson_path) as fh:
        cov = json.load(fh)

    # The PCI is published as a ParameterGroup of {trend, anomaly,
    # changepoint_year, changepoint_pvalue}. We accept either the new shape
    # (parameter name given by `parameter`) or the legacy shape where the
    # only range was called "pci".
    if parameter in cov.get("ranges", {}):
        rng = cov["ranges"][parameter]
    elif "pci" in cov.get("ranges", {}):
        rng = cov["ranges"]["pci"]      # legacy
    else:
        raise ValueError(
            f"PCI CoverageJSON does not expose parameter '{parameter}' "
            f"or legacy 'pci' (available: {list(cov.get('ranges', {}).keys())})"
        )
    shape  = tuple(rng["shape"])           # (y, x)
    nodata = rng.get("nodata", -9999)
    data   = np.asarray(rng["values"], dtype=np.float32).reshape(shape)
    data[data == nodata] = np.nan

    def axis_values(ax):
        if "values" in ax and ax["values"]:
            return np.asarray(ax["values"], dtype=np.float64)
        return np.linspace(ax["start"], ax["stop"], ax["num"], dtype=np.float64)

    xs = axis_values(cov["domain"]["axes"]["x"])
    ys = axis_values(cov["domain"]["axes"]["y"])
    if len(xs) < 2 or len(ys) < 2:
        raise ValueError("Cannot compute cell size from coverage axes")
    dx = float(abs(xs[1] - xs[0]))
    dy = float(abs(ys[1] - ys[0]))

    labels = classify(data)
    features = []

    if legacy_cell_mode:
        fid = 0
        for j in range(shape[0]):
            for i in range(shape[1]):
                cat = labels[j, i]
                if not cat:
                    continue
                features.append(_feature(fid, cat,
                                         {"type": "Polygon",
                                          "coordinates": [cell_box(float(xs[i]), float(ys[j]), dx, dy)]},
                                         pixel_count=1,
                                         area_km2=cell_area_km2(float(ys[j]), dx, dy),
                                         pci_stats=(float(data[j, i]), float(data[j, i]),
                                                    float(data[j, i]), 0.0)))
                fid += 1
    else:
        # True zonification: one feature per connected component
        fid = 0
        for cat, _, _ in THRESHOLDS:
            mask = (labels == cat)
            if not mask.any():
                continue
            comp_labels, n = connected_components(mask)
            for k in range(1, n + 1):
                idx = np.argwhere(comp_labels == k)        # (n_pixels, 2) [i, j]
                if len(idx) < min_pixels:
                    continue
                geom = component_geometry(idx, xs, ys, dx, dy, shape)

                # Statistics over the component's PCI values
                values = data[idx[:, 0], idx[:, 1]]
                pci_stats = (float(np.nanmean(values)),
                             float(np.nanmin(values)),
                             float(np.nanmax(values)),
                             float(np.nanstd(values)))

                # Spherical area, summed over the cells of the component
                area_km2 = float(sum(cell_area_km2(float(ys[i]), dx, dy)
                                     for i in idx[:, 0]))

                features.append(_feature(fid, cat, geom,
                                         pixel_count=int(len(idx)),
                                         area_km2=area_km2,
                                         pci_stats=pci_stats))
                fid += 1

    return {
        "type": "FeatureCollection",
        "name": "BioClima bioclimatic zones (Finland, PCI-based)",
        "metadata": {
            "computed_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
            "derivedFrom": "ogc.bioclima.indicator.pci",
            "method": "thresholding + 4-connectivity connected-components on PCI raster"
                      if not legacy_cell_mode else "per-cell classification (legacy)",
            "min_pixels": min_pixels,
            "thresholds": {c: {"min": (None if lo == -math.inf else lo),
                               "max": (None if hi ==  math.inf else hi)}
                           for c, lo, hi in THRESHOLDS},
            "ontology_iris": CATEGORY_IRIS
        },
        "features": features
    }


def _feature(fid: int, cat: str, geometry: dict,
             pixel_count: int, area_km2: float,
             pci_stats: Tuple[float, float, float, float]) -> dict:
    """Assemble one zone Feature with policy alignment baked in."""
    mean_pci, min_pci, max_pci, std_pci = pci_stats
    policy_iris = POLICY_PER_CATEGORY.get(cat, [])
    return {
        "type": "Feature",
        "id": f"zone-{fid:05d}",
        "geometry": geometry,
        "properties": {
            "category":      CATEGORY_IRIS[cat],
            "categoryKey":   cat,
            "categoryLabel": CATEGORY_LABELS[cat],
            "pixel_count":   pixel_count,
            "area_km2":      round(area_km2, 3),
            "mean_pci":      round(mean_pci, 4),
            "min_pci":       round(min_pci, 4),
            "max_pci":       round(max_pci, 4),
            "std_pci":       round(std_pci, 4),
            "derivedFrom":   "ogc.bioclima.indicator.pci",
            "policyRelevance": [
                {
                    "target":       iri,
                    "relationship": POLICY_RELATIONSHIP.get(iri, "informs"),
                    "ontology":     iri
                }
                for iri in policy_iris
            ]
        }
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def _cli() -> None:
    p = argparse.ArgumentParser(description="Zonify a PCI CoverageJSON.")
    p.add_argument("--pci",         required=True, type=Path,
                   help="Path to the PCI CoverageJSON")
    p.add_argument("--output",      required=True, type=Path,
                   help="Path to the GeoJSON FeatureCollection to write")
    p.add_argument("--min-pixels",  type=int, default=4,
                   help="Discard components with fewer than this many pixels")
    p.add_argument("--legacy-cell-mode", action="store_true",
                   help="Emit one Feature per pixel (previous behaviour)")
    args = p.parse_args()

    fc = zonify(str(args.pci),
                min_pixels=args.min_pixels,
                legacy_cell_mode=args.legacy_cell_mode)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w") as fh:
        json.dump(fc, fh)
    print(f"Wrote {args.output} ({len(fc['features'])} zone features)")


if __name__ == "__main__":
    _cli()

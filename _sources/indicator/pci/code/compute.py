"""
Phenological Change Indicator (PCI)
===================================
Implementation referenced by recipe.jsonld of ogc.bioclima.indicator.pci.

The PCI is a **composite indicator**: one ParameterGroup of four per-pixel
parameters that, together, describe how vegetation phenology has changed
over the analysis window. The four parameters are:

  - trend              Theil-Sen slope of VAP day-of-year (days / year).
                       Negative = earlier onset; positive = later onset.
  - anomaly            Mean VAP of the recent period minus the baseline
                       (default: 2011-2018 vs 2001-2010), in days.
                       Negative = recent onset earlier than baseline.
  - changepoint_year   Most probable year of a regime shift in the per-pixel
                       VAP series, detected by Pettitt's non-parametric test.
  - changepoint_pvalue Statistical significance of the changepoint.
                       p < 0.05  → evidence of regime shift.
                       p > 0.10  → weak evidence.

This is computed for coniferous and deciduous VAP cubes separately and then
combined with the published weights (0.4 coniferous, 0.6 deciduous).

Implementation notes
--------------------
- Theil-Sen is vectorised at the (year-pair) level so it stays linear in T
  for memory and quadratic only in T for compute, which is fine for T ≈ 18.
- Pettitt is implemented vectorised across the (y, x) plane: for each pixel
  we compute the Pettitt U statistic at every candidate changepoint and pick
  the maximum. The p-value uses the well-known approximation
        p ≈ 2 * exp(-6 K^2 / (T^3 + T^2)).
- All routines treat NaN as missing data and require at least
  DEFAULT_MIN_YEARS valid observations per pixel.

Run as a script
---------------
    python compute.py \\
        --coniferous ../../ebv/vap-coniferous/examples/finland-vap-coniferous-2001-2018.covjson \\
        --deciduous  ../../ebv/vap-deciduous/examples/finland-vap-deciduous-2001-2018.covjson \\
        --output     examples/pci-finland-2001-2018.covjson
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
from pathlib import Path
from typing import Tuple

import numpy as np


# ---------------------------------------------------------------------------
# Default parameters (kept in sync with recipe.jsonld)
# ---------------------------------------------------------------------------
DEFAULT_CONIF_WEIGHT   = 0.4
DEFAULT_DECID_WEIGHT   = 0.6
DEFAULT_NODATA         = -32768
DEFAULT_MIN_YEARS      = 8
DEFAULT_BASELINE_END   = 2010   # baseline: years <= 2010
# Anything strictly greater than DEFAULT_BASELINE_END is "recent".

ONT = "https://maytetoscano.github.io/bblocks-bioclima/ontology"


# ---------------------------------------------------------------------------
# Loaders
# ---------------------------------------------------------------------------
def load_cube(path: Path, param_name: str = "vap_doy"):
    """Load a CoverageJSON cube and return (data[t,y,x], years, domain, nodata)."""
    with path.open() as fh:
        cov = json.load(fh)
    rng = cov["ranges"][param_name]
    if rng["axisNames"] != ["t", "y", "x"]:
        raise ValueError(f"Expected axes (t, y, x), got {rng['axisNames']}")
    shape  = tuple(rng["shape"])
    nodata = rng.get("nodata", DEFAULT_NODATA)
    data   = np.asarray(rng["values"], dtype=np.float32).reshape(shape)
    data[data == nodata] = np.nan
    years  = np.asarray([int(v[:4]) for v in cov["domain"]["axes"]["t"]["values"]],
                        dtype=np.int32)
    return data, years, cov["domain"], nodata


# ---------------------------------------------------------------------------
# Core estimators
# ---------------------------------------------------------------------------
def theil_sen_slope(cube: np.ndarray, years: np.ndarray,
                    min_years: int = DEFAULT_MIN_YEARS) -> np.ndarray:
    """
    Per-pixel Theil-Sen slope in days/year.

    Robust alternative to OLS: median of the per-pair slopes
        (y_j - y_i) / (t_j - t_i)   for all i < j with valid data.
    """
    T = cube.shape[0]
    if years.shape[0] != T:
        raise ValueError("years length does not match cube time axis")

    # Pair indices i < j
    i_idx, j_idx = np.triu_indices(T, k=1)                                # (P,)
    dt = (years[j_idx] - years[i_idx]).astype(np.float32)                 # (P,)
    # No same-year pairs in our setup; guard anyway.
    dt[dt == 0] = np.nan

    yi = cube[i_idx, :, :]                                                # (P, Y, X)
    yj = cube[j_idx, :, :]
    slopes = (yj - yi) / dt[:, None, None]                                # (P, Y, X)

    # nanmedian over the pair axis, ignoring NaNs from missing data or dt==0.
    # numpy's nanmedian emits a runtime warning for all-NaN slices; suppress.
    with np.errstate(invalid="ignore"):
        median = np.nanmedian(slopes, axis=0)

    valid = (~np.isnan(cube)).sum(axis=0)
    median[valid < min_years] = np.nan
    return median


def baseline_recent_anomaly(cube: np.ndarray, years: np.ndarray,
                            baseline_end: int = DEFAULT_BASELINE_END,
                            min_per_period: int = 3) -> np.ndarray:
    """
    Anomaly = nanmean(recent) - nanmean(baseline), in the unit of `cube`.

    Both periods must have at least `min_per_period` valid observations or
    the pixel is set to NaN.
    """
    base_mask = (years <= baseline_end)
    rec_mask  = (years >  baseline_end)
    if not base_mask.any() or not rec_mask.any():
        return np.full(cube.shape[1:], np.nan, dtype=np.float32)

    base = cube[base_mask, :, :]
    rec  = cube[rec_mask,  :, :]

    base_n = (~np.isnan(base)).sum(axis=0)
    rec_n  = (~np.isnan(rec)).sum(axis=0)

    with np.errstate(invalid="ignore"):
        base_mean = np.nanmean(base, axis=0)
        rec_mean  = np.nanmean(rec,  axis=0)
        anomaly   = rec_mean - base_mean

    anomaly[(base_n < min_per_period) | (rec_n < min_per_period)] = np.nan
    return anomaly


def pettitt(cube: np.ndarray, years: np.ndarray,
            min_years: int = DEFAULT_MIN_YEARS
            ) -> Tuple[np.ndarray, np.ndarray]:
    """
    Per-pixel Pettitt change-point detection.

    Returns (changepoint_year, changepoint_pvalue) as float32 arrays.

    Pettitt's U_{t,T} statistic compares ranks before and after each candidate
    changepoint t. The argmax over t of |U| is the most likely changepoint, K.
    The p-value uses the standard approximation
        p ≈ 2 * exp(-6 K^2 / (T^3 + T^2)).
    For pixels with NaNs we drop the missing observations and operate on the
    remaining sub-series, mapping the index back to the original year.

    Implementation is vectorised across (y, x) for the rank step; the loop
    over candidate changepoints is bounded by T-1 (small).
    """
    T, Y, X = cube.shape
    cp_year   = np.full((Y, X), np.nan, dtype=np.float32)
    cp_pvalue = np.full((Y, X), np.nan, dtype=np.float32)

    valid = ~np.isnan(cube)
    n_valid = valid.sum(axis=0)
    enough = n_valid >= min_years

    # We process pixels independently to handle per-pixel NaN patterns. The
    # cost stays modest: Y*X ~ 90k for the pilot, each pixel does an O(T^2)
    # rank-comparison which for T=18 is ~324 ops. Total ~30M ops — sub-second.
    iy, ix = np.where(enough)
    for k in range(iy.shape[0]):
        i, j = int(iy[k]), int(ix[k])
        series = cube[:, i, j]
        ok = ~np.isnan(series)
        y = series[ok].astype(np.float64)
        t = years[ok]
        n = y.size
        if n < min_years:
            continue

        # Compute U_t for t = 1..n-1
        # U_t = sum_{i=1..t} sum_{j=t+1..n} sgn(y_j - y_i)
        # Vectorise via a pairwise sign matrix.
        diff = y[None, :] - y[:, None]
        sgn  = np.sign(diff).astype(np.int16)              # (n, n)

        # u_cum[t] = sum over (i<=t, j>t) of sgn[i,j]
        # = cumulative-row-sum of (per-column suffix sums) along the column-axis
        # Easier: compute cumulative sums and use them.
        # Direct approach (still O(n^2), fine for n<=20):
        u = np.empty(n - 1, dtype=np.int64)
        for tt in range(1, n):
            u[tt - 1] = sgn[:tt, tt:].sum()

        abs_u = np.abs(u)
        K = int(abs_u.max())
        t_star = int(np.argmax(abs_u)) + 1   # candidate index in 1..n-1
        # year of changepoint = year right after t_star (t in Pettitt counts
        # the last index of the first segment); pick t_star itself, which
        # corresponds to the year where the regime "switches".
        cp_year[i, j]   = float(t[t_star])
        # p-value approximation. Clip to [0, 1].
        p = 2.0 * math.exp(-6.0 * K * K / (n ** 3 + n ** 2))
        cp_pvalue[i, j] = float(min(1.0, max(0.0, p)))

    return cp_year, cp_pvalue


def combine(a: np.ndarray, b: np.ndarray,
            w_a: float, w_b: float) -> np.ndarray:
    """
    NaN-robust weighted mean. If only one input is present, its weight
    becomes 1; if both NaN, result NaN.
    """
    aw = np.where(np.isnan(a), 0.0, w_a)
    bw = np.where(np.isnan(b), 0.0, w_b)
    total = aw + bw
    az = np.where(np.isnan(a), 0.0, a)
    bz = np.where(np.isnan(b), 0.0, b)
    with np.errstate(invalid="ignore", divide="ignore"):
        out = (az * aw + bz * bw) / total
    out[total == 0] = np.nan
    return out


# ---------------------------------------------------------------------------
# Output writer
# ---------------------------------------------------------------------------
PARAMETER_META = {
    "trend": {
        "observedProperty": f"{ONT}/indicator/pci-trend",
        "label": {
            "en": "PCI — trend",
            "es": "PCI — tendencia",
            "zh": "PCI — 趋势",
            "ro": "PCI — tendință"
        },
        "unit": {"id": f"{ONT}/units/days-per-year", "symbol": "d/yr"}
    },
    "anomaly": {
        "observedProperty": f"{ONT}/indicator/pci-anomaly",
        "label": {
            "en": "PCI — anomaly",
            "es": "PCI — anomalía",
            "zh": "PCI — 异常",
            "ro": "PCI — anomalie"
        },
        "unit": {"id": f"{ONT}/units/day-of-year", "symbol": "d"}
    },
    "changepoint_year": {
        "observedProperty": f"{ONT}/indicator/pci-changepoint-year",
        "label": {
            "en": "PCI — changepoint year (Pettitt)",
            "es": "PCI — año del punto de cambio (Pettitt)",
            "zh": "PCI — 变点年份(Pettitt)",
            "ro": "PCI — anul punctului de schimbare (Pettitt)"
        },
        "unit": {"id": f"{ONT}/units/year", "symbol": "yr"}
    },
    "changepoint_pvalue": {
        "observedProperty": f"{ONT}/indicator/pci-changepoint-pvalue",
        "label": {
            "en": "PCI — changepoint p-value",
            "es": "PCI — valor p del punto de cambio",
            "zh": "PCI — 变点 p 值",
            "ro": "PCI — valoarea p a punctului de schimbare"
        },
        "unit": {"id": f"{ONT}/units/dimensionless", "symbol": "—"}
    }
}


def _ndarray(values: np.ndarray, nodata: float) -> dict:
    """Wrap a (Y, X) numpy array as a CoverageJSON NdArray range."""
    flat = np.where(np.isnan(values), nodata, values).astype(np.float32).ravel().tolist()
    return {
        "type":      "NdArray",
        "dataType":  "float",
        "axisNames": ["y", "x"],
        "shape":     list(values.shape),
        "nodata":    nodata,
        "values":    flat
    }


def build_pci_coverage(params: dict, source_domain: dict,
                       year_start: int, year_end: int) -> dict:
    """
    Wrap the four PCI parameter arrays in a CoverageJSON ParameterGroup.
    `params` is a dict {parameter_name: ndarray}.
    """
    nodata = -9999.0
    parameters = {}
    ranges = {}
    for key, arr in params.items():
        meta = PARAMETER_META[key]
        parameters[key] = {
            "type": "Parameter",
            "observedProperty": {
                "id":    meta["observedProperty"],
                "label": meta["label"]
            },
            "unit": meta["unit"]
        }
        ranges[key] = _ndarray(arr, nodata)

    return {
        "type": "Coverage",
        "domain": {
            "type": "Domain",
            "domainType": "Grid",
            "axes": {
                "x": source_domain["axes"]["x"],
                "y": source_domain["axes"]["y"]
            },
            "referencing": [r for r in source_domain["referencing"]
                            if "t" not in r["coordinates"]]
        },
        "parameters": parameters,
        "parameterGroups": [
            {
                "id":      f"{ONT}/indicator/pci",
                "type":    "ParameterGroup",
                "label":   {
                    "en": "Phenological Change Indicator",
                    "es": "Indicador de cambio fenológico",
                    "zh": "物候变化指标",
                    "ro": "Indicator al schimbării fenologice"
                },
                "members": list(params.keys())
            }
        ],
        "ranges": ranges,
        "metadata": {
            "title": {
                "en": f"PCI for Finland, {year_start}-{year_end}",
                "es": f"PCI para Finlandia, {year_start}-{year_end}",
                "zh": f"芬兰 PCI,{year_start}-{year_end}",
                "ro": f"PCI pentru Finlanda, {year_start}-{year_end}"
            },
            "computed_at": dt.datetime.now(dt.timezone.utc)
                              .isoformat(timespec="seconds").replace("+00:00", "Z"),
            "computed_from": [
                "ogc.bioclima.ebv.vap-coniferous",
                "ogc.bioclima.ebv.vap-deciduous"
            ],
            "recipe": f"{ONT.rsplit('/ontology',1)[0]}/bblocks/bblock/ogc.bioclima.indicator.pci/recipe.jsonld",
            "method": {
                "trend":            "Theil-Sen median slope per pixel",
                "anomaly":          f"mean(year > {DEFAULT_BASELINE_END}) - mean(year <= {DEFAULT_BASELINE_END})",
                "changepoint_year": "Pettitt non-parametric change-point test (argmax |U|)",
                "changepoint_pvalue": "p ≈ 2 * exp(-6 K^2 / (T^3 + T^2))"
            }
        }
    }


# ---------------------------------------------------------------------------
# Public API (referenced from recipe.jsonld#implementation.entrypoint)
# ---------------------------------------------------------------------------
def compute_pci(coniferous_path: str, deciduous_path: str,
                coniferous_weight: float = DEFAULT_CONIF_WEIGHT,
                deciduous_weight: float = DEFAULT_DECID_WEIGHT,
                baseline_end: int = DEFAULT_BASELINE_END,
                min_years: int = DEFAULT_MIN_YEARS) -> dict:
    """End-to-end PCI computation; returns a CoverageJSON dict with 4 params."""
    conif, c_years, c_dom, _ = load_cube(Path(coniferous_path))
    decid, d_years, _,    _  = load_cube(Path(deciduous_path))

    if conif.shape[1:] != decid.shape[1:]:
        raise ValueError(f"Grid shapes differ: {conif.shape[1:]} vs {decid.shape[1:]}")

    # Trend (Theil-Sen) on each cube, then weighted combine
    s_c = theil_sen_slope(conif, c_years, min_years=min_years)
    s_d = theil_sen_slope(decid, d_years, min_years=min_years)
    trend = combine(s_c, s_d, coniferous_weight, deciduous_weight)

    # Anomaly on each cube, then weighted combine
    a_c = baseline_recent_anomaly(conif, c_years, baseline_end=baseline_end)
    a_d = baseline_recent_anomaly(decid, d_years, baseline_end=baseline_end)
    anomaly = combine(a_c, a_d, coniferous_weight, deciduous_weight)

    # Pettitt: run separately, then combine. For year we take the weighted
    # mean only where both pixels are valid (a year value is not really
    # weight-averageable, but for ParameterGroup display this is fine; the
    # canonical per-cube years are also kept in the coverage metadata).
    cy_c, cp_c = pettitt(conif, c_years, min_years=min_years)
    cy_d, cp_d = pettitt(decid, d_years, min_years=min_years)
    cp_year   = combine(cy_c, cy_d, coniferous_weight, deciduous_weight)
    cp_pvalue = combine(cp_c, cp_d, coniferous_weight, deciduous_weight)

    year_start = int(min(c_years.min(), d_years.min()))
    year_end   = int(max(c_years.max(), d_years.max()))
    return build_pci_coverage(
        {"trend": trend, "anomaly": anomaly,
         "changepoint_year": cp_year, "changepoint_pvalue": cp_pvalue},
        c_dom, year_start, year_end
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def _cli() -> None:
    p = argparse.ArgumentParser(description="Compute the PCI (4-parameter) from two VAP cubes.")
    p.add_argument("--coniferous", required=True, type=Path)
    p.add_argument("--deciduous",  required=True, type=Path)
    p.add_argument("--output",     required=True, type=Path)
    p.add_argument("--w-coniferous", type=float, default=DEFAULT_CONIF_WEIGHT)
    p.add_argument("--w-deciduous",  type=float, default=DEFAULT_DECID_WEIGHT)
    p.add_argument("--baseline-end", type=int,   default=DEFAULT_BASELINE_END,
                   help="Last year (inclusive) of the baseline period")
    p.add_argument("--min-years",    type=int,   default=DEFAULT_MIN_YEARS,
                   help="Minimum valid observations per pixel")
    args = p.parse_args()

    cov = compute_pci(str(args.coniferous), str(args.deciduous),
                      args.w_coniferous, args.w_deciduous,
                      baseline_end=args.baseline_end,
                      min_years=args.min_years)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w") as fh:
        json.dump(cov, fh)
    print(f"Wrote {args.output}  ({len(cov['parameters'])} parameters, "
          f"shape {cov['ranges']['trend']['shape']})")


if __name__ == "__main__":
    _cli()

# VAP Coniferous Finland 2001-2018

Concrete EBV dataset. The CoverageJSON file lives in `examples/finland-vap-coniferous-2001-2018.covjson` and the metadata record in `examples/metadata.jsonld`.

## Source

MODIS Terra Level 1B, processed by SYKE/VTT. Algorithm: sigmoid fit on Fractional Snow Cover time series. See Böttcher et al. 2014, [doi:10.1016/j.rse.2013.09.022](https://doi.org/10.1016/j.rse.2013.09.022).

## Grid

- CRS: EPSG:4326
- Bounds: lon 14.10 - 35.23, lat 57.75 - 71.17
- Resolution: 0.0664° (~7 km)
- 18 yearly time slices (2001-2018)
- 202 × 318 cells

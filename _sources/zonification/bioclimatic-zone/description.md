# Bioclimatic zonification from PCI

Classifies the continuous PCI raster into four categorical zones (stable, mild advance, strong advance, delay) using published thresholds, then emits a GeoJSON FeatureCollection enriched with category IRIs (from the BioClima ontology) and policy references.

## Thresholds

| Category | PCI range (days/year) |
|---|---|
| Strong advance | < -0.5 |
| Mild advance | -0.5 to -0.2 |
| Stable | -0.2 to +0.2 |
| Delay | > +0.2 |

## Implementation

[`code/zonify.py`](code/zonify.py) reads the PCI CoverageJSON, classifies each cell and emits a GeoJSON polygon per cell with statistics and policy links.

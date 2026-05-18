# Phenological Change Indicator (PCI)

Measures the rate of change of the start of the vegetation active period, in days/year.

## How it is computed

For every pixel, an ordinary-least-squares trend is fitted to the 18-year time series of VAP-DOY values, separately for coniferous and deciduous forests. The two trends are combined as a weighted mean (0.4 coniferous, 0.6 deciduous).

The implementation is in [`code/compute.py`](code/compute.py). The recipe in [`recipe.jsonld`](recipe.jsonld) declares all parameters semantically.

The CI workflow `recompute-indicators.yml` re-runs the script whenever an EBV input changes.

## Output

A CoverageJSON raster with the same spatial grid as the EBV inputs, single parameter `pci` in days/year. The Finland example produces ~13,600 valid pixels with trends ranging from -0.77 to +0.81 days/year.

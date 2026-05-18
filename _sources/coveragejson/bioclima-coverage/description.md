# BioClima CoverageJSON profile

A profile of the OGC CoverageJSON Community Standard that BioClima EBV and indicator datasets must conform to.

## What it constrains

- The root `type` must be `"Coverage"`.
- The `domain.referencing` must declare EPSG:4326 for the spatial axes (`y`, `x`).
- Every `parameter` must have an `observedProperty.id` that resolves to a SKOS concept in the [BioClima ontology](../../../ontology/).
- Every `parameter.observedProperty.label` should provide values in **en**, **es**, **zh** and **ro**.

## Why

The semantic link from each cell value to its multilingual definition only works if every parameter id points to a known concept. This profile makes that requirement enforceable.

See the [example](examples/minimal-coverage.covjson) for a minimal valid file.

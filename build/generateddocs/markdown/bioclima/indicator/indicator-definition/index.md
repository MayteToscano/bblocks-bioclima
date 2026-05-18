
# Spatial Indicator Definition (generic) (Schema)

`ogc.bioclima.indicator.indicator-definition` *v0.2.0*

Generic recipe-style schema for a spatial biodiversity indicator: declares EBV inputs, parameters, output unit, implementation entry point (Python script and version) and policy alignment. Concrete indicators such as the Phenological Change Indicator (PCI) and the Bioclimatic Zonification follow this template. The schema enforces an explicit link to KMGBF/SDG targets so every indicator is auditable end-to-end.

[*Status*](http://www.opengis.net/def/status): Under development

## Description

# Indicator Definition (generic)

Recipe-style schema describing a biodiversity indicator. Concrete indicators (e.g. PCI) inherit this template and provide their own Python implementation under `code/`.

## Required fields

- `id` (IRI in the BioClima ontology)
- `label` and `definition` (multilingual)
- `inputs` (which EBVs)
- `implementation` (entry point file + version)
- `output.unit`
- `policyAlignment`

## Examples

### PCI recipe
Recipe of the Phenological Change Indicator, conforming to this schema.
#### json
```json
{
  "id": "https://maytetoscano.github.io/bblocks-bioclima/ontology/indicator/pci",
  "label": {
    "en": "Phenological Change Indicator",
    "es": "Indicador de cambio fenológico",
    "zh": "物候变化指标",
    "ro": "Indicator al schimbării fenologice"
  },
  "definition": {
    "en": "Rate of change of vegetation active period onset, computed as the weighted mean of per-pixel linear trends for coniferous and deciduous forests.",
    "es": "Tasa de cambio del inicio del periodo activo de vegetación, calculada como la media ponderada de tendencias lineales por píxel para coníferas y caducifolios.",
    "zh": "植被活动期开始日期的变化率,计算为针叶林和落叶林每像素线性趋势的加权平均值。",
    "ro": "Rata de schimbare a începutului perioadei active a vegetației, calculată ca medie ponderată a tendințelor liniare per pixel pentru păduri de conifere și foioase."
  },
  "inputs": [
    {
      "role": "coniferous_series",
      "ebv": "ogc.bioclima.ebv.vap-coniferous",
      "constraint": "https://maytetoscano.github.io/bblocks-bioclima/ontology/entity/coniferous-forest",
      "minYears": 10
    },
    {
      "role": "deciduous_series",
      "ebv": "ogc.bioclima.ebv.vap-deciduous",
      "constraint": "https://maytetoscano.github.io/bblocks-bioclima/ontology/entity/deciduous-vegetation",
      "minYears": 10
    }
  ],
  "parameters": {
    "coniferous_weight": 0.4,
    "deciduous_weight": 0.6,
    "trend_method": "ordinary-least-squares",
    "min_valid_years": 8
  },
  "implementation": {
    "language": "python",
    "entrypoint": "compute.py#compute_pci",
    "version": "1.0.0",
    "requirements": "requirements.txt"
  },
  "output": {
    "unit": "https://maytetoscano.github.io/bblocks-bioclima/ontology/units/days-per-year",
    "format": "CoverageJSON"
  },
  "policyAlignment": [
    "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/kmgbf-target-8",
    "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/sdg-15"
  ]
}
```

## Schema

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://maytetoscano.github.io/bblocks-bioclima/bblock/ogc.bioclima.indicator.indicator-definition/schema.yaml
title: Indicator Definition (generic)
type: object
required:
- id
- label
- definition
- inputs
- implementation
- output
properties:
  id:
    type: string
    format: iri
  label:
    type: object
    required:
    - en
  definition:
    type: object
    required:
    - en
  inputs:
    type: array
    minItems: 1
    items:
      type: object
      required:
      - role
      - ebv
      properties:
        role:
          type: string
        ebv:
          type: string
          format: iri
        constraint:
          type: string
          format: iri
        minYears:
          type: integer
          minimum: 1
  parameters:
    type: object
  implementation:
    type: object
    required:
    - language
    - entrypoint
    - version
    properties:
      language:
        type: string
      entrypoint:
        type: string
      version:
        type: string
      requirements:
        type: string
  output:
    type: object
    required:
    - unit
    properties:
      unit:
        type: string
        format: iri
      format:
        type: string
  policyAlignment:
    type: array
    items:
      type: string
      format: iri

```

Links to the schema:

* YAML version: [schema.yaml](https://raw.githubusercontent.com/MayteToscano/bblocks-bioclima/undefined/build/annotated/bioclima/indicator/indicator-definition/schema.json)
* JSON version: [schema.json](https://raw.githubusercontent.com/MayteToscano/bblocks-bioclima/undefined/build/annotated/bioclima/indicator/indicator-definition/schema.yaml)

## Sources

* [BioClima interactive map viewer (all layers)](https://maytetoscano.github.io/bblocks-bioclima/viewer/)
* [BioClima registry — classified by family (indicator)](https://maytetoscano.github.io/bblocks-bioclima/viewer/registry.html#fam-indicator)

# For developers

The source code for this Building Block can be found in the following repository:

* URL: [https://github.com/MayteToscano/bblocks-bioclima](https://github.com/MayteToscano/bblocks-bioclima)
* Path: `_sources/indicator/indicator-definition`


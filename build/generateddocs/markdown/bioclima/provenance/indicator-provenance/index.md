
# Indicator Provenance (W3C PROV) (Schema)

`ogc.bioclima.provenance.indicator-provenance` *v0.2.0*

PROV-O record for a computed indicator: references the EBV inputs by bblock ID, the Python implementation by URL, the exact git commit hash and the GitHub Actions run id. This makes every PCI value re-derivable from raw observations.

[*Status*](http://www.opengis.net/def/status): Under development

## Description

# Indicator Provenance

PROV-O record for a computed indicator. Captures the input EBV bblocks, the implementation script URL, its git commit hash, the GitHub Actions run id and the numerical parameters used. Generated automatically by `recompute-indicators.yml`.

## Examples

### PCI provenance
Provenance record for the PCI computation.
#### json
```json
{
  "@context": {
    "@vocab": "http://www.w3.org/ns/prov#"
  },
  "entity": "ogc.bioclima.indicator.pci/examples/pci-finland-2001-2018.covjson",
  "wasDerivedFrom": [
    "ogc.bioclima.ebv.vap-coniferous",
    "ogc.bioclima.ebv.vap-deciduous"
  ],
  "wasGeneratedBy": {
    "activity": "Compute PCI from VAP-DOY cubes",
    "script": "https://maytetoscano.github.io/bblocks-bioclima/_sources/indicator/pci/code/compute.py",
    "scriptVersion": "c970ce8dcb321e905a70d4afd42bb94183e8ec98",
    "startedAtTime": "2024-11-01T12:00:00Z",
    "endedAtTime": "2026-05-15T13:46:31Z",
    "parameters": {
      "coniferous_weight": 0.4,
      "deciduous_weight": 0.6,
      "trend_method": "ordinary-least-squares",
      "min_valid_years": 8
    },
    "runId": "25921259629"
  },
  "wasAttributedTo": {
    "agent": "github://maytetoscano/bblocks-bioclima/.github/workflows/recompute-indicators.yml",
    "role": "Software agent"
  }
}
```

## Schema

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://maytetoscano.github.io/bblocks-bioclima/bblock/ogc.bioclima.provenance.indicator-provenance/schema.yaml
title: Indicator Provenance
allOf:
- $ref: https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/provenance/ebv-provenance/schema.yaml
- type: object
  properties:
    wasGeneratedBy:
      type: object
      required:
      - script
      - scriptVersion
      properties:
        script:
          type: string
          format: iri
        scriptVersion:
          type: string
        runId:
          type: string
        parameters:
          type: object

```

Links to the schema:

* YAML version: [schema.yaml](https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/provenance/indicator-provenance/schema.json)
* JSON version: [schema.json](https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/provenance/indicator-provenance/schema.yaml)

## Sources

* [BioClima interactive map viewer (all layers)](https://maytetoscano.github.io/bblocks-bioclima/viewer/)
* [BioClima registry — classified by family (provenance)](https://maytetoscano.github.io/bblocks-bioclima/viewer/registry.html#fam-provenance)

# For developers

The source code for this Building Block can be found in the following repository:

* URL: [https://github.com/MayteToscano/bblocks-bioclima](https://github.com/MayteToscano/bblocks-bioclima)
* Path: `_sources/provenance/indicator-provenance`



# BioClima CoverageJSON profile (Schema)

`ogc.bioclima.coveragejson.bioclima-coverage` *v0.2.0*

Central CoverageJSON profile for the whole BioClima register. Every EBV dataset and every gridded indicator (PCI, zonification) is shipped as a CoverageJSON document that conforms to this profile. The profile fixes EPSG:4326 for spatial axes, allows an optional ISO 8601 temporal axis, and requires every parameter to declare an observedProperty.id resolvable in the BioClima ontology with labels in English, Spanish, Chinese and Romanian. This is the pivot block of the register: it connects raw geospatial encoding to ontology concepts and, downstream, to indicators and zonification.

[*Status*](http://www.opengis.net/def/status): Under development

## Description

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

## Examples

### Minimal BioClima Coverage
A small 3×3×2 grid showing the required structure of a BioClima coverage.
Note the `observedProperty.id` pointing to the BioClima ontology and the
multilingual labels.

#### json
```json
{
  "type": "Coverage",
  "domain": {
    "type": "Domain",
    "domainType": "Grid",
    "axes": {
      "x": { "values": [14.10, 14.17, 14.23] },
      "y": { "values": [57.75, 57.82, 57.88] },
      "t": { "values": ["2010-01-01T00:00:00Z", "2011-01-01T00:00:00Z"] }
    },
    "referencing": [
      {
        "coordinates": ["y", "x"],
        "system": {
          "type": "GeographicCRS",
          "id": "http://www.opengis.net/def/crs/EPSG/0/4326"
        }
      },
      {
        "coordinates": ["t"],
        "system": { "type": "TemporalRS", "calendar": "Gregorian" }
      }
    ]
  },
  "parameters": {
    "vap_doy": {
      "type": "Parameter",
      "observedProperty": {
        "id": "https://maytetoscano.github.io/bblocks-bioclima/ontology/ebv/vap_doy",
        "label": {
          "en": "Start of VAP (Day of Year)",
          "es": "Inicio del periodo activo de vegetación (día del año)",
          "zh": "植被活动期开始(年积日)",
          "ro": "Începutul perioadei active a vegetației (ziua din an)"
        }
      },
      "unit": {
        "id": "https://maytetoscano.github.io/bblocks-bioclima/ontology/units/day-of-year",
        "symbol": "DOY"
      }
    }
  },
  "ranges": {
    "vap_doy": {
      "type": "NdArray",
      "dataType": "integer",
      "axisNames": ["t", "y", "x"],
      "shape": [2, 3, 3],
      "nodata": -32768,
      "values": [120, 122, 121, 119, 121, 123, 118, 120, 122,
                 118, 119, 120, 117, 118, 121, 116, 117, 120]
    }
  }
}

```

## Schema

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://maytetoscano.github.io/bblocks-bioclima/bblock/ogc.bioclima.coveragejson.bioclima-coverage/schema.yaml
title: BioClima CoverageJSON profile
description: "Profile of CoverageJSON for BioClima EBV and Indicator datasets:\n  -
  type MUST be \"Coverage\"\n  - referencing MUST include EPSG:4326 for (y, x)\n  -
  every parameter MUST have observedProperty.id resolvable in the BioClima ontology\n
  \ - parameter labels SHOULD be available in en/es/zh/ro\n"
type: object
required:
- type
- domain
- parameters
- ranges
properties:
  type:
    const: Coverage
  domain:
    type: object
    required:
    - type
    - axes
    - referencing
    properties:
      type:
        const: Domain
      domainType:
        type: string
      axes:
        type: object
      referencing:
        type: array
        minItems: 1
  parameters:
    type: object
    minProperties: 1
    additionalProperties:
      $ref: '#/$defs/Parameter'
  ranges:
    type: object
    minProperties: 1
    additionalProperties:
      type: object
      required:
      - type
      - dataType
      - axisNames
      - shape
      properties:
        type:
          const: NdArray
        dataType:
          enum:
          - float
          - integer
        axisNames:
          type: array
          items:
            type: string
        shape:
          type: array
          items:
            type: integer
        values:
          type: array
        nodata:
          type: number
  metadata:
    type: object
$defs:
  Parameter:
    type: object
    required:
    - type
    - observedProperty
    properties:
      type:
        const: Parameter
      observedProperty:
        type: object
        required:
        - id
        - label
        properties:
          id:
            type: string
            format: iri
            pattern: ^https://maytetoscano\.github\.io/bblocks-bioclima/
            description: Must resolve to a SKOS Concept in the BioClima ontology
          label:
            type: object
            required:
            - en
            properties:
              en:
                type: string
              es:
                type: string
              zh:
                type: string
              ro:
                type: string
          description:
            type: object
      unit:
        type: object

```

Links to the schema:

* YAML version: [schema.yaml](https://raw.githubusercontent.com/MayteToscano/bblocks-bioclima/undefined/build/annotated/bioclima/coveragejson/bioclima-coverage/schema.json)
* JSON version: [schema.json](https://raw.githubusercontent.com/MayteToscano/bblocks-bioclima/undefined/build/annotated/bioclima/coveragejson/bioclima-coverage/schema.yaml)

## Sources

* [BioClima interactive map viewer (all layers)](https://maytetoscano.github.io/bblocks-bioclima/viewer/)
* [BioClima registry — classified by family (coveragejson)](https://maytetoscano.github.io/bblocks-bioclima/viewer/registry.html#fam-coveragejson)
* [CoverageJSON 1.0 specification](https://covjson.org/spec/)
* [OGC 21-069r2 CoverageJSON Community Standard](https://docs.ogc.org/cs/21-069r2/21-069r2.html)

# For developers

The source code for this Building Block can be found in the following repository:

* URL: [https://github.com/MayteToscano/bblocks-bioclima](https://github.com/MayteToscano/bblocks-bioclima)
* Path: `_sources/coveragejson/bioclima-coverage`



# EBV Provenance (W3C PROV) (Schema)

`ogc.bioclima.provenance.ebv-provenance` *v0.2.0*

PROV-O encoded lineage for an EBV dataset: raw satellite input(s), processing activity, agent, methodology citation. Inspired by the bblock-prov-schema-x reference pattern: every Bioclima EBV must carry a provenance record so downstream indicators inherit the chain of custody.

[*Status*](http://www.opengis.net/def/status): Under development

## Description

# EBV Provenance (W3C PROV)

PROV-O record describing the lineage of an EBV dataset: raw inputs (satellite acquisitions), processing activity, agent and methodology citation.

## Examples

### VAP coniferous provenance
Provenance record for the Finnish coniferous VAP EBV.
#### json
```json
{
  "@context": {
    "@vocab": "http://www.w3.org/ns/prov#"
  },
  "entity": "ogc.bioclima.ebv.vap-coniferous",
  "wasDerivedFrom": [
    "https://laadsweb.modaps.eosdis.nasa.gov/MODIS-Terra-L1B",
    "https://en.ilmatieteenlaitos.fi/satellite-receiving-station-sodankyla"
  ],
  "wasGeneratedBy": {
    "activity": "Derivation of Start-of-VAP from MODIS Fractional Snow Cover",
    "startedAtTime": "2020-06-01T00:00:00Z",
    "endedAtTime": "2020-11-04T00:00:00Z",
    "hadPlan": "https://doi.org/10.1016/j.rse.2013.09.022"
  },
  "wasAttributedTo": {
    "agent": "Kristin Böttcher",
    "role": "Principal investigator",
    "organization": "Finnish Environment Institute (SYKE)"
  }
}
```

## Schema

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://maytetoscano.github.io/bblocks-bioclima/bblock/ogc.bioclima.provenance.ebv-provenance/schema.yaml
title: EBV Provenance
type: object
required:
- entity
- wasGeneratedBy
- wasAttributedTo
properties:
  entity:
    type: string
    format: iri
  wasDerivedFrom:
    type: array
    items:
      type: string
      format: iri
  wasGeneratedBy:
    type: object
    required:
    - activity
    - startedAtTime
    - endedAtTime
    properties:
      activity:
        type: string
      startedAtTime:
        type: string
        format: date-time
      endedAtTime:
        type: string
        format: date-time
      hadPlan:
        type: string
        format: iri
  wasAttributedTo:
    type: object
    required:
    - agent
    properties:
      agent:
        type: string
      role:
        type: string
      organization:
        type: string

```

Links to the schema:

* YAML version: [schema.yaml](https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/provenance/ebv-provenance/schema.json)
* JSON version: [schema.json](https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/provenance/ebv-provenance/schema.yaml)

## Sources

* [BioClima interactive map viewer (all layers)](https://maytetoscano.github.io/bblocks-bioclima/viewer/)
* [BioClima registry — classified by family (provenance)](https://maytetoscano.github.io/bblocks-bioclima/viewer/registry.html#fam-provenance)

# For developers

The source code for this Building Block can be found in the following repository:

* URL: [https://github.com/MayteToscano/bblocks-bioclima](https://github.com/MayteToscano/bblocks-bioclima)
* Path: `_sources/provenance/ebv-provenance`


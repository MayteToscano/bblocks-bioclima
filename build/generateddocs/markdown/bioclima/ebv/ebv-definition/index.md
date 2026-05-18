
# EBV Definition (generic) (Schema)

`ogc.bioclima.ebv.ebv-definition` *v0.2.0*

Generic schema describing an Essential Biodiversity Variable dataset following the GeoBON inventory model. Concrete EBVs (such as vap-coniferous and vap-deciduous) inherit this template and provide their actual CoverageJSON file (conformant to the central bioclima-coverage profile) inside their own examples/ folder. Every EBV record declares its observed property by IRI into the Bioclima ontology, so the same template scales to any biodiversity variable.

[*Status*](http://www.opengis.net/def/status): Under development

## Description

# EBV Definition

Generic template that every BioClima EBV record must follow. Modeled after the GeoBON portal inventory (`id`, `naming_authority`, `title`, `doi`, `ebv class/name/entity`, `geospatial`, `time_coverage`, `license`, `creator`).

## Examples

### VAP Coniferous Finland metadata record
A concrete EBV metadata record that conforms to this schema.
#### json
```json
{
  "id": "10-coniferous",
  "naming_authority": "The German Centre for Integrative Biodiversity Research (iDiv) Halle-Jena-Leipzig",
  "title": {
    "en": "Start of Vegetation Active Period in Coniferous Forests of Finland",
    "es": "Inicio del periodo activo de vegetación en bosques de coníferas de Finlandia",
    "zh": "芬兰针叶林植被活动期开始",
    "ro": "Începutul perioadei active a vegetației în pădurile de conifere din Finlanda"
  },
  "product_version": "2",
  "doi": "10.25829/xf8ek6",
  "date_created": "2020-11-04",
  "date_issued": "2023-07-18",
  "summary": {
    "en": "Yearly maps (2001-2018) of the start of the vegetation active period in coniferous forests in Finland, derived from MODIS Fractional Snow Cover.",
    "es": "Mapas anuales (2001-2018) del inicio del periodo activo de vegetación en bosques de coníferas en Finlandia, derivados de la cobertura fraccional de nieve de MODIS.",
    "zh": "芬兰针叶林植被活动期开始的年度地图(2001-2018),源自 MODIS 分数雪盖。",
    "ro": "Hărți anuale (2001-2018) ale începutului perioadei active a vegetației în pădurile de conifere din Finlanda, derivate din acoperirea fracționată cu zăpadă MODIS."
  },
  "keywords": [
    "Boreal",
    "Green-up",
    "Phenology",
    "Vegetation",
    "Start of season"
  ],
  "references": [
    "https://doi.org/10.1016/j.rse.2013.09.022",
    "https://doi.org/10.3390/rs8070580"
  ],
  "source": "MODIS Terra Level 1B, processed by SYKE/VTT.",
  "license": "https://creativecommons.org/licenses/by/4.0",
  "creator": {
    "name": "Kristin Böttcher",
    "email": "Kristin.Bottcher@ymparisto.fi",
    "institution": "The Finnish Environment Institute (SYKE)"
  },
  "ebv": {
    "ebv_class": "https://maytetoscano.github.io/bblocks-bioclima/ontology/ebv/ecosystem-functioning",
    "ebv_name": "https://maytetoscano.github.io/bblocks-bioclima/ontology/ebv/ecosystem-phenology"
  },
  "ebv_entity": {
    "ebv_entity_type": "https://maytetoscano.github.io/bblocks-bioclima/ontology/entity/coniferous-forest",
    "ebv_entity_scope": "Coniferous forests in Finland",
    "ebv_entity_names": [
      "Coniferous"
    ]
  },
  "ebv_metric": {
    "vap_doy": {
      "standard_name": {
        "en": "Start of VAP (Day of Year)",
        "es": "Inicio del VAP (día del año)",
        "zh": "VAP 起始(年积日)",
        "ro": "Începutul VAP (ziua din an)"
      },
      "long_name": {
        "en": "The day when coniferous trees start to photosynthesize in spring, used as a proxy for the start of the vegetation active period.",
        "es": "Día en que las coníferas empiezan a fotosintetizar en primavera, usado como indicador del inicio del periodo activo de vegetación.",
        "zh": "针叶树春季开始进行光合作用之日,用作植被活动期开始的代理指标。",
        "ro": "Ziua în care arborii de conifere încep să facă fotosinteză primăvara, folosită ca indicator al începutului perioadei active a vegetației."
      },
      "units": "https://maytetoscano.github.io/bblocks-bioclima/ontology/units/day-of-year"
    }
  },
  "geospatial": {
    "crs": "EPSG:4326",
    "lat_resolution": "0.066428063829064 degree",
    "lon_resolution": "0.066428063829064 degree",
    "lat_min": 57.7532613743371,
    "lat_max": 71.171730267808,
    "lon_min": 14.1011663430375,
    "lon_max": 35.2252906406799,
    "scope": "National",
    "description": "Finland"
  },
  "time_coverage": {
    "resolution": "P1Y",
    "start": "2001-01-01",
    "end": "2018-01-01"
  },
  "ebv_domain": [
    "Terrestrial"
  ],
  "comment": "Comparison with eddy covariance GPP gave R²=0.7 and 9-day accuracy over 2001-2016.",
  "dataset": {
    "coverage": "examples/finland-vap-coniferous-2001-2018.covjson"
  }
}
```

## Schema

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://maytetoscano.github.io/bblocks-bioclima/bblock/ogc.bioclima.ebv.ebv-definition/schema.yaml
title: EBV Definition (generic)
description: 'Inventory schema for an Essential Biodiversity Variable dataset, modelled

  after the GeoBON portal record. Concrete EBVs (e.g. vap-coniferous) provide

  this metadata plus the CoverageJSON data inside their examples/ folder.

  '
type: object
required:
- id
- title
- doi
- ebv
- ebv_entity
- ebv_metric
- geospatial
- time_coverage
- license
- creator
properties:
  id:
    type: string
  naming_authority:
    type: string
  title:
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
  product_version:
    type: string
  doi:
    type: string
  date_created:
    type: string
    format: date
  date_issued:
    type: string
    format: date
  summary:
    type: object
    required:
    - en
  keywords:
    type: array
    items:
      type: string
  references:
    type: array
    items:
      type: string
  source:
    type: string
  license:
    type: string
    format: iri
  creator:
    type: object
    required:
    - name
    - institution
    properties:
      name:
        type: string
      email:
        type: string
        format: email
      institution:
        type: string
  ebv:
    type: object
    required:
    - ebv_class
    - ebv_name
    properties:
      ebv_class:
        type: string
        format: iri
      ebv_name:
        type: string
        format: iri
  ebv_entity:
    type: object
    required:
    - ebv_entity_type
    properties:
      ebv_entity_type:
        type: string
        format: iri
      ebv_entity_scope:
        type: string
      ebv_entity_names:
        type: array
        items:
          type: string
  ebv_metric:
    type: object
    additionalProperties:
      type: object
      required:
      - standard_name
      - long_name
      - units
      properties:
        standard_name:
          type: object
        long_name:
          type: object
        units:
          type: string
          format: iri
  geospatial:
    type: object
    required:
    - crs
    - lat_min
    - lat_max
    - lon_min
    - lon_max
    properties:
      crs:
        type: string
      lat_resolution:
        type: string
      lon_resolution:
        type: string
      lat_min:
        type: number
      lat_max:
        type: number
      lon_min:
        type: number
      lon_max:
        type: number
      scope:
        type: string
      description:
        type: string
  time_coverage:
    type: object
    required:
    - start
    - end
    properties:
      resolution:
        type: string
      start:
        type: string
        format: date
      end:
        type: string
        format: date
  ebv_domain:
    type: array
    items:
      type: string
  comment:
    type: string
  dataset:
    type: object
    properties:
      coverage:
        type: string
        description: Relative path to the CoverageJSON file inside the block

```

Links to the schema:

* YAML version: [schema.yaml](https://raw.githubusercontent.com/MayteToscano/bblocks-bioclima/undefined/build/annotated/bioclima/ebv/ebv-definition/schema.json)
* JSON version: [schema.json](https://raw.githubusercontent.com/MayteToscano/bblocks-bioclima/undefined/build/annotated/bioclima/ebv/ebv-definition/schema.yaml)

## Sources

* [BioClima interactive map viewer (all layers)](https://maytetoscano.github.io/bblocks-bioclima/viewer/)
* [BioClima registry — classified by family (ebv)](https://maytetoscano.github.io/bblocks-bioclima/viewer/registry.html#fam-ebv)

# For developers

The source code for this Building Block can be found in the following repository:

* URL: [https://github.com/MayteToscano/bblocks-bioclima](https://github.com/MayteToscano/bblocks-bioclima)
* Path: `_sources/ebv/ebv-definition`


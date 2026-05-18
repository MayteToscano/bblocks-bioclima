
# VAP Deciduous Finland 2001-2018 (Datatype)

`ogc.bioclima.ebv.vap-deciduous` *v0.2.0*

Concrete EBV dataset: yearly maps of the start of the Vegetation Active Period in deciduous vegetation of Finland, 2001-2018, derived from MODIS NDWI. Packaged as a CoverageJSON document conformant to the bioclima-coverage profile. This is one of the two input EBVs consumed by the Phenological Change Indicator (PCI).

[*Status*](http://www.opengis.net/def/status): Under development

## Description

# VAP Deciduous Finland 2001-2018

Concrete EBV dataset for deciduous vegetation. The CoverageJSON file lives in `examples/finland-vap-deciduous-2001-2018.covjson` and the metadata record in `examples/metadata.jsonld`.

## Source

MODIS Terra Level 1B, processed by SYKE. Algorithm: threshold on NDWI time series. See Böttcher et al. 2016, [doi:10.3390/rs8070580](https://doi.org/10.3390/rs8070580).

## Examples

### GeoBON metadata record
GeoBON-style metadata describing the deciduous VAP EBV dataset.
The full CoverageJSON raster cube is kept in examples/ for the Bioclima viewer,
but it is not registered here as a validation example because this block's
schema validates the EBV metadata record.

#### json
```json
{
  "id": "10-deciduous",
  "naming_authority": "The German Centre for Integrative Biodiversity Research (iDiv) Halle-Jena-Leipzig",
  "title": {
    "en": "Start of Vegetation Active Period in Deciduous Vegetation of Finland",
    "es": "Inicio del periodo activo de vegetación en vegetación caducifolia de Finlandia",
    "zh": "芬兰落叶植被的植被活动期开始",
    "ro": "Începutul perioadei active a vegetației în vegetația foioasă din Finlanda"
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
  "source": "MODIS Terra Level 1B, NDWI processing by SYKE.",
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
    "ebv_entity_type": "https://maytetoscano.github.io/bblocks-bioclima/ontology/entity/deciduous-vegetation",
    "ebv_entity_scope": "Deciduous vegetation in Finland",
    "ebv_entity_names": [
      "Deciduous"
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
    "coverage": "examples/finland-vap-deciduous-2001-2018.covjson"
  }
}
```

## Schema

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://maytetoscano.github.io/bblocks-bioclima/bblock/ogc.bioclima.ebv.vap-deciduous/schema.yaml
title: VAP Deciduous Finland metadata record
allOf:
- $ref: https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/ebv/ebv-definition/schema.yaml
- type: object
  properties:
    ebv_entity:
      type: object
      properties:
        ebv_entity_type:
          const: https://maytetoscano.github.io/bblocks-bioclima/ontology/entity/deciduous-vegetation

```

Links to the schema:

* YAML version: [schema.yaml](https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/ebv/vap-deciduous/schema.json)
* JSON version: [schema.json](https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/ebv/vap-deciduous/schema.yaml)

## Sources

* [▶ Open this layer in the BioClima interactive map viewer](https://maytetoscano.github.io/bblocks-bioclima/viewer/?layer=vap-deciduous)
* [BioClima interactive map viewer (all layers)](https://maytetoscano.github.io/bblocks-bioclima/viewer/)
* [BioClima registry — classified by family (ebv)](https://maytetoscano.github.io/bblocks-bioclima/viewer/registry.html#fam-ebv)

# For developers

The source code for this Building Block can be found in the following repository:

* URL: [https://github.com/MayteToscano/bblocks-bioclima](https://github.com/MayteToscano/bblocks-bioclima)
* Path: `_sources/ebv/vap-deciduous`


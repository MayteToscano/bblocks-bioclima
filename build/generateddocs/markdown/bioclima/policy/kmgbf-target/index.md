
# Kunming-Montreal GBF Target (Schema)

`ogc.bioclima.policy.kmgbf-target` *v0.2.0*

Schema for a single target of the Kunming-Montreal Global Biodiversity Framework: target number, multilingual label and definition, deadline, key indicators. Concrete targets (e.g. Target 1, Target 8) are stored in the examples/ folder. Indicators reference these targets through the policy-alignment block.

[*Status*](http://www.opengis.net/def/status): Under development

## Description

# Kunming-Montreal GBF Target

Schema for one of the 23 targets of the Kunming-Montreal Global Biodiversity Framework. Each target carries a multilingual label, definition, deadline and the list of indicators that report against it.

## Examples

### KMGBF Target 8 - Climate change adaptation
Concrete target record with its key indicators back-linked (PCI and bioclimatic-zone) and the informedBy block listing the bblocks that produce evidence.
#### json
```json
{
  "@context": {
    "@vocab": "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/",
    "skos":   "http://www.w3.org/2004/02/skos/core#",
    "label":      { "@id": "skos:prefLabel", "@container": "@language" },
    "definition": { "@id": "skos:definition", "@container": "@language" }
  },
  "id": "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/kmgbf-target-8",
  "targetNumber": 8,
  "label": {
    "en": "Climate change adaptation",
    "es": "Adaptación al cambio climático",
    "zh": "气候变化适应",
    "ro": "Adaptare la schimbările climatice"
  },
  "definition": {
    "en": "Minimize the impact of climate change on biodiversity through mitigation, adaptation and disaster risk reduction actions, including through nature-based solutions and/or ecosystem-based approaches.",
    "es": "Minimizar el impacto del cambio climático sobre la biodiversidad mediante acciones de mitigación, adaptación y reducción del riesgo de desastres, incluso mediante soluciones basadas en la naturaleza y/o enfoques basados en los ecosistemas.",
    "zh": "通过减缓、适应和减少灾害风险的行动,包括基于自然的解决方案和/或基于生态系统的方法,尽量减少气候变化对生物多样性的影响。",
    "ro": "Minimizarea impactului schimbărilor climatice asupra biodiversității prin acțiuni de atenuare, adaptare și reducere a riscului de dezastre, inclusiv prin soluții bazate pe natură și/sau abordări bazate pe ecosisteme."
  },
  "deadline": "2030-12-31",
  "keyIndicators": [
    "https://maytetoscano.github.io/bblocks-bioclima/ontology/indicator/pci",
    "https://maytetoscano.github.io/bblocks-bioclima/ontology/indicator/zone-strong-advance",
    "https://maytetoscano.github.io/bblocks-bioclima/ontology/indicator/zone-delay"
  ],
  "informedBy": [
    {
      "bblock":       "ogc.bioclima.indicator.pci",
      "relationship": "measures-progress-on",
      "evidenceStrength": "direct"
    },
    {
      "bblock":       "ogc.bioclima.zonification.bioclimatic-zone",
      "relationship": "measures-progress-on",
      "evidenceStrength": "direct"
    }
  ],
  "source": "https://www.cbd.int/doc/decisions/cop-15/cop-15-dec-04-en.pdf"
}

```


### KMGBF Target 1 - Spatial planning
Concrete target record back-linked to the bioclimatic-zone indicator, which delineates planning units relevant to participatory, integrated spatial planning.
#### json
```json
{
  "@context": {
    "@vocab": "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/",
    "skos":   "http://www.w3.org/2004/02/skos/core#",
    "label":      { "@id": "skos:prefLabel", "@container": "@language" },
    "definition": { "@id": "skos:definition", "@container": "@language" }
  },
  "id": "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/kmgbf-target-1",
  "targetNumber": 1,
  "label": {
    "en": "Spatial planning",
    "es": "Planificación espacial",
    "zh": "空间规划",
    "ro": "Planificare spațială"
  },
  "definition": {
    "en": "Ensure that all areas are under participatory, integrated and biodiversity-inclusive spatial planning and/or effective management processes addressing land- and sea-use change by 2030.",
    "es": "Garantizar que para 2030 todas las áreas estén bajo procesos de planificación espacial participativa, integrada e inclusiva con la biodiversidad y/o procesos efectivos de gestión que aborden los cambios de uso de la tierra y el mar.",
    "zh": "确保到 2030 年所有区域都纳入参与式、综合且包容生物多样性的空间规划和/或有效管理流程,解决土地与海洋利用变化问题。",
    "ro": "Asigurarea că, până în 2030, toate zonele se află sub procese participative, integrate și inclusive pentru biodiversitate de planificare spațială și/sau gestionare eficientă a schimbărilor de utilizare a terenurilor și mărilor."
  },
  "deadline": "2030-12-31",
  "keyIndicators": [
    "https://maytetoscano.github.io/bblocks-bioclima/ontology/indicator/zone-category"
  ],
  "informedBy": [
    {
      "bblock":       "ogc.bioclima.zonification.bioclimatic-zone",
      "relationship": "informs",
      "evidenceStrength": "direct"
    }
  ],
  "source": "https://www.cbd.int/doc/decisions/cop-15/cop-15-dec-04-en.pdf"
}

```

## Schema

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://maytetoscano.github.io/bblocks-bioclima/bblock/ogc.bioclima.policy.kmgbf-target/schema.yaml
title: KMGBF Target
type: object
required:
- id
- targetNumber
- label
- definition
properties:
  id:
    type: string
    format: iri
  targetNumber:
    type: integer
    minimum: 1
    maximum: 23
  label:
    type: object
    required:
    - en
  definition:
    type: object
    required:
    - en
  deadline:
    type: string
    format: date
  keyIndicators:
    description: 'SKOS concept IRIs of the indicators (ontology-level) that this target
      uses

      as evidence. This is the back-link from the target to its indicators.

      '
    type: array
    items:
      type: string
      format: iri
  informedBy:
    description: "Building-block-level back-link: which BioClima building blocks produce
      the\nevidence for this target, with the same vocabulary as the policy-alignment\nblock
      (relationship type and evidence strength). Together with the forward\nlink in
      `policy-alignment`, this makes the indicator \u2194 target relationship\nbidirectionally
      discoverable.\n"
    type: array
    items:
      type: object
      required:
      - bblock
      - relationship
      properties:
        bblock:
          type: string
          description: BioClima building-block identifier of the contributing indicator.
        relationship:
          enum:
          - informs
          - measures-progress-on
          - triggers-action-for
          - supports-reporting-on
        evidenceStrength:
          enum:
          - direct
          - indirect
          - contextual
  source:
    type: string
    format: iri

```

Links to the schema:

* YAML version: [schema.yaml](https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/policy/kmgbf-target/schema.json)
* JSON version: [schema.json](https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/policy/kmgbf-target/schema.yaml)

## Sources

* [BioClima interactive map viewer (all layers)](https://maytetoscano.github.io/bblocks-bioclima/viewer/)
* [BioClima registry — classified by family (policy)](https://maytetoscano.github.io/bblocks-bioclima/viewer/registry.html#fam-policy)

# For developers

The source code for this Building Block can be found in the following repository:

* URL: [https://github.com/MayteToscano/bblocks-bioclima](https://github.com/MayteToscano/bblocks-bioclima)
* Path: `_sources/policy/kmgbf-target`


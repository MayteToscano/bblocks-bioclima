
# Indicator ↔ Policy Alignment (Schema)

`ogc.bioclima.policy.policy-alignment` *v0.2.0*

Schema describing how a Bioclima indicator aligns with a KMGBF target or an SDG goal. Every alignment record states a relationship type (informs, measures-progress-on, triggers-action-for, supports-reporting-on), an evidence strength (direct, indirect, contextual) and a multilingual justification. This block is the semantic bridge between gridded indicators (PCI, zonification) and the policy frameworks they support, and is what makes the register actionable for policy-makers.

[*Status*](http://www.opengis.net/def/status): Under development

## Description

# Indicator to Policy Alignment

Declares how an indicator aligns with one or more policy targets, with a relationship type, evidence strength and multilingual justification.

## Relationship types

- `measures-progress-on`
- `informs`
- `triggers-action-for`
- `supports-reporting-on`

## Examples

### PCI policy alignment
How the PCI indicator aligns with KMGBF Targets 8 and 1, and with SDG 15. Each alignment carries a relationship type, an evidence-strength tag and a multilingual justification.
#### json
```json
{
  "@context": {
    "@vocab": "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/",
    "indicator": { "@id": "https://maytetoscano.github.io/bblocks-bioclima/ontology/indicator/refersTo", "@type": "@id" },
    "target":    { "@type": "@id" }
  },
  "indicator": "https://maytetoscano.github.io/bblocks-bioclima/ontology/indicator/pci",
  "indicatorBblock": "ogc.bioclima.indicator.pci",
  "alignments": [
    {
      "target": "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/kmgbf-target-8",
      "targetBblock": "ogc.bioclima.policy.kmgbf-target",
      "relationship": "measures-progress-on",
      "evidenceStrength": "direct",
      "justification": {
        "en": "Earlier or later onset of the growing season is a primary ecological signal of climate-change pressure on boreal ecosystems; PCI quantifies that shift directly per pixel.",
        "es": "El adelanto o retraso del inicio del periodo vegetativo es una señal ecológica primaria de la presión del cambio climático sobre los ecosistemas boreales; el PCI lo cuantifica directamente por píxel.",
        "zh": "生长季开始的提前或延迟是气候变化对北方生态系统压力的主要生态信号;PCI 直接量化每个像素的这种变化。",
        "ro": "Avansul sau întârzierea începutului sezonului de creștere este un semnal ecologic principal al presiunii schimbărilor climatice asupra ecosistemelor boreale; PCI cuantifică direct această schimbare la nivel de pixel."
      }
    },
    {
      "target": "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/kmgbf-target-1",
      "targetBblock": "ogc.bioclima.policy.kmgbf-target",
      "relationship": "informs",
      "evidenceStrength": "indirect",
      "justification": {
        "en": "Where PCI is significant, planning needs to internalise the bioclimatic gradient; the indicator informs participatory spatial planning decisions.",
        "es": "Donde el PCI es significativo, la planificación debe internalizar el gradiente bioclimático; el indicador informa decisiones de planificación espacial participativa.",
        "zh": "在 PCI 显著的区域,规划需要将生物气候梯度纳入考虑;该指标可为参与式空间规划决策提供依据。",
        "ro": "Acolo unde PCI este semnificativ, planificarea trebuie să integreze gradientul bioclimatic; indicatorul informează deciziile de planificare spațială participativă."
      }
    },
    {
      "target": "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/sdg-15",
      "relationship": "supports-reporting-on",
      "evidenceStrength": "contextual",
      "justification": {
        "en": "Phenological monitoring is widely accepted as part of the evidence base for SDG 15 reporting on the integrity of terrestrial ecosystems.",
        "es": "El seguimiento fenológico está ampliamente aceptado como parte de la base de evidencia para los informes del ODS 15 sobre la integridad de los ecosistemas terrestres.",
        "zh": "物候监测被广泛接受为 SDG 15 关于陆地生态系统完整性报告的证据基础的一部分。",
        "ro": "Monitorizarea fenologică este larg acceptată ca parte din baza de dovezi pentru raportarea ODD 15 privind integritatea ecosistemelor terestre."
      }
    }
  ]
}

```


### Bioclimatic zonification policy alignment
How the bioclimatic zonification informs participatory spatial planning (Target 1) and tracks climate adaptation (Target 8).
#### json
```json
{
  "@context": {
    "@vocab": "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/",
    "indicator": { "@id": "https://maytetoscano.github.io/bblocks-bioclima/ontology/indicator/refersTo", "@type": "@id" },
    "target":    { "@type": "@id" }
  },
  "indicator": "https://maytetoscano.github.io/bblocks-bioclima/ontology/indicator/zone-category",
  "indicatorBblock": "ogc.bioclima.zonification.bioclimatic-zone",
  "alignments": [
    {
      "target": "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/kmgbf-target-1",
      "targetBblock": "ogc.bioclima.policy.kmgbf-target",
      "relationship": "informs",
      "evidenceStrength": "direct",
      "justification": {
        "en": "Bioclimatic zones delineate areas with homogeneous phenological behaviour, which is precisely the kind of spatial input integrated, biodiversity-inclusive planning needs.",
        "es": "Las zonas bioclimáticas delimitan áreas con comportamiento fenológico homogéneo, exactamente la información espacial que la planificación integrada e inclusiva con la biodiversidad necesita.",
        "zh": "生物气候区划定具有同质物候行为的区域,正是综合且包容生物多样性的规划所需的空间输入。",
        "ro": "Zonele bioclimatice delimitează arii cu comportament fenologic omogen, exact tipul de informație spațială necesară planificării integrate, inclusive pentru biodiversitate."
      }
    },
    {
      "target": "https://maytetoscano.github.io/bblocks-bioclima/ontology/policy/kmgbf-target-8",
      "targetBblock": "ogc.bioclima.policy.kmgbf-target",
      "relationship": "measures-progress-on",
      "evidenceStrength": "direct",
      "justification": {
        "en": "The proportion and area of 'strong advance' and 'delay' zones is a direct, auditable indicator of how climate change is reshaping boreal phenology.",
        "es": "La proporción y superficie de zonas de 'adelanto fuerte' y 'retraso' es un indicador directo y auditable de cómo el cambio climático reformula la fenología boreal.",
        "zh": "“强烈提前”与“延迟”区域的比例和面积是气候变化重塑北方物候的直接、可审计指标。",
        "ro": "Proporția și suprafața zonelor de avans puternic și întârziere sunt indicatori direcți și auditabili ai modului în care schimbările climatice modelează fenologia boreală."
      }
    }
  ]
}

```

## Schema

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
$id: https://maytetoscano.github.io/bblocks-bioclima/bblock/ogc.bioclima.policy.policy-alignment/schema.yaml
title: Policy Alignment
description: "Forward link from an indicator to one or more KMGBF/SDG targets. The
  reverse\nlink from a target back to the indicators that inform it is held in the\n`informedBy`
  array of the kmgbf-target block. Together they make the\nindicator \u2194 policy
  relationship bidirectionally navigable in the viewer and\nin static lookups.\n"
type: object
required:
- indicator
- alignments
properties:
  indicator:
    type: string
    format: iri
    description: SKOS concept IRI of the indicator (ontology level).
  indicatorBblock:
    type: string
    description: Building-block identifier of the indicator (ogc.bioclima.indicator.<id>).
  alignments:
    type: array
    minItems: 1
    items:
      type: object
      required:
      - target
      - relationship
      properties:
        target:
          type: string
          format: iri
        targetBblock:
          type: string
          description: Building-block identifier of the target record (typically `ogc.bioclima.policy.kmgbf-target`).
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
        justification:
          type: object
          description: Multilingual rationale; at minimum `en` should be present.
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

```

Links to the schema:

* YAML version: [schema.yaml](https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/policy/policy-alignment/schema.json)
* JSON version: [schema.json](https://maytetoscano.github.io/bblocks-bioclima/build/annotated/bioclima/policy/policy-alignment/schema.yaml)

## Sources

* [BioClima interactive map viewer (all layers)](https://maytetoscano.github.io/bblocks-bioclima/viewer/)
* [BioClima registry — classified by family (policy)](https://maytetoscano.github.io/bblocks-bioclima/viewer/registry.html#fam-policy)

# For developers

The source code for this Building Block can be found in the following repository:

* URL: [https://github.com/MayteToscano/bblocks-bioclima](https://github.com/MayteToscano/bblocks-bioclima)
* Path: `_sources/policy/policy-alignment`


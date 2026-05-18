# BioClima OGC Building Blocks

**Main viewer:** https://maytetoscano.github.io/bblocks-bioclima/viewer/  
**Classified register:** https://maytetoscano.github.io/bblocks-bioclima/viewer/registry.html  
**OGC Building Blocks viewer:** https://maytetoscano.github.io/bblocks-bioclima/bblocks/  
**Ontology landing page:** https://maytetoscano.github.io/bblocks-bioclima/ontology/

The repository is organised into seven visible building-block families: CoverageJSON / BioClima Coverage, EBVs, Spatial Indicators, Bioclimatic Zonification, Ontology, Policy Alignment and Provenance.

---


**Status:** under development · **License:** CC-BY 4.0 · **Languages:** EN · ES · ZH · RO
**Project:** <https://bioclima.net/> · **Funded by:** the European Union — GA no. 101181408

A register of [OGC Building Blocks](https://ogcincubator.github.io/bblocks-docs/) for biodiversity and climate monitoring, produced as part of the [BioClima project](https://bioclima.net/) (EU–China collaboration on biodiversity and climate). The register models Essential Biodiversity Variables (EBVs), the indicators derived from them, the bioclimatic zonification those indicators produce, the provenance of every artefact, and the alignment with international policy frameworks — all anchored to a multilingual SKOS ontology.

The pilot dataset is the **Start of the Vegetation Active Period in Finland (2001-2018)** from the [GeoBON EBV portal](https://portal.geobon.org), modelled in CoverageJSON and shipped inside its building block.

- **Map viewer:** <https://maytetoscano.github.io/bblocks-bioclima/viewer/>
- **Registry index by family:** <https://maytetoscano.github.io/bblocks-bioclima/viewer/registry.html>
- **Block documentation (official bblocks-viewer):** <https://maytetoscano.github.io/bblocks-bioclima/viewer/bblock.html>
- **Register JSON:** <https://maytetoscano.github.io/bblocks-bioclima/build/register.json>

---

## What is in this register

**12 building blocks** under `_sources/`, organised in **7 families**. The multilingual SKOS ontology is itself a first-class building block (`ontology.bioclima-ontology`) and is dereferenced by every other block via IRI.

| Family | Blocks | Role |
|---|---|---|
| **A. CoverageJSON / Bioclima Coverage** | `coveragejson.bioclima-coverage` | **Pivot block.** Profile of OGC CoverageJSON. Every gridded artefact in the register conforms. |
| **B. EBVs** | `ebv.ebv-definition`, `ebv.vap-coniferous`, `ebv.vap-deciduous` | Generic EBV template + two concrete Finnish VAP datasets. |
| **C. Spatial indicators** | `indicator.indicator-definition`, `indicator.pci` | Generic indicator recipe + the **Phenological Change Indicator (PCI)**, a 4-parameter ParameterGroup. |
| **D. Bioclimatic zonification** | `zonification.bioclimatic-zone` | Aggregated zones derived from PCI with **true polygon outlines**. |
| **E. Provenance** | `provenance.ebv-provenance`, `provenance.indicator-provenance` | PROV-O records, with git commit hash + GitHub Actions run id for indicators. |
| **F. Policy alignment** | `policy.kmgbf-target`, `policy.policy-alignment` | KMGBF targets + indicator ↔ target alignment with relationship, evidence strength and multilingual justification. **Bidirectional.** |
| **G. Ontology** | `ontology.bioclima-ontology` | The multilingual SKOS vocabulary. Semantic backbone of every other block. |

The single source of truth for family labels lives in `viewer/data/families.json`, rebuilt from each block's `groupLabel` field by `scripts/build-families.py`.

---

## How the blocks relate

```
                    ┌──────────────────────────────────────────────┐
                    │      coveragejson.bioclima-coverage          │  ← PIVOT
                    └──────────────────────────────────────────────┘
                                       │ (every gridded artefact)
       ┌───────────────────────────────┼────────────────────────────┐
       ▼                               ▼                            ▼
  ebv.ebv-definition           indicator.indicator-          ontology.bioclima-
       │                          definition                    ontology  (every
       ▼                              │                          block resolves
  ebv.vap-coniferous          ┌───────┴────────┐                 IRIs here)
  ebv.vap-deciduous           ▼                ▼
       │                  indicator.pci   zonification.bioclimatic-zone
       └──── PROV-O ──►   │  │             │   (4-connected
                          │  └── PROV-O ──►│    components +
                          │                │    outline tracing)
                          ▼                ▼
              policy.policy-alignment ◄────┤
                          │                │
                          ▼                ▼
                  policy.kmgbf-target ◄────┘  (informedBy back-link)
```

---

## The PCI: a ParameterGroup of four parameters

PCI v0.3.0 is a composite indicator. The CoverageJSON output is a **ParameterGroup** of four per-pixel parameters, each with its own SKOS concept in the ontology, each independently visualisable in the viewer:

| Parameter | Method | Unit | Interpretation |
|---|---|---|---|
| `trend` | Theil-Sen median slope of the VAP day-of-year series | d/yr | Negative → earlier onset; positive → later onset |
| `anomaly` | mean(2011–2018) − mean(2001–2010) | d | Negative → recent onset earlier than baseline |
| `changepoint_year` | Pettitt's argmax \|U\| | yr | Most probable year of a regime shift |
| `changepoint_pvalue` | p ≈ 2·exp(−6 K² / (T³ + T²)) | — | p < 0.05 → evidence of regime shift; p > 0.10 → weak evidence |

The map viewer exposes a parameter selector that switches between the four maps with their own colour ramp and units. Clicking a pixel shows the value of the currently-selected parameter and a link to its SKOS definition.

The PCI does **not** attribute causality. It says "the vegetation is starting earlier/later" — not "because of temperature".

---

## Bioclimatic zonification — true outlines

`zonify.py` v0.2.0 produces a GeoJSON FeatureCollection of zones. Pipeline:

1. Classify every PCI `trend` pixel into one of four categories using the published thresholds in days/year:
   `strong_advance` (< −0.5), `mild_advance` (−0.5 … −0.2), `stable` (−0.2 … 0.2), `delay` (≥ 0.2).
2. **4-connectivity connected-components** flood-fill (pure numpy) groups spatially-contiguous pixels of the same category.
3. **Outline tracing**: walk the cell-edge graph to produce one Polygon per component with a true outer ring and holes (lakes inside a zone). No more per-cell rectangles.
4. Discard components below `--min-pixels` (default 4) as salt-and-pepper noise.

The Finnish pilot now produces **168 zones** with proper outlines (vs. ~13 600 per-pixel cells in the original implementation).

---

## Semantic navigation in the viewer

The map viewer at `/viewer/index.html` exposes layers grouped by family. When you click on the map (or on a zone polygon), the popup shows:

- **Layer title** as a clickable link to its SKOS concept.
- **Each attribute name** (e.g. *Value*, *Mean PCI*, *Area km²*) clickable, opening the attribute's concept in the BioClima ontology. Pattern from [bblocks-focal](https://github.com/ogcincubator/bblocks-focal).
- **Policy alignment** rendered with relationship type (`measures-progress-on`, `informs`, `supports-reporting-on`, `triggers-action-for`), evidence strength (`direct`, `indirect`, `contextual`) and multilingual justification. Pattern from [bblocks-seadots](https://github.com/ogcincubator/bblocks-seadots).
- A link to the **block documentation** in the official OGC `bblocks-viewer` (mounted in iframe at `/viewer/bblock.html`).

Deep links are supported: `viewer/?layer=pci&lang=es`, `viewer/bblock.html?id=ogc.bioclima.indicator.pci`.

---

## Bidirectional indicator ↔ policy linking

| Direction | Where it lives |
|---|---|
| Indicator → target | `policy-alignment.examples/<indicator>-alignment.jsonld` |
| Target → indicator | `kmgbf-target.examples/target-<N>.jsonld#keyIndicators` + `#informedBy` |

Both lookups are cheap. The lint script enforces that every `informedBy.bblock`, `indicatorBblock` and `targetBblock` references an existing block in the register.

---

## Repository layout

```
bblocks-bioclima/
├── _sources/                        12 building blocks
│   ├── coveragejson/                A. CoverageJSON profile (pivot)
│   ├── ebv/                         B. EBVs (template + 2 datasets)
│   ├── indicator/                   C. Spatial indicator schemas + PCI code/output
│   ├── zonification/                D. Bioclimatic-zone block with code/output
│   ├── ontology/bioclima-ontology/  G. Ontology block
│   ├── policy/                      F. KMGBF targets + alignment
│   └── provenance/                  E. PROV-O schemas
├── ontology/                        SKOS vocabulary TTL + SHACL
├── viewer/                          Three complementary viewers
│   ├── index.html                   Map viewer (custom Leaflet, CoverageJSON native)
│   ├── registry.html                Registry index by family
│   ├── bblock.html                  Official bblocks-viewer in iframe + block selector
│   ├── css/viewer.css               BioClima visual identity
│   ├── js/  (i18n.js, covjson.js, viewer.js)
│   └── data/ (layers.json, concepts.json, families.json)
├── tests/                           Snapshot tests for the pipeline (16 tests)
├── .github/workflows/               CI: validate + deploy + recompute
├── scripts/                         lint, SHACL check, concepts/families builders
├── bblocks-config.yaml              register configuration
├── LICENSE
└── README.md
```

---

## Local development

```bash
# Run the local lint (validates structure, group, dependencies, back-links)
python scripts/lint-bblocks.py

# Re-run the indicator pipeline (PCI then zonification)
python _sources/indicator/pci/code/compute.py \
  --coniferous _sources/ebv/vap-coniferous/examples/finland-vap-coniferous-2001-2018.covjson \
  --deciduous  _sources/ebv/vap-deciduous/examples/finland-vap-deciduous-2001-2018.covjson \
  --output     _sources/indicator/pci/examples/pci-finland-2001-2018.covjson

python _sources/zonification/bioclimatic-zone/code/zonify.py \
  --pci        _sources/indicator/pci/examples/pci-finland-2001-2018.covjson \
  --output     _sources/zonification/bioclimatic-zone/examples/finland-zones-2001-2018.geojson \
  --min-pixels 4

# Rebuild the viewer's family labels from the bblock.json files
python scripts/build-families.py

# Run the snapshot tests
python -m unittest tests.test_pipeline -v

# Preview the viewer locally
python -m http.server 8000
# then open http://localhost:8000/viewer/
```

---

## Standards and references

- [OGC CoverageJSON Community Standard 21-069r2](https://docs.ogc.org/cs/21-069r2/21-069r2.html)
- [OGC Building Blocks documentation](https://ogcincubator.github.io/bblocks-docs/) · [bblocks-viewer](https://github.com/ogcincubator/bblocks-viewer)
- [Reference register: openscience](https://ogcincubator.github.io/bblocks-openscience/) — family classification.
- [bblocks-focal](https://github.com/ogcincubator/bblocks-focal) — attribute → ontology navigation (adopted).
- [bblocks-seadots](https://github.com/ogcincubator/bblocks-seadots) — indicator ↔ policy alignment (adopted).
- [bblock-prov-schema-x](https://github.com/ogcincubator/bblock-prov-schema-x) — PROV-O schema pattern (adopted).
- [W3C SKOS Reference](https://www.w3.org/TR/skos-reference/), [W3C PROV-O](https://www.w3.org/TR/prov-o/), [W3C SHACL](https://www.w3.org/TR/shacl/).
- [GeoBON EBV portal](https://portal.geobon.org) · [Kunming-Montreal GBF](https://www.cbd.int/doc/decisions/cop-15/cop-15-dec-04-en.pdf).
- Pettitt, A. N. (1979). A non-parametric approach to the change-point problem. *Applied Statistics* 28(2): 126–135.
- Theil, H. (1950). A rank-invariant method of linear and polynomial regression analysis. *Proc. KNAW* 53: 386–392.
- Böttcher, K. et al. (2014). [MODIS-derived VAP in Finland](https://doi.org/10.1016/j.rse.2013.09.022).
- Böttcher, K. et al. (2016). [Phenology in deciduous vegetation from NDWI](https://doi.org/10.3390/rs8070580).

---

## Acknowledgements

This work is part of the **BioClima** project, an EU–China collaboration on biodiversity and climate monitoring. Funded by the European Union under grant agreement no. **101181408**. Views and opinions expressed are those of the authors only and do not necessarily reflect those of the European Union or the granting authority.

## License and citation

Data and content are released under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/). Code is released under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0). If you use this register, please cite the GeoBON DOI `10.25829/xf8ek6` for the underlying data and the BioClima project for the register itself.

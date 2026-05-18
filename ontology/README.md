# BioClima Ontology

Multilingual SKOS vocabulary referenced by every building block in the register.

This is **not** itself an OGC building block — it is a published vocabulary that the building blocks dereference by IRI. The reason is practical: bblocks-postprocess does not validate raw TTL files, so keeping the ontology outside `_sources/` avoids needless validation errors while still letting the viewer and any external client resolve the IRIs.

## Files

- `bioclima-ontology.ttl` — the SKOS vocabulary (5 concept schemes, 19 concepts, all in en/es/zh/ro).
- `shapes.shacl` — SHACL rule that enforces multilingual labels and definitions for every concept.

## Concept schemes

| Scheme | What it covers |
|---|---|
| `bioclima:ebv-scheme` | EBV classes, names and observed properties (e.g. `vap_doy`) |
| `bioclima:indicator-scheme` | Indicators (PCI) and zonification categories |
| `bioclima:units-scheme` | Units of measurement (day of year, days per year) |
| `bioclima:entity-scheme` | Observed entities (coniferous-forest, deciduous-vegetation) |
| `bioclima:policy-scheme` | KMGBF targets and SDG 15 |

## Validation

Run from the repo root:

```bash
pip install rdflib pyshacl
python scripts/validate-shacl.py
```

The script returns non-zero if any concept is missing one of the four required languages.

## Adding a new concept

1. Edit `bioclima-ontology.ttl`, add the new SKOS concept with `prefLabel` and `definition` in **all four** languages.
2. Run `python scripts/build-concepts-index.py` to refresh the viewer's lookup file.
3. Commit. The CI re-runs the SHACL validation on every push.

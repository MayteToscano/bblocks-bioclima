# Indicator Definition (generic)

Recipe-style schema describing a biodiversity indicator. Concrete indicators (e.g. PCI) inherit this template and provide their own Python implementation under `code/`.

## Required fields

- `id` (IRI in the BioClima ontology)
- `label` and `definition` (multilingual)
- `inputs` (which EBVs)
- `implementation` (entry point file + version)
- `output.unit`
- `policyAlignment`

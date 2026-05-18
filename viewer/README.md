# BioClima viewer

Three complementary surfaces:

| Page | URL | What it does |
|---|---|---|
| `index.html` | `/viewer/` | **Map viewer** (custom). Renders the CoverageJSON layers (EBVs, PCI ParameterGroup, bioclimatic zones) on a Leaflet map with semantic navigation: every attribute name is a clickable link to its SKOS concept in the BioClima ontology. |
| `registry.html` | `/viewer/registry.html` | **Registry index by family**. Reads `register.json` and renders the building blocks grouped by family (CoverageJSON, EBV, indicator, zonification, ontology, provenance, policy). |
| `bblock.html` | `/viewer/bblock.html?id=<bblock>` | **Block documentation viewer** (official OGC `bblocks-viewer` in an iframe). Shows schemas, dependencies, examples and inherited metadata. |

## Visual identity

The viewer uses the BioClima project branding:

- Logo from <https://bioclima.net/media/images/bioclima_logo.original.png>.
- Palette derived from the BioClima website (greens for biodiversity, blues for climate).
- Footer with EU funding statement (GA 101181408).
- Links to <https://bioclima.net/> and the [partners page](https://bioclima.net/partners/).

## Loading the official bblocks-viewer with the CoverageJSON plugin

`bblock.html` mounts <https://ogcincubator.github.io/bblocks-viewer/> in an iframe with two query parameters:

- `register=<URL of register.json>`
- `bblock=<itemIdentifier>`

A third parameter, `plugin=<URL>`, can load a JavaScript module that extends the viewer to render extra media types. To enable native CoverageJSON rendering inside the official viewer, set the constant near the top of `bblock.html`:

```js
const COVJSON_PLUGIN_URL = "https://example.org/bblocks-viewer-plugin-covjson.js";
```

with the published URL of the CoverageJSON plugin. Until then, the iframe shows the block's schema, dependencies and metadata but does **not** render the gridded data — that is what the custom `index.html` map viewer is for. Both surfaces are linked from every page.

## Data files

- `data/layers.json` — index of the layers shown in the map viewer. Declares per-layer attribute IRIs and per-parameter ranges/colour ramps (PCI has 4 sub-parameters with their own ramps).
- `data/concepts.json` — viewer-friendly projection of the SKOS ontology. Rebuilt by `scripts/build-concepts-index.py` whenever `ontology/bioclima-ontology.ttl` changes.

## Languages

EN · ES · ZH · RO are switchable via the language selector. UI strings live in `js/i18n.js`. Concept labels come from `data/concepts.json` (which is generated from the ontology TTL).

## Deep links

- `index.html?layer=<id>&lang=<en|es|zh|ro>` opens a specific layer in a specific language.
- `bblock.html?id=<itemIdentifier>` opens the block documentation for a specific block.

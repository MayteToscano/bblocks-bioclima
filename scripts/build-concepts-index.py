#!/usr/bin/env python3
"""Build viewer/data/concepts.json from the ontology TTL."""
import json
import sys
from pathlib import Path
from rdflib import Graph
from rdflib.namespace import SKOS, RDF

ROOT = Path(__file__).resolve().parent.parent
ONTO = ROOT / "ontology" / "bioclima-ontology.ttl"
OUT  = ROOT / "viewer" / "data" / "concepts.json"

def main() -> int:
    g = Graph().parse(ONTO, format="turtle")
    index = {}
    for c in g.subjects(RDF.type, SKOS.Concept):
        index[str(c)] = {
            "label":      {str(o.language): str(o) for o in g.objects(c, SKOS.prefLabel)},
            "definition": {str(o.language): str(o) for o in g.objects(c, SKOS.definition)}
        }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(index, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT} ({len(index)} concepts)")
    return 0

if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Validate the BioClima ontology against shapes.shacl."""
import sys
from pathlib import Path
from rdflib import Graph
from pyshacl import validate

ROOT = Path(__file__).resolve().parent.parent
ONTO = ROOT / "ontology" / "bioclima-ontology.ttl"
SHAPES = ROOT / "ontology" / "shapes.shacl"

def main() -> int:
    data  = Graph().parse(ONTO,   format="turtle")
    shape = Graph().parse(SHAPES, format="turtle")
    print(f"Loaded {len(data)} triples from {ONTO.name}")

    conforms, _, report = validate(
        data, shacl_graph=shape, inference="rdfs", debug=False
    )
    if not conforms:
        print("SHACL VALIDATION FAILED:\n")
        print(report)
        return 1
    print("OK: every SKOS concept has prefLabel and definition in en/es/zh/ro.")
    return 0

if __name__ == "__main__":
    sys.exit(main())

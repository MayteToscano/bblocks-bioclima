#!/usr/bin/env python3
"""
Rebuild viewer/data/families.json from the bblock.json `groupLabel` fields.

Single source of truth for family labels across:
  - viewer/index.html (sidebar grouping)
  - viewer/registry.html (registry by family)
  - viewer/bblock.html (block selector)

Run: python scripts/build-families.py
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC  = ROOT / "_sources"
OUT  = ROOT / "viewer" / "data" / "families.json"

ORDER = [
    "coveragejson",
    "ebv",
    "indicator",
    "zonification",
    "ontology",
    "policy",
    "provenance"
]


def main() -> int:
    # Preserve the human-curated descriptions: load the current file (if any)
    # and only overwrite labels. Descriptions are not in bblock.json on purpose
    # to keep manifests terse.
    current = {"families": {}}
    if OUT.exists():
        current = json.loads(OUT.read_text(encoding="utf-8"))

    labels: dict[str, dict] = {}
    for f in sorted(SRC.rglob("bblock.json")):
        d = json.loads(f.read_text(encoding="utf-8"))
        g = d.get("group")
        gl = d.get("groupLabel")
        if not g or not gl:
            continue
        # Keep the first one we encounter (they should all agree per family).
        labels.setdefault(g, gl)

    families = {}
    for g in ORDER:
        if g not in labels:
            continue
        prev = current.get("families", {}).get(g, {})
        families[g] = {"label": labels[g]}
        if prev.get("description"):
            families[g]["description"] = prev["description"]

    out = {
        "_comment": current.get(
            "_comment",
            "Single source of truth for family labels. Rebuilt by scripts/build-families.py from each bblock.json#groupLabel."
        ),
        "order":    ORDER,
        "families": families
    }
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n",
                   encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} with {len(families)} families")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""
Local lint that emulates the key validations bblocks-postprocess performs
and adds the Bioclima-specific structural rules.

  - missing 'dateTimeAddition'        (NOT dateTimeAddedToRegister)
  - duplicate 'schema' field          (schema.yaml is auto-detected)
  - dependsOn referencing missing IDs (the recurring 7/8/9 errors)
  - non-existent itemClass enum
  - missing or unknown `group` field      (Bioclima-specific)
  - missing `groupLabel` translations     (Bioclima-specific)
  - official OGC metadata link shape: use links[] with title/href/rel; seeAlso[] only accepts strings
  - informedBy.bblock must exist          (in kmgbf-target examples)

Run as: python scripts/lint-bblocks.py
"""

from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC  = ROOT / "_sources"

REQUIRED_FIELDS = ["itemIdentifier", "name", "abstract", "status",
                   "dateTimeAddition", "itemClass", "version"]
ALLOWED_ITEM_CLASSES = {"schema", "datatype", "path", "parameter",
                        "header", "cookie", "response", "api", "model"}

ALLOWED_GROUPS = {"coveragejson", "ebv", "indicator", "zonification", "provenance", "policy", "ontology"}

REQUIRED_LANGS = {"en", "es", "zh", "ro"}


def main() -> int:
    errors: list[str] = []
    block_ids: set[str] = set()
    manifests: list[tuple[Path, dict]] = []

    for f in sorted(SRC.rglob("bblock.json")):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errors.append(f"{f}: invalid JSON: {e}")
            continue
        manifests.append((f, data))
        block_ids.add(data.get("itemIdentifier"))

    print(f"Found {len(manifests)} bblock.json files\n")

    for path, data in manifests:
        rel = path.relative_to(ROOT)

        for field in REQUIRED_FIELDS:
            if field not in data:
                errors.append(f"{rel}: missing required field '{field}'")

        if "dateTimeAddedToRegister" in data:
            errors.append(f"{rel}: uses legacy 'dateTimeAddedToRegister' — should be 'dateTimeAddition'")

        schema_yaml = path.parent / "schema.yaml"
        if schema_yaml.exists() and "schema" in data:
            errors.append(f"{rel}: redundant 'schema' field (schema.yaml is auto-detected)")

        ic = data.get("itemClass")
        if ic is not None and ic not in ALLOWED_ITEM_CLASSES:
            errors.append(f"{rel}: itemClass '{ic}' not in {sorted(ALLOWED_ITEM_CLASSES)}")

        # Bioclima: group field
        grp = data.get("group")
        if grp is None:
            errors.append(f"{rel}: missing required Bioclima field 'group'")
        elif grp not in ALLOWED_GROUPS:
            errors.append(f"{rel}: group '{grp}' not in {sorted(ALLOWED_GROUPS)}")

        # Bioclima: groupLabel must include all four UI languages
        gl = data.get("groupLabel")
        if gl is not None:
            missing = REQUIRED_LANGS - set(gl.keys())
            if missing:
                errors.append(f"{rel}: groupLabel missing language(s): {sorted(missing)}")

        # OGC bblock metadata schema:
        # - seeAlso is only for a list of string identifiers/URIs.
        # - rich links must go in links[] using title + href, not link.
        for k, sa in enumerate(data.get("seeAlso", []) or []):
            if not isinstance(sa, str):
                errors.append(f"{rel}: seeAlso[{k}] must be a string. Use links[] with title/href/rel for rich links")

        for k, link in enumerate(data.get("links", []) or []):
            if not isinstance(link, dict):
                errors.append(f"{rel}: links[{k}] must be an object")
                continue
            if not link.get("title"):
                errors.append(f"{rel}: links[{k}] missing required 'title'")
            if not link.get("href"):
                errors.append(f"{rel}: links[{k}] missing required 'href'")
            if "link" in link:
                errors.append(f"{rel}: links[{k}] uses 'link'; official field is 'href'")

        for dep in data.get("dependsOn", []):
            if dep.startswith("ogc.bioclima.") and dep not in block_ids:
                errors.append(f"{rel}: dependsOn '{dep}' does not exist in _sources/")

        ex_dir = path.parent / "examples"
        ex_yaml = path.parent / "examples.yaml"
        if ex_dir.exists() and not ex_yaml.exists():
            errors.append(f"{rel}: has examples/ directory but no examples.yaml")

    # Cross-block validation: kmgbf-target's informedBy.bblock must exist.
    for tgt in sorted((SRC / "policy" / "kmgbf-target" / "examples").glob("*.jsonld")):
        try:
            d = json.loads(tgt.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errors.append(f"{tgt}: invalid JSON: {e}")
            continue
        for k, ent in enumerate(d.get("informedBy", []) or []):
            bb = (ent or {}).get("bblock")
            if not bb:
                errors.append(f"{tgt.relative_to(ROOT)}: informedBy[{k}] missing 'bblock'")
            elif bb not in block_ids:
                errors.append(f"{tgt.relative_to(ROOT)}: informedBy[{k}] references unknown bblock '{bb}'")

    # Cross-block validation: policy-alignment's indicatorBblock / targetBblock must exist.
    for al in sorted((SRC / "policy" / "policy-alignment" / "examples").glob("*.jsonld")):
        try:
            d = json.loads(al.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errors.append(f"{al}: invalid JSON: {e}")
            continue
        ib = d.get("indicatorBblock")
        if ib and ib not in block_ids:
            errors.append(f"{al.relative_to(ROOT)}: indicatorBblock '{ib}' not in register")
        for k, al_e in enumerate(d.get("alignments", []) or []):
            tb = (al_e or {}).get("targetBblock")
            if tb and tb not in block_ids:
                errors.append(f"{al.relative_to(ROOT)}: alignments[{k}].targetBblock '{tb}' not in register")

    if errors:
        print("LINT FAILED:")
        for e in errors:
            print("  ✗", e)
        return 1

    print(f"OK — all {len(manifests)} blocks pass the lint checks.")
    print("Block ids:")
    for b in sorted(block_ids):
        print(f"  • {b}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Stamp indicator-provenance with the current git commit and run id."""
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROV = ROOT / "_sources" / "provenance" / "indicator-provenance" / "examples" / "pci-provenance.jsonld"


def git_sha() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
        ).strip()
    except subprocess.CalledProcessError:
        return "unknown"


def main() -> int:
    data = json.loads(PROV.read_text(encoding="utf-8"))
    now  = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    data["wasGeneratedBy"]["scriptVersion"] = git_sha()
    data["wasGeneratedBy"]["runId"]        = os.environ.get("GITHUB_RUN_ID", "local")
    data["wasGeneratedBy"]["endedAtTime"]  = now
    data["wasGeneratedBy"].setdefault("startedAtTime", now)
    PROV.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Stamped {PROV.name} with commit {data['wasGeneratedBy']['scriptVersion'][:8]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

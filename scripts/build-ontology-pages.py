#!/usr/bin/env python3
"""Generate dereferenceable static HTML pages for BioClima ontology IRIs.

GitHub Pages cannot perform HTTP 303 redirects/content negotiation. To avoid
404 errors for ontology IRIs such as
https://maytetoscano.github.io/bblocks-bioclima/ontology/ebv/vap_doy, this script
creates ontology/<scheme>/<concept>/index.html pages from viewer/data/concepts.json.
"""
from __future__ import annotations
import html
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
CONCEPTS = ROOT / "viewer" / "data" / "concepts.json"
ONTO_DIR = ROOT / "ontology"
BASE = "https://maytetoscano.github.io/bblocks-bioclima/ontology/"
SITE = "https://maytetoscano.github.io/bblocks-bioclima"

CSS = """
:root { --bg:#f7f8f4; --card:#fff; --ink:#1f2a24; --muted:#617067; --green:#2f6b4f; --border:#d9e2d5; --sand:#efe2bd; }
body { margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; background:var(--bg); color:var(--ink); }
main { max-width:920px; margin:0 auto; padding:2.2rem 1.4rem; }
a { color:var(--green); }
.card { background:var(--card); border:1px solid var(--border); border-radius:18px; padding:1.4rem; box-shadow:0 1px 5px rgba(0,0,0,.04); }
h1 { margin:.1rem 0 .3rem; color:var(--green); }
.meta { color:var(--muted); font-size:.9rem; word-break:break-all; }
dl { display:grid; grid-template-columns:9rem 1fr; gap:.6rem 1rem; margin-top:1.2rem; }
dt { font-weight:700; color:var(--green); }
dd { margin:0; }
.lang { display:inline-block; min-width:2rem; color:var(--muted); font-size:.85rem; }
.buttons { display:flex; gap:.7rem; flex-wrap:wrap; margin-top:1.3rem; }
.button { display:inline-block; padding:.65rem .9rem; border-radius:999px; text-decoration:none; background:var(--green); color:white; font-weight:700; }
.button.secondary { background:white; color:var(--green); border:1px solid var(--green); }
code { background:var(--sand); padding:.12rem .35rem; border-radius:4px; }
"""


def concept_path(uri: str) -> Path | None:
    if not uri.startswith(BASE):
        return None
    rel = uri[len(BASE):].strip("/")
    if not rel:
        return ONTO_DIR / "index.html"
    return ONTO_DIR / rel / "index.html"


def label_for(c: dict, lang="en") -> str:
    return c.get("label", {}).get(lang) or c.get("label", {}).get("en") or "BioClima concept"


def render_concept(uri: str, c: dict) -> str:
    title = html.escape(label_for(c))
    labels = c.get("label", {}) or {}
    defs = c.get("definition", {}) or {}
    rows = []
    if labels:
        rows.append("<dt>Labels</dt><dd>" + "<br>".join(
            f"<span class='lang'>{html.escape(k)}</span>{html.escape(v)}" for k, v in sorted(labels.items())
        ) + "</dd>")
    if defs:
        rows.append("<dt>Definitions</dt><dd>" + "<br>".join(
            f"<span class='lang'>{html.escape(k)}</span>{html.escape(v)}" for k, v in sorted(defs.items())
        ) + "</dd>")
    broader = c.get("broader") or []
    if broader:
        rows.append("<dt>Broader</dt><dd>" + ", ".join(
            f"<a href='{html.escape(b)}'>{html.escape(b.rsplit('/',1)[-1])}</a>" for b in broader
        ) + "</dd>")
    scheme = c.get("scheme")
    if scheme:
        rows.append(f"<dt>Scheme</dt><dd><code>{html.escape(scheme)}</code></dd>")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} — BioClima ontology</title>
  <link rel="alternate" type="text/turtle" href="{SITE}/ontology/bioclima-ontology.ttl" />
  <style>{CSS}</style>
</head>
<body>
<main>
  <p><a href="{SITE}/">← BioClima register</a> · <a href="{SITE}/ontology/">Ontology index</a></p>
  <article class="card">
    <p class="meta">BioClima SKOS/RDF concept</p>
    <h1>{title}</h1>
    <p class="meta">{html.escape(uri)}</p>
    <dl>{''.join(rows)}</dl>
    <div class="buttons">
      <a class="button" href="{SITE}/ontology/bioclima-ontology.ttl">Open Turtle ontology</a>
      <a class="button secondary" href="{SITE}/viewer/registry.html#fam-ontology">Open ontology block</a>
      <a class="button secondary" href="{SITE}/viewer/">Open viewer</a>
    </div>
  </article>
</main>
</body>
</html>
"""


def main() -> int:
    concepts = json.loads(CONCEPTS.read_text(encoding="utf-8"))
    # Landing index
    cards = []
    for uri, c in sorted(concepts.items()):
        p = concept_path(uri)
        if not p:
            continue
        rel = uri[len(BASE):]
        cards.append(f"<li><a href='{html.escape(rel)}'>{html.escape(label_for(c))}</a><br><code>{html.escape(uri)}</code></li>")
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(render_concept(uri, c), encoding="utf-8")
    index = f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BioClima ontology</title><link rel="alternate" type="text/turtle" href="{SITE}/ontology/bioclima-ontology.ttl"><style>{CSS} li{{margin:.8rem 0;}}</style></head>
<body><main><p><a href="{SITE}/">← BioClima register</a></p><article class="card"><h1>BioClima ontology</h1>
<p class="meta">Dereferenceable SKOS/RDF concepts used by the BioClima OGC Building Blocks and the interactive viewer.</p>
<div class="buttons"><a class="button" href="{SITE}/ontology/bioclima-ontology.ttl">Open Turtle ontology</a><a class="button secondary" href="{SITE}/viewer/registry.html#fam-ontology">Open ontology block</a><a class="button secondary" href="{SITE}/viewer/">Open viewer</a></div>
<ul>{''.join(cards)}</ul></article></main></body></html>"""
    (ONTO_DIR / "index.html").write_text(index, encoding="utf-8")
    print(f"Wrote {len(cards)} dereferenceable concept pages under {ONTO_DIR}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

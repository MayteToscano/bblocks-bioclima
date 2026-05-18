/*
 * BioClima viewer
 * ----------------
 * Reads layers.json (a small index of available bblocks) and renders any
 * combination of CoverageJSON or GeoJSON layers on a Leaflet map.
 *
 * Semantic navigation:
 *   - Every attribute name in the click popup is a link to its SKOS concept
 *     in the Bioclima ontology (resolved via data/concepts.json).
 *   - Policy alignment entries display the relationship type and an
 *     optional justification, mirroring the bblocks-seadots pattern.
 *
 * Deep links:
 *   - ?layer=<id> selects a layer on load.
 *   - ?lang=<en|es|zh|ro> sets the UI language.
 */

const state = {
  lang: "en",
  layers: [],          // descriptors from layers.json
  active: null,        // currently-loaded layer descriptor
  raster: null,        // CovjsonRaster instance (if applicable)
  leafletLayer: null,
  tIndex: 0,
  playing: false,
  playTimer: null,
  ontologyCache: new Map(),
  // ParameterGroup support (e.g. PCI's 4 sub-parameters)
  activeParameter: null   // key of the currently-displayed sub-parameter
};

const map = L.map("map").setView([65, 26], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "© OpenStreetMap"
}).addTo(map);

map.on("click", e => onMapClick(e.latlng));

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
(async function init() {
  // Honour ?lang= query parameter
  const url = new URL(window.location.href);
  const qLang = url.searchParams.get("lang");
  if (qLang && ["en", "es", "zh", "ro"].includes(qLang)) {
    state.lang = qLang;
    document.documentElement.lang = qLang;
  }

  document.getElementById("lang-select").value = state.lang;
  document.getElementById("lang-select").addEventListener("change", e => {
    state.lang = e.target.value;
    applyTranslations(state.lang);
    refreshActiveLegend();
  });
  document.getElementById("info-close").addEventListener("click", () => {
    document.getElementById("info-panel").hidden = true;
  });
  document.getElementById("btn-play").addEventListener("click", togglePlay);
  document.getElementById("time-slider").addEventListener("input", e => {
    state.tIndex = parseInt(e.target.value, 10);
    updateTimeLabel();
    redrawRaster();
  });

  applyTranslations(state.lang);

  const layers = await fetch("data/layers.json").then(r => r.json());
  state.layers = layers;
  renderLayerList();

  // Activate the layer requested by ?layer= (or the first one)
  const requested = url.searchParams.get("layer");
  const initial = layers.find(l => l.id === requested) || layers[0];
  if (initial) activateLayer(initial.id);
})();

// ---------------------------------------------------------------------------
// Layer list (sidebar), grouped by family
// ---------------------------------------------------------------------------
const FAMILY_LABELS = {
  ebv:           { en: "EBVs", es: "EBVs", zh: "EBV", ro: "EBV" },
  indicator:     { en: "Spatial indicators", es: "Indicadores espaciales", zh: "空间指标", ro: "Indicatori spațiali" },
  zonification:  { en: "Bioclimatic zonification", es: "Zonificación bioclimática", zh: "生物气候分区", ro: "Zonificare bioclimatică" },
  coveragejson:  { en: "CoverageJSON profile", es: "Perfil CoverageJSON", zh: "CoverageJSON 配置文件", ro: "Profil CoverageJSON" }
};

function renderLayerList() {
  const list = document.getElementById("layer-list");
  list.innerHTML = "";

  // Group layers by family
  const groups = {};
  for (const l of state.layers) {
    const fam = l.family || "other";
    (groups[fam] = groups[fam] || []).push(l);
  }

  const order = ["ebv", "indicator", "zonification", "coveragejson", "other"];
  for (const fam of order) {
    if (!groups[fam]) continue;
    const famLabel = (FAMILY_LABELS[fam] && FAMILY_LABELS[fam][state.lang]) || fam;
    const h = document.createElement("div");
    h.className = "family-header";
    h.textContent = famLabel;
    list.appendChild(h);
    for (const layer of groups[fam]) {
      const div = document.createElement("div");
      div.className = "layer-item";
      div.dataset.id = layer.id;
      div.innerHTML = `
        <input type="radio" name="layer" id="lyr-${layer.id}" ${state.active?.id === layer.id ? "checked" : ""}>
        <div class="layer-meta">
          <div class="layer-title">${layer.title[state.lang] || layer.title.en}</div>
          <div class="layer-kind">${layer.kind} · <a href="../bblocks/bblock/${layer.bblock}" target="_blank" class="bblock-link">${layer.bblock}</a></div>
        </div>`;
      div.addEventListener("click", () => activateLayer(layer.id));
      list.appendChild(div);
    }
  }
}

// ---------------------------------------------------------------------------
// Activate / load
// ---------------------------------------------------------------------------
async function activateLayer(id) {
  const layer = state.layers.find(l => l.id === id);
  if (!layer) return;
  state.active = layer;

  // Sync URL without reloading
  const url = new URL(window.location.href);
  url.searchParams.set("layer", id);
  history.replaceState(null, "", url);

  if (state.leafletLayer) { map.removeLayer(state.leafletLayer); state.leafletLayer = null; }
  if (state.raster) state.raster = null;

  document.querySelectorAll(".layer-item").forEach(el => el.classList.toggle("active", el.dataset.id === id));

  if (layer.kind === "coverage") {
    const cov = await fetch(layer.dataUrl).then(r => r.json());
    // Pick the initial sub-parameter for ParameterGroup layers (e.g. PCI).
    const initialParam = layer.isParameterGroup
      ? (layer.defaultParameter || layer.parameters?.[0]?.key)
      : null;
    state.activeParameter = initialParam;
    state.raster = new CovjsonRaster(cov, initialParam || undefined);
    state.tIndex = state.raster.hasTime ? state.raster.t.length - 1 : 0;
    setupTimeControls();
    renderParameterControls(layer);
    renderLegend(layer);
    redrawRaster();
    map.fitBounds(state.raster.bounds());
  } else if (layer.kind === "geojson") {
    renderParameterControls(null);
    const fc = await fetch(layer.dataUrl).then(r => r.json());
    state.leafletLayer = L.geoJSON(fc, {
      style: feature => ({
        color: "#222",
        weight: 0.6,
        fillColor: categoryColor(feature.properties.categoryKey),
        fillOpacity: 0.7
      }),
      onEachFeature: (feature, lyr) => lyr.on("click", evt => onFeatureClick(feature, evt.latlng))
    }).addTo(map);
    document.getElementById("time-controls").hidden = true;
    renderCategoryLegend();
    map.fitBounds(state.leafletLayer.getBounds());
  }
}

// ---------------------------------------------------------------------------
// Time controls
// ---------------------------------------------------------------------------
function setupTimeControls() {
  const tc = document.getElementById("time-controls");
  if (!state.raster.hasTime) { tc.hidden = true; return; }
  tc.hidden = false;

  const slider = document.getElementById("time-slider");
  slider.min = 0;
  slider.max = state.raster.t.length - 1;
  slider.value = state.tIndex;
  updateTimeLabel();
}

function updateTimeLabel() {
  if (!state.raster?.hasTime) return;
  const t = state.raster.t[state.tIndex];
  document.getElementById("time-label").textContent = t.substring(0, 4);
}

function togglePlay() {
  state.playing = !state.playing;
  document.getElementById("btn-play").textContent = state.playing ? "⏸" : "▶";
  if (state.playing) {
    state.playTimer = setInterval(() => {
      if (!state.raster?.hasTime) return;
      state.tIndex = (state.tIndex + 1) % state.raster.t.length;
      document.getElementById("time-slider").value = state.tIndex;
      updateTimeLabel();
      redrawRaster();
    }, 600);
  } else {
    clearInterval(state.playTimer);
  }
}

// ---------------------------------------------------------------------------
// Parameter controls (ParameterGroup layers like PCI)
// ---------------------------------------------------------------------------
function paramSpec(layer, key) {
  if (!layer?.parameters) return null;
  return layer.parameters.find(p => p.key === key) || null;
}

function activeParamSpec() {
  return paramSpec(state.active, state.activeParameter);
}

function renderParameterControls(layer) {
  const wrap = document.getElementById("param-controls");
  if (!wrap) return;
  if (!layer || !layer.isParameterGroup || !layer.parameters?.length) {
    wrap.hidden = true; wrap.innerHTML = "";
    return;
  }
  wrap.hidden = false;
  wrap.innerHTML = "";
  const label = document.createElement("label");
  label.textContent = UI_STRINGS[state.lang].parameter || "Parameter";
  wrap.appendChild(label);
  for (const p of layer.parameters) {
    const btn = document.createElement("button");
    btn.className = "param-btn";
    btn.type = "button";
    btn.dataset.key = p.key;
    btn.textContent = p.label[state.lang] || p.label.en || p.key;
    btn.title = p.iri || "";
    if (p.key === state.activeParameter) btn.classList.add("active");
    btn.addEventListener("click", () => {
      state.activeParameter = p.key;
      try { state.raster.setParameter(p.key); } catch (e) { console.warn(e); return; }
      renderParameterControls(layer);
      renderLegend(layer);
      redrawRaster();
    });
    wrap.appendChild(btn);
  }
}

// ---------------------------------------------------------------------------
// Raster drawing
// ---------------------------------------------------------------------------
function redrawRaster() {
  if (!state.raster) return;
  if (state.leafletLayer) map.removeLayer(state.leafletLayer);
  const layer = state.active;
  const p = activeParamSpec();
  const ramp  = (p && p.colorRamp)  || layer.colorRamp  || ["#3B8BD4", "#FCDE5A", "#E85D24"];
  const range = (p && p.range)      || layer.range      || [0, 1];
  const scale = chroma.scale(ramp).domain(range);
  state.leafletLayer = state.raster.toCanvasLayer(state.tIndex, scale, range);
  state.leafletLayer.addTo(map);
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------
function renderLegend(layer) {
  const el = document.getElementById("legend");
  el.innerHTML = "";
  const p = activeParamSpec();
  const ramp  = (p && p.colorRamp) || layer.colorRamp || ["#3B8BD4", "#FCDE5A", "#E85D24"];
  const range = (p && p.range)     || layer.range     || [0, 1];
  const unit  = (p && p.unit)      || layer.unit;
  const [lo, hi] = range;
  const stops = 5;
  const scale = chroma.scale(ramp).domain(range);
  for (let i = 0; i < stops; i++) {
    const v = lo + (hi - lo) * (i / (stops - 1));
    const div = document.createElement("div");
    div.className = "legend-item";
    div.innerHTML = `<span class="legend-swatch" style="background:${scale(v).hex()}"></span><span>${v.toFixed(2)} ${unit?.symbol || ""}</span>`;
    el.appendChild(div);
  }
}

function renderCategoryLegend() {
  const el = document.getElementById("legend");
  el.innerHTML = "";
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    const label = CATEGORY_LABELS[key]?.[state.lang] || key;
    const div = document.createElement("div");
    div.className = "legend-item";
    div.innerHTML = `<span class="legend-swatch" style="background:${color}"></span><span>${label}</span>`;
    el.appendChild(div);
  }
}

function refreshActiveLegend() {
  if (!state.active) return;
  if (state.active.kind === "coverage") renderLegend(state.active);
  else renderCategoryLegend();
  renderLayerList();
}

// ---------------------------------------------------------------------------
// Click handling
// ---------------------------------------------------------------------------
async function onMapClick(latlng) {
  if (!state.raster) return; // GeoJSON layers use their own click handler
  const v = state.raster.valueAt(state.tIndex, latlng.lng, latlng.lat);
  const layer = state.active;
  const T = UI_STRINGS[state.lang];
  const attrIris = layer.attributeIris || {};
  const p = activeParamSpec();

  // For ParameterGroup layers, the title and the value are about the
  // currently-displayed sub-parameter; the parent indicator is shown as a
  // separate clickable link below.
  const title    = p ? (p.label[state.lang] || p.label.en) : (layer.title[state.lang] || layer.title.en);
  const titleIri = p ? p.iri : layer.observedPropertyIri;
  const unitSym  = p ? p.unit?.symbol : (layer.unit?.symbol || "");
  const unitIri  = p ? p.unit?.iri    : attrIris.unit;
  const valueIri = p ? p.iri          : attrIris.value;

  // Build a list of semantically-linked attributes
  const attrs = [
    { key: "value", iri: valueIri,
      labelFallback: T.value,
      value: isNaN(v) ? T.noData : `${formatNumber(v, p?.key)} ${unitSym}` },
    { key: "unit", iri: unitIri,
      labelFallback: T.unit,
      value: unitSym }
  ];
  if (layer.isParameterGroup) {
    attrs.push({ key: "indicator", iri: layer.observedPropertyIri,
      labelFallback: T.indicator || "Indicator",
      value: layer.title[state.lang] || layer.title.en });
  }
  attrs.push({ key: "cell", iri: null,
    labelFallback: T.cell,
    value: `${latlng.lat.toFixed(3)}, ${latlng.lng.toFixed(3)}` });
  if (state.raster.hasTime) {
    attrs.push({ key: "time", iri: null,
      labelFallback: T.time || "Year",
      value: state.raster.t[state.tIndex].substring(0, 4) });
  }

  showInfo({
    title:       title,
    titleIri:    titleIri,
    bblock:      layer.bblock,
    attributes:  attrs,
    policy:      layer.policyAlignment || []
  });
}

function formatNumber(v, paramKey) {
  if (typeof v !== "number" || isNaN(v)) return String(v);
  // Year and integer-like values: no decimals
  if (paramKey === "changepoint_year") return Math.round(v).toString();
  // Small numbers: 3 decimals
  if (Math.abs(v) < 10) return v.toFixed(3);
  return v.toFixed(1);
}

async function onFeatureClick(feature, latlng) {
  const p = feature.properties;
  const layer = state.active;
  const T = UI_STRINGS[state.lang];
  const attrIris = layer.attributeIris || {};

  const attrs = [
    { key: "category", iri: p.category || attrIris.category,
      labelFallback: T.category,
      value: p.categoryLabel?.[state.lang] || p.categoryLabel?.en || p.categoryKey },
    { key: "mean_pci", iri: attrIris.mean_pci,
      labelFallback: "Mean PCI",
      value: p.mean_pci !== undefined ? `${p.mean_pci.toFixed(3)} d/yr` : null },
    { key: "min_pci", iri: attrIris.min_pci,
      labelFallback: "Min PCI",
      value: p.min_pci !== undefined ? `${p.min_pci.toFixed(3)} d/yr` : null },
    { key: "max_pci", iri: attrIris.max_pci,
      labelFallback: "Max PCI",
      value: p.max_pci !== undefined ? `${p.max_pci.toFixed(3)} d/yr` : null },
    { key: "pixel_count", iri: attrIris.pixel_count,
      labelFallback: "Pixels",
      value: p.pixel_count },
    { key: "area_km2", iri: attrIris.area_km2,
      labelFallback: "Area (km²)",
      value: p.area_km2 },
    { key: "cell", iri: null,
      labelFallback: T.cell,
      value: `${latlng.lat.toFixed(3)}, ${latlng.lng.toFixed(3)}` }
  ].filter(a => a.value !== null && a.value !== undefined);

  // Per-feature policyRelevance (may be richer than the layer default)
  const featurePolicy = p.policyRelevance && p.policyRelevance.length
    ? p.policyRelevance
    : layer.policyAlignment || [];

  showInfo({
    title:      p.categoryLabel?.[state.lang] || p.categoryLabel?.en || p.categoryKey,
    titleIri:   p.category,
    bblock:     layer.bblock,
    attributes: attrs,
    policy:     featurePolicy
  });
}

async function showInfo({ title, titleIri, bblock, attributes, policy }) {
  const panel = document.getElementById("info-panel");
  panel.hidden = false;

  // Title with concept link
  const titleEl = document.getElementById("info-title");
  titleEl.innerHTML = "";
  if (titleIri) {
    const a = document.createElement("a");
    a.href = titleIri;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = title;
    a.className = "concept-link";
    titleEl.appendChild(a);
  } else {
    titleEl.textContent = title;
  }

  // bblock link
  const bblockA = document.getElementById("info-bblock");
  if (bblockA && bblock) {
    bblockA.href = `../bblocks/bblock/${bblock}`;
    bblockA.textContent = bblock;
    bblockA.hidden = false;
  }

  // Title definition
  const def = await resolveConcept(titleIri);
  document.getElementById("info-definition").textContent =
    def?.definition?.[state.lang] || def?.definition?.en || "";

  // Attributes: each key links to its concept
  const dl = document.getElementById("info-properties");
  dl.innerHTML = "";
  for (const a of attributes) {
    const concept = await resolveConcept(a.iri);
    const label = concept?.label?.[state.lang] || concept?.label?.en || a.labelFallback;
    const dt = document.createElement("dt");
    if (a.iri) {
      const link = document.createElement("a");
      link.href = a.iri;
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "attr-link";
      link.textContent = label;
      link.title = concept?.definition?.[state.lang] || concept?.definition?.en || a.iri;
      dt.appendChild(link);
    } else {
      dt.textContent = label;
    }
    const dd = document.createElement("dd");
    dd.textContent = a.value;
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  // Policy list with relationship and justification (bblocks-seadots style)
  const ul = document.getElementById("info-policy");
  ul.innerHTML = "";
  const T = UI_STRINGS[state.lang];
  for (const entry of policy) {
    const iri = (typeof entry === "string") ? entry : (entry.target || entry.ontology);
    if (!iri) continue;
    const rel = (typeof entry === "object") ? entry.relationship : null;
    const ev  = (typeof entry === "object") ? entry.evidenceStrength : null;
    const just = (typeof entry === "object" && entry.justification)
      ? (entry.justification[state.lang] || entry.justification.en) : null;

    const concept = await resolveConcept(iri);
    const label = concept?.label?.[state.lang] || concept?.label?.en || iri;
    const li = document.createElement("li");
    let html = `<a class="policy-link" href="${iri}" target="_blank" rel="noopener">${label}</a>`;
    if (rel) {
      html += ` <span class="policy-rel" title="${T.relationship || "relationship"}">${rel}</span>`;
    }
    if (ev) {
      html += ` <span class="policy-ev" title="${T.evidenceStrength || "evidence"}">${ev}</span>`;
    }
    if (just) {
      html += `<div class="policy-just">${just}</div>`;
    }
    li.innerHTML = html;
    ul.appendChild(li);
  }
}

// ---------------------------------------------------------------------------
// Vocabulary resolution (with caching)
// ----------------------------------------------------------------------------
// The list of vocabularies and where to dereference each one is parametric:
// see viewer/data/vocabularies.json. Today the SKOS vocabulary is dereferenced
// against the local concepts.json projection. When the vocabulary is published
// in OGC Rainbow, flip `rainbow.migrated: true` and set `rainbow.rainbowUri`
// in vocabularies.json — no code change required.
async function loadVocabConfig() {
  if (window._vocabConfig) return window._vocabConfig;
  try {
    const cfg = await fetch("data/vocabularies.json").then(r => r.json());
    window._vocabConfig = cfg;
    return cfg;
  } catch (e) {
    console.warn("vocabularies.json not loadable, falling back to legacy concepts.json", e);
    window._vocabConfig = {
      vocabularies: [{
        id: "fallback",
        baseIri: "",
        rainbow: { migrated: false },
        sources: { conceptIndex: "data/concepts.json" }
      }]
    };
    return window._vocabConfig;
  }
}

async function resolveConcept(iri) {
  if (!iri) return null;
  if (state.ontologyCache.has(iri)) return state.ontologyCache.get(iri);

  const cfg = await loadVocabConfig();
  // Pick the vocabulary whose baseIri prefixes this IRI; fall back to the first.
  const vocab = (cfg.vocabularies || []).find(v => v.baseIri && iri.startsWith(v.baseIri))
              || cfg.vocabularies?.[0];
  let found = null;
  if (vocab) {
    if (vocab.rainbow && vocab.rainbow.migrated && vocab.rainbow.rainbowUri) {
      // Future path: dereference against OGC Rainbow with content negotiation.
      // Rainbow returns JSON when given Accept: application/json. We map the
      // local IRI to the Rainbow IRI by replacing the baseIri prefix.
      const rainbowIri = iri.replace(vocab.baseIri, vocab.rainbow.rainbowUri);
      try {
        found = await fetch(rainbowIri, {
          headers: {"Accept": "application/json"}
        }).then(r => r.ok ? r.json() : null);
      } catch (_) { found = null; }
    }
    if (!found) {
      // Local path: use the JSON projection produced from the TTL.
      if (!window._conceptIndex) {
        const url = vocab.sources?.conceptIndex || "data/concepts.json";
        window._conceptIndex = await fetch(url).then(r => r.json()).catch(() => ({}));
      }
      found = window._conceptIndex[iri] || null;
    }
  }
  state.ontologyCache.set(iri, found);
  return found;
}

// ---------------------------------------------------------------------------
// Category styling
// ---------------------------------------------------------------------------
const CATEGORY_COLORS = {
  stable:         "#3B8BD4",
  mild_advance:   "#F2A623",
  strong_advance: "#E85D24",
  delay:          "#7F77DD"
};

const CATEGORY_LABELS = {
  stable: {
    en: "Stable", es: "Estable", zh: "稳定", ro: "Stabilă"
  },
  mild_advance: {
    en: "Mild advance", es: "Adelanto leve", zh: "轻微提前", ro: "Avans ușor"
  },
  strong_advance: {
    en: "Strong advance", es: "Adelanto fuerte", zh: "强烈提前", ro: "Avans puternic"
  },
  delay: {
    en: "Delay", es: "Retraso", zh: "延迟", ro: "Întârziere"
  }
};

function categoryColor(key) { return CATEGORY_COLORS[key] || "#888"; }

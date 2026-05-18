(function () {
  "use strict";

  const cfg = window.BIOCLIMA_PORTAL;
  const state = {
    lang: "en",
    filters: new Set(),
    query: "",
    catalog: cfg.catalog.slice(),
    layers: [],
    selected: null,
    map: null,
    leafletLayer: null,
    raster: null,
    activeLayer: null,
    activeParameter: null,
    tIndex: 0,
    concepts: {}
  };

  const $ = (id) => document.getElementById(id);
  const tr = (key) => (cfg.labels[state.lang] && cfg.labels[state.lang][key]) || cfg.labels.en[key] || key;
  const label = (obj) => (obj && (obj[state.lang] || obj.en)) || "";

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const params = new URL(location.href).searchParams;
    state.lang = params.get("lang") || document.documentElement.lang || "en";
    if (!cfg.labels[state.lang]) state.lang = "en";
    document.documentElement.lang = state.lang;

    renderFilters();
    bindControls();
    await loadExternalIndexes();
    initMap();
    renderCatalog();
    const selectedId = params.get("item") || "ecosystem-phenology";
    selectItem(selectedId);
  }

  async function loadExternalIndexes() {
    try {
      const res = await fetch("data/layers.json", { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.layers = await res.json();
    } catch (err) {
      console.warn("Using fallback layer descriptors", err);
      state.layers = cfg.fallbackLayers.slice();
    }
    try {
      const res = await fetch("data/concepts.json", { cache: "no-cache" });
      if (res.ok) state.concepts = await res.json();
    } catch (_) {
      state.concepts = {};
    }
  }

  function bindControls() {
    $("search-input").addEventListener("input", (ev) => {
      state.query = ev.target.value.trim().toLowerCase();
      renderCatalog();
    });
    $("clear-filters").addEventListener("click", () => {
      state.filters.clear();
      state.query = "";
      $("search-input").value = "";
      renderFilters();
      renderCatalog();
    });
    $("layer-select").addEventListener("change", (ev) => activateLayer(ev.target.value));
    $("time-select").addEventListener("change", (ev) => {
      state.tIndex = Number(ev.target.value || 0);
      redrawActiveLayer();
    });
    $("param-select").addEventListener("change", (ev) => {
      state.activeParameter = ev.target.value || null;
      if (state.raster) state.raster.setParameter(state.activeParameter || undefined);
      setupTimeSelect();
      redrawActiveLayer();
    });
    $("map-more").addEventListener("click", () => {
      if (state.raster && state.map) state.map.fitBounds(state.raster.bounds(true, state.tIndex), { padding: [20, 20] });
    });
    $("close-details").addEventListener("click", () => document.body.classList.toggle("details-collapsed"));
  }

  function initMap() {
    state.map = L.map("map", { zoomControl: true, preferCanvas: true }).setView([64.9, 26.1], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap contributors"
    }).addTo(state.map);
    state.map.on("click", onMapClick);
    addFinlandReference();
  }

  function addFinlandReference() {
    // Lightweight simplified outline just as a visual reference. Data is intentionally coarse.
    const finland = [[59.81,22.95],[60.08,24.22],[60.31,25.66],[60.85,26.74],[61.28,28.18],[62.31,29.75],[63.36,31.03],[64.32,30.16],[65.54,30.00],[66.12,29.09],[67.73,29.56],[68.92,28.96],[69.76,27.38],[70.09,25.78],[69.29,24.02],[68.13,23.66],[67.39,23.07],[66.63,23.84],[65.74,24.13],[64.93,23.53],[63.82,22.60],[62.63,21.31],[61.48,21.30],[60.57,21.38],[59.81,22.95]];
    L.polyline(finland, { color: "#1e2735", weight: 1.2, opacity: 0.55, interactive: false }).addTo(state.map);
  }

  function renderFilters() {
    const row = $("filter-row");
    row.querySelectorAll(".chip").forEach(el => el.remove());
    for (const f of cfg.filters) {
      const btn = document.createElement("button");
      btn.className = "chip" + (state.filters.has(f.key) ? " active" : "");
      btn.dataset.filter = f.key;
      btn.innerHTML = `<span>${f.icon}</span><span>${f.label}</span>`;
      btn.addEventListener("click", () => {
        if (state.filters.has(f.key)) state.filters.delete(f.key); else state.filters.add(f.key);
        renderFilters();
        renderCatalog();
      });
      row.insertBefore(btn, $("clear-filters"));
    }
  }

  function filteredCatalog() {
    const q = state.query;
    return state.catalog.filter(item => {
      const typeMatch = !state.filters.size || state.filters.has(item.type);
      const haystack = [label(item.title), label(item.description), item.type, item.scope, item.bblock, ...(item.keywords || [])]
        .join(" ").toLowerCase();
      const queryMatch = !q || haystack.includes(q);
      return typeMatch && queryMatch;
    });
  }

  function renderCatalog() {
    const items = filteredCatalog();
    $("results-count").textContent = `${items.length} ${tr("results")}`;
    const list = $("results-list");
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = `<div class="empty-state">${tr("noResults")}</div>`;
      return;
    }
    for (const item of items) {
      const card = document.createElement("button");
      card.className = `result-card${state.selected?.id === item.id ? " selected" : ""}`;
      card.type = "button";
      card.innerHTML = `
        <div class="card-icon ${item.type}">${item.icon}</div>
        <div>
          <div class="card-title-row">
            <span class="card-title">${escapeHtml(label(item.title))}</span>
            <span class="tag ${item.type}">${item.type === "coveragejson" ? "CoverageJSON" : item.type.toUpperCase()}</span>
          </div>
          <p class="card-desc">${escapeHtml(label(item.description))}</p>
          <span class="meta-pill">${item.scope === "Finland" ? "📍" : "🌐"} ${escapeHtml(item.scope || "Global")}</span>
        </div>
        <div class="chev">›</div>
      `;
      card.addEventListener("click", () => selectItem(item.id));
      list.appendChild(card);
    }
  }

  function selectItem(id) {
    const item = state.catalog.find(x => x.id === id) || state.catalog[0];
    if (!item) return;
    state.selected = item;
    const url = new URL(location.href);
    url.searchParams.set("item", item.id);
    history.replaceState(null, "", url);
    renderCatalog();
    renderStructure(item);
    renderOntology(item);
    renderMetadata(item);
    populateLayerSelect(item.layerId);
    if (item.layerId) activateLayer(item.layerId);
  }

  function renderStructure(item) {
    $("structure-root-title").textContent = label(item.title);
    $("structure-root-sub").textContent = item.type.toUpperCase();
    const branch = $("structure-branch");
    branch.innerHTML = "";
    for (const node of item.structure || []) {
      const div = document.createElement("div");
      div.className = "block-node";
      div.innerHTML = `
        <div class="node-ico-small ${node.family}">${node.icon || "□"}</div>
        <div>
          <div class="node-label">${escapeHtml(node.label)}</div>
          <div class="node-sub">${escapeHtml(node.sub || "")}</div>
        </div>
        <button class="node-action" title="Open block">+</button>
      `;
      const action = div.querySelector(".node-action");
      action.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (item.blockUrl) window.open(item.blockUrl, "_blank", "noopener");
      });
      branch.appendChild(div);
    }
  }

  function renderOntology(item) {
    const o = item.ontology || {};
    $("ontology-label").textContent = o.label || label(item.title);
    $("ontology-tag").textContent = o.tag || tr("ontologyClass");
    $("ontology-definition").textContent = o.definition || "";
    $("ontology-synonym").textContent = o.synonym || "—";
    $("ontology-units").textContent = o.units || "—";
    $("ontology-broader").textContent = o.broader || "—";

    const rel = $("ontology-related");
    rel.innerHTML = "";
    for (const r of o.related || []) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="ontology/" target="_blank" rel="noopener">${escapeHtml(r)} ↗</a>`;
      rel.appendChild(li);
    }
    if (!rel.children.length) rel.innerHTML = "<li>—</li>";

    const graph = $("semantic-relations");
    const relations = o.relations || [];
    graph.innerHTML = "";
    if (relations.length) {
      const first = relations.slice(0, 4);
      const center = escapeHtml(o.label || label(item.title));
      const targets = first.map(x => `<div><div class="rel-node">${escapeHtml(x.target)}</div><div class="rel-label">${escapeHtml(x.relation)}</div></div>`).join("");
      graph.innerHTML = `<div class="relation-grid">${targets}<div class="rel-node center">${center}</div></div>`;
    }

    const links = $("ontology-links");
    links.innerHTML = "";
    const linksData = [
      { text: "View in Building Blocks", href: item.blockUrl || "../bblocks/", icon: "⬡" },
      { text: "View Related Indicators", href: "#", icon: "▥" },
      { text: "View Coverage / Data", href: state.layers.find(l => l.id === item.layerId)?.dataUrl || "#", icon: "🌍" }
    ];
    for (const l of linksData) {
      const li = document.createElement("li");
      li.innerHTML = `${l.icon} <a href="${l.href}" target="_blank" rel="noopener">${escapeHtml(l.text)}</a>`;
      links.appendChild(li);
    }
  }

  function renderMetadata(item) {
    const m = item.metadata || {};
    $("meta-left").innerHTML = definitionList([
      ["Identifier", m.identifier || item.id],
      ["Version", m.version || "—"],
      ["Created", m.created || "—"],
      ["Modified", m.modified || "—"]
    ]);
    $("meta-middle").innerHTML = definitionList([
      ["Publisher", m.publisher || "—"],
      ["License", m.license || "—"],
      ["Spatial Resolution", m.spatialResolution || "—"],
      ["Temporal Resolution", m.temporalResolution || "—"]
    ]);
    $("summary-text").textContent = item.summary || label(item.description);
    const kws = $("keywords");
    kws.innerHTML = "";
    for (const kw of item.keywords || []) {
      const span = document.createElement("span");
      span.className = "keyword";
      span.textContent = kw;
      kws.appendChild(span);
    }
  }

  function definitionList(rows) {
    return `<dl class="meta-grid">${rows.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join("")}</dl>`;
  }

  function populateLayerSelect(preferredId) {
    const select = $("layer-select");
    select.innerHTML = "";
    for (const l of state.layers) {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = label(l.title) || l.id;
      select.appendChild(opt);
    }
    const chosen = state.layers.find(l => l.id === preferredId) ? preferredId : state.layers[0]?.id;
    if (chosen) select.value = chosen;
  }

  async function activateLayer(layerId) {
    const layer = state.layers.find(l => l.id === layerId);
    if (!layer || !state.map) return;
    state.activeLayer = layer;
    $("layer-select").value = layer.id;
    setMapStatus(tr("loading"));
    clearMapLayer();
    try {
      const data = await fetch(layer.dataUrl, { cache: "no-cache" }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} — ${layer.dataUrl}`);
        return r.json();
      });
      if (layer.kind === "geojson") {
        renderGeoJSONLayer(layer, data);
      } else {
        state.activeParameter = layer.isParameterGroup ? (layer.defaultParameter || layer.parameters?.[0]?.key) : null;
        state.raster = new CovjsonRaster(data, state.activeParameter || undefined);
        setupParameterSelect(layer);
        setupTimeSelect();
        redrawActiveLayer();
        state.map.fitBounds(state.raster.bounds(true, state.tIndex), { padding: [18, 18] });
      }
      setMapStatus(`${tr("ready")} · ${label(layer.title) || layer.id}`);
    } catch (err) {
      console.error(err);
      setMapStatus(`Error: ${err.message}`);
    }
  }

  function clearMapLayer() {
    if (state.leafletLayer) {
      state.map.removeLayer(state.leafletLayer);
      state.leafletLayer = null;
    }
    state.raster = null;
  }

  function setupParameterSelect(layer) {
    const param = $("param-select");
    param.innerHTML = "";
    if (!layer.isParameterGroup || !layer.parameters?.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Default parameter";
      param.appendChild(opt);
      param.disabled = true;
      return;
    }
    param.disabled = false;
    for (const p of layer.parameters) {
      const opt = document.createElement("option");
      opt.value = p.key;
      opt.textContent = label(p.label) || p.key;
      param.appendChild(opt);
    }
    param.value = state.activeParameter;
  }

  function setupTimeSelect() {
    const time = $("time-select");
    time.innerHTML = "";
    const vals = state.raster?.t || [];
    if (!vals.length) {
      const opt = document.createElement("option");
      opt.value = "0";
      opt.textContent = "—";
      time.appendChild(opt);
      time.disabled = true;
      state.tIndex = 0;
      return;
    }
    time.disabled = false;
    vals.forEach((v, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = String(v).substring(0, 4);
      time.appendChild(opt);
    });
    const preferred = vals.findIndex(v => String(v).startsWith("2005"));
    state.tIndex = preferred >= 0 ? preferred : vals.length - 1;
    time.value = String(state.tIndex);
  }

  function redrawActiveLayer() {
    if (!state.activeLayer || !state.raster) return;
    if (state.leafletLayer) state.map.removeLayer(state.leafletLayer);
    const spec = activeParameterSpec();
    const range = spec?.range || state.activeLayer.range || [0, 1];
    const ramp = spec?.colorRamp || state.activeLayer.colorRamp || ["#3B8BD4", "#FCDE5A", "#E85D24"];
    state.leafletLayer = createRasterGridLayer(state.map, state.raster, {
      tIndex: state.tIndex,
      range,
      ramp,
      opacity: 0.78
    }).addTo(state.map);
    renderLegend(range, ramp, spec?.unit || state.activeLayer.unit);
  }

  function activeParameterSpec() {
    const layer = state.activeLayer;
    if (!layer?.parameters || !state.activeParameter) return null;
    return layer.parameters.find(p => p.key === state.activeParameter) || null;
  }

  function renderGeoJSONLayer(layer, data) {
    setupParameterSelect({ isParameterGroup: false });
    $("time-select").innerHTML = `<option>—</option>`;
    $("time-select").disabled = true;
    const colors = { stable: "#3B8BD4", mild_advance: "#F2A623", strong_advance: "#E85D24", delay: "#7F77DD" };
    state.leafletLayer = L.geoJSON(data, {
      style: f => ({
        color: "#25324a",
        weight: .8,
        fillOpacity: .70,
        fillColor: colors[f.properties?.categoryKey] || colors[f.properties?.category] || "#789"
      }),
      onEachFeature: (feature, lyr) => {
        lyr.on("click", ev => {
          const p = feature.properties || {};
          L.popup().setLatLng(ev.latlng).setContent(`<strong>${escapeHtml(p.categoryKey || p.category || layer.id)}</strong><br/>Mean PCI: ${escapeHtml(String(p.mean_pci ?? "—"))}`).openOn(state.map);
        });
      }
    }).addTo(state.map);
    try { state.map.fitBounds(state.leafletLayer.getBounds(), { padding: [18, 18] }); } catch (_) {}
    renderLegend([-0.8, 0.8], ["#1D9E75", "#F1EFE8", "#E24B4A"], { symbol: "d/yr" });
  }

  function renderLegend(range, ramp, unit) {
    const lg = $("legend-ramp");
    lg.style.background = `linear-gradient(to top, ${ramp.join(",")})`;
    const [lo, hi] = range;
    $("legend-hi").textContent = `${formatLegend(hi)} ${unit?.symbol || ""}`;
    $("legend-mid").textContent = `${formatLegend((lo + hi) / 2)} ${unit?.symbol || ""}`;
    $("legend-lo").textContent = `${formatLegend(lo)} ${unit?.symbol || ""}`;
  }

  function formatLegend(v) {
    if (Math.abs(v) >= 100) return String(Math.round(v));
    if (Math.abs(v) >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }

  function setMapStatus(msg) {
    $("map-status").textContent = msg;
  }

  function onMapClick(ev) {
    if (!state.raster || !state.activeLayer) return;
    const v = state.raster.valueAt(state.tIndex, ev.latlng.lng, ev.latlng.lat);
    const layer = state.activeLayer;
    const spec = activeParameterSpec();
    const unit = spec?.unit?.symbol || layer.unit?.symbol || "";
    const title = spec ? label(spec.label) : label(layer.title);
    const html = `
      <strong>${escapeHtml(title || layer.id)}</strong><br/>
      ${tr("value")}: ${Number.isFinite(v) ? escapeHtml(formatValue(v)) + " " + escapeHtml(unit) : tr("noData")}<br/>
      ${tr("cell")}: ${ev.latlng.lat.toFixed(3)}, ${ev.latlng.lng.toFixed(3)}<br/>
      ${layer.bblock ? `<a href="../bblocks/bblock/${encodeURIComponent(layer.bblock)}" target="_blank" rel="noopener">${tr("block")}: ${escapeHtml(layer.bblock)}</a>` : ""}
    `;
    L.popup().setLatLng(ev.latlng).setContent(html).openOn(state.map);
  }

  function formatValue(v) {
    if (!Number.isFinite(v)) return "—";
    if (Math.abs(v) >= 1000) return Math.round(v).toString();
    if (Math.abs(v) >= 100) return v.toFixed(1);
    if (Math.abs(v) >= 10) return v.toFixed(2);
    return v.toFixed(3);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();

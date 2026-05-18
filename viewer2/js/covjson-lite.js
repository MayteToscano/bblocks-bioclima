(function () {
  "use strict";

  function axisValues(axis) {
    if (!axis) return [];
    if (Array.isArray(axis.values)) return axis.values.slice();
    if (typeof axis.start === "number" && typeof axis.stop === "number" && typeof axis.num === "number") {
      const n = axis.num;
      if (n <= 1) return [axis.start];
      const step = (axis.stop - axis.start) / (n - 1);
      return Array.from({ length: n }, (_, i) => axis.start + step * i);
    }
    return [];
  }

  function edgesFromCenters(vals) {
    if (!vals || !vals.length) return [];
    if (vals.length === 1) return [vals[0] - 0.5, vals[0] + 0.5];
    const edges = [];
    edges.push(vals[0] - (vals[1] - vals[0]) / 2);
    for (let i = 1; i < vals.length; i++) edges.push((vals[i - 1] + vals[i]) / 2);
    edges.push(vals[vals.length - 1] + (vals[vals.length - 1] - vals[vals.length - 2]) / 2);
    return edges;
  }

  function firstKey(obj) {
    return obj ? Object.keys(obj)[0] : null;
  }

  function asCoverage(covjson) {
    if (!covjson) throw new Error("Empty CoverageJSON object");
    if (covjson.type === "CoverageCollection" && Array.isArray(covjson.coverages)) return covjson.coverages[0];
    return covjson;
  }

  function normaliseRange(range) {
    if (!range) throw new Error("CoverageJSON range is missing");
    if (Array.isArray(range.values)) return range;
    if (range.type === "NdArray" && Array.isArray(range.values)) return range;
    throw new Error("Unsupported CoverageJSON range format");
  }

  function selectRange(coverage, parameterKey) {
    const ranges = coverage.ranges || {};
    if (parameterKey && ranges[parameterKey]) return { key: parameterKey, range: normaliseRange(ranges[parameterKey]) };
    const key = firstKey(ranges);
    if (!key) throw new Error("No ranges found in CoverageJSON");
    return { key, range: normaliseRange(ranges[key]) };
  }

  function getShape(range, axes) {
    if (Array.isArray(range.shape) && range.shape.length) return range.shape.slice();
    const names = range.axisNames || [];
    if (names.length) return names.map(n => axes[n]?.length || 1);
    const fallback = [];
    if (axes.t?.length) fallback.push(axes.t.length);
    fallback.push(axes.y.length, axes.x.length);
    return fallback;
  }

  function getAxisNames(range, axes) {
    if (Array.isArray(range.axisNames) && range.axisNames.length) return range.axisNames.slice();
    const names = [];
    if (axes.t?.length) names.push("t");
    names.push("y", "x");
    return names;
  }

  function offsetFor(axisNames, shape, indexMap) {
    let offset = 0;
    let stride = 1;
    for (let i = axisNames.length - 1; i >= 0; i--) {
      const axis = axisNames[i];
      const idx = indexMap[axis] || 0;
      offset += idx * stride;
      stride *= shape[i] || 1;
    }
    return offset;
  }

  function numericOrNaN(v) {
    if (v === null || v === undefined) return NaN;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }

  function colorRamp(stops, value, domain) {
    if (!Number.isFinite(value)) return null;
    const ramp = stops && stops.length ? stops : ["#3B8BD4", "#FCDE5A", "#E85D24"];
    const lo = domain?.[0] ?? 0;
    const hi = domain?.[1] ?? 1;
    if (hi === lo) return ramp[0];
    const t = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
    const scaled = t * (ramp.length - 1);
    const i = Math.min(ramp.length - 2, Math.floor(scaled));
    const f = scaled - i;
    return mixHex(ramp[i], ramp[i + 1], f);
  }

  function hexToRgb(hex) {
    const h = hex.replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mixHex(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    const r = Math.round(A[0] + (B[0] - A[0]) * t);
    const g = Math.round(A[1] + (B[1] - A[1]) * t);
    const bl = Math.round(A[2] + (B[2] - A[2]) * t);
    return `rgb(${r},${g},${bl})`;
  }

  class CovjsonRaster {
    constructor(covjson, parameterKey) {
      this.coverage = asCoverage(covjson);
      const domain = this.coverage.domain || {};
      const domainAxes = domain.axes || {};
      this.x = axisValues(domainAxes.x);
      this.y = axisValues(domainAxes.y);
      this.t = axisValues(domainAxes.t);
      if (!this.x.length || !this.y.length) throw new Error("CoverageJSON must include x and y axes");
      this.xEdges = edgesFromCenters(this.x);
      this.yEdges = edgesFromCenters(this.y);
      this.setParameter(parameterKey);
    }

    setParameter(parameterKey) {
      const selected = selectRange(this.coverage, parameterKey);
      this.parameterKey = selected.key;
      this.range = selected.range;
      this.values = selected.range.values;
      this.axisNames = getAxisNames(selected.range, { x: this.x, y: this.y, t: this.t });
      this.shape = getShape(selected.range, { x: this.x, y: this.y, t: this.t });
    }

    hasTime() { return this.t && this.t.length > 0; }

    value(tIndex, yIndex, xIndex) {
      if (xIndex < 0 || yIndex < 0 || xIndex >= this.x.length || yIndex >= this.y.length) return NaN;
      const indexMap = { x: xIndex, y: yIndex, t: this.hasTime() ? tIndex : 0 };
      const offset = offsetFor(this.axisNames, this.shape, indexMap);
      return numericOrNaN(this.values[offset]);
    }

    nearestIndex(values, v) {
      if (!values.length) return -1;
      const asc = values[values.length - 1] >= values[0];
      if (asc) {
        if (v < values[0] || v > values[values.length - 1]) return -1;
      } else if (v > values[0] || v < values[values.length - 1]) return -1;
      let lo = 0, hi = values.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (values[mid] === v) return mid;
        if ((asc && values[mid] < v) || (!asc && values[mid] > v)) lo = mid + 1;
        else hi = mid - 1;
      }
      const a = Math.max(0, Math.min(values.length - 1, lo));
      const b = Math.max(0, Math.min(values.length - 1, lo - 1));
      return Math.abs(values[a] - v) < Math.abs(values[b] - v) ? a : b;
    }

    valueAt(tIndex, lng, lat) {
      const xi = this.nearestIndex(this.x, lng);
      const yi = this.nearestIndex(this.y, lat);
      if (xi < 0 || yi < 0) return NaN;
      return this.value(tIndex, yi, xi);
    }

    bounds(validOnly = false, tIndex = 0) {
      if (!validOnly) {
        const west = Math.min(...this.xEdges), east = Math.max(...this.xEdges);
        const south = Math.min(...this.yEdges), north = Math.max(...this.yEdges);
        return [[south, west], [north, east]];
      }
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let yi = 0; yi < this.y.length; yi++) {
        for (let xi = 0; xi < this.x.length; xi++) {
          const v = this.value(tIndex, yi, xi);
          if (!Number.isFinite(v)) continue;
          minX = Math.min(minX, this.xEdges[xi], this.xEdges[xi + 1]);
          maxX = Math.max(maxX, this.xEdges[xi], this.xEdges[xi + 1]);
          minY = Math.min(minY, this.yEdges[yi], this.yEdges[yi + 1]);
          maxY = Math.max(maxY, this.yEdges[yi], this.yEdges[yi + 1]);
        }
      }
      if (!Number.isFinite(minX)) return this.bounds(false, tIndex);
      return [[minY, minX], [maxY, maxX]];
    }
  }

  function createRasterGridLayer(map, raster, options) {
    const opts = Object.assign({ tileSize: 256, opacity: 0.78, range: [0, 1], ramp: ["#3B8BD4", "#FCDE5A", "#E85D24"], tIndex: 0 }, options || {});
    const Grid = L.GridLayer.extend({
      createTile: function (coords) {
        const tile = L.DomUtil.create("canvas", "leaflet-tile bioclima-raster-tile");
        const size = this.getTileSize();
        tile.width = size.x;
        tile.height = size.y;
        const ctx = tile.getContext("2d");
        ctx.clearRect(0, 0, size.x, size.y);
        ctx.globalAlpha = opts.opacity;

        const nw = map.unproject([coords.x * size.x, coords.y * size.y], coords.z);
        const se = map.unproject([(coords.x + 1) * size.x, (coords.y + 1) * size.y], coords.z);
        const west = Math.min(nw.lng, se.lng), east = Math.max(nw.lng, se.lng);
        const north = Math.max(nw.lat, se.lat), south = Math.min(nw.lat, se.lat);

        const xs = raster.xEdges;
        const ys = raster.yEdges;
        for (let yi = 0; yi < raster.y.length; yi++) {
          const y0 = Math.min(ys[yi], ys[yi + 1]);
          const y1 = Math.max(ys[yi], ys[yi + 1]);
          if (y1 < south || y0 > north) continue;
          for (let xi = 0; xi < raster.x.length; xi++) {
            const x0 = Math.min(xs[xi], xs[xi + 1]);
            const x1 = Math.max(xs[xi], xs[xi + 1]);
            if (x1 < west || x0 > east) continue;
            const v = raster.value(opts.tIndex, yi, xi);
            if (!Number.isFinite(v)) continue;
            const c = colorRamp(opts.ramp, v, opts.range);
            if (!c) continue;
            const p1 = map.project([y1, x0], coords.z);
            const p2 = map.project([y0, x1], coords.z);
            const px = p1.x - coords.x * size.x;
            const py = p1.y - coords.y * size.y;
            const w = Math.max(1, p2.x - p1.x + 1);
            const h = Math.max(1, p2.y - p1.y + 1);
            ctx.fillStyle = c;
            ctx.fillRect(Math.round(px), Math.round(py), Math.ceil(w), Math.ceil(h));
          }
        }
        return tile;
      }
    });
    return new Grid({ tileSize: opts.tileSize, opacity: opts.opacity, pane: "overlayPane" });
  }

  window.CovjsonRaster = CovjsonRaster;
  window.createRasterGridLayer = createRasterGridLayer;
  window.bioclimaColorRamp = colorRamp;
})();

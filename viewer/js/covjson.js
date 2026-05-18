/*
 * Minimal CoverageJSON utilities for the BioClima viewer.
 * Supports the compact axis form {start, stop, num} produced by our pipeline.
 */
(function () {
  function axisValues(axis) {
    if (axis.values && axis.values.length) return axis.values;
    const out = new Array(axis.num);
    const step = (axis.stop - axis.start) / (axis.num - 1);
    for (let i = 0; i < axis.num; i++) out[i] = axis.start + i * step;
    return out;
  }

  class CovjsonRaster {
    constructor(cov, paramKey) {
      this.cov = cov;
      this.availableParams = Object.keys(cov.parameters || {});
      this.setParameter(paramKey || this.availableParams[0]);

      const ax = cov.domain.axes;
      this.x = axisValues(ax.x);
      this.y = axisValues(ax.y);
      this.t = ax.t ? ax.t.values || [] : null;
      this.hasTime = Array.isArray(this.t) && this.t.length > 0;
    }

    /** Switch which parameter is exposed for valueAt / toCanvasLayer. */
    setParameter(key) {
      if (!this.cov.parameters || !this.cov.parameters[key]) {
        throw new Error(`Unknown parameter '${key}' (available: ${this.availableParams.join(', ')})`);
      }
      this.paramKey = key;
      this.param    = this.cov.parameters[key];
      this.range    = this.cov.ranges[key];

      this.shape   = this.range.shape;             // e.g. [T,Y,X] or [Y,X]
      this.axes    = this.range.axisNames;
      this.nodata  = this.range.nodata;
      this.values  = this.range.values;            // flat array
    }

    /** Return value at time index t, geo (lon, lat). NaN if missing. */
    valueAt(tIndex, lon, lat) {
      const iy = nearestIndex(this.y, lat);
      const ix = nearestIndex(this.x, lon);
      if (iy < 0 || ix < 0) return NaN;

      let flatIndex;
      if (this.axes[0] === "t") {
        flatIndex = tIndex * this.y.length * this.x.length + iy * this.x.length + ix;
      } else {
        flatIndex = iy * this.x.length + ix;
      }
      const v = this.values[flatIndex];
      return v === this.nodata ? NaN : v;
    }

    /** Iterate all valid (lon, lat, value) at the given time index. */
    forEachCell(tIndex, cb) {
      const Y = this.y.length, X = this.x.length;
      const offset = this.axes[0] === "t" ? tIndex * Y * X : 0;
      for (let j = 0; j < Y; j++) {
        for (let i = 0; i < X; i++) {
          const v = this.values[offset + j * X + i];
          if (v === this.nodata) continue;
          cb(this.x[i], this.y[j], v, i, j);
        }
      }
    }

    bounds() {
      return [
        [Math.min(...this.y), Math.min(...this.x)],
        [Math.max(...this.y), Math.max(...this.x)]
      ];
    }

    /** Build a canvas overlay for time index `tIndex` and return a Leaflet layer. */
    toCanvasLayer(tIndex, colorScale, valueRange) {
      const Y = this.y.length, X = this.x.length;
      const canvas = document.createElement("canvas");
      canvas.width  = X;
      canvas.height = Y;
      const ctx = canvas.getContext("2d");
      const img = ctx.createImageData(X, Y);

      const yFlipped = this.y[0] > this.y[this.y.length - 1]; // covjson y often descends
      const offset = this.axes[0] === "t" ? tIndex * Y * X : 0;

      for (let j = 0; j < Y; j++) {
        for (let i = 0; i < X; i++) {
          const v = this.values[offset + j * X + i];
          const out = ((yFlipped ? j : (Y - 1 - j)) * X + i) * 4;
          if (v === this.nodata || isNaN(v)) {
            img.data[out + 3] = 0;
            continue;
          }
          const [r, g, b] = colorScale(v).rgb();
          img.data[out]     = r;
          img.data[out + 1] = g;
          img.data[out + 2] = b;
          img.data[out + 3] = 180;
        }
      }
      ctx.putImageData(img, 0, 0);

      const south = Math.min(this.y[0], this.y[this.y.length - 1]);
      const north = Math.max(this.y[0], this.y[this.y.length - 1]);
      const west  = Math.min(this.x[0], this.x[this.x.length - 1]);
      const east  = Math.max(this.x[0], this.x[this.x.length - 1]);

      // Adjust by half a cell so the raster aligns on cell centres.
      const dx = Math.abs(this.x[1] - this.x[0]) / 2;
      const dy = Math.abs(this.y[1] - this.y[0]) / 2;

      return L.imageOverlay(canvas.toDataURL(), [[south - dy, west - dx], [north + dy, east + dx]], {
        opacity: 0.85,
        interactive: false
      });
    }
  }

  function nearestIndex(arr, v) {
    let best = -1, bestDist = Infinity;
    for (let i = 0; i < arr.length; i++) {
      const d = Math.abs(arr[i] - v);
      if (d < bestDist) { best = i; bestDist = d; }
    }
    return best;
  }

  window.CovjsonRaster = CovjsonRaster;
})();

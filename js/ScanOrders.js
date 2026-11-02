/* Scan priorities adapted from George Miller's Java scanorder package.
 * Copyright © 2025 George Miller. MIT licence: ../SCANORDER-LICENSE.txt.
 * Stable row-major ties match Java's stable Collections.sort.
 */
(function (root) {
  "use strict";
  function priority(kind, x, y, w, h, o = {}) {
    const dx = x - (w - 0.75) * 0.5,
      dy = y - (h - 0.875) * 0.5;
    const ix = x - (w >> 1),
      iy = y - (h >> 1);
    const a = Math.atan2(dy, -dx) / (2 * Math.PI),
      r = Math.hypot(dx, dy);
    switch (kind) {
      case "radial":
        return dx * dx + dy * dy;
      case "diamond":
        return (
          Math.abs(y - h / 2) +
          Math.abs(x - w / 2) +
          (x > w / 2 ? (y <= h / 2 ? 0.1 : 0.2) : y > h / 2 ? 0.3 : 0.4)
        );
      case "angular":
        return Math.abs(
          (((Math.atan2(y - h * 0.5, -(x - w * 0.5)) / (2 * Math.PI) + 0.5) *
            (o.bands || 6)) %
            1) -
            0.5,
        );
      case "flower":
        return r * (Math.cos(Math.atan2(dy, -dx) * (o.petals || 5)) + 2);
      case "spiral": {
        const thickness = o.thickness || 10;
        return Math.trunc(a + r / thickness) * thickness - a;
      }
      case "square":
        if (ix > iy && ix < -iy) return 4 * iy * iy + 7 * iy + 3 + ix;
        if (ix > iy && ix >= -iy) return 4 * ix * ix + 3 * ix + 1 + iy;
        if (ix < -iy) return 4 * ix * ix + ix - 1 - iy;
        return 4 * iy * iy + 5 * iy + 1 - ix;
      case "xor":
        return Math.abs(ix) ^ Math.abs(iy);
      case "pythagoras":
        return x & y;
      case "triangle": {
        const q = Math.abs(ix) ^ Math.abs(iy);
        return (
          q +
          (ix > iy && ix < -iy
            ? 100000
            : ix > iy && ix >= -iy
              ? 200000
              : ix < -iy
                ? 400000
                : 300000)
        );
      }
      default:
        return y * w + x;
    }
  }
  function order(w, h, kind, o = {}) {
    const n = w * h,
      indices = Uint32Array.from({ length: n }, (_, i) => i);
    if (kind === "simple") return indices;
    const keys = new Float64Array(n);
    for (let i = 0; i < n; i++)
      keys[i] = priority(kind, i % w, Math.floor(i / w), w, h, o);
    indices.sort((a, b) => keys[a] - keys[b] || a - b);
    return indices;
  }
  const api = { priority, order };
  root.ScanOrders = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof self === "undefined" ? globalThis : self);

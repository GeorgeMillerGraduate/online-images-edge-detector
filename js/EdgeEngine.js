/* Educational edge filters. All boundaries use edge replication unless noted. */
(function (root) {
  "use strict";
  function greyscale(rgba) {
    const out = new Float32Array(rgba.length / 4);
    for (let i = 0; i < out.length; i++) {
      const a = rgba[i * 4 + 3] / 255;
      out[i] =
        (0.2126 * rgba[i * 4] +
          0.7152 * rgba[i * 4 + 1] +
          0.0722 * rgba[i * 4 + 2]) *
          a +
        255 * (1 - a);
    }
    return out;
  }
  function blur(data, w, h, sigma) {
    if (sigma <= 0) return new Float32Array(data);
    const r = Math.ceil(sigma * 3),
      k = new Float64Array(r * 2 + 1);
    let sum = 0;
    for (let i = -r; i <= r; i++) {
      k[i + r] = Math.exp((-i * i) / (2 * sigma * sigma));
      sum += k[i + r];
    }
    for (let i = 0; i < k.length; i++) k[i] /= sum;
    const tmp = new Float32Array(data.length),
      out = new Float32Array(data.length);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let v = 0;
        for (let i = -r; i <= r; i++)
          v += data[y * w + Math.max(0, Math.min(w - 1, x + i))] * k[i + r];
        tmp[y * w + x] = v;
      }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let v = 0;
        for (let i = -r; i <= r; i++)
          v += tmp[Math.max(0, Math.min(h - 1, y + i)) * w + x] * k[i + r];
        out[y * w + x] = v;
      }
    return out;
  }
  function sobel(data, w, h) {
    const mag = new Float32Array(w * h),
      dir = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x,
          a = data[i - w - 1],
          b = data[i - w],
          c = data[i - w + 1],
          d = data[i - 1],
          f = data[i + 1],
          g = data[i + w - 1],
          j = data[i + w],
          k = data[i + w + 1];
        const gx = -a + c - 2 * d + 2 * f - g + k,
          gy = -a - 2 * b - c + g + 2 * j + k;
        mag[i] = Math.min(255, Math.hypot(gx, gy) / 4);
        const angle = ((Math.atan2(gy, gx) * 180) / Math.PI + 180) % 180;
        dir[i] =
          angle < 22.5 || angle >= 157.5
            ? 0
            : angle < 67.5
              ? 1
              : angle < 112.5
                ? 2
                : 3;
      }
    return { mag, dir };
  }
  function suppress(mag, dir, w, h) {
    const out = new Float32Array(mag.length);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x,
          delta = [1, w + 1, w, w - 1][dir[i]];
        if (mag[i] >= mag[i - delta] && mag[i] > mag[i + delta])
          out[i] = mag[i];
      }
    return out;
  }
  function hysteresis(mag, w, h, low, high) {
    const out = new Uint8Array(mag.length),
      queue = new Uint32Array(mag.length);
    let head = 0,
      tail = 0;
    for (let i = 0; i < mag.length; i++)
      if (mag[i] >= high) {
        out[i] = 255;
        queue[tail++] = i;
      }
    while (head < tail) {
      const i = queue[head++],
        x = i % w,
        y = Math.floor(i / w);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx,
            yy = y + dy;
          if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
          const j = yy * w + xx;
          if (!out[j] && mag[j] >= low) {
            out[j] = 255;
            queue[tail++] = j;
          }
        }
    }
    return out;
  }
  // Uniform circular centre minus a concentric annulus. Row prefix sums avoid a
  // quadratic kernel loop. Truncated edge regions are normalised by their area.
  function centreSurround(data, w, h, inner, outer) {
    const stride = w + 1,
      prefix = new Float64Array(stride * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        prefix[y * stride + x + 1] = prefix[y * stride + x] + data[y * w + x];
    const spans = (r) =>
      Array.from({ length: 2 * r + 1 }, (_, i) => ({
        dy: i - r,
        half: Math.floor(Math.sqrt(r * r - (i - r) ** 2)),
      }));
    const inside = spans(inner),
      outside = spans(outer),
      out = new Float32Array(w * h);
    function disk(x, y, rows) {
      let sum = 0,
        count = 0;
      for (const row of rows) {
        const yy = y + row.dy;
        if (yy < 0 || yy >= h) continue;
        const lo = Math.max(0, x - row.half),
          hi = Math.min(w - 1, x + row.half);
        sum += prefix[yy * stride + hi + 1] - prefix[yy * stride + lo];
        count += hi - lo + 1;
      }
      return [sum, count];
    }
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const [a, n] = disk(x, y, inside),
          [b, m] = disk(x, y, outside);
        out[y * w + x] = m > n ? a / n - (b - a) / (m - n) : 0;
      }
    return out;
  }
  function process(rgba, w, h, o) {
    const gray = greyscale(rgba),
      smooth = blur(gray, w, h, o.sigma),
      threshold = o.threshold;
    let values;
    if (o.method === "centre") {
      const signed = centreSurround(smooth, w, h, o.inner, o.outer);
      values = new Uint8Array(gray.length);
      for (let i = 0; i < values.length; i++) {
        let v =
          o.polarity === "on"
            ? Math.max(0, signed[i])
            : o.polarity === "off"
              ? Math.max(0, -signed[i])
              : Math.abs(signed[i]);
        values[i] = v >= threshold ? Math.min(255, Math.round(v * o.gain)) : 0;
      }
    } else {
      const { mag, dir } = sobel(smooth, w, h);
      if (o.method === "canny")
        values = hysteresis(
          suppress(mag, dir, w, h),
          w,
          h,
          Math.min(o.low, o.high),
          Math.max(o.low, o.high),
        );
      else {
        values = new Uint8Array(gray.length);
        for (let i = 0; i < values.length; i++)
          values[i] =
            mag[i] >= threshold
              ? Math.min(255, Math.round(mag[i] * o.gain))
              : 0;
      }
    }
    return values;
  }
  const api = {
    greyscale,
    blur,
    sobel,
    suppress,
    hysteresis,
    centreSurround,
    process,
  };
  root.EdgeEngine = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof self === "undefined" ? globalThis : self);

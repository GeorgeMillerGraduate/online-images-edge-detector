const assert = require("node:assert/strict");
const E = require("../js/EdgeEngine.js"),
  S = require("../js/ScanOrders.js");
const w = 41,
  h = 35,
  uniform = new Float32Array(w * h).fill(120);
for (const v of E.centreSurround(uniform, w, h, 3, 9))
  assert.ok(Math.abs(v) < 1e-5);
assert.ok(E.sobel(uniform, w, h).mag.every((v) => v === 0));
const impulse = new Float32Array(w * h);
impulse[17 * w + 20] = 255;
const signed = E.centreSurround(impulse, w, h, 2, 6);
assert.ok(signed[17 * w + 20] > 0);
assert.ok(signed[17 * w + 25] < 0);
// Independent brute-force disk/annulus oracle at borders and in the interior.
const data = Float32Array.from({ length: w * h }, (_, i) => (i * 31) % 251);
const out = E.centreSurround(data, w, h, 3, 7);
for (const [x, y] of [
  [0, 0],
  [40, 34],
  [20, 17],
  [2, 15],
  [39, 2],
]) {
  let centre = 0,
    cn = 0,
    ring = 0,
    rn = 0;
  for (let dy = -7; dy <= 7; dy++)
    for (let dx = -7; dx <= 7; dx++) {
      if (
        x + dx < 0 ||
        x + dx >= w ||
        y + dy < 0 ||
        y + dy >= h ||
        dx * dx + dy * dy > 49
      )
        continue;
      if (dx * dx + dy * dy <= 9) {
        centre += data[(y + dy) * w + x + dx];
        cn++;
      } else {
        ring += data[(y + dy) * w + x + dx];
        rn++;
      }
    }
  assert.ok(Math.abs(out[y * w + x] - (centre / cn - ring / rn)) < 1e-4);
}
const step = Float32Array.from({ length: w * h }, (_, i) =>
    i % w >= 20 ? 255 : 0,
  ),
  grad = E.sobel(step, w, h);
assert.equal(grad.mag[17 * w + 19], 255);
const thin = E.suppress(grad.mag, grad.dir, w, h);
assert.equal(
  Array.from(thin.slice(17 * w, 18 * w)).filter((v) => v > 0).length,
  1,
);
const mag = new Float32Array(10 * 5);
mag[2 * 10 + 2] = 100;
mag[2 * 10 + 3] = 30;
mag[2 * 10 + 4] = 30;
mag[8] = 30;
const connected = E.hysteresis(mag, 10, 5, 20, 60);
assert.equal(connected[2 * 10 + 4], 255);
assert.equal(connected[8], 0);
for (const v of E.blur(uniform, w, h, 1.2)) assert.ok(Math.abs(v - 120) < 1e-4);
const kinds = [
  "simple",
  "radial",
  "spiral",
  "diamond",
  "angular",
  "flower",
  "square",
  "triangle",
  "xor",
  "pythagoras",
];
for (const kind of kinds)
  for (const [W, H] of [
    [17, 12],
    [32, 21],
  ]) {
    const order = S.order(W, H, kind);
    assert.equal(new Set(order).size, W * H);
    let last = -Infinity,
      lastIndex = -1;
    for (const i of order) {
      const p = S.priority(kind, i % W, Math.floor(i / W), W, H);
      assert.ok(p >= last);
      if (p === last) assert.ok(i > lastIndex);
      last = p;
      lastIndex = i;
    }
    // Full and reverse reveal must exactly preserve the original buffer.
    const src = Uint32Array.from({ length: W * H }, (_, i) => i + 100),
      dst = new Uint32Array(W * H).fill(777),
      display = src.slice();
    for (const i of order) display[i] = dst[i];
    assert.deepEqual(display, dst);
    for (const i of order) display[i] = src[i];
    assert.deepEqual(display, src);
  }
assert.equal(S.priority("pythagoras", 5, 3, 17, 12), 5 & 3);
assert.equal(
  S.priority("xor", 1, 2, 17, 12),
  Math.abs(1 - 8) ^ Math.abs(2 - 6),
);
const rgba = new Uint8ClampedArray(w * h * 4);
for (let i = 0; i < w * h; i++) {
  rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = step[i];
  rgba[i * 4 + 3] = 255;
}
for (const method of ["sobel", "canny", "centre"]) {
  const result = E.process(rgba, w, h, {
    method,
    sigma: 0.8,
    threshold: 10,
    inner: 3,
    outer: 7,
    polarity: "both",
    gain: 3,
    low: 12,
    high: 30,
  });
  assert.ok(result.some((v) => v > 0));
  assert.equal(result.length, w * h);
}
console.log(
  "Passed: uniform/impulse/step images, circular filter border oracle, Gaussian invariance, Sobel magnitude, Canny thinning and connectivity, all 10 scan permutations/stable priorities, reversible reveal and all three end-to-end filters.",
);

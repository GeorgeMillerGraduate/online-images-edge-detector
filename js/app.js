/* One fixed canvas. Original and processed pixels share exactly the same coordinates. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    canvas = $("imageCanvas"),
    ctx = canvas.getContext("2d");
  const names = { sobel: "Sobel", canny: "Canny", centre: "Centre–surround" };
  let method = "centre",
    palette = "ivory",
    source = null,
    edgeValues = null,
    order = null,
    working = null,
    original32 = null,
    result32 = null,
    working32 = null;
  let revealed = 0,
    fraction = 0,
    running = false,
    busy = true,
    requestId = 0,
    imageTicket = 0,
    jobStart = 0,
    lastTime = 0,
    debounce;
  let worker;
  const actions = ["play", "replay", "original", "edges", "progress", "save"];
  function message(text, error = false) {
    $("status").textContent = text;
    $("status").classList.toggle("error-note", error);
  }
  function pause() {
    running = false;
    $("pause").disabled = true;
  }
  function enabled(yes) {
    for (const id of actions) $(id).disabled = !yes;
  }
  function numeric(id, fallback) {
    const el = $(id),
      n = Number(el.value),
      v =
        el.value.trim() && Number.isFinite(n)
          ? Math.max(Number(el.min), Math.min(Number(el.max), n))
          : fallback;
    el.value = String(v);
    return v;
  }
  function options() {
    const inner = Math.round(numeric("inner", 3));
    let outer = Math.round(numeric("outer", 9));
    if (outer <= inner) {
      outer = inner + 1;
      $("outer").value = String(outer);
      $("outerNumber").value = String(outer);
    }
    let low = Math.round(numeric("low", 12)),
      high = Math.round(numeric("high", 30));
    if (low > high) {
      high = low;
      $("high").value = String(high);
      $("highNumber").value = String(high);
    }
    $("centreCircle").setAttribute("r", String((68 * inner) / outer));
    return {
      method,
      inner,
      outer,
      low,
      high,
      sigma: numeric("sigma", 0.8),
      threshold: numeric("threshold", 10),
      gain: numeric("gain", 3),
      polarity: $("polarity").value,
    };
  }
  function scanOptions() {
    const kind = $("scan").value;
    const value = Math.round(numeric("scanParameter", 6));
    return {
      kind,
      bands: kind === "angular" ? value : 6,
      petals: kind === "flower" ? value : 5,
      thickness: kind === "spiral" ? value : 10,
    };
  }
  function createWorker() {
    worker = new Worker("js/worker.js?v=edge-1");
    worker.onmessage = ({ data }) => {
      if (data.id !== requestId) return;
      busy = false;
      $("loading").hidden = true;
      if (data.error) {
        enabled(false);
        message("Processing failed: " + data.error, true);
        return;
      }
      edgeValues = data.edges;
      order = data.order;
      colourise();
      working = new ImageData(
        new Uint8ClampedArray(source.data),
        source.width,
        source.height,
      );
      working32 = new Uint32Array(working.data.buffer);
      revealed = 0;
      fraction = 0;
      ctx.putImageData(working, 0, 0);
      setFraction(0);
      enabled(true);
      $("timing").textContent =
        `Prepared in ${Math.round(performance.now() - jobStart)} ms`;
      let count = 0;
      for (const v of edgeValues) if (v) count++;
      $("edgeCount").textContent =
        `${((count / edgeValues.length) * 100).toFixed(1)}% nonzero response`;
      message(
        "Ready. Play the transition, drag the progress slider, or show the full edge map.",
      );
    };
    worker.onerror = () => {
      busy = false;
      $("loading").hidden = true;
      enabled(false);
      message(
        "The processing worker could not start. Serve this app over HTTP(S), and check that all files were extracted.",
        true,
      );
    };
  }
  function prepare() {
    clearTimeout(debounce);
    if (!source) return;
    pause();
    busy = true;
    enabled(false);
    $("loading").hidden = false;
    $("loading").textContent = "Computing filter & scan order…";
    message(
      "Preparing the edge map. The reveal starts from the original photo.",
    );
    jobStart = performance.now();
    requestId++;
    worker.postMessage({
      id: requestId,
      rgba: source.data,
      width: source.width,
      height: source.height,
      options: options(),
      scan: scanOptions(),
    });
  }
  function schedule() {
    pause();
    busy = true;
    enabled(false);
    clearTimeout(debounce);
    debounce = setTimeout(prepare, 180);
  }
  function colourise() {
    const p = {
      ivory: [
        [20, 44, 57],
        [243, 232, 207],
      ],
      ink: [
        [247, 240, 227],
        [36, 62, 75],
      ],
      copper: [
        [247, 240, 227],
        [147, 77, 39],
      ],
    }[palette];
    const bytes = new Uint8ClampedArray(edgeValues.length * 4);
    for (let i = 0; i < edgeValues.length; i++) {
      const t = edgeValues[i] / 255;
      for (let c = 0; c < 3; c++)
        bytes[i * 4 + c] = p[0][c] + (p[1][c] - p[0][c]) * t;
      bytes[i * 4 + 3] = 255;
    }
    result32 = new Uint32Array(bytes.buffer);
  }
  function setFraction(value) {
    if (!working || !order) return;
    fraction = Math.min(1, Math.max(0, value));
    const n = Math.min(order.length, Math.floor(fraction * order.length));
    if (n > revealed)
      for (let i = revealed; i < n; i++)
        working32[order[i]] = result32[order[i]];
    else
      for (let i = n; i < revealed; i++)
        working32[order[i]] = original32[order[i]];
    revealed = n;
    ctx.putImageData(working, 0, 0);
    $("progress").value = String(Math.round(fraction * 1000));
    $("percent").textContent = `${Math.round(fraction * 100)}%`;
    $("revealCaption").textContent =
      fraction === 0
        ? "Original · 0%"
        : fraction === 1
          ? "Edge map · 100%"
          : `Revealing ${Math.round(fraction * 100)}%`;
  }
  function start(restart = false) {
    if (busy || !working) return;
    if (restart || fraction >= 1) setFraction(0);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pause();
      setFraction(1);
      message(
        "Full result shown because reduced motion is enabled. You can still scrub manually.",
      );
      return;
    }
    running = true;
    lastTime = performance.now();
    $("pause").disabled = false;
    message(
      "Revealing the computed map using " +
        $("scan").selectedOptions[0].textContent +
        ".",
    );
  }
  async function loadImage(url, label, revoke = false) {
    const ticket = ++imageTicket;
    requestId++;
    pause();
    busy = true;
    enabled(false);
    $("loading").hidden = false;
    $("loading").textContent = "Loading photograph…";
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (ticket !== imageTicket) return;
      if (image.naturalWidth * image.naturalHeight > 40000000)
        throw new Error("Choose an image below 40 megapixels.");
      const scale = Math.min(
          1,
          960 / Math.max(image.naturalWidth, image.naturalHeight),
        ),
        w = Math.max(1, Math.round(image.naturalWidth * scale)),
        h = Math.max(1, Math.round(image.naturalHeight * scale));
      const temp = document.createElement("canvas");
      temp.width = w;
      temp.height = h;
      const c = temp.getContext("2d");
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, w, h);
      c.drawImage(image, 0, 0, w, h);
      source = c.getImageData(0, 0, w, h);
      original32 = new Uint32Array(source.data.buffer);
      canvas.width = w;
      canvas.height = h;
      ctx.putImageData(source, 0, 0);
      working = null;
      edgeValues = null;
      order = null;
      fraction = 0;
      revealed = 0;
      $("fileName").textContent = label;
      $("dimensions").textContent =
        `${w} × ${h} working pixels${scale < 1 ? " · resized to fit" : ""}`;
      prepare();
    } catch (error) {
      if (ticket === imageTicket) {
        busy = false;
        $("loading").hidden = true;
        enabled(Boolean(working));
        message("Could not load the image. " + error.message, true);
      }
    } finally {
      if (revoke) URL.revokeObjectURL(url);
    }
  }
  function upload(file) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      message("Please choose a PNG, JPG or WebP image.", true);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      message("Please choose an image smaller than 20 MB.", true);
      return;
    }
    loadImage(URL.createObjectURL(file), file.name, true);
  }
  function methodUI() {
    for (const button of document.querySelectorAll("[data-method]"))
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.method === method),
      );
    $("centreFields").hidden = method !== "centre";
    $("retinaDiagram").hidden = method !== "centre";
    $("cannyFields").hidden = method !== "canny";
    $("thresholdField").hidden = method === "canny";
    $("gainField").hidden = method === "canny";
    $("methodCaption").textContent = names[method];
    $("methodNote").textContent = {
      centre:
        "A small central disc is compared with its surrounding ring: a simplified retina-inspired spatial contrast operator.",
      sobel:
        "Sobel estimates horizontal and vertical brightness change. Magnitude reveals boundaries of every orientation.",
      canny:
        "Canny smooths the image, thins gradient peaks and links weak edges that connect to strong ones.",
    }[method];
  }
  for (const button of document.querySelectorAll("[data-method]"))
    button.onclick = () => {
      method = button.dataset.method;
      methodUI();
      prepare();
    };
  $("upload").onclick = () => $("file").click();
  $("file").onchange = () => {
    upload($("file").files[0]);
    $("file").value = "";
  };
  $("sample").onclick = () =>
    loadImage(
      "images/stone-bridge.webp",
      "Stone bridge · generated sample photo",
    );
  $("dropZone").ondragover = (e) => {
    e.preventDefault();
    $("dropZone").classList.add("dragover");
  };
  $("dropZone").ondragleave = () => $("dropZone").classList.remove("dragover");
  $("dropZone").ondrop = (e) => {
    e.preventDefault();
    $("dropZone").classList.remove("dragover");
    upload(e.dataTransfer.files[0]);
  };
  for (const id of [
    "inner",
    "outer",
    "threshold",
    "low",
    "high",
    "sigma",
    "gain",
  ]) {
    const range = $(id),
      number = $(id + "Number");
    range.oninput = () => {
      number.value = range.value;
      options();
      schedule();
    };
    number.oninput = () => {
      const n = Number(number.value);
      if (
        number.value.trim() &&
        Number.isFinite(n) &&
        n >= Number(range.min) &&
        n <= Number(range.max)
      ) {
        range.value = String(n);
        options();
        schedule();
      }
    };
    number.onchange = () => {
      const n = Number(number.value);
      range.value = String(
        Number.isFinite(n) && number.value.trim()
          ? Math.max(Number(range.min), Math.min(Number(range.max), n))
          : Number(range.value),
      );
      number.value = range.value;
      options();
      schedule();
    };
  }
  $("polarity").onchange = prepare;
  $("scan").onchange = () => {
    const kind = $("scan").value;
    const fields = {
      angular: ["Bands", 1, 16, 6],
      flower: ["Petals", 2, 12, 5],
      spiral: ["Spiral thickness", 2, 80, 10],
    };
    $("scanParameterField").hidden = !fields[kind];
    if (fields[kind]) {
      const [label, min, max, v] = fields[kind];
      $("scanParameterLabel").textContent = label;
      $("scanParameter").min = String(min);
      $("scanParameter").max = String(max);
      $("scanParameter").value = String(v);
    }
    prepare();
  };
  $("scanParameter").onchange = prepare;
  $("duration").oninput = () => {
    $("durationValue").textContent = $("duration").value + " s";
  };
  for (const button of document.querySelectorAll("[data-palette]"))
    button.onclick = () => {
      palette = button.dataset.palette;
      for (const b of document.querySelectorAll("[data-palette]"))
        b.setAttribute("aria-pressed", String(b === button));
      if (edgeValues && !busy) {
        colourise();
        for (let i = 0; i < revealed; i++)
          working32[order[i]] = result32[order[i]];
        ctx.putImageData(working, 0, 0);
      }
    };
  $("play").onclick = () => start();
  $("pause").onclick = () => {
    pause();
    message("Paused. Resume or scrub to inspect the reveal.");
  };
  $("replay").onclick = () => start(true);
  $("original").onclick = () => {
    pause();
    setFraction(0);
    message("Original photograph.");
  };
  $("edges").onclick = () => {
    pause();
    setFraction(1);
    message("Complete computed edge map.");
  };
  $("progress").oninput = () => {
    pause();
    setFraction(Number($("progress").value) / 1000);
  };
  $("save").onclick = () => {
    if (!result32 || busy) return;
    const out = document.createElement("canvas");
    out.width = source.width;
    out.height = source.height;
    out
      .getContext("2d")
      .putImageData(
        new ImageData(
          new Uint8ClampedArray(result32.buffer.slice(0)),
          source.width,
          source.height,
        ),
        0,
        0,
      );
    out.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = `jenga-code-${method}-edges.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
    message(
      "Saved the complete edge map, independent of the current reveal progress.",
    );
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running) {
      pause();
      message("Paused while the tab is hidden.");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (
      /INPUT|SELECT|TEXTAREA|BUTTON|SUMMARY/.test(
        document.activeElement.tagName,
      )
    )
      return;
    if (e.code === "Space") {
      e.preventDefault();
      if (running) $("pause").click();
      else start();
    }
  });
  function frame(time) {
    if (running && !busy) {
      const delta = Math.min(100, time - lastTime);
      setFraction(fraction + delta / (Number($("duration").value) * 1000));
      if (fraction >= 1) {
        pause();
        message("Reveal complete. Replay it or try a different scan order.");
      }
    }
    lastTime = time;
    requestAnimationFrame(frame);
  }
  try {
    createWorker();
    methodUI();
    loadImage(
      "images/stone-bridge.webp",
      "Stone bridge · generated sample photo",
    );
    requestAnimationFrame(frame);
  } catch {
    message(
      "Open this app through an HTTP(S) server so the processing worker can load.",
      true,
    );
    $("loading").hidden = true;
  }
})();

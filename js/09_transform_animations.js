// AventurIA Beta 0.2.0 — Animation Tracks Refactor
// Modelo robusto: clip -> tracks por propiedad -> keys independientes -> sampler común para preview y runtime.

const TRANSFORM_TRACKS = ["x", "y", "rotation", "scale"];

function defaultTransformValue(obj, prop) {
  if (!obj) return prop === "scale" ? 1 : 0;
  if (prop === "x") return Number(obj.x || 0);
  if (prop === "y") return Number(obj.y || 0);
  if (prop === "rotation") return Number(obj.rotation || 0);
  if (prop === "scale") return Number(obj.scale || 1) || 1;
  return 0;
}

function normalizeTrackKey(key, fallbackValue = 0) {
  return {
    time: Math.max(0, Number(key?.time) || 0),
    value: Number(key?.value ?? fallbackValue),
    easing: key?.easing || "linear"
  };
}

function normalizeTrack(obj, clip, prop) {
  clip.tracks ??= {};
  const fallback = defaultTransformValue(obj, prop);

  // Migración de formatos antiguos o incompletos.
  if (!clip.tracks[prop]) {
    clip.tracks[prop] = { keys: [] };
  }

  if (Array.isArray(clip.tracks[prop])) {
    clip.tracks[prop] = { keys: clip.tracks[prop] };
  }

  clip.tracks[prop].keys ??= [];

  let keys = clip.tracks[prop].keys
    .map(k => normalizeTrackKey(k, fallback))
    .sort((a, b) => a.time - b.time);

  // Fusionar keys duplicados en el mismo canal/tiempo. El último valor gana.
  const merged = [];
  keys.forEach(k => {
    const prev = merged[merged.length - 1];
    if (prev && Math.abs(prev.time - k.time) <= 0.5) {
      prev.time = k.time;
      prev.value = k.value;
      prev.easing = k.easing || prev.easing || "linear";
    } else {
      merged.push(k);
    }
  });

  clip.tracks[prop].keys = merged;
  return clip.tracks[prop];
}

function migrateLegacyKeyframesToTracks(obj, clip) {
  clip.tracks ??= {};

  if (Array.isArray(clip.keyframes) && clip.keyframes.length) {
    TRANSFORM_TRACKS.forEach(prop => {
      if (clip.tracks[prop]?.keys?.length) return;
      clip.tracks[prop] = {
        keys: clip.keyframes
          .filter(k => k && k[prop] !== undefined)
          .map(k => ({
            time: Number(k.time) || 0,
            value: Number(k[prop]),
            easing: k.easing || "linear"
          }))
      };
    });
  }
}


// Beta 0.3.0 — Path animation helpers

function normalizePathData(obj, clip) {
  if (!clip) return null;
  clip.path ??= {};
  const path = clip.path;

  path.enabled = !!path.enabled;
  path.closed = !!path.closed;
  path.orientToPath = !!path.orientToPath;
  path.rotationOffset = Number(path.rotationOffset || 0);
  path.cycleDuration = Math.max(1, Number(path.cycleDuration || clip.duration || 1000));

  path.points ??= [];
  path.points = path.points
    .filter(p => p && isFinite(Number(p.x)) && isFinite(Number(p.y)))
    .map(p => ({ id: p.id || uid(), x: Number(p.x), y: Number(p.y) }));

  if (!path.points.length && obj) {
    const bx = defaultTransformValue(obj, "x");
    const by = defaultTransformValue(obj, "y");
    path.points.push({ id: uid(), x: bx, y: by });
    path.points.push({ id: uid(), x: bx + 220, y: by });
  }

  path.progressKeys ??= [];
  path.progressKeys = path.progressKeys
    .map(k => ({
      time: Math.max(0, Number(k.time) || 0),
      value: Math.max(0, Math.min(1, Number(k.value ?? 0))),
      easing: k.easing || "linear"
    }))
    .sort((a, b) => a.time - b.time);

  if (!path.progressKeys.length) {
    path.progressKeys.push({ time: 0, value: 0, easing: "linear" });
    path.progressKeys.push({ time: path.cycleDuration || clip.duration || 1000, value: 1, easing: "linear" });
  }

  const merged = [];
  path.progressKeys.forEach(k => {
    const prev = merged[merged.length - 1];
    if (prev && Math.abs(prev.time - k.time) <= 0.5) {
      prev.time = k.time;
      prev.value = k.value;
      prev.easing = k.easing || prev.easing || "linear";
    } else {
      merged.push(k);
    }
  });
  path.progressKeys = merged;

  return path;
}

function pathSegmentLengths(points, closed = false) {
  const segs = [];
  if (!points || points.length < 2) return { segs, total: 0 };
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len });
  }
  if (closed && points.length > 2) {
    const a = points[points.length - 1], b = points[0];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len });
  }
  const total = segs.reduce((s, seg) => s + seg.len, 0);
  return { segs, total };
}

function samplePathPoint(path, progress = 0) {
  const points = path?.points || [];
  if (!points.length) return { x: 0, y: 0, angle: 0 };
  if (points.length === 1) return { x: points[0].x, y: points[0].y, angle: 0 };

  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  const { segs, total } = pathSegmentLengths(points, !!path.closed);
  if (!segs.length || total <= 0) return { x: points[0].x, y: points[0].y, angle: 0 };

  let target = p * total;
  for (const seg of segs) {
    if (target <= seg.len || seg === segs[segs.length - 1]) {
      const local = seg.len <= 0 ? 0 : target / seg.len;
      return {
        x: lerp(seg.a.x, seg.b.x, local),
        y: lerp(seg.a.y, seg.b.y, local),
        angle: Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x) * 180 / Math.PI
      };
    }
    target -= seg.len;
  }

  const last = segs[segs.length - 1];
  return { x: last.b.x, y: last.b.y, angle: Math.atan2(last.b.y - last.a.y, last.b.x - last.a.x) * 180 / Math.PI };
}

function samplePathProgress(path, timeMs, duration = 1000) {
  const track = { keys: path?.progressKeys || [] };
  return Math.max(0, Math.min(1, sampleTrack(track, timeMs, 0)));
}

function selectedPathPointIndex() {
  return Math.max(0, Number(state.selectedPathPointIndex || 0));
}

function selectedPathProgressKeyIndex() {
  return Math.max(0, Number(state.selectedPathProgressKeyIndex || 0));
}

function selectedPathData() {
  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  if (!obj || !clip) return null;
  return normalizePathData(obj, clip);
}

function setAnimationTab(tab = "transform") {
  state.selectedAnimationTab = tab === "path" ? "path" : "transform";
  const isPath = state.selectedAnimationTab === "path";
  $("transformAnimTabBtn")?.classList.toggle("active", !isPath);
  $("pathAnimTabBtn")?.classList.toggle("active", isPath);
  $("transformAnimPanel")?.classList.toggle("active", !isPath);
  $("pathAnimPanel")?.classList.toggle("active", isPath);
  renderPathEditor();
  renderStage();
  renderAnimationTimeline();
}

function upsertPathProgressKey(obj, clip, time, value, easing = "linear") {
  const path = normalizePathData(obj, clip);
  const t = Math.max(0, Math.min(animationTimelineDuration(clip), Number(time) || 0));
  const v = Math.max(0, Math.min(1, Number(value) || 0));
  let key = path.progressKeys.find(k => Math.abs(Number(k.time || 0) - t) <= 1);
  if (!key) {
    key = { time: t, value: v, easing: easing || "linear" };
    path.progressKeys.push(key);
  } else {
    key.time = t;
    key.value = v;
    key.easing = easing || key.easing || "linear";
  }
  normalizePathData(obj, clip);
  state.selectedPathProgressKeyIndex = path.progressKeys.findIndex(k => Math.abs(k.time - t) <= 1);
  return key;
}


function currentPathCycleDuration(obj = selectedAnimObject(), clip = selectedTransformClip()) {
  if (!obj || !clip) return 1000;
  const path = normalizePathData(obj, clip);
  const maxKeyTime = Math.max(0, ...(path.progressKeys || []).map(k => Number(k.time || 0)));
  return Math.max(1, Number(path.cycleDuration || 0) || Number(clip.duration || 0) || maxKeyTime || 1000);
}

function fitPathProgressToDuration(obj, clip, nextDuration) {
  if (!obj || !clip) return;
  const path = normalizePathData(obj, clip);
  const duration = Math.max(1, Number(nextDuration) || 1000);
  const oldDuration = currentPathCycleDuration(obj, clip);

  path.progressKeys = (path.progressKeys || []).map(k => ({
    time: Math.max(0, Math.min(duration, oldDuration > 0 ? Number(k.time || 0) / oldDuration * duration : Number(k.time || 0))),
    value: Math.max(0, Math.min(1, Number(k.value ?? 0))),
    easing: k.easing || "linear"
  }));

  // Garantizar un ciclo completo 0 → 100% a lo largo de la duración indicada.
  let first = path.progressKeys.find(k => Math.abs(k.time) <= 0.5);
  if (!first) {
    first = { time: 0, value: 0, easing: "linear" };
    path.progressKeys.push(first);
  }
  first.time = 0;
  first.value = 0;

  let last = path.progressKeys.find(k => Math.abs(Number(k.time || 0) - duration) <= 0.5 && k !== first);
  if (!last) {
    last = { time: duration, value: 1, easing: "linear" };
    path.progressKeys.push(last);
  }
  last.time = duration;
  last.value = 1;

  path.progressKeys.sort((a, b) => a.time - b.time);
  path.cycleDuration = duration;
  clip.duration = Math.max(Number(clip.duration || 0), duration);
  state.animationTimelineTime = Math.min(Number(state.animationTimelineTime || 0), duration);
  normalizeTransformClip(obj, clip);
}

function addPathPointAtScenePoint(p) {
  const path = selectedPathData();
  if (!path || !p) return;
  path.points.push({ id: uid(), x: p.x, y: p.y });
  path.enabled = true;
  state.selectedPathPointIndex = path.points.length - 1;
  if ($("pathEnabled")) $("pathEnabled").checked = true;
  renderPathEditor();
  renderStage();
  updateAnimationPreview();
}



// Beta 0.3.1 — visual path canvas inside Animation > Path

function pathCanvasSceneSize() {
  const project = state.project || {};
  const stage = project.stage || {};
  return {
    width: Math.max(1, Number(stage.width || 1280)),
    height: Math.max(1, Number(stage.height || 720))
  };
}

function pathCanvasPointFromEvent(e, cachedRect = null, cachedSize = null) {
  const canvas = $("pathSceneCanvas");
  if (!canvas && !cachedRect) return { x: 0, y: 0 };
  const rect = cachedRect || canvas.getBoundingClientRect();
  const size = cachedSize || pathCanvasSceneSize();
  const x = (e.clientX - rect.left) / Math.max(1, rect.width) * size.width;
  const y = (e.clientY - rect.top) / Math.max(1, rect.height) * size.height;
  return {
    x: Math.max(0, Math.min(size.width, x)),
    y: Math.max(0, Math.min(size.height, y))
  };
}

function pathCanvasPointsString(path) {
  return [...(path?.points || []), ...(path?.closed && path.points?.length > 2 ? [path.points[0]] : [])]
    .map(p => `${p.x},${p.y}`)
    .join(" ");
}

function updatePathCanvasLive(path) {
  const canvas = $("pathSceneCanvas");
  if (!canvas || !path) return;
  const size = pathCanvasSceneSize();

  const line = canvas.querySelector(".pathCanvasLine");
  if (line) line.setAttribute("points", pathCanvasPointsString(path));

  canvas.querySelectorAll(".pathCanvasPoint").forEach((handle, i) => {
    const p = path.points[i];
    if (!p) return;
    handle.style.left = `${p.x / size.width * 100}%`;
    handle.style.top = `${p.y / size.height * 100}%`;
    handle.title = `P${i + 1}: ${Math.round(p.x)}, ${Math.round(p.y)}`;
    handle.classList.toggle("selected", i === selectedPathPointIndex());
  });

  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  const marker = canvas.querySelector(".pathCanvasObjectMarker");
  if (obj && clip && marker) {
    const progress = samplePathProgress(path, Number(state.animationTimelineTime || 0), animationTimelineDuration(clip));
    const pos = samplePathPoint(path, progress);
    marker.style.left = `${pos.x / size.width * 100}%`;
    marker.style.top = `${pos.y / size.height * 100}%`;
  }

  const status = $("pathCanvasStatus");
  if (status) status.textContent = `${size.width} × ${size.height} · ${path.points.length} puntos`;
}

function setPathDrawMode(mode = "points") {
  state.pathDrawMode = mode === "pencil" ? "pencil" : "points";
  $("pathEditPointsBtn")?.classList.toggle("active", state.pathDrawMode !== "pencil");
  $("pathPencilModeBtn")?.classList.toggle("active", state.pathDrawMode === "pencil");
  $("pathSceneCanvas")?.classList.toggle("pencilMode", state.pathDrawMode === "pencil");
}

function pointDistance(a, b) {
  return Math.hypot(Number(a.x || 0) - Number(b.x || 0), Number(a.y || 0) - Number(b.y || 0));
}

function perpendicularDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 <= 0.00001) return pointDistance(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function simplifyPathRdp(points, tolerance = 10) {
  if (!points || points.length <= 2) return points || [];
  let maxDist = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPathRdp(points.slice(0, index + 1), tolerance);
    const right = simplifyPathRdp(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }

  return [first, last];
}

function limitPathPoints(points, maxPoints = 80) {
  const max = Math.max(4, Number(maxPoints) || 80);
  if (!points || points.length <= max) return points || [];
  const out = [];
  const last = points.length - 1;
  for (let i = 0; i < max; i++) {
    const idx = Math.round(i * last / (max - 1));
    out.push(points[idx]);
  }
  return out;
}

function optimizeDrawnPath(rawPoints) {
  const tolerance = Math.max(1, Number($("pathSimplifyTolerance")?.value || 10));
  const maxPoints = Math.max(4, Number($("pathMaxDrawPoints")?.value || 80));
  const cleaned = [];
  (rawPoints || []).forEach(p => {
    const last = cleaned[cleaned.length - 1];
    if (!last || pointDistance(last, p) >= 2) cleaned.push({ id: uid(), x: p.x, y: p.y });
  });
  const simplified = simplifyPathRdp(cleaned, tolerance).map(p => ({ id: p.id || uid(), x: p.x, y: p.y }));
  return limitPathPoints(simplified, maxPoints).map(p => ({ id: p.id || uid(), x: p.x, y: p.y }));
}


function sceneObjectPathCanvasStyle(obj) {
  const size = pathCanvasSceneSize();
  const x = Number(obj.x || 0) / size.width * 100;
  const y = Number(obj.y || 0) / size.height * 100;
  const w = Number(obj.width || 0) / size.width * 100;
  const h = Number(obj.height || 0) / size.height * 100;
  const scale = Number(obj.scale || 1) || 1;
  const rot = Number(obj.rotation || 0);
  return `left:${x}%;top:${y}%;width:${w}%;height:${h}%;transform:scale(${scale}) rotate(${rot}deg);z-index:${obj.type === "background" ? 1 + (obj.z || 0) : 30 + (obj.z || 0)};`;
}

function renderPathSceneCanvas() {
  const canvas = $("pathSceneCanvas");
  if (!canvas) return;

  const scene = currentScene();
  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  if (!scene || !obj || !clip) {
    canvas.innerHTML = `<div class="pathSceneEmpty">Sin escena u objeto seleccionado</div>`;
    return;
  }

  const path = normalizePathData(obj, clip);
  const size = pathCanvasSceneSize();
  canvas.style.aspectRatio = `${size.width} / ${size.height}`;
  canvas.innerHTML = "";
  canvas.classList.toggle("pencilMode", state.pathDrawMode === "pencil");

  const template = document.createElement("div");
  template.className = "pathSceneTemplate";
  canvas.appendChild(template);

  const sorted = [...scene.objects].sort((a, b) => {
    if (a.type === "background" && b.type !== "background") return -1;
    if (b.type === "background" && a.type !== "background") return 1;
    return (a.z || 0) - (b.z || 0);
  });

  sorted.forEach(o => {
    if (o.visible === false) return;
    const el = document.createElement("div");
    el.className = `pathSceneObjectRef ${o.type === "background" ? "bg" : ""} ${o.id === obj.id ? "target" : ""}`;
    el.style.cssText = sceneObjectPathCanvasStyle(o);
    const asset = imageAssetById(o.imageId);
    if (asset?.dataUrl) {
      el.style.backgroundImage = `url(${asset.dataUrl})`;
    } else {
      el.textContent = o.type === "background" ? "" : (o.name || o.type);
    }
    template.appendChild(el);
  });

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("pathCanvasSvg");
  svg.setAttribute("viewBox", `0 0 ${size.width} ${size.height}`);
  svg.setAttribute("preserveAspectRatio", "none");

  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  poly.setAttribute("points", pathCanvasPointsString(path));
  poly.setAttribute("class", "pathCanvasLine");
  svg.appendChild(poly);

  const drawPoly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  drawPoly.setAttribute("points", "");
  drawPoly.setAttribute("class", "pathCanvasDrawLine");
  svg.appendChild(drawPoly);

  canvas.appendChild(svg);

  path.points.forEach((p, i) => {
    const handle = document.createElement("div");
    handle.className = `pathCanvasPoint ${i === selectedPathPointIndex() ? "selected" : ""}`;
    handle.dataset.pathPointIndex = String(i);
    handle.setAttribute("role", "button");
    handle.setAttribute("aria-label", `Punto path ${i + 1}`);
    handle.style.left = `${p.x / size.width * 100}%`;
    handle.style.top = `${p.y / size.height * 100}%`;
    handle.title = `P${i + 1}: ${Math.round(p.x)}, ${Math.round(p.y)}`;
    canvas.appendChild(handle);
  });

  const progress = samplePathProgress(path, Number(state.animationTimelineTime || 0), animationTimelineDuration(clip));
  const pos = samplePathPoint(path, progress);
  const marker = document.createElement("div");
  marker.className = "pathCanvasObjectMarker";
  marker.style.left = `${pos.x / size.width * 100}%`;
  marker.style.top = `${pos.y / size.height * 100}%`;
  marker.title = `Objeto en path: ${Math.round(progress * 100)}%`;
  canvas.appendChild(marker);

  canvas.onpointerdown = e => {
    const handle = e.target?.closest?.(".pathCanvasPoint");
    if (handle && state.pathDrawMode !== "pencil") {
      startPathCanvasPointDrag(e, Number(handle.dataset.pathPointIndex || 0), "pointer");
      return;
    }
    if (state.pathDrawMode === "pencil") startPathCanvasPencilDraw(e);
  };

  canvas.onmousedown = e => {
    if (e.button !== 0) return;
    const handle = e.target?.closest?.(".pathCanvasPoint");
    if (handle && state.pathDrawMode !== "pencil") {
      startPathCanvasPointDrag(e, Number(handle.dataset.pathPointIndex || 0), "mouse");
      return;
    }
  };

  canvas.onclick = e => {
    if (state.pathDrawMode === "pencil") return;
    if (state.pathDragMoved || state.pathDragJustFinished) {
      state.pathDragJustFinished = false;
      return;
    }
    if (e.target?.closest?.(".pathCanvasPoint")) return;
    addPathPointAtScenePoint(pathCanvasPointFromEvent(e));
  };

  updatePathCanvasLive(path);
}




function startPathCanvasPointDrag(e, index, source = "pointer") {
  const path = selectedPathData();
  const canvas = $("pathSceneCanvas");
  if (!path || !path.points[index] || !canvas) return;

  e.preventDefault();
  e.stopPropagation();

  state.selectedPathPointIndex = index;
  const point = path.points[index];
  const rect = canvas.getBoundingClientRect();
  const size = pathCanvasSceneSize();
  const handle = canvas.querySelector(`.pathCanvasPoint[data-path-point-index="${index}"]`);

  canvas.classList.add("draggingPoint");
  handle?.classList.add("selected");

  state.pathDragActive = true;
  state.pathDragMoved = false;
  state.pathDragJustFinished = false;
  state.pathDragPointIndex = index;

  const startClientX = e.clientX;
  const startClientY = e.clientY;
  let lastX = e.clientX;
  let lastY = e.clientY;

  const applyClientPoint = (clientX, clientY) => {
    const now = pathCanvasPointFromEvent({ clientX, clientY }, rect, size);
    point.x = now.x;
    point.y = now.y;

    if (handle) {
      handle.style.left = `${point.x / size.width * 100}%`;
      handle.style.top = `${point.y / size.height * 100}%`;
      handle.title = `P${index + 1}: ${Math.round(point.x)}, ${Math.round(point.y)}`;
    }

    updatePathCanvasLive(path);
  };

  const move = ev => {
    ev.preventDefault();
    ev.stopPropagation();
    lastX = ev.clientX;
    lastY = ev.clientY;
    if (Math.hypot(lastX - startClientX, lastY - startClientY) > 2) state.pathDragMoved = true;
    applyClientPoint(lastX, lastY);
  };

  const finish = ev => {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();

    if (state.pathDragMoved) {
      applyClientPoint(lastX, lastY);
      state.pathDragJustFinished = true;
      setTimeout(() => { state.pathDragJustFinished = false; }, 0);
    }

    state.pathDragActive = false;
    state.pathDragPointIndex = null;
    canvas.classList.remove("draggingPoint");

    document.removeEventListener("pointermove", move, true);
    document.removeEventListener("pointerup", finish, true);
    document.removeEventListener("pointercancel", finish, true);
    document.removeEventListener("mousemove", move, true);
    document.removeEventListener("mouseup", finish, true);

    renderPathEditor();
    renderStage();
    updateAnimationPreview();
  };

  // Escuchamos ambos sistemas. En navegadores donde pointer events queden bloqueados,
  // mousemove sigue moviendo el punto.
  document.addEventListener("pointermove", move, true);
  document.addEventListener("pointerup", finish, true);
  document.addEventListener("pointercancel", finish, true);
  document.addEventListener("mousemove", move, true);
  document.addEventListener("mouseup", finish, true);

  // No aplicamos posición inicial aquí para no interpretar un simple click como drag.
}




function startPathCanvasPencilDraw(e) {
  const path = selectedPathData();
  const canvas = $("pathSceneCanvas");
  if (!path || !canvas) return;
  e.preventDefault();
  e.stopPropagation();

  const rect = canvas.getBoundingClientRect();
  const size = pathCanvasSceneSize();
  const raw = [];
  const drawLine = canvas.querySelector(".pathCanvasDrawLine");

  const addPoint = ev => {
    const p = pathCanvasPointFromEvent(ev, rect, size);
    const last = raw[raw.length - 1];
    if (!last || pointDistance(last, p) >= 2) raw.push(p);
    if (drawLine) drawLine.setAttribute("points", raw.map(pt => `${pt.x},${pt.y}`).join(" "));
  };

  addPoint(e);
  canvas.classList.add("drawing");

  const move = ev => {
    ev.preventDefault();
    addPoint(ev);
  };

  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    canvas.classList.remove("drawing");

    if (raw.length >= 2) {
      path.points = optimizeDrawnPath(raw);
      path.enabled = true;
      state.selectedPathPointIndex = 0;
      if ($("pathEnabled")) $("pathEnabled").checked = true;
    }

    renderPathEditor();
    renderStage();
    updateAnimationPreview();
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}


function renderPathEditor() {
  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  const panel = $("pathAnimPanel");
  if (!panel || !obj || !clip) return;

  const path = normalizePathData(obj, clip);
  if ($("pathEnabled")) $("pathEnabled").checked = !!path.enabled;
  if ($("pathOrient")) $("pathOrient").checked = !!path.orientToPath;
  if ($("pathClosed")) $("pathClosed").checked = !!path.closed;
  if ($("pathRotationOffset")) $("pathRotationOffset").value = Number(path.rotationOffset || 0);
  if ($("pathCycleDuration")) $("pathCycleDuration").value = currentPathCycleDuration(obj, clip);

  const progress = samplePathProgress(path, Number(state.animationTimelineTime || 0), animationTimelineDuration(clip));
  if ($("pathProgressValue")) $("pathProgressValue").value = Math.round(progress * 100);

  const pKey = path.progressKeys[selectedPathProgressKeyIndex()];
  if ($("pathProgressEasing")) $("pathProgressEasing").value = pKey?.easing || "linear";

  const pointList = $("pathPointList");
  if (pointList) {
    pointList.innerHTML = "";
    path.points.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = i === selectedPathPointIndex() ? "selected" : "";
      li.innerHTML = `<span>P${i + 1}</span><small>${Math.round(p.x)}, ${Math.round(p.y)}</small>`;
      li.onclick = () => {
        state.selectedPathPointIndex = i;
        renderPathEditor();
        renderStage();
      };
      pointList.appendChild(li);
    });
  }

  const keyList = $("pathProgressKeyList");
  if (keyList) {
    keyList.innerHTML = "";
    path.progressKeys.forEach((k, i) => {
      const tr = document.createElement("tr");
      tr.className = i === selectedPathProgressKeyIndex() ? "selected" : "";
      tr.innerHTML = `<td>${Math.round(k.time)}</td><td>${Math.round(k.value * 100)}%</td><td>${k.easing}</td>`;
      tr.onclick = () => {
        state.selectedPathProgressKeyIndex = i;
        state.animationTimelineTime = k.time;
        renderPathEditor();
        renderAnimationTimeline();
        updateAnimationPreview();
      };
      keyList.appendChild(tr);
    });
  }

  setPathDrawMode(state.pathDrawMode || "points");
  renderPathSceneCanvas();
}

function pathKeyTimesForClip(clip) {
  return (clip?.path?.progressKeys || []).map(k => Number(k.time || 0));
}

function allAnimationKeyTimes(clip) {
  return [...new Set([...keyTimesForClip(clip), ...pathKeyTimesForClip(clip)].map(t => Math.round(Number(t) || 0)))]
    .sort((a, b) => a - b);
}

function normalizeTransformClip(obj, clip = null) {
  if (!obj) return null;
  obj.transformClips ??= [];
  if (!clip) return null;

  clip.id ??= uid();
  clip.name ??= "clip";
  clip.duration ??= 1000;
  clip.mode ??= "once";

  migrateLegacyKeyframesToTracks(obj, clip);
  clip.tracks ??= {};

  TRANSFORM_TRACKS.forEach(prop => normalizeTrack(obj, clip, prop));

  // Si el clip no tiene keys en ningún track, crear base y fin neutros.
  const totalKeys = TRANSFORM_TRACKS.reduce((sum, prop) => sum + (clip.tracks[prop]?.keys?.length || 0), 0);
  if (!totalKeys) {
    TRANSFORM_TRACKS.forEach(prop => {
      const v = defaultTransformValue(obj, prop);
      clip.tracks[prop] = {
        keys: [
          { time: 0, value: v, easing: "linear" },
          { time: clip.duration, value: v, easing: "linear" }
        ]
      };
    });
  }

  const path = normalizePathData(obj, clip);

  let maxTime = 0;
  TRANSFORM_TRACKS.forEach(prop => {
    const track = normalizeTrack(obj, clip, prop);
    track.keys.forEach(k => { maxTime = Math.max(maxTime, Number(k.time || 0)); });
  });
  (path?.progressKeys || []).forEach(k => { maxTime = Math.max(maxTime, Number(k.time || 0)); });

  clip.duration = Math.max(1, Number(clip.duration) || 1000, maxTime);

  // Mantener keyframes legacy para compatibilidad/inspección, pero ya no se usa como fuente.
  clip.keyframes = mergedTransformKeyframesFromTracks(obj, clip);

  return clip;
}


function sampleTrackNoNormalize(track, timeMs, fallbackValue = 0) {
  const keys = [...(track?.keys || [])]
    .map(k => normalizeTrackKey(k, fallbackValue))
    .sort((a, b) => a.time - b.time);

  if (!keys.length) return fallbackValue;
  const t = Math.max(0, Number(timeMs) || 0);
  if (t <= keys[0].time) return keys[0].value;
  if (t >= keys[keys.length - 1].time) return keys[keys.length - 1].value;

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t < a.time || t > b.time) continue;
    const span = Math.max(1, b.time - a.time);
    const eased = easingValue((t - a.time) / span, b.easing || a.easing || "linear");
    return lerp(a.value, b.value, eased);
  }

  return keys[keys.length - 1].value;
}

function mergedTransformKeyframesFromTracks(obj, clip) {
  // Compatibilidad: generar una tabla de tiempos sin usar sampleTransformClip()
  // para evitar recursión normalize -> sample -> normalize.
  const times = new Set();
  TRANSFORM_TRACKS.forEach(prop => {
    (clip.tracks?.[prop]?.keys || []).forEach(k => times.add(String(Math.round(Number(k.time || 0)))));
  });

  return [...times]
    .map(Number)
    .sort((a, b) => a - b)
    .map(time => ({
      time,
      x: sampleTrackNoNormalize(clip.tracks?.x, time, defaultTransformValue(obj, "x")),
      y: sampleTrackNoNormalize(clip.tracks?.y, time, defaultTransformValue(obj, "y")),
      rotation: sampleTrackNoNormalize(clip.tracks?.rotation, time, defaultTransformValue(obj, "rotation")),
      scale: sampleTrackNoNormalize(clip.tracks?.scale, time, defaultTransformValue(obj, "scale")),
      easing: "linear"
    }));
}


function selectedAnimObject() {
  const scene = currentScene();
  if (!scene) return null;

  const selectValue = $("animObjectSelect")?.value || "";
  const candidates = [
    selectValue,
    state.selectedObjectId
  ].filter(Boolean);

  for (const id of candidates) {
    const found = scene.objects.find(o => o.id === id);
    if (found) return found;
  }

  return scene.objects.find(o => o.type !== "background") || null;
}


function selectedTransformClip() {
  const obj = selectedAnimObject();
  if (!obj) return null;
  obj.transformClips ??= [];
  obj.transformClips.forEach(c => normalizeTransformClip(obj, c));
  if (!state.selectedTransformClipId && obj.transformClips[0]) state.selectedTransformClipId = obj.transformClips[0].id;
  return obj.transformClips.find(c => c.id === state.selectedTransformClipId) || obj.transformClips[0] || null;
}

function transformClipNames(obj) {
  return (obj?.transformClips || []).map(c => c.name || c.id);
}

function makeTransformClip(obj) {
  obj.transformClips ??= [];
  const clip = {
    id: uid(),
    name: `clip_${obj.transformClips.length + 1}`,
    duration: 1000,
    mode: "once",
    tracks: {}
  };

  TRANSFORM_TRACKS.forEach(prop => {
    const v = defaultTransformValue(obj, prop);
    clip.tracks[prop] = {
      keys: [
        { time: 0, value: v, easing: "linear" },
        { time: 1000, value: v, easing: "smooth" }
      ]
    };
  });

  normalizeTransformClip(obj, clip);
  obj.transformClips.push(clip);
  state.selectedTransformClipId = clip.id;
  state.selectedTransformKeyIndex = 0;
  state.selectedTransformProperty = "x";
  state.animationTimelineTime = 0;
  return clip;
}

function easingValue(t, easing = "linear") {
  t = Math.max(0, Math.min(1, Number(t) || 0));
  if (easing === "smooth" || easing === "bezier" || easing === "easeInOut") return t * t * (3 - 2 * t);
  if (easing === "easeIn") return t * t;
  if (easing === "easeOut") return 1 - Math.pow(1 - t, 2);
  if (easing === "stepped" || easing === "constant") return 0;
  return t;
}

function lerp(a, b, t) {
  return Number(a || 0) + (Number(b || 0) - Number(a || 0)) * t;
}

function animationTimelineDuration(clip = selectedTransformClip()) {
  return Math.max(1, Number(clip?.duration || 1000));
}

function sampleTrack(track, timeMs, fallbackValue = 0) {
  const keys = [...(track?.keys || [])]
    .map(k => normalizeTrackKey(k, fallbackValue))
    .sort((a, b) => a.time - b.time);

  if (!keys.length) return fallbackValue;

  const t = Math.max(0, Number(timeMs) || 0);

  if (t <= keys[0].time) return keys[0].value;
  if (t >= keys[keys.length - 1].time) return keys[keys.length - 1].value;

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t < a.time || t > b.time) continue;

    const span = Math.max(1, b.time - a.time);
    const raw = (t - a.time) / span;
    const eased = easingValue(raw, b.easing || a.easing || "linear");
    return lerp(a.value, b.value, eased);
  }

  return keys[keys.length - 1].value;
}

function sampleTransformClip(obj, clip, timeMs) {
  clip = normalizeTransformClip(obj, clip);
  if (!clip) {
    return {
      time: Number(timeMs) || 0,
      x: defaultTransformValue(obj, "x"),
      y: defaultTransformValue(obj, "y"),
      rotation: defaultTransformValue(obj, "rotation"),
      scale: defaultTransformValue(obj, "scale")
    };
  }

  const t = Math.max(0, Math.min(animationTimelineDuration(clip), Number(timeMs) || 0));

  const path = normalizePathData(obj, clip);
  const baseSample = {
    time: t,
    x: sampleTrack(clip.tracks.x, t, defaultTransformValue(obj, "x")),
    y: sampleTrack(clip.tracks.y, t, defaultTransformValue(obj, "y")),
    rotation: sampleTrack(clip.tracks.rotation, t, defaultTransformValue(obj, "rotation")),
    scale: sampleTrack(clip.tracks.scale, t, defaultTransformValue(obj, "scale")),
    easing: "linear"
  };

  if (path?.enabled && path.points?.length) {
    const progress = samplePathProgress(path, t, animationTimelineDuration(clip));
    const point = samplePathPoint(path, progress);
    baseSample.x = point.x;
    baseSample.y = point.y;
    if (path.orientToPath) {
      baseSample.rotation = point.angle + Number(path.rotationOffset || 0);
    }
  }

  return baseSample;
}

function applyTransformSample(obj, sample) {
  if (!obj || !sample) return;
  obj._transformAnimValue = {
    x: sample.x,
    y: sample.y,
    rotation: sample.rotation,
    scale: sample.scale
  };
  updateObjectElement(obj);
}

function playTransformClip(obj, clipNameOrId = "", modeOverride = null, restart = true) {
  if (!obj) return false;
  obj.transformClips ??= [];
  const clip = obj.transformClips.find(c => c.id === clipNameOrId || c.name === clipNameOrId) || obj.transformClips[0];
  if (!clip) {
    showMessage("El objeto no tiene clips de transformación.");
    return false;
  }

  if (!restart && obj._transformAnim?.playing && obj._transformAnim.clipId === clip.id) return true;

  normalizeTransformClip(obj, clip);
  obj._transformAnim = {
    clipId: clip.id,
    elapsed: 0,
    direction: 1,
    mode: modeOverride || clip.mode || "once",
    playing: true
  };
  applyTransformSample(obj, sampleTransformClip(obj, clip, 0));
  startAnimationLoop();
  return true;
}

function stopTransformClip(obj, clear = false) {
  if (!obj) return false;
  if (obj._transformAnim) obj._transformAnim.playing = false;
  if (clear) delete obj._transformAnimValue;
  updateObjectElement(obj);
  return true;
}

function updateTransformAnimations(dt) {
  const scene = currentScene();
  if (!scene) return;

  scene.objects.forEach(obj => {
    const anim = obj._transformAnim;
    if (!anim?.playing) return;

    const clip = (obj.transformClips || []).find(c => c.id === anim.clipId);
    if (!clip) {
      anim.playing = false;
      return;
    }

    normalizeTransformClip(obj, clip);
    const duration = animationTimelineDuration(clip);
    anim.elapsed += (Number(dt) || 0) * (anim.direction || 1);

    if (anim.mode === "loop") {
      anim.elapsed = ((anim.elapsed % duration) + duration) % duration;
    } else if (anim.mode === "pingpong") {
      if (anim.elapsed >= duration) {
        anim.elapsed = duration;
        anim.direction = -1;
      } else if (anim.elapsed <= 0) {
        anim.elapsed = 0;
        anim.direction = 1;
      }
    } else if (anim.elapsed >= duration) {
      anim.elapsed = duration;
      anim.playing = false;
    }

    applyTransformSample(obj, sampleTransformClip(obj, clip, anim.elapsed));
  });
}

function trackKeys(obj, clip, prop) {
  normalizeTransformClip(obj, clip);
  clip.tracks ??= {};
  clip.tracks[prop] ??= { keys: [] };
  clip.tracks[prop].keys ??= [];
  return clip.tracks[prop].keys;
}

function findTrackKeyAtTime(track, time, tolerance = 0.5) {
  const t = Number(time) || 0;
  return (track?.keys || []).find(k => Math.abs(Number(k.time || 0) - t) <= tolerance) || null;
}

function upsertTrackKey(obj, clip, prop, time, value, easing = "linear") {
  const t = Math.max(0, Math.min(animationTimelineDuration(clip), Number(time) || 0));
  const keys = trackKeys(obj, clip, prop);
  let key = findTrackKeyAtTime(clip.tracks[prop], t, 1);

  if (!key) {
    key = { time: t, value: Number(value), easing: easing || "linear" };
    keys.push(key);
  } else {
    key.time = t;
    key.value = Number(value);
    key.easing = easing || key.easing || "linear";
  }

  normalizeTransformClip(obj, clip);
  return findTrackKeyAtTime(clip.tracks[prop], t, 1) || key;
}

function upsertTransformKeysAtTime(obj, clip, time, values = {}, easing = "linear") {
  const t = Math.max(0, Math.min(animationTimelineDuration(clip), Number(time) || 0));
  const sample = sampleTransformClip(obj, clip, t);

  const finalValues = {
    x: values.x !== undefined ? Number(values.x) : sample.x,
    y: values.y !== undefined ? Number(values.y) : sample.y,
    rotation: values.rotation !== undefined ? Number(values.rotation) : sample.rotation,
    scale: values.scale !== undefined ? (Number(values.scale) || 1) : sample.scale
  };

  const result = {};
  TRANSFORM_TRACKS.forEach(prop => {
    result[prop] = upsertTrackKey(obj, clip, prop, t, finalValues[prop], values.easing || easing || "linear");
  });

  normalizeTransformClip(obj, clip);
  return result;
}

function selectedTrackKey() {
  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  const prop = state.selectedTransformProperty || "x";
  if (!obj || !clip) return null;
  const keys = trackKeys(obj, clip, prop);
  const i = Math.max(0, Math.min(keys.length - 1, Number(state.selectedTransformKeyIndex || 0)));
  return keys[i] || null;
}

function selectTrackKey(clip, prop, key) {
  state.selectedTransformProperty = prop;
  const keys = clip?.tracks?.[prop]?.keys || [];
  state.selectedTransformKeyIndex = keys.indexOf(key);
  if (state.selectedTransformKeyIndex < 0) {
    state.selectedTransformKeyIndex = keys.findIndex(k => Math.abs(Number(k.time || 0) - Number(key?.time || 0)) <= 0.5);
  }
}

function keyTimesForClip(clip) {
  const times = new Set();
  TRANSFORM_TRACKS.forEach(prop => (clip?.tracks?.[prop]?.keys || []).forEach(k => times.add(String(Math.round(Number(k.time || 0))))));
  return [...times].map(Number).sort((a, b) => a - b);
}

function renderTransformAnimationEditor() {
  const editor = $("animationEditor");
  if (!editor || !state.project) return;

  const scene = currentScene();
  const objSelect = $("animObjectSelect");
  if (!scene || !objSelect) return;

  fillSelect(objSelect, scene.objects.filter(o => o.type !== "background"), "Elegir objeto");
  const currentId = objSelect.value || state.selectedObjectId || scene.objects.find(o => o.type !== "background")?.id || "";
  objSelect.value = currentId;

  const obj = selectedAnimObject();
  const list = $("transformClipList");
  if (!list) return;
  list.innerHTML = "";

  if (!obj) return;

  obj.transformClips ??= [];
  obj.transformClips.forEach(c => normalizeTransformClip(obj, c));
  if (!state.selectedTransformClipId && obj.transformClips[0]) state.selectedTransformClipId = obj.transformClips[0].id;

  obj.transformClips.forEach(clip => {
    const li = document.createElement("li");
    li.className = clip.id === state.selectedTransformClipId ? "selected" : "";
    li.innerHTML = `<span>${clip.name}</span><small>${clip.duration} ms</small>`;
    li.onclick = () => {
      state.selectedTransformClipId = clip.id;
      state.selectedTransformProperty = "x";
      state.selectedTransformKeyIndex = 0;
      state.animationTimelineTime = 0;
      renderTransformAnimationEditor();
    };
    list.appendChild(li);
  });

  const clip = selectedTransformClip();
  if (!clip) {
    $("transformClipName").value = "";
    $("transformClipDuration").value = "";
    $("transformClipMode").value = "once";
    $("transformKeyframeList").innerHTML = "";
    updateAnimationPreview();
    renderAnimationTimeline();
    return;
  }

  normalizeTransformClip(obj, clip);

  $("transformClipName").value = clip.name || "";
  $("transformClipDuration").value = clip.duration || 1000;
  $("transformClipMode").value = clip.mode || "once";

  const prop = state.selectedTransformProperty || "x";
  const key = selectedTrackKey();
  const sampleAtPlayhead = sampleTransformClip(obj, clip, state.animationTimelineTime || 0);

  if (key) {
    $("transformKeyTime").value = key.time;
    const sampled = sampleTransformClip(obj, clip, key.time);
    $("transformKeyX").value = Math.round(sampled.x);
    $("transformKeyY").value = Math.round(sampled.y);
    $("transformKeyRotation").value = Number(sampled.rotation || 0).toFixed(2).replace(/\.00$/, "");
    $("transformKeyScale").value = Number(sampled.scale || 1).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
    $("transformKeyEasing").value = key.easing || "linear";
  } else {
    $("transformKeyTime").value = Math.round(state.animationTimelineTime || 0);
    $("transformKeyX").value = Math.round(sampleAtPlayhead.x);
    $("transformKeyY").value = Math.round(sampleAtPlayhead.y);
    $("transformKeyRotation").value = Number(sampleAtPlayhead.rotation || 0).toFixed(2).replace(/\.00$/, "");
    $("transformKeyScale").value = Number(sampleAtPlayhead.scale || 1).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  }

  updateAnimationPreview();
  renderAnimationTimeline();

  const tbody = $("transformKeyframeList");
  tbody.innerHTML = "";

  TRANSFORM_TRACKS.forEach(trackProp => {
    const keys = clip.tracks?.[trackProp]?.keys || [];
    keys.forEach((k, i) => {
      const tr = document.createElement("tr");
      const selected = trackProp === state.selectedTransformProperty && i === Number(state.selectedTransformKeyIndex || 0);
      tr.className = selected ? "selected" : "";
      tr.innerHTML = `<td>${k.time}</td><td>${trackProp}</td><td colspan="3">${Number(k.value).toFixed(trackProp === "scale" ? 3 : 2).replace(/0+$/, "").replace(/\.$/, "")}</td><td>${k.easing}</td>`;
      tr.onclick = () => {
        state.selectedTransformProperty = trackProp;
        state.selectedTransformKeyIndex = i;
        state.animationTimelineTime = k.time;
        renderTransformAnimationEditor();
      };
      tbody.appendChild(tr);
    });
  });

  const tab = state.selectedAnimationTab || "transform";
  $("transformAnimTabBtn")?.classList.toggle("active", tab !== "path");
  $("pathAnimTabBtn")?.classList.toggle("active", tab === "path");
  $("transformAnimPanel")?.classList.toggle("active", tab !== "path");
  $("pathAnimPanel")?.classList.toggle("active", tab === "path");
  renderPathEditor();
}

function updateCurrentTransformClip(field, value) {
  const clip = selectedTransformClip();
  const obj = selectedAnimObject();
  if (!clip || !obj) return;

  if (field === "duration") {
    const nextDuration = Math.max(1, Number(value) || 1);
    const path = normalizePathData(obj, clip);
    const isPathTab = state.selectedAnimationTab === "path";
    const looksLikeFullCycle = path?.progressKeys?.some(k => Number(k.value) >= 0.999);
    clip.duration = nextDuration;
    if (isPathTab || path?.enabled || looksLikeFullCycle) {
      fitPathProgressToDuration(obj, clip, nextDuration);
    }
  } else {
    clip[field] = value;
  }

  normalizeTransformClip(obj, clip);
  renderTransformAnimationEditor();
}


function updateSelectedTransformKey(field, value) {
  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  if (!obj || !clip) return;

  const prop = state.selectedTransformProperty || "x";
  const key = selectedTrackKey();
  if (!key) return;

  if (field === "time") {
    const newTime = Math.max(0, Math.min(animationTimelineDuration(clip), Number(value) || 0));
    key.time = newTime;
    normalizeTransformClip(obj, clip);
    const newKey = findTrackKeyAtTime(clip.tracks[prop], newTime, 1);
    selectTrackKey(clip, prop, newKey);
    state.animationTimelineTime = newTime;
  } else if (field === "easing") {
    key.easing = value || "linear";
  } else if (TRANSFORM_TRACKS.includes(field)) {
    upsertTrackKey(obj, clip, field, key.time, field === "scale" ? (Number(value) || 1) : (Number(value) || 0), key.easing || "linear");
    state.selectedTransformProperty = field;
    const newKey = findTrackKeyAtTime(clip.tracks[field], key.time, 1);
    selectTrackKey(clip, field, newKey);
  }

  normalizeTransformClip(obj, clip);
  updateAnimationPreview();
  renderTransformAnimationEditor();
}

function timelinePercentFromTime(time, clip = selectedTransformClip()) {
  return Math.max(0, Math.min(100, (Number(time) || 0) / animationTimelineDuration(clip) * 100));
}

function setAnimationTimelineTime(time, { render = true } = {}) {
  const clip = selectedTransformClip();
  const duration = animationTimelineDuration(clip);
  state.animationTimelineTime = Math.max(0, Math.min(duration, Number(time) || 0));
  updateAnimationPreview();
  if (render) renderAnimationTimeline();
}

function previewObjectCenterClient() {
  const preview = $("animationPreviewObject");
  if (!preview) return null;
  const r = preview.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function previewCurrentContext() {
  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  if (!obj || !clip) return null;
  const time = Math.max(0, Math.min(animationTimelineDuration(clip), Number(state.animationTimelineTime || 0)));
  const sample = sampleTransformClip(obj, clip, time);
  const base = sampleTransformClip(obj, clip, 0);
  return { obj, clip, time, sample, base };
}

function setPreviewKeyValue(prop, value, time = null) {
  const ctx = previewCurrentContext();
  if (!ctx) return null;
  const t = time == null ? ctx.time : time;
  const easing = $("transformKeyEasing")?.value || "linear";
  const key = upsertTrackKey(ctx.obj, ctx.clip, prop, t, value, easing);
  state.selectedTransformProperty = prop;
  selectTrackKey(ctx.clip, prop, key);
  state.animationTimelineTime = t;
  return key;
}

function appendPreviewGizmos() {
  const preview = $("animationPreviewObject");
  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  if (!preview || !obj || !clip) return;

  // El preview es un elemento propio, no un .sceneObject del stage.
  // Por eso necesita sus propios gizmos; no puede reutilizar appendTransformGizmos().
  preview.querySelectorAll(".previewTransformGizmoLayer").forEach(el => el.remove());

  const layer = document.createElement("div");
  layer.className = "previewTransformGizmoLayer";

  const move = document.createElement("button");
  move.type = "button";
  move.className = "previewTransformHandle previewMoveHandle";
  move.title = "Mover key de preview";
  move.onpointerdown = e => startPreviewMoveGizmo(e);
  layer.appendChild(move);

  ["nw", "ne", "sw", "se"].forEach(pos => {
    const h = document.createElement("button");
    h.type = "button";
    h.className = `previewTransformHandle previewScaleHandle ${pos}`;
    h.title = "Escalar key de preview";
    h.onpointerdown = e => startPreviewScaleGizmo(e);
    layer.appendChild(h);
  });

  const rot = document.createElement("button");
  rot.type = "button";
  rot.className = "previewTransformHandle previewRotateHandle";
  rot.title = "Rotar key de preview";
  rot.onpointerdown = e => startPreviewRotateGizmo(e);
  layer.appendChild(rot);

  preview.appendChild(layer);
}

function startPreviewMoveGizmo(e) {
  const ctx = previewCurrentContext();
  if (!ctx) return;
  e.preventDefault();
  e.stopPropagation();

  const startX = e.clientX;
  const startY = e.clientY;
  const baseX = Number(ctx.sample.x || 0);
  const baseY = Number(ctx.sample.y || 0);
  const posFactor = 0.35;

  const move = ev => {
    ev.preventDefault();
    const dx = (ev.clientX - startX) / posFactor;
    const dy = (ev.clientY - startY) / posFactor;
    const nx = baseX + dx;
    const ny = baseY + dy;
    setPreviewKeyValue("x", nx, ctx.time);
    setPreviewKeyValue("y", ny, ctx.time);
    if ($("transformKeyX")) $("transformKeyX").value = Math.round(nx);
    if ($("transformKeyY")) $("transformKeyY").value = Math.round(ny);
    updateAnimationPreview();
    renderAnimationTimeline();
  };

  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    renderTransformAnimationEditor();
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

function startPreviewScaleGizmo(e) {
  const ctx = previewCurrentContext();
  const center = previewObjectCenterClient();
  if (!ctx || !center) return;
  e.preventDefault();
  e.stopPropagation();

  const baseScale = Number(ctx.sample.scale || 1) || 1;
  const startDist = Math.max(8, Math.hypot(e.clientX - center.x, e.clientY - center.y));

  const move = ev => {
    ev.preventDefault();
    const dist = Math.max(2, Math.hypot(ev.clientX - center.x, ev.clientY - center.y));
    const nextScale = Math.max(0.05, Math.min(20, baseScale * (dist / startDist)));
    setPreviewKeyValue("scale", nextScale, ctx.time);
    if ($("transformKeyScale")) $("transformKeyScale").value = Number(nextScale).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
    updateAnimationPreview();
    renderAnimationTimeline();
  };

  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    renderTransformAnimationEditor();
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

function startPreviewRotateGizmo(e) {
  const ctx = previewCurrentContext();
  const center = previewObjectCenterClient();
  if (!ctx || !center) return;
  e.preventDefault();
  e.stopPropagation();

  const startAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x) * 180 / Math.PI;
  const baseRotation = Number(ctx.sample.rotation || 0);

  const move = ev => {
    ev.preventDefault();
    const a = Math.atan2(ev.clientY - center.y, ev.clientX - center.x) * 180 / Math.PI;
    const nextRotation = baseRotation + (a - startAngle);
    setPreviewKeyValue("rotation", nextRotation, ctx.time);
    if ($("transformKeyRotation")) $("transformKeyRotation").value = Number(nextRotation).toFixed(1).replace(/\.0$/, "");
    updateAnimationPreview();
    renderAnimationTimeline();
  };

  const up = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    renderTransformAnimationEditor();
  };

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
}

function nearestAnimationKeyTime(direction = 1) {
  const clip = selectedTransformClip();
  if (!clip) return null;
  const times = allAnimationKeyTimes(clip);
  if (!times.length) return null;

  const now = Number(state.animationTimelineTime || 0);
  const epsilon = 0.5;

  if (direction < 0) {
    for (let i = times.length - 1; i >= 0; i--) {
      if (times[i] < now - epsilon) return times[i];
    }
    return times[0];
  }

  for (let i = 0; i < times.length; i++) {
    if (times[i] > now + epsilon) return times[i];
  }
  return times[times.length - 1];
}

function jumpAnimationKey(direction = 1) {
  const t = nearestAnimationKeyTime(direction);
  if (t == null) return;

  state.animationTimelinePlaying = false;
  setAnimationTimelineTime(t);

  const clip = selectedTransformClip();
  const prop = state.selectedTransformProperty || "x";
  const key = findTrackKeyAtTime(clip?.tracks?.[prop], t, 1);
  if (key) selectTrackKey(clip, prop, key);

  renderTransformAnimationEditor();
}


function updateAnimationPreview() {
  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  const preview = $("animationPreviewObject");
  const timeLabel = $("animationPreviewTime");

  const currentTime = Math.max(0, Math.min(animationTimelineDuration(clip), Number(state.animationTimelineTime || 0)));
  state.animationTimelineTime = currentTime;

  if (timeLabel) timeLabel.textContent = `${Math.round(currentTime)} ms`;
  if (!preview) return;

  preview.style.backgroundImage = "";
  preview.style.width = "80px";
  preview.style.height = "80px";
  preview.textContent = "";

  if (!obj || !clip) {
    preview.textContent = "Sin objeto";
    preview.style.transform = "translate(-50%, -50%)";
    return;
  }

  const asset = imageAssetById(obj.imageId);
  if (asset?.dataUrl) preview.style.backgroundImage = `url(${asset.dataUrl})`;
  else preview.textContent = obj.name || "Objeto";

  const sample = sampleTransformClip(obj, clip, currentTime);
  const base = sampleTransformClip(obj, clip, 0);

  const dx = (sample.x - base.x) * 0.35;
  const dy = (sample.y - base.y) * 0.35;
  const baseScale = Number(obj.scale || 1) || 1;
  const previewScale = (Number(sample.scale || 1) || 1) / baseScale;
  const rotation = Number(sample.rotation || 0) || 0;

  const w = Math.max(20, Math.min(220, Number(obj.width || 80) * 0.65 * baseScale));
  const h = Math.max(20, Math.min(180, Number(obj.height || 80) * 0.65 * baseScale));

  preview.style.width = `${w}px`;
  preview.style.height = `${h}px`;
  preview.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${previewScale}) rotate(${rotation}deg)`;
  appendPreviewGizmos();

  if (state.mode === "animations") {
    obj._transformAnimValue = { x: sample.x, y: sample.y, rotation: sample.rotation, scale: sample.scale };
    updateObjectElement(obj);
  }
}

function renderTimelineRuler(clip) {
  const ruler = $("animationTimelineRuler");
  if (!ruler) return;
  ruler.innerHTML = "";
  const duration = animationTimelineDuration(clip);
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const tick = document.createElement("div");
    tick.className = "timelineTick";
    tick.style.left = `${i / steps * 100}%`;
    tick.textContent = `${Math.round(duration * i / steps)}`;
    ruler.appendChild(tick);
  }
}

function timelineScrubBounds() {
  const lane = $("animationScrubLane") || $("animationTimeline");
  if (!lane) return null;
  const rect = lane.getBoundingClientRect();
  return { left: rect.left, right: rect.right, width: Math.max(1, rect.width) };
}

function timelineTimeFromTimelineEvent(e, clip = selectedTransformClip()) {
  const bounds = timelineScrubBounds();
  if (!bounds) return 0;
  const x = Math.max(0, Math.min(bounds.width, e.clientX - bounds.left));
  return Math.round((x / bounds.width) * animationTimelineDuration(clip));
}

function timelineTimeFromEvent(e, trackEl, clip = selectedTransformClip()) {
  const rail = trackEl.querySelector(".timelineRail") || trackEl;
  const rect = rail.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
  return Math.round((x / Math.max(1, rect.width)) * animationTimelineDuration(clip));
}

function scrubTimelineFromEvent(e) {
  const clip = selectedTransformClip();
  if (!clip) return;
  stopTimelinePreview(false);
  setAnimationTimelineTime(timelineTimeFromTimelineEvent(e, clip));
}

function renderAnimationTimeline() {
  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  const timeline = $("animationTimeline");
  if (!timeline) return;

  const duration = animationTimelineDuration(clip);
  state.animationTimelineTime = Math.max(0, Math.min(duration, Number(state.animationTimelineTime || 0)));

  const scrub = $("animationTimelineScrub");
  if (scrub) {
    scrub.max = duration;
    scrub.value = state.animationTimelineTime;
  }

  renderTimelineRuler(clip);

  const playhead = $("animationPlayhead");
  if (playhead) {
    const pct = timelinePercentFromTime(state.animationTimelineTime || 0, clip);
    const lane = $("animationScrubLane");
    if (lane) playhead.style.left = `${lane.offsetLeft + lane.clientWidth * pct / 100}px`;
  }

  timeline.querySelectorAll(".timelineTrack").forEach(track => {
    const prop = track.dataset.prop;
    if (prop === "pathProgress") return;
    const keys = clip?.tracks?.[prop]?.keys || [];
    track.classList.toggle("selected", state.selectedTransformProperty === prop);
    track.querySelectorAll(".timelineKey").forEach(k => k.remove());

    keys.forEach((key, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `timelineKey ${index === state.selectedTransformKeyIndex && prop === state.selectedTransformProperty ? "selected" : ""}`;
      dot.style.left = `${timelinePercentFromTime(key.time, clip)}%`;
      dot.title = `${prop}: ${key.time} ms = ${key.value}`;
      dot.dataset.keyIndex = String(index);
      dot.dataset.prop = prop;

      dot.onclick = e => {
        e.stopPropagation();
        state.selectedTransformProperty = prop;
        state.selectedTransformKeyIndex = index;
        setAnimationTimelineTime(key.time);
        renderTransformAnimationEditor();
      };

      dot.onpointerdown = e => {
        e.preventDefault();
        e.stopPropagation();
        dot.setPointerCapture?.(e.pointerId);
        state.selectedTransformProperty = prop;
        state.selectedTransformKeyIndex = index;

        const move = ev => {
          const t = timelineTimeFromEvent(ev, track, clip);
          key.time = t;
          normalizeTransformClip(obj, clip);
          const movedKey = findTrackKeyAtTime(clip.tracks[prop], t, 1);
          selectTrackKey(clip, prop, movedKey);
          state.animationTimelineTime = t;
          updateAnimationPreview();
          renderAnimationTimeline();
        };

        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          renderTransformAnimationEditor();
        };

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      };

      track.appendChild(dot);
    });
  });

  let pathTrack = timeline.querySelector('.timelineTrack[data-prop="pathProgress"]');
  if (!pathTrack) {
    pathTrack = document.createElement("div");
    pathTrack.className = "timelineTrack pathTimelineTrack";
    pathTrack.dataset.prop = "pathProgress";
    pathTrack.innerHTML = `<span>Path %</span><div class="timelineRail"></div>`;
    const playhead = $("animationPlayhead");
    timeline.insertBefore(pathTrack, playhead || null);
    pathTrack.ondblclick = e => {
      if (e.target?.classList?.contains("timelineKey")) return;
      const t = timelineTimeFromEvent(e, pathTrack, clip);
      const path = normalizePathData(obj, clip);
      const progress = samplePathProgress(path, t, animationTimelineDuration(clip));
      upsertPathProgressKey(obj, clip, t, progress, $("pathProgressEasing")?.value || "linear");
      state.animationTimelineTime = t;
      renderTransformAnimationEditor();
    };
  }

  pathTrack.querySelectorAll(".timelineKey").forEach(k => k.remove());
  const path = normalizePathData(obj, clip);
  pathTrack.classList.toggle("selected", state.selectedAnimationTab === "path");
  (path.progressKeys || []).forEach((key, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `timelineKey pathKey ${index === selectedPathProgressKeyIndex() ? "selected" : ""}`;
    dot.style.left = `${timelinePercentFromTime(key.time, clip)}%`;
    dot.title = `Path: ${key.time} ms = ${Math.round(key.value * 100)}%`;
    dot.onclick = e => {
      e.stopPropagation();
      state.selectedAnimationTab = "path";
      state.selectedPathProgressKeyIndex = index;
      setAnimationTimelineTime(key.time);
      renderTransformAnimationEditor();
    };
    dot.onpointerdown = e => {
      e.preventDefault();
      e.stopPropagation();
      dot.setPointerCapture?.(e.pointerId);
      state.selectedAnimationTab = "path";
      state.selectedPathProgressKeyIndex = index;
      const move = ev => {
        key.time = timelineTimeFromEvent(ev, pathTrack, clip);
        normalizePathData(obj, clip);
        state.animationTimelineTime = key.time;
        updateAnimationPreview();
        renderAnimationTimeline();
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        renderTransformAnimationEditor();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
    pathTrack.appendChild(dot);
  });
}

function addTimelineKeyAt(prop, time) {
  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  if (!obj || !clip) return;

  const t = Math.max(0, Math.min(animationTimelineDuration(clip), Number(time) || 0));
  const sample = sampleTransformClip(obj, clip, t);
  const value = prop === "scale" ? sample.scale : prop === "rotation" ? sample.rotation : prop === "x" ? sample.x : sample.y;
  const key = upsertTrackKey(obj, clip, prop, t, value, $("transformKeyEasing")?.value || "linear");

  selectTrackKey(clip, prop, key);
  state.animationTimelineTime = key.time;
  renderTransformAnimationEditor();
}

function startTimelinePreview() {
  const obj = selectedAnimObject();
  const clip = selectedTransformClip();
  if (!obj || !clip) return;

  normalizeTransformClip(obj, clip);
  state.animationTimelinePlaying = true;
  state.animationTimelineTime = 0;

  const duration = animationTimelineDuration(clip);
  const start = performance.now();

  const tick = now => {
    if (!state.animationTimelinePlaying) return;
    const elapsed = now - start;

    if (clip.mode === "loop") {
      state.animationTimelineTime = elapsed % duration;
    } else if (clip.mode === "pingpong") {
      const cycle = Math.floor(elapsed / duration);
      const t = elapsed % duration;
      state.animationTimelineTime = cycle % 2 ? duration - t : t;
    } else {
      state.animationTimelineTime = Math.min(duration, elapsed);
    }

    updateAnimationPreview();
    renderAnimationTimeline();

    if (clip.mode === "once" && elapsed >= duration) {
      state.animationTimelinePlaying = false;
      return;
    }
    requestAnimationFrame(tick);
  };

  updateAnimationPreview();
  renderAnimationTimeline();
  requestAnimationFrame(tick);
}

function stopTimelinePreview(clearStageValue = true) {
  const obj = selectedAnimObject();
  state.animationTimelinePlaying = false;
  if (obj && clearStageValue) {
    delete obj._transformAnimValue;
    updateObjectElement(obj);
  }
  updateAnimationPreview();
  renderAnimationTimeline();
}

function bindTransformAnimationEditor() {
  if (!$("animationEditor")) return;

  if ($("animObjectSelect")) $("animObjectSelect").onchange = e => {
    state.selectedObjectId = e.target.value || state.selectedObjectId;
    state.selectedPanel = "object";
    state.selectedTransformClipId = null;
    state.selectedTransformProperty = "x";
    state.selectedTransformKeyIndex = 0;
    renderAll();
  };

  if ($("addTransformClipBtn")) $("addTransformClipBtn").onclick = () => {
    const obj = selectedAnimObject();
    if (!obj) return alert("Selecciona un objeto.");
    state.selectedObjectId = obj.id;
    state.selectedPanel = "object";
    const clip = makeTransformClip(obj);
    state.selectedTransformClipId = clip.id;
    state.selectedTransformProperty = "x";
    state.selectedTransformKeyIndex = 0;
    state.animationTimelineTime = 0;
    renderAll();
    renderTransformAnimationEditor();
  };

  if ($("deleteTransformClipBtn")) $("deleteTransformClipBtn").onclick = () => {
    const obj = selectedAnimObject();
    const clip = selectedTransformClip();
    if (!obj || !clip) return;
    if (!confirm(`¿Eliminar el clip "${clip.name}"?`)) return;
    obj.transformClips = obj.transformClips.filter(c => c.id !== clip.id);
    state.selectedTransformClipId = obj.transformClips[0]?.id || null;
    state.selectedTransformProperty = "x";
    state.selectedTransformKeyIndex = 0;
    renderAll();
  };

  if ($("previewTransformClipBtn")) $("previewTransformClipBtn").onclick = startTimelinePreview;
  if ($("stopTransformClipBtn")) $("stopTransformClipBtn").onclick = () => stopTimelinePreview(true);

  if ($("transformAnimTabBtn")) $("transformAnimTabBtn").onclick = () => setAnimationTab("transform");
  if ($("pathAnimTabBtn")) $("pathAnimTabBtn").onclick = () => setAnimationTab("path");
  if ($("pathEditPointsBtn")) $("pathEditPointsBtn").onclick = () => { setPathDrawMode("points"); renderPathSceneCanvas(); };
  if ($("pathPencilModeBtn")) $("pathPencilModeBtn").onclick = () => { setPathDrawMode("pencil"); renderPathSceneCanvas(); };

  if ($("pathEnabled")) $("pathEnabled").onchange = e => {
    const path = selectedPathData();
    if (!path) return;
    path.enabled = e.target.checked;
    renderPathEditor();
    renderStage();
    updateAnimationPreview();
  };

  if ($("pathOrient")) $("pathOrient").onchange = e => {
    const path = selectedPathData();
    if (!path) return;
    path.orientToPath = e.target.checked;
    renderPathEditor();
    updateAnimationPreview();
  };

  if ($("pathClosed")) $("pathClosed").onchange = e => {
    const path = selectedPathData();
    if (!path) return;
    path.closed = e.target.checked;
    renderPathEditor();
    renderStage();
    updateAnimationPreview();
  };

  if ($("pathRotationOffset")) $("pathRotationOffset").oninput = e => {
    const path = selectedPathData();
    if (!path) return;
    path.rotationOffset = Number(e.target.value || 0);
    updateAnimationPreview();
  };

  if ($("pathCycleDuration")) $("pathCycleDuration").onchange = e => {
    const obj = selectedAnimObject();
    const clip = selectedTransformClip();
    if (!obj || !clip) return;
    fitPathProgressToDuration(obj, clip, Number(e.target.value || 1000));
    renderTransformAnimationEditor();
    updateAnimationPreview();
  };

  if ($("pathProgressValue")) $("pathProgressValue").oninput = e => {
    const obj = selectedAnimObject();
    const clip = selectedTransformClip();
    if (!obj || !clip) return;
    upsertPathProgressKey(obj, clip, state.animationTimelineTime || 0, Number(e.target.value || 0) / 100, $("pathProgressEasing")?.value || "linear");
    renderPathEditor();
    renderAnimationTimeline();
    updateAnimationPreview();
  };

  if ($("pathProgressEasing")) $("pathProgressEasing").onchange = e => {
    const path = selectedPathData();
    if (!path) return;
    const key = path.progressKeys[selectedPathProgressKeyIndex()];
    if (key) key.easing = e.target.value || "linear";
    renderPathEditor();
  };

  if ($("addPathPointBtn")) $("addPathPointBtn").onclick = () => {
    const path = selectedPathData();
    const obj = selectedAnimObject();
    if (!path || !obj) return;
    const last = path.points[path.points.length - 1] || { x: obj.x, y: obj.y };
    path.points.push({ id: uid(), x: last.x + 120, y: last.y });
    state.selectedPathPointIndex = path.points.length - 1;
    renderPathEditor();
    renderStage();
  };

  if ($("deletePathPointBtn")) $("deletePathPointBtn").onclick = () => {
    const path = selectedPathData();
    if (!path || path.points.length <= 1) return;
    path.points.splice(selectedPathPointIndex(), 1);
    state.selectedPathPointIndex = Math.max(0, Math.min(selectedPathPointIndex(), path.points.length - 1));
    renderPathEditor();
    renderStage();
  };

  if ($("reversePathBtn")) $("reversePathBtn").onclick = () => {
    const path = selectedPathData();
    if (!path) return;
    path.points.reverse();
    state.selectedPathPointIndex = Math.max(0, path.points.length - 1 - selectedPathPointIndex());
    renderPathEditor();
    renderStage();
    updateAnimationPreview();
  };

  if ($("addPathProgressKeyBtn")) $("addPathProgressKeyBtn").onclick = () => {
    const obj = selectedAnimObject();
    const clip = selectedTransformClip();
    if (!obj || !clip) return;
    const path = normalizePathData(obj, clip);
    const progress = $("pathProgressValue") ? Number($("pathProgressValue").value || 0) / 100 : samplePathProgress(path, state.animationTimelineTime || 0, animationTimelineDuration(clip));
    upsertPathProgressKey(obj, clip, state.animationTimelineTime || 0, progress, $("pathProgressEasing")?.value || "linear");
    renderPathEditor();
    renderAnimationTimeline();
  };

  if ($("deletePathProgressKeyBtn")) $("deletePathProgressKeyBtn").onclick = () => {
    const path = selectedPathData();
    if (!path || path.progressKeys.length <= 1) return;
    path.progressKeys.splice(selectedPathProgressKeyIndex(), 1);
    state.selectedPathProgressKeyIndex = Math.max(0, Math.min(selectedPathProgressKeyIndex(), path.progressKeys.length - 1));
    renderPathEditor();
    renderAnimationTimeline();
  };


  [["transformClipName","name"],["transformClipDuration","duration"],["transformClipMode","mode"]].forEach(([id, field]) => {
    if ($(id)) $(id).oninput = e => updateCurrentTransformClip(field, e.target.value);
    if ($(id) && id === "transformClipMode") $(id).onchange = e => updateCurrentTransformClip(field, e.target.value);
  });

  [["transformKeyTime","time"],["transformKeyX","x"],["transformKeyY","y"],["transformKeyRotation","rotation"],["transformKeyScale","scale"]].forEach(([id, field]) => {
    if ($(id)) $(id).oninput = e => updateSelectedTransformKey(field, e.target.value);
  });
  if ($("transformKeyEasing")) $("transformKeyEasing").onchange = e => updateSelectedTransformKey("easing", e.target.value);

  if ($("addTransformKeyBtn")) $("addTransformKeyBtn").onclick = () => {
    const obj = selectedAnimObject();
    const clip = selectedTransformClip();
    if (!obj || !clip) return;
    const t = Math.max(0, Math.min(animationTimelineDuration(clip), Number(state.animationTimelineTime || 0)));
    const sample = sampleTransformClip(obj, clip, t);
    const prop = state.selectedTransformProperty || "x";
    const value = prop === "scale" ? sample.scale : prop === "rotation" ? sample.rotation : prop === "x" ? sample.x : sample.y;
    const key = upsertTrackKey(obj, clip, prop, t, value, $("transformKeyEasing").value || "linear");
    selectTrackKey(clip, prop, key);
    state.animationTimelineTime = key.time;
    renderTransformAnimationEditor();
  };

  if ($("insertFullTransformKeyBtn")) $("insertFullTransformKeyBtn").onclick = () => {
    const obj = selectedAnimObject();
    const clip = selectedTransformClip();
    if (!obj || !clip) return;
    const t = Math.max(0, Math.min(animationTimelineDuration(clip), Number(state.animationTimelineTime || 0)));
    upsertTransformKeysAtTime(obj, clip, t, {
      x: Number($("transformKeyX").value || sampleTransformClip(obj, clip, t).x),
      y: Number($("transformKeyY").value || sampleTransformClip(obj, clip, t).y),
      rotation: Number($("transformKeyRotation").value || 0),
      scale: Number($("transformKeyScale").value || 1)
    }, $("transformKeyEasing").value || "linear");
    state.selectedTransformProperty = "rotation";
    state.selectedTransformKeyIndex = (clip.tracks.rotation.keys || []).findIndex(k => Math.abs(k.time - t) <= 1);
    state.animationTimelineTime = t;
    renderTransformAnimationEditor();
  };

  if ($("captureTransformKeyBtn")) $("captureTransformKeyBtn").onclick = () => {
    const obj = selectedAnimObject();
    const clip = selectedTransformClip();
    if (!obj || !clip) return;
    const t = Math.max(0, Math.min(animationTimelineDuration(clip), Number(state.animationTimelineTime || 0)));
    upsertTransformKeysAtTime(obj, clip, t, {
      x: obj.x,
      y: obj.y,
      rotation: obj.rotation || 0,
      scale: obj.scale || 1
    }, $("transformKeyEasing").value || "linear");
    renderTransformAnimationEditor();
  };

  if ($("deleteTransformKeyBtn")) $("deleteTransformKeyBtn").onclick = () => {
    const obj = selectedAnimObject();
    const clip = selectedTransformClip();
    const prop = state.selectedTransformProperty || "x";
    if (!obj || !clip) return;
    const keys = trackKeys(obj, clip, prop);
    const i = Math.max(0, Math.min(keys.length - 1, Number(state.selectedTransformKeyIndex || 0)));
    if (!keys[i]) return;
    keys.splice(i, 1);
    normalizeTransformClip(obj, clip);
    state.selectedTransformKeyIndex = Math.max(0, i - 1);
    renderTransformAnimationEditor();
  };

  if ($("animationTimelineScrub")) $("animationTimelineScrub").oninput = e => setAnimationTimelineTime(e.target.value);
  if ($("animationPrevKeyBtn")) $("animationPrevKeyBtn").onclick = () => jumpAnimationKey(-1);
  if ($("animationTimelinePlayBtn")) $("animationTimelinePlayBtn").onclick = startTimelinePreview;
  if ($("animationTimelineStopBtn")) $("animationTimelineStopBtn").onclick = () => stopTimelinePreview(true);
  if ($("animationNextKeyBtn")) $("animationNextKeyBtn").onclick = () => jumpAnimationKey(1);

  const lane = $("animationScrubLane");
  if (lane) {
    lane.onpointerdown = e => {
      if (!selectedTransformClip()) return;
      e.preventDefault();
      $("animationTimeline")?.classList.add("scrubbing");
      state.animationTimelinePlaying = false;
      scrubTimelineFromEvent(e);
      const move = ev => scrubTimelineFromEvent(ev);
      const up = () => {
        $("animationTimeline")?.classList.remove("scrubbing");
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    };
  }

  document.querySelectorAll(".timelineTrack").forEach(track => {
    track.ondblclick = e => {
      if (e.target?.classList?.contains("timelineKey")) return;
      const clip = selectedTransformClip();
      if (!clip) return;
      addTimelineKeyAt(track.dataset.prop || "x", timelineTimeFromEvent(e, track, clip));
    };
  });
}
